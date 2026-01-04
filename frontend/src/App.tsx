import { useState } from 'react';
import './style.css';
import { InvoiceForm } from './components/InvoiceForm';
import { ProductList } from './components/ProductList';

function App() {
    const [activeTab, setActiveTab] = useState<'invoices' | 'inventory'>('invoices');

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏪</span>
                    <span className="font-bold text-xl text-gray-800">RetailManager</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'invoices'
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        📄 Factures
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'inventory'
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        📦 Stock
                    </button>
                </div>
            </nav>

            {/* Content */}
            <main>
                {activeTab === 'invoices' ? <InvoiceForm /> : <ProductList />}
            </main>
        </div>
    );
}

export default App;
