import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Product } from '../types/inventory';
import { BoxIcon, PlusIcon, EditIcon, CheckCircleIcon, WarningIcon } from './Icons';
import { ConfirmModal } from './ConfirmModal';

export const ProductList: React.FC = () => {
    const { products, loading, error, success, addProduct, updateProduct, deleteProduct, clearError } = useInventory();
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);

    const [formData, setFormData] = useState<Partial<Product>>({
        Reference: '',
        Name: '',
        Category: '',
        BuyingPrice: 0,
        SellingPriceTTC: 0,
        CurrentStock: 0,
        MinStockLevel: 5,
    });

    const resetForm = () => {
        setFormData({
            Reference: '',
            Name: '',
            Category: '',
            BuyingPrice: 0,
            SellingPriceTTC: 0,
            CurrentStock: 0,
            MinStockLevel: 5,
        });
        setEditingProduct(null);
        setIsAdding(false);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({ ...product });
        setIsAdding(true);
    };

    const handleDeleteClick = (id: number) => {
        setProductToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            await deleteProduct(productToDelete);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.Reference || !formData.Name) return;

        let success = false;
        if (editingProduct) {
            success = await updateProduct(formData as Product);
        } else {
            success = await addProduct(formData as Product);
        }

        if (success) {
            resetForm();
        }
    };

    if (loading && products.length === 0) return <div>Chargement...</div>;

    return (
        <div className="p-6">
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Supprimer le produit ?"
                message="Êtes-vous sûr de vouloir supprimer ce produit ? Il sera archivé mais n'apparaîtra plus dans la liste."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start gap-3">
                    <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium">Erreur</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={clearError}
                        className="text-red-700 hover:text-red-900 font-bold text-lg leading-none"
                        aria-label="Fermer"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium">Success</p>
                        <p className="text-sm">{success}</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BoxIcon className="w-8 h-8 text-primary-600" />
                    Stock & Produits
                </h2>
                <button
                    onClick={() => {
                        resetForm();
                        setIsAdding(!isAdding);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    {isAdding ? (
                        'Annuler'
                    ) : (
                        <>
                            <PlusIcon className="w-5 h-5" />
                            Nouveau Produit
                        </>
                    )}
                </button>
            </div>

            {isAdding && (
                <div className="card mb-6 max-w-5xl mx-auto border border-gray-100 shadow-lg">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {editingProduct ? <EditIcon className="w-5 h-5 text-primary-600" /> : <PlusIcon className="w-5 h-5 text-primary-600" />}
                            {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                        </h3>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsAdding(false);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Column 1: Identification */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">📦 Identification</h4>
                                <div>
                                    <label className="label">Référence *</label>
                                    <input
                                        className="input font-mono text-sm"
                                        value={formData.Reference}
                                        onChange={e => setFormData({ ...formData, Reference: e.target.value })}
                                        placeholder="REF-001"
                                        disabled={!!editingProduct}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Nom du Produit *</label>
                                    <input
                                        className="input"
                                        value={formData.Name}
                                        onChange={e => setFormData({ ...formData, Name: e.target.value })}
                                        placeholder="Ex: Sabra Rouge"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Catégorie</label>
                                    <input
                                        className="input"
                                        value={formData.Category}
                                        onChange={e => setFormData({ ...formData, Category: e.target.value })}
                                        placeholder="Ex: Tissus"
                                    />
                                </div>
                            </div>

                            {/* Column 2: Pricing */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">💰 Prix & Coûts</h4>
                                <div>
                                    <label className="label">Prix d'Achat (DH)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.BuyingPrice}
                                        onChange={e => setFormData({ ...formData, BuyingPrice: parseFloat(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="label">Prix de Vente TTC (DH) *</label>
                                    <input
                                        type="number"
                                        className="input font-bold text-gray-800"
                                        value={formData.SellingPriceTTC}
                                        onChange={e => setFormData({ ...formData, SellingPriceTTC: parseFloat(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Column 3: Stock */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">📊 Gestion Stock</h4>
                                <div>
                                    <label className="label">Stock Actuel</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.CurrentStock}
                                        onChange={e => setFormData({ ...formData, CurrentStock: parseInt(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>
                                <div>
                                    <label className="label">Seuil d'Alerte (Min)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="input pr-8"
                                            value={formData.MinStockLevel}
                                            onChange={e => setFormData({ ...formData, MinStockLevel: parseInt(e.target.value) || 0 })}
                                            onFocus={(e) => e.target.select()}
                                            min="0"
                                        />
                                        <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                                            <WarningIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Alerte si stock ≤ ce nombre</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setIsAdding(false);
                                }}
                                className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn-success px-8 py-2 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                {editingProduct ? 'Mettre à jour' : 'Enregistrer le Produit'}
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
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(p => (
                            <tr key={p.ID} className="hover:bg-gray-50">
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
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center justify-center gap-1">
                                            <WarningIcon className="w-3 h-3" /> Bas
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center gap-1">
                                            <CheckCircleIcon className="w-3 h-3" /> OK
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-center flex justify-center gap-2">
                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="text-primary-600 hover:text-primary-800 text-sm font-semibold flex items-center justify-center gap-1"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(p.ID)}
                                        className="text-red-600 hover:text-red-800 text-sm font-semibold flex items-center justify-center gap-1"
                                    >
                                        <WarningIcon className="w-4 h-4" />
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
