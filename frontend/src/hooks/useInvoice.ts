import { useState, useCallback, useEffect } from 'react';
import { CreateInvoice, CalculateTotals, GeneratePDF, OpenPDF } from '../../wailsjs/go/main/App';
import { invoice } from '../../wailsjs/go/models';

// Types
export interface InvoiceItem {
    productId: number;
    description: string;
    quantity: number;
    prixUnitTTC: number;
    totalTTC: number;
}

export interface ChequeInfo {
    number: string;
    bank: string;
    city: string;
    reference: string;
}

export interface EffetInfo {
    city: string;
    dateEcheance: string;
}

export interface InvoiceFormData {
    date: string;
    customFormattedId?: string;
    clientName: string;
    clientCity: string;
    clientIce: string;
    paymentMethod: 'ESPECE' | 'CHEQUE' | 'EFFET';
    chequeInfo?: ChequeInfo;
    effetInfo?: EffetInfo;
    items: InvoiceItem[];
}

export interface TotalsPreview {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalInWords: string;
}

const DESCRIPTION_OPTIONS = [
    'Produit A',
    'Produit B',
    'Service A',
    'Service B',
    'Maintenance',
    'Consultation',
    'Installation',
    'Autre',
];

const emptyItem = (): InvoiceItem => ({
    productId: 0,
    description: '',
    quantity: 1,
    prixUnitTTC: 0,
    totalTTC: 0,
});

