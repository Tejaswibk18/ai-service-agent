from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)

from datetime import datetime

from database.connection import Base


class Server(Base):

    __tablename__ = "servers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    server_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    host = Column(
        String,
        nullable=False
    )

    username = Column(
        String,
        nullable=False
    )

    auth_type = Column(
        String,
        nullable=False
    )

    credential = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )