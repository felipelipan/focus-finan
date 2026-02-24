import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const parseDate = (d: string) => {
  import React, { useMemo, useState } from 'react';
  import {
    ResponsiveContainer,
    Tooltip,
    Cell,
    PieChart as RePieChart,
    Pie
  } from 'recharts';
  import { Transaction } from '../types';
  import { getCategoryTotals } from '../utils/charts';

  interface Props {
    transactions: Transaction[];
  }

  const presets = [
    { key: 'all', label: 'Todo período' },
    { key: '7', label: 'Últimos 7 dias' },
    { key: '30', label: 'Últimos 30 dias' }
  ];

  export default function RevenueByCategoryChart({ transactions }: Props) {
    const [preset, setPreset] = useState<string>('all');

    const data = useMemo(() => getCategoryTotals(transactions, 'income', preset), [transactions, preset]);
    const total = data.reduce((s, c) => s + c.value, 0);

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Receitas por categoria</h3>
          <div className="flex items-center space-x-2">
            <select value={preset} onChange={(e) => setPreset(e.target.value)} className="text-sm p-1 border rounded">
              {presets.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data}
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 px-4 md:px-12 mt-6 md:mt-0">
            {data.map((cat: any) => (
              <div key={cat.name} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-gray-600 font-medium">{cat.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-700">R$ {cat.value.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{cat.percent.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
              <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`]} />
