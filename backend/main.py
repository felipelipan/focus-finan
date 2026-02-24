from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from sqlalchemy.orm import Session

from . import models
from .database import engine, get_db
from . import database

# ensure all tables exist
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
    # Atualizar saldo da conta associada
    acct = db.query(models.Account).filter(models.Account.name == payload.account).first()
    if not acct:
        acct = models.Account(name=payload.account, saldo_atual=0.0)
        db.add(acct)
        db.commit()
        db.refresh(acct)

    try:
        if payload.type == 'income':
            acct.saldo_atual = (acct.saldo_atual or 0) + payload.value
        else:
            acct.saldo_atual = (acct.saldo_atual or 0) - abs(payload.value)
        db.add(acct)
        db.commit()
    except Exception:
        db.rollback()

    return tx


@app.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    # Ajustar saldo da conta (reverter o efeito do lançamento)
    acct = db.query(models.Account).filter(models.Account.name == tx.account).first()
    if acct:
        try:
            if tx.type == 'income':
                acct.saldo_atual = (acct.saldo_atual or 0) - tx.value
            else:
                acct.saldo_atual = (acct.saldo_atual or 0) + abs(tx.value)
            db.add(acct)
            db.commit()
        except Exception:
            db.rollback()

    db.delete(tx)
    db.commit()
    return {"ok": True}


@app.post('/api/extrato/importar')
async def importar_extrato(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    fname = (file.filename or '').lower()
    results = []

    if fname.endswith('.csv'):
        import csv, io
        text = content.decode('utf-8', errors='ignore')
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        start = 0
        # se primeira linha parece header, pula
        if rows and any(any(ch.isalpha() for ch in col) for col in rows[0]):
            start = 1
        for row in rows[start:]:
            if not row or all(not c.strip() for c in row):
                continue
            date = row[0].strip() if len(row) > 0 else ''
            desc = row[1].strip() if len(row) > 1 else 'Importado'
            amount_raw = row[2].strip() if len(row) > 2 else '0'
            # normalizar número (tenta lidar com 1.234,56 e 1234.56)
            try:
                amount = float(amount_raw.replace('.', '').replace(',', '.'))
            except Exception:
                try:
                    amount = float(amount_raw.replace(',', '.'))
                except Exception:
                    amount = 0.0
            tx_type = 'income' if amount > 0 else 'expense'
            results.append({'date': date, 'desc': desc, 'value': amount, 'type': tx_type})
    elif fname.endswith('.ofx'):
        s = content.decode('utf-8', errors='ignore')
        import re
        trns = re.findall(r'<STMTTRN>(.*?)</STMTTRN>', s, re.S | re.I)
        for tr in trns:
            dt_m = re.search(r'<DTPOSTED>(\d+)', tr)
            amt_m = re.search(r'<TRNAMT>([-\d.,]+)', tr)
            name_m = re.search(r'<NAME>(.*?)\r?\n', tr)
            date = dt_m.group(1) if dt_m else ''
            try:
                amount = float(amt_m.group(1).replace(',', '.')) if amt_m else 0.0
            except Exception:
                amount = 0.0
            desc = name_m.group(1).strip() if name_m else 'Importado'
            tx_type = 'income' if amount > 0 else 'expense'
            results.append({'date': date, 'desc': desc, 'value': amount, 'type': tx_type})
    else:
        raise HTTPException(status_code=400, detail='Formato de arquivo não suportado')

    return results


@app.get('/api/plano-contas')
def plano_contas(db: Session = Depends(get_db)):
    cats = db.query(models.Category).all()
    if not cats:
        # seed defaults
        defaults = [
            models.Category(nome='Alimentação', tipo='despesa'),
            models.Category(nome='Outras Receitas', tipo='receita'),
            models.Category(nome='Moradia', tipo='despesa')
        ]
        db.add_all(defaults)
        db.commit()
        cats = db.query(models.Category).all()
    return [{'id': c.id, 'nome': c.nome, 'tipo': c.tipo} for c in cats]


@app.get('/api/contas/{account_id}/saldo')
def get_account_saldo(account_id: int, db: Session = Depends(get_db)):
    acct = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail='Conta não encontrada')
    return {'id': acct.id, 'name': acct.name, 'saldo_atual': acct.saldo_atual}


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

