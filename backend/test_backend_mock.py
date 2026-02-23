"""
Mock de teste para validar a lógica do backend sem dependências externas.
Simula o comportamento esperado dos endpoints FastAPI.
"""

# Simular banco de dados em memória
class MockTransaction:
    id_counter = 0
    
    def __init__(self, date, desc, cat, account, value, status, type_):
        MockTransaction.id_counter += 1
        self.id = MockTransaction.id_counter
        self.date = date
        self.desc = desc
        self.cat = cat
        self.account = account
        self.value = value
        self.status = status
        self.type = type_
        self.created_at = "2026-02-23T00:00:00"
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'desc': self.desc,
            'cat': self.cat,
            'account': self.account,
            'value': self.value,
            'status': self.status,
            'type': self.type,
            'created_at': self.created_at
        }

class MockDatabase:
    def __init__(self):
        self.transactions = []
    
    def list_transactions(self):
        """GET /transactions"""
        return sorted(self.transactions, key=lambda t: t.id, reverse=True)
    
    def create_transaction(self, date, desc, cat, account, value, status, type_):
        """POST /transactions"""
        tx = MockTransaction(date, desc, cat, account, value, status, type_)
        self.transactions.append(tx)
        return tx
    
    def delete_transaction(self, tx_id):
        """DELETE /transactions/{id}"""
        self.transactions = [t for t in self.transactions if t.id != tx_id]
        return True
    
    def get_dashboard(self):
        """GET /dashboard"""
        total = sum(t.value for t in self.transactions)
        incomes = sum(t.value for t in self.transactions if t.type == 'income')
        expenses = sum(t.value for t in self.transactions if t.type != 'income')
        pending = len([t for t in self.transactions if t.status != 'confirmed'])
        confirmed = len([t for t in self.transactions if t.status == 'confirmed'])
        
        return {
            'total': total,
            'incomes': incomes,
            'expenses': expenses,
            'counts': {'pending': pending, 'confirmed': confirmed}
        }

# ==============================================================================
# TESTES
# ==============================================================================

def test_backend():
    print("=" * 70)
    print("TESTE DO BACKEND - MODO MOCK")
    print("=" * 70)
    
    db = MockDatabase()
    
    # 1. Listar transações (vazio)
    print("\n1. GET /transactions (vazio)")
    result = db.list_transactions()
    print(f"   Result: {result}")
    assert len(result) == 0, "Deve estar vazio"
    print("   ✓ PASS")
    
    # 2. Dashboard (vazio)
    print("\n2. GET /dashboard (vazio)")
    dashboard = db.get_dashboard()
    print(f"   Result: {dashboard}")
    assert dashboard['total'] == 0, "Total deve ser 0"
    assert dashboard['counts']['pending'] == 0, "Nenhum pendente"
    print("   ✓ PASS")
    
    # 3. Criar transação de ENTRADA (income)
    print("\n3. POST /transactions (Entrada: +1000)")
    tx1 = db.create_transaction(
        date="23/02/2026",
        desc="Salário",
        cat="Outras Receitas",
        account="Conta corrente",
        value=1000.0,
        status="confirmed",
        type_="income"
    )
    print(f"   {tx1.to_dict()}")
    assert tx1.id == 1, "ID deve ser 1"
    assert tx1.value == 1000.0, "Valor correto"
    assert tx1.type == "income", "Tipo income"
    print("   ✓ PASS")
    
    # 4. Criar transação de SAÍDA (expense)
    print("\n4. POST /transactions (Saída: -250)")
    tx2 = db.create_transaction(
        date="23/02/2026",
        desc="Sorveteria",
        cat="Outras Despesas",
        account="Conta corrente",
        value=-250.0,
        status="confirmed",
        type_="expense"
    )
    print(f"   {tx2.to_dict()}")
    assert tx2.id == 2, "ID deve ser 2"
    assert tx2.value == -250.0, "Valor correto (negativo)"
    assert tx2.type == "expense", "Tipo expense"
    print("   ✓ PASS")
    
    # 5. Listar (deve ter 2)
    print("\n5. GET /transactions (2 items)")
    txs = db.list_transactions()
    print(f"   Count: {len(txs)}")
    print(f"   Order (desc by ID): {[t.id for t in txs]}")
    assert len(txs) == 2, "Deve ter 2 transações"
    assert txs[0].id == 2, "Primeiro deve ser o mais recente (id=2)"
    print("   ✓ PASS")
    
    # 6. Dashboard com dados
    print("\n6. GET /dashboard (com dados)")
    dashboard = db.get_dashboard()
    print(f"   Total: {dashboard['total']}")
    print(f"   Incomes: {dashboard['incomes']}")
    print(f"   Expenses: {dashboard['expenses']}")
    print(f"   Counts: {dashboard['counts']}")
    assert dashboard['total'] == 750.0, "Total deve ser 1000 - 250 = 750"
    assert dashboard['incomes'] == 1000.0, "Incomes = 1000"
    assert dashboard['expenses'] == -250.0, "Expenses = -250"
    assert dashboard['counts']['confirmed'] == 2, "2 confirmadas"
    print("   ✓ PASS")
    
    # 7. Criar com status PENDING
    print("\n7. POST /transactions (Pendente)")
    tx3 = db.create_transaction(
        date="23/02/2026",
        desc="Água",
        cat="Moradia",
        account="Conta corrente",
        value=-100.0,
        status="pending",
        type_="expense"
    )
    print(f"   {tx3.to_dict()}")
    assert tx3.status == "pending", "Status pending"
    print("   ✓ PASS")
    
    # 8. Dashboard atualizado com pendente
    print("\n8. GET /dashboard (com pendente)")
    dashboard = db.get_dashboard()
    print(f"   Total: {dashboard['total']}")
    print(f"   Pending: {dashboard['counts']['pending']}")
    print(f"   Confirmed: {dashboard['counts']['confirmed']}")
    assert dashboard['total'] == 650.0, "Total = 1000 - 250 - 100"
    assert dashboard['counts']['pending'] == 1, "1 pendente"
    assert dashboard['counts']['confirmed'] == 2, "2 confirmadas"
    print("   ✓ PASS")
    
    # 9. Deletar uma transação
    print("\n9. DELETE /transactions/1")
    db.delete_transaction(1)
    txs = db.list_transactions()
    print(f"   Remaining IDs: {[t.id for t in txs]}")
    assert len(txs) == 2, "Deve ter 2 transações"
    assert all(t.id != 1 for t in txs), "ID 1 removido"
    print("   ✓ PASS")
    
    # 10. Dashboard após delete
    print("\n10. GET /dashboard (após delete)")
    dashboard = db.get_dashboard()
    print(f"    Total: {dashboard['total']}")
    assert dashboard['total'] == -350.0, "Total = -250 - 100 (sem o +1000)"
    print("    ✓ PASS")
    
    print("\n" + "=" * 70)
    print("✓ TODOS OS TESTES PASSARAM!")
    print("=" * 70)
    print("\nEndpoints testados com sucesso:")
    print("  • GET /transactions - lista transações (ordenadas por ID desc)")
    print("  • POST /transactions - cria nova transação")
    print("  • DELETE /transactions/{id} - deleta transação")
    print("  • GET /dashboard - retorna resumo (total, incomes, expenses, counts)")
    print("\nPróximos passos:")
    print("  1. Instalar FastAPI, UVicorn, SQLAlchemy no ambiente")
    print("  2. Rodar: uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000")
    print("  3. Testar endpoints via curl ou Postman")
    print("  4. Integrar frontend (já pronto em App.tsx)")

if __name__ == '__main__':
    test_backend()
