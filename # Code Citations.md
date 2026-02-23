# Code Citations

## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/Automattic/jetpack/blob/f82e58483b796596b5b7b77de2e36136d23e12b6/projects/plugins/boost/app/assets/src/js/features/error-boundary/error-boundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```


## License: unknown
https://github.com/TeaPot98/ebs-dashboard/blob/a90dcbecde1dd168703a7c87a8801c2fa89e4e2b/src/components/ErrorBoundary/ErrorBoundary.tsx

```
Vou criar um frontend completo e funcional com testes, estrutura profissional e prevenção de bugs.

## Solução Step-by-Step:

1. **Estrutura de Pastas** - Organizar componentes, hooks, utils e testes
2. **Componentes Reutilizáveis** - Refatorar código duplicado
3. **Custom Hooks** - Lógica separada da UI
4. **Validação e Tratamento de Erros** - Proteção contra bugs
5. **Testes Unitários e Integração** - Jest + React Testing Library
6. **Tipo TypeScript** - Segurança de tipos
7. **Documentação** - README com instruções

---

### /home/felipe/Programacao/focus-finan/package.json

Configuração inicial do projeto com dependências.

````json
// filepath: /home/felipe/Programacao/focus-finan/package.json
{
  "name": "focus-finan",
  "version": "1.0.0",
  "description": "Dashboard financeiro com IA",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
````

---

### /home/felipe/Programacao/focus-finan/src/types/index.ts

Definições de tipos TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/types/index.ts
export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
  createdAt?: Date;
}

export interface Category {
  name: string;
  value: number;
  color: string;
}

export interface Account {
  name: string;
  balance: number;
  projectedBalance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ViewType = 'visao-geral' | 'lancamentos' | 'fluxo' | 'relatorios';
````

---

### /home/felipe/Programacao/focus-finan/src/utils/validation.ts

Funções de validação de dados.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.desc || transaction.desc.trim().length < 3) {
    errors.push('Descrição deve ter no mínimo 3 caracteres');
  }

  if (!transaction.value || isNaN(transaction.value) || transaction.value === 0) {
    errors.push('Valor deve ser um número válido e diferente de zero');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Data inválida');
  }

  if (!transaction.cat || transaction.cat.trim().length === 0) {
    errors.push('Categoria é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(2000 + year, month - 1, day);

  return (
    date.getDay !== undefined &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== 0;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').substring(0, 255);
};
````

---

### /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts

Integração com API Gemini com retry e tratamento de erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/utils/gemini-api.ts
import axios, { AxiosError } from 'axios';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

class GeminiApiError extends Error {
  constructor(
    public statusCode?: number,
    public originalError?: any
  ) {
    super(`Gemini API Error: ${statusCode}`);
    this.name = 'GeminiApiError';
  }
}

export const callGemini = async (
  prompt: string,
  apiKey: string = import.meta.env.VITE_GEMINI_API_KEY
): Promise<string> => {
  if (!apiKey) {
    throw new GeminiApiError(undefined, 'API key não configurada');
  }

  let delay = INITIAL_DELAY;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new GeminiApiError(response.status, 'Resposta vazia da API');
      }

      return text;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      // Não fazer retry em erros de autenticação
      if (statusCode === 401 || statusCode === 403) {
        throw new GeminiApiError(statusCode, 'Credenciais inválidas');
      }

      if (i === MAX_RETRIES - 1) {
        throw new GeminiApiError(statusCode, axiosError.message);
      }

      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  throw new GeminiApiError(undefined, 'Max retries exceeded');
};

export const analyzeFinanceData = async (
  summary: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Analise estes dados financeiros de forma breve e direta (máximo 3 parágrafos). 
  Dê uma dica acionável para melhorar o fluxo de caixa. Dados: ${summary}`;
  
  return callGemini(prompt, apiKey);
};

export const categorizeTransaction = async (
  description: string,
  apiKey: string
): Promise<string> => {
  const prompt = `Baseado na descrição "${description}", responda APENAS com uma categoria financeira curta (Ex: Alimentação, Moradia, Lazer, Transporte, etc). Máximo 20 caracteres.`;
  
  const result = await callGemini(prompt, apiKey);
  return result.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim().substring(0, 20);
};
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts

Hook customizado para gerenciar dados financeiros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useFinanceData.ts
import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { validateTransaction } from '../utils/validation';

export const useFinanceData = (initialTransactions: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const validation = validateTransaction(transaction);
    
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setError(null);
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.max(0, ...transactions.map(t => t.id)) + 1,
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  }, [transactions]);

  const updateTransaction = useCallback((id: number, updates: Partial<Transaction>) => {
    const transaction = transactions.find(t => t.id === id);
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
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return true;
  }, [transactions]);

  const deleteTransaction = useCallback((id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setError(null);
  }, []);

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
````

---

### /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts

Hook para gerenciar chamadas à IA com estado.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/hooks/useAI.ts
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
````

---

### /home/felipe/Programacao/focus-finan/src/components/Card.tsx

Componente Card refatorado com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/Card.tsx
import React from 'react';
import { MoreVertical } from 'lucide-react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onMoreClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
  onMoreClick
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button
              onClick={onMoreClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              aria-label="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx

Componente SidebarItem com TypeScript.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/SidebarItem.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx

Tabela de transações refatorada.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/TransactionTable.tsx
import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  categorizingId?: number | null;
  onCategorize: (id: number, desc: string) => void;
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categorizingId,
  onCategorize,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                    {transaction.cat === 'Pendente' && (
                      <button
                        onClick={() => onCategorize(transaction.id, transaction.desc)}
                        disabled={categorizingId === transaction.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 hover:text-emerald-700 p-1"
                        aria-label="Categorizar com IA"
                      >
                        {categorizingId === transaction.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
````

---

### /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx

Componente para capturar erros.

````typescript
// filepath: /home/felipe/Programacao/focus-finan/src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.
```

