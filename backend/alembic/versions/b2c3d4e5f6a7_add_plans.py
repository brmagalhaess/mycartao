"""add plans table

Revision ID: b2c3d4e5f6a7
Revises: a160898b617a
Create Date: 2026-07-23 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a160898b617a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("interval", sa.String(length=20), nullable=False),
        sa.Column("entitlement", sa.String(length=20), nullable=False),
        sa.Column("stripe_product_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_price_id", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_plans_code"), "plans", ["code"], unique=True)
    op.create_index(op.f("ix_plans_stripe_price_id"), "plans", ["stripe_price_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_plans_stripe_price_id"), table_name="plans")
    op.drop_index(op.f("ix_plans_code"), table_name="plans")
    op.drop_table("plans")
