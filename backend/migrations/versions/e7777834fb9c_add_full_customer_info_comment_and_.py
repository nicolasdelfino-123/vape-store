"""Add full customer info, comment, and JSONB shipping_address to Order

Revision ID: e7777834fb9c
Revises: 0addc84bde1d
Create Date: 2025-10-09 11:29:57.291606

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e7777834fb9c'
down_revision = '0addc84bde1d'
branch_labels = None
depends_on = None


def upgrade():
    # ✅ Agregamos las nuevas columnas y convertimos shipping_address correctamente a JSONB
    with op.batch_alter_table('order', schema=None) as batch_op:
        # Nuevas columnas
        batch_op.add_column(sa.Column('customer_first_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('customer_last_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('customer_phone', sa.String(length=40), nullable=True))
        batch_op.add_column(sa.Column('customer_dni', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('customer_comment', sa.String(length=5000), nullable=True))
        batch_op.add_column(sa.Column('billing_address', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

        # Aseguramos que el email sea opcional
        batch_op.alter_column(
            'customer_email',
            existing_type=sa.VARCHAR(length=100),
            nullable=True
        )

        # 👇 conversión segura del tipo texto a JSONB
        batch_op.execute(
            'ALTER TABLE "order" ALTER COLUMN shipping_address TYPE JSONB USING shipping_address::jsonb'
        )

        # Eliminamos el campo viejo unificado
        batch_op.drop_column('customer_name')


def downgrade():
    # ⚠️ Revertimos los cambios si es necesario
    with op.batch_alter_table('order', schema=None) as batch_op:
        batch_op.add_column(sa.Column('customer_name', sa.VARCHAR(length=100), autoincrement=False, nullable=False))

        # Revertimos shipping_address a texto
        batch_op.execute(
            'ALTER TABLE "order" ALTER COLUMN shipping_address TYPE VARCHAR(200) USING shipping_address::text'
        )

        batch_op.alter_column(
            'customer_email',
            existing_type=sa.VARCHAR(length=100),
            nullable=False
        )

        # Quitamos las columnas agregadas
        batch_op.drop_column('billing_address')
        batch_op.drop_column('customer_comment')
        batch_op.drop_column('customer_dni')
        batch_op.drop_column('customer_phone')
        batch_op.drop_column('customer_last_name')
        batch_op.drop_column('customer_first_name')
