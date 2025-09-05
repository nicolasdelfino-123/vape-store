"""
Archivo para poblar la base de datos con productos iniciales
Este script se ejecuta para cargar datos de ejemplo en la tienda
"""

from app import db
from app.models import Category, Product

def seed_database():
    """Función para poblar la base de datos con datos iniciales"""
    
    # Limpiar tablas existentes (opcional)
    # Product.query.delete()
    # Category.query.delete()
    
    # Crear categorías
    categories = [
        Category(name="Vapes Desechables", description="Vapes de un solo uso, perfectos para comenzar"),
        Category(name="Pods", description="Sistemas de pods recargables"),
        Category(name="Líquidos", description="E-liquids de las mejores marcas"),
        Category(name="Accesorios", description="Repuestos y accesorios para vapes"),
    ]
    
    for category in categories:
        existing = Category.query.filter_by(name=category.name).first()
        if not existing:
            db.session.add(category)
    
    db.session.commit()
    
    # Obtener IDs de categorías
    vapes_cat = Category.query.filter_by(name="Vapes Desechables").first()
    pods_cat = Category.query.filter_by(name="Pods").first()
    liquidos_cat = Category.query.filter_by(name="Líquidos").first()
    accesorios_cat = Category.query.filter_by(name="Accesorios").first()
    
    # Crear productos
    products = [
        # Vapes Desechables
        Product(
            name="Elf Bar BC5000",
            description="Vape desechable con hasta 5000 puffs. Sabor intenso y duradero.",
            price=8500.00,
            stock=50,
            image_url="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300",
            category_id=vapes_cat.id,
            brand="Elf Bar",
            is_active=True
        ),
        Product(
            name="Lost Mary OS5000",
            description="Diseño elegante con 5000 puffs y sabores únicos.",
            price=9200.00,
            stock=35,
            image_url="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300",
            category_id=vapes_cat.id,
            brand="Lost Mary",
            is_active=True
        ),
        Product(
            name="Hyde Edge",
            description="Vape compacto con excelente rendimiento de batería.",
            price=7800.00,
            stock=40,
            image_url="https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=300",
            category_id=vapes_cat.id,
            brand="Hyde",
            is_active=True
        ),
        
        # Pods
        Product(
            name="JUUL Device Kit",
            description="El sistema de pods más popular. Incluye cargador.",
            price=15500.00,
            stock=25,
            image_url="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300",
            category_id=pods_cat.id,
            brand="JUUL",
            is_active=True
        ),
        Product(
            name="SMOK Nord 4",
            description="Pod potente con pantalla OLED y batería de larga duración.",
            price=18900.00,
            stock=20,
            image_url="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300",
            category_id=pods_cat.id,
            brand="SMOK",
            is_active=True
        ),
        Product(
            name="Vaporesso XROS 3",
            description="Diseño premium con control de flujo de aire ajustable.",
            price=16200.00,
            stock=30,
            image_url="https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=300",
            category_id=pods_cat.id,
            brand="Vaporesso",
            is_active=True
        ),
        
        # Líquidos
        Product(
            name="Naked 100 - Lava Flow",
            description="Mezcla tropical de fresa, piña y coco. 60ml 3mg.",
            price=4500.00,
            stock=100,
            image_url="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300",
            category_id=liquidos_cat.id,
            brand="Naked 100",
            is_active=True
        ),
        Product(
            name="BLVK Unicorn - UniChew",
            description="Sabor a chicle dulce con notas frutales. 60ml 6mg.",
            price=4200.00,
            stock=80,
            image_url="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300",
            category_id=liquidos_cat.id,
            brand="BLVK Unicorn",
            is_active=True
        ),
        Product(
            name="Jam Monster - Strawberry",
            description="Mermelada de fresa sobre tostada. Sabor único. 100ml 3mg.",
            price=5800.00,
            stock=60,
            image_url="https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=300",
            category_id=liquidos_cat.id,
            brand="Jam Monster",
            is_active=True
        ),
        
        # Accesorios
        Product(
            name="Coils SMOK Nord",
            description="Pack de 5 resistencias compatibles con SMOK Nord series.",
            price=2800.00,
            stock=200,
            image_url="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300",
            category_id=accesorios_cat.id,
            brand="SMOK",
            is_active=True
        ),
        Product(
            name="Cargador Universal USB-C",
            description="Cargador rápido compatible con la mayoría de vapes modernos.",
            price=1500.00,
            stock=150,
            image_url="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300",
            category_id=accesorios_cat.id,
            brand="Universal",
            is_active=True
        ),
        Product(
            name="Estuche de Transporte",
            description="Estuche premium para transportar tu vape y accesorios de forma segura.",
            price=3200.00,
            stock=75,
            image_url="https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=300",
            category_id=accesorios_cat.id,
            brand="VapeCase",
            is_active=True
        ),
    ]
    
    for product in products:
        existing = Product.query.filter_by(name=product.name).first()
        if not existing:
            db.session.add(product)
    
    try:
        db.session.commit()
        print("✅ Base de datos poblada exitosamente!")
        print(f"✅ Categorías creadas: {len(categories)}")
        print(f"✅ Productos creados: {len(products)}")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al poblar la base de datos: {e}")

if __name__ == "__main__":
    from app.run import app
    with app.app_context():
        seed_database()
