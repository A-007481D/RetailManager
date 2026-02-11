import React, { useEffect, useState } from 'react';
import { GetAllInvoices, GetAvailableYears, GeneratePDF, OpenPDF, PrintPDF } from '../../wailsjs/go/main/App';
import { invoice } from '../../wailsjs/go/models';
import {
    Eye as EyeIcon,
    Printer as PrinterIcon,
    Search as SearchIcon,
    Calendar as CalendarIcon
} from 'lucide-react';
import { InvoiceIcon, PlusIcon, EditIcon, WarningIcon } from './Icons';

interface InvoiceListProps {
    onNewInvoice: () => void;
    onEditInvoice: (invoice: any) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onNewInvoice, onEditInvoice }) => {
    const [invoices, setInvoices] = useState<invoice.InvoiceResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pdfError, setPdfError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedInvoices, years] = await Promise.all([
                GetAllInvoices(selectedYear),
                GetAvailableYears()
            ]);
            setInvoices(fetchedInvoices || []);
            setAvailableYears(years || []);
        } catch (err) {
            console.error('Failed to load invoices:', err);
            setError("Impossible de charger les factures");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const filteredInvoices = invoices.filter(inv =>
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.formattedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customFormattedId && inv.customFormattedId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        <InvoiceIcon className="w-8 h-8" />
                    </div>
                    Gestion des Factures
                </h1>

                <div className="flex items-center gap-3">
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

                    <button
                        onClick={onNewInvoice}
                        className="btn-primary flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nouvelle Facture
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou numéro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="text-sm text-gray-500">
                    {filteredInvoices.length} facture(s) trouvée(s)
                </div>
            </div>

            {/* Error Alert */}
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
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">N° Facture</th>
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 text-left font-semibold">Client</th>
                                <th className="px-6 py-4 text-right font-semibold">Montant TTC</th>
                                <th className="px-6 py-4 text-center font-semibold">Paiement</th>
                                <th className="px-6 py-4 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucune facture trouvée pour {selectedYear}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
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
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
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
                                                    onClick={() => onEditInvoice(inv)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
