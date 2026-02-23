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
