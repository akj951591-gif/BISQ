from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text

from pgvector.sqlalchemy import Vector

from app.db.session import Base


class BISStandard(Base):
    __tablename__ = "bis_standards"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        String(255),
        unique=True,
        index=True,
    )

    is_number = Column(
        String(100),
        index=True,
    )

    year = Column(Integer)

    title = Column(Text)

    amendments = Column(Text)

    committee = Column(
        String(255),
        index=True,
    )

    equivalent = Column(Text)

    superseding = Column(Text)

    supersede_by = Column(Text)

    division = Column(
        String(255),
        index=True,
    )

    pdf_url = Column(Text)

    txt_url = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


class BISChunk(Base):
    __tablename__ = "bis_chunks"

    id = Column(Integer, primary_key=True)
    standard_id = Column(
        Integer,
        ForeignKey("bis_standards.id"),
        index=True,
    )
    chunk_index = Column(Integer)
    content = Column(Text)
    page_number = Column(Integer)
    embedding = Column(Vector(1024))
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )