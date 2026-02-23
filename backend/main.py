from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session

from . import models
from .database import engine, get_db

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Focus Finan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TransactionCreate(BaseModel):
    date: str = Field(..., example="23/02/2026")
    desc: str
    cat: str
    account: str
    value: float
    status: str = "pending"
    type: str  # 'income' or 'expense'


class TransactionOut(TransactionCreate):
    id: int
    created_at: str


@app.get("/transactions", response_model=List[TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    txs = db.query(models.Transaction).order_by(models.Transaction.id.desc()).all()
    return txs


@app.post("/transactions", response_model=TransactionOut)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    tx = models.Transaction(
        date=payload.date,
        desc=payload.desc,
        cat=payload.cat,
        account=payload.account,
        value=payload.value,
        status=payload.status,
        type=payload.type,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@app.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"ok": True}


@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    txs = db.query(models.Transaction).all()
    total = sum(t.value for t in txs)
    incomes = sum(t.value for t in txs if t.type == 'income')
    expenses = sum(t.value for t in txs if t.type != 'income')
    pending = len([t for t in txs if t.status != 'confirmed'])
    confirmed = len([t for t in txs if t.status == 'confirmed'])
    return {
        "total": total,
        "incomes": incomes,
        "expenses": expenses,
        "counts": {"pending": pending, "confirmed": confirmed},
    }

import database
from models import Base

Base.metadata.create_all(bind=database.engine)