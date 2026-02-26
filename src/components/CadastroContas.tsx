import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, CreditCard, PiggyBank, Banknote, TrendingUp, Circle } from 'lucide-react';
import { Conta } from '../types';

interface Props {
  contas: Conta[];
  onChange: (contas: Conta[]) => void;
}

const TIPOS = [
  { value: 'corrente',     label: 'Conta Corrente',   Icon: Wallet },
  { value: 'poupanca',     label: 'Poupança',          Icon: PiggyBank },
  { value: 'cartao',       label: 'Cartão de Crédito', Icon: CreditCard },
  { value: 'dinheiro',     label: 'Dinheiro',          Icon: Banknote },
  { value: 'investimento', label: 'Investimento',      Icon: TrendingUp },
  { value: 'outro',        label: 'Outro',             Icon: Circle },
] as const;

function tipoLabel(tipo: string) {
  return TIPOS.find(t => t.value === tipo)?.label ?? tipo;
}

function TipoIcon({ tipo, className = 'w-5 h-5' }: { tipo: string; className?: string }) {
  const found = TIPOS.find(t => t.value === tipo);
  const Icon = found?.Icon ?? Wallet;
  return <Icon className={className} />;
}

// Converte YYYY-MM-DD → DD/MM/AAAA
function isoParaBR(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Converte DD/MM/AAAA → YYYY-MM-DD
function brParaIso(br: string) {
  const p = br.split('/');
  if (p.length < 3) return '';
  return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
}

function fmtNum(v: number) {
  return Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Modal ────────────────────────────────────────────────────────────────────
function ContaModal({ initial, onSave, onClose }: {
  initial?: Conta;
  onSave: (data: Omit<Conta, 'id'>) => void;
  onClose: () => void;
}) {
  const hoje = new Date();
  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;

  const [nome,           setNome]           = useState(initial?.nome ?? '');
  const [tipo,           setTipo]           = useState<Conta['tipo']>(initial?.tipo ?? 'corrente');
  const [moeda,          setMoeda]          = useState(initial?.moeda ?? 'BRL');
  const [dataISO,        setDataISO]        = useState(initial ? brParaIso(initial.saldoInicialData) : hojeISO);
  const [saldo,          setSaldo]          = useState(String(initial?.saldoInicial ?? '0'));
  const [saldoTipo,      setSaldoTipo]      = useState<'credor'|'devedor'>(initial?.saldoInicialTipo ?? 'credor');

  const dataBR = isoParaBR(dataISO);

  const handleSave = () => {
    if (!nome.trim()) return;
    onSave({ nome: nome.trim(), tipo, moeda, saldoInicial: Math.abs(Number(saldo) || 0), saldoInicialData: dataBR, saldoInicialTipo: saldoTipo });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">{initial ? 'Editar conta' : 'Nova conta'}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Tipo + Moeda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as Conta['tipo'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Moeda</label>
              <select value={moeda} onChange={e => setMoeda(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="BRL">🇧🇷 Real (R$)</option>
                <option value="USD">🇺🇸 Dólar (US$)</option>
                <option value="EUR">🇪🇺 Euro (€)</option>
              </select>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
            <input autoFocus type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Conta corrente"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {/* Data do saldo inicial */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data do saldo inicial *</label>
            <input type="date" value={dataISO} onChange={e => setDataISO(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {/* Saldo + Credor/Devedor */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Saldo em {dataBR} ({moeda === 'BRL' ? 'R$' : moeda === 'USD' ? 'US$' : '€'})
            </label>
            <div className="flex items-center gap-3">
              <input type="number" step="0.01" min="0" value={saldo} onChange={e => setSaldo(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <div className="flex gap-3">
                {(['credor', 'devedor'] as const).map(op => (
                  <label key={op} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="radio" name="saldoTipo" value={op} checked={saldoTipo === op}
                      onChange={() => setSaldoTipo(op)} className="accent-emerald-500 w-4 h-4" />
                    <span className="text-sm text-gray-600">{op.charAt(0).toUpperCase() + op.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!nome.trim()}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function CadastroContas({ contas, onChange }: Props) {
  const [nextId,     setNextId]     = useState(500);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editando,   setEditando]   = useState<Conta | null>(null);
  const [confirmDel, setConfirmDel] = useState<Conta | null>(null);

  const genId = () => { const id = nextId; setNextId(n => n + 1); return id; };

  const handleAdd = (data: Omit<Conta, 'id'>) => {
    onChange([...contas, { ...data, id: genId() }]);
    setModalOpen(false);
  };

  const handleUpdate = (data: Omit<Conta, 'id'>) => {
    onChange(contas.map(c => c.id === editando!.id ? { ...c, ...data } : c));
    setEditando(null);
  };

  const handleDelete = (id: number) => {
    onChange(contas.filter(c => c.id !== id));
    setConfirmDel(null);
  };

  const saldoFinal = (c: Conta) =>
    c.saldoInicialTipo === 'credor' ? c.saldoInicial : -c.saldoInicial;

  return (
    <div className="space-y-6 pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Cadastro de Contas</h2>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie suas contas bancárias e carteiras</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nova conta
        </button>
      </div>

      {/* Lista vazia */}
      {contas.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
          <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-2">Nenhuma conta cadastrada ainda.</p>
          <button onClick={() => setModalOpen(true)} className="text-emerald-500 hover:text-emerald-600 text-sm font-medium">
            + Criar primeira conta
          </button>
        </div>
      )}

      {/* Cards */}
      {contas.map(c => {
        const saldo = saldoFinal(c);
        return (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            {/* Ícone */}
            <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <TipoIcon tipo={c.tipo} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{c.nome}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400">{tipoLabel(c.tipo)}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-400">Desde {c.saldoInicialData}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-400">{c.moeda}</span>
              </div>
            </div>

            {/* Saldo */}
            <div className="text-right flex-shrink-0">
              <p className={`font-bold text-base ${saldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {saldo < 0 ? '-' : ''}R$ {fmtNum(saldo)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Saldo inicial · {c.saldoInicialTipo === 'credor' ? 'Credor' : 'Devedor'}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setEditando(c)}
                className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setConfirmDel(c)}
                className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Modais */}
      {modalOpen  && <ContaModal onSave={handleAdd}    onClose={() => setModalOpen(false)} />}
      {editando   && <ContaModal initial={editando} onSave={handleUpdate} onClose={() => setEditando(null)} />}

      {/* Confirmar exclusão */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDel(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 z-10 w-80 mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Excluir "{confirmDel.nome}"?</p>
                <p className="text-xs text-gray-400 mt-1">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDel.id)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
