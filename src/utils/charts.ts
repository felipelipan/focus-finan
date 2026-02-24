import { Transaction } from '../types';

export const CHART_COLORS = ['#10b981', '#3b82f6', '#fbbf24', '#ef4444', '#ec4899', '#f97316', '#6366f1'];

const parseDate = (d: string) => {
  const parts = d.split('/');
  if (parts.length < 3) return new Date(d);
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  let year = Number(parts[2]);
  if (year < 100) year += 2000;
  return new Date(year, month, day);
};

export function getCategoryTotals(transactions: Transaction[], type: 'income' | 'expense', preset: string | null = 'all') {
  let from: Date | null = null;
  const now = new Date();

  if (preset === '7') from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  if (preset === '30') from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

  const map = new Map<string, { name: string; value: number }>();

  transactions.forEach((t) => {
    if (t.type !== type) return;
    const dt = parseDate(t.date);
    if (from && dt < from) return;

    const key = t.cat || (type === 'income' ? 'Outras Receitas' : 'Outras Despesas');
    const prev = map.get(key) || { name: key, value: 0 };
    prev.value += Math.abs(Number(t.value || 0));
    map.set(key, prev);
  });

  const arr = Array.from(map.values()).sort((a, b) => b.value - a.value);
  const tot = arr.reduce((s, c) => s + c.value, 0);

  return arr.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length], percent: tot ? (c.value / tot) * 100 : 0 }));
}

export function groupTransactionsByMonth(transactions: Transaction[], preset: string | null = 'all') {
  let from: Date | null = null;
  const now = new Date();
  if (preset === '3') from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  if (preset === '6') from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  if (preset === '12') from = new Date(now.getFullYear(), now.getMonth() - 12, 1);

  const map = new Map<string, { name: string; income: number; expense: number; sortKey: number }>();
  transactions.forEach((t) => {
    const dt = parseDate(t.date);
    if (from && dt < from) return;
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (!map.has(key)) map.set(key, { name: dt.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }), income: 0, expense: 0, sortKey: new Date(dt.getFullYear(), dt.getMonth(), 1).getTime() });
    const entry = map.get(key)!;
    if (t.type === 'income') entry.income += Number(t.value || 0);
    else entry.expense += Math.abs(Number(t.value || 0));
  });

  const arr = Array.from(map.values()).sort((a: any, b: any) => a.sortKey - b.sortKey).map(({ sortKey, ...rest }) => rest);
  return arr;
}
