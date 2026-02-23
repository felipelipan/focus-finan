Instalação e execução do backend FastAPI

1. Criar um ambiente virtual e instalar dependências:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Rodar a aplicação:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

3. Endpoints principais:
- `GET /transactions` — lista transações
- `POST /transactions` — cria transação (body JSON)
- `DELETE /transactions/{id}` — deleta transação
- `GET /dashboard` — resumo (total, incomes, expenses, counts)

Observações:
- O banco SQLite será criado em `backend/transactions.db` na primeira execução.
- CORS permite `localhost` e `*` para facilitar desenvolvimento local.
