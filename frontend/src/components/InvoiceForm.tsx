import React from 'react';
import { useInvoice } from '../hooks/useInvoice';
import { ItemRow } from './ItemRow';
import { PaymentSection } from './PaymentSection';

export const InvoiceForm: React.FC = () => {
    const {
        formData,
        totalsPreview,
        isSubmitting,
        error,
        success,
        updateField,
        updateItem,
        addItem,
        removeItem,
        updateChequeInfo,
        updateEffetInfo,
        submitInvoice,
        descriptionOptions,
    } = useInvoice();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🧾 FactureApp
                    </h1>
                    <p className="text-gray-600">Système de Facturation Professionnel</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-center gap-2">
                        <span>✅</span>
                        <span>{success}</span>
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submitInvoice();
                    }}
                    className="space-y-6"
                >
                    {/* Client Information Card */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                            👤 Informations Client
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.date}
                                    onChange={(e) => updateField('date', e.target.value)}
                                    placeholder="JJ-MM-AAAA"
                                />
                            </div>
                            <div>
                                <label className="label">Nom du Client *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.clientName}
                                    onChange={(e) => updateField('clientName', e.target.value)}
                                    placeholder="Société XYZ"
                                />
                            </div>
                            <div>
                                <label className="label">Ville *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.clientCity}
                                    onChange={(e) => updateField('clientCity', e.target.value)}
                                    placeholder="Casablanca"
                                />
                            </div>
                            <div>
                                <label className="label">ICE * (15 caractères)</label>
                                <input
                                    type="text"
                                    className="input font-mono"
                                    maxLength={15}
                                    value={formData.clientIce}
                                    onChange={(e) => updateField('clientIce', e.target.value)}
                                    placeholder="000000000000000"
                                />
                                <span className={`text-xs ${formData.clientIce.length === 15 ? 'text-green-600' : 'text-gray-500'}`}>
                                    {formData.clientIce.length}/15 caractères
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table Card */}
                    <div className="card">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                📦 Articles
                            </h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="btn-primary text-sm flex items-center gap-1"
                            >
                                <span>+</span> Ajouter
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 text-sm">
                                        <th className="px-4 py-3 text-left rounded-tl-lg">Description</th>
                                        <th className="px-4 py-3 text-center w-24">Quantité</th>
                                        <th className="px-4 py-3 text-center w-40">Prix Unit. TTC</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg w-40">Total TTC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {formData.items.map((item, index) => (
                                        <ItemRow
                                            key={index}
                                            item={item}
                                            index={index}
                                            descriptionOptions={descriptionOptions}
                                            onUpdate={updateItem}
                                            onRemove={removeItem}
                                            canRemove={formData.items.length > 1}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Preview Card */}
                    <div className="card bg-gradient-to-r from-primary-50 to-blue-50">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                            💰 Récapitulatif
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500">Total HT</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {totalsPreview.totalHT.toFixed(2)} DH
                                </p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500">TVA (20%)</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {totalsPreview.totalTVA.toFixed(2)} DH
                                </p>
                            </div>
                            <div className="text-center p-4 bg-primary-600 rounded-lg shadow-sm">
                                <p className="text-sm text-primary-100">Total TTC</p>
                                <p className="text-2xl font-bold text-white">
                                    {totalsPreview.totalTTC.toFixed(2)} DH
                                </p>
                            </div>
                        </div>

                        {/* Total in Words */}
                        {totalsPreview.totalInWords && (
                            <div className="p-4 bg-white rounded-lg border-l-4 border-primary-500">
                                <p className="text-sm text-gray-600 italic">
                                    {totalsPreview.totalInWords}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Payment Section Card */}
                    <div className="card">
                        <PaymentSection
                            paymentMethod={formData.paymentMethod}
                            chequeInfo={formData.chequeInfo}
                            effetInfo={formData.effetInfo}
                            onPaymentMethodChange={(method) => updateField('paymentMethod', method)}
                            onChequeInfoChange={updateChequeInfo}
                            onEffetInfoChange={updateEffetInfo}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`btn-success text-lg px-8 py-3 flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <span>📄</span>
                                    Créer la Facture & Générer PDF
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
