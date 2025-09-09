"""
Panel de administración para gestionar productos
Este archivo contendrá las rutas administrativas para CRUD de productos
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Product, Category, User

admin_bp = Blueprint('admin', __name__)

# Middleware para verificar que el usuario sea admin
def admin_required():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return user and user.is_admin

# ... imports y admin_bp existentes

@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403
    try:
        data = request.get_json() or {}
        required = ['name','price','stock','category_id']
        for r in required:
            if r not in data:
                return jsonify({'error': f'Falta el campo requerido: {r}'}), 400

        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            stock=int(data['stock']),
            category_id=int(data['category_id']),
            image_url=data.get('image_url', ''),
            brand=data.get('brand', ''),
            is_active=bool(data.get('is_active', True)),
            flavors=data.get('flavors', []) or [],
            flavor_enabled=bool(data.get('flavor_enabled', False))  # NUEVO CAMPO
        )
        db.session.add(product)
        db.session.commit()
        return jsonify({'message': 'Producto creado exitosamente', 'product': product.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear producto: {str(e)}'}), 500

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403
    try:
        data = request.get_json() or {}
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Producto no encontrado'}), 404

        # Actualizaciones parciales
        for field in ['name','description','brand','image_url']:
            if field in data:
                setattr(product, field, data[field] or '')

        if 'price' in data: product.price = float(data['price'])
        if 'stock' in data: product.stock = int(data['stock'])
        if 'category_id' in data: product.category_id = int(data['category_id'])
        if 'is_active' in data: product.is_active = bool(data['is_active'])
        if 'flavors' in data: product.flavors = data.get('flavors', []) or []
        if 'flavor_enabled' in data: product.flavor_enabled = bool(data['flavor_enabled'])  # NUEVO

        db.session.commit()
        return jsonify({'message': 'Producto actualizado exitosamente', 'product': product.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al actualizar producto: {str(e)}'}), 500

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Eliminar un producto (soft delete - marcar como inactivo)"""
    if not admin_required():
        return jsonify({'error': 'Acceso denegado. Se requieren permisos de administrador.'}), 403
    
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        # Soft delete - marcar como inactivo
        product.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Producto eliminado exitosamente'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al eliminar producto: {str(e)}'}), 500

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_all_products_admin():
    """Obtener todos los productos (incluyendo inactivos) para admin"""
    if not admin_required():
        return jsonify({'error': 'Acceso denegado. Se requieren permisos de administrador.'}), 403
    
    try:
        products = Product.query.all()  # Incluye productos inactivos
        return jsonify([product.serialize() for product in products]), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al obtener productos: {str(e)}'}), 500

@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Crear una nueva categoría (solo admin)"""
    if not admin_required():
        return jsonify({'error': 'Acceso denegado. Se requieren permisos de administrador.'}), 403
    
    try:
        data = request.get_json()
        
        if 'name' not in data:
            return jsonify({'error': 'Campo requerido: name'}), 400
        
        category = Category(
            name=data['name'],
            description=data.get('description', '')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Categoría creada exitosamente',
            'category': category.serialize()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al crear categoría: {str(e)}'}), 500
