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
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchMovements();
    }, [filters]);

    const fetchMovements = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate)
                params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`/api/inventory/movements?${params}`, {
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
        <div className='p-6'>
            {/* Header */}
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h1 className='text-3xl font-bold'>Stock Movements</h1>
                    <p className='text-gray-600 mt-1'>
                        Track all inventory movements
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    <div className='bg-white p-6 rounded-lg shadow'>
                        <div className='text-sm text-gray-600'>
                            Total Movements
                        </div>
                        <div className='text-3xl font-bold mt-2'>
                            {stats.totalMovements}
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow'>
                        <div className='text-sm text-gray-600'>Inbound</div>
                        <div className='text-3xl font-bold mt-2 text-green-600'>
                            {stats.inbound}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                            +{stats.totalQuantityIn} units
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow'>
                        <div className='text-sm text-gray-600'>Outbound</div>
                        <div className='text-3xl font-bold mt-2 text-red-600'>
                            {stats.outbound}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                            -{stats.totalQuantityOut} units
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow'>
                        <div className='text-sm text-gray-600'>Adjustments</div>
                        <div className='text-3xl font-bold mt-2 text-yellow-600'>
                            {stats.adjustments}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                            {stats.transfers} transfers
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className='bg-white p-4 rounded-lg shadow mb-6'>
                <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Movement Type
                        </label>
                        <select
                            value={filters.type}
                            onChange={(e) =>
                                setFilters({ ...filters, type: e.target.value })
                            }
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
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
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value=''>All Status</option>
                            <option value='PENDING'>Pending</option>
                            <option value='IN_PROGRESS'>In Progress</option>
                            <option value='COMPLETED'>Completed</option>
                            <option value='CANCELLED'>Cancelled</option>
                        </select>
                    </div>
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
                    <div className='flex items-end'>
                        <button
                            onClick={() =>
                                setFilters({
                                    type: '',
                                    status: '',
                                    startDate: '',
                                    endDate: '',
                                })
                            }
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Movements Table */}
            <div className='bg-white rounded-lg shadow overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Reference No
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Date & Time
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Item
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Type
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Status
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Quantity
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Warehouse
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Location
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Notes
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
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
        </div>
    );
}
