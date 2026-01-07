import { useState, useEffect, useRef } from 'react';
import { Product } from '../types/inventory';
import { CreateProduct, GetAllProducts, UpdateProduct, DeleteProduct } from '../../wailsjs/go/main/App';

export const useInventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await GetAllProducts();
            setProducts(data);
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Failed to fetch products';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (product: Omit<Product, 'ID'>) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await CreateProduct(product as any);
            await fetchProducts();
            setSuccess('Product created successfully');
            return true;
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Failed to create product';
            setError(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (product: Product) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await UpdateProduct(product as any);
            await fetchProducts();
            setSuccess('Product updated successfully');
            return true;
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Failed to update product';
            setError(errorMsg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: number) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await DeleteProduct(id);
            await fetchProducts();
            setSuccess('Product deleted successfully');
            return true;
        } catch (err: any) {
            const errorMsg = err?.message || String(err) || 'Failed to delete product';
            setError(errorMsg);
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
        success,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        clearError: () => setError(null),
    };
};
