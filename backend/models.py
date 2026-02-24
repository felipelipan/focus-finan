from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    desc = Column(String)
    cat = Column(String)
    account = Column(String)
    value = Column(Float)
    status = Column(String, default="pending")
    type = Column(String)  # 'income' or 'expense'
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Account(Base):
    __tablename__ = 'accounts'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    saldo_atual = Column(Float, default=0.0)


class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True)
    tipo = Column(String)  # 'receita' or 'despesa'
