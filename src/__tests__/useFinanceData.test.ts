import { renderHook, act } from '@testing-library/react';
import { useFinanceData } from '../hooks/useFinanceData';
import { Transaction } from '../types';

const mockTransactions: Transaction[] = [
  {
    id: 1,
    date: '20/02/26',
    desc: 'Teste',
    cat: 'Alimentação',
    account: 'Conta corrente',
    value: 100,
    status: 'confirmed',
    type: 'income'
  }
];

describe('useFinanceData', () => {
  it('deve inicializar com transações', () => {
    const { result } = renderHook(() => useFinanceData(mockTransactions));
    expect(result.current.transactions).toHaveLength(1);
  });

  it('deve adicionar transação válida', () => {
    const { result } = renderHook(() => useFinanceData(mockTransactions));

    act(() => {
      result.current.addTransaction({
        date: '21/02/26',
        desc: 'Nova transação',
        cat: 'Lazer',
        account: 'Conta corrente',
        value: 50,
        status: 'pending',
        type: 'expense'
      });
    });

    expect(result.current.transactions).toHaveLength(2);
  });

  it('deve rejeitar transação inválida', () => {
    const { result } = renderHook(() => useFinanceData(mockTransactions));

    act(() => {
      result.current.addTransaction({
        date: '21/02/26',
        desc: 'AB', // muito curta
        cat: 'Lazer',
        account: 'Conta corrente',
        value: 50,
        status: 'pending',
        type: 'expense'
      });
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.error).toBeTruthy();
  });

  it('deve deletar transação', () => {
    const { result } = renderHook(() => useFinanceData(mockTransactions));

    act(() => {
      result.current.deleteTransaction(1);
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('deve filtrar por status', () => {
    const { result } = renderHook(() =>
      useFinanceData([
        ...mockTransactions,
        {
          id: 2,
          date: '20/02/26',
          desc: 'Teste2',
          cat: 'Alimentação',
          account: 'Conta corrente',
          value: 50,
          status: 'pending',
          type: 'expense'
        }
      ])
    );

    const pending = result.current.getTransactionsByStatus('pending');
    expect(pending).toHaveLength(1);
  });

  it('deve calcular saldo total', () => {
    const { result } = renderHook(() =>
      useFinanceData([
        mockTransactions[0],
        { ...mockTransactions[0], id: 2, value: -50 }
      ])
    );

    expect(result.current.getTotalBalance()).toBe(50);
  });
});
