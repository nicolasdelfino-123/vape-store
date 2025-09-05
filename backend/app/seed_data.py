"""
Archivo para poblar la base de datos con productos iniciales
Este script se ejecuta para cargar datos de ejemplo en la tienda
"""

from app import db
from app.models import Category, Product

# Helper para construir URLs de Unsplash con parámetros estables
def u(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=600&q=80"

def seed_database():
    """Función para poblar la base de datos con datos iniciales"""
    
    # Crear categorías (idempotente)
    categories = [
        Category(name="Vapes Desechables", description="Vapes de un solo uso, perfectos para comenzar"),
        Category(name="Pods", description="Sistemas de pods recargables"),
        Category(name="Líquidos", description="E-liquids de las mejores marcas"),
        Category(name="Accesorios", description="Repuestos y accesorios para vapes"),
    ]
    for c in categories:
        if not Category.query.filter_by(name=c.name).first():
            db.session.add(c)
    db.session.commit()

    # Obtener IDs de categorías
    vapes_cat     = Category.query.filter_by(name="Vapes Desechables").first()
    pods_cat      = Category.query.filter_by(name="Pods").first()
    liquidos_cat  = Category.query.filter_by(name="Líquidos").first()
    accesorios_cat= Category.query.filter_by(name="Accesorios").first()

    # Productos (imágenes reales, marcas a modo ilustrativo)
    products = [
        # --- Vapes Desechables ---
        Product(
            name="Elf Bar",
            description="Vape desechable con hasta 5000 puffs. Sabor intenso y duradero.",
            price=8500.00,
            stock=50,
            image_url=u("1594736797933-d0501ba2fe65"),  # dispositivo vape en mano/mesa
            category_id=vapes_cat.id,
            brand="Elf Bar",
            is_active=True
        ),
        Product(
            name="Lost Mary OS5000",
            description="Diseño elegante con 5000 puffs y sabores únicos.",
            price=9200.00,
            stock=35,
            image_url=u("1594736797933-d0501ba2fe65"),  # close-up vape/pod
            category_id=vapes_cat.id,
            brand="Lost Mary",
            is_active=True
        ),
        Product(
            name="Hyde Edge",
            description="Vape compacto con excelente rendimiento de batería.",
            price=7800.00,
            stock=40,
            image_url=u("1594736797933-d0501ba2fe65"),  # estética producto
            category_id=vapes_cat.id,
            brand="Hyde",
            is_active=True
        ),

        # --- Pods ---
        Product(
            name="JUUL Device Kit",
            description="Sistema de pods popular. Incluye cargador magnético.",
            price=15500.00,
            stock=25,
            image_url=u("1594736797933-d0501ba2fe65"),  # pod/pen sobre mesa
            category_id=pods_cat.id,
            brand="JUUL",
            is_active=True
        ),
        Product(
            name="SMOK Nord 4",
            description="Pod potente con pantalla OLED y batería de larga duración.",
            price=18900.00,
            stock=20,
            image_url=u("1517336714731-489689fd1ca8"),  # dispositivo tech minimal
            category_id=pods_cat.id,
            brand="SMOK",
            is_active=True
        ),
        Product(
            name="Vaporesso XROS 3",
            description="Diseño premium con control de flujo de aire.",
            price=16200.00,
            stock=30,
            image_url=u("1523275335684-37898b6baf30"),  # close-up gadget sobrio
            category_id=pods_cat.id,
            brand="Vaporesso",
            is_active=True
        ),

        # --- Líquidos ---
        Product(
            name="Naked 100 - Lava Flow",
            description="Mezcla tropical: fresa, piña y coco. 60ml 3mg.",
            price=4500.00,
            stock=100,
            image_url=u("1519681393784-d120267933ba"),  # botella/frasco tipo e-liquid
            category_id=liquidos_cat.id,
            brand="Naked 100",
            is_active=True
        ),
        Product(
            name="BLVK Unicorn - UniChew",
            description="Sabor a chicle dulce con notas frutales. 60ml 6mg.",
            price=4200.00,
            stock=80,
            image_url=u("1512496015851-a90fb38ba796"),  # botellas sobre mesa
            category_id=liquidos_cat.id,
            brand="BLVK Unicorn",
            is_active=True
        ),
        Product(
            name="Jam Monster - Strawberry",
            description="Mermelada de fresa sobre tostada. 100ml 3mg.",
            price=5800.00,
            stock=60,
            image_url=u("1517686469429-8bdb88b9f907"),  # frascos/packaging lifestyle
            category_id=liquidos_cat.id,
            brand="Jam Monster",
            is_active=True
        ),

        # --- Accesorios ---
        Product(
            name="Coils SMOK Nord",
            description="Pack de 5 resistencias compatibles con SMOK Nord series.",
            price=2800.00,
            stock=200,
            image_url=u("1545239351-1141bd82e8a6"),  # cajas/pequeños repuestos
            category_id=accesorios_cat.id,
            brand="SMOK",
            is_active=True
        ),
        Product(
            name="Cargador Universal USB-C",
            description="Cargador rápido compatible con la mayoría de vapes modernos.",
            price=1500.00,
            stock=150,
            image_url=u("1518773553398-650c184e0bb3"),  # cable/charger tech
            category_id=accesorios_cat.id,
            brand="Universal",
            is_active=True
        ),
        Product(
            name="Estuche de Transporte",
            description="Estuche premium para transportar tu vape y accesorios.",
            price=3200.00,
            stock=75,
            image_url=u("1508057198894-247b23fe5ade"),  # estuche/organizador
            category_id=accesorios_cat.id,
            brand="VapeCase",
            is_active=True
        ),
    ]

    # Insert idempotente
    for p in products:
        existing = Product.query.filter_by(name=p.name).first()
        if existing:
        # Actualizamos campos clave
            existing.description = p.description
            existing.price = p.price
            existing.stock = p.stock
            existing.image_url = p.image_url
            existing.brand = p.brand
            existing.category_id = p.category_id
            existing.is_active = p.is_active
        else:
            db.session.add(p)


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
