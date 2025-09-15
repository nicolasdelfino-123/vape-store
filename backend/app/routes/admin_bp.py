"""
Panel de administración para gestionar productos
Este archivo contendrá las rutas administrativas para CRUD de productos
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Product, Category, User

admin_bp = Blueprint('admin', __name__)

# === Helpers de sabores/stock por sabor ===
def _normalize_catalog(catalog):
    norm = []
    for x in (catalog or []):
        if isinstance(x, dict):
            name = str(x.get('name','')).strip()
            active = bool(x.get('active', True))
            try:
                stock = int(x.get('stock', 0))
            except Exception:
                stock = 0
        else:
            # por si llega string suelto
            name, active, stock = str(x).strip(), True, 0
        norm.append({'name': name, 'active': active, 'stock': max(stock, 0)})
    return norm

def _sum_active_stock(catalog):
    return sum(int(f.get('stock', 0)) for f in (catalog or []) if f.get('active'))

# Middleware para verificar que el usuario sea admin
def admin_required():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return user and user.is_admin

# =======================
#       PRODUCTOS
# =======================

@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403
    try:
        data = request.get_json() or {}

        # stock puede venir calculado si flavor_stock_mode = true
        required = ['name', 'price', 'category_id']
        for r in required:
            if r not in data:
                return jsonify({'error': f'Falta el campo requerido: {r}'}), 400

        # ===== NUEVO: soporte de stock por sabor =====
        catalog = _normalize_catalog(data.get('flavor_catalog'))
        flavor_stock_mode = bool(data.get('flavor_stock_mode', False))
        flavor_enabled = bool(data.get('flavor_enabled', False))
        active_flavors = [f['name'] for f in catalog if f.get('active')] if catalog else (data.get('flavors') or [])

        # stock total coherente
        if flavor_stock_mode:
            computed_stock = _sum_active_stock(catalog)
        else:
            try:
                computed_stock = int(data.get('stock', 0))
            except Exception:
                computed_stock = 0

        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            short_description=data.get('short_description', ''),
            price=float(data['price']),
            stock=computed_stock,
            category_id=int(data['category_id']),
            image_url=data.get('image_url', ''),
            brand=data.get('brand', ''),
            is_active=bool(data.get('is_active', True)),

            # sabores visibles (strings)
            flavors=active_flavors,
            flavor_enabled=flavor_enabled,

            # catálogo completo + modo
            flavor_catalog=catalog,
            flavor_stock_mode=flavor_stock_mode,
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

        # Actualizaciones parciales de campos de texto simples
        for field in ['name', 'description', 'short_description', 'brand', 'image_url']:
            if field in data:
                setattr(product, field, data[field] or '')

        # numéricos / flags base
        if 'price' in data:
            product.price = float(data['price'])
        if 'category_id' in data:
            product.category_id = int(data['category_id'])
        if 'is_active' in data:
            product.is_active = bool(data['is_active'])

        # ===== NUEVO: catálogo y modo =====
        if ('flavor_catalog' in data) or ('flavor_stock_mode' in data) or ('flavor_enabled' in data) or ('flavors' in data):
            catalog = _normalize_catalog(data.get('flavor_catalog') if 'flavor_catalog' in data else product.flavor_catalog)
            product.flavor_catalog = catalog

            if 'flavor_stock_mode' in data:
                product.flavor_stock_mode = bool(data['flavor_stock_mode'])

            if 'flavor_enabled' in data:
                product.flavor_enabled = bool(data['flavor_enabled'])

            # flavors visibles = nombres de los activos del catálogo (si hay), sino respeta 'flavors'
            if catalog:
                product.flavors = [f['name'] for f in catalog if f.get('active')]
            elif 'flavors' in data:
                product.flavors = data.get('flavors', []) or []

            # stock total coherente
            if product.flavor_stock_mode:
                product.stock = _sum_active_stock(catalog)
            elif 'stock' in data:
                try:
                    product.stock = int(data['stock'])
                except Exception:
                    product.stock = 0
        else:
            # sin cambios de catálogo: respetar 'stock' si vino
            if 'stock' in data:
                try:
                    product.stock = int(data['stock'])
                except Exception:
                    product.stock = 0

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


# =======================
#       CATEGORÍAS
# =======================

@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Crear una nueva categoría (solo admin)"""
    if not admin_required():
        return jsonify({'error': 'Acceso denegado. Se requieren permisos de administrador.'}), 403
    
    try:
        data = request.get_json() or {}
        
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
