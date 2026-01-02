import React from 'react';
import { ChequeInfo, EffetInfo } from '../hooks/useInvoice';

interface PaymentSectionProps {
    paymentMethod: 'ESPECE' | 'CHEQUE' | 'EFFET';
    chequeInfo?: ChequeInfo;
    effetInfo?: EffetInfo;
    onPaymentMethodChange: (method: 'ESPECE' | 'CHEQUE' | 'EFFET') => void;
    onChequeInfoChange: (field: keyof ChequeInfo, value: string) => void;
    onEffetInfoChange: (field: keyof EffetInfo, value: string) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
    paymentMethod,
    chequeInfo,
    effetInfo,
    onPaymentMethodChange,
    onChequeInfoChange,
    onEffetInfoChange,
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                💳 Mode de Paiement
            </h3>

            <div className="grid grid-cols-3 gap-3">
                {(['ESPECE', 'CHEQUE', 'EFFET'] as const).map((method) => (
                    <button
                        key={method}
                        type="button"
                        onClick={() => onPaymentMethodChange(method)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 border-2 ${paymentMethod === method
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                            }`}
                    >
                        {method === 'ESPECE' && '💵 Espèce'}
                        {method === 'CHEQUE' && '📝 Chèque'}
                        {method === 'EFFET' && '📄 Effet'}
                    </button>
                ))}
            </div>

            {/* Cheque Fields */}
            {paymentMethod === 'CHEQUE' && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3 animate-fade-in">
                    <h4 className="font-medium text-blue-800">Détails du Chèque</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Numéro de Chèque *</label>
                            <input
                                type="text"
                                className="input"
                                value={chequeInfo?.number || ''}
                                onChange={(e) => onChequeInfoChange('number', e.target.value)}
                                placeholder="N° Chèque"
                            />
                        </div>
                        <div>
                            <label className="label">Banque *</label>
                            <input
                                type="text"
                                className="input"
                                value={chequeInfo?.bank || ''}
                                onChange={(e) => onChequeInfoChange('bank', e.target.value)}
                                placeholder="Nom de la banque"
                            />
                        </div>
                        <div>
                            <label className="label">Ville</label>
                            <input
                                type="text"
                                className="input"
                                value={chequeInfo?.city || ''}
                                onChange={(e) => onChequeInfoChange('city', e.target.value)}
                                placeholder="Ville"
                            />
                        </div>
                        <div>
                            <label className="label">Référence</label>
                            <input
                                type="text"
                                className="input"
                                value={chequeInfo?.reference || ''}
                                onChange={(e) => onChequeInfoChange('reference', e.target.value)}
                                placeholder="Référence"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Effet Fields */}
            {paymentMethod === 'EFFET' && (
                <div className="bg-amber-50 p-4 rounded-lg space-y-3 animate-fade-in">
                    <h4 className="font-medium text-amber-800">Détails de l'Effet</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Ville *</label>
                            <input
                                type="text"
                                className="input"
                                value={effetInfo?.city || ''}
                                onChange={(e) => onEffetInfoChange('city', e.target.value)}
                                placeholder="Ville"
                            />
                        </div>
                        <div>
                            <label className="label">Date d'Échéance *</label>
                            <input
                                type="date"
                                className="input"
                                value={effetInfo?.dateEcheance || ''}
                                onChange={(e) => onEffetInfoChange('dateEcheance', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
