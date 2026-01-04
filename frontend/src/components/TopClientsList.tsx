import React from 'react';

interface TopClientsListProps {
    data: { name: string; totalSpend: number; invoiceCount: number }[];
}

export const TopClientsList: React.FC<TopClientsListProps> = ({ data }) => {
    return (
        <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Clients</h3>
            <div className="flex-1 overflow-auto">
                <div className="space-y-3">
                    {data.map((client, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                        index === 1 ? 'bg-gray-200 text-gray-600' :
                                            index === 2 ? 'bg-orange-100 text-orange-600' :
                                                'bg-blue-50 text-blue-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 truncate max-w-[120px]" title={client.name}>{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.invoiceCount} factures</p>
                                </div>
                            </div>
                            <p className="font-bold text-gray-800 text-sm">
                                {client.totalSpend.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH
                            </p>
                        </div>
                    ))}
                    {data.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Aucune donnée</p>
                    )}
                </div>
            </div>
        </div>
    );
};
