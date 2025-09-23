# backend/app/routes/mercadopago_bp.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
import mercadopago
import os
from datetime import datetime
from ..models import Order, OrderItem, Product, User
from ..database import db

mercadopago_bp = Blueprint('mercadopago', __name__)

# =========================================================
#  CREDENCIALES MP POR ENTORNO (cambiar SOLO APP_ENV en deploy)
# =========================================================
def get_mp_creds():
    """
    DEV/Testing -> usa TEST
    PROD -> usa PROD
    Elegimos en base a APP_ENV (o FLASK_ENV si no está APP_ENV).
    Cambiá APP_ENV=production al desplegar y listo.
    """
    env = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()

    if env == "production":
        # 👇 Claves del CLIENTE en PRODUCCIÓN (configuradas en el servidor)
        access_token = os.getenv("MP_ACCESS_TOKEN_PROD")   # ej: APP_USR-xxxxxxxxx
        public_key   = os.getenv("MP_PUBLIC_KEY_PROD")     # ej: APP_USR-xxxxxxxxx
    else:
        # 👇 Claves de PRUEBA para desarrollo
        access_token = os.getenv("MP_ACCESS_TOKEN_TEST")   # ej: TEST-xxxxxxxxx
        public_key   = os.getenv("MP_PUBLIC_KEY_TEST")     # ej: TEST-xxxxxxxxx

    if not access_token:
        raise RuntimeError("Falta configurar Access Token de MP (MP_ACCESS_TOKEN_*).")

    return access_token, public_key


def get_mp_sdk():
    at, _ = get_mp_creds()
    return mercadopago.SDK(at)


