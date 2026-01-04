import React from 'react';
import { InvoiceItem } from '../hooks/useInvoice';
import { Product } from '../types/inventory';

interface ItemRowProps {
    item: InvoiceItem;
    index: number;
    products: Product[];
    onUpdate: (index: number, field: keyof InvoiceItem, value: string | number) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({
    item,
    index,
    products,
    onUpdate,
    onRemove,
    canRemove,
}) => {
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = parseInt(e.target.value);
        const product = products.find(p => p.ID === productId);

        if (product) {
            onUpdate(index, 'productId', product.ID);
            onUpdate(index, 'description', product.Name);
            onUpdate(index, 'prixUnitTTC', product.SellingPriceTTC);
        } else {
            // Handle "Other" or custom entry if needed, or just reset
            onUpdate(index, 'productId', 0);
            onUpdate(index, 'description', '');
            onUpdate(index, 'prixUnitTTC', 0);
        }
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <select
                    className="select text-sm"
                    value={item.productId || ''}
                    onChange={handleProductChange}
                >
                    <option value="">Sélectionner un produit</option>
                    {products.map((p) => (
                        <option key={p.ID} value={p.ID}>
                            {p.Name} (Stock: {p.CurrentStock})
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="input text-sm text-center"
                        value={item.quantity || ''}
                        onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
                        onFocus={(e) => e.target.select()}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            const product = products.find(p => p.ID === item.productId);
                            if (product) {
                                onUpdate(index, 'quantity', product.CurrentStock);
                            }
                        }}
                        disabled={!item.productId}
                        className={`text-xs font-medium text-center ${item.productId
                            ? 'text-primary-600 hover:text-primary-800 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'}`}
                    >
                        {item.productId
                            ? `Max: ${products.find(p => p.ID === item.productId)?.CurrentStock}`
                            : 'Max: -'}
                    </button>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input text-sm text-right pr-12"
                        value={item.prixUnitTTC || ''}
                        onChange={(e) => onUpdate(index, 'prixUnitTTC', e.target.value)}
                        onFocus={(e) => e.target.select()}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        DH
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-700">
                        {item.totalTTC.toFixed(2)} DH
                    </span>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="ml-2 p-1.5 text-danger-500 hover:bg-danger-500 hover:text-white rounded-lg transition-all"
                            title="Supprimer"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};
