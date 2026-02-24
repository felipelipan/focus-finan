import React from 'react';
import { CheckCircle2, Clock, Building2, MoreVertical } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onDelete
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Nenhum lançamento encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Descrição</th>
            <th className="px-6 py-4">Categoria / Conta</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm text-gray-500 font-medium">{transaction.date}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-gray-700">{transaction.desc}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-start">
                  <div className="flex items-center group/cat">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm mr-2 ${
                        transaction.cat === 'Pendente'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {transaction.cat}
                    </span>
                      {/* Categorizar com IA removido — categoria deve ser gerenciada manualmente ou via plano de contas */}
                  </div>
                  <span className="text-[10px] text-gray-300 flex items-center mt-1 uppercase font-bold">
                    <Building2 className="w-3 h-3 mr-1" /> {transaction.account}
                  </span>
                </div>
              </td>
              <td
                className={`px-6 py-4 text-sm font-bold text-right ${
                  transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {transaction.type === 'income' ? '' : '-'} R${' '}
                {Math.abs(transaction.value).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      transaction.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-amber-50 text-amber-400'
                    }`}
                  >
                    {transaction.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Deletar transação"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
