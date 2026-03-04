import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [mode,     setMode]     = useState<'login' | 'signup'>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name } },
        });
        if (error) throw error;
        setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // App.tsx detecta a mudança de sessão automaticamente
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Erro desconhecido';
      if (msg.includes('Invalid login'))      setError('E-mail ou senha incorretos.');
      else if (msg.includes('already registered')) setError('E-mail já cadastrado. Faça login.');
      else if (msg.includes('Password should'))    setError('Senha deve ter ao menos 6 caracteres.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">F</div>
          <span className="font-bold text-xl text-gray-800">Focus Finan</span>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-1">
          {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {mode === 'login' ? 'Bem-vindo de volta!' : 'Preencha os dados para começar'}
        </p>

        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Seu nome" className={INPUT} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" className={INPUT}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={INPUT}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>

        {error   && <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="mt-3 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}

        <button onClick={handleSubmit} disabled={loading || !email || !password}
          className="w-full mt-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors">
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            className="text-emerald-500 hover:text-emerald-600 font-medium">
            {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}
