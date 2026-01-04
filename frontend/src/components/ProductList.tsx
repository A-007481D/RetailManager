import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Product } from '../types/inventory';

export const ProductList: React.FC = () => {
    const { products, loading, error, addProduct } = useInventory();
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        Reference: '',
        Name: '',
        Category: '',
        BuyingPrice: 0,
        SellingPriceTTC: 0,
        CurrentStock: 0,
        MinStockLevel: 5,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.Reference || !newProduct.Name) return;

        const success = await addProduct(newProduct as Product);
        if (success) {
            setIsAdding(false);
            setNewProduct({
                Reference: '',
                Name: '',
                Category: '',
                BuyingPrice: 0,
                SellingPriceTTC: 0,
                CurrentStock: 0,
                MinStockLevel: 5,
            });
        }
    };

    if (loading && products.length === 0) return <div>Chargement...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📦 Stock & Produits</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary"
                >
                    {isAdding ? 'Annuler' : '+ Nouveau Produit'}
                </button>
            </div>

            {isAdding && (
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4">Nouveau Produit</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Référence</label>
                            <input
                                className="input"
                                value={newProduct.Reference}
                                onChange={e => setNewProduct({ ...newProduct, Reference: e.target.value })}
                                placeholder="REF-001"
                            />
                        </div>
                        <div>
                            <label className="label">Nom</label>
                            <input
                                className="input"
                                value={newProduct.Name}
                                onChange={e => setNewProduct({ ...newProduct, Name: e.target.value })}
                                placeholder="Produit X"
                            />
                        </div>
                        <div>
                            <label className="label">Catégorie</label>
                            <input
                                className="input"
                                value={newProduct.Category}
                                onChange={e => setNewProduct({ ...newProduct, Category: e.target.value })}
                                placeholder="Général"
                            />
                        </div>
                        <div>
                            <label className="label">Stock Actuel</label>
                            <input
                                type="number"
                                className="input"
                                value={newProduct.CurrentStock}
                                onChange={e => setNewProduct({ ...newProduct, CurrentStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="label">Prix Achat</label>
                            <input
                                type="number"
                                className="input"
                                value={newProduct.BuyingPrice}
                                onChange={e => setNewProduct({ ...newProduct, BuyingPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="label">Prix Vente TTC</label>
                            <input
                                type="number"
                                className="input"
                                value={newProduct.SellingPriceTTC}
                                onChange={e => setNewProduct({ ...newProduct, SellingPriceTTC: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="btn-success w-full">
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Réf</th>
                            <th className="px-4 py-2 text-left">Nom</th>
                            <th className="px-4 py-2 text-right">Stock</th>
                            <th className="px-4 py-2 text-right">Prix Vente</th>
                            <th className="px-4 py-2 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(p => (
                            <tr key={p.ID}>
                                <td className="px-4 py-2 font-mono text-sm">{p.Reference}</td>
                                <td className="px-4 py-2">{p.Name}</td>
                                <td className="px-4 py-2 text-right font-bold">
                                    {p.CurrentStock}
                                </td>
                                <td className="px-4 py-2 text-right">
                                    {p.SellingPriceTTC.toFixed(2)} DH
                                </td>
                                <td className="px-4 py-2 text-center">
                                    {p.CurrentStock <= p.MinStockLevel ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                            ⚠️ Bas
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                            OK
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
