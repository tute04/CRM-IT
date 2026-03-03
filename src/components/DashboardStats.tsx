'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { mes: 'Ene', cotizado: 4000000, vendido: 2400000 },
    { mes: 'Feb', cotizado: 3000000, vendido: 1398000 },
    { mes: 'Mar', cotizado: 5000000, vendido: 3800000 },
];

export default function DashboardStats() {
    return (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 h-96 transition-colors duration-300">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Rendimiento Comercial</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4d4d8" />
                    <XAxis dataKey="mes" stroke="#a3a3a3" fontWeight="bold" />
                    <YAxis tickFormatter={(value) => `$${value / 1000000}M`} stroke="#a3a3a3" fontWeight="bold" />
                    <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} cursor={{ fill: '#fef08a', opacity: 0.2 }} contentStyle={{ backgroundColor: '#171717', color: '#fff', border: 'none', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontWeight: 'bold' }} />
                    {/* Colores estrictos: Gris oscuro y Amarillo */}
                    <Bar dataKey="cotizado" name="Cotizado ($)" fill="#737373" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vendido" name="Vendido ($)" fill="#facc15" stroke="#171717" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
