# 🚀 Backend Focus Finan - Guia Completo de Instalação e Uso

## 📋 Pré-requisitos

- Python 3.8+
- pip (gerenciador de pacotes Python)
- curl ou Postman (para testar endpoints - opcional)

---

## 🔧 Instalação Rápida

### 1. Criar e ativar ambiente virtual (recomendado)

```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 2. Instalar dependências

```bash
pip install -r backend/requirements.txt
```

**Conteúdo do `requirements.txt`:**
```
fastapi==0.99.1
uvicorn[standard]==0.22.0
SQLAlchemy==2.0.20
pydantic==1.10.12
```

---

## ▶️ Executar o Servidor

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**Output esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Acessar a documentação interativa:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

---

## 📡 Endpoints da API

### 1. Listar todas as transações

```bash
curl http://127.0.0.1:8000/transactions
```

**Resposta (exemplo):**
```json
[
  {
    "id": 2,
    "date": "23/02/2026",
    "desc": "Sorveteria",
    "cat": "Outras Despesas",
    "account": "Conta corrente",
    "value": -250.0,
    "status": "confirmed",
    "type": "expense",
    "created_at": "2026-02-23T13:30:00"
  },
  {
    "id": 1,
    "date": "23/02/2026",
    "desc": "Salário",
    "cat": "Outras Receitas",
    "account": "Conta corrente",
    "value": 1000.0,
    "status": "confirmed",
    "type": "income",
    "created_at": "2026-02-23T13:25:00"
  }
]
```

---

### 2. Criar nova transação

```bash
curl -X POST http://127.0.0.1:8000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "23/02/2026",
    "desc": "Almoço no restaurante",
    "cat": "Alimentação",
    "account": "Conta corrente",
    "value": -41.0,
    "status": "confirmed",
    "type": "expense"
  }'
```

**Resposta:**
```json
{
  "id": 3,
  "date": "23/02/2026",
  "desc": "Almoço no restaurante",
  "cat": "Alimentação",
  "account": "Conta corrente",
  "value": -41.0,
  "status": "confirmed",
  "type": "expense",
  "created_at": "2026-02-23T13:35:00"
}
```

**Campos obrigatórios:**
- `date`: Data no formato "DD/MM/YYYY"
- `desc`: Descrição da transação (mínimo 3 caracteres)
- `cat`: Categoria
- `account`: Conta (ex: "Conta corrente")
- `value`: Valor numérico (negativo para saída, positivo para entrada)
- `status`: "pending" ou "confirmed"
- `type`: "income" (entrada) ou "expense" (saída)

---

### 3. Deletar transação

```bash
curl -X DELETE http://127.0.0.1:8000/transactions/3
```

**Resposta:**
```json
{"ok": true}
```

---

### 4. Obter dashboard (resumo)

```bash
curl http://127.0.0.1:8000/dashboard
```

**Resposta:**
```json
{
  "total": 1000.0,
  "incomes": 1000.0,
  "expenses": -250.0,
  "counts": {
    "pending": 0,
    "confirmed": 2
  }
}
```

**Campos:**
- `total`: Saldo líquido (incomes + expenses)
- `incomes`: Soma de todas as entradas
- `expenses`: Soma de todas as saídas (negativa)
- `counts.pending`: Número de transações pendentes
- `counts.confirmed`: Número de transações confirmadas

---

## 🗄️ Banco de Dados

O banco SQLite é criado automaticamente ao iniciar a aplicação:

```
backend/transactions.db
```

Para resetar o banco, basta deletar o arquivo:

```bash
rm backend/transactions.db
```

---

## 🔗 Integração Frontend

### Configurar variável de ambiente

No arquivo `.env` (ou `.env.local`) do frontend:

```env
VITE_API_URL=http://localhost:8000
```

### Como já está configurado em `App.tsx`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const financeData = useFinanceData(initialTransactions, API_BASE);
```

O hook `useFinanceData` automaticamente:
- Carrega transações ao montar (GET /transactions)
- Envia ao backend ao criar (POST /transactions)
- Deleta via API (DELETE /transactions/{id})
- Atualiza dashboard após criar transação (GET /dashboard)

---

## ✅ Teste Automático da Lógica

Para validar a lógica sem rodar uvicorn, execute:

```bash
python3 backend/test_backend_mock.py
```

Este teste verifica:
- ✓ Listar transações vazias
- ✓ Dashboard vazio
- ✓ Criar entrada (income)
- ✓ Criar saída (expense)
- ✓ Listar com ordenação
- ✓ Dashboard com dados
- ✓ Criar com status pending
- ✓ Deletar transação
- ✓ Atualizar dashboard após delete

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"

**Solução:** Instalar dependências

```bash
pip install -r backend/requirements.txt
```

### "Address already in use"

A porta 8000 já está em uso. Use outra:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

### Erro de CORS no frontend

O backend já permite CORS para:
- http://localhost:5173
- http://localhost:3000
- *

Se precisar adicionar outro domínio, edite `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["seu-dominio.com"],  # Adicione aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📝 Estrutura de Arquivos

```
focus-finan/
├── backend/
│   ├── main.py              # Aplicação FastAPI com endpoints
│   ├── models.py            # Modelo Transaction (SQLAlchemy)
│   ├── database.py          # Configuração SQLite
│   ├── requirements.txt      # Dependências Python
│   ├── test_backend_mock.py  # Testes da lógica
│   └── README.md            # Este arquivo
├── src/
│   ├── hooks/
│   │   └── useFinanceData.ts # Hook que integra com a API
│   ├── App.tsx              # Modal de nova transação
│   └── ...
```

---

## 🎯 Fluxo Completo

1. **Backend inicia** → cria banco SQLite
2. **Frontend carrega** → busca transações via `GET /transactions`
3. **Usuário clica "NOVO"** → modal abre
4. **Usuário preenche e salva** → `POST /transactions` envia para backend
5. **Transação criada** → frontend busca `GET /dashboard` para atualizar resumo
6. **Dashboard atualiza** → exibe totais, categorias, status

---

## 🚀 Deploy em Produção

Para usar em produção, substitua uvicorn por gunicorn:

```bash
pip install gunicorn
gunicorn backend.main:app -w 4 --host 0.0.0.0 --port 8000
```

---

**✨ Sistema completo e pronto para usar!**
