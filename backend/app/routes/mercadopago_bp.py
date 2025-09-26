# backend/app/routes/mercadopago_bp.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
import mercadopago
import os
from datetime import datetime
from ..models import Order, OrderItem, Product, User
from ..database import db
from flask import current_app


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

        # referencia propia para trazar (si tenés user_id úsalo; si no, timestamp)
        external_ref = str(user_id or int(datetime.utcnow().timestamp()))

        preference_data = {
            "items": items,
            "payer": payer_out,
            "binary_mode": True,
            "external_reference": external_ref,
            # 👇 Enviamos los items también en additional_info
            "additional_info": {
                "items": [
                    {
                        "id": it["id"],
                        "title": it["title"],
                        "quantity": it["quantity"],
                        "unit_price": it["unit_price"]
                    } for it in items
                ]
            },
        }

        # back_urls (MP te redirige con ?status=approved|pending|failure)
        preference_data["back_urls"] = {
            "success": f"{frontend_url}/thank-you?status=approved",
            "failure": f"{frontend_url}/thank-you?status=failure", 
            "pending": f"{frontend_url}/thank-you?status=pending",
        }

        # Solo en dominio público/producción habilitamos auto_return
        if not is_local:
            preference_data["auto_return"] = "approved"

        # 🔥 WEBHOOK CON PROXY: usa /api porque Vite redirige al backend
        if backend_public:
            preference_data["notification_url"] = f"{backend_public}/api/mercadopago/webhook"
            print(f"✅ Webhook configurado: {preference_data['notification_url']}")

        print(f"Preference data final: {preference_data}")

        # Crear preferencia
        sdk = get_mp_sdk()
        print("SDK inicializado correctamente")
        
        # Si es local y tenés un túnel (por ejemplo ngrok), podés definir BACKEND_PUBLIC_URL en .env
        dev_tunnel = os.getenv('BACKEND_PUBLIC_URL', '').rstrip('/')
        if is_local and dev_tunnel:
            # 👉 permite testear redirección en localhost con túnel
            preference_data["auto_return"] = "approved"
            # fuerza back_urls con el túnel (no solo localhost)
            preference_data["back_urls"] = {
                "success": f"{dev_tunnel}/thank-you?status=approved",
                "failure": f"{dev_tunnel}/thank-you?status=failure",
                "pending": f"{dev_tunnel}/thank-you?status=pending",
            }
            
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
@mercadopago_bp.route('/webhook', methods=['POST', 'GET'])
def webhook():
    """Webhook para notificaciones de MercadoPago"""
    try:
        # MP puede enviar data por query params o JSON body
        data = request.get_json() or {}
        payment_id = data.get('data', {}).get('id') or request.args.get('data.id') or request.args.get('id')
        notification_type = data.get('type') or request.args.get('type') or request.args.get('topic')
        
        print(f"📥 WEBHOOK RECIBIDO")
        print(f"   Query params: {dict(request.args)}")
        print(f"   Payment ID: {payment_id}")
        print(f"   Type: {notification_type}")

        # Solo procesar tipo 'payment'
        if notification_type == 'payment' and payment_id:
            print(f"💳 Consultando pago {payment_id}...")
            
            sdk = get_mp_sdk()
            payment_response = sdk.payment().get(payment_id)
            
            if payment_response.get("status") == 200:
                payment = payment_response.get("response")
                print(f"✅ Pago obtenido: Status={payment.get('status')}")
                
                if payment.get('status') == 'approved':
                    # 🔥 SOLUCIÓN: Ejecutar en background sin app_context
                    create_order_from_payment(payment)
            else:
                print(f"❌ Error consultando pago: {payment_response}")
        else:
            print(f"⚠️ Webhook ignorado (type={notification_type})")

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        import traceback
        print(f"💥 ERROR EN WEBHOOK: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@mercadopago_bp.route('/auto-login/<payment_id>', methods=['POST'])
def auto_login_by_payment(payment_id):
    """Auto-login temporal después de pago exitoso"""
    try:
        from flask_jwt_extended import create_access_token
        from datetime import timedelta
        
        print(f"🔐 Intentando auto-login para payment_id: {payment_id}")
        
        # Buscar orden por payment_id
        order = Order.query.filter_by(payment_id=str(payment_id)).first()
        
        if not order:
            print(f"❌ Orden no encontrada para payment_id: {payment_id}")
            return jsonify({'error': 'Orden no encontrada'}), 404
        
        if not order.user_id:
            print(f"❌ Orden {order.id} sin user_id")
            return jsonify({'error': 'Usuario no asociado'}), 404
        
        # Generar token temporal (1 hora)
        token = create_access_token(
            identity=str(order.user_id),  # 👈 evitar 422: 'sub' debe ser string
            expires_delta=timedelta(hours=1)
        )

        
        user = User.query.get(order.user_id)
        
        print(f"✅ Token generado para usuario {user.id} ({user.email})")
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 200
        
    except Exception as e:
        import traceback
        print(f"💥 Error en auto_login: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    


def create_order_from_payment(payment_data):
    """Crear orden + items y descontar stock - VERSIÓN QUE FUNCIONA"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Crear sesión independiente
    engine = create_engine(os.getenv('SQLALCHEMY_DATABASE_URI'))
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        payment_id = str(payment_data.get('id'))
        if payment_data.get('status') != 'approved':
            return

        # Idempotencia
        if session.query(Order).filter_by(payment_id=payment_id).first():
            return

        payer = payment_data.get('payer') or {}
        payer_email = payer.get('email')
        full_name = f"{payer.get('first_name', '')} {payer.get('last_name', '')}".strip() or 'Cliente'
        mp_address = (payer.get('address') or {}).get('street_name', 'Retiro en tienda')

        # Usuario
        user = session.query(User).filter_by(email=payer_email).first()
        if not user and payer_email:
            from werkzeug.security import generate_password_hash
            user = User(
                email=payer_email,
                password=generate_password_hash('temp123'),  # Hash más corto
                name=full_name,
                shipping_address={"address": mp_address},
                is_active=True
            )
            session.add(user)
            session.flush()
            print(f"👤 Usuario: {user.email} (ID: {user.id})")

        # Orden
        order = Order(
            user_id=user.id if user else None,
            total_amount=float(payment_data.get('transaction_amount', 0)),
            status='paid',
            payment_method='mercadopago',
            payment_id=payment_id,
            external_reference=payment_data.get('external_reference', ''),
            customer_email=payer_email or '',
            customer_name=full_name,
            shipping_address=mp_address,
            created_at=datetime.utcnow()
        )
        session.add(order)
        session.flush()
        print(f"📦 Orden #{order.id}")

        # Items
        items = (payment_data.get("additional_info") or {}).get("items") or []
        for it in items:
            if not str(it.get("id", "")).isdigit():
                continue
            
            pid = int(it["id"])
            qty = int(it.get("quantity", 1))
            
            session.add(OrderItem(
                order_id=order.id,
                product_id=pid,
                quantity=qty,
                price=float(it.get("unit_price", 0))
            ))
            
            product = session.query(Product).get(pid)
            if product:
                product.stock = max(0, (product.stock or 0) - qty)
                print(f"  Stock #{pid}: {product.stock}")

        session.commit()
        print(f"✅ Orden #{order.id} OK")

    except Exception as e:
        session.rollback()
        print(f"💥 {e}")
    finally:
        session.close()

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