# =========================================================
#  CREAR PREFERENCIA
# =========================================================
@mercadopago_bp.route('/create-preference', methods=['POST'])
def create_preference():
    """Crear preferencia de pago en MercadoPago (JWT opcional)"""
    try:
        # JWT opcional
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            user_id = None

        data = request.get_json() or {}
        print("=== INICIO CREATE PREFERENCE ===")
        print(f"User ID: {user_id}")
        print(f"Request data: {data}")

        # Validaciones mínimas
        if not data.get('items'):
            return jsonify({'error': 'Items requeridos'}), 400
        if not (data.get('payer') and data['payer'].get('email')):
            return jsonify({'error': 'Email del payer es requerido'}), 400

        # Normalización de items
        items = []
        for it in data['items']:
            if not all(k in it for k in ['title', 'quantity', 'unit_price']):
                return jsonify({'error': 'Items con formato incorrecto'}), 400
            qty = int(it.get('quantity', 1) or 1)
            price = float(it.get('unit_price', 0) or 0)
            if price <= 0:
                return jsonify({'error': 'unit_price debe ser > 0'}), 400
            items.append({
                "id": str(it.get("id") or it.get("sku") or "item"),
                "title": str(it["title"]),
                "quantity": qty,
                "unit_price": price,
                "currency_id": "ARS",
            })

        print(f"Items validados/normalizados: {items}")

        # URLs del front/back
        frontend_url   = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
        backend_public = os.getenv('BACKEND_PUBLIC_URL', '').rstrip('/')

        # Armamos payer (solo email obligatorio)
        payer_in = data.get('payer', {}) or {}
        payer_out = {"email": payer_in.get("email")}
        if payer_in.get("name"): payer_out["name"] = payer_in["name"]
        if payer_in.get("surname"): payer_out["surname"] = payer_in["surname"]
        if payer_in.get("identification"):
            pid = payer_in["identification"]
            if pid.get("type") and pid.get("number"):
                payer_out["identification"] = {"type": pid["type"], "number": str(pid["number"])}
        if payer_in.get("phone"):
            pp = payer_in["phone"]
            payer_out["phone"] = {"area_code": str(pp.get("area_code", "")), "number": str(pp.get("number", ""))}
        if payer_in.get("address"):
            pa = payer_in["address"]
            payer_out["address"] = {"street_name": str(pa.get("street_name", "")), "zip_code": str(pa.get("zip_code", ""))}

        # En LOCAL (localhost/127.0.0.1) NO mandamos auto_return (evita 400 invalid_auto_return)
        is_local = ("localhost" in frontend_url) or ("127.0.0.1" in frontend_url)

        preference_data = {
            "items": items,
            "payer": payer_out,
            "binary_mode": True,
            # "external_reference": str(user_id or ""),  # opcional
        }

        # back_urls siempre ayudan (aunque en local MP no pueda volver)
        preference_data["back_urls"] = {
            "success": f"{frontend_url}/pago/exitoso",
            "failure": f"{frontend_url}/pago/fallido",
            "pending": f"{frontend_url}/pago/pendiente",
        }

        # Solo en dominio público/producción habilitamos auto_return
        if not is_local:
            preference_data["auto_return"] = "approved"

        # Webhook si tenés URL pública
        if backend_public:
            preference_data["notification_url"] = f"{backend_public}/api/mercadopago/webhook"

        print(f"Preference data final: {preference_data}")

        # Crear preferencia
        sdk = get_mp_sdk()
        print("SDK inicializado correctamente")
        preference_response = sdk.preference().create(preference_data)
        print(f"MP Response completa: {preference_response}")

        if preference_response.get("status") == 201:
            preference = preference_response["response"]
            print("SUCCESS: Preferencia creada exitosamente")
            return jsonify({
                'preference_id': preference['id'],
                'init_point': preference['init_point'],
                'sandbox_init_point': preference.get('sandbox_init_point', preference['init_point'])
            }), 201

        # Manejo de error legible
        status = preference_response.get('status', 400)
        error_details = preference_response.get('response', {}) or {}
        cause_list = error_details.get('cause') or []
        cause_texts = []
        for c in cause_list or []:
            desc = c.get('description') or c.get('message') or str(c)
            if desc: cause_texts.append(desc)
        human_reason = " | ".join(cause_texts) if cause_texts else (error_details.get('message') or "Bad request")

        print(f"ERROR MP: Status {status}")
        print(f"Error details: {error_details}")

        return jsonify({
            'error': f'Error creando preferencia en MercadoPago (Status: {status})',
            'reason': human_reason,
            'details': error_details,
            'mp_response': preference_response
        }), status

    except RuntimeError as e:
        print(f"Config error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        import traceback
        print(f"EXCEPCIÓN en create_preference: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Error interno del servidor', 'details': str(e)}), 500

# =========================================================
#  WEBHOOK
# =========================================================
@mercadopago_bp.route('/webhook', methods=['POST'])
def webhook():
    """Webhook para notificaciones de MercadoPago"""
    try:
        data = request.get_json()
        print(f"Webhook recibido: {data}")

        # Verificar que sea una notificación de pago
        if data.get('type') == 'payment':
            payment_id = data.get('data', {}).get('id')

            if payment_id:
                # Obtener información del pago
                sdk = get_mp_sdk()
                payment_response = sdk.payment().get(payment_id)
                payment = payment_response.get("response")

                if payment_response.get("status") == 200 and payment:
                    # Procesar el pago según su estado
                    status = payment.get('status')
                    external_reference = payment.get('external_reference')
                    print(f"Payment {payment_id} status: {status}")

                    if status == 'approved':
                        # Pago aprobado - crear orden en la base de datos
                        create_order_from_payment(payment)

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return jsonify({'error': 'Error procesando webhook'}), 500


def create_order_from_payment(payment_data):
    """Crear orden en la base de datos desde un pago aprobado"""
    try:
        external_reference = payment_data.get('external_reference', '')
        payer_email = payment_data.get('payer', {}).get('email')

        # Buscar usuario por email (opcional)
        user = User.query.filter_by(email=payer_email).first()

        # Crear nueva orden
        order = Order(
            user_id=user.id if user else None,
            total_amount=payment_data.get('transaction_amount', 0),
            status='paid',
            payment_method='mercadopago',
            payment_id=str(payment_data.get('id')),
            external_reference=external_reference,
            customer_email=payer_email,
            customer_name=f"{payment_data.get('payer', {}).get('first_name', '')} {payment_data.get('payer', {}).get('last_name', '')}".strip(),
            shipping_address=payment_data.get('payer', {}).get('address', {}).get('street_name', ''),
            created_at=datetime.utcnow()
        )

        db.session.add(order)
        db.session.commit()

        print(f"Order created successfully: {order.id}")

    except Exception as e:
        print(f"Error creating order: {str(e)}")
        db.session.rollback()


# =========================================================
#  CONSULTAR UN PAGO
# =========================================================
@mercadopago_bp.route('/payment/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Obtener información de un pago específico"""
    try:
        sdk = get_mp_sdk()
        payment_response = sdk.payment().get(payment_id)

        if payment_response.get("status") == 200:
            return jsonify(payment_response["response"]), 200
        else:
            return jsonify({'error': 'Pago no encontrado'}), 404

    except Exception as e:
        print(f"Error getting payment: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500
