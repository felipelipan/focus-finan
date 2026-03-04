import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, Conta } from '../types';
import { Categoria } from '../components/PlanoContas';

const initialCategorias = [
  { nome: 'Moradia',         tipo: 'despesa', cor: '#10b981', subcategorias: [
    { id: 11, nome: 'Aluguel', cor: '#10b981' },
    { id: 12, nome: 'Energia', cor: '#34d399' },
    { id: 13, nome: 'Água',    cor: '#6ee7b7' },
  ]},
  { nome: 'Alimentação',     tipo: 'despesa', cor: '#fbbf24', subcategorias: [
    { id: 21, nome: 'Supermercado', cor: '#fbbf24' },
    { id: 22, nome: 'Restaurante',  cor: '#fcd34d' },
  ]},
  { nome: 'Outras Despesas', tipo: 'despesa', cor: '#3b82f6', subcategorias: [] },
  { nome: 'Automóvel',       tipo: 'despesa', cor: '#6366f1', subcategorias: [
    { id: 41, nome: 'Combustível', cor: '#6366f1' },
  ]},
  { nome: 'Vestuário',       tipo: 'despesa', cor: '#ec4899', subcategorias: [] },
  { nome: 'Saúde',           tipo: 'despesa', cor: '#14b8a6', subcategorias: [] },
  { nome: 'Salário',         tipo: 'receita', cor: '#22c55e', subcategorias: [] },
  { nome: 'Outras Receitas', tipo: 'receita', cor: '#a3e635', subcategorias: [] },
];

function txFromDB(row: any): Transaction {
  return { id: row.id, date: row.date, desc: row.descricao, cat: row.cat,
           account: row.account, value: Number(row.value), status: row.status, type: row.type };
}
function txToDB(t: Omit<Transaction, 'id'>, userId: string) {
  return { date: t.date, descricao: t.desc, cat: t.cat, account: t.account,
           value: t.value, status: t.status, type: t.type, user_id: userId };
}
function contaFromDB(row: any): Conta {
  return { id: row.id, nome: row.nome, tipo: row.tipo, moeda: row.moeda,
           saldoInicial: Number(row.saldo_inicial), saldoInicialData: row.saldo_inicial_data,
           saldoInicialTipo: row.saldo_inicial_tipo };
}
function contaToDB(c: Omit<Conta, 'id'>, userId: string) {
  return { nome: c.nome, tipo: c.tipo, moeda: c.moeda, saldo_inicial: c.saldoInicial,
           saldo_inicial_data: c.saldoInicialData, saldo_inicial_tipo: c.saldoInicialTipo,
           user_id: userId };
}

export function useSupabase() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contas,       setContas]       = useState<Conta[]>([]);
  const [categorias,   setCategorias]   = useState<Categoria[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [userName,     setUserName]     = useState<string>('');

  // ── Sessão ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      const name = data.session?.user?.user_metadata?.name ?? data.session?.user?.email ?? '';
      setUserId(uid);
      setUserName(name);
      if (uid) loadData(uid);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      const name = session?.user?.user_metadata?.name ?? session?.user?.email ?? '';
      setUserId(uid);
      setUserName(name);
      if (uid) loadData(uid);
      else {
        setTransactions([]); setContas([]); setCategorias([]);
        setLoading(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadData(uid: string) {
    setLoading(true);
    try {
      const [txRes, contasRes, catsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', uid).order('created_at'),
        supabase.from('contas').select('*').eq('user_id', uid).order('created_at'),
        supabase.from('categorias').select('*').eq('user_id', uid).order('created_at'),
      ]);
      if (txRes.error)     throw txRes.error;
      if (contasRes.error) throw contasRes.error;
      if (catsRes.error)   throw catsRes.error;

      setTransactions((txRes.data ?? []).map(txFromDB));
      setContas((contasRes.data ?? []).map(contaFromDB));

      if ((catsRes.data ?? []).length === 0) {
        // Primeira vez — seed categorias padrão
        const { data: inserted } = await supabase
          .from('categorias')
          .insert(initialCategorias.map(c => ({ ...c, user_id: uid })))
          .select();
        if (inserted) setCategorias(inserted.map(r => ({
          id: r.id, nome: r.nome, tipo: r.tipo, cor: r.cor, subcategorias: r.subcategorias ?? [],
        })));
      } else {
        setCategorias(catsRes.data!.map(r => ({
          id: r.id, nome: r.nome, tipo: r.tipo, cor: r.cor, subcategorias: r.subcategorias ?? [],
        })));
      }
    } catch (e: any) {
      console.error('Supabase load error:', e);
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  const logout = () => supabase.auth.signOut();

  // ── Transactions ─────────────────────────────────────────────────────────
  async function addTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    if (!userId) return null;
    const { data, error } = await supabase.from('transactions').insert(txToDB(t, userId)).select().single();
    if (error) { console.error(error); return null; }
    const nova = txFromDB(data);
    setTransactions(prev => [...prev, nova]);
    return nova;
  }

  async function addTransactions(list: Omit<Transaction, 'id'>[]): Promise<void> {
    if (!userId || list.length === 0) return;
    const { data, error } = await supabase.from('transactions').insert(list.map(t => txToDB(t, userId))).select();
    if (error) { console.error(error); return; }
    setTransactions(prev => [...prev, ...(data ?? []).map(txFromDB)]);
  }

  async function updateTransaction(t: Transaction): Promise<void> {
    if (!userId) return;
    const { error } = await supabase.from('transactions').update(txToDB(t, userId)).eq('id', t.id);
    if (error) { console.error(error); return; }
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  }

  async function deleteTransaction(id: number | string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setTransactions(prev => prev.filter(x => x.id !== id));
  }

  // ── Contas ────────────────────────────────────────────────────────────────
  async function addConta(c: Omit<Conta, 'id'>): Promise<void> {
    if (!userId) return;
    const { data, error } = await supabase.from('contas').insert(contaToDB(c, userId)).select().single();
    if (error) { console.error(error); return; }
    setContas(prev => [...prev, contaFromDB(data)]);
  }

  async function updateConta(c: Conta): Promise<void> {
    if (!userId) return;
    const { error } = await supabase.from('contas').update(contaToDB(c, userId)).eq('id', c.id);
    if (error) { console.error(error); return; }
    setContas(prev => prev.map(x => x.id === c.id ? c : x));
  }

  async function deleteConta(id: number | string): Promise<void> {
    const { error } = await supabase.from('contas').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setContas(prev => prev.filter(x => x.id !== id));
  }

  // ── Categorias ────────────────────────────────────────────────────────────
  async function saveCategorias(cats: Categoria[]): Promise<void> {
    if (!userId) return;
    await supabase.from('categorias').delete().eq('user_id', userId);
    if (cats.length > 0) {
      const { error } = await supabase.from('categorias').insert(
        cats.map(c => ({ nome: c.nome, tipo: c.tipo, cor: c.cor, subcategorias: c.subcategorias, user_id: userId }))
      );
      if (error) { console.error('Erro ao salvar categorias:', error); return; }
      const { data } = await supabase.from('categorias').select('*').eq('user_id', userId).order('created_at');
      if (data) setCategorias(data.map(r => ({
        id: r.id, nome: r.nome, tipo: r.tipo, cor: r.cor, subcategorias: r.subcategorias ?? [],
      })));
    } else {
      setCategorias([]);
    }
  }

  return {
    loading, error, userId, userName, logout,
    transactions, addTransaction, addTransactions, updateTransaction, deleteTransaction,
    contas, addConta, updateConta, deleteConta,
    categorias, saveCategorias,
  };
}
