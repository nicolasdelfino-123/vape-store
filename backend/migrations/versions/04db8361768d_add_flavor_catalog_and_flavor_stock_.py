from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '04db8361768d'
down_revision = 'c3730afbd2fd'
branch_labels = None
depends_on = None

def upgrade():
    # 1) agregar columnas de forma segura
    op.add_column('product', sa.Column('flavor_catalog', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # agregar flavor_stock_mode con DEFAULT FALSE para que no rompa con filas existentes
    op.add_column('product', sa.Column('flavor_stock_mode', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # si querés: inicializar flavor_catalog vacío donde sea NULL
    op.execute("UPDATE product SET flavor_catalog = '[]'::jsonb WHERE flavor_catalog IS NULL")

    # (opcional) si no querés que quede el server_default en el schema, lo removés:
    op.alter_column('product', 'flavor_stock_mode', server_default=None)

    # si Alembic te detectó selected_flavor en cart_item, dejalo:
    # (ya lo había visto en tu autogenerate)
    op.add_column('cart_item', sa.Column('selected_flavor', sa.String(length=120), nullable=True))


def downgrade():
    op.drop_column('cart_item', 'selected_flavor')
    op.drop_column('product', 'flavor_stock_mode')
    op.drop_column('product', 'flavor_catalog')
