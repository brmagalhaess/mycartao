from app.db import SessionLocal
from app.models.user import User

def test_can_create_user():
    db = SessionLocal()
    try:
        u = User(email="smoke@example.com", plan="free")
        db.add(u)
        db.commit()
        db.refresh(u)
        assert u.id is not None
        assert u.plan == "free"
    finally:
        db.rollback()
        db.close()
