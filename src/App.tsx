import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PieChart,
  Target,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  Loader2,
  BrainCircuit,
  X,
  Sparkles,
  Filter,
  Download,
  Printer
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

import { Card } from './components/Card';
import { SidebarItem } from './components/SidebarItem';
import { TransactionTable } from './components/TransactionTable';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFinanceData } from './hooks/useFinanceData';
import { useAI } from './hooks/useAI';
import { ViewType, Transaction } from './types';
import axios from 'axios';

// ...existing imports and mock data...
const initialFlowData = [
  { name: '03 fev', value: 0 },
  { name: '07 fev', value: 0 },
  { name: '11 fev', value: 0 },
  { name: '15 fev', value: 0 },
  { name: '19 fev', value: 1200 },
  { name: '21 fev', value: 3800 },
  { name: '23 fev', value: 200 },
  { name: '27 fev', value: 0 },
];

const categoriesData = [
  { name: 'Moradia', value: 45.75, color: '#10b981' },
  { name: 'Outras Despesas', value: 32.42, color: '#3b82f6' },
  { name: 'Alimentação', value: 14.41, color: '#fbbf24' },
  { name: 'Vestuário', value: 3.97, color: '#ec4899' },
  { name: 'Bem Estar', value: 2.95, color: '#f97316' },
  { name: 'Automóvel', value: 0.5, color: '#6366f1' },
];

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

const APP_CONFIG = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
};

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('visao-geral');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [categorizingId, setCategorizingId] = useState<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  const financeData = useFinanceData(initialTransactions, API_BASE);
  const ai = useAI(APP_CONFIG.GEMINI_API_KEY);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async () => {
    if (!API_BASE) return;
    try {
      const res = await axios.get(`${API_BASE.replace(/\/$/, '')}/dashboard`);
      setDashboardData(res.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingTransactions = useMemo(
    () => financeData.getTransactionsByStatus('pending'),
    [financeData]
  );

  const handleAnalyzeFinance = async () => {
    const summary = `
      Saldo Atual: R$ 87,65
      Passivo: R$ 375,00
      Principais Despesas: Moradia (45%), Outras (32%), Alimentação (14%)
      Lançamentos Pendentes: ${pendingTransactions.length}
    `;

    const result = await ai.analyzeFinance(summary);
    if (result) setAiInsight(result);
  };

  const handleCategorizeWithAI = async (id: number, desc: string) => {
    setCategorizingId(id);
    const category = await ai.categorize(desc);
    
    if (category) {
      financeData.updateTransaction(id, { cat: category });
    }
    
    setCategorizingId(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm">
            F
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-gray-800">Focus Finan</span>}
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
          {/* ...existing sidebar items... */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-gray-700">
              {currentView === 'visao-geral' ? 'Visão Geral' : 'Lançamentos de Caixa'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Search className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
            </div>
            <div className="flex items-center bg-emerald-500 text-white px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors shadow-sm">
              <span className="text-sm font-medium mr-2 uppercase tracking-wide">Felipe Oliveira</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Display */}
          {financeData.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-start">
              <p className="text-red-700">{financeData.error}</p>
              <button onClick={financeData.clearError} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* AI Insight */}
          {aiInsight && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 relative animate-in slide-in-from-top duration-300">
              <button onClick={() => setAiInsight(null)} className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-600">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start">
                <div className="bg-emerald-100 p-2 rounded-lg mr-4">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 mb-1">Dica do Assistente Focus</h4>
                  <p className="text-sm text-emerald-700 leading-relaxed">{aiInsight}</p>
                </div>
              </div>
            </div>
          )}

          {/* Views */}
          {currentView === 'visao-geral' ? (
            <div className="grid grid-cols-12 gap-6 pb-20">
              <Card
                title="Fluxo de caixa"
                className="col-span-12 lg:col-span-8"
                actions={
                  <button
                    onClick={handleAnalyzeFinance}
                    disabled={ai.isLoading}
                    className="flex items-center text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {ai.isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <BrainCircuit className="w-3 h-3 mr-1" />
                    )}
                    ANÁLISE AI
                  </button>
                }
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={initialFlowData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* ...existing cards... */}
              <Card title="Despesas por categoria" className="col-span-12">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-1/3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={categoriesData}
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 px-4 md:px-12 mt-6 md:mt-0">
                    {categoriesData.map((cat) => (
                      <div key={cat.name} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-gray-600 font-medium">{cat.name}</span>
                        </div>
                        <span className="font-bold text-gray-700">R$ {(4025 * (cat.value / 100)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 pb-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button onClick={() => setIsNewOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition-all">
                    <Plus className="w-4 h-4 mr-2" /> NOVO
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
                transactions={financeData.transactions}
                categorizingId={categorizingId}
                onCategorize={handleCategorizeWithAI}
                onDelete={financeData.deleteTransaction}
              />
            </div>
          )}
        </div>

        {/* FAB */}
          <button onClick={() => setIsNewOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50">
            <Plus className="w-8 h-8" />
          </button>

          {isNewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setIsNewOpen(false)} />
              <div className="bg-white rounded-xl shadow-xl p-6 z-10 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Nova transação</h3>
                <NewTransactionForm
                  onCancel={() => setIsNewOpen(false)}
                  onCreate={async (data) => {
                    const payload = {
                      date: data.date,
                      desc: data.desc,
                      cat: data.cat,
                      account: data.account || 'Conta corrente',
                      value: data.type === 'income' ? Math.abs(Number(data.value)) : -Math.abs(Number(data.value)),
                      status: 'confirmed',
                      type: data.type
                    } as any;

                    const ok = await financeData.addTransaction(payload as any);
                    if (ok) {
                      await fetchDashboard();
                      setIsNewOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function NewTransactionForm({ onCancel, onCreate }: { onCancel: () => void; onCreate: (data: any) => void }) {
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [account, setAccount] = useState('Conta corrente');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ date, desc, cat, account, value, type });
      }}
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Data</label>
          <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="23/02/2026" className="w-full border rounded px-3 py-2 mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">Descrição</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" className="w-full border rounded px-3 py-2 mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">Categoria</label>
          <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Categoria" className="w-full border rounded px-3 py-2 mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Valor</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full border rounded px-3 py-2 mt-1">
              <option value="expense">Saída</option>
              <option value="income">Entrada</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-100">Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded bg-emerald-500 text-white">Salvar</button>
        </div>
      </div>
    </form>
  );
}
