'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    category: string;
    unitCost: number;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    isLowStock: boolean;
    stockStatus: string;
    reorderPoint: number;
}

export default function InventoryDashboard() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [category, setCategory] = useState<string>('');

    useEffect(() => {
        fetchItems();
    }, [filter, category]);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (filter === 'low') params.append('lowStock', 'true');
            if (category) params.append('category', category);

            const response = await fetch(`/api/inventory/items?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch items');

            const data = await response.json();
            setItems(data.items || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'OUT_OF_STOCK':
                return 'bg-red-100 text-red-800';
            case 'LOW_STOCK':
                return 'bg-yellow-100 text-yellow-800';
            case 'IN_STOCK':
                return 'bg-green-100 text-green-800';
            case 'OVERSTOCK':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.sku.toLowerCase().includes(search.toLowerCase()) ||
            (item.barcode &&
                item.barcode.toLowerCase().includes(search.toLowerCase()));

        return matchesSearch;
    });

    const stats = {
        total: items.length,
        lowStock: items.filter((i) => i.isLowStock).length,
        outOfStock: items.filter((i) => i.totalStock === 0).length,
        totalValue: items.reduce(
            (sum, i) => sum + i.totalStock * i.unitCost,
            0
        ),
    };

    return (
        <div className='p-6'>
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h1 className='text-3xl font-bold'>Inventory Management</h1>
                    <p className='text-gray-600 mt-1'>
                        Manage your stock and items
                    </p>
                </div>
                <button
                    onClick={() => router.push('/inventory/items/new')}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2'
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

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Total Items</div>
                    <div className='text-3xl font-bold mt-2'>{stats.total}</div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Low Stock</div>
                    <div className='text-3xl font-bold mt-2 text-yellow-600'>
                        {stats.lowStock}
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Out of Stock</div>
                    <div className='text-3xl font-bold mt-2 text-red-600'>
                        {stats.outOfStock}
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Total Value</div>
                    <div className='text-3xl font-bold mt-2'>
                        ${stats.totalValue.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-4 rounded-lg shadow mb-4'>
                <div className='flex flex-wrap gap-4'>
                    {/* Search */}
                    <div className='flex-1 min-w-[300px]'>
                        <input
                            type='text'
                            placeholder='Search by SKU, name, or barcode...'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className='flex gap-2'>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg ${
                                filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('low')}
                            className={`px-4 py-2 rounded-lg ${
                                filter === 'low'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Low Stock
                        </button>
                        <button
                            onClick={() => setFilter('out')}
                            className={`px-4 py-2 rounded-lg ${
                                filter === 'out'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Out of Stock
                        </button>
                    </div>

                    {/* Category Filter */}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        <option value=''>All Categories</option>
                        <option value='Electronics'>Electronics</option>
                        <option value='Food'>Food</option>
                        <option value='Clothing'>Clothing</option>
                        <option value='Tools'>Tools</option>
                    </select>
                </div>
            </div>

            {/* Items Table */}
            <div className='bg-white rounded-lg shadow overflow-hidden'>
                <table className='w-full'>
                    <thead className='bg-gray-50 border-b'>
                        <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                SKU
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                Item Name
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                Category
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                Stock
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                Status
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                Unit Cost
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className='px-6 py-12 text-center text-gray-500'
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className='px-6 py-12 text-center text-gray-500'
                                >
                                    No items found
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className='hover:bg-gray-50'>
                                    <td className='px-6 py-4 text-sm font-medium'>
                                        {item.sku}
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='text-sm font-medium text-gray-900'>
                                            {item.name}
                                        </div>
                                        {item.barcode && (
                                            <div className='text-xs text-gray-500'>
                                                Barcode: {item.barcode}
                                            </div>
                                        )}
                                    </td>
                                    <td className='px-6 py-4 text-sm'>
                                        {item.category}
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='text-sm font-semibold'>
                                            {item.totalStock}
                                        </div>
                                        <div className='text-xs text-gray-500'>
                                            Available: {item.availableStock} |
                                            Reserved: {item.reservedStock}
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${getStockStatusColor(
                                                item.stockStatus
                                            )}`}
                                        >
                                            {item.stockStatus.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4 text-sm'>
                                        ${item.unitCost.toFixed(2)}
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/inventory/items/${item.id}`
                                                    )
                                                }
                                                className='text-blue-600 hover:text-blue-800 text-sm'
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/inventory/items/${item.id}/adjust`
                                                    )
                                                }
                                                className='text-green-600 hover:text-green-800 text-sm'
                                            >
                                                Adjust
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
