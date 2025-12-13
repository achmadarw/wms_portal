'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';

interface StockReport {
    id: string;
    sku: string;
    name: string;
    category: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    minStockLevel: number;
    maxStockLevel?: number;
    reorderPoint: number;
    stockValue: number;
    stockStatus: string;
    needsReorder: boolean;
}

interface MovementSummary {
    summary: {
        totalMovements: number;
        byType: {
            inbound: { count: number; quantity: number };
            outbound: { count: number; quantity: number };
            transfer: { count: number; quantity: number };
            adjustment: { count: number; quantity: number };
        };
        averageMovementsPerDay: number;
    };
    byDate: Array<{
        date: string;
        inbound: number;
        outbound: number;
        transfer: number;
        adjustment: number;
        total: number;
    }>;
    byCategory: Array<{
        category: string;
        count: number;
        inbound: number;
        outbound: number;
        uniqueItems: number;
    }>;
    topItems: Array<{
        sku: string;
        name: string;
        category: string;
        totalMovements: number;
        totalQuantity: number;
    }>;
}

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<'stock' | 'movements'>(
        'stock'
    );
    const [loading, setLoading] = useState(true);
    const [stockReport, setStockReport] = useState<StockReport[]>([]);
    const [movementSummary, setMovementSummary] =
        useState<MovementSummary | null>(null);
    const [stockSummary, setStockSummary] = useState<any>(null);

    const [filters, setFilters] = useState({
        stockStatus: '',
        category: '',
        startDate: '',
        endDate: '',
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        if (activeReport === 'stock') {
            fetchStockReport();
        } else {
            fetchMovementSummary();
        }
    }, [activeReport, filters]);

    const fetchStockReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams();
            if (filters.stockStatus)
                params.append('stockStatus', filters.stockStatus);
            if (filters.category) params.append('category', filters.category);

            const response = await fetch(
                `/api/inventory/reports/stock-levels?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch stock report');

            const data = await response.json();
            setStockReport(data.report || []);
            setStockSummary(data.summary || null);
        } catch (error) {
            console.error('Error fetching stock report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMovementSummary = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams();
            if (filters.startDate)
                params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(
                `/api/inventory/reports/movement-summary?${params}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok)
                throw new Error('Failed to fetch movement summary');

            const data = await response.json();
            setMovementSummary(data);
        } catch (error) {
            console.error('Error fetching movement summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
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

    // Pagination logic for stock report
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStockItems = stockReport.slice(
        indexOfFirstItem,
        indexOfLastItem
    );
    const totalPages = Math.ceil(stockReport.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset to page 1 when filters or report type changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeReport]);

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white'>
                <div className='flex items-center gap-4'>
                    <div className='w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20'>
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
                                d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className='text-4xl font-bold mb-2'>
                            Inventory Reports & Analytics
                        </h1>
                        <p className='text-primary-100 text-lg'>
                            Analyze stock levels and movement patterns
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200'>
                <div className='border-b-2 border-slate-200'>
                    <div className='flex'>
                        <button
                            onClick={() => setActiveReport('stock')}
                            className={`px-8 py-4 font-bold text-lg transition-all ${
                                activeReport === 'stock'
                                    ? 'border-b-4 border-primary-600 text-primary-600 bg-primary-50'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            📊 Stock Levels Report
                        </button>
                        <button
                            onClick={() => setActiveReport('movements')}
                            className={`px-8 py-4 font-bold text-lg transition-all ${
                                activeReport === 'movements'
                                    ? 'border-b-4 border-primary-600 text-primary-600 bg-primary-50'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            📈 Movement Summary
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className='p-6 bg-slate-50'>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        {activeReport === 'stock' ? (
                            <>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Stock Status
                                    </label>
                                    <select
                                        value={filters.stockStatus}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                stockStatus: e.target.value,
                                            })
                                        }
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>All Status</option>
                                        <option value='LOW'>Low Stock</option>
                                        <option value='OUT'>
                                            Out of Stock
                                        </option>
                                        <option value='OVER'>Overstock</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Category
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                category: e.target.value,
                                            })
                                        }
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value=''>All Categories</option>
                                        <option value='Electronics'>
                                            Electronics
                                        </option>
                                        <option value='Food'>Food</option>
                                        <option value='Clothing'>
                                            Clothing
                                        </option>
                                        <option value='Tools'>Tools</option>
                                        <option value='Other'>Other</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Start Date
                                    </label>
                                    <input
                                        type='date'
                                        value={filters.startDate}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                startDate: e.target.value,
                                            })
                                        }
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        End Date
                                    </label>
                                    <input
                                        type='date'
                                        value={filters.endDate}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                endDate: e.target.value,
                                            })
                                        }
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </>
                        )}
                        <div className='flex items-end'>
                            <button
                                onClick={() =>
                                    setFilters({
                                        stockStatus: '',
                                        category: '',
                                        startDate: '',
                                        endDate: '',
                                    })
                                }
                                className='w-full px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-semibold shadow-sm hover:shadow'
                            >
                                🔄 Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className='bg-white rounded-2xl shadow-lg p-12 border border-slate-200'>
                    <div className='flex flex-col items-center gap-4'>
                        <div className='w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin'></div>
                        <p className='text-slate-600 font-medium text-lg'>
                            Loading report...
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {activeReport === 'stock' && stockSummary && (
                        <>
                            {/* Stock Summary Cards */}
                            <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-6'>
                                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                                    <div className='text-sm font-semibold text-slate-600'>
                                        Total Items
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-slate-900'>
                                        {stockSummary.totalItems}
                                    </div>
                                </div>
                                <div className='bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-2xl shadow-lg text-white hover:shadow-xl transition-shadow'>
                                    <div className='text-sm font-semibold text-primary-100'>
                                        Total Value
                                    </div>
                                    <div className='text-2xl font-bold mt-2'>
                                        Rp
                                        {stockSummary.totalStockValue.toFixed(
                                            2
                                        )}
                                    </div>
                                </div>
                                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                                    <div className='text-sm font-semibold text-slate-600'>
                                        In Stock
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-green-600'>
                                        {stockSummary.itemsInStock}
                                    </div>
                                </div>
                                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                                    <div className='text-sm font-semibold text-slate-600'>
                                        Low Stock
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-orange-600'>
                                        {stockSummary.itemsLowStock}
                                    </div>
                                </div>
                                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                                    <div className='text-sm font-semibold text-slate-600'>
                                        Out of Stock
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-red-600'>
                                        {stockSummary.itemsOutOfStock}
                                    </div>
                                </div>
                            </div>

                            {/* Stock Table */}
                            <div className='bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200'>
                                <table className='w-full'>
                                    <thead className='bg-gray-50'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Item
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Category
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Total Stock
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Available
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Reserved
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Min/Max
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Value
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-200'>
                                        {currentStockItems.map((item) => (
                                            <tr
                                                key={item.id}
                                                className='hover:bg-gray-50'
                                            >
                                                <td className='px-6 py-4'>
                                                    <div className='font-medium'>
                                                        {item.name}
                                                    </div>
                                                    <div className='text-sm text-gray-500'>
                                                        SKU: {item.sku}
                                                    </div>
                                                </td>
                                                <td className='px-6 py-4 text-sm'>
                                                    {item.category}
                                                </td>
                                                <td className='px-6 py-4 font-semibold'>
                                                    {item.totalStock}
                                                </td>
                                                <td className='px-6 py-4 text-green-600'>
                                                    {item.availableStock}
                                                </td>
                                                <td className='px-6 py-4 text-orange-600'>
                                                    {item.reservedStock}
                                                </td>
                                                <td className='px-6 py-4 text-sm'>
                                                    {item.minStockLevel} /{' '}
                                                    {item.maxStockLevel || '-'}
                                                </td>
                                                <td className='px-6 py-4 font-medium'>
                                                    Rp
                                                    {item.stockValue.toFixed(2)}
                                                </td>
                                                <td className='px-6 py-4'>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                                            item.stockStatus
                                                        )}`}
                                                    >
                                                        {item.stockStatus.replace(
                                                            '_',
                                                            ' '
                                                        )}
                                                    </span>
                                                    {item.needsReorder && (
                                                        <div className='text-xs text-red-600 mt-1'>
                                                            ⚠️ Reorder
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination for Stock Report */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={stockReport.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    showItemsPerPage={false}
                                />
                            </div>
                        </>
                    )}

                    {activeReport === 'movements' && movementSummary && (
                        <>
                            {/* Movement Summary Cards */}
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                                <div className='bg-white p-6 rounded-lg shadow'>
                                    <div className='text-sm text-gray-600'>
                                        Total Movements
                                    </div>
                                    <div className='text-3xl font-bold mt-2'>
                                        {movementSummary.summary.totalMovements}
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        Avg:{' '}
                                        {movementSummary.summary.averageMovementsPerDay.toFixed(
                                            1
                                        )}
                                        /day
                                    </div>
                                </div>
                                <div className='bg-white p-6 rounded-lg shadow'>
                                    <div className='text-sm text-gray-600'>
                                        Inbound
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-green-600'>
                                        {
                                            movementSummary.summary.byType
                                                .inbound.count
                                        }
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        +
                                        {
                                            movementSummary.summary.byType
                                                .inbound.quantity
                                        }{' '}
                                        units
                                    </div>
                                </div>
                                <div className='bg-white p-6 rounded-lg shadow'>
                                    <div className='text-sm text-gray-600'>
                                        Outbound
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-red-600'>
                                        {
                                            movementSummary.summary.byType
                                                .outbound.count
                                        }
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        -
                                        {
                                            movementSummary.summary.byType
                                                .outbound.quantity
                                        }{' '}
                                        units
                                    </div>
                                </div>
                                <div className='bg-white p-6 rounded-lg shadow'>
                                    <div className='text-sm text-gray-600'>
                                        Transfers
                                    </div>
                                    <div className='text-3xl font-bold mt-2 text-blue-600'>
                                        {
                                            movementSummary.summary.byType
                                                .transfer.count
                                        }
                                    </div>
                                    <div className='text-xs text-gray-500 mt-1'>
                                        {
                                            movementSummary.summary.byType
                                                .adjustment.count
                                        }{' '}
                                        adjustments
                                    </div>
                                </div>
                            </div>

                            {/* Movement by Category */}
                            <div className='bg-white rounded-lg shadow p-6 mb-6'>
                                <h3 className='text-xl font-semibold mb-4'>
                                    Movements by Category
                                </h3>
                                <div className='overflow-x-auto'>
                                    <table className='w-full'>
                                        <thead className='bg-gray-50'>
                                            <tr>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Category
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Total Movements
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Inbound
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Outbound
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Unique Items
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-gray-200'>
                                            {movementSummary.byCategory.map(
                                                (cat) => (
                                                    <tr key={cat.category}>
                                                        <td className='px-4 py-3 font-medium'>
                                                            {cat.category}
                                                        </td>
                                                        <td className='px-4 py-3'>
                                                            {cat.count}
                                                        </td>
                                                        <td className='px-4 py-3 text-green-600'>
                                                            {cat.inbound}
                                                        </td>
                                                        <td className='px-4 py-3 text-red-600'>
                                                            {cat.outbound}
                                                        </td>
                                                        <td className='px-4 py-3'>
                                                            {cat.uniqueItems}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Moving Items */}
                            <div className='bg-white rounded-lg shadow p-6'>
                                <h3 className='text-xl font-semibold mb-4'>
                                    Top 10 Moving Items
                                </h3>
                                <div className='overflow-x-auto'>
                                    <table className='w-full'>
                                        <thead className='bg-gray-50'>
                                            <tr>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Rank
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Item
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Category
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Total Movements
                                                </th>
                                                <th className='px-4 py-2 text-left text-sm font-medium text-gray-500'>
                                                    Total Quantity
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className='divide-y divide-gray-200'>
                                            {movementSummary.topItems.map(
                                                (item, index) => (
                                                    <tr key={item.sku}>
                                                        <td className='px-4 py-3 font-bold text-gray-500'>
                                                            #{index + 1}
                                                        </td>
                                                        <td className='px-4 py-3'>
                                                            <div className='font-medium'>
                                                                {item.name}
                                                            </div>
                                                            <div className='text-sm text-gray-500'>
                                                                SKU: {item.sku}
                                                            </div>
                                                        </td>
                                                        <td className='px-4 py-3'>
                                                            {item.category}
                                                        </td>
                                                        <td className='px-4 py-3 font-semibold'>
                                                            {
                                                                item.totalMovements
                                                            }
                                                        </td>
                                                        <td className='px-4 py-3'>
                                                            {item.totalQuantity}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
