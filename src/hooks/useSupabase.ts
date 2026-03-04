import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, Conta } from '../types';
import { Categoria } from '../components/PlanoContas';

export function useSupabase() {
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [contas,       setContasState]    = useState<Conta[]>([]);
  const [categorias,   setCategoriasState]= useState<Categoria[]>([]);
  const [loading,      setLoading]        = useState(true);

  // ── Carregar tudo na inicialização ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [txRes, contasRes, catsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at'),
        supabase.from('contas').select('*').order('created_at'),
        supabase.from('categorias').select('*').order('created_at'),
      ]);
      if (txRes.data)    setTransactions(txRes.data.map(fromDB));
      if (contasRes.data) setContasState(contasRes.data.map(contaFromDB));
      if (catsRes.data)  setCategoriasState(catsRes.data);
      setLoading(false);
    }
    load();
  }, []);

  // ── Transactions ────────────────────────────────────────────────────────
  async function addTransaction(t: Omit<Transaction, 'id'>) {
    const { data } = await supabase
      .from('transactions').insert(toDB(t)).select().single();
    if (data) setTransactions(prev => [...prev, fromDB(data)]);
  }

  async function updateTransaction(t: Transaction) {
    await supabase.from('transactions').update(toDB(t)).eq('id', t.id);
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  }

  async function deleteTransaction(id: number | string) {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(x => x.id !== id));
  }

  // ── Contas ──────────────────────────────────────────────────────────────
  async function saveConta(c: Conta) {
    if ((c.id as any)?.toString().startsWith('temp')) {
      // nova
      const { data } = await supabase
        .from('contas').insert(contaToDB(c)).select().single();
      if (data) setContasState(prev => [...prev, contaFromDB(data)]);
    } else {
      await supabase.from('contas').update(contaToDB(c)).eq('id', c.id);
      setContasState(prev => prev.map(x => x.id === c.id ? c : x));
    }
  }

  async function deleteConta(id: number | string) {
    await supabase.from('contas').delete().eq('id', id);
    setContasState(prev => prev.filter(x => x.id !== id));
  }

  // ── Categorias ──────────────────────────────────────────────────────────
  async function saveCategorias(cats: Categoria[]) {
    // estratégia simples: apaga tudo e reinserge (plano de contas muda pouco)
    await supabase.from('categorias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (cats.length) await supabase.from('categorias').insert(cats.map(c => ({
      id:            c.id,
      nome:          c.nome,
      tipo:          c.tipo,
      cor:           c.cor,
      subcategorias: c.subcategorias,
    })));
    setCategoriasState(cats);
  }

  return {
    loading,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    contas: contasState, saveConta, deleteConta,
    categorias, saveCategorias,
  };
}

// ── Helpers de mapeamento ────────────────────────────────────────────────────

function toDB(t: Omit<Transaction, 'id'> | Transaction) {
  return { date: t.date, desc: t.desc, cat: t.cat, account: t.account,
           value: t.value, status: t.status, type: t.type };
}

function fromDB(row: any): Transaction {
  return { id: row.id, date: row.date, desc: row.desc, cat: row.cat,
           account: row.account, value: Number(row.value),
           status: row.status, type: row.type };
}

function contaToDB(c: Conta) {
  return { nome: c.nome, tipo: c.tipo, moeda: c.moeda,
           saldo_inicial: c.saldoInicial,
           saldo_inicial_data: c.saldoInicialData,
           saldo_inicial_tipo: c.saldoInicialTipo };
}

function contaFromDB(row: any): Conta {
  return { id: row.id, nome: row.nome, tipo: row.tipo, moeda: row.moeda,
           saldoInicial:     Number(row.saldo_inicial),
           saldoInicialData: row.saldo_inicial_data,
           saldoInicialTipo: row.saldo_inicial_tipo };
}