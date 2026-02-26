import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, CheckCheck, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Transaction } from '../types';
import { Categoria } from './PlanoContas';

interface Props {
  transactions: Transaction[];
  categorias: Categoria[];
  onDelete: (id: number) => void;
  onEdit: (updated: Transaction) => void;
}

type FilterType = 'all' | 'pending' | 'confirmed';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-red-500',
  scheduled:  'bg-yellow-400',
  confirmed:  'bg-blue-500',
  reconciled: 'bg-emerald-500',
};

function formatBRL(value: number): string {
  return Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// Converte DD/MM/YY → YYYY-MM-DD para o input date
function brToIso(br: string): string {
  const p = br.split('/');
  if (p.length < 3) return '';
  let y = Number(p[2]); if (y < 100) y += 2000;
  return `${y}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
}

// Converte YYYY-MM-DD → DD/MM/YY
function isoToBr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${String(y).slice(-2)}`;
}

// Menu dropdown por linha
function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-40 py-1 overflow-hidden">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
            Editar
          </button>
          <div className="border-t border-gray-100 mx-2" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

export function TransactionTable({ transactions, categorias, onDelete, onEdit }: Props) {
  const [filter, setFilter]               = useState<FilterType>('all');
  const [selected, setSelected]           = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTx, setEditingTx]         = useState<Transaction | null>(null);
  const [editForm, setEditForm]           = useState<any>(null);

  // Filtra
  const filtered = useMemo(() => {
    if (filter === 'pending')   return transactions.filter(t => t.status === 'pending');
    if (filter === 'confirmed') return transactions.filter(t => t.status === 'confirmed');
    return transactions;
  }, [transactions, filter]);

  // Ordena: todos os confirmados por data primeiro, depois todos os pendentes por data
  const sorted = useMemo(() => {
    const parseDate = (d: string) => {
      const p = d.split('/');
      if (p.length < 3) return 0;
      let y = Number(p[2]); if (y < 100) y += 2000;
      return new Date(y, Number(p[1]) - 1, Number(p[0])).getTime();
    };
    const statusOrder = (s: string) => s === 'confirmed' ? 0 : 1;

    return [...filtered].sort((a, b) => {
      const statusDiff = statusOrder(a.status) - statusOrder(b.status);
      if (statusDiff !== 0) return statusDiff;
      return parseDate(a.date) - parseDate(b.date);
    });
  }, [filtered]);

  // Saldo acumulado — só confirmadas atualizam o saldo; pendentes mostram traço
  const rows = useMemo(() => {
    let saldo = 0;
    return sorted.map(t => {
      if (t.status === 'confirmed') saldo += Number(t.value);
      return { ...t, saldoAcumulado: t.status === 'confirmed' ? saldo : null };
    });
  }, [sorted]);

  // Totais — só confirmadas
  const totalEntradas = transactions.filter(t => t.value > 0 && t.status === 'confirmed').reduce((a, t) => a + t.value, 0);
  const totalSaidas   = transactions.filter(t => t.value < 0 && t.status === 'confirmed').reduce((a, t) => a + Math.abs(t.value), 0);
  const totalEntradasProj = transactions.filter(t => t.value > 0).reduce((a, t) => a + t.value, 0);
  const totalSaidasProj   = transactions.filter(t => t.value < 0).reduce((a, t) => a + Math.abs(t.value), 0);
  const resultado     = totalEntradas - totalSaidas;
  const resultadoProj = totalEntradasProj - totalSaidasProj;

  // Seleção
  const allIds       = rows.map(t => t.id);
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    selected.forEach(id => onDelete(id));
    setSelected(new Set());
    setConfirmDelete(false);
  };

  // Edição
  const openEdit = (t: Transaction) => {
    setEditingTx(t);
    setEditForm({
      date:    brToIso(t.date),
      desc:    t.desc,
      cat:     t.cat,
      account: t.account,
      type:    t.type,
      status:  t.status,
      value:   String(Math.abs(t.value)),
    });
  };

  const saveEdit = () => {
    if (!editingTx || !editForm) return;
    const updated: Transaction = {
      ...editingTx,
      date:    isoToBr(editForm.date),
      desc:    editForm.desc,
      cat:     editForm.cat,
      account: editForm.account,
      type:    editForm.type,
      status:  editForm.status,
      value:   editForm.type === 'income'
        ? Math.abs(Number(editForm.value))
        : -Math.abs(Number(editForm.value)),
    };
    onEdit(updated);
    setEditingTx(null);
    setEditForm(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">

      {/* Painel lateral — Resultados */}
      <div className="w-full md:w-56 md:flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-sm">
          <div className="font-semibold text-gray-700 mb-3">Resultados (R$)</div>

          {/* Confirmado */}
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Confirmado</p>
          <div className="space-y-1 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Entradas</span>
              <span className="text-emerald-600 font-medium">{formatBRL(totalEntradas)}</span>
            </div>
            <div className="flex justify-between pl-3">
              <span className="text-gray-400 text-xs">Receitas</span>
              <span className="text-emerald-500 text-xs">{formatBRL(totalEntradas)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Saídas</span>
              <span className="text-red-500 font-medium">-{formatBRL(totalSaidas)}</span>
            </div>
            <div className="flex justify-between pl-3">
              <span className="text-gray-400 text-xs">Despesas</span>
              <span className="text-red-400 text-xs">-{formatBRL(totalSaidas)}</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t font-bold">
              <span className="text-gray-700">Resultado</span>
              <span className={resultado >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {resultado < 0 ? '-' : ''}{formatBRL(Math.abs(resultado))}
              </span>
            </div>
          </div>

          {/* Projetado */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-3">Projetado</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Entradas</span>
              <span className="text-emerald-500 text-xs">{formatBRL(totalEntradasProj)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Saídas</span>
              <span className="text-red-400 text-xs">-{formatBRL(totalSaidasProj)}</span>
            </div>
            <div className="flex justify-between mt-1 pt-1 border-t">
              <span className="text-gray-500 text-xs font-bold">Resultado</span>
              <span className={`text-xs font-bold ${resultadoProj >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {resultadoProj < 0 ? '-' : ''}{formatBRL(Math.abs(resultadoProj))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Filtros + botão excluir selecionados */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600 mr-1">Filtrar</span>
            {(['pending', 'confirmed', 'all'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelected(new Set()); }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  filter === f
                    ? f === 'pending'   ? 'bg-red-100 text-red-600'
                    : f === 'confirmed' ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'pending'   && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
                {f === 'confirmed' && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                {f === 'pending' ? 'Pendentes' : f === 'confirmed' ? 'Confirmados' : 'Todos'}
              </button>
            ))}
          </div>

          {someSelected && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir {selected.size} {selected.size === 1 ? 'item' : 'itens'}
            </button>
          )}
        </div>

        {/* Saldo anterior */}
        <div className="flex items-center px-5 py-2.5 border-b border-gray-50 bg-gray-50/50">
          <div className="w-7 mr-3" />
          <div className="w-20 text-xs text-gray-400">31/01</div>
          <div className="flex-1 text-xs text-gray-500 font-medium">Saldo anterior</div>
          <div className="text-xs text-gray-500 pr-10">0,00</div>
        </div>

        {/* Cabeçalho */}
        <div className="flex items-center px-5 py-2 bg-gray-50 border-b border-gray-100">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-emerald-500 cursor-pointer mr-3 flex-shrink-0"
            title="Selecionar todos"
          />
          <div className="w-4 mr-2" />
          <div className="w-20 text-xs font-semibold text-gray-400">Data</div>
          <div className="flex-1 text-xs font-semibold text-gray-400">Descrição</div>
          <div className="w-8" />
          <div className="w-24 text-right text-xs font-semibold text-gray-400">Valor</div>
          <div className="w-10" />
          <div className="hidden sm:block w-28 text-right text-xs font-semibold text-gray-400 pr-8">Saldo</div>
        </div>

        {/* Linhas */}
        <div className="divide-y divide-gray-50">
          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhuma transação encontrada
            </div>
          )}
          {rows.map((t) => {
            const isSelected = selected.has(t.id);
            return (
              <div
                key={t.id}
                onClick={() => toggleOne(t.id)}
                className={`flex items-center px-5 py-3 cursor-pointer transition-colors select-none ${
                  isSelected ? 'bg-emerald-50 border-l-2 border-emerald-400' : 'hover:bg-gray-50/70'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(t.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer mr-3 flex-shrink-0"
                />

                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mr-2 ${STATUS_COLORS[t.status] ?? 'bg-gray-300'}`} />

                {/* Data */}
                <div className="w-16 sm:w-20 text-xs text-gray-500 flex-shrink-0">{t.date}</div>

                {/* Descrição + badges */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.desc}</p>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{t.account}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{t.cat}</span>
                  </div>
                </div>

                {/* Check status */}
                <div className="w-8 flex justify-center">
                  {t.status === 'confirmed'
                    ? <CheckCheck className="w-3.5 h-3.5 text-gray-300" />
                    : <Check className="w-3.5 h-3.5 text-gray-200" />}
                </div>

                {/* Valor */}
                <div className={`w-20 sm:w-24 text-right text-sm font-semibold flex-shrink-0 ${t.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.value < 0 ? '-' : ''}{formatBRL(t.value)}
                </div>

                {/* Menu 3 pontinhos */}
                <div className="w-10 flex justify-center">
                  <RowMenu
                    onEdit={() => openEdit(t)}
                    onDelete={() => { setSelected(new Set([t.id])); setConfirmDelete(true); }}
                  />
                </div>

                {/* Saldo acumulado — só confirmadas */}
                <div className={`hidden sm:block w-28 text-right text-sm font-semibold ${
                  t.saldoAcumulado === null ? 'text-gray-300'
                  : t.saldoAcumulado >= 0   ? 'text-emerald-600'
                  :                           'text-red-500'
                }`}>
                  {t.saldoAcumulado === null
                    ? '—'
                    : `${t.saldoAcumulado < 0 ? '-' : ''}${formatBRL(t.saldoAcumulado)}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal de Edição ── */}
      {editingTx && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingTx(null)} />
          <div className="bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Editar lançamento</h3>
              <button onClick={() => setEditingTx(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <input
                  type="text"
                  value={editForm.desc}
                  onChange={e => setEditForm({ ...editForm, desc: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                  {(() => {
                    const catsDoTipo = categorias.filter(c =>
                      editForm.type === 'expense' ? c.tipo === 'despesa' : c.tipo === 'receita'
                    );
                    const opcoes = catsDoTipo.flatMap(c => [
                      { label: c.nome, value: c.nome, cor: c.cor },
                      ...c.subcategorias.map(s => ({ label: '  ↳ ' + s.nome, value: s.nome, cor: s.cor })),
                    ]);
                    const corAtual = opcoes.find(o => o.value === editForm.cat)?.cor;
                    return (
                      <div className="relative flex items-center">
                        {corAtual && (
                          <span className="absolute left-3 w-3 h-3 rounded-full pointer-events-none z-10"
                            style={{ backgroundColor: corAtual }} />
                        )}
                        <select
                          value={editForm.cat}
                          onChange={e => setEditForm({ ...editForm, cat: e.target.value })}
                          className={"w-full border border-gray-200 rounded-lg py-2 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 " + (corAtual ? 'pl-8' : 'pl-3')}
                        >
                          {!opcoes.find(o => o.value === editForm.cat) && (
                            <option value={editForm.cat}>{editForm.cat}</option>
                          )}
                          {opcoes.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Conta</label>
                  <input
                    type="text"
                    value={editForm.account}
                    onChange={e => setEditForm({ ...editForm, account: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.value}
                  onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditingTx(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmação exclusão ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDelete(false)} />
          <div className="bg-white rounded-xl shadow-xl p-6 z-10 w-full max-w-xs mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  Excluir {selected.size} {selected.size === 1 ? 'transação' : 'transações'}?
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Essa ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setConfirmDelete(false); setSelected(new Set()); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
