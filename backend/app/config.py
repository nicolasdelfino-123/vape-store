import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
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