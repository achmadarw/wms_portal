'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BoxIcon,
    PlusIcon,
    FilterIcon,
    SearchIcon,
    EditIcon,
    TrashIcon,
    XIcon,
    CheckIcon,
    WarehouseIcon,
    TagIcon,
    SpinnerIcon,
    BoxEmptyIcon,
    AlertIcon,
    ChevronLeftDoubleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronRightDoubleIcon,
    ErrorIcon,
} from '@/components/icons';

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

    // RBAC state
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRole, setUserRole] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
        // Load current user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                setUserRole(user.role || '');
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

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

    // Pagination calculations
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Reset to page 1 when items change
    useEffect(() => {
        setCurrentPage(1);
    }, [items.length]);

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white animate-fadeIn'>
                <div className='flex justify-between items-center'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <BoxIcon className='w-8 h-8' />
                            <h1 className='text-3xl font-bold'>Item Master</h1>
                        </div>
                        <p className='text-primary-100 ml-11'>
                            Manage your inventory catalog and stock items
                        </p>
                    </div>
                    {/* Only ADMIN and SUPERVISOR can create items */}
                    {(userRole === 'ADMIN' || userRole === 'SUPERVISOR') && (
                        <button
                            onClick={handleOpenModal}
                            className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition font-bold shadow-xl'
                        >
                            <PlusIcon className='w-5 h-5' />
                            Add New Item
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 animate-slideUp animate-slideUp'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <BoxIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <TagIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <AlertIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <XIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
                <div className='flex items-center gap-6'>
                    <div className='flex items-center gap-2 text-slate-700'>
                        <FilterIcon className='w-5 h-5' />
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
                                Stock & Limits
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Reorder Info
                            </th>
                            {/* Pricing columns - hide for OPERATOR */}
                            {(userRole === 'ADMIN' ||
                                userRole === 'SUPERVISOR') && (
                                <>
                                    <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                        Unit Cost
                                    </th>
                                    <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                        Selling Price
                                    </th>
                                </>
                            )}
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
                                    colSpan={userRole === 'OPERATOR' ? 6 : 8}
                                    className='px-6 py-12 text-center text-slate-500'
                                >
                                    <div className='flex flex-col items-center gap-2'>
                                        <BoxIcon className='w-16 h-16 text-slate-300' />
                                        <p className='font-semibold text-lg'>
                                            No items found
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedItems.map((item) => {
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
                                            <div className='text-xs text-slate-500 mt-1'>
                                                Min: {item.minStockLevel} | Max:{' '}
                                                {item.maxStockLevel || '-'}
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className='text-sm text-slate-900'>
                                                <div className='flex items-center gap-1 mb-1'>
                                                    <span className='text-xs text-slate-500'>
                                                        Reorder Point:
                                                    </span>
                                                    <span className='font-medium'>
                                                        {item.reorderPoint}
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-1'>
                                                    <span className='text-xs text-slate-500'>
                                                        Qty:
                                                    </span>
                                                    <span className='font-medium text-blue-700'>
                                                        {item.reorderQty}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Pricing cells - hide for OPERATOR */}
                                        {(userRole === 'ADMIN' ||
                                            userRole === 'SUPERVISOR') && (
                                            <>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                    Rp
                                                    {item.unitCost.toLocaleString()}
                                                </td>
                                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                                    {item.sellingPrice
                                                        ? `Rp${item.sellingPrice.toLocaleString()}`
                                                        : '-'}
                                                </td>
                                            </>
                                        )}
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                            <div className='flex gap-2'>
                                                {/* Only ADMIN and SUPERVISOR can edit and delete */}
                                                {(userRole === 'ADMIN' ||
                                                    userRole ===
                                                        'SUPERVISOR') && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleOpenEditModal(
                                                                    item
                                                                )
                                                            }
                                                            className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-semibold'
                                                            title='Edit item'
                                                        >
                                                            <EditIcon className='w-4 h-4' />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.id
                                                                )
                                                            }
                                                            className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-semibold'
                                                            title='Delete item'
                                                        >
                                                            <TrashIcon className='w-4 h-4' />
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                {/* OPERATOR sees no action buttons (read-only) */}
                                                {userRole === 'OPERATOR' && (
                                                    <span className='text-sm text-slate-500 italic'>
                                                        Read-only
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {items.length > 0 && (
                    <div className='p-6 border-t border-slate-200 bg-slate-50'>
                        <div className='flex items-center justify-between'>
                            {/* Items Per Page Selector */}
                            <div className='flex items-center gap-3'>
                                <div className='flex items-center gap-2'>
                                    <label className='text-sm text-slate-600 font-medium'>
                                        Items per page:
                                    </label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(
                                                Number(e.target.value)
                                            );
                                            setCurrentPage(1); // Reset to first page
                                        }}
                                        className='px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all'
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Results Info */}
                                <div className='text-sm text-slate-600'>
                                    Showing{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {startIndex + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {Math.min(endIndex, items.length)}
                                    </span>{' '}
                                    of{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {items.length}
                                    </span>{' '}
                                    items
                                </div>
                            </div>

                            {/* Pagination Buttons */}
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='First page'
                                >
                                    <ChevronLeftDoubleIcon className='w-5 h-5' />
                                </button>

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Previous page'
                                >
                                    <ChevronLeftIcon className='w-5 h-5' />
                                </button>

                                {/* Page Numbers */}
                                <div className='flex items-center gap-1'>
                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => i + 1
                                    )
                                        .filter((page) => {
                                            // Show first page, last page, current page, and pages around current
                                            return (
                                                page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <=
                                                    1
                                            );
                                        })
                                        .map((page, index, array) => (
                                            <div
                                                key={page}
                                                className='flex items-center'
                                            >
                                                {/* Show ellipsis if there's a gap */}
                                                {index > 0 &&
                                                    array[index - 1] !==
                                                        page - 1 && (
                                                        <span className='px-2 text-slate-400'>
                                                            ...
                                                        </span>
                                                    )}
                                                <button
                                                    onClick={() =>
                                                        setCurrentPage(page)
                                                    }
                                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                                        currentPage === page
                                                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                                                            : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Next page'
                                >
                                    <ChevronRightIcon className='w-5 h-5' />
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Last page'
                                >
                                    <ChevronRightDoubleIcon className='w-5 h-5' />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                                    <BoxIcon className='w-7 h-7' />
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
                                <XIcon className='w-6 h-6' />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form
                                onSubmit={handleSubmit}
                                className='p-8 space-y-6'
                            >
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp'>
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
                                                <ErrorIcon className='w-4 h-4' />
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
                                            Unit Cost (Rp)
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
                                            Selling Price (Rp)
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
                                    <EditIcon className='w-7 h-7' />
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
                                <XIcon className='w-6 h-6' />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form
                                onSubmit={handleUpdate}
                                className='p-8 space-y-6'
                            >
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp'>
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
                                            Unit Cost (Rp)
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
                                            Selling Price (Rp)
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
                                                    <CheckIcon className='w-5 h-5' />
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
