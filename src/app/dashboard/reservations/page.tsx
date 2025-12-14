'use client';

import { useState, useEffect } from 'react';
import {
    BoxIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    AlertIcon,
    RefreshIcon,
    FilterIcon,
    XIcon,
    SearchIcon,
    PlusIcon,
} from '@/components/icons';
import TableSkeleton from '@/components/TableSkeleton';

interface Reservation {
    id: string;
    reservationType: string;
    referenceNo: string;
    quantity: number;
    status: string;
    notes?: string;
    expiresAt?: string;
    releasedAt?: string;
    fulfilledAt?: string;
    createdAt: string;
    inventoryItem: {
        itemMaster: {
            sku: string;
            name: string;
            unitOfMeasure: string;
            category?: {
                name: string;
            };
        };
        warehouse: {
            name: string;
            code: string;
        };
        bin?: {
            code: string;
            row: number;
            column: number;
            level: number;
        };
    };
    createdBy: {
        fullName: string;
        email: string;
    };
    releasedBy?: {
        fullName: string;
        email: string;
    };
}

interface Summary {
    total: number;
    active: number;
    released: number;
    fulfilled: number;
    expired: number;
    totalReservedQty: number;
}

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [summary, setSummary] = useState<Summary>({
        total: 0,
        active: 0,
        released: 0,
        fulfilled: 0,
        expired: 0,
        totalReservedQty: 0,
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedReservations, setSelectedReservations] = useState<string[]>(
        []
    );
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReservations();
    }, [statusFilter, typeFilter]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('reservationType', typeFilter);

            const response = await fetch(
                `/api/reservations?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error ||
                        `Failed to fetch reservations: ${response.status}`
                );
            }

            const data = await response.json();
            setReservations(data.reservations || []);
            setSummary(
                data.summary || {
                    total: 0,
                    active: 0,
                    fulfilled: 0,
                    released: 0,
                    expired: 0,
                    totalReservedQty: 0,
                }
            );
        } catch (error) {
            console.error('[API] Error fetching reservations:', error);
            setReservations([]);
            setSummary({
                total: 0,
                active: 0,
                fulfilled: 0,
                released: 0,
                expired: 0,
                totalReservedQty: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseSelected = async () => {
        if (selectedReservations.length === 0) {
            alert('Please select reservations to release');
            return;
        }

        if (
            !confirm(
                `Release ${selectedReservations.length} selected reservation(s)?`
            )
        ) {
            return;
        }

        try {
            setProcessing(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'release',
                    reservationIds: selectedReservations,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || 'Failed to release reservations'
                );
            }

            const data = await response.json();
            alert(data.message || 'Reservations released successfully');
            setSelectedReservations([]);
            fetchReservations();
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Error releasing reservations';
            alert(errorMessage);
            console.error('[API] Error releasing reservations:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleExpireOld = async () => {
        if (!confirm('Expire all old reservations past their expiry date?')) {
            return;
        }

        try {
            setProcessing(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/reservations/expire', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || 'Failed to expire reservations'
                );
            }

            const data = await response.json();
            alert(
                `Expired ${data.expiredCount || 0} reservation(s) successfully`
            );
            fetchReservations();
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Error expiring reservations';
            alert(errorMessage);
            console.error('[API] Error expiring reservations:', error);
        } finally {
            setProcessing(false);
        }
    };

    const toggleSelectReservation = (id: string) => {
        setSelectedReservations((prev) =>
            prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedReservations.length === filteredReservations.length) {
            setSelectedReservations([]);
        } else {
            setSelectedReservations(filteredReservations.map((r) => r.id));
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setTypeFilter('');
        setSearchTerm('');
    };

    const filteredReservations = reservations.filter((r) => {
        const matchesSearch =
            searchTerm === '' ||
            r.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.inventoryItem.itemMaster.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            r.inventoryItem.itemMaster.sku
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800 border-green-300',
            RELEASED: 'bg-gray-100 text-gray-800 border-gray-300',
            FULFILLED: 'bg-blue-100 text-blue-800 border-blue-300',
            EXPIRED: 'bg-red-100 text-red-800 border-red-300',
        };

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    styles[status] || 'bg-gray-100 text-gray-800'
                }`}
            >
                {status}
            </span>
        );
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, React.ReactElement> = {
            ORDER: <BoxIcon className='w-4 h-4' />,
            TRANSFER: <RefreshIcon className='w-4 h-4' />,
            PRODUCTION: <AlertIcon className='w-4 h-4' />,
            MANUAL: <ClockIcon className='w-4 h-4' />,
        };

        return icons[type] || <BoxIcon className='w-4 h-4' />;
    };

    const isExpiringSoon = (expiresAt?: string) => {
        if (!expiresAt) return false;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const hoursUntilExpiry =
            (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
    };

    const isExpired = (expiresAt?: string) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    if (loading) {
        return <TableSkeleton rows={10} columns={7} />;
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white animate-fadeIn'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20'>
                            <BoxIcon className='w-10 h-10' />
                        </div>
                        <div>
                            <h1 className='text-4xl font-bold mb-2'>
                                Reserved Inventory
                            </h1>
                            <p className='text-primary-100 text-lg'>
                                Manage stock reservations for orders, transfers,
                                and production
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition-colors font-semibold shadow-lg'
                    >
                        <PlusIcon className='w-5 h-5' />
                        Create Reservation
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-1 md:grid-cols-6 gap-6 animate-slideUp'>
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-slate-600 mb-1'>
                                Total Reservations
                            </p>
                            <p className='text-3xl font-bold text-slate-900'>
                                {summary.total}
                            </p>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <BoxIcon className='w-7 h-7 text-white' />
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-slate-600 mb-1'>
                                Active
                            </p>
                            <p className='text-3xl font-bold text-green-600'>
                                {summary.active}
                            </p>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <CheckCircleIcon className='w-7 h-7 text-white' />
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-slate-600 mb-1'>
                                Fulfilled
                            </p>
                            <p className='text-3xl font-bold text-blue-600'>
                                {summary.fulfilled}
                            </p>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg'>
                            <CheckCircleIcon className='w-7 h-7 text-white' />
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-slate-600 mb-1'>
                                Released
                            </p>
                            <p className='text-3xl font-bold text-slate-600'>
                                {summary.released}
                            </p>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg'>
                            <XCircleIcon className='w-7 h-7 text-white' />
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-slate-600 mb-1'>
                                Expired
                            </p>
                            <p className='text-3xl font-bold text-red-600'>
                                {summary.expired}
                            </p>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <ClockIcon className='w-7 h-7 text-white' />
                        </div>
                    </div>
                </div>

                <div className='bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div>
                        <p className='text-sm font-medium text-primary-100 mb-1'>
                            Total Reserved Qty
                        </p>
                        <p className='text-3xl font-bold'>
                            {summary.totalReservedQty}
                        </p>
                        <p className='text-xs text-primary-200 mt-1'>
                            Units in active reservations
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 animate-slideUp'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center'>
                        <FilterIcon className='w-5 h-5 text-white' />
                    </div>
                    <h2 className='text-xl font-bold text-slate-900'>
                        Filters & Actions
                    </h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            <CheckCircleIcon className='w-4 h-4 inline mr-1' />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                        >
                            <option value=''>All Statuses</option>
                            <option value='ACTIVE'>Active</option>
                            <option value='FULFILLED'>Fulfilled</option>
                            <option value='RELEASED'>Released</option>
                            <option value='EXPIRED'>Expired</option>
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            <BoxIcon className='w-4 h-4 inline mr-1' />
                            Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                        >
                            <option value=''>All Types</option>
                            <option value='ORDER'>Order</option>
                            <option value='TRANSFER'>Transfer</option>
                            <option value='PRODUCTION'>Production</option>
                            <option value='MANUAL'>Manual</option>
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            <SearchIcon className='w-4 h-4 inline mr-1' />
                            Search
                        </label>
                        <input
                            type='text'
                            placeholder='Reference, Item, SKU...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                        />
                    </div>

                    <div className='flex items-end gap-2'>
                        <button
                            onClick={clearFilters}
                            className='flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium shadow-sm hover:shadow'
                        >
                            <XIcon className='w-4 h-4 inline mr-1' />
                            Clear
                        </button>
                        <button
                            onClick={fetchReservations}
                            className='flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-medium shadow-lg hover:shadow-xl'
                        >
                            <RefreshIcon className='w-4 h-4 inline mr-1' />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className='flex gap-4 pt-4 border-t border-slate-200'>
                    <button
                        onClick={handleReleaseSelected}
                        disabled={
                            selectedReservations.length === 0 || processing
                        }
                        className='px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl'
                    >
                        Release Selected ({selectedReservations.length})
                    </button>
                    <button
                        onClick={handleExpireOld}
                        disabled={processing}
                        className='px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-slate-300 disabled:to-slate-400 transition-all font-medium shadow-lg hover:shadow-xl'
                    >
                        <ClockIcon className='w-4 h-4 inline mr-1' />
                        Expire Old Reservations
                    </button>
                </div>
            </div>

            {/* Reservations List */}
            <div className='bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 animate-slideUp'>
                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200'>
                            <tr>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    <input
                                        type='checkbox'
                                        checked={
                                            selectedReservations.length ===
                                                filteredReservations.filter(
                                                    (r) => r.status === 'ACTIVE'
                                                ).length &&
                                            filteredReservations.filter(
                                                (r) => r.status === 'ACTIVE'
                                            ).length > 0
                                        }
                                        onChange={toggleSelectAll}
                                        className='rounded'
                                    />
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Reference
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Item
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Location
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Quantity
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Type
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Status
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Expires
                                </th>
                                <th className='px-6 py-4 text-left font-bold text-slate-700'>
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {filteredReservations.map((reservation) => (
                                <tr
                                    key={reservation.id}
                                    className='hover:bg-gray-50 transition-colors'
                                >
                                    <td className='px-6 py-4'>
                                        {reservation.status === 'ACTIVE' && (
                                            <input
                                                type='checkbox'
                                                checked={selectedReservations.includes(
                                                    reservation.id
                                                )}
                                                onChange={() =>
                                                    toggleSelectReservation(
                                                        reservation.id
                                                    )
                                                }
                                                className='rounded'
                                            />
                                        )}
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div>
                                            <p className='font-semibold text-gray-900'>
                                                {reservation.referenceNo}
                                            </p>
                                            <p className='text-xs text-gray-500'>
                                                by{' '}
                                                {reservation.createdBy.fullName}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div>
                                            <p className='font-medium text-gray-900'>
                                                {
                                                    reservation.inventoryItem
                                                        .itemMaster.name
                                                }
                                            </p>
                                            <p className='text-sm text-gray-600'>
                                                {
                                                    reservation.inventoryItem
                                                        .itemMaster.sku
                                                }
                                            </p>
                                            {reservation.inventoryItem
                                                .itemMaster.category && (
                                                <span className='text-xs text-gray-500'>
                                                    {
                                                        reservation
                                                            .inventoryItem
                                                            .itemMaster.category
                                                            .name
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div>
                                            <p className='text-sm font-medium text-gray-900'>
                                                {
                                                    reservation.inventoryItem
                                                        .warehouse.name
                                                }
                                            </p>
                                            <p className='text-xs text-gray-600'>
                                                {
                                                    reservation.inventoryItem
                                                        .warehouse.code
                                                }
                                                {reservation.inventoryItem
                                                    .bin &&
                                                    ` • ${reservation.inventoryItem.bin.code}`}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <span className='font-bold text-lg text-blue-600'>
                                            {reservation.quantity}
                                        </span>
                                        <span className='text-sm text-gray-600 ml-1'>
                                            {
                                                reservation.inventoryItem
                                                    .itemMaster.unitOfMeasure
                                            }
                                        </span>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='flex items-center gap-2'>
                                            {getTypeIcon(
                                                reservation.reservationType
                                            )}
                                            <span className='text-sm font-medium'>
                                                {reservation.reservationType}
                                            </span>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        {getStatusBadge(reservation.status)}
                                    </td>
                                    <td className='px-6 py-4'>
                                        {reservation.expiresAt ? (
                                            <div>
                                                <p
                                                    className={`text-sm ${
                                                        isExpired(
                                                            reservation.expiresAt
                                                        )
                                                            ? 'text-red-600 font-semibold'
                                                            : isExpiringSoon(
                                                                  reservation.expiresAt
                                                              )
                                                            ? 'text-orange-600 font-semibold'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    {new Date(
                                                        reservation.expiresAt
                                                    ).toLocaleString()}
                                                </p>
                                                {isExpiringSoon(
                                                    reservation.expiresAt
                                                ) &&
                                                    !isExpired(
                                                        reservation.expiresAt
                                                    ) && (
                                                        <p className='text-xs text-orange-600'>
                                                            ⚠️ Expiring soon
                                                        </p>
                                                    )}
                                                {isExpired(
                                                    reservation.expiresAt
                                                ) &&
                                                    reservation.status ===
                                                        'ACTIVE' && (
                                                        <p className='text-xs text-red-600'>
                                                            🔴 Expired!
                                                        </p>
                                                    )}
                                            </div>
                                        ) : (
                                            <span className='text-sm text-gray-400'>
                                                No expiry
                                            </span>
                                        )}
                                    </td>
                                    <td className='px-6 py-4'>
                                        <p className='text-sm text-gray-600'>
                                            {new Date(
                                                reservation.createdAt
                                            ).toLocaleString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredReservations.length === 0 && (
                        <div className='text-center py-12'>
                            <BoxIcon className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                            <p className='text-gray-500 text-lg'>
                                No reservations found
                            </p>
                            <p className='text-gray-400 text-sm'>
                                Try adjusting your filters
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Reservation Modal */}
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
                    <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center'>
                            <h2 className='text-xl font-bold text-white'>
                                Create New Reservation
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className='text-white hover:bg-white/20 rounded-lg p-2 transition'
                            >
                                <XIcon className='w-5 h-5' />
                            </button>
                        </div>
                        <div className='p-6'>
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                                <p className='text-blue-800 text-sm'>
                                    <strong>Note:</strong> Fitur Create
                                    Reservation masih dalam pengembangan. Untuk
                                    saat ini, reservasi dibuat otomatis dari
                                    sistem order/transfer.
                                </p>
                            </div>
                            <div className='flex justify-end gap-3'>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className='px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-semibold'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
