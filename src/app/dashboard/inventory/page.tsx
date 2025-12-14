'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BoxIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    AlertIcon,
    SearchIcon,
    FilterIcon,
    DownloadIcon,
    DollarIcon,
} from '@/components/icons';
import Pagination from '@/components/Pagination';
import { withProgress } from '@/lib/progress';
import {
    formatNumber,
    formatCompactCurrency,
    formatCurrency,
} from '@/lib/formatNumber';

interface InventoryItem {
    id: string;
    quantity: number;
    reservedQty: number;
    availableQty: number;
    batchNumber: string | null;
    expiryDate: string | null;
    itemMaster: {
        id: string;
        sku: string;
        name: string;
        barcode: string | null;
        unitOfMeasure: string;
        unitCost: number | null;
        minStockLevel: number | null;
        maxStockLevel: number | null;
        category: {
            id: string;
            code: string;
            name: string;
        } | null;
    };
    warehouse: {
        id: string;
        code: string;
        name: string;
        city: string;
    };
    bin: {
        id: string;
        code: string;
        name: string;
        row: number;
        column: number;
        level: number;
    } | null;
}

interface Summary {
    totalItems: number;
    totalQuantity: number;
    totalAvailable: number;
    totalReserved: number;
    totalValue: number;
    outOfStock: number;
    lowStock: number;
    inStock: number;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Category {
    id: string;
    code: string;
    name: string;
}

export default function InventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalItems: 0,
        totalQuantity: 0,
        totalAvailable: 0,
        totalReserved: 0,
        totalValue: 0,
        outOfStock: 0,
        lowStock: 0,
        inStock: 0,
    });
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [filters, setFilters] = useState({
        warehouseId: '',
        categoryId: '',
        stockStatus: '',
        search: '',
    });

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }
            fetchWarehouses();
            fetchCategories();
            fetchInventory();
        };

        checkAuth();
    }, [router]);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchInventory();
    }, [filters]);

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setWarehouses(data.warehouses || []);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/categories', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            // Build query params
            const params = new URLSearchParams();
            if (filters.warehouseId)
                params.append('warehouseId', filters.warehouseId);
            if (filters.categoryId)
                params.append('categoryId', filters.categoryId);
            if (filters.stockStatus)
                params.append('stockStatus', filters.stockStatus);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(`/api/inventory?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (item: InventoryItem) => {
        const available = item.availableQty;
        const minStock = item.itemMaster.minStockLevel || 0;

        if (available === 0) {
            return {
                label: 'Out of Stock',
                color: 'text-red-700 bg-red-100',
                icon: AlertIcon,
            };
        } else if (available <= minStock) {
            return {
                label: 'Low Stock',
                color: 'text-yellow-700 bg-yellow-100',
                icon: TrendingDownIcon,
            };
        } else {
            return {
                label: 'In Stock',
                color: 'text-green-700 bg-green-100',
                icon: BoxIcon,
            };
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            warehouseId: '',
            categoryId: '',
            stockStatus: '',
            search: '',
        });
    };

    // Pagination calculations
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white'>
                <div className='flex items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <BoxIcon className='w-8 h-8' />
                            <h1 className='text-3xl font-bold'>
                                Inventory Dashboard
                            </h1>
                        </div>
                        <p className='text-primary-100'>
                            Real-time inventory levels and stock management
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideUp'>
                {/* Total Items */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl'>
                            <BoxIcon className='w-6 h-6 text-blue-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Total Items
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {summary.totalItems}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Quantity */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl'>
                            <TrendingUpIcon className='w-6 h-6 text-green-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Total Quantity
                            </p>
                            <p
                                className='text-2xl font-bold text-slate-800'
                                title={formatNumber(summary.totalQuantity)}
                            >
                                {formatNumber(summary.totalQuantity)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Value */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl'>
                            <DollarIcon className='w-6 h-6 text-purple-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Total Value
                            </p>
                            <p
                                className='text-2xl font-bold text-slate-800'
                                title={formatCurrency(summary.totalValue)}
                            >
                                {formatCompactCurrency(summary.totalValue)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl'>
                            <AlertIcon className='w-6 h-6 text-red-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Low Stock Alerts
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {summary.lowStock + summary.outOfStock}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Status Summary */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                <h2 className='text-lg font-semibold text-slate-800 mb-4'>
                    Stock Status Overview
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideUp'>
                    <div className='p-4 bg-green-50 rounded-xl border border-green-200'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-green-600 font-medium'>
                                    In Stock
                                </p>
                                <p className='text-2xl font-bold text-green-700'>
                                    {summary.inStock}
                                </p>
                            </div>
                            <BoxIcon className='w-8 h-8 text-green-600' />
                        </div>
                    </div>
                    <div className='p-4 bg-yellow-50 rounded-xl border border-yellow-200'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-yellow-600 font-medium'>
                                    Low Stock
                                </p>
                                <p className='text-2xl font-bold text-yellow-700'>
                                    {summary.lowStock}
                                </p>
                            </div>
                            <TrendingDownIcon className='w-8 h-8 text-yellow-600' />
                        </div>
                    </div>
                    <div className='p-4 bg-red-50 rounded-xl border border-red-200'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-red-600 font-medium'>
                                    Out of Stock
                                </p>
                                <p className='text-2xl font-bold text-red-700'>
                                    {summary.outOfStock}
                                </p>
                            </div>
                            <AlertIcon className='w-8 h-8 text-red-600' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                <div className='flex items-center gap-2 mb-4'>
                    <FilterIcon className='w-5 h-5 text-slate-600' />
                    <h2 className='text-lg font-semibold text-slate-800'>
                        Filters
                    </h2>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideUp'>
                    {/* Search */}
                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Search
                        </label>
                        <div className='relative'>
                            <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                            <input
                                type='text'
                                placeholder='SKU, Name, or Barcode'
                                value={filters.search}
                                onChange={(e) =>
                                    handleFilterChange('search', e.target.value)
                                }
                                className='w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                            />
                        </div>
                    </div>

                    {/* Warehouse Filter */}
                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Warehouse
                        </label>
                        <select
                            value={filters.warehouseId}
                            onChange={(e) =>
                                handleFilterChange(
                                    'warehouseId',
                                    e.target.value
                                )
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        >
                            <option value=''>All Warehouses</option>
                            {warehouses.map((wh) => (
                                <option key={wh.id} value={wh.id}>
                                    {wh.name} ({wh.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Category
                        </label>
                        <select
                            value={filters.categoryId}
                            onChange={(e) =>
                                handleFilterChange('categoryId', e.target.value)
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        >
                            <option value=''>All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} ({cat.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stock Status Filter */}
                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Stock Status
                        </label>
                        <select
                            value={filters.stockStatus}
                            onChange={(e) =>
                                handleFilterChange(
                                    'stockStatus',
                                    e.target.value
                                )
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        >
                            <option value=''>All Status</option>
                            <option value='in-stock'>In Stock</option>
                            <option value='low-stock'>Low Stock</option>
                            <option value='out-of-stock'>Out of Stock</option>
                        </select>
                    </div>
                </div>
                {(filters.warehouseId ||
                    filters.categoryId ||
                    filters.stockStatus ||
                    filters.search) && (
                    <button
                        onClick={clearFilters}
                        className='mt-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium'
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Inventory Table */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
                <div className='p-6 border-b border-slate-200'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-lg font-semibold text-slate-800'>
                            Inventory Items ({items.length})
                        </h2>
                        <button className='flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors'>
                            <DownloadIcon className='w-4 h-4' />
                            Export
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className='text-center py-12'>
                        <div className='inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin'></div>
                        <p className='text-slate-600 mt-4'>
                            Loading inventory...
                        </p>
                    </div>
                ) : items.length === 0 ? (
                    <div className='text-center py-12'>
                        <BoxIcon className='w-16 h-16 text-slate-300 mx-auto mb-4' />
                        <p className='text-slate-600 text-lg'>
                            No inventory items found
                        </p>
                        <p className='text-slate-500 mt-2'>
                            Try adjusting your filters
                        </p>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-slate-50 border-b border-slate-200'>
                                <tr>
                                    <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Item
                                    </th>
                                    <th className='px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Location
                                    </th>
                                    <th className='px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Quantity
                                    </th>
                                    <th className='px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Reserved
                                    </th>
                                    <th className='px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Available
                                    </th>
                                    <th className='px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Status
                                    </th>
                                    <th className='px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                                        Value
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-200'>
                                {paginatedItems.map((item) => {
                                    const status = getStockStatus(item);
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr
                                            key={item.id}
                                            className='hover:bg-slate-50 transition-colors'
                                        >
                                            <td className='px-6 py-4'>
                                                <div className='flex flex-col'>
                                                    <span className='font-semibold text-slate-800'>
                                                        {item.itemMaster.name}
                                                    </span>
                                                    <span className='text-sm text-slate-600'>
                                                        SKU:{' '}
                                                        {item.itemMaster.sku}
                                                    </span>
                                                    {item.itemMaster
                                                        .category && (
                                                        <span className='text-xs text-slate-500'>
                                                            {
                                                                item.itemMaster
                                                                    .category
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex flex-col'>
                                                    <span className='font-medium text-slate-800'>
                                                        {item.warehouse.name}
                                                    </span>
                                                    <span className='text-sm text-slate-600'>
                                                        {item.warehouse.code}
                                                    </span>
                                                    {item.bin && (
                                                        <span className='text-xs text-slate-500'>
                                                            Bin: {item.bin.code}{' '}
                                                            ({item.bin.row}-
                                                            {item.bin.column}-
                                                            {item.bin.level})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 text-right'>
                                                <span className='font-semibold text-slate-800'>
                                                    {formatNumber(
                                                        item.quantity
                                                    )}
                                                </span>
                                                <span className='text-sm text-slate-500 ml-1'>
                                                    {
                                                        item.itemMaster
                                                            .unitOfMeasure
                                                    }
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 text-right'>
                                                <span className='font-medium text-orange-600'>
                                                    {formatNumber(
                                                        item.reservedQty
                                                    )}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 text-right'>
                                                <span className='font-semibold text-green-600'>
                                                    {formatNumber(
                                                        item.availableQty
                                                    )}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center justify-center'>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                                                    >
                                                        <StatusIcon className='w-3 h-3' />
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                className='px-6 py-4 text-right'
                                                title={formatCurrency(
                                                    item.quantity *
                                                        (item.itemMaster
                                                            .unitCost || 0)
                                                )}
                                            >
                                                <span className='font-semibold text-slate-800'>
                                                    {formatCompactCurrency(
                                                        item.quantity *
                                                            (item.itemMaster
                                                                .unitCost || 0)
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {items.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={items.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
