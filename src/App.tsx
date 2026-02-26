import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Search,
  Bell,
  Plus,
  ChevronDown,
  X,
  Filter,
  Download,
  Printer,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  BookOpen,
  Menu,
  Building2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

import { Card } from './components/Card';
import { SidebarItem } from './components/SidebarItem';
import { TransactionTable } from './components/TransactionTable';
import { PlanoContas, Categoria } from './components/PlanoContas';
import { CadastroContas } from './components/CadastroContas';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFinanceData } from './hooks/useFinanceData';
import { ViewType, Transaction, Conta } from './types';

// Categorias padrão iniciais
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
  { id: 6, nome: 'Bem Estar',       tipo: 'despesa', cor: '#f97316', subcategorias: [] },
  { id: 7, nome: 'Outras Receitas', tipo: 'receita', cor: '#10b981', subcategorias: [] },
  { id: 8, nome: 'Salário',         tipo: 'receita', cor: '#3b82f6', subcategorias: [] },
  { id: 9, nome: 'Transferência',   tipo: 'receita', cor: '#8b5cf6', subcategorias: [] },
];
import axios from 'axios';

// ---------------------------------------------------------------------------
// Dados estáticos
// ---------------------------------------------------------------------------


const initialTransactions: Transaction[] = [
  { id: 1, date: '19/02/26', desc: 'SALDO', cat: 'Outras Receitas', account: 'Conta corrente', value: 538.18, status: 'confirmed', type: 'income' },
  { id: 2, date: '20/02/26', desc: 'SORVETERIA', cat: 'Outras Despesas', account: 'Conta corrente', value: -250.0, status: 'confirmed', type: 'expense' },
  { id: 3, date: '20/02/26', desc: 'ADIANTAMENTO - Escritório', cat: 'Outras Receitas', account: 'Conta corrente', value: 3200.0, status: 'confirmed', type: 'income' },
  { id: 4, date: '20/02/26', desc: 'Almoço Restaurante', cat: 'Alimentação', account: 'Conta corrente', value: -41.0, status: 'confirmed', type: 'expense' },
  { id: 5, date: '20/02/26', desc: 'COMBUSTÍVEL', cat: 'Automóvel', account: 'Conta corrente', value: -20.0, status: 'confirmed', type: 'expense' },
  { id: 6, date: '21/02/26', desc: 'MERCADO-ZEBOLA', cat: 'Alimentação', account: 'Conta corrente', value: -539.0, status: 'confirmed', type: 'expense' },
  { id: 7, date: '21/02/26', desc: 'ENERGIA', cat: 'Moradia', account: 'Conta corrente', value: -708.99, status: 'confirmed', type: 'expense' },
  { id: 8, date: '20/02/26', desc: 'AGUA', cat: 'Pendente', account: 'Conta corrente', value: -100.0, status: 'pending', type: 'expense' },
  { id: 9, date: '20/02/26', desc: 'AR-CONDICIONADO 11/12', cat: 'Pendente', account: 'Conta corrente', value: -275.0, status: 'pending', type: 'expense' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(d: string): Date {
  const parts = d.split('/');
  if (parts.length < 3) return new Date(d);
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  let year = Number(parts[2]);
  if (year < 100) year += 2000;
  return new Date(year, month, day);
}

function groupByDate(transactions: Transaction[]) {
  const map = new Map<string, number>();

  transactions.forEach((t) => {
    const atual = map.get(t.date) ?? 0;
    map.set(t.date, atual + Number(t.value || 0));
  });

  const sorted = Array.from(map.entries())
    .map(([name, raw]) => ({ name, raw }))
    .sort((a, b) => parseDate(a.name).getTime() - parseDate(b.name).getTime());

  let acumulado = 0;
  return sorted.map((item) => {
    acumulado += item.raw;
    return {
      name: item.name,
      saldo: acumulado >= 0 ? acumulado : null,
      saldoNegativo: acumulado < 0 ? acumulado : null,
      saldoTotal: acumulado,
    };
  });
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte YYYY-MM-DD (input date) → DD/MM/YY (formato interno)
function isoToBR(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${String(year).slice(-2)}`;
}

function getSaldoPorConta(transactions: Transaction[]) {
  const map = new Map<string, number>();
  transactions.forEach((t) => {
    const atual = map.get(t.account) ?? 0;
    map.set(t.account, atual + Number(t.value || 0));
  });
  return Array.from(map.entries()).map(([conta, saldo]) => ({ conta, saldo }));
}

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#fbbf24', '#ec4899',
  '#f97316', '#6366f1', '#14b8a6', '#8b5cf6',
];

function getCategorySummary(
  transactions: Transaction[],
  type: 'expense' | 'income',
  categorias: Categoria[] = []
) {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const atual = map.get(t.cat) ?? 0;
      map.set(t.cat, atual + Math.abs(Number(t.value || 0)));
    });

  const total = Array.from(map.values()).reduce((a, b) => a + b, 0);

  return Array.from(map.entries())
    .map(([name, amount], i) => {
      // Busca a cor cadastrada no plano de contas
      const catCadastrada = categorias.find(c => c.nome === name);
      // Ou procura em subcategorias
      let cor = catCadastrada?.cor ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      if (!catCadastrada) {
        for (const c of categorias) {
          const sub = c.subcategorias.find(s => s.nome === name);
          if (sub) { cor = sub.cor; break; }
        }
      }
      return {
        name,
        amount,
        value: total > 0 ? (amount / total) * 100 : 0,
        color: cor,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

// ---------------------------------------------------------------------------
// Formulário de nova transação
// ---------------------------------------------------------------------------

interface NewTransactionFormProps {
  onCancel: () => void;
  onCreate: (data: any) => Promise<void>;
  categorias: Categoria[];
}

function NewTransactionForm({ onCancel, onCreate, categorias }: NewTransactionFormProps): JSX.Element {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    desc: '',
    cat: '',
    type: 'expense',
    value: '',
    account: 'Conta corrente',
    status: 'confirmed',
  });

  const catsDoTipo = categorias.filter(c =>
    formData.type === 'expense' ? c.tipo === 'despesa' : c.tipo === 'receita'
  );
  const opcoesCategoria = catsDoTipo.flatMap(c => [
    { label: c.nome, value: c.nome, cor: c.cor },
    ...c.subcategorias.map(s => ({ label: '  ↳ ' + s.nome, value: s.nome, cor: s.cor })),
  ]);
  const corSelecionada = opcoesCategoria.find(o => o.value === formData.cat)?.cor;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onCreate(formData); }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
        <input type="text" value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value, cat: '' })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendente</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
        <div className="relative flex items-center">
          {corSelecionada && (
            <span className="absolute left-3 w-3 h-3 rounded-full pointer-events-none z-10" style={{ backgroundColor: corSelecionada }} />
          )}
          <select
            value={formData.cat}
            onChange={(e) => setFormData({ ...formData, cat: e.target.value })}
            className={"w-full border border-gray-200 rounded-lg py-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 " + (corSelecionada ? "pl-8" : "pl-3")}
          >
            <option value="">Selecione uma categoria</option>
            {opcoesCategoria.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Conta</label>
          <input type="text" value={formData.account} onChange={(e) => setFormData({ ...formData, account: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
          <input type="number" step="0.01" min="0" placeholder="0,00" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button type="submit" className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">Criar</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Conteúdo principal
// ---------------------------------------------------------------------------

function AppContent(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>('visao-geral');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Transações locais — funcionam mesmo sem backend
  // Carrega do localStorage, usa initialTransactions como fallback na primeira vez
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('focusfinan:transactions');
      return saved ? JSON.parse(saved) : initialTransactions;
    } catch { return initialTransactions; }
  });

  const [nextId, setNextId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('focusfinan:nextId');
      return saved ? Number(saved) : initialTransactions.length + 1;
    } catch { return initialTransactions.length + 1; }
  });

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    try {
      const saved = localStorage.getItem('focusfinan:categorias');
      return saved ? JSON.parse(saved) : initialCategorias;
    } catch { return initialCategorias; }
  });

  const [contas, setContas] = useState<Conta[]>(() => {
    try {
      const saved = localStorage.getItem('focusfinan:contas');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Mês selecionado
  const hoje = new Date();
  const [mesSel, setMesSel] = useState({ mes: hoje.getMonth(), ano: hoje.getFullYear() });

  const irMesAnterior = () => setMesSel(({ mes, ano }) =>
    mes === 0 ? { mes: 11, ano: ano - 1 } : { mes: mes - 1, ano }
  );
  const irMesSeguinte = () => setMesSel(({ mes, ano }) =>
    mes === 11 ? { mes: 0, ano: ano + 1 } : { mes: mes + 1, ano }
  );
  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(mesSel.ano, mesSel.mes, 1))
    .replace(/^\w/, c => c.toUpperCase());

  // Salva automaticamente no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('focusfinan:transactions', JSON.stringify(localTransactions));
  }, [localTransactions]);

  useEffect(() => {
    localStorage.setItem('focusfinan:nextId', String(nextId));
  }, [nextId]);

  useEffect(() => {
    localStorage.setItem('focusfinan:categorias', JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    localStorage.setItem('focusfinan:contas', JSON.stringify(contas));
  }, [contas]);

  const API_BASE = import.meta.env.VITE_API_URL ?? '';
  const financeData = useFinanceData(localTransactions, API_BASE);

  // Adiciona transação localmente (sem depender do backend)
  const addTransactionLocal = (payload: Transaction) => {
    const nova: Transaction = { ...payload, id: nextId };
    setNextId((n) => n + 1);
    setLocalTransactions((prev) => [...prev, nova]);
  };

  // Tenta enviar pro backend; se falhar ou não houver URL, salva só local
  const handleAddTransaction = async (payload: any): Promise<boolean> => {
    addTransactionLocal(payload); // salva local imediatamente
    if (API_BASE) {
      try {
        await financeData.addTransaction(payload);
      } catch {
        // backend indisponível — tudo bem
      }
    }
    return true;
  };

  const fetchDashboard = async () => {
    if (!API_BASE) return;
    try {
      const res = await axios.get(`${API_BASE.replace(/\/$/, '')}/dashboard`);
      setDashboardData(res.data);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transações do mês selecionado
  const txDoMes = useMemo(() =>
    localTransactions.filter(t => {
      const dt = parseDate(t.date);
      return dt.getMonth() === mesSel.mes && dt.getFullYear() === mesSel.ano;
    }),
    [localTransactions, mesSel]
  );

  // Apenas confirmadas do mês
  const txConfirmadas = useMemo(() => txDoMes.filter(t => t.status === 'confirmed'), [txDoMes]);

  // Gráfico de fluxo: só confirmadas do mês
  const flowChartData = useMemo(() => groupByDate(txConfirmadas), [txConfirmadas]);

  // Saldo por conta = saldo inicial cadastrado + todas as confirmadas (histórico completo)
  const saldoPorConta = useMemo(() => {
    const confirmadosTodos = localTransactions.filter(t => t.status === 'confirmed');
    const map = new Map<string, number>();
    // Parte do saldo inicial das contas cadastradas
    contas.forEach(c => {
      const si = c.saldoInicialTipo === 'credor' ? c.saldoInicial : -c.saldoInicial;
      map.set(c.nome, si);
    });
    // Soma confirmadas
    confirmadosTodos.forEach(t => {
      map.set(t.account, (map.get(t.account) ?? 0) + Number(t.value));
    });
    return Array.from(map.entries()).map(([conta, saldo]) => ({ conta, saldo }));
  }, [localTransactions, contas]);

  // Saldo projetado por conta = saldo confirmado + pendentes
  const saldoProjetadoPorConta = useMemo(() => {
    const pendentes = localTransactions.filter(t => t.status === 'pending');
    return saldoPorConta.map(({ conta, saldo }) => {
      const proj = pendentes
        .filter(t => t.account === conta)
        .reduce((a, t) => a + Number(t.value), 0);
      return { conta, saldoConfirmado: saldo, saldoProjetado: saldo + proj };
    });
  }, [saldoPorConta, localTransactions]);

  const saldoTotal = useMemo(
    () => saldoPorConta.reduce((a, { saldo }) => a + saldo, 0),
    [saldoPorConta]
  );
  const saldoProjetadoTotal = useMemo(
    () => saldoProjetadoPorConta.reduce((a, c) => a + c.saldoProjetado, 0),
    [saldoProjetadoPorConta]
  );

  // Categorias — confirmadas do mês (realizadas)
  const expenseCategories = useMemo(
    () => getCategorySummary(txConfirmadas, 'expense', categorias),
    [txConfirmadas, categorias]
  );
  const incomeCategories = useMemo(
    () => getCategorySummary(txConfirmadas, 'income', categorias),
    [txConfirmadas, categorias]
  );

  // Categorias — projetadas do mês (confirmadas + pendentes)
  const expenseCategoriesProj = useMemo(
    () => getCategorySummary(txDoMes, 'expense', categorias),
    [txDoMes, categorias]
  );
  const incomeCategoriesProj = useMemo(
    () => getCategorySummary(txDoMes, 'income', categorias),
    [txDoMes, categorias]
  );

  const totalExpenses     = useMemo(() => expenseCategories.reduce((a,c) => a+c.amount, 0),     [expenseCategories]);
  const totalIncome       = useMemo(() => incomeCategories.reduce((a,c) => a+c.amount, 0),       [incomeCategories]);
  const totalExpensesProj = useMemo(() => expenseCategoriesProj.reduce((a,c) => a+c.amount, 0), [expenseCategoriesProj]);
  const totalIncomeProj   = useMemo(() => incomeCategoriesProj.reduce((a,c) => a+c.amount, 0),  [incomeCategoriesProj]);

  // Converte DD/MM/YYYY → DD/MM/YY (formato interno)
  const normalizeDateFromCSV = (d: string): string => {
    const p = d.split('/');
    if (p.length === 3) return `${p[0]}/${p[1]}/${p[2].slice(-2)}`;
    return d;
  };

  // Tenta detectar a categoria com base na descrição
  const guessCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes('pix') && (d.includes('recebid') || d.includes('transferência recebida'))) return 'Outras Receitas';
    if (d.includes('pix') || d.includes('transferência enviada')) return 'Transferência';
    if (d.includes('supermercado') || d.includes('supermerca') || d.includes('mercado') || d.includes('compre bem')) return 'Alimentação';
    if (d.includes('ifood') || d.includes('zé delivery') || d.includes('restaurante') || d.includes('lanche')) return 'Alimentação';
    if (d.includes('posto') || d.includes('combustível') || d.includes('gasolina')) return 'Automóvel';
    if (d.includes('farmácia') || d.includes('drogaria') || d.includes('saúde')) return 'Saúde';
    if (d.includes('energia') || d.includes('água') || d.includes('internet') || d.includes('aluguel')) return 'Moradia';
    if (d.includes('salário') || d.includes('adiantamento')) return 'Salário';
    return 'Outras Despesas';
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Detecta separador (vírgula ou ponto-e-vírgula)
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, '').toLowerCase());

    // Mapeia colunas pelos nomes do cabeçalho
    const colIndex = (names: string[]) => {
      for (const n of names) {
        const i = headers.findIndex(h => h.includes(n));
        if (i !== -1) return i;
      }
      return -1;
    };

    const iData    = colIndex(['data', 'date']);
    const iValor   = colIndex(['valor', 'value', 'amount']);
    const iDesc    = colIndex(['descrição', 'descricao', 'description', 'memo', 'histórico']);
    const iCat     = colIndex(['categoria', 'category']);

    if (iData === -1 || iValor === -1) {
      alert('Formato de CSV não reconhecido. Colunas esperadas: Data, Valor, Descrição.');
      return [];
    }

    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Divide respeitando aspas
      const cols: string[] = [];
      let cur = '', inQuote = false;
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === sep && !inQuote) { cols.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim());

      const rawDate  = cols[iData]  ?? '';
      const rawValor = cols[iValor] ?? '0';
      const rawDesc  = iDesc !== -1 ? (cols[iDesc] ?? '') : '';
      const rawCat   = iCat  !== -1 ? (cols[iCat]  ?? '') : '';

      // Normaliza valor: troca vírgula decimal por ponto
      const valor = parseFloat(rawValor.replace(',', '.'));
      if (isNaN(valor) || !rawDate) continue;

      const type = valor >= 0 ? 'income' : 'expense';
      const desc = rawDesc || `Lançamento ${i}`;

      results.push({
        date:    normalizeDateFromCSV(rawDate),
        desc:    desc,
        cat:     rawCat || guessCategory(desc),
        account: 'Nubank',
        value:   valor,
        type,
        status:  'confirmed',
      });
    }

    return results;
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          alert('Nenhuma transação encontrada no arquivo.');
          return;
        }
        setImportPreview(parsed);
        setIsImportOpen(true);
      };
      reader.readAsText(file, 'UTF-8');
    } else if (ext === 'ofx') {
      // OFX ainda depende do backend — manter o fluxo original
      if (!API_BASE) {
        alert('Importação de OFX requer o backend configurado. Use CSV por enquanto.');
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      axios.post(`${API_BASE.replace(/\/$/, '')}/api/extrato/importar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(res => {
        setImportPreview(res.data || []);
        setIsImportOpen(true);
      }).catch(err => {
        console.error('Erro ao importar OFX', err);
        alert('Erro ao processar arquivo OFX.');
      });
    } else {
      alert('Formato não suportado. Use arquivos .csv ou .ofx');
    }
  };

  const saveImported = () => {
    if (!importPreview) return;
    let added = 0;
    const newTransactions: Transaction[] = [];

    importPreview.forEach((item, idx) => {
      const duplicate = localTransactions.some(
        t => t.date === item.date &&
             Math.abs(Number(t.value)) === Math.abs(Number(item.value)) &&
             t.desc === item.desc
      );
      if (duplicate) return;

      newTransactions.push({
        id:      nextId + idx,
        date:    item.date,
        desc:    item.desc,
        cat:     item.cat || 'Importado',
        account: item.account || 'Nubank',
        value:   Number(item.value),
        status:  'confirmed',
        type:    item.type,
      } as Transaction);
      added++;
    });

    if (newTransactions.length > 0) {
      setLocalTransactions(prev => [...prev, ...newTransactions]);
      setNextId(n => n + newTransactions.length);
    }

    setIsImportOpen(false);
    setImportPreview(null);
    if (added === 0) alert('Nenhuma transação nova encontrada (todas já existem).');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

      {/* ── SIDEBAR — desktop only ── */}
      <aside
        className={`
          hidden md:flex flex-col
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          bg-white border-r border-gray-200 transition-all duration-300 z-20 shrink-0
        `}
      >
        <div className="p-6 flex items-center">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm flex-shrink-0">
            F
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-gray-800">Focus Finan</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <SidebarItem
            icon={LayoutDashboard}
            label="Visão geral"
            active={currentView === 'visao-geral'}
            onClick={() => setCurrentView('visao-geral')}
          />
          <div className="mt-4 px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {isSidebarOpen ? 'Movimentações' : '---'}
          </div>
          <SidebarItem
            icon={ArrowLeftRight}
            label="Lançamentos"
            active={currentView === 'lancamentos'}
            onClick={() => setCurrentView('lancamentos')}
          />
          <div className="mt-4 px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {isSidebarOpen ? 'Configurações' : '---'}
          </div>
          <SidebarItem
            icon={Building2}
            label="Contas"
            active={currentView === 'contas'}
            onClick={() => setCurrentView('contas')}
          />
          <SidebarItem
            icon={BookOpen}
            label="Plano de Contas"
            active={currentView === 'plano-contas'}
            onClick={() => setCurrentView('plano-contas')}
          />
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">

        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(o => !o)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Collapse toggle — desktop only */}
            <button
              className="hidden md:flex p-2 rounded-lg text-gray-400 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(o => !o)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base md:text-lg font-semibold text-gray-700">
              {currentView === 'visao-geral'  ? 'Visão Geral'
                : currentView === 'lancamentos' ? 'Lançamentos'
                : currentView === 'contas'      ? 'Contas'
                : 'Plano de Contas'}
            </h2>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <Search className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 hidden sm:block" />
            <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            <div className="flex items-center bg-emerald-500 text-white px-2 md:px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-600 shadow-sm">
              <span className="text-xs md:text-sm font-medium mr-1 md:mr-2 uppercase tracking-wide hidden sm:block">Felipe Oliveira</span>
              <span className="text-xs font-bold sm:hidden">FO</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <div className={`
          md:hidden fixed top-0 left-0 h-full z-40 bg-white shadow-2xl transition-transform duration-300
          w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-5 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">F</div>
              <span className="font-bold text-lg text-gray-800">Focus Finan</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="py-4">
            {[
              { icon: LayoutDashboard, label: 'Visão geral',     view: 'visao-geral'  as ViewType },
              { icon: ArrowLeftRight,  label: 'Lançamentos',     view: 'lancamentos'  as ViewType },
              { icon: Building2,       label: 'Contas',          view: 'contas'       as ViewType },
              { icon: BookOpen,        label: 'Plano de Contas', view: 'plano-contas' as ViewType },
            ].map(({ icon: Icon, label, view }) => (
              <button
                key={view}
                onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-emerald-50 text-emerald-600 border-r-2 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
          {/* Error Display */}
          {financeData.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-start">
              <p className="text-red-700 text-sm">{financeData.error}</p>
              <button onClick={financeData.clearError} className="text-red-500 hover:text-red-700 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentView === 'visao-geral' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-20">

              {/* ── Card seletor de mês + saldo confirmado vs projetado ── */}
              <Card className="col-span-1 md:col-span-12">

                {/* Navegação de mês */}
                <div className="flex items-center justify-between mb-5">
                  <button onClick={irMesAnterior}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-gray-700 text-sm">{nomeMes}</span>
                  <button onClick={irMesSeguinte}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabela contas — Confirmado vs Projetado */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs font-semibold text-gray-400 w-6" />
                        <th className="text-left py-2 text-xs font-semibold text-gray-400 pl-1">Conta</th>
                        <th className="text-right py-2 text-xs font-semibold text-emerald-600 pr-6">Confirmado</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-400">Projetado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saldoProjetadoPorConta.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-xs text-gray-300">
                            Cadastre suas contas em Configurações → Contas
                          </td>
                        </tr>
                      )}
                      {saldoProjetadoPorConta.map(({ conta, saldoConfirmado, saldoProjetado }, i) => (
                        <tr key={conta} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2.5">
                            <input type="checkbox" defaultChecked
                              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer" />
                          </td>
                          <td className="py-2.5 pl-1">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: ['#10b981','#6366f1','#f59e0b','#ec4899'][i % 4] }} />
                              <span className="text-gray-700 font-medium">{conta}</span>
                            </div>
                          </td>
                          <td className={`py-2.5 text-right font-semibold pr-6 ${saldoConfirmado < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {saldoConfirmado < 0 ? '-' : ''}{Math.abs(saldoConfirmado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2.5 text-right font-semibold ${saldoProjetado < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {saldoProjetado < 0 ? '-' : ''}{Math.abs(saldoProjetado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td />
                        <td className="py-3 pl-1 font-bold text-gray-800 text-sm">Total</td>
                        <td className={`py-3 text-right font-bold pr-6 text-sm ${saldoTotal < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {saldoTotal < 0 ? '-' : ''}{Math.abs(saldoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 text-right font-bold text-sm ${saldoProjetadoTotal < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                          {saldoProjetadoTotal < 0 ? '-' : ''}{Math.abs(saldoProjetadoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Resultados do mês */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs text-center text-gray-400 mb-3 font-medium">Resultados (R$)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                    <div>
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-500">Entradas</span>
                        <span className="text-emerald-600 font-semibold sm:block">{formatBRL(totalIncome)}</span>
                      </div>
                      <div className="flex justify-between sm:block pl-3 sm:pl-0">
                        <span className="text-xs text-gray-400">Receitas</span>
                        <span className="text-xs text-emerald-500">{formatBRL(totalIncome)}</span>
                      </div>
                      <div className="flex justify-between sm:block pl-3 sm:pl-0">
                        <span className="text-xs text-gray-400">Transferências</span>
                        <span className="text-xs text-gray-400">0,00</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-500">Saídas</span>
                        <span className="text-red-500 font-semibold sm:block">-{formatBRL(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between sm:block pl-3 sm:pl-0">
                        <span className="text-xs text-gray-400">Despesas</span>
                        <span className="text-xs text-red-400">-{formatBRL(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between sm:block pl-3 sm:pl-0">
                        <span className="text-xs text-gray-400">Transferências</span>
                        <span className="text-xs text-gray-400">0,00</span>
                      </div>
                    </div>
                    <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex justify-between sm:block">
                        <span className="text-gray-700 font-bold">Resultado</span>
                        <span className={`font-bold sm:block ${(totalIncome - totalExpenses) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {(totalIncome - totalExpenses) < 0 ? '-' : ''}{formatBRL(Math.abs(totalIncome - totalExpenses))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Fluxo de caixa — só confirmados do mês */}
              <Card title="Fluxo de caixa (confirmado)" className="col-span-1 md:col-span-12">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flowChartData} margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="" vertical={false} stroke="#eeeeee" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#aaaaaa" />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#aaaaaa"
                        tickFormatter={(v: number) => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any) => [formatBRL(Number(value)), 'Saldo']}
                        labelStyle={{ color: '#555' }}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <ReferenceLine y={0} stroke="#bbbbbb" strokeWidth={1} />
                      <Line type="monotone" dataKey="saldo" stroke="#10b981" strokeWidth={2.5} dot={false} connectNulls={false} name="Saldo" />
                      <Line type="monotone" dataKey="saldoNegativo" stroke="#c62828" strokeWidth={2.5} dot={false} connectNulls={false} name="Saldo negativo" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Despesas por categoria */}
              <Card className="col-span-1 md:col-span-6">
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Despesas por categoria</p>
                <div className="flex gap-3 mb-4">
                  <span className="text-xs text-emerald-600 font-semibold border-b-2 border-emerald-500 pb-0.5">Confirmado</span>
                  <span className="text-xs text-gray-400">Projetado: -{formatBRL(totalExpensesProj)}</span>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-[224px] h-52 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={expenseCategories} innerRadius={70} outerRadius={105} paddingAngle={2}
                          dataKey="value" startAngle={90} endAngle={-270}>
                          {expenseCategories.map((entry, index) => (
                            <Cell key={`cell-exp-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any, props: any) => [formatBRL(props.payload.amount), props.payload.name]} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2">
                  {expenseCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-700">{cat.name}</span>
                        <span className="text-gray-400 text-xs font-medium">{cat.value.toFixed(1)}%</span>
                      </div>
                      <span className="text-red-500 font-medium">-{formatBRL(cat.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t font-bold text-sm">
                  <span className="text-gray-800">Total confirmado</span>
                  <span className="text-red-500">-{formatBRL(totalExpenses)}</span>
                </div>
              </Card>

              {/* Receitas por categoria */}
              <Card className="col-span-1 md:col-span-6">
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Receitas por categoria</p>
                <div className="flex gap-3 mb-4">
                  <span className="text-xs text-emerald-600 font-semibold border-b-2 border-emerald-500 pb-0.5">Confirmado</span>
                  <span className="text-xs text-gray-400">Projetado: +{formatBRL(totalIncomeProj)}</span>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-[224px] h-52 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={incomeCategories} innerRadius={70} outerRadius={105} paddingAngle={2}
                          dataKey="value" startAngle={90} endAngle={-270}>
                          {incomeCategories.map((entry, index) => (
                            <Cell key={`cell-inc-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any, props: any) => [formatBRL(props.payload.amount), props.payload.name]} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2">
                  {incomeCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-700">{cat.name}</span>
                        <span className="text-gray-400 text-xs font-medium">{cat.value.toFixed(1)}%</span>
                      </div>
                      <span className="text-emerald-600 font-medium">+{formatBRL(cat.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t font-bold text-sm">
                  <span className="text-gray-800">Total confirmado</span>
                  <span className="text-emerald-600">+{formatBRL(totalIncome)}</span>
                </div>
              </Card>

              {/* Contas a pagar e a receber lado a lado */}
              <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                {/* Contas a pagar */}
                <Card className="col-span-1">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-semibold text-gray-700">Contas a pagar</p>
                  </div>

                  {txDoMes.filter(
                    (t) => t.type === 'expense' && t.status === 'pending'
                  ).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhuma conta pendente</p>
                  ) : (
                    <div className="space-y-1">
                      {txDoMes
                        .filter((t) => t.type === 'expense' && t.status === 'pending')
                        .map((t) => (
                          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                              {/* Bolinha vermelha */}
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{t.desc}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {/* Badge categoria */}
                                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {t.cat.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-400">{t.account}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs text-gray-400 mb-0.5">{t.date}</p>
                                <p className="text-sm font-medium text-red-500">
                                  {Math.abs(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <button className="text-gray-300 hover:text-gray-500 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t font-bold text-sm">
                    <span className="text-gray-800">Total</span>
                    <span className="text-red-500">
                      -{formatBRL(
                        txDoMes
                          .filter((t) => t.type === 'expense' && t.status === 'pending')
                          .reduce((acc, t) => acc + Math.abs(t.value), 0)
                      )}
                    </span>
                  </div>
                </Card>

                {/* Contas a receber */}
                <Card className="col-span-1">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-gray-700">Contas a receber</p>
                  </div>

                  {txDoMes.filter(
                    (t) => t.type === 'income' && t.status === 'pending'
                  ).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhuma receita pendente</p>
                  ) : (
                    <div className="space-y-1">
                      {txDoMes
                        .filter((t) => t.type === 'income' && t.status === 'pending')
                        .map((t) => (
                          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{t.desc}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {t.cat.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-400">{t.account}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs text-gray-400 mb-0.5">{t.date}</p>
                                <p className="text-sm font-medium text-emerald-600">
                                  +{t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <button className="text-gray-300 hover:text-gray-500 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t font-bold text-sm">
                    <span className="text-gray-800">Total</span>
                    <span className="text-emerald-600">
                      +{formatBRL(
                        txDoMes
                          .filter((t) => t.type === 'income' && t.status === 'pending')
                          .reduce((acc, t) => acc + Math.abs(t.value), 0)
                      )}
                    </span>
                  </div>
                </Card>

              </div>

            </div>
          ) : currentView === 'lancamentos' ? (
            <div className="space-y-6 pb-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

                {/* Seletor de mês */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
                  <button onClick={irMesAnterior} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-700 min-w-[140px] text-center">{nomeMes}</span>
                  <button onClick={irMesSeguinte} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsNewOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" /> NOVO
                  </button>
                  <input
                    id="import-file-input"
                    type="file"
                    accept=".csv,.ofx"
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files ? e.target.files[0] : null)}
                  />
                  <button
                    onClick={() => document.getElementById('import-file-input')?.click()}
                    className="flex items-center justify-center bg-white text-emerald-600 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-all"
                  >
                    Importar Extrato
                  </button>
                  <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
                    <button className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-r transition-colors">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-r transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <TransactionTable
                transactions={txDoMes}
                categorias={categorias}
                onDelete={(id) => setLocalTransactions(prev => prev.filter(t => t.id !== id))}
                onEdit={(updated) => setLocalTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))}
              />
            </div>
          ) : currentView === 'contas' ? (
            <CadastroContas contas={contas} onChange={setContas} />
          ) : (
            <PlanoContas categorias={categorias} onChange={setCategorias} />
          )}
        </div>

        {/* FAB — acima da bottom nav no mobile */}
        <button
          onClick={() => setIsNewOpen(true)}
          className="fixed bottom-20 right-5 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
        >
          <Plus className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center justify-around px-2 h-16 shadow-lg">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', view: 'visao-geral'  as ViewType },
            { icon: ArrowLeftRight,  label: 'Lançamentos', view: 'lancamentos'  as ViewType },
            { icon: BookOpen,        label: 'Categorias',  view: 'plano-contas' as ViewType },
          ].map(({ icon: Icon, label, view }) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
                currentView === view ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Modal nova transação */}
        {isNewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsNewOpen(false)} />
            <div className="bg-white rounded-xl shadow-xl p-5 z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Nova transação</h3>
              <NewTransactionForm
                categorias={categorias}
                onCancel={() => setIsNewOpen(false)}
                onCreate={async (data) => {
                  const payload = {
                    date: isoToBR(data.date),
                    desc: data.desc,
                    cat: data.cat || 'Outras Despesas',
                    account: data.account || 'Conta corrente',
                    value:
                      data.type === 'income'
                        ? Math.abs(Number(data.value))
                        : -Math.abs(Number(data.value)),
                    status: data.status || 'confirmed',
                    type: data.type,
                  } as any;
                  const ok = await handleAddTransaction(payload);
                  if (ok) {
                    await fetchDashboard();
                    setIsNewOpen(false);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Modal preview importação */}
        {isImportOpen && importPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsImportOpen(false)} />
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 z-10 w-full max-w-3xl mx-3 md:mx-0 max-h-[90vh] flex flex-col">
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-800">Prévia da importação — {importPreview.length} transações</h3>
                <p className="text-xs text-gray-400 mt-1">Você pode ajustar a categoria de cada item antes de importar.</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-white shadow-sm">
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Data</th>
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500">Descrição</th>
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500 w-48">Categoria</th>
                      <th className="py-2 px-2 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((item, i) => {
                      // monta opções filtradas pelo tipo da linha
                      const catsDoTipo = categorias.filter(c =>
                        item.type === 'expense' ? c.tipo === 'despesa' : c.tipo === 'receita'
                      );
                      const opcoes = catsDoTipo.flatMap(c => [
                        { label: c.nome,            value: c.nome, cor: c.cor },
                        ...c.subcategorias.map(s => ({ label: '  ↳ ' + s.nome, value: s.nome, cor: s.cor })),
                      ]);
                      const corAtual = opcoes.find(o => o.value === item.cat)?.cor;

                      return (
                        <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/60 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                          <td className="py-1.5 px-2 text-xs text-gray-400 whitespace-nowrap">{item.date}</td>
                          <td className="py-1.5 px-2 text-xs text-gray-700 max-w-[180px]">
                            <span className="block truncate">{item.desc}</span>
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="relative flex items-center">
                              {corAtual && (
                                <span
                                  className="absolute left-2 w-2.5 h-2.5 rounded-full pointer-events-none z-10"
                                  style={{ backgroundColor: corAtual }}
                                />
                              )}
                              <select
                                value={item.cat}
                                onChange={e => {
                                  const updated = [...importPreview];
                                  updated[i] = { ...updated[i], cat: e.target.value };
                                  setImportPreview(updated);
                                }}
                                className={"w-full border border-gray-200 rounded-md py-1 pr-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white " + (corAtual ? 'pl-7' : 'pl-2')}
                              >
                                {/* garante que a categoria atual aparece mesmo se não estiver no plano de contas */}
                                {!opcoes.find(o => o.value === item.cat) && (
                                  <option value={item.cat}>{item.cat}</option>
                                )}
                                {opcoes.map(op => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className={`py-1.5 px-2 text-right text-xs font-semibold whitespace-nowrap ${Number(item.value) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {Number(item.value) >= 0 ? '+' : '-'} R$ {Math.abs(Number(item.value)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setIsImportOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={saveImported} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
                  Importar {importPreview.length} transações
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