const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export function useInvoice() {
    const [formData, setFormData] = useState<InvoiceFormData>({
        date: formatDate(new Date()),
        customFormattedId: '',
        clientName: '',
        clientCity: '',
        clientIce: '',
        paymentMethod: 'ESPECE',
        items: [emptyItem()],
    });

    const [totalsPreview, setTotalsPreview] = useState<TotalsPreview>({
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0,
        totalInWords: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);

    // Calculate totals whenever items change
    useEffect(() => {
        const totalTTC = formData.items.reduce((sum, item) => sum + item.totalTTC, 0);

        if (totalTTC > 0) {
            CalculateTotals(totalTTC).then((result) => {
                setTotalsPreview({
                    totalHT: result.totalHT as number,
                    totalTVA: result.totalTVA as number,
                    totalTTC: result.totalTTC as number,
                    totalInWords: result.totalInWords as string,
                });
            }).catch(console.error);
        } else {
            setTotalsPreview({
                totalHT: 0,
                totalTVA: 0,
                totalTTC: 0,
                totalInWords: '',
            });
        }
    }, [formData.items]);

    const updateField = useCallback(<K extends keyof InvoiceFormData>(
        field: K,
        value: InvoiceFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(null);
    }, []);

    const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
        setFormData((prev) => {
            const newItems = [...prev.items];
            const item = { ...newItems[index] };

            if (field === 'quantity' || field === 'prixUnitTTC') {
                item[field] = Number(value) || 0;
                item.totalTTC = item.quantity * item.prixUnitTTC;
            } else {
                (item as any)[field] = value;
            }

            newItems[index] = item;
            return { ...prev, items: newItems };
        });
    }, []);

    const addItem = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, emptyItem()],
        }));
    }, []);

    const removeItem = useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    }, []);

    const updateChequeInfo = useCallback((field: keyof ChequeInfo, value: string) => {
        setFormData((prev) => ({
            ...prev,
            chequeInfo: {
                ...(prev.chequeInfo || { number: '', bank: '', city: '', reference: '' }),
                [field]: value,
            },
        }));
    }, []);

    const updateEffetInfo = useCallback((field: keyof EffetInfo, value: string) => {
        setFormData((prev) => ({
            ...prev,
            effetInfo: {
                ...(prev.effetInfo || { city: '', dateEcheance: '' }),
                [field]: value,
            },
        }));
    }, []);

    const validateForm = useCallback((): string | null => {
        if (!formData.clientName.trim()) return 'Le nom du client est requis';
        if (!formData.clientCity.trim()) return 'La ville du client est requise';
        if (formData.clientIce.length !== 15) return 'L\'ICE doit contenir exactement 15 caractères';
        if (formData.items.length === 0) return 'Au moins un article est requis';
        if (formData.items.some(item => item.prixUnitTTC <= 0)) return 'Le prix unitaire doit être supérieur à 0';
        if (formData.items.some(item => item.quantity <= 0)) return 'La quantité doit être supérieure à 0';

        if (formData.paymentMethod === 'CHEQUE') {
            if (!formData.chequeInfo?.number) return 'Le numéro de chèque est requis';
            if (!formData.chequeInfo?.bank) return 'Le nom de la banque est requis';
        }

        if (formData.paymentMethod === 'EFFET') {
            if (!formData.effetInfo?.city) return 'La ville de l\'effet est requise';
            if (!formData.effetInfo?.dateEcheance) return 'La date d\'échéance est requise';
        }

        return null;
    }, [formData]);

    const loadInvoice = useCallback((inv: any) => {
        setEditingId(inv.id);
        setFormData({
            date: inv.date,
            customFormattedId: inv.customFormattedId,
            clientName: inv.clientName,
            clientCity: inv.clientCity,
            clientIce: inv.clientIce,
            paymentMethod: inv.paymentMethod,
            chequeInfo: inv.chequeInfo ? {
                number: inv.chequeInfo.number,
                bank: inv.chequeInfo.bank,
                city: inv.chequeInfo.city,
                reference: inv.chequeInfo.reference,
            } : undefined,
            effetInfo: inv.effetInfo ? {
                city: inv.effetInfo.city,
                dateEcheance: inv.effetInfo.dateEcheance,
            } : undefined,
            items: inv.items.map((item: any) => ({
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                prixUnitTTC: item.prixUnitTTC,
                totalTTC: item.totalTTC,
            })),
        });
    }, []);

    const resetForm = useCallback(() => {
        setEditingId(null);
        setFormData({
            date: formatDate(new Date()),
            customFormattedId: '',
            clientName: '',
            clientCity: '',
            clientIce: '',
            paymentMethod: 'ESPECE',
            items: [emptyItem()],
        });
    }, []);

    const submitInvoice = useCallback(async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Create request using Wails generated model classes
            const request = invoice.InvoiceCreateRequest.createFrom({
                date: formData.date,
                customFormattedId: formData.customFormattedId || '',
                clientName: formData.clientName,
                clientCity: formData.clientCity,
                clientIce: formData.clientIce,
                paymentMethod: formData.paymentMethod,
                chequeInfo: formData.paymentMethod === 'CHEQUE' && formData.chequeInfo
                    ? formData.chequeInfo
                    : undefined,
                effetInfo: formData.paymentMethod === 'EFFET' && formData.effetInfo
                    ? formData.effetInfo
                    : undefined,
                items: formData.items.map(item => ({
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    prixUnitTTC: item.prixUnitTTC,
                })),
            });

            let result;
            if (editingId) {
                // @ts-ignore - UpdateInvoice will be available after regeneration
                result = await window.go.main.App.UpdateInvoice(editingId, request);
                setSuccess(`Facture ${result.formattedId} mise à jour avec succès!`);
            } else {
                result = await CreateInvoice(request);
                setSuccess(`Facture ${result.formattedId} créée avec succès!`);
            }

            // Generate PDF
            const pdfPath = await GeneratePDF(result.id);

            // Open the PDF
            OpenPDF(pdfPath);

            // Reset form
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création/modification de la facture');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, editingId, resetForm]);

    return {
        formData,
        totalsPreview,
        isSubmitting,
        error,
        success,
        editingId,
        updateField,
        updateItem,
        addItem,
        removeItem,
        updateChequeInfo,
        updateEffetInfo,
        submitInvoice,
        loadInvoice,
        resetForm,
        descriptionOptions: DESCRIPTION_OPTIONS,
    };
}
