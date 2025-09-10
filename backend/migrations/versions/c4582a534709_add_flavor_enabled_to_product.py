"""add flavor_enabled to product

Revision ID: c4582a534709
Revises: 9f352dd99308
Create Date: 2025-09-10 10:33:13.752469

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4582a534709'
down_revision = '9f352dd99308'
branch_labels = None
depends_on = None



def upgrade():
    # Paso 1: crear columna con default en DB y nullable=True (no rompe filas)
    with op.batch_alter_table('product', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'flavor_enabled',
            sa.Boolean(),
            nullable=True,
            server_default=sa.text('false')
        ))

    # Paso 2: poblar filas existentes
    op.execute("UPDATE product SET flavor_enabled = false WHERE flavor_enabled IS NULL;")

    # Paso 3: endurecer: NOT NULL y sin default (esquema limpio)
    with op.batch_alter_table('product', schema=None) as batch_op:
        batch_op.alter_column('flavor_enabled',
                              existing_type=sa.Boolean(),
                              nullable=False,
                              server_default=None)

def downgrade():
    with op.batch_alter_table('product', schema=None) as batch_op:
        batch_op.drop_column('flavor_enabled')


    # ### end Alembic commands ###
