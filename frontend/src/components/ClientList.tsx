import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { client } from '../../wailsjs/go/models';
import { UserIcon, PlusIcon, EditIcon, CheckCircleIcon, WarningIcon, SpinnerIcon } from './Icons';
import { ConfirmModal } from './ConfirmModal';

export const ClientList: React.FC = () => {
    const { clients, loading, error, success, addClient, updateClient, deleteClient, searchClients, clearError } = useClients();
    const [isAdding, setIsAdding] = useState(false);
    const [editingClient, setEditingClient] = useState<client.Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | null>(null);

    const [formData, setFormData] = useState<Partial<client.Client>>({
        name: '',
        ice: '',
        city: '',
        address: '',
        phone: '',
        email: '',
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Trigger search when debounced term changes
    useEffect(() => {
        searchClients(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const resetForm = () => {
        setFormData({
            name: '',
            ice: '',
            city: '',
            address: '',
            phone: '',
            email: '',
        });
        setEditingClient(null);
        setIsAdding(false);
    };

    const handleEdit = (c: client.Client) => {
        setEditingClient(c);
        setFormData({ ...c });
        setIsAdding(true);
    };

    const handleDeleteClick = (id: number) => {
        setClientToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (clientToDelete) {
            await deleteClient(clientToDelete);
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.ice) return;

        // Strict ICE Validation
        if (!/^\d{15}$/.test(formData.ice)) {
            alert("L'ICE doit contenir exactement 15 chiffres.");
            return;
        }

        let success = false;
        if (editingClient) {
            success = await updateClient(formData as client.Client);
        } else {
            success = await addClient(formData as client.Client);
        }

        if (success) {
            resetForm();
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Don't show loading state if we have clients (to prevent UI flash/reset)
    if (loading && clients.length === 0 && !searchTerm) return <div>Chargement...</div>;

    return (
        <div className="p-6">
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Supprimer le client ?"
                message="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
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
                        <p className="font-medium">Succès</p>
                        <p className="text-sm">{success}</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserIcon className="w-8 h-8 text-primary-600" />
                    Clients
                </h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="input max-w-xs pl-10"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        {loading && searchTerm && (
                            <div className="absolute right-3 top-3">
                                <SpinnerIcon className="w-4 h-4 text-primary-600 animate-spin" />
                            </div>
                        )}
                    </div>
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
                                Nouveau Client
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {editingClient ? <EditIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                        {editingClient ? 'Modifier Client' : 'Nouveau Client'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nom / Société *</label>
                            <input
                                className="input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Société XYZ"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">ICE * (15 chiffres)</label>
                            <input
                                className={`input font-mono ${formData.ice && !/^\d{15}$/.test(formData.ice)
                                    ? 'border-red-500 focus:ring-red-500'
                                    : ''
                                    }`}
                                value={formData.ice}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, ice: val });
                                }}
                                maxLength={15}
                                placeholder="000000000000000"
                                required
                            />
                            <div className="flex justify-between mt-1">
                                <span className={`text-xs ${formData.ice?.length === 15 ? 'text-green-600' : 'text-gray-500'}`}>
                                    {formData.ice?.length || 0}/15 chiffres
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="label">Ville</label>
                            <input
                                className="input"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder="Casablanca"
                            />
                        </div>
                        <div>
                            <label className="label">Adresse</label>
                            <input
                                className="input"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Rue..."
                            />
                        </div>
                        <div>
                            <label className="label">Téléphone</label>
                            <input
                                className="input"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="06..."
                            />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input
                                className="input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="contact@xyz.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="btn-success w-full flex justify-center items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" />
                                {editingClient ? 'Mettre à jour' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Nom</th>
                            <th className="px-4 py-2 text-left">ICE</th>
                            <th className="px-4 py-2 text-left">Ville</th>
                            <th className="px-4 py-2 text-left">Téléphone</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {clients.map(c => (
                            <tr key={c.ID} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{c.name}</td>
                                <td className="px-4 py-2 font-mono text-sm">{c.ice}</td>
                                <td className="px-4 py-2">{c.city}</td>
                                <td className="px-4 py-2">{c.phone}</td>
                                <td className="px-4 py-2 text-center flex justify-center gap-2">
                                    <button
                                        onClick={() => handleEdit(c)}
                                        className="text-primary-600 hover:text-primary-800 text-sm font-semibold flex items-center gap-1"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(c.ID)}
                                        className="text-red-600 hover:text-red-800 text-sm font-semibold flex items-center gap-1"
                                    >
                                        <WarningIcon className="w-4 h-4" />
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {clients.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    Aucun client trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
