#!/usr/bin/env python3
"""
Script para crear un usuario administrador
Ejecutar desde la carpeta backend: python create_admin.py
"""

import sys
import os

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.run import app
from app.models import User
from app import db, bcrypt

def create_admin_user():
    """Crear un usuario administrador"""
    
    try:
        # Verificar si ya existe un admin
        existing_admin = User.query.filter_by(email="admin@vapestore.com").first()
        if existing_admin:
            print("⚠️  El usuario admin ya existe.")
            return

        # Crear usuario admin
        admin_user = User(
            email="admin@vapestore.com",
            password=bcrypt.generate_password_hash("admin123").decode('utf-8'),
            name="Administrador",
            phone="1234567890",
            is_admin=True,
            is_active=True
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("✅ Usuario administrador creado exitosamente!")
        print("📧 Email: admin@vapestore.com")
        print("🔑 Password: admin123")
        print("🚀 Ya podés acceder al panel admin en /admin")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al crear usuario admin: {e}")

if __name__ == "__main__":
    print("👤 Creando usuario administrador...")
    
    with app.app_context():
        create_admin_user()
