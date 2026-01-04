import { useState } from 'react';
import './style.css';
import { InvoiceForm } from './components/InvoiceForm';
import { ProductList } from './components/ProductList';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';

function App() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'inventory' | 'clients'>('dashboard');
    const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);

    const handleEditInvoice = (invoice: any) => {
        setInvoiceToEdit(invoice);
        setActiveTab('invoices');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🧾</span>
                    <span className="font-bold text-xl text-gray-800 tracking-tight">RetailManager</span>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => {
                            setActiveTab('dashboard');
                            setInvoiceToEdit(null);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                    >
                        Tableau de Bord
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('invoices');
                            // Don't clear here to allow returning to edit if desired, 
                            // OR clear if we want "Invoices" tab to always start fresh.
                            // User request implies they want to avoid "mistaken re-edit".
                            // So if they click "Invoices" manually, it should probably be fresh.
                            // But if they are editing, they are ALREADY on 'invoices'.
                            // If they click 'invoices' while editing, maybe reset?
                            // Let's stick to clearing on OTHER tabs for now as requested.
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'invoices'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                    >
                        Factures
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('inventory');
                            setInvoiceToEdit(null);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'inventory'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                    >
                        Stock
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('clients');
                            setInvoiceToEdit(null);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'clients'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                    >
                        Clients
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {activeTab === 'dashboard' && <Dashboard onEditInvoice={handleEditInvoice} />}
                {activeTab === 'invoices' && <InvoiceForm invoiceToEdit={invoiceToEdit} onEditComplete={() => setInvoiceToEdit(null)} />}
                {activeTab === 'inventory' && <ProductList />}
                {activeTab === 'clients' && <ClientList />}
            </main>
        </div>
    );
}

export default App;
