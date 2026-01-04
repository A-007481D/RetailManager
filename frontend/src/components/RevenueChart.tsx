import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
    data: { month: string; revenue: number }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    return (
        <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Évolution du Chiffre d'Affaires</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: any) => [`${value?.toLocaleString('fr-FR')} DH`, 'CA']}
                    />
                    <Bar
                        dataKey="revenue"
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
