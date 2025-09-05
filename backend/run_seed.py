#!/usr/bin/env python3
"""
Script para poblar la base de datos con datos iniciales
Ejecutar desde la carpeta backend: python run_seed.py
"""

import sys
import os

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.run import app
from app.seed_data import seed_database

if __name__ == "__main__":
    print("🌱 Iniciando seeding de la base de datos...")
    
    with app.app_context():
        try:
            seed_database()
            print("\n✅ ¡Seeding completado exitosamente!")
            print("📊 Tu tienda ahora tiene productos listos para mostrar.")
        except Exception as e:
            print(f"\n❌ Error durante el seeding: {e}")
            sys.exit(1)
