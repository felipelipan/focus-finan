import { useState, useCallback } from 'react';
import { callGemini, analyzeFinanceData, categorizeTransaction } from '../utils/gemini-api';

export const useAI = (apiKey: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFinance = useCallback(async (summary: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await analyzeFinanceData(summary, apiKey);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao analisar dados financeiros';
      setError(errorMsg);
      console.error('AI Analysis Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const categorize = useCallback(async (description: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const category = await categorizeTransaction(description, apiKey);
      return category;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao categorizar transação';
      setError(errorMsg);
      console.error('AI Categorization Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isLoading,
    error,
    analyzeFinance,
    categorize,
    clearError
  };
};
