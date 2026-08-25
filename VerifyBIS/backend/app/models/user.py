import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: uuid.uuid4().hex)
    google_sub = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
