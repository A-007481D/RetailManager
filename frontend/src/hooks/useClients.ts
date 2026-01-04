import { useState, useEffect } from 'react';
import { CreateClient, UpdateClient, DeleteClient, GetAllClients, SearchClients } from '../../wailsjs/go/main/App';
import { client } from '../../wailsjs/go/models';

export const useClients = () => {
    const [clients, setClients] = useState<client.Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await GetAllClients();
            setClients(data);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch clients');
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
        try {
            const data = await SearchClients(query);
            setClients(data);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to search clients');
        } finally {
            setLoading(false);
        }
    };

    const addClient = async (c: client.Client) => {
        setLoading(true);
        try {
            await CreateClient(c);
            await fetchClients();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to create client');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateClient = async (c: client.Client) => {
        setLoading(true);
        try {
            await UpdateClient(c);
            await fetchClients();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to update client');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteClient = async (id: number) => {
        setLoading(true);
        try {
            await DeleteClient(id);
            await fetchClients();
        } catch (err: any) {
            setError(err.message || 'Failed to delete client');
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
        fetchClients,
        searchClients,
        addClient,
        updateClient,
        deleteClient,
    };
};
