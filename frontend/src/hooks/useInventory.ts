import { useState, useEffect } from 'react';
import { Product } from '../types/inventory';
import { CreateProduct, GetAllProducts, UpdateProduct } from '../../wailsjs/go/main/App';

export const useInventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await GetAllProducts();
            setProducts(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (product: Omit<Product, 'ID'>) => {
        setLoading(true);
        try {
            await CreateProduct(product as any);
            await fetchProducts();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to create product');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (product: Product) => {
        setLoading(true);
        try {
            await UpdateProduct(product as any);
            await fetchProducts();
            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to update product');
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return {
        products,
        loading,
        error,
        fetchProducts,
        addProduct,
        updateProduct,
    };
};
