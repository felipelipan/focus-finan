export type ViewType = 'visao-geral' | 'lancamentos' | 'plano-contas';

export interface Transaction {
  id: number;
  date: string;
  desc: string;
  cat: string;
  account: string;
  value: number;
  status: 'confirmed' | 'pending' | 'scheduled' | 'reconciled';
  type: 'income' | 'expense';
}
