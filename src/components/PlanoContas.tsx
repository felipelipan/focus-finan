import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react';

export interface Categoria {
  id: number;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone?: string;
  subcategorias: Subcategoria[];
}

export interface Subcategoria {
  id: number;
  nome: string;
  cor: string;
}

interface Props {
  categorias: Categoria[];
  onChange: (cats: Categoria[]) => void;
}

const PALETA = [
  '#10b981', '#3b82f6', '#fbbf24', '#ec4899',
  '#f97316', '#6366f1', '#14b8a6', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f43f5e',
  '#a855f7', '#0ea5e9', '#22c55e', '#eab308',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {PALETA.map(cor => (
        <button
          key={cor}
          type="button"
          onClick={() => onChange(cor)}
          className={`w-6 h-6 rounded-full transition-all ${value === cor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
          style={{ backgroundColor: cor }}
        />
      ))}
    </div>
  );
}

// Modal para criar/editar categoria ou subcategoria
function CatModal({
  initial,
  tipo,
  onSave,
  onClose,
}: {
  initial?: { nome: string; cor: string };
  tipo: 'receita' | 'despesa';
  onSave: (nome: string, cor: string) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [cor, setCor]   = useState(initial?.cor ?? PALETA[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-sm">
        <h3 className="font-bold text-gray-800 mb-4">
          {initial ? 'Editar categoria' : `Nova categoria de ${tipo === 'receita' ? 'receita' : 'despesa'}`}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Alimentação"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cor</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: cor }} />
              <span className="text-xs text-gray-400">{cor}</span>
            </div>
            <ColorPicker value={cor} onChange={setCor} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => { if (nome.trim()) onSave(nome.trim(), cor); }}
            disabled={!nome.trim()}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para criar/editar subcategoria
function SubModal({
  catNome,
  initial,
  onSave,
  onClose,
}: {
  catNome: string;
  initial?: { nome: string; cor: string };
  onSave: (nome: string, cor: string) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [cor, setCor]   = useState(initial?.cor ?? PALETA[2]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-sm">
        <h3 className="font-bold text-gray-800 mb-1">
          {initial ? 'Editar subcategoria' : 'Nova subcategoria'}
        </h3>
        <p className="text-xs text-gray-400 mb-4">em <span className="font-medium text-gray-600">{catNome}</span></p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
            <input
              autoFocus
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Restaurante"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cor</label>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full border-2 border-gray-200" style={{ backgroundColor: cor }} />
              <span className="text-xs text-gray-400">{cor}</span>
            </div>
            <ColorPicker value={cor} onChange={setCor} />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => { if (nome.trim()) onSave(nome.trim(), cor); }}
            disabled={!nome.trim()}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Linha de categoria com subcategorias expansíveis
function CatRow({
  cat,
  onEditCat,
  onDeleteCat,
  onAddSub,
  onEditSub,
  onDeleteSub,
}: {
  cat: Categoria;
  onEditCat: () => void;
  onDeleteCat: () => void;
  onAddSub: () => void;
  onEditSub: (sub: Subcategoria) => void;
  onDeleteSub: (subId: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Linha principal */}
      <div className="flex flex-wrap items-center px-4 py-3 bg-white hover:bg-gray-50 transition-colors gap-y-2">
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-gray-400 hover:text-gray-600 mr-2 transition-colors"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Cor + nome */}
        <div className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: cat.cor }} />
        <span className="font-semibold text-gray-800 flex-1">{cat.nome}</span>

        {/* Badge tipo */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-3 ${
          cat.tipo === 'receita'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-600'
        }`}>
          {cat.tipo === 'receita' ? 'RECEITA' : 'DESPESA'}
        </span>

        {/* Subcategorias count */}
        <span className="hidden sm:inline text-xs text-gray-400 mr-4">
          {cat.subcategorias.length} {cat.subcategorias.length === 1 ? 'subcategoria' : 'subcategorias'}
        </span>

        {/* Ações */}
        <div className="flex items-center gap-1">
          <button
            onClick={onAddSub}
            title="Adicionar subcategoria"
            className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onEditCat}
            title="Editar"
            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeleteCat}
            title="Excluir"
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subcategorias */}
      {expanded && cat.subcategorias.length > 0 && (
        <div className="border-t border-gray-50">
          {cat.subcategorias.map(sub => (
            <div key={sub.id} className="flex items-center px-3 py-2.5 pl-8 sm:pl-12 bg-gray-50/50 border-b border-gray-50 last:border-0 hover:bg-gray-100/50 transition-colors">
              <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: sub.cor }} />
              <span className="text-sm text-gray-700 flex-1">{sub.nome}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditSub(sub)}
                  className="p-1 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteSub(sub.id)}
                  className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state subcategorias */}
      {expanded && cat.subcategorias.length === 0 && (
        <div className="px-4 py-3 pl-12 bg-gray-50/30 border-t border-gray-50">
          <button
            onClick={onAddSub}
            className="text-xs text-gray-400 hover:text-emerald-500 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Adicionar subcategoria
          </button>
        </div>
      )}
    </div>
  );
}

