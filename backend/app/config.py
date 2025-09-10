import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración de email
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')  # tu email
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')   # tu contraseña de app
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME')
    MAIL_ASCII_ATTACHMENTS = False
    
    # Configuración de MercadoPago
    MERCADOPAGO_ACCESS_TOKEN = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
    MERCADOPAGO_PUBLIC_KEY = os.getenv('MERCADOPAGO_PUBLIC_KEY')
    
    # Configuración base de PostgreSQL
    @staticmethod
    def get_database_uri():
        return os.getenv("DATABASE_URL")
    
    
class DevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = Config.get_database_uri()
    DEBUG = True
        
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "testing-secret"
    
class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = Config.get_database_uri()
    DEBUG = False