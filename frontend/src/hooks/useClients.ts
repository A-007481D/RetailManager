import { useState, useEffect, useRef } from 'react';
import { CreateClient, UpdateClient, DeleteClient, GetAllClients, SearchClients } from '../../wailsjs/go/main/App';
import { client } from '../../wailsjs/go/models';

export const useClients = () => {
    const [clients, setClients] = useState<client.Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState<string | null>(null);
    const successTimeoutRef = useRef<number | null>(null);

    // Success messages auto-clear after 3 seconds
    useEffect(() => {
        if (success) {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
            successTimeoutRef.current = setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
        };
    }, [success]);

    const fetchClients = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await GetAllClients();
            setClients(data);
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Échec du chargement des clients';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const searchClients = async (query: string) => {
        if (!query) {
            fetchClients();
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await SearchClients(query);
            setClients(data);
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Échec de la recherche';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const addClient = async (c: client.Client) => {
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            await CreateClient(c);
            await fetchClients();
            setSuccess('Client créé avec succès');
            return true;
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Échec de la création du client';
            setError(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateClient = async (c: client.Client) => {
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            await UpdateClient(c);
            await fetchClients();
            setSuccess('Client mis à jour avec succès');
            return true;
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Échec de la mise à jour du client';
            setError(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteClient = async (id: number) => {
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            await DeleteClient(id);
            await fetchClients();
            setSuccess('Client supprimé avec succès');
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Échec de la suppression du client';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    return {
        clients,
        loading,
        error,
        success,
        fetchClients,
        searchClients,
        addClient,
        updateClient,
        deleteClient,
        clearError: () => setError(''),
    };
};
