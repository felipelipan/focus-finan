export type ViewType = 'visao-geral' | 'lancamentos' | 'plano-contas' | 'contas';

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

export interface Conta {
  id: number;
  nome: string;
  tipo: 'corrente' | 'poupanca' | 'cartao' | 'dinheiro' | 'investimento' | 'outro';
  moeda: string;
  saldoInicial: number;
  saldoInicialData: string;
  saldoInicialTipo: 'credor' | 'devedor';
}
