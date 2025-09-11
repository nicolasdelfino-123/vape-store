from app import db
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.dialects.postgresql import JSONB


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(60), nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[str] = mapped_column(String(10), nullable=False, default="user")
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now(timezone.utc))
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    is_premium: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)

    
    def serialize(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'address': self.address,
            'role': self.role,
            'last_login': self.last_login,
            'is_active': self.is_active,
            'is_premium': self.is_premium,
            'is_admin': self.is_admin,
            'is_premium': self.is_premium,
        }


class Category(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Relación con productos
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")
    
    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
        }




class Product(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(1000), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)

    short_description: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)

    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_url: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    # NUEVO: lista de sabores para pods desechables (opcional)
   
    flavors: Mapped[Optional[list[str]]] = mapped_column(JSONB, nullable=True, default=list)
    flavor_enabled: Mapped[bool] = mapped_column(Boolean(), nullable=True, default=False)
    # Campos adicionales para vapes
    puffs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Para desechables
    nicotine_mg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Nicotina
    volume_ml: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Volumen líquidos

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now(timezone.utc))

    # Relaciones
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'short_description': self.short_description,
            'price': self.price,
            'stock': self.stock,
            'image_url': self.image_url,
            'brand': self.brand,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'is_active': self.is_active,
            'flavors': self.flavors or [],
            'flavor_enabled': self.flavor_enabled,
            'puffs': self.puffs,
            'nicotine_mg': self.nicotine_mg,
            'volume_ml': self.volume_ml,
            'created_at': self.created_at.isoformat(),
        }



class CartItem(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now(timezone.utc))
    
    # Relaciones
    user: Mapped["User"] = relationship("User")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")
    
    def serialize(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'product': self.product.serialize() if self.product else None,
            'created_at': self.created_at.isoformat(),
        }


class Order(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"), nullable=True)  # Puede ser guest
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending, paid, confirmed, shipped, delivered, cancelled
    shipping_address: Mapped[str] = mapped_column(String(200), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # ID del pago en MercadoPago
    external_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Referencia externa
    customer_email: Mapped[str] = mapped_column(String(100), nullable=False)  # Email del cliente
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)  # Nombre del cliente
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relaciones
    user: Mapped[Optional["User"]] = relationship("User")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def serialize(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'total_amount': self.total_amount,
            'status': self.status,
            'shipping_address': self.shipping_address,
            'payment_method': self.payment_method,
            'payment_id': self.payment_id,
            'external_reference': self.external_reference,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'order_items': [item.serialize() for item in self.order_items],
        }


class OrderItem(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("order.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)  # Precio al momento de la compra
    
    # Relaciones
    order: Mapped["Order"] = relationship("Order", back_populates="order_items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")
    
    def serialize(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'price': self.price,
            'product_name': self.product.name if self.product else None,
            'subtotal': self.quantity * self.price,
        }