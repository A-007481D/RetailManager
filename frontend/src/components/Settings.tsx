import React, { useEffect, useState } from 'react';
import { GetSettings, UpdateSettings } from '../../wailsjs/go/main/App';
import { settings } from '../../wailsjs/go/models';
import { SaveIcon, WarningIcon } from './Icons';

export const SettingsTab: React.FC = () => {
    const [formData, setFormData] = useState<any>({
        companyName: '',
        companyIce: '',
        companyAddress: '',
        tvaRate: 20,
        googleSheetsId: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await GetSettings();
                setFormData(data as any);
            } catch (err) {
                console.error("Failed to load settings:", err);
                setError("Impossible de charger les paramètres.");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name === 'tvaRate' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await UpdateSettings(formData as any);
            setFormData(result as any);
            setSuccess("Paramètres enregistrés avec succès.");
        } catch (err: any) {
            console.error("Failed to save settings:", err);
            setError(err?.message || "Erreur lors de l'enregistrement des paramètres.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    Paramètres
                </h1>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start gap-3">
                    <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium">Erreur</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-start gap-3">
                    <div className="flex-1">
                        <p className="font-medium">Succès</p>
                        <p className="text-sm">{success}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Informations de la Société</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la Société</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ICE (15 chiffres)</label>
                                <input
                                    type="text"
                                    name="companyIce"
                                    value={formData.companyIce}
                                    onChange={handleChange}
                                    maxLength={15}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    name="companyAddress"
                                    value={formData.companyAddress}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Configuration Application</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA (%)</label>
                                <input
                                    type="number"
                                    name="tvaRate"
                                    value={formData.tvaRate}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Google Sheets</label>
                                <p className="text-xs text-gray-500 mb-2">Trouvé dans l'URL: https://docs.google.com/spreadsheets/d/<strong>ID_ICI</strong>/edit</p>
                                <input
                                    type="text"
                                    name="googleSheetsId"
                                    value={formData.googleSheetsId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            "Enregistrement..."
                        ) : (
                            <>
                                <SaveIcon className="w-5 h-5" />
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
