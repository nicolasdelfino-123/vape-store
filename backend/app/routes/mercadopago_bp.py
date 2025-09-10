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
    """Obtener SDK de MercadoPago correctamente"""
    access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
    if not access_token:
        raise RuntimeError("MERCADOPAGO_ACCESS_TOKEN no configurado en .env")
    return mercadopago.SDK(access_token)


@mercadopago_bp.route('/create-preference', methods=['POST'])
def create_preference():
    """Crear preferencia de pago en MercadoPago (JWT opcional)"""
    try:
        print("=== INICIO CREATE PREFERENCE ===")

        # JWT opcional: si hay token válido, tomamos el user_id; si no, seguimos como invitado
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            user_id = None

        data = request.get_json() or {}
        print(f"User ID: {user_id}")
        print(f"Request data: {data}")

        # Validar datos requeridos
        if not data.get('items') or not data.get('payer'):
            print("ERROR: Items y payer son requeridos")
            return jsonify({'error': 'Items y payer son requeridos'}), 400

        # Validar estructura mínima de items
        items = data['items']
        for item in items:
            if not all(k in item for k in ['id', 'title', 'quantity', 'unit_price']):
                return jsonify({'error': 'Items con formato incorrecto'}), 400

        # Normalizar items (evita 422 por tipos o precios inválidos)
        for it in items:
            it['quantity'] = int(it.get('quantity', 1) or 1)
            it['unit_price'] = float(it.get('unit_price', 0) or 0)
            if it['unit_price'] <= 0:
                return jsonify({'error': 'unit_price debe ser > 0'}), 400

        print(f"Items validados/normalizados: {items}")
        print(f"Payer: {data.get('payer')}")

        # URL base para back_urls (no hardcodear localhost)
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5174')

        # Construir preferencia
        preference_data = {
            "items": items,
            "payer": {
                "name": data['payer'].get('name', ''),
                "surname": data['payer'].get('surname', ''),
                "email": data['payer']['email']
            },
            "back_urls": {
                "success": f"{frontend_url}/checkout/success",
                "failure": f"{frontend_url}/checkout/failure",
                "pending": f"{frontend_url}/checkout/pending"
            },
            "auto_return": "approved"
        }

        print(f"Preference data final: {preference_data}")

        # Crear preferencia en MP
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

        print(f"ERROR MP: Status {preference_response.get('status')}")
        print(f"Error details: {preference_response}")
        return jsonify({
            'error': 'Error creando preferencia en MercadoPago',
            'details': preference_response
        }), 400

    except Exception as e:
        print(f"EXCEPCIÓN en create_preference: {str(e)}")
        print(f"Tipo de error: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

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