"""
Archivo para crear las categorías base de la tienda
Este script solo crea las categorías necesarias para el admin
"""

from app import db
from app.models import Category

def seed_database():
    """Función para crear solo las categorías base"""
    
    # Crear categorías (idempotente)
    categories = [
        Category(name="Vapes Desechables", description="Vapes de un solo uso"),
        Category(name="Pods Recargables", description="Sistemas de pods recargables"),
        Category(name="Líquidos", description="E-liquids y sales de nicotina"),
        Category(name="Accesorios", description="Repuestos y accesorios"),
        Category(name="Mods", description="Mods y dispositivos avanzados"),
        Category(name="Atomizadores", description="Tanks y RDA"),
        Category(name="Sales de Nicotina", description="Sales de nicotina"),
        Category(name="Celulares", description="Smartphones y accesorios"),
        Category(name="Perfumes", description="Fragancias")
]
    
    for c in categories:
        if not Category.query.filter_by(name=c.name).first():
            db.session.add(c)

    try:
        db.session.commit()
        print("✅ Categorías creadas exitosamente!")
        print(f"✅ Total categorías: {len(categories)}")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al crear categorías: {e}")

if __name__ == "__main__":
    from app.run import app
    with app.app_context():
        seed_database()