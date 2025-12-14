'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import {
    AlertIcon,
    BellIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrendingDownIcon,
    TrendingUpIcon,
    BoxIcon,
    RefreshIcon,
} from '@/components/icons';

interface StockAlert {
    id: string;
    alertType: string;
    severity: string;
    message: string;
    currentQty: number;
    threshold: number;
    acknowledged: boolean;
    acknowledgedBy: string | null;
    acknowledgedAt: string | null;
    resolved: boolean;
    resolvedAt: string | null;
    emailSent: boolean;
    emailSentAt: string | null;
    createdAt: string;
    itemMaster: {
        id: string;
        sku: string;
        name: string;
        unitOfMeasure: string;
        minStockLevel: number;
        maxStockLevel: number | null;
        reorderPoint: number;
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
}

interface Summary {
    total: number;
    unresolved: number;
    unacknowledged: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    outOfStock: number;
    lowStock: number;
    reorderPoint: number;
    overstock: number;
}

export default function AlertsPage() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [summary, setSummary] = useState<Summary>({
        total: 0,
        unresolved: 0,
        unacknowledged: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        outOfStock: 0,
        lowStock: 0,
        reorderPoint: 0,
        overstock: 0,
    });
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [filters, setFilters] = useState({
        severity: '',
        alertType: '',
        acknowledged: 'false',
        resolved: 'false',
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }
            fetchAlerts();
        };

