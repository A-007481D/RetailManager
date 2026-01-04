import React, { useEffect, useState } from 'react';
import { GetDashboardStats } from '../../wailsjs/go/main/App';
import { main, invoice, inventory } from '../../wailsjs/go/models';
import { MoneyIcon, BoxIcon, DocumentCheckIcon, WarningIcon, InvoiceIcon } from './Icons';

interface DashboardProps {
    onEditInvoice?: (invoice: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onEditInvoice }) => {
    const [stats, setStats] = useState<main.DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await GetDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load stats", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement du tableau de bord...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Erreur de chargement</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <span className="text-4xl">📊</span> Tableau de Bord
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-100 text-green-600 rounded-full">
                        <MoneyIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Chiffre d'Affaires</p>
                        <p className="text-2xl font-bold text-gray-800" title={`${stats.InvoiceStats?.TotalRevenue.toFixed(2)} DH`}>
                            {stats.InvoiceStats?.TotalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, ' ')} <span className="text-lg">DH</span>
                        </p>
                    </div>
                </div>

                {/* Invoices Count Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                        <DocumentCheckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Factures Émises</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.InvoiceStats?.TotalInvoices}
                        </p>
                    </div>
                </div>

                {/* Products Count Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-full">
                        <BoxIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Produits</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {stats.InventoryStats?.TotalProducts}
                        </p>
                    </div>
                </div>

                {/* Low Stock Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`p-4 rounded-full ${stats.InventoryStats?.LowStockCount! > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                        <WarningIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Stock Faible</p>
                        <p className={`text-2xl font-bold ${stats.InventoryStats?.LowStockCount! > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {stats.InventoryStats?.LowStockCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <InvoiceIcon className="w-5 h-5 text-gray-500" />
                        Factures Récentes
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-3 text-left">N° Facture</th>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Client</th>
                                <th className="px-6 py-3 text-right">Montant TTC</th>
                                <th className="px-6 py-3 text-center">Paiement</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.InvoiceStats?.RecentInvoices?.map((inv: invoice.InvoiceResponse) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm font-medium text-primary-600">
                                        {inv.customFormattedId || inv.formattedId}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {inv.date}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {inv.clientName}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                                        {inv.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {inv.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => onEditInvoice && onEditInvoice(inv)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                        >
                                            Modifier
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!stats.InvoiceStats?.RecentInvoices || stats.InvoiceStats.RecentInvoices.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucune facture récente
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
