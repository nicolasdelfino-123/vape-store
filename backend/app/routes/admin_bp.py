"""
Panel de administración para gestionar productos
Este archivo contendrá las rutas administrativas para CRUD de productos
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Product, Category, User,ProductImage,now_cba_naive
from flask import current_app, send_from_directory, url_for
from werkzeug.utils import secure_filename
from PIL import Image, ImageOps # pip install pillow
from flask import url_for
# backend/app/routes/admin_bp.py
from flask import Blueprint, request, jsonify, current_app, url_for
import os, io, hashlib, uuid



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
            puffs=(int(data['puffs']) if str(data.get('puffs','')).strip().isdigit() else None),
            created_at=now_cba_naive(),
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
            # 👇 NUEVO: puffs (caladas)
        if 'puffs' in data:
            v = str(data.get('puffs','')).strip()
            product.puffs = int(v) if v.isdigit() else None


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
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Producto no encontrado'}), 404

        hard = str(request.args.get('hard', '')).lower() in ('1','true','yes')

        if hard:
            # Con ON DELETE CASCADE, al borrar el product se borran sus imágenes
            db.session.delete(product)
        else:
            product.is_active = False  # comportamiento anterior (soft delete)

        db.session.commit()
        return jsonify({'message': 'Producto eliminado'}), 200
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




@admin_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """
    Sube una imagen desde Admin, la optimiza y la guarda en la BD (ProductImage).
    Devuelve la URL interna: /public/img/<id>
    Campos aceptados (form-data):
      - image: archivo
      - product_id (opcional): int para asociar al producto
      - format (opcional): 'webp' | 'jpeg' (default: webp)
      - max_size (opcional): lado mayor, int (default: 1600)
    """
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403

    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'Falta el archivo "image"'}), 400

    # Parámetros opcionales
    target_format = (request.form.get('format') or 'webp').lower()
    max_size = int(request.form.get('max_size') or 1600)
    product_id = request.form.get('product_id')
    product_id = int(product_id) if product_id and product_id.isdigit() else None

    # Leer bytes originales (para digest/ETag)
    original_bytes = file.read()
    if not original_bytes:
        return jsonify({'error': 'Archivo vacío'}), 400

    # Abrir con Pillow y normalizar orientación
    try:
        img = Image.open(io.BytesIO(original_bytes))
        img = ImageOps.exif_transpose(img)
        # Convertimos a RGB para evitar problemas de modo (p.ej. PNG con alpha → lo podés mantener si querés)
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')
    except Exception as e:
        return jsonify({'error': f'No se pudo leer la imagen: {str(e)}'}), 400

    # Resize "thumbnail" mantiene aspect ratio
    img.thumbnail((max_size, max_size))

    # Serializar optimizada a bytes en memoria
    out = io.BytesIO()
    if target_format == 'jpeg':
        # JPEG progresivo
        img = img.convert('RGB')
        img.save(out, format='JPEG', quality=82, optimize=True, progressive=True)
        mime = 'image/jpeg'
    else:
        # WEBP (recomendado: más liviano, soporte general actual)
        # Si hay alpha y querés preservarla:
        if img.mode == 'RGBA':
            img.save(out, format='WEBP', quality=80, method=6, lossless=False)
        else:
            img.save(out, format='WEBP', quality=80, method=6)
        mime = 'image/webp'

    optimized_bytes = out.getvalue()
    width, height = img.size

    # Digest para ETag/caché y deduplicación opcional
    digest = hashlib.sha256(optimized_bytes).hexdigest()

    # Guardar en BD
    db_image = ProductImage(
        product_id=product_id,
        mime_type=mime,
        bytes=optimized_bytes,
        width=width,
        height=height,
        digest=digest,
        created_at=now_cba_naive(),
    )
    db.session.add(db_image)
    db.session.commit()

    # URL interna que sirve desde la BD
    img_url = url_for('public.serve_image', image_id=db_image.id)

# Si vino product_id, asociamos la imagen y, SOLO si no hay principal o si el admin lo pide,
# la dejamos como principal (no pisamos siempre).
    if product_id:
        product = Product.query.get(product_id)
        if product:
            set_as_main = (request.form.get('as_main') in ('1', 'true', 'yes')) or not product.image_url
            if set_as_main:
                product.image_url = img_url
            db.session.commit()

    return jsonify({'url': img_url, 'image_id': db_image.id}), 201


# --- NUEVO: asociar imágenes huérfanas a un producto ---
@admin_bp.route('/products/<int:product_id>/attach-images', methods=['POST'])
@jwt_required()
def attach_images(product_id):
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403

    data = request.get_json() or {}
    image_ids = data.get('image_ids') or []
    main_id = data.get('main_id')  # opcional: id de la imagen principal

    if not isinstance(image_ids, list):
        return jsonify({'error': 'image_ids debe ser lista de enteros'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Producto no encontrado'}), 404

    # Buscar y asociar
    imgs = ProductImage.query.filter(ProductImage.id.in_(image_ids)).all()
    for im in imgs:
        im.product_id = product_id
    db.session.commit()

    # Si mandaste main_id, setear imagen principal (sin pisar si ya hay una a menos que la pidas)
    if main_id:
        try:
            main_id = int(main_id)
            # armamos la misma URL que devolvés al subir (/public/img/<id>)
            product.image_url = f"/public/img/{main_id}"
            db.session.commit()
        except Exception:
            db.session.rollback()

    return jsonify({
        'message': f'{len(imgs)} imágenes asociadas al producto {product_id}.',
        'attached_ids': [im.id for im in imgs],
        'product_id': product_id
    }), 200


# --- NUEVO: eliminar imagen por ID ---
@admin_bp.route('/images/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_image(image_id):
    if not admin_required():
        return jsonify({'error': 'Acceso denegado.'}), 403

    img = ProductImage.query.get(image_id)
    if not img:
        return jsonify({'error': 'Imagen no encontrada'}), 404

    # Guardamos el product_id antes de borrar para poder ajustar principal
    pid = img.product_id

    db.session.delete(img)
    db.session.commit()

    # Si estaba asociada a un producto y la principal del producto apuntaba a esta imagen,
    # reasignar principal a otra imagen del mismo producto (si existe), o dejar None.
    if pid:
        product = Product.query.get(pid)
        if product:
            # ¿La principal apuntaba a /public/img/<image_id>?
            current = (product.image_url or '').strip()
            is_same = current.endswith(f"/public/img/{image_id}") or current == f"/public/img/{image_id}"
            if is_same:
                # Buscar otra imagen del producto
                next_img = ProductImage.query.filter_by(product_id=pid).order_by(ProductImage.id.asc()).first()
                product.image_url = f"/public/img/{next_img.id}" if next_img else None
                db.session.commit()

    return jsonify({'message': f'Imagen {image_id} eliminada'}), 200
