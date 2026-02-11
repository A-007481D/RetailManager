import React from 'react';
import { AlertCircle, X, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-red-600',
            bg: 'bg-red-500 hover:bg-red-600',
            border: 'border-red-200',
            Icon: AlertCircle
        },
        warning: {
            icon: 'text-orange-600',
            bg: 'bg-orange-500 hover:bg-orange-600',
            border: 'border-orange-200',
            Icon: AlertCircle
        },
        info: {
            icon: 'text-blue-600',
            bg: 'bg-blue-500 hover:bg-blue-600',
            border: 'border-blue-200',
            Icon: AlertCircle
        },
        success: {
            icon: 'text-green-600',
            bg: 'bg-green-600 hover:bg-green-700',
            border: 'border-green-200',
            Icon: CheckCircle
        }
    };

    const color = colors[type];
    const IconComponent = color.Icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-gray-50 ${color.icon}`}>
                            <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm transition-colors ${color.bg}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
