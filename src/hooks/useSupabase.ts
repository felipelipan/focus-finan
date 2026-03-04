import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction, Conta } from '../types';
import { Categoria } from '../components/PlanoContas';

// ---------------------------------------------------------------------------
// Categorias padrão — usadas como fallback se o banco estiver vazio
// ---------------------------------------------------------------------------
const initialCategorias: Categoria[] = [
  { id: 1, nome: 'Moradia',         tipo: 'despesa', cor: '#10b981', subcategorias: [
    { id: 11, nome: 'Aluguel',    cor: '#10b981' },
    { id: 12, nome: 'Energia',    cor: '#34d399' },
    { id: 13, nome: 'Água',       cor: '#6ee7b7' },
  ]},
  { id: 2, nome: 'Alimentação',     tipo: 'despesa', cor: '#fbbf24', subcategorias: [
    { id: 21, nome: 'Supermercado', cor: '#fbbf24' },
    { id: 22, nome: 'Restaurante',  cor: '#fcd34d' },
  ]},
  { id: 3, nome: 'Outras Despesas', tipo: 'despesa', cor: '#3b82f6', subcategorias: [] },
  { id: 4, nome: 'Automóvel',       tipo: 'despesa', cor: '#6366f1', subcategorias: [
    { id: 41, nome: 'Combustível',  cor: '#6366f1' },
  ]},
  { id: 5, nome: 'Vestuário',       tipo: 'despesa', cor: '#ec4899', subcategorias: [] },
  { id: 6, nome: 'Saúde',           tipo: 'despesa', cor: '#14b8a6', subcategorias: [] },
  { id: 7, nome: 'Salário',         tipo: 'receita', cor: '#22c55e', subcategorias: [] },
  { id: 8, nome: 'Outras Receitas', tipo: 'receita', cor: '#a3e635', subcategorias: [] },
];

// ---------------------------------------------------------------------------
// Helpers de mapeamento banco ↔ TypeScript
// ---------------------------------------------------------------------------

function txFromDB(row: any): Transaction {
  return {
    id:      row.id,
    date:    row.date,
    desc:    row.descricao,   // coluna no banco é 'descricao'
    cat:     row.cat,
    account: row.account,
    value:   Number(row.value),
    status:  row.status,
    type:    row.type,
  };
}

function txToDB(t: Omit<Transaction, 'id'>) {
  return {
    date:      t.date,
    descricao: t.desc,        // coluna no banco é 'descricao'
    cat:       t.cat,
    account:   t.account,
    value:     t.value,
    status:    t.status,
    type:      t.type,
  };
}

function contaFromDB(row: any): Conta {
  return {
    id:               row.id,
    nome:             row.nome,
    tipo:             row.tipo,
    moeda:            row.moeda,
    saldoInicial:     Number(row.saldo_inicial),
    saldoInicialData: row.saldo_inicial_data,
    saldoInicialTipo: row.saldo_inicial_tipo,
  };
}

