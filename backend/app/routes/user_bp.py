from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User, Product, CartItem, Order, OrderItem
from datetime import timedelta


user_bp = Blueprint('user', __name__)


# RUTA CREAR USUARIO
@user_bp.route('/signup', methods=['POST'])
def create_user():
    try:
        email = request.json.get('email')
        password = request.json.get('password')
        name = request.json.get('name')

        if not email or not password or not name:
            return jsonify({'error': 'Email, password y nombre son necesarios'}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Este email ya esta en uso.'}), 409

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        new_user = User(email=email, password=password_hash, name=name)


        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User created successfully.','user_created':new_user.serialize()}), 201

    except Exception as e:
        return jsonify({'error': 'Error in user creation: ' + str(e)}), 500


#RUTA LOG-IN ( CON TOKEN DE RESPUESTA )
@user_bp.route('/login', methods=['POST'])
def get_token():
    try:

        email = request.json.get('email')
        password = request.json.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required.'}), 400
        
        login_user = User.query.filter_by(email=email).first()

        if not login_user:
            return jsonify({'error': 'El email proporcionado no corresponde a ninguno registrado'}), 404

        password_from_db = login_user.password
        true_o_false = bcrypt.check_password_hash(password_from_db, password)
        
        if true_o_false:
            expires = timedelta(minutes=30)

            user_id = login_user.id
            role = login_user.role
            additional_claims = { "role": role}

            access_token = create_access_token(identity=str(user_id), additional_claims=additional_claims, expires_delta=expires)
            return jsonify({ 'access_token':access_token, 'role': role}), 200

        else:
            return {"Error":"Contraseña  incorrecta"}, 401
    
    except Exception as e:
        return {"Error":"El email proporcionado no corresponde a ninguno registrado: " + str(e)}, 500
    
    
@user_bp.route('/users')
@jwt_required()
def show_users():
    current_user_id = get_jwt_identity()
    if current_user_id:
        users = User.query.all()
        user_list = []
        for user in users:
            user_dict = {
                'id': user.id,
                'email': user.email
            }
            user_list.append(user_dict)
        return jsonify(user_list), 200
    else:
        return {"Error": "Token inválido o no proporcionado"}, 401


# === RUTAS PARA CARRITO DE COMPRAS ===

@user_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    """Obtener carrito del usuario"""
    try:
        current_user_id = get_jwt_identity()
        cart_items = CartItem.query.filter_by(user_id=current_user_id).all()
        
        return jsonify([item.serialize() for item in cart_items]), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener carrito: ' + str(e)}), 500

@user_bp.route('/cart', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Agregar producto al carrito"""
    try:
        current_user_id = get_jwt_identity()
        product_id = request.json.get('product_id')
        quantity = request.json.get('quantity', 1)
        
        if not product_id:
            return jsonify({'error': 'ID del producto es requerido'}), 400
            
        # Verificar que el producto existe
        product = Product.query.get(product_id)
        if not product or not product.is_active:
            return jsonify({'error': 'Producto no encontrado'}), 404
            
        # Verificar stock
        if product.stock < quantity:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Verificar si ya existe en el carrito
        existing_item = CartItem.query.filter_by(
            user_id=current_user_id, 
            product_id=product_id
        ).first()
        
        if existing_item:
            # Actualizar cantidad
            new_quantity = existing_item.quantity + quantity
            if product.stock < new_quantity:
                return jsonify({'error': 'Stock insuficiente'}), 400
            existing_item.quantity = new_quantity
        else:
            # Crear nuevo item
            cart_item = CartItem(
                user_id=current_user_id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(cart_item)
        
        db.session.commit()
        return jsonify({'message': 'Producto agregado al carrito'}), 201
        
    except Exception as e:
        return jsonify({'error': 'Error al agregar al carrito: ' + str(e)}), 500

@user_bp.route('/cart/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """Actualizar cantidad de un item del carrito"""
    try:
        current_user_id = get_jwt_identity()
        quantity = request.json.get('quantity')
        
        if not quantity or quantity <= 0:
            return jsonify({'error': 'Cantidad debe ser mayor a 0'}), 400
            
        cart_item = CartItem.query.filter_by(
            id=item_id, 
            user_id=current_user_id
        ).first()
        
        if not cart_item:
            return jsonify({'error': 'Item del carrito no encontrado'}), 404
            
        # Verificar stock
        if cart_item.product.stock < quantity:
            return jsonify({'error': 'Stock insuficiente'}), 400
            
        cart_item.quantity = quantity
        db.session.commit()
        
        return jsonify({'message': 'Carrito actualizado'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al actualizar carrito: ' + str(e)}), 500

@user_bp.route('/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Eliminar item del carrito"""
    try:
        current_user_id = get_jwt_identity()
        
        cart_item = CartItem.query.filter_by(
            id=item_id, 
            user_id=current_user_id
        ).first()
        
        if not cart_item:
            return jsonify({'error': 'Item del carrito no encontrado'}), 404
            
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify({'message': 'Item eliminado del carrito'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al eliminar del carrito: ' + str(e)}), 500

@user_bp.route('/cart/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Vaciar carrito completo"""
    try:
        current_user_id = get_jwt_identity()
        
        CartItem.query.filter_by(user_id=current_user_id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Carrito vaciado'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al vaciar carrito: ' + str(e)}), 500


# === RUTAS PARA ÓRDENES ===

@user_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """Obtener órdenes del usuario"""
    try:
        current_user_id = get_jwt_identity()
        orders = Order.query.filter_by(user_id=current_user_id).order_by(Order.created_at.desc()).all()
        
        return jsonify([order.serialize() for order in orders]), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener órdenes: ' + str(e)}), 500

@user_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    """Crear nueva orden desde el carrito"""
    try:
        current_user_id = get_jwt_identity()
        shipping_address = request.json.get('shipping_address')
        payment_method = request.json.get('payment_method')
        
        if not shipping_address or not payment_method:
            return jsonify({'error': 'Dirección de envío y método de pago son requeridos'}), 400
        
        # Obtener items del carrito
        cart_items = CartItem.query.filter_by(user_id=current_user_id).all()
        
        if not cart_items:
            return jsonify({'error': 'El carrito está vacío'}), 400
        
        # Verificar stock y calcular total
        total_amount = 0
        order_items_data = []
        
        for cart_item in cart_items:
            product = cart_item.product
            if not product.is_active:
                return jsonify({'error': f'El producto {product.name} no está disponible'}), 400
            if product.stock < cart_item.quantity:
                return jsonify({'error': f'Stock insuficiente para {product.name}'}), 400
            
            subtotal = product.price * cart_item.quantity
            total_amount += subtotal
            
            order_items_data.append({
                'product_id': product.id,
                'quantity': cart_item.quantity,
                'price': product.price
            })
        
        # Crear la orden
        order = Order(
            user_id=current_user_id,
            total_amount=total_amount,
            shipping_address=shipping_address,
            payment_method=payment_method,
            status='pending'
        )
        db.session.add(order)
        db.session.flush()  # Para obtener el ID de la orden
        
        # Crear los items de la orden y actualizar stock
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                price=item_data['price']
            )
            db.session.add(order_item)
            
            # Actualizar stock
            product = Product.query.get(item_data['product_id'])
            product.stock -= item_data['quantity']
        
        # Vaciar carrito
        CartItem.query.filter_by(user_id=current_user_id).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Orden creada exitosamente',
            'order': order.serialize()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al crear orden: ' + str(e)}), 500

@user_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_by_id(order_id):
    """Obtener una orden específica"""
    try:
        current_user_id = get_jwt_identity()
        order = Order.query.filter_by(id=order_id, user_id=current_user_id).first()
        
        if not order:
            return jsonify({'error': 'Orden no encontrada'}), 404
            
        return jsonify(order.serialize()), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener orden: ' + str(e)}), 500










