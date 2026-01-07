import React, { useEffect, useState } from 'react';
import { GetDashboardStats, GetAvailableYears, GeneratePDF, OpenPDF, PrintPDF, GetVersion } from '../../wailsjs/go/main/App';
import { main, invoice } from '../../wailsjs/go/models';
import {
    TrendingUp as TrendingUpIcon,
    Users as UsersIcon,
    Package as PackageIcon,
    AlertCircle as AlertIcon,
    DollarSign as MoneyIcon,
    Calendar as CalendarIcon,
    Eye as EyeIcon,
    Printer as PrinterIcon
} from 'lucide-react';
import { MoneyIcon as MoneyIconLegacy, BoxIcon, DocumentCheckIcon, WarningIcon, InvoiceIcon, PlusIcon, EditIcon } from './Icons';
import { RevenueChart } from './RevenueChart';
import { TopProductsChart } from './TopProductsChart';
import { TopClientsList } from './TopClientsList';

interface DashboardProps {
    onNewInvoice?: () => void;
    onEditInvoice?: (invoice: any) => void;
}

// Extend the generated type to include new fields until regeneration
// interface ExtendedDashboardStats extends main.DashboardStats {
//     InvoiceStats?: {
//         TotalRevenue: number;
//         TotalInvoices: number;
//         RecentInvoices: invoice.InvoiceResponse[];
//         MonthlyRevenue: { month: string; revenue: number }[];
//         TopClients: { name: string; totalSpend: number; invoiceCount: number }[];
//         TopProducts: { name: string; quantitySold: number; revenue: number }[];
//     };
// }

export const Dashboard: React.FC<DashboardProps> = ({ onNewInvoice, onEditInvoice }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [version, setVersion] = useState<string>('');

    const loadStats = async () => {
        try {
            // @ts-ignore - GetDashboardStats signature update pending rebuild
            const data = await GetDashboardStats(selectedYear);
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadYears = async () => {
        try {
            // @ts-ignore - GetAvailableYears signature update pending rebuild
            const years = await GetAvailableYears();
            setAvailableYears(years);
        } catch (error) {
            console.error('Failed to load available years:', error);
        }
    };

    const loadVersion = async () => {
        try {
            const ver = await GetVersion();
            setVersion(ver);
        } catch (error) {
            console.error('Failed to load version:', error);
        }
    };

    useEffect(() => {
        loadYears();
        loadVersion();
    }, []);

    useEffect(() => {
        loadStats();
        // Refresh every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [selectedYear]); // Reload when year changes

    if (loading) return <div className="p-8 text-center">Chargement du tableau de bord...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Erreur de chargement</div>;

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <TrendingUpIcon className="w-8 h-8 text-blue-600" />
                    Tableau de Bord
                </h2>

                {/* Year Selector */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent font-medium text-gray-700 focus:outline-none"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* PDF Error Alert */}
            {pdfError && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start gap-3">
                    <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium">Erreur PDF</p>
                        <p className="text-sm">{pdfError}</p>
                    </div>
                    <button
                        onClick={() => setPdfError(null)}
                        className="text-red-700 hover:text-red-900 font-bold text-lg leading-none"
                        aria-label="Fermer"
                    >
                        ×
                    </button>
                </div>
            )}

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

                {/* Net Profit Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                        <MoneyIcon className="w-8 h-8" /> {/* Reusing MoneyIcon, consider a specific icon if available */}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Bénéfice Net</p>
                        <p className="text-2xl font-bold text-emerald-600" title={`${stats.InvoiceStats?.TotalNetProfit?.toFixed(2) || '0.00'} DH`}>
                            {(stats.InvoiceStats?.TotalNetProfit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, ' ')} <span className="text-lg">DH</span>
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
                    <div className={`p - 4 rounded - full ${stats.InventoryStats?.LowStockCount! > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'} `}>
                        <WarningIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Stock Faible</p>
                        <p className={`text - 2xl font - bold ${stats.InventoryStats?.LowStockCount! > 0 ? 'text-red-600' : 'text-gray-800'} `}>
                            {stats.InventoryStats?.LowStockCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart (2/3 width) */}
                <div className="lg:col-span-2">
                    <RevenueChart data={stats.InvoiceStats?.MonthlyRevenue || []} />
                </div>

                {/* Top Products (1/3 width) */}
                <div className="lg:col-span-1">
                    <TopProductsChart data={stats.InvoiceStats?.TopProducts || []} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Top Clients (1/3 width) */}
                <div className="lg:col-span-1">
                    <TopClientsList data={stats.InvoiceStats?.TopClients || []} />
                </div>

                {/* Recent Invoices (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setPdfError(null);
                                                            const pdfPath = await GeneratePDF(inv.id);
                                                            await OpenPDF(pdfPath);
                                                        } catch (err: any) {
                                                            setPdfError(err?.message || "Erreur lors de l'ouverture du PDF");
                                                        }
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Voir PDF"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setPdfError(null);
                                                            const pdfPath = await GeneratePDF(inv.id);
                                                            await PrintPDF(pdfPath);
                                                        } catch (err: any) {
                                                            setPdfError(err?.message || "Erreur lors de l'impression du PDF");
                                                        }
                                                    }}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Imprimer"
                                                >
                                                    <PrinterIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEditInvoice && onEditInvoice(inv)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    Modifier
                                                </button>
                                            </div>
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

            {/* Footer with Version */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                    RetailManager v{version} · © 2026 A-007481D
                </p>
            </div>
        </div>
    );
};