function contaToDB(c: Omit<Conta, 'id'>) {
  return {
    nome:               c.nome,
    tipo:               c.tipo,
    moeda:              c.moeda,
    saldo_inicial:      c.saldoInicial,
    saldo_inicial_data: c.saldoInicialData,
    saldo_inicial_tipo: c.saldoInicialTipo,
  };
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

export function useSupabase() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contas,       setContas]       = useState<Conta[]>([]);
  const [categorias,   setCategorias]   = useState<Categoria[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // ── Carrega tudo na inicialização ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [txRes, contasRes, catsRes] = await Promise.all([
          supabase.from('transactions').select('*').order('created_at'),
          supabase.from('contas').select('*').order('created_at'),
          supabase.from('categorias').select('*').order('created_at'),
        ]);

        if (txRes.error)    throw txRes.error;
        if (contasRes.error) throw contasRes.error;
        if (catsRes.error)  throw catsRes.error;

        setTransactions((txRes.data ?? []).map(txFromDB));
        setContas((contasRes.data ?? []).map(contaFromDB));

        // Se não há categorias no banco, insere as padrão
        if ((catsRes.data ?? []).length === 0) {
          const { data: inserted } = await supabase
            .from('categorias')
            .insert(initialCategorias.map(c => ({
              nome:          c.nome,
              tipo:          c.tipo,
              cor:           c.cor,
              subcategorias: c.subcategorias,
            })))
            .select();
          if (inserted) {
            setCategorias(inserted.map(r => ({
              id: r.id, nome: r.nome, tipo: r.tipo, cor: r.cor,
              subcategorias: r.subcategorias ?? [],
            })));
          }
        } else {
          setCategorias(catsRes.data!.map(r => ({
            id:            r.id,
            nome:          r.nome,
            tipo:          r.tipo,
            cor:           r.cor,
            subcategorias: r.subcategorias ?? [],
          })));
        }
      } catch (e: any) {
        console.error('Supabase load error:', e);
        setError('Erro ao conectar com o banco de dados.');
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Transactions ──────────────────────────────────────────────────────────

  async function addTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(txToDB(t))
      .select()
      .single();
    if (error) { console.error(error); return null; }
    const nova = txFromDB(data);
    setTransactions(prev => [...prev, nova]);
    return nova;
  }

  async function addTransactions(list: Omit<Transaction, 'id'>[]): Promise<void> {
    if (list.length === 0) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert(list.map(txToDB))
      .select();
    if (error) { console.error(error); return; }
    setTransactions(prev => [...prev, ...(data ?? []).map(txFromDB)]);
  }

  async function updateTransaction(t: Transaction): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update(txToDB(t))
      .eq('id', t.id);
    if (error) { console.error(error); return; }
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  }

  async function deleteTransaction(id: number | string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) { console.error(error); return; }
    setTransactions(prev => prev.filter(x => x.id !== id));
  }

  // ── Contas ────────────────────────────────────────────────────────────────

  async function addConta(c: Omit<Conta, 'id'>): Promise<void> {
    const { data, error } = await supabase
      .from('contas')
      .insert(contaToDB(c))
      .select()
      .single();
    if (error) { console.error(error); return; }
    setContas(prev => [...prev, contaFromDB(data)]);
  }

  async function updateConta(c: Conta): Promise<void> {
    const { error } = await supabase
      .from('contas')
      .update(contaToDB(c))
      .eq('id', c.id);
    if (error) { console.error(error); return; }
    setContas(prev => prev.map(x => x.id === c.id ? c : x));
  }

  async function deleteConta(id: number | string): Promise<void> {
    const { error } = await supabase
      .from('contas')
      .delete()
      .eq('id', id);
    if (error) { console.error(error); return; }
    setContas(prev => prev.filter(x => x.id !== id));
  }

  // ── Categorias ────────────────────────────────────────────────────────────

  async function saveCategorias(cats: Categoria[]): Promise<void> {
    // Apaga todas as categorias existentes
    await supabase.from('categorias').delete().gte('id', 0);

    if (cats.length > 0) {
      // Não envia o id — o banco gera automaticamente via serial/sequence
      const { error } = await supabase.from('categorias').insert(
        cats.map(c => ({
          nome:          c.nome,
          tipo:          c.tipo,
          cor:           c.cor,
          subcategorias: c.subcategorias,
        }))
      );
      if (error) {
        console.error('Erro ao salvar categorias:', error);
        return;
      }
      // Recarrega do banco para pegar os IDs reais gerados
      const { data } = await supabase.from('categorias').select('*').order('created_at');
      if (data) {
        setCategorias(data.map(r => ({
          id:            r.id,
          nome:          r.nome,
          tipo:          r.tipo,
          cor:           r.cor,
          subcategorias: r.subcategorias ?? [],
        })));
      }
    } else {
      setCategorias([]);
    }
  }

  return {
    loading,
    error,
    // transactions
    transactions,
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
    // contas
    contas,
    addConta,
    updateConta,
    deleteConta,
    // categorias
    categorias,
    saveCategorias,
  };
}
