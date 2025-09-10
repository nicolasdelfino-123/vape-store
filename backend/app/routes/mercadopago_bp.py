# backend/app/routes/mercadopago_bp.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
import mercadopago
import os
from datetime import datetime
from ..models import Order, OrderItem, Product, User
from ..database import db

mercadopago_bp = Blueprint('mercadopago', __name__)

def get_mp_sdk():
    """Obtener SDK de MercadoPago correctamente (usa TEST en dev)"""
    access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
    if not access_token:
        # No levantes excepción genérica: devolvemos mensaje claro al caller
        raise RuntimeError("MERCADOPAGO_ACCESS_TOKEN no configurado en .env")
    return mercadopago.SDK(access_token)


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

        # Normalización de items (evita 422)
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
                "currency_id": "ARS",  # fuerza ARS y evitás rechazos por currency
            })

        print(f"Items validados/normalizados: {items}")

        # back_urls coherentes con tu front
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        preference_data = {
            "items": items,
            "payer": {
                "email": data['payer']['email']
            }
        }

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

        # Si no es 201, devolvemos el error crudo para que lo veas en el alert
        status = preference_response.get('status', 400)
        error_details = preference_response.get('response', {})
        print(f"ERROR MP: Status {status}")
        print(f"Error response completo: {preference_response}")
        print(f"Error details: {error_details}")
        
        return jsonify({
            'error': f'Error creando preferencia en MercadoPago (Status: {status})',
            'details': error_details,
            'mp_response': preference_response
        }), status

    except RuntimeError as e:
        # Error de config (tokens)
        print(f"Config error: {str(e)}")
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        import traceback
        print(f"EXCEPCIÓN en create_preference: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Error interno del servidor', 'details': str(e)}), 500


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
                payment = payment_response["response"]
                
                if payment_response["status"] == 200:
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
        
        # Buscar usuario por email
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

@mercadopago_bp.route('/payment/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Obtener información de un pago específico"""
    try:
        sdk = get_mp_sdk()
        payment_response = sdk.payment().get(payment_id)
        
        if payment_response["status"] == 200:
            return jsonify(payment_response["response"]), 200
        else:
            return jsonify({'error': 'Pago no encontrado'}), 404
            
    except Exception as e:
        print(f"Error getting payment: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500