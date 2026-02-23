import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';
import axios from 'axios';

export const useFinanceData = (initialTransactions: Transaction[], apiBaseUrl?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!apiBaseUrl) return;
    setIsLoading(true);
    axios
      .get(`${apiBaseUrl.replace(/\/$/, '')}/transactions`)
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(String(err)))
      .finally(() => setIsLoading(false));
  }, [apiBaseUrl]);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
      const validation = validateTransaction(transaction);

      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return false;
      }

      setError(null);

      if (apiBaseUrl) {
        try {
          const res = await axios.post(`${apiBaseUrl.replace(/\/$/, '')}/transactions`, transaction);
          setTransactions((prev) => [res.data, ...prev]);
          return true;
        } catch (err: any) {
          setError(err?.message || 'Erro ao criar transação');
          return false;
        }
      }

      const newTransaction: Transaction = {
        ...transaction,
        id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
        createdAt: new Date()
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      return true;
    },
    [transactions, apiBaseUrl]
  );

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) {
      setError('Lançamento não encontrado');
      return false;
    }

    const updated = { ...transaction, ...updates };
    const validation = validateTransaction(updated);

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback(
    async (id: number) => {
      if (apiBaseUrl) {
        try {
          await axios.delete(`${apiBaseUrl.replace(/\/$/, '')}/transactions/${id}`);
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          setError(null);
          return true;
        } catch (err: any) {
          setError(err?.message || 'Erro ao deletar');
          return false;
        }
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setError(null);
      return true;
    },
    [apiBaseUrl]
  );

  const getTransactionsByStatus = useCallback((status: Transaction['status']) => {
    return transactions.filter(t => t.status === status);
  }, [transactions]);

  const getTotalBalance = useCallback(() => {
    return transactions.reduce((sum, t) => sum + t.value, 0);
  }, [transactions]);

  const clearError = useCallback(() => setError(null), []);

  return {
    transactions,
    error,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByStatus,
    getTotalBalance,
    clearError,
    setLoading: setIsLoading
  };
};
