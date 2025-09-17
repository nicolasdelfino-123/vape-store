from flask import Blueprint, jsonify, request
from app import db
from app.models import Product, Category
import os
from flask import send_from_directory, current_app


public_bp = Blueprint('public', __name__)

@public_bp.route('/')
def home():
    return jsonify({'msg':'Home Page'})

@public_bp.route('/demo')
def demo():
    return jsonify({'msg':'Este es un mensaje que viene desde el backend, especificamente la Demo Page... :)'}), 200

@public_bp.route('/about')
def about():
    return jsonify({'msg':'About Page'})

# === RUTAS PÚBLICAS PARA LA TIENDA DE VAPES ===

@public_bp.route('/products', methods=['GET'])
def get_products():
    """Obtener todos los productos activos"""
    try:
        # Parámetros opcionales de filtrado
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        
        # Query base
        query = Product.query.filter(Product.is_active == True)
        
        # Filtrar por categoría si se especifica
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        # Filtrar por búsqueda si se especifica
        if search:
            query = query.filter(Product.name.ilike(f'%{search}%'))
        
        products = query.all()
        return jsonify([product.serialize() for product in products]), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener productos: ' + str(e)}), 500

@public_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Obtener un producto específico por ID"""
    try:
        product = Product.query.filter(
            Product.id == product_id, 
            Product.is_active == True
        ).first()
        
        if not product:
            return jsonify({'error': 'Producto no encontrado'}), 404
            
        return jsonify(product.serialize()), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener producto: ' + str(e)}), 500

@public_bp.route('/categories', methods=['GET'])
def get_categories():
    """Obtener todas las categorías"""
    try:
        categories = Category.query.all()
        return jsonify([category.serialize() for category in categories]), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener categorías: ' + str(e)}), 500

@public_bp.route('/categories/<int:category_id>/products', methods=['GET'])
def get_products_by_category(category_id):
    """Obtener productos de una categoría específica"""
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Categoría no encontrada'}), 404
            
        products = Product.query.filter(
            Product.category_id == category_id,
            Product.is_active == True
        ).all()
        
        return jsonify({
            'category': category.serialize(),
            'products': [product.serialize() for product in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Error al obtener productos de la categoría: ' + str(e)}), 500
    

@public_bp.route('/api/send-mail', methods=['POST'])
def send_mail():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    message = data.get("message")

    body = f"""
    Nueva solicitud mayorista:
    Nombre: {name}
    Email: {email}
    Teléfono: {phone}
    Mensaje: {message}
    """

    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = "Nueva solicitud mayorista"
        msg["From"] = formataddr(("Web Zarpados Vaps", os.getenv("SMTP_USER")))
        msg["To"] = "nicolasdelfino585@gmail.com"

        with smtplib.SMTP_SSL(os.getenv("SMTP_HOST"), 465) as server:
            server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
            server.sendmail(os.getenv("SMTP_USER"), ["nicolasdelfino585@gmail.com"], msg.as_string())

        return jsonify({"message": "ok"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@public_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    folder = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.getcwd(), 'uploads'))
    return send_from_directory(folder, filename, max_age=60*60*24*30)  # cache 30 días
