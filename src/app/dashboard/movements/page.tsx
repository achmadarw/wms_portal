'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Movement {
    id: string;
    referenceNo: string;
    type: string;
    quantity: number;
    notes?: string;
    status: string;
    fromBin?: string;
    toBin?: string;
    createdAt: string;
    updatedAt: string;
    item: {
        id: string;
        itemMaster: {
            sku: string;
            name: string;
            barcode?: string;
            unitOfMeasure: string;
        };
    };
    warehouse: {
        id: string;
        name: string;
        code: string;
    };
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
}

interface Stats {
    totalMovements: number;
    inbound: number;
    outbound: number;
    adjustments: number;
    transfers: number;
    totalQuantityIn: number;
    totalQuantityOut: number;
}

export default function MovementsPage() {
    const router = useRouter();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        warehouseId: '',
        dateFrom: '',
        dateTo: '',
        search: '',
    });

    // Create Movement Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        itemId: '',
        type: 'INBOUND',
        quantity: '',
        warehouseId: '',
        fromBin: '',
        toBin: '',
        notes: '',
    });
    const [items, setItems] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [bins, setBins] = useState<any[]>([]);

    useEffect(() => {
        fetchMovements();
    }, [filters]);

    useEffect(() => {
        if (showCreateModal) {
            fetchFormData();
        }
    }, [showCreateModal]);

    const fetchMovements = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);
            if (filters.warehouseId)
                params.append('warehouseId', filters.warehouseId);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(`/api/movements?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch movements');

            const data = await response.json();
            setMovements(data.movements || []);
            setStats(data.stats || null);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch items
            const itemsRes = await fetch('/api/items', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setItems(itemsData.items || []);
            }

            // Fetch warehouses
            const warehousesRes = await fetch('/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (warehousesRes.ok) {
                const warehousesData = await warehousesRes.json();
                setWarehouses(warehousesData.warehouses || []);
            }

            // Fetch bins if warehouse selected
            if (createForm.warehouseId) {
                const binsRes = await fetch(
                    `/api/bins?warehouseId=${createForm.warehouseId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (binsRes.ok) {
                    const binsData = await binsRes.json();
                    setBins(binsData.bins || []);
                }
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    const handleCreateMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    itemId: parseInt(createForm.itemId),
                    type: createForm.type,
                    quantity: parseInt(createForm.quantity),
                    warehouseId: parseInt(createForm.warehouseId),
                    fromBin: createForm.fromBin || undefined,
                    toBin: createForm.toBin || undefined,
                    notes: createForm.notes || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create movement');
            }

            const result = await response.json();
            alert(
                `Movement created successfully!\nReference: ${result.movement.referenceNo}`
            );

            // Reset form and close modal
            setCreateForm({
                itemId: '',
                type: 'INBOUND',
                quantity: '',
                warehouseId: '',
                fromBin: '',
                toBin: '',
                notes: '',
            });
            setShowCreateModal(false);

            // Refresh movements list
            fetchMovements();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setCreating(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'INBOUND':
                return 'bg-green-100 text-green-800';
            case 'OUTBOUND':
                return 'bg-red-100 text-red-800';
            case 'TRANSFER':
                return 'bg-blue-100 text-blue-800';
            case 'ADJUSTMENT':
                return 'bg-yellow-100 text-yellow-800';
            case 'RETURN':
                return 'bg-purple-100 text-purple-800';
            case 'DAMAGE':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className='p-6'>
                <div className='animate-pulse'>
                    <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
                    <div className='grid grid-cols-4 gap-4 mb-6'>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className='h-24 bg-gray-200 rounded'
                            ></div>
                        ))}
                    </div>
                    <div className='h-96 bg-gray-200 rounded'></div>
                </div>
            </div>
        );
    }

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
                                    d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                />
                            </svg>
                            <h1 className='text-3xl font-bold'>
                                Stock Movements
                            </h1>
                        </div>
                        <p className='text-primary-100 ml-11'>
                            Track all inventory movements and transactions
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className='flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl hover:bg-primary-50 transition font-semibold shadow-lg'
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
                        Create Movement
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <div className='text-sm font-semibold text-slate-600'>
                                    Total Movements
                                </div>
                                <div className='text-3xl font-bold text-slate-900 mt-2'>
                                    {stats.totalMovements}
                                </div>
                            </div>
                            <div className='w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg'>
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
                                        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <div className='text-sm font-semibold text-slate-600'>
                                    Inbound
                                </div>
                                <div className='text-3xl font-bold text-green-600 mt-2'>
                                    {stats.inbound}
                                </div>
                                <div className='text-xs text-slate-500 mt-1 font-medium'>
                                    +{stats.totalQuantityIn.toLocaleString()}{' '}
                                    units
                                </div>
                            </div>
                            <div className='w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg'>
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
                                        d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <div className='text-sm font-semibold text-slate-600'>
                                    Outbound
                                </div>
                                <div className='text-3xl font-bold text-red-600 mt-2'>
                                    {stats.outbound}
                                </div>
                                <div className='text-xs text-slate-500 mt-1 font-medium'>
                                    -{stats.totalQuantityOut.toLocaleString()}{' '}
                                    units
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
                                        d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <div className='text-sm font-semibold text-slate-600'>
                                    Transfers
                                </div>
                                <div className='text-3xl font-bold text-blue-600 mt-2'>
                                    {stats.transfers}
                                </div>
                                <div className='text-xs text-slate-500 mt-1 font-medium'>
                                    {stats.adjustments} adjustments
                                </div>
                            </div>
                            <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg'>
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
                                        d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
                <div className='flex items-center gap-3 mb-4'>
                    <svg
                        className='w-5 h-5 text-primary-600'
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
                    <span className='font-semibold text-slate-900'>
                        Filters:
                    </span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Movement Type
                        </label>
                        <select
                            value={filters.type}
                            onChange={(e) =>
                                setFilters({ ...filters, type: e.target.value })
                            }
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                        >
                            <option value=''>All Types</option>
                            <option value='INBOUND'>Inbound</option>
                            <option value='OUTBOUND'>Outbound</option>
                            <option value='TRANSFER'>Transfer</option>
                            <option value='ADJUSTMENT'>Adjustment</option>
                            <option value='RETURN'>Return</option>
                            <option value='DAMAGE'>Damage</option>
                        </select>
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    status: e.target.value,
                                })
                            }
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                        >
                            <option value=''>All Status</option>
                            <option value='PENDING'>Pending</option>
                            <option value='IN_PROGRESS'>In Progress</option>
                            <option value='COMPLETED'>Completed</option>
                            <option value='CANCELLED'>Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            From Date
                        </label>
                        <input
                            type='date'
                            value={filters.dateFrom}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    dateFrom: e.target.value,
                                })
                            }
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            To Date
                        </label>
                        <input
                            type='date'
                            value={filters.dateTo}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    dateTo: e.target.value,
                                })
                            }
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Search
                        </label>
                        <input
                            type='text'
                            value={filters.search}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    search: e.target.value,
                                })
                            }
                            placeholder='Reference, SKU, Item...'
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                        />
                    </div>
                    <div className='flex items-end'>
                        <button
                            onClick={() =>
                                setFilters({
                                    type: '',
                                    status: '',
                                    warehouseId: '',
                                    dateFrom: '',
                                    dateTo: '',
                                    search: '',
                                })
                            }
                            className='w-full px-4 py-2.5 bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold'
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Movements Table */}
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-slate-200'>
                        <thead className='bg-gradient-to-r from-slate-50 to-slate-100'>
                            <tr>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Reference No
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Date & Time
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Item
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Type
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Status
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Quantity
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Warehouse
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Location
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Notes
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    By
                                </th>
                            </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                            {movements.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className='px-6 py-12 text-center text-gray-500'
                                    >
                                        No movements found
                                    </td>
                                </tr>
                            ) : (
                                movements.map((movement) => (
                                    <tr
                                        key={movement.id}
                                        className='hover:bg-gray-50'
                                    >
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600'>
                                            {movement.referenceNo}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                            {formatDate(movement.createdAt)}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='text-sm font-medium text-gray-900'>
                                                {movement.item.itemMaster.name}
                                            </div>
                                            <div className='text-sm text-gray-500'>
                                                SKU:{' '}
                                                {movement.item.itemMaster.sku}
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                                                    movement.type
                                                )}`}
                                            >
                                                {movement.type}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                                    movement.status
                                                )}`}
                                            >
                                                {movement.status}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span
                                                className={`font-semibold ${
                                                    movement.quantity > 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {movement.quantity > 0
                                                    ? '+'
                                                    : ''}
                                                {movement.quantity}{' '}
                                                {
                                                    movement.item.itemMaster
                                                        .unitOfMeasure
                                                }
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                            {movement.warehouse.name}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                            {movement.fromBin && (
                                                <span>
                                                    From: {movement.fromBin}
                                                </span>
                                            )}
                                            {movement.fromBin &&
                                                movement.toBin && <br />}
                                            {movement.toBin && (
                                                <span>
                                                    To: {movement.toBin}
                                                </span>
                                            )}
                                            {!movement.fromBin &&
                                                !movement.toBin && (
                                                    <span className='text-gray-400'>
                                                        -
                                                    </span>
                                                )}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-500'>
                                            {movement.notes || '-'}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                            {movement.createdBy.fullName}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Movement Modal */}
            {showCreateModal && (
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
                    <div className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-slideUp'>
                        {/* Modal Header - Fixed */}
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
                                            d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                        />
                                    </svg>
                                    Create Stock Movement
                                </h2>
                                <p className='text-primary-100 text-sm mt-1'>
                                    Record new inventory transaction
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
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
                                onSubmit={handleCreateMovement}
                                className='p-8 space-y-6'
                            >
                                {/* Movement Type */}
                                <div className='bg-slate-50 p-5 rounded-xl border border-slate-200'>
                                    <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                        <svg
                                            className='w-4 h-4 text-primary-600'
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
                                        Movement Type *
                                    </label>
                                    <select
                                        value={createForm.type}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                type: e.target.value,
                                            })
                                        }
                                        required
                                        className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                                    >
                                        <option value='INBOUND'>
                                            📥 Inbound - Receiving goods
                                        </option>
                                        <option value='OUTBOUND'>
                                            📤 Outbound - Shipping goods
                                        </option>
                                        <option value='TRANSFER'>
                                            🔄 Transfer - Move between bins
                                        </option>
                                        <option value='ADJUSTMENT'>
                                            ⚖️ Adjustment - Correct quantity
                                        </option>
                                        <option value='RETURN'>
                                            ↩️ Return - Customer return
                                        </option>
                                        <option value='DAMAGE'>
                                            ⚠️ Damage - Damaged goods
                                        </option>
                                    </select>
                                    <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                        <p className='text-xs text-blue-800 font-medium'>
                                            {createForm.type === 'INBOUND' &&
                                                '💡 Increases inventory when receiving goods'}
                                            {createForm.type === 'OUTBOUND' &&
                                                '💡 Decreases inventory when shipping goods'}
                                            {createForm.type === 'TRANSFER' &&
                                                '💡 Moves items between bin locations'}
                                            {createForm.type === 'ADJUSTMENT' &&
                                                '💡 Sets absolute quantity (corrections)'}
                                            {createForm.type === 'RETURN' &&
                                                '💡 Increases inventory from returns'}
                                            {createForm.type === 'DAMAGE' &&
                                                '💡 Decreases inventory for damaged items'}
                                        </p>
                                    </div>
                                </div>

                                {/* Item Selection */}
                                <div>
                                    <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                        <svg
                                            className='w-4 h-4 text-primary-600'
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
                                        Item *
                                    </label>
                                    <select
                                        value={createForm.itemId}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                itemId: e.target.value,
                                            })
                                        }
                                        required
                                        className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                                    >
                                        <option value=''>
                                            Select an item...
                                        </option>
                                        {items.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.itemMaster.sku} -{' '}
                                                {item.itemMaster.name} (Stock:{' '}
                                                {item.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                        <svg
                                            className='w-4 h-4 text-primary-600'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                            />
                                        </svg>
                                        Warehouse *
                                    </label>
                                    <select
                                        value={createForm.warehouseId}
                                        onChange={(e) => {
                                            setCreateForm({
                                                ...createForm,
                                                warehouseId: e.target.value,
                                            });
                                            fetchFormData(); // Refresh bins for new warehouse
                                        }}
                                        required
                                        className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                                    >
                                        <option value=''>
                                            Select warehouse...
                                        </option>
                                        {warehouses.map((wh) => (
                                            <option key={wh.id} value={wh.id}>
                                                {wh.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                        <svg
                                            className='w-4 h-4 text-primary-600'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
                                            />
                                        </svg>
                                        Quantity *
                                    </label>
                                    <input
                                        type='number'
                                        value={createForm.quantity}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                quantity: e.target.value,
                                            })
                                        }
                                        required
                                        min='1'
                                        className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                                        placeholder='Enter quantity'
                                    />
                                    {createForm.type === 'ADJUSTMENT' && (
                                        <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                            <p className='text-xs text-yellow-800 font-medium'>
                                                ⚠️ For adjustment, this will be
                                                the NEW absolute quantity
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* From Bin (for OUTBOUND, TRANSFER, DAMAGE) */}
                                {['OUTBOUND', 'TRANSFER', 'DAMAGE'].includes(
                                    createForm.type
                                ) && (
                                    <div>
                                        <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                            <svg
                                                className='w-4 h-4 text-primary-600'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                                />
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                                />
                                            </svg>
                                            From Bin{' '}
                                            {createForm.type === 'TRANSFER'
                                                ? '*'
                                                : '(Optional)'}
                                        </label>
                                        <select
                                            value={createForm.fromBin}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    fromBin: e.target.value,
                                                })
                                            }
                                            required={
                                                createForm.type === 'TRANSFER'
                                            }
                                            className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                                        >
                                            <option value=''>
                                                Select source bin...
                                            </option>
                                            {bins.map((bin) => (
                                                <option
                                                    key={bin.id}
                                                    value={bin.location}
                                                >
                                                    {bin.location} (Available:{' '}
                                                    {bin.currentQty}/
                                                    {bin.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* To Bin (for INBOUND, TRANSFER, RETURN) */}
                                {['INBOUND', 'TRANSFER', 'RETURN'].includes(
                                    createForm.type
                                ) && (
                                    <div>
                                        <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                            <svg
                                                className='w-4 h-4 text-primary-600'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                                />
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                                />
                                            </svg>
                                            To Bin{' '}
                                            {createForm.type === 'TRANSFER'
                                                ? '*'
                                                : '(Optional)'}
                                        </label>
                                        <select
                                            value={createForm.toBin}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    toBin: e.target.value,
                                                })
                                            }
                                            required={
                                                createForm.type === 'TRANSFER'
                                            }
                                            className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                                        >
                                            <option value=''>
                                                Select destination bin...
                                            </option>
                                            {bins.map((bin) => (
                                                <option
                                                    key={bin.id}
                                                    value={bin.location}
                                                >
                                                    {bin.location} (Available:{' '}
                                                    {bin.currentQty}/
                                                    {bin.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                        <svg
                                            className='w-4 h-4 text-primary-600'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                            />
                                        </svg>
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={createForm.notes}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 resize-none'
                                        placeholder='Add any additional notes or reference information...'
                                    />
                                </div>

                                {/* Form Actions */}
                                <div className='flex gap-4 pt-6 border-t border-slate-200'>
                                    <button
                                        type='submit'
                                        disabled={creating}
                                        className='flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3.5 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transition-all'
                                    >
                                        {creating ? (
                                            <>
                                                <svg
                                                    className='animate-spin h-5 w-5'
                                                    fill='none'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <circle
                                                        className='opacity-25'
                                                        cx='12'
                                                        cy='12'
                                                        r='10'
                                                        stroke='currentColor'
                                                        strokeWidth='4'
                                                    ></circle>
                                                    <path
                                                        className='opacity-75'
                                                        fill='currentColor'
                                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                    ></path>
                                                </svg>
                                                Creating Movement...
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
                                                Create Movement
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowCreateModal(false)
                                        }
                                        disabled={creating}
                                        className='px-8 py-3.5 bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
