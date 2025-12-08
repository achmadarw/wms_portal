'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    categoryId?: string;
    category?: {
        id: string;
        code: string;
        name: string;
    };
    unitOfMeasure: string;
    weight?: number;
    dimensions?: string;
    unitCost: number;
    sellingPrice?: number;
    minStockLevel: number;
    maxStockLevel?: number;
    reorderPoint: number;
    reorderQty: number;
    manufacturer?: string;
    supplier?: string;
    leadTimeDays?: number;
    imageUrl?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    inventoryItems?: Array<{
        quantity: number;
        availableQty: number;
        warehouse: {
            id: string;
            name: string;
        };
    }>;
}

export default function ItemsPage() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<
        Array<{ id: string; code: string; name: string }>
    >([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        sku: '',
        barcode: '',
        name: '',
        description: '',
        categoryId: '',
        unitOfMeasure: 'PCS',
        weight: '',
        dimensions: '',
        unitCost: '',
        sellingPrice: '',
        minStockLevel: '0',
        maxStockLevel: '',
        reorderPoint: '0',
        reorderQty: '0',
        manufacturer: '',
        supplier: '',
        leadTimeDays: '',
        imageUrl: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Unit of Measure options
    const uomOptions = [
        'PCS',
        'BOX',
        'PACK',
        'KG',
        'GRAM',
        'LITER',
        'METER',
        'SET',
    ];

    useEffect(() => {
        fetchCategories();
        fetchItems();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/categories', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            if (!token) {
                alert('No authentication token found. Please login again.');
                router.push('/login');
                return;
            }

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter) params.append('categoryId', categoryFilter);

            const response = await fetch(`/api/items?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch items');
            }

            if (data.items) {
                setItems(data.items);
            } else {
                console.warn('No items field in response:', data);
                setItems([]);
            }
        } catch (error: any) {
            console.error('Error fetching items:', error);
            alert(error.message || 'Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            sku: '',
            barcode: '',
            name: '',
            description: '',
            categoryId: '',
            unitOfMeasure: 'PCS',
            weight: '',
            dimensions: '',
            unitCost: '',
            sellingPrice: '',
            minStockLevel: '0',
            maxStockLevel: '',
            reorderPoint: '0',
            reorderQty: '0',
            manufacturer: '',
            supplier: '',
            leadTimeDays: '',
            imageUrl: '',
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            sku: '',
            barcode: '',
            name: '',
            description: '',
            category: '',
            unitOfMeasure: 'PCS',
            weight: '',
            dimensions: '',
            unitCost: '',
            sellingPrice: '',
            minStockLevel: '0',
            maxStockLevel: '',
            reorderPoint: '0',
            reorderQty: '0',
            manufacturer: '',
            supplier: '',
            leadTimeDays: '',
            imageUrl: '',
        });
        setFormErrors({});
    };

    const handleOpenEditModal = (item: Item) => {
        setEditingItem(item);
        setFormData({
            sku: item.sku,
            barcode: item.barcode || '',
            name: item.name,
            description: item.description || '',
            categoryId: item.categoryId || '',
            unitOfMeasure: item.unitOfMeasure,
            weight: item.weight?.toString() || '',
            dimensions: item.dimensions || '',
            unitCost: item.unitCost.toString(),
            sellingPrice: item.sellingPrice?.toString() || '',
            minStockLevel: item.minStockLevel.toString(),
            maxStockLevel: item.maxStockLevel?.toString() || '',
            reorderPoint: item.reorderPoint.toString(),
            reorderQty: item.reorderQty.toString(),
            manufacturer: item.manufacturer || '',
            supplier: item.supplier || '',
            leadTimeDays: item.leadTimeDays?.toString() || '',
            imageUrl: item.imageUrl || '',
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingItem(null);
        setFormData({
            sku: '',
            barcode: '',
            name: '',
            description: '',
            categoryId: '',
            unitOfMeasure: 'PCS',
            weight: '',
            dimensions: '',
            unitCost: '',
            sellingPrice: '',
            minStockLevel: '0',
            maxStockLevel: '',
            reorderPoint: '0',
            reorderQty: '0',
            manufacturer: '',
            supplier: '',
            leadTimeDays: '',
            imageUrl: '',
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.sku.trim()) errors.sku = 'SKU is required';
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.categoryId.trim())
            errors.category = 'Category is required';
        if (!formData.unitOfMeasure.trim())
            errors.unitOfMeasure = 'Unit of Measure is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create item');
            }

            alert('Item created successfully!');
            handleCloseModal();
            fetchItems();
        } catch (error: any) {
            console.error('Error creating item:', error);
            alert(error.message || 'Failed to create item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !editingItem) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`/api/items/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update item');
            }

            alert('Item updated successfully!');
            handleCloseEditModal();
            fetchItems();
        } catch (error: any) {
            console.error('Error updating item:', error);
            alert(error.message || 'Failed to update item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (
            !confirm(
                'Are you sure you want to delete this item? This action cannot be undone.'
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete item');
            }

            alert('Item deleted successfully!');
            fetchItems();
        } catch (error: any) {
            console.error('Error deleting item:', error);
            alert(error.message || 'Failed to delete item');
        }
    };

    const getTotalStock = (item: Item) => {
        return (
            item.inventoryItems?.reduce((sum, inv) => sum + inv.quantity, 0) ||
            0
        );
    };

    const getAvailableStock = (item: Item) => {
        return (
            item.inventoryItems?.reduce(
                (sum, inv) => sum + inv.availableQty,
                0
            ) || 0
        );
    };

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white'>
                <div className='flex justify-between items-center'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <svg
                                className='w-8 h-8'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                />
                            </svg>
                            <h1 className='text-3xl font-bold'>Item Master</h1>
                        </div>
                        <p className='text-primary-100 ml-11'>
                            Manage your inventory catalog and stock items
                        </p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition font-bold shadow-xl'
                    >
                        <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                            />
                        </svg>
                        Add New Item
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Total Items
                            </div>
                            <div className='text-3xl font-bold text-slate-900 mt-2'>
                                {items.length}
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <svg
                                className='w-8 h-8 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Categories
                            </div>
                            <div className='text-3xl font-bold text-emerald-600 mt-2'>
                                {new Set(items.map((i) => i.category)).size}
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <svg
                                className='w-8 h-8 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Low Stock Items
                            </div>
                            <div className='text-3xl font-bold text-orange-600 mt-2'>
                                {
                                    items.filter(
                                        (i) =>
                                            getTotalStock(i) > 0 &&
                                            getTotalStock(i) <= i.reorderPoint
                                    ).length
                                }
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <svg
                                className='w-8 h-8 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Out of Stock
                            </div>
                            <div className='text-3xl font-bold text-red-600 mt-2'>
                                {
                                    items.filter((i) => getTotalStock(i) === 0)
                                        .length
                                }
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <svg
                                className='w-8 h-8 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
                <div className='flex items-center gap-6'>
                    <div className='flex items-center gap-2 text-slate-700'>
                        <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                            />
                        </svg>
                        <span className='font-semibold'>Filters:</span>
                    </div>
                    <div className='flex gap-4 flex-1'>
                        <div className='flex-1'>
                            <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                Search
                            </label>
                            <input
                                type='text'
                                placeholder='Search by SKU, name, or barcode...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && fetchItems()
                                }
                                className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                            />
                        </div>
                        <div className='flex-1'>
                            <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                Category
                            </label>
                            <select
                                value={categoryFilter}
                                onChange={(e) =>
                                    setCategoryFilter(e.target.value)
                                }
                                className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                            >
                                <option value=''>All Categories</option>
                                {categories.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} ({cat.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='flex items-end'>
                            <button
                                onClick={fetchItems}
                                className='px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg font-semibold'
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
                <table className='min-w-full divide-y divide-slate-200'>
                    <thead className='bg-gradient-to-r from-slate-50 to-slate-100'>
                        <tr>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                SKU
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Name
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Category
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                UOM
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Stock
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Unit Cost
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Selling Price
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-slate-100'>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className='px-6 py-12 text-center'
                                >
                                    <div className='flex flex-col items-center gap-3'>
                                        <div className='w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin'></div>
                                        <p className='text-slate-600 font-medium'>
                                            Loading items...
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className='px-6 py-12 text-center text-slate-500'
                                >
                                    <div className='flex flex-col items-center gap-2'>
                                        <svg
                                            className='w-16 h-16 text-slate-300'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={1.5}
                                                d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                            />
                                        </svg>
                                        <p className='font-semibold text-lg'>
                                            No items found
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const totalStock = getTotalStock(item);
                                const availableStock = getAvailableStock(item);
                                const stockStatus =
                                    totalStock === 0
                                        ? 'out'
                                        : totalStock <= item.reorderPoint
                                        ? 'low'
                                        : 'ok';

                                return (
                                    <tr
                                        key={item.id}
                                        className='hover:bg-slate-50 transition-colors'
                                    >
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className='text-sm font-medium text-gray-900'>
                                                {item.sku}
                                            </div>
                                            {item.barcode && (
                                                <div className='text-xs text-gray-500'>
                                                    {item.barcode}
                                                </div>
                                            )}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='text-sm font-bold text-slate-900'>
                                                {item.name}
                                            </div>
                                            {item.description && (
                                                <div className='text-xs text-slate-500 truncate max-w-xs'>
                                                    {item.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span className='px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
                                                {item.category?.name ||
                                                    'No Category'}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                            {item.unitOfMeasure}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className='flex items-center gap-2'>
                                                <span
                                                    className={`text-sm font-medium ${
                                                        stockStatus === 'out'
                                                            ? 'text-red-600'
                                                            : stockStatus ===
                                                              'low'
                                                            ? 'text-orange-600'
                                                            : 'text-green-600'
                                                    }`}
                                                >
                                                    {totalStock}
                                                </span>
                                                {stockStatus !== 'ok' && (
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded-full ${
                                                            stockStatus ===
                                                            'out'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-orange-100 text-orange-800'
                                                        }`}
                                                    >
                                                        {stockStatus === 'out'
                                                            ? 'Out'
                                                            : 'Low'}
                                                    </span>
                                                )}
                                            </div>
                                            {totalStock !== availableStock && (
                                                <div className='text-xs text-gray-500'>
                                                    Avail: {availableStock}
                                                </div>
                                            )}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                            ${item.unitCost.toLocaleString()}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                            {item.sellingPrice
                                                ? `$${item.sellingPrice.toLocaleString()}`
                                                : '-'}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                            <div className='flex gap-2'>
                                                <button
                                                    onClick={() =>
                                                        handleOpenEditModal(
                                                            item
                                                        )
                                                    }
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-semibold'
                                                    title='Edit item'
                                                >
                                                    <svg
                                                        className='w-4 h-4'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                        />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-semibold'
                                                    title='Delete item'
                                                >
                                                    <svg
                                                        className='w-4 h-4'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                        />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Item Modal */}
            {showModal && (
                <div
                    className='fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[100000] animate-fadeIn'
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        margin: 0,
                        padding: '1rem',
                        zIndex: 100000,
                    }}
                >
                    <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-slideUp'>
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 flex justify-between items-center flex-shrink-0 rounded-t-2xl'>
                            <div>
                                <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                                    <svg
                                        className='w-7 h-7'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                        />
                                    </svg>
                                    Add New Item
                                </h2>
                                <p className='text-primary-100 text-sm mt-1'>
                                    Create a new item in the catalog
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className='text-white hover:bg-white/30 bg-white/10 rounded-xl p-2 border border-white/20 hover:border-white/40 shadow-lg transition'
                                title='Close'
                            >
                                <svg
                                    className='w-6 h-6'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2.5}
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form
                                onSubmit={handleSubmit}
                                className='p-8 space-y-6'
                            >
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    {/* Basic Information */}
                                    <div className='md:col-span-2'>
                                        <h3 className='text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200'>
                                            Basic Information
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            SKU{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.sku}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    sku: e.target.value,
                                                })
                                            }
                                            className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                                                formErrors.sku
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 focus:border-primary-500'
                                            }`}
                                            placeholder='e.g., ITEM-001'
                                        />
                                        {formErrors.sku && (
                                            <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
                                                {formErrors.sku}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Barcode
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.barcode}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    barcode: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all'
                                            placeholder='e.g., 1234567890123'
                                        />
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Item Name *
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.name
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            }`}
                                            placeholder='e.g., Laptop Dell XPS 15'
                                        />
                                        {formErrors.name && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='Detailed item description...'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Category *
                                        </label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    categoryId: e.target.value,
                                                })
                                            }
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.category
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            <option value=''>
                                                Select category...
                                            </option>
                                            {categories.map((cat: any) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name} ({cat.code})
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.category && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.category}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Unit of Measure *
                                        </label>
                                        <select
                                            value={formData.unitOfMeasure}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    unitOfMeasure:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        >
                                            {uomOptions.map((uom) => (
                                                <option key={uom} value={uom}>
                                                    {uom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Physical Properties */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Physical Properties
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Weight (kg)
                                        </label>
                                        <input
                                            type='number'
                                            step='0.01'
                                            value={formData.weight}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    weight: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0.00'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Dimensions (L×W×H cm)
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.dimensions}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    dimensions: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='e.g., 30×20×10'
                                        />
                                    </div>

                                    {/* Pricing */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Pricing
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Unit Cost ($)
                                        </label>
                                        <input
                                            type='number'
                                            step='0.01'
                                            value={formData.unitCost}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    unitCost: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0.00'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Selling Price ($)
                                        </label>
                                        <input
                                            type='number'
                                            step='0.01'
                                            value={formData.sellingPrice}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    sellingPrice:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0.00'
                                        />
                                    </div>

                                    {/* Stock Control */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Stock Control
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Min Stock Level
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.minStockLevel}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    minStockLevel:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Max Stock Level
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.maxStockLevel}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    maxStockLevel:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Reorder Point
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.reorderPoint}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    reorderPoint:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Reorder Quantity
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.reorderQty}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    reorderQty: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='0'
                                        />
                                    </div>

                                    {/* Supplier Info */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Supplier Information
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Manufacturer
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.manufacturer}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    manufacturer:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='e.g., Dell Inc.'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Supplier
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.supplier}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    supplier: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='e.g., Tech Distributors Inc.'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Lead Time (Days)
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.leadTimeDays}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    leadTimeDays:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='e.g., 7'
                                            min='0'
                                        />
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Image URL
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.imageUrl}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    imageUrl: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='https://example.com/image.jpg'
                                        />
                                    </div>
                                </div>

                                <div className='flex justify-end gap-4 mt-8'>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50'
                                    >
                                        {submitting
                                            ? 'Creating...'
                                            : 'Create Item'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {showEditModal && editingItem && (
                <div
                    className='fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[100000] animate-fadeIn'
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        margin: 0,
                        padding: '1rem',
                        zIndex: 100000,
                    }}
                >
                    <div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-slideUp'>
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 flex justify-between items-center flex-shrink-0 rounded-t-2xl'>
                            <div>
                                <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                                    <svg
                                        className='w-7 h-7'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                        />
                                    </svg>
                                    Edit Item
                                </h2>
                                <p className='text-primary-100 text-sm mt-1'>
                                    Update item information
                                </p>
                            </div>
                            <button
                                onClick={handleCloseEditModal}
                                className='text-white hover:bg-white/30 bg-white/10 rounded-xl p-2 border border-white/20 hover:border-white/40 shadow-lg transition'
                                title='Close'
                            >
                                <svg
                                    className='w-6 h-6'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2.5}
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form
                                onSubmit={handleUpdate}
                                className='p-8 space-y-6'
                            >
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    {/* Basic Information */}
                                    <div className='md:col-span-2'>
                                        <h3 className='text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200'>
                                            Basic Information
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            SKU *
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.sku}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    sku: e.target.value,
                                                })
                                            }
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.sku
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            }`}
                                        />
                                        {formErrors.sku && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.sku}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Barcode
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.barcode}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    barcode: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Item Name *
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.name
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            }`}
                                        />
                                        {formErrors.name && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Category *
                                        </label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    categoryId: e.target.value,
                                                })
                                            }
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                formErrors.category
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            <option value=''>
                                                Select category...
                                            </option>
                                            {categories.map((cat: any) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name} ({cat.code})
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.category && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.category}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Unit of Measure *
                                        </label>
                                        <select
                                            value={formData.unitOfMeasure}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    unitOfMeasure:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        >
                                            {uomOptions.map((uom) => (
                                                <option key={uom} value={uom}>
                                                    {uom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Physical Properties */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Physical Properties
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Weight (kg)
                                        </label>
                                        <input
                                            type='number'
                                            step='0.01'
                                            value={formData.weight}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    weight: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Dimensions (L×W×H cm)
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.dimensions}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    dimensions: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    {/* Pricing */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Pricing
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Unit Cost ($)
                                        </label>
                                        <input
                                            type='number'
                                            step='0.01'
                                            value={formData.unitCost}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    unitCost: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Selling Price ($)
                                        </label>
                                        <input
                                            type='number'
                                            step='0.01'
                                            value={formData.sellingPrice}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    sellingPrice:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    {/* Stock Control */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Stock Control
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Min Stock Level
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.minStockLevel}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    minStockLevel:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Max Stock Level
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.maxStockLevel}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    maxStockLevel:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Reorder Point
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.reorderPoint}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    reorderPoint:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Reorder Quantity
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.reorderQty}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    reorderQty: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    {/* Supplier Info */}
                                    <div className='md:col-span-2 mt-4'>
                                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>
                                            Supplier Information
                                        </h3>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Manufacturer
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.manufacturer}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    manufacturer:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Supplier
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.supplier}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    supplier: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Lead Time (Days)
                                        </label>
                                        <input
                                            type='number'
                                            value={formData.leadTimeDays}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    leadTimeDays:
                                                        e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='e.g., 7'
                                            min='0'
                                        />
                                    </div>

                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Image URL
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.imageUrl}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    imageUrl: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        />
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className='md:col-span-2 flex gap-3 pt-4 border-t border-slate-200'>
                                        <button
                                            type='submit'
                                            disabled={submitting}
                                            className='flex-1 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg
                                                        className='w-5 h-5'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M5 13l4 4L19 7'
                                                        />
                                                    </svg>
                                                    Update Item
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type='button'
                                            onClick={handleCloseEditModal}
                                            className='px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition font-bold'
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