        checkAuth();
    }, [router]);

    useEffect(() => {
        fetchAlerts();
    }, [filters]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            const params = new URLSearchParams();
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.alertType)
                params.append('alertType', filters.alertType);
            if (filters.acknowledged)
                params.append('acknowledged', filters.acknowledged);
            if (filters.resolved) params.append('resolved', filters.resolved);

            const response = await fetch(`/api/alerts?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setAlerts(data.alerts || []);
                setSummary(data.summary || summary);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStockLevels = async () => {
        try {
            setChecking(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/alerts/check', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                alert(
                    `Stock check completed!\nAlerts generated: ${data.alertsGenerated}\nEmails sent: ${data.emailsSent}`
                );
                fetchAlerts(); // Refresh alerts
            } else {
                alert('Failed to check stock levels');
            }
        } catch (error) {
            console.error('Error checking stock levels:', error);
            alert('Error checking stock levels');
        } finally {
            setChecking(false);
        }
    };

    const handleAlertAction = async (
        alertId: string,
        action: 'acknowledge' | 'resolve'
    ) => {
        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ alertId, action }),
            });

            if (response.ok) {
                fetchAlerts(); // Refresh alerts
            } else {
                alert('Failed to update alert');
            }
        } catch (error) {
            console.error('Error updating alert:', error);
            alert('Error updating alert');
        }
    };

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'HIGH':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'LOW':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getAlertTypeIcon = (alertType: string) => {
        switch (alertType) {
            case 'OUT_OF_STOCK':
                return <XCircleIcon className='w-5 h-5' />;
            case 'LOW_STOCK':
                return <TrendingDownIcon className='w-5 h-5' />;
            case 'REORDER_POINT':
                return <BellIcon className='w-5 h-5' />;
            case 'OVERSTOCK':
                return <TrendingUpIcon className='w-5 h-5' />;
            default:
                return <AlertIcon className='w-5 h-5' />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    // Pagination logic
    const indexOfLastAlert = currentPage * itemsPerPage;
    const indexOfFirstAlert = indexOfLastAlert - itemsPerPage;
    const currentAlerts = alerts.slice(indexOfFirstAlert, indexOfLastAlert);
    const totalPages = Math.ceil(alerts.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-xl p-8 text-white'>
                <div className='flex items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <BellIcon className='w-8 h-8' />
                            <h1 className='text-3xl font-bold'>Stock Alerts</h1>
                        </div>
                        <p className='text-red-100'>
                            Monitor and manage inventory alerts
                        </p>
                    </div>
                    <button
                        onClick={handleCheckStockLevels}
                        disabled={checking}
                        className='flex items-center gap-2 px-6 py-3 bg-white text-red-700 rounded-xl hover:bg-red-50 transition-colors font-semibold disabled:opacity-50'
                    >
                        <RefreshIcon
                            className={`w-5 h-5 ${
                                checking ? 'animate-spin' : ''
                            }`}
                        />
                        {checking ? 'Checking...' : 'Check Stock Levels'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideUp'>
                {/* Total Alerts */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl'>
                            <AlertIcon className='w-6 h-6 text-slate-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Total Alerts
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {summary.total}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unresolved */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl'>
                            <XCircleIcon className='w-6 h-6 text-red-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Unresolved
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {summary.unresolved}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Critical */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl'>
                            <AlertIcon className='w-6 h-6 text-red-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Critical
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {summary.critical}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Unacknowledged */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl'>
                            <BellIcon className='w-6 h-6 text-orange-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Unacknowledged
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {summary.unacknowledged}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Type Summary */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                <h2 className='text-lg font-semibold text-slate-800 mb-4'>
                    Alerts by Type
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideUp'>
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
                            <XCircleIcon className='w-8 h-8 text-red-600' />
                        </div>
                    </div>
                    <div className='p-4 bg-orange-50 rounded-xl border border-orange-200'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-orange-600 font-medium'>
                                    Low Stock
                                </p>
                                <p className='text-2xl font-bold text-orange-700'>
                                    {summary.lowStock}
                                </p>
                            </div>
                            <TrendingDownIcon className='w-8 h-8 text-orange-600' />
                        </div>
                    </div>
                    <div className='p-4 bg-yellow-50 rounded-xl border border-yellow-200'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-yellow-600 font-medium'>
                                    Reorder Point
                                </p>
                                <p className='text-2xl font-bold text-yellow-700'>
                                    {summary.reorderPoint}
                                </p>
                            </div>
                            <BellIcon className='w-8 h-8 text-yellow-600' />
                        </div>
                    </div>
                    <div className='p-4 bg-blue-50 rounded-xl border border-blue-200'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-blue-600 font-medium'>
                                    Overstock
                                </p>
                                <p className='text-2xl font-bold text-blue-700'>
                                    {summary.overstock}
                                </p>
                            </div>
                            <TrendingUpIcon className='w-8 h-8 text-blue-600' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                <h2 className='text-lg font-semibold text-slate-800 mb-4'>
                    Filters
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideUp'>
                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Severity
                        </label>
                        <select
                            value={filters.severity}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    severity: e.target.value,
                                }))
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                        >
                            <option value=''>All Severities</option>
                            <option value='CRITICAL'>Critical</option>
                            <option value='HIGH'>High</option>
                            <option value='MEDIUM'>Medium</option>
                            <option value='LOW'>Low</option>
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Alert Type
                        </label>
                        <select
                            value={filters.alertType}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    alertType: e.target.value,
                                }))
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                        >
                            <option value=''>All Types</option>
                            <option value='OUT_OF_STOCK'>Out of Stock</option>
                            <option value='LOW_STOCK'>Low Stock</option>
                            <option value='REORDER_POINT'>Reorder Point</option>
                            <option value='OVERSTOCK'>Overstock</option>
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Status
                        </label>
                        <select
                            value={filters.acknowledged}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    acknowledged: e.target.value,
                                }))
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                        >
                            <option value=''>All</option>
                            <option value='false'>Unacknowledged</option>
                            <option value='true'>Acknowledged</option>
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Resolution
                        </label>
                        <select
                            value={filters.resolved}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    resolved: e.target.value,
                                }))
                            }
                            className='w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                        >
                            <option value=''>All</option>
                            <option value='false'>Unresolved</option>
                            <option value='true'>Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
                <div className='p-6 border-b border-slate-200'>
                    <h2 className='text-lg font-semibold text-slate-800'>
                        Alerts ({alerts.length})
                    </h2>
                </div>

                {loading ? (
                    <div className='text-center py-12'>
                        <div className='inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin'></div>
                        <p className='text-slate-600 mt-4'>Loading alerts...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className='text-center py-12'>
                        <CheckCircleIcon className='w-16 h-16 text-green-500 mx-auto mb-4' />
                        <p className='text-slate-600 text-lg'>
                            No alerts found
                        </p>
                        <p className='text-slate-500 mt-2'>
                            All stock levels are within normal range
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='divide-y divide-slate-200'>
                            {currentAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className='p-6 hover:bg-slate-50 transition-colors'
                                >
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-start gap-4 flex-1'>
                                            <div
                                                className={`p-3 rounded-xl ${getSeverityStyle(
                                                    alert.severity
                                                )}`}
                                            >
                                                {getAlertTypeIcon(
                                                    alert.alertType
                                                )}
                                            </div>
                                            <div className='flex-1'>
                                                <div className='flex items-center gap-3 mb-2'>
                                                    <span className='px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white'>
                                                        {alert.alertType.replace(
                                                            /_/g,
                                                            ' '
                                                        )}
                                                    </span>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyle(
                                                            alert.severity
                                                        )}`}
                                                    >
                                                        {alert.severity}
                                                    </span>
                                                    {alert.acknowledged && (
                                                        <span className='px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800'>
                                                            Acknowledged
                                                        </span>
                                                    )}
                                                    {alert.resolved && (
                                                        <span className='px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800'>
                                                            Resolved
                                                        </span>
                                                    )}
                                                </div>
                                                <p className='text-slate-800 font-medium mb-2'>
                                                    {alert.message}
                                                </p>
                                                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm animate-slideUp'>
                                                    <div>
                                                        <p className='text-slate-500'>
                                                            Item
                                                        </p>
                                                        <p className='font-semibold'>
                                                            {
                                                                alert.itemMaster
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className='text-xs text-slate-500'>
                                                            {
                                                                alert.itemMaster
                                                                    .sku
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className='text-slate-500'>
                                                            Warehouse
                                                        </p>
                                                        <p className='font-semibold'>
                                                            {
                                                                alert.warehouse
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className='text-xs text-slate-500'>
                                                            {
                                                                alert.warehouse
                                                                    .city
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className='text-slate-500'>
                                                            Current / Threshold
                                                        </p>
                                                        <p className='font-semibold'>
                                                            {alert.currentQty} /{' '}
                                                            {alert.threshold}{' '}
                                                            {
                                                                alert.itemMaster
                                                                    .unitOfMeasure
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className='text-slate-500'>
                                                            Created
                                                        </p>
                                                        <p className='font-semibold'>
                                                            {formatDate(
                                                                alert.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {!alert.resolved && (
                                            <div className='flex gap-2 ml-4'>
                                                {!alert.acknowledged && (
                                                    <button
                                                        onClick={() =>
                                                            handleAlertAction(
                                                                alert.id,
                                                                'acknowledge'
                                                            )
                                                        }
                                                        className='px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold'
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleAlertAction(
                                                            alert.id,
                                                            'resolve'
                                                        )
                                                    }
                                                    className='px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-semibold'
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={alerts.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            showItemsPerPage={false}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
