import React from 'react';
import { InvoiceItem } from '../hooks/useInvoice';

interface ItemRowProps {
    item: InvoiceItem;
    index: number;
    descriptionOptions: string[];
    onUpdate: (index: number, field: keyof InvoiceItem, value: string | number) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({
    item,
    index,
    descriptionOptions,
    onUpdate,
    onRemove,
    canRemove,
}) => {
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
                <select
                    className="select text-sm"
                    value={item.description}
                    onChange={(e) => onUpdate(index, 'description', e.target.value)}
                >
                    {descriptionOptions.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="input text-sm text-center"
                    value={item.quantity || ''}
                    onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
                />
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