export function PlanoContas({ categorias, onChange }: Props) {
  const [tab, setTab]           = useState<'despesa' | 'receita'>('despesa');
  const [nextId, setNextId]     = useState(1000);

  // Modais
  const [newCatTipo, setNewCatTipo]   = useState<'receita' | 'despesa' | null>(null);
  const [editingCat, setEditingCat]   = useState<Categoria | null>(null);
  const [addSubCat, setAddSubCat]     = useState<Categoria | null>(null);
  const [editingSub, setEditingSub]   = useState<{ cat: Categoria; sub: Subcategoria } | null>(null);
  const [confirmDelCat, setConfirmDelCat] = useState<Categoria | null>(null);

  const filtered = categorias.filter(c => c.tipo === tab);

  const genId = () => { const id = nextId; setNextId(n => n + 1); return id; };

  // CRUD Categorias
  const addCat = (nome: string, cor: string) => {
    const nova: Categoria = { id: genId(), nome, tipo: newCatTipo!, cor, subcategorias: [] };
    onChange([...categorias, nova]);
    setNewCatTipo(null);
  };

  const updateCat = (nome: string, cor: string) => {
    onChange(categorias.map(c => c.id === editingCat!.id ? { ...c, nome, cor } : c));
    setEditingCat(null);
  };

  const deleteCat = (id: number) => {
    onChange(categorias.filter(c => c.id !== id));
    setConfirmDelCat(null);
  };

  // CRUD Subcategorias
  const addSub = (nome: string, cor: string) => {
    const nova: Subcategoria = { id: genId(), nome, cor };
    onChange(categorias.map(c =>
      c.id === addSubCat!.id ? { ...c, subcategorias: [...c.subcategorias, nova] } : c
    ));
    setAddSubCat(null);
  };

  const updateSub = (nome: string, cor: string) => {
    onChange(categorias.map(c =>
      c.id === editingSub!.cat.id
        ? { ...c, subcategorias: c.subcategorias.map(s => s.id === editingSub!.sub.id ? { ...s, nome, cor } : s) }
        : c
    ));
    setEditingSub(null);
  };

  const deleteSub = (catId: number, subId: number) => {
    onChange(categorias.map(c =>
      c.id === catId ? { ...c, subcategorias: c.subcategorias.filter(s => s.id !== subId) } : c
    ));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Plano de Contas</h2>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie categorias e subcategorias</p>
        </div>
        <button
          onClick={() => setNewCatTipo(tab)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova categoria
        </button>
      </div>

      {/* Tabs Receita / Despesa */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('despesa')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'despesa'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Despesas
          <span className="ml-2 text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
            {categorias.filter(c => c.tipo === 'despesa').length}
          </span>
        </button>
        <button
          onClick={() => setTab('receita')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'receita'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Receitas
          <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
            {categorias.filter(c => c.tipo === 'receita').length}
          </span>
        </button>
      </div>

      {/* Lista de categorias */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma categoria de {tab} cadastrada.</p>
            <button
              onClick={() => setNewCatTipo(tab)}
              className="mt-3 text-emerald-500 hover:text-emerald-600 text-sm font-medium"
            >
              + Criar primeira categoria
            </button>
          </div>
        )}

        {filtered.map(cat => (
          <CatRow
            key={cat.id}
            cat={cat}
            onEditCat={() => setEditingCat(cat)}
            onDeleteCat={() => setConfirmDelCat(cat)}
            onAddSub={() => setAddSubCat(cat)}
            onEditSub={(sub) => setEditingSub({ cat, sub })}
            onDeleteSub={(subId) => deleteSub(cat.id, subId)}
          />
        ))}
      </div>

      {/* ── Modais ── */}

      {newCatTipo && (
        <CatModal
          tipo={newCatTipo}
          onSave={addCat}
          onClose={() => setNewCatTipo(null)}
        />
      )}

      {editingCat && (
        <CatModal
          tipo={editingCat.tipo}
          initial={{ nome: editingCat.nome, cor: editingCat.cor }}
          onSave={updateCat}
          onClose={() => setEditingCat(null)}
        />
      )}

      {addSubCat && (
        <SubModal
          catNome={addSubCat.nome}
          onSave={addSub}
          onClose={() => setAddSubCat(null)}
        />
      )}

      {editingSub && (
        <SubModal
          catNome={editingSub.cat.nome}
          initial={{ nome: editingSub.sub.nome, cor: editingSub.sub.cor }}
          onSave={updateSub}
          onClose={() => setEditingSub(null)}
        />
      )}

      {/* Confirmação exclusão */}
      {confirmDelCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDelCat(null)} />
          <div className="bg-white rounded-xl shadow-xl p-6 z-10 w-80">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Excluir "{confirmDelCat.nome}"?</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {confirmDelCat.subcategorias.length > 0
                    ? `Isso também excluirá ${confirmDelCat.subcategorias.length} subcategoria(s).`
                    : 'Essa ação não pode ser desfeita.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmDelCat(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => deleteCat(confirmDelCat.id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
