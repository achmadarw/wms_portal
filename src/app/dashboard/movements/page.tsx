'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { useAlert } from '@/hooks/useAlert';

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
    const {
        alertConfig,
        isOpen: isAlertOpen,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        closeAlert,
    } = useAlert();

    // Handle 401 Unauthorized - logout and redirect to login
    const handleUnauthorized = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        showWarning(
            'Sesi login Anda telah berakhir atau tidak valid.\n\nAnda akan diarahkan ke halaman login.',
            'Sesi Berakhir'
        );
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    };
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

    // RBAC state
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRole, setUserRole] = useState('');

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
    const [availableStock, setAvailableStock] = useState<number | null>(null);
    const [loadingStock, setLoadingStock] = useState(false);
    // Bin capacity info for validation
    const [binCapacityInfo, setBinCapacityInfo] = useState<{
        currentQty: number;
        maxCapacity: number;
        pendingQty: number;
        availableSpace: number;
    } | null>(null);

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
    }, []);

    useEffect(() => {
        fetchMovements();
    }, [filters]);

    useEffect(() => {
        if (showCreateModal) {
            fetchFormData();
        }
    }, [showCreateModal]);

    // Fetch items when movement type changes
    useEffect(() => {
        const fetchFilteredItems = async () => {
            if (showCreateModal && createForm.type) {
                try {
                    const token = localStorage.getItem('accessToken');
                    const response = await fetch(
                        `/api/movements/available-items?type=${createForm.type}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (response.status === 401) {
                        handleUnauthorized();
                        return;
                    }
                    if (response.ok) {
                        const data = await response.json();
                        setItems(data.items || []);
                    }
                } catch (error) {
                    console.error(
                        '[API] Error fetching filtered items:',
                        error
                    );
                }
            }
        };
        fetchFilteredItems();
    }, [showCreateModal, createForm.type]);

    // Fetch warehouses/bins when item changes
    useEffect(() => {
        const fetchFilteredWarehousesAndBins = async () => {
            if (showCreateModal && createForm.itemId && createForm.type) {
                try {
                    const token = localStorage.getItem('accessToken');
                    const response = await fetch(
                        `/api/movements/available-bins?itemId=${createForm.itemId}&type=${createForm.type}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (response.status === 401) {
                        handleUnauthorized();
                        return;
                    }
                    if (response.ok) {
                        const data = await response.json();
                        const fetchedWarehouses = data.warehouses || [];
                        setWarehouses(fetchedWarehouses);

                        // If current warehouse is not in the filtered list, reset it
                        if (
                            createForm.warehouseId &&
                            !fetchedWarehouses.find(
                                (w: any) => w.id === createForm.warehouseId
                            )
                        ) {
                            setCreateForm((prev) => ({
                                ...prev,
                                warehouseId: '',
                                fromBin: '',
                                toBin: '',
                            }));
                        }

                        // Update bins for the selected warehouse
                        if (createForm.warehouseId) {
                            const selectedWarehouse = fetchedWarehouses.find(
                                (w: any) => w.id === createForm.warehouseId
                            );
                            setBins(selectedWarehouse?.bins || []);
                        } else {
                            setBins([]);
                        }
                    }
                } catch (error) {
                    console.error(
                        '[API] Error fetching filtered warehouses/bins:',
                        error
                    );
                }
            }
        };
        fetchFilteredWarehousesAndBins();
    }, [showCreateModal, createForm.itemId, createForm.type]);

    // Fetch bins when warehouse changes
    useEffect(() => {
        const fetchBins = async () => {
            if (createForm.warehouseId) {
                try {
                    const token = localStorage.getItem('accessToken');
                    console.log(
                        '[DEBUG] Fetching bins for warehouse:',
                        createForm.warehouseId
                    );
                    const binsRes = await fetch(
                        `/api/warehouses/bins?warehouseId=${createForm.warehouseId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (binsRes.status === 401) {
                        handleUnauthorized();
                        return;
                    }
                    if (binsRes.ok) {
                        const binsData = await binsRes.json();
                        console.log('[DEBUG] Bins response:', binsData);
                        console.log(
                            '[DEBUG] Bins array length:',
                            binsData.bins?.length
                        );
                        setBins(binsData.bins || []);
                    } else {
                        console.error(
                            '[API] Failed to fetch bins:',
                            binsRes.status
                        );
                    }
                } catch (error) {
                    console.error('[API] Error fetching bins:', error);
                }
            } else {
                setBins([]);
            }
        };
        fetchBins();
    }, [createForm.warehouseId]);

    // Fetch available stock when item and warehouse are selected (for OUTBOUND/TRANSFER/DAMAGE)
    useEffect(() => {
        const fetchTotalAvailableStock = async () => {
            const needsStockCheck = [
                'OUTBOUND',
                'TRANSFER',
                'DAMAGE',
                'ADJUSTMENT',
            ].includes(createForm.type);

            if (
                needsStockCheck &&
                createForm.itemId &&
                createForm.warehouseId
            ) {
                setLoadingStock(true);
                try {
                    const token = localStorage.getItem('accessToken');

                    // If fromBin is selected, get stock for that specific bin
                    if (createForm.fromBin) {
                        const response = await fetch(
                            `/api/inventory/check-stock?itemId=${createForm.itemId}&warehouseId=${createForm.warehouseId}&binCode=${createForm.fromBin}`,
                            {
                                headers: { Authorization: `Bearer ${token}` },
                            }
                        );
                        if (response.status === 401) {
                            handleUnauthorized();
                            return;
                        }
                        if (response.ok) {
                            const data = await response.json();
                            setAvailableStock(data.availableQty || 0);
                        } else {
                            setAvailableStock(0);
                        }
                    } else {
                        // If no bin selected, get total stock for item in warehouse
                        const response = await fetch(
                            `/api/inventory/check-stock?itemId=${createForm.itemId}&warehouseId=${createForm.warehouseId}`,
                            {
                                headers: { Authorization: `Bearer ${token}` },
                            }
                        );
                        if (response.status === 401) {
                            handleUnauthorized();
                            return;
                        }
                        if (response.ok) {
                            const data = await response.json();
                            setAvailableStock(data.availableQty || 0);
                        } else {
                            setAvailableStock(0);
                        }
                    }
                } catch (error) {
                    console.error(
                        '[API] Error fetching available stock:',
                        error
                    );
                    setAvailableStock(0);
                } finally {
                    setLoadingStock(false);
                }
            } else {
                // For INBOUND/RETURN or incomplete form, reset stock state
                setAvailableStock(null);
                setLoadingStock(false);
            }
        };
        fetchTotalAvailableStock();
    }, [
        createForm.itemId,
        createForm.warehouseId,
        createForm.fromBin,
        createForm.type,
    ]);

    // Fetch bin capacity info when toBin changes (for INBOUND/RETURN/TRANSFER)
    useEffect(() => {
        const fetchBinCapacityInfo = async () => {
            if (
                ['INBOUND', 'RETURN', 'TRANSFER'].includes(createForm.type) &&
                createForm.toBin &&
                createForm.warehouseId
            ) {
                try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(
                        `/api/bins/capacity?binCode=${createForm.toBin}&warehouseId=${createForm.warehouseId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (res.status === 401) {
                        handleUnauthorized();
                        return;
                    }
                    if (res.ok) {
                        const data = await res.json();
                        setBinCapacityInfo({
                            currentQty: data.currentQty || 0,
                            maxCapacity: data.maxCapacity || 0,
                            pendingQty: data.pendingQty || 0,
                            availableSpace:
                                (data.maxCapacity || 0) -
                                ((data.currentQty || 0) +
                                    (data.pendingQty || 0)),
                        });
                    } else {
                        setBinCapacityInfo(null);
                    }
                } catch (error) {
                    setBinCapacityInfo(null);
                }
            } else {
                setBinCapacityInfo(null);
            }
        };
        fetchBinCapacityInfo();
    }, [createForm.toBin, createForm.warehouseId, createForm.type]);

    const fetchMovements = async () => {
        try {
            const token = localStorage.getItem('accessToken');
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

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error ||
                        `Failed to fetch movements: ${response.status}`
                );
            }

            const data = await response.json();
            setMovements(data.movements || []);
            setStats(
                data.stats || {
                    totalMovements: 0,
                    inbound: 0,
                    outbound: 0,
                    adjustments: 0,
                    transfers: 0,
                    totalQuantityIn: 0,
                    totalQuantityOut: 0,
                }
            );
        } catch (error) {
            console.error('[API] Error fetching movements:', error);
            setMovements([]);
            setStats({
                totalMovements: 0,
                inbound: 0,
                outbound: 0,
                adjustments: 0,
                transfers: 0,
                totalQuantityIn: 0,
                totalQuantityOut: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            // Fetch filtered items based on movement type
            if (createForm.type) {
                const itemsRes = await fetch(
                    `/api/movements/available-items?type=${createForm.type}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (itemsRes.status === 401) {
                    handleUnauthorized();
                    return;
                }
                if (itemsRes.ok) {
                    const itemsData = await itemsRes.json();
                    setItems(itemsData.items || []);
                }
            }

            // Fetch filtered warehouses/bins if item is selected
            if (createForm.itemId && createForm.type) {
                const warehousesRes = await fetch(
                    `/api/movements/available-bins?itemId=${createForm.itemId}&type=${createForm.type}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (warehousesRes.status === 401) {
                    handleUnauthorized();
                    return;
                }
                if (warehousesRes.ok) {
                    const warehousesData = await warehousesRes.json();
                    const fetchedWarehouses = warehousesData.warehouses || [];
                    setWarehouses(fetchedWarehouses);

                    // Update bins for the selected warehouse
                    if (createForm.warehouseId) {
                        const selectedWarehouse = fetchedWarehouses.find(
                            (w: any) => w.id === createForm.warehouseId
                        );
                        setBins(selectedWarehouse?.bins || []);
                    }
                }
            }
        } catch (error) {
            console.error('[API] Error fetching form data:', error);
        }
    };

    const handleCreateMovement = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const token = localStorage.getItem('accessToken');

            const requestBody = {
                itemId: createForm.itemId,
                type: createForm.type,
                quantity: parseInt(createForm.quantity),
                warehouseId: createForm.warehouseId,
                fromBin: createForm.fromBin || undefined,
                toBin: createForm.toBin || undefined,
                notes: createForm.notes || undefined,
            };

            console.log('[DEBUG] Creating movement with data:', requestBody);

            const response = await fetch('/api/movements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errorMessage =
                    error.error ||
                    `Failed to create movement: ${response.status}`;
                showError(errorMessage, 'Gagal Membuat Movement');
                return;
            }

            const result = await response.json();
            showSuccess(
                `Movement berhasil dibuat!

Reference: ${result.movement.referenceNo}`,
                'Berhasil'
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
            setAvailableStock(null);
            setShowCreateModal(false);

            // Refresh movements list
            fetchMovements();
        } catch (error: any) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Error creating movement';
            showError(errorMessage, 'Error');
            console.error('[API] Error creating movement:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleProcessMovement = async (movementId: string) => {
        showConfirm(
            'Process movement ini? Tindakan ini akan mengupdate inventory.',
            async () => {
                try {
                    const token = localStorage.getItem('accessToken');
                    const response = await fetch(
                        `/api/movements/${movementId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ action: 'process' }),
                        }
                    );

                    if (response.status === 401) {
                        handleUnauthorized();
                        return;
                    }

                    if (response.ok) {
                        const data = await response.json();
                        showSuccess(
                            data.message || 'Movement berhasil diproses!',
                            'Berhasil'
                        );
                        fetchMovements(); // Refresh list
                    } else {
                        const error = await response.json();
                        showError(
                            error.error || 'Gagal memproses movement',
                            'Error'
                        );
                    }
                } catch (error) {
                    console.error('[API] Error processing movement:', error);
                    showError('Gagal memproses movement', 'Error');
                }
            },
            'Konfirmasi Process'
        );
    };

    const handleCancelMovement = async (movementId: string) => {
        showConfirm(
            'Cancel movement ini? Tindakan ini tidak dapat dibatalkan.\n\nMovement akan ditandai sebagai CANCELLED dan disimpan untuk audit trail.',
            async () => {
                try {
                    const token = localStorage.getItem('accessToken');
                    const response = await fetch(
                        `/api/movements/${movementId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ action: 'cancel' }),
                        }
                    );

                    if (response.status === 401) {
                        handleUnauthorized();
                        return;
                    }

                    if (response.ok) {
                        const data = await response.json();
                        showSuccess(
                            data.message || 'Movement berhasil dibatalkan!',
                            'Berhasil'
                        );
                        fetchMovements(); // Refresh list
                    } else {
                        const error = await response.json();
                        showError(
                            error.error || 'Gagal membatalkan movement',
                            'Error'
                        );
                    }
                } catch (error) {
                    console.error('[API] Error cancelling movement:', error);
                    showError('Gagal membatalkan movement', 'Error');
                }
            },
            'Konfirmasi Cancel'
        );
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
        <>
            {/* Alert Component */}
            {alertConfig && (
                <Alert
                    isOpen={isAlertOpen}
                    onClose={closeAlert}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    confirmText={alertConfig.confirmText}
                    cancelText={alertConfig.cancelText}
                    showCancel={alertConfig.showCancel}
                    onConfirm={alertConfig.onConfirm}
                />
            )}

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
                                        {stats?.totalMovements || 0}
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
                                        {stats?.inbound || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        +
                                        {(
                                            stats?.totalQuantityIn || 0
                                        ).toLocaleString()}{' '}
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
                                        {stats?.outbound || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        -
                                        {(
                                            stats?.totalQuantityOut || 0
                                        ).toLocaleString()}{' '}
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
                                        {stats?.transfers || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        {stats?.adjustments || 0} adjustments
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
                                    setFilters({
                                        ...filters,
                                        type: e.target.value,
                                    })
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

                {/* Movements Table - Modern Card-Based Layout */}
                <div className='bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='min-w-full'>
                            <thead className='bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200'>
                                <tr>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[180px]'>
                                        Reference
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[280px]'>
                                        Item Details
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[100px]'>
                                        Type
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[100px]'>
                                        Status
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[100px]'>
                                        Quantity
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[180px]'>
                                        Warehouse & Location
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[200px]'>
                                        Notes
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider w-[140px]'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-slate-100'>
                                {movements.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className='px-6 py-16 text-center'
                                        >
                                            <div className='flex flex-col items-center justify-center'>
                                                <svg
                                                    className='w-16 h-16 text-slate-300 mb-4'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={1.5}
                                                        d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                                                    />
                                                </svg>
                                                <p className='text-slate-500 font-medium'>
                                                    No movements found
                                                </p>
                                                <p className='text-slate-400 text-sm mt-1'>
                                                    Try adjusting your filters
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movements.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className='hover:bg-slate-50 transition-colors'
                                        >
                                            {/* Reference Column */}
                                            <td className='px-4 py-3'>
                                                <div className='space-y-1'>
                                                    <div
                                                        className='text-xs font-mono text-blue-600 font-semibold truncate'
                                                        title={
                                                            movement.referenceNo
                                                        }
                                                    >
                                                        {movement.referenceNo}
                                                    </div>
                                                    <div className='text-xs text-slate-500'>
                                                        {new Date(
                                                            movement.createdAt
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            }
                                                        )}
                                                    </div>
                                                    <div className='text-xs text-slate-400'>
                                                        {new Date(
                                                            movement.createdAt
                                                        ).toLocaleTimeString(
                                                            'en-US',
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Item Details Column */}
                                            <td className='px-4 py-3'>
                                                <div className='space-y-1'>
                                                    <div
                                                        className='text-sm font-semibold text-slate-900 truncate max-w-[260px]'
                                                        title={
                                                            movement.item
                                                                .itemMaster.name
                                                        }
                                                    >
                                                        {
                                                            movement.item
                                                                .itemMaster.name
                                                        }
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded'>
                                                            {
                                                                movement.item
                                                                    .itemMaster
                                                                    .sku
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className='text-xs text-slate-400'>
                                                        By:{' '}
                                                        {
                                                            movement.createdBy.fullName.split(
                                                                ' '
                                                            )[0]
                                                        }
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type Column */}
                                            <td className='px-4 py-3'>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${getTypeColor(
                                                        movement.type
                                                    )}`}
                                                >
                                                    {movement.type}
                                                </span>
                                            </td>

                                            {/* Status Column */}
                                            <td className='px-4 py-3'>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(
                                                        movement.status
                                                    )}`}
                                                >
                                                    {movement.status}
                                                </span>
                                            </td>

                                            {/* Quantity Column */}
                                            <td className='px-4 py-3'>
                                                <div className='flex flex-col'>
                                                    <span
                                                        className={`text-lg font-bold ${
                                                            movement.quantity >
                                                            0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }`}
                                                    >
                                                        {movement.quantity > 0
                                                            ? '+'
                                                            : ''}
                                                        {movement.quantity}
                                                    </span>
                                                    <span className='text-xs text-slate-500 font-medium'>
                                                        {
                                                            movement.item
                                                                .itemMaster
                                                                .unitOfMeasure
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Warehouse & Location Column */}
                                            <td className='px-4 py-3'>
                                                <div className='space-y-1'>
                                                    <div
                                                        className='text-xs font-semibold text-slate-700 truncate'
                                                        title={
                                                            movement.warehouse
                                                                .name
                                                        }
                                                    >
                                                        {
                                                            movement.warehouse
                                                                .name
                                                        }
                                                    </div>
                                                    {movement.fromBin && (
                                                        <div className='flex items-center gap-1 text-xs'>
                                                            <span className='text-slate-400'>
                                                                From:
                                                            </span>
                                                            <span className='text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]'>
                                                                {
                                                                    movement.fromBin
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {movement.toBin && (
                                                        <div className='flex items-center gap-1 text-xs'>
                                                            <span className='text-slate-400'>
                                                                To:
                                                            </span>
                                                            <span className='text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]'>
                                                                {movement.toBin}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!movement.fromBin &&
                                                        !movement.toBin && (
                                                            <span className='text-slate-400 text-xs'>
                                                                -
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            {/* Notes Column */}
                                            <td className='px-4 py-3'>
                                                <div
                                                    className='text-xs text-slate-600 line-clamp-2 max-w-[190px]'
                                                    title={
                                                        movement.notes || '-'
                                                    }
                                                >
                                                    {movement.notes || (
                                                        <span className='text-slate-400'>
                                                            No notes
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions Column */}
                                            <td className='px-4 py-3'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    {movement.status ===
                                                    'PENDING' ? (
                                                        userRole === 'ADMIN' ||
                                                        userRole ===
                                                            'SUPERVISOR' ? (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleProcessMovement(
                                                                            movement.id
                                                                        )
                                                                    }
                                                                    className='inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow'
                                                                    title='Process Movement'
                                                                >
                                                                    <svg
                                                                        className='w-3.5 h-3.5'
                                                                        fill='none'
                                                                        stroke='currentColor'
                                                                        viewBox='0 0 24 24'
                                                                    >
                                                                        <path
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d='M5 13l4 4L19 7'
                                                                        />
                                                                    </svg>
                                                                    Process
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleCancelMovement(
                                                                            movement.id
                                                                        )
                                                                    }
                                                                    className='inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow'
                                                                    title='Cancel Movement'
                                                                >
                                                                    <svg
                                                                        className='w-3.5 h-3.5'
                                                                        fill='none'
                                                                        stroke='currentColor'
                                                                        viewBox='0 0 24 24'
                                                                    >
                                                                        <path
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d='M6 18L18 6M6 6l12 12'
                                                                        />
                                                                    </svg>
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className='inline-flex items-center gap-1.5 text-yellow-700 text-xs font-semibold bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200'>
                                                                <svg
                                                                    className='w-3.5 h-3.5 animate-pulse'
                                                                    fill='currentColor'
                                                                    viewBox='0 0 20 20'
                                                                >
                                                                    <path
                                                                        fillRule='evenodd'
                                                                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                                                                        clipRule='evenodd'
                                                                    />
                                                                </svg>
                                                                Awaiting
                                                            </span>
                                                        )
                                                    ) : movement.status ===
                                                      'COMPLETED' ? (
                                                        <span className='inline-flex items-center gap-1.5 text-green-700 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200'>
                                                            <svg
                                                                className='w-3.5 h-3.5'
                                                                fill='currentColor'
                                                                viewBox='0 0 20 20'
                                                            >
                                                                <path
                                                                    fillRule='evenodd'
                                                                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                                    clipRule='evenodd'
                                                                />
                                                            </svg>
                                                            Done
                                                        </span>
                                                    ) : movement.status ===
                                                      'CANCELLED' ? (
                                                        <span className='inline-flex items-center gap-1.5 text-red-700 text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200'>
                                                            <svg
                                                                className='w-3.5 h-3.5'
                                                                fill='currentColor'
                                                                viewBox='0 0 20 20'
                                                            >
                                                                <path
                                                                    fillRule='evenodd'
                                                                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                                                                    clipRule='evenodd'
                                                                />
                                                            </svg>
                                                            Cancelled
                                                        </span>
                                                    ) : (
                                                        <span className='text-slate-400 text-xs'>
                                                            {movement.status}
                                                        </span>
                                                    )}
                                                </div>
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
                        className='fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[9999] animate-fadeIn'
                        style={{
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh',
                            margin: 0,
                            padding: '1rem',
                            zIndex: 9999,
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
                                    onClick={() => {
                                        setCreateForm({
                                            itemId: '',
                                            type: 'INBOUND',
                                            quantity: '',
                                            warehouseId: '',
                                            fromBin: '',
                                            toBin: '',
                                            notes: '',
                                        });
                                        setItems([]);
                                        setWarehouses([]);
                                        setBins([]);
                                        setAvailableStock(null);
                                        setLoadingStock(false);
                                        setShowCreateModal(false);
                                    }}
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
                                            onChange={(e) => {
                                                setCreateForm({
                                                    ...createForm,
                                                    type: e.target.value,
                                                    itemId: '',
                                                    warehouseId: '',
                                                    fromBin: '',
                                                    toBin: '',
                                                });
                                                setItems([]);
                                                setWarehouses([]);
                                                setBins([]);
                                                setAvailableStock(null);
                                            }}
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
                                                {createForm.type ===
                                                    'INBOUND' &&
                                                    '💡 Increases inventory when receiving goods'}
                                                {createForm.type ===
                                                    'OUTBOUND' &&
                                                    '💡 Decreases inventory when shipping goods'}
                                                {createForm.type ===
                                                    'TRANSFER' &&
                                                    '💡 Moves items between bin locations'}
                                                {createForm.type ===
                                                    'ADJUSTMENT' &&
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
                                            onChange={(e) => {
                                                setCreateForm({
                                                    ...createForm,
                                                    itemId: e.target.value,
                                                    warehouseId: '',
                                                    fromBin: '',
                                                    toBin: '',
                                                });
                                                setWarehouses([]);
                                                setBins([]);
                                                setAvailableStock(null);
                                                setLoadingStock(false);
                                            }}
                                            required
                                            disabled={!createForm.type}
                                            className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed'
                                        >
                                            <option value=''>
                                                {!createForm.type
                                                    ? 'Select movement type first...'
                                                    : items.length === 0
                                                    ? 'No items available...'
                                                    : 'Select an item...'}
                                            </option>
                                            {items.map((item) => (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {item.sku} - {item.name}
                                                </option>
                                            ))}
                                        </select>
                                        {/* {createForm.type &&
                                        createForm.type !== 'INBOUND' &&
                                        createForm.type !== 'RETURN' &&
                                        items.length === 0 && (
                                            <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                                <p className='text-xs text-yellow-800 font-medium'>
                                                    ⚠️ No items with available
                                                    stock found. Only items with
                                                    stock &gt; 0 can be used for
                                                    this movement type.
                                                </p>
                                            </div>
                                        )} */}
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
                                                const selectedWarehouseId =
                                                    e.target.value;
                                                const selectedWarehouse =
                                                    warehouses.find(
                                                        (w: any) =>
                                                            w.id ===
                                                            selectedWarehouseId
                                                    );
                                                setCreateForm({
                                                    ...createForm,
                                                    warehouseId:
                                                        selectedWarehouseId,
                                                    fromBin: '',
                                                    toBin: '',
                                                });
                                                setBins(
                                                    selectedWarehouse?.bins ||
                                                        []
                                                );
                                                // Reset stock when warehouse changes
                                                setAvailableStock(null);
                                                setLoadingStock(false);
                                            }}
                                            required
                                            disabled={!createForm.itemId}
                                            className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed'
                                        >
                                            <option value=''>
                                                {!createForm.itemId
                                                    ? 'Select item first...'
                                                    : warehouses.length === 0
                                                    ? 'No warehouses with stock...'
                                                    : 'Select warehouse...'}
                                            </option>
                                            {warehouses.map((wh) => (
                                                <option
                                                    key={wh.id}
                                                    value={wh.id}
                                                >
                                                    {wh.name}{' '}
                                                    {wh.code
                                                        ? `(${wh.code})`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.itemId &&
                                            createForm.type !== 'INBOUND' &&
                                            createForm.type !== 'RETURN' &&
                                            warehouses.length === 0 && (
                                                <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                                    <p className='text-xs text-yellow-800 font-medium'>
                                                        ⚠️ Selected item has no
                                                        stock in any warehouse.
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    {/* From Bin (for OUTBOUND, TRANSFER, DAMAGE) */}
                                    {[
                                        'OUTBOUND',
                                        'TRANSFER',
                                        'DAMAGE',
                                    ].includes(createForm.type) && (
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
                                                    createForm.type ===
                                                    'TRANSFER'
                                                }
                                                disabled={
                                                    !createForm.warehouseId ||
                                                    bins.length === 0
                                                }
                                                className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed'
                                            >
                                                <option value=''>
                                                    {!createForm.warehouseId
                                                        ? 'Select warehouse first...'
                                                        : bins.length === 0
                                                        ? 'No bins with stock available...'
                                                        : 'Select source bin...'}
                                                </option>
                                                {bins.map((bin) => (
                                                    <option
                                                        key={bin.id}
                                                        value={bin.code}
                                                    >
                                                        {bin.code} - {bin.name}
                                                        {bin.availableQty !==
                                                        undefined
                                                            ? ` (Stock: ${bin.availableQty})`
                                                            : ` (Capacity: ${
                                                                  bin.currentQty ||
                                                                  0
                                                              }/${
                                                                  bin.maxCapacity ||
                                                                  0
                                                              })`}
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
                                                    createForm.type ===
                                                    'TRANSFER'
                                                }
                                                disabled={
                                                    !createForm.warehouseId ||
                                                    bins.length === 0
                                                }
                                                className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed'
                                            >
                                                <option value=''>
                                                    {!createForm.warehouseId
                                                        ? 'Select warehouse first...'
                                                        : bins.length === 0
                                                        ? 'No bins available...'
                                                        : 'Select destination bin...'}
                                                </option>
                                                {bins.map((bin) => (
                                                    <option
                                                        key={bin.id}
                                                        value={bin.code}
                                                    >
                                                        {bin.code} - {bin.name}
                                                        {bin.availableQty !==
                                                        undefined
                                                            ? ` (Stock: ${bin.availableQty})`
                                                            : ` (Capacity: ${
                                                                  bin.currentQty ||
                                                                  0
                                                              }/${
                                                                  bin.maxCapacity ||
                                                                  0
                                                              })`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

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
                                            {availableStock !== null && (
                                                <span className='ml-auto text-xs font-semibold text-slate-600'>
                                                    {loadingStock ? (
                                                        <span className='text-slate-400'>
                                                            Loading...
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={
                                                                availableStock >
                                                                0
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600'
                                                            }
                                                        >
                                                            Available:{' '}
                                                            {availableStock}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type='number'
                                            value={createForm.quantity}
                                            onWheel={(e) =>
                                                (
                                                    e.target as HTMLInputElement
                                                ).blur()
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const numValue =
                                                    parseInt(value);
                                                // Bin capacity validation (INBOUND/RETURN/TRANSFER)
                                                if (
                                                    [
                                                        'INBOUND',
                                                        'RETURN',
                                                        'TRANSFER',
                                                    ].includes(
                                                        createForm.type
                                                    ) &&
                                                    binCapacityInfo &&
                                                    numValue >
                                                        binCapacityInfo.availableSpace
                                                ) {
                                                    return; // Block input if exceeds available space
                                                }
                                                // ...existing code...
                                                // Prevent scientific notation and limit input
                                                if (
                                                    value.includes('e') ||
                                                    value.includes('E')
                                                ) {
                                                    return; // Block scientific notation
                                                }
                                                const numValueFloat =
                                                    parseFloat(value);
                                                if (
                                                    value !== '' &&
                                                    (isNaN(numValueFloat) ||
                                                        numValueFloat < 0 ||
                                                        !Number.isInteger(
                                                            numValueFloat
                                                        ))
                                                ) {
                                                    return;
                                                }
                                                const needsStockCheck = [
                                                    'OUTBOUND',
                                                    'TRANSFER',
                                                    'DAMAGE',
                                                    'ADJUSTMENT',
                                                ].includes(createForm.type);
                                                if (
                                                    needsStockCheck &&
                                                    availableStock !== null &&
                                                    numValueFloat >
                                                        availableStock
                                                ) {
                                                    return;
                                                }
                                                setCreateForm({
                                                    ...createForm,
                                                    quantity: value,
                                                });
                                            }}
                                            onInput={(e) => {
                                                // Only enforce max for stock-dependent movements
                                                const needsStockCheck = [
                                                    'OUTBOUND',
                                                    'TRANSFER',
                                                    'DAMAGE',
                                                    'ADJUSTMENT',
                                                ].includes(createForm.type);

                                                // Extra layer: enforce max at input level
                                                const input =
                                                    e.target as HTMLInputElement;
                                                const numValue = parseInt(
                                                    input.value
                                                );

                                                if (
                                                    needsStockCheck &&
                                                    availableStock !== null &&
                                                    numValue > availableStock
                                                ) {
                                                    input.value =
                                                        availableStock.toString();
                                                    setCreateForm({
                                                        ...createForm,
                                                        quantity:
                                                            availableStock.toString(),
                                                    });
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                // Prevent 'e', 'E', '+', '-' keys
                                                if (
                                                    [
                                                        'e',
                                                        'E',
                                                        '+',
                                                        '-',
                                                        '.',
                                                    ].includes(e.key)
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                // Prevent pasting non-numeric or scientific notation
                                                const pastedText =
                                                    e.clipboardData.getData(
                                                        'text'
                                                    );
                                                if (!/^\d+$/.test(pastedText)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const value = e.target.value;

                                                // Reset if empty or invalid
                                                if (!value || value === '0') {
                                                    setCreateForm({
                                                        ...createForm,
                                                        quantity: '1',
                                                    });
                                                    return;
                                                }

                                                const numValue =
                                                    parseInt(value);

                                                // Only validate on blur for stock-dependent movements
                                                const needsStockCheck = [
                                                    'OUTBOUND',
                                                    'TRANSFER',
                                                    'DAMAGE',
                                                    'ADJUSTMENT',
                                                ].includes(createForm.type);

                                                // Validate on blur
                                                if (
                                                    needsStockCheck &&
                                                    availableStock !== null &&
                                                    numValue > availableStock
                                                ) {
                                                    showWarning(
                                                        `Quantity tidak boleh melebihi stock yang tersedia (${availableStock}).\n\nQuantity telah disesuaikan ke maksimum yang tersedia.`,
                                                        'Peringatan Stock'
                                                    );
                                                    setCreateForm({
                                                        ...createForm,
                                                        quantity:
                                                            availableStock.toString(),
                                                    });
                                                }
                                            }}
                                            required
                                            min='1'
                                            max={
                                                availableStock !== null &&
                                                [
                                                    'OUTBOUND',
                                                    'TRANSFER',
                                                    'DAMAGE',
                                                    'ADJUSTMENT',
                                                ].includes(createForm.type)
                                                    ? availableStock
                                                    : undefined
                                            }
                                            step='1'
                                            pattern='[0-9]*'
                                            inputMode='numeric'
                                            className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 ${
                                                availableStock !== null &&
                                                [
                                                    'OUTBOUND',
                                                    'TRANSFER',
                                                    'DAMAGE',
                                                    'ADJUSTMENT',
                                                ].includes(createForm.type) &&
                                                parseInt(createForm.quantity) >
                                                    availableStock
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-slate-200'
                                            }`}
                                            placeholder='Enter quantity'
                                            title={
                                                availableStock !== null &&
                                                [
                                                    'OUTBOUND',
                                                    'TRANSFER',
                                                    'DAMAGE',
                                                    'ADJUSTMENT',
                                                ].includes(createForm.type)
                                                    ? `Maximum available: ${availableStock}`
                                                    : 'Enter the quantity for this movement'
                                            }
                                        />
                                        {createForm.type === 'ADJUSTMENT' && (
                                            <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                                <p className='text-xs text-yellow-800 font-medium'>
                                                    ⚠️ For adjustment, this will
                                                    be the NEW absolute quantity
                                                </p>
                                            </div>
                                        )}
                                        {binCapacityInfo &&
                                            [
                                                'INBOUND',
                                                'RETURN',
                                                'TRANSFER',
                                            ].includes(createForm.type) &&
                                            parseInt(createForm.quantity) >
                                                binCapacityInfo.availableSpace && (
                                                <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
                                                    <p className='text-xs text-red-800 font-medium'>
                                                        ❌ Quantity melebihi
                                                        kapasitas bin.
                                                        <br />
                                                        Maksimum tersedia:{' '}
                                                        {
                                                            binCapacityInfo.availableSpace
                                                        }{' '}
                                                        (Current:{' '}
                                                        {
                                                            binCapacityInfo.currentQty
                                                        }
                                                        , Pending:{' '}
                                                        {
                                                            binCapacityInfo.pendingQty
                                                        }
                                                        , Capacity:{' '}
                                                        {
                                                            binCapacityInfo.maxCapacity
                                                        }
                                                        )
                                                    </p>
                                                </div>
                                            )}
                                        {availableStock !== null &&
                                            availableStock === 0 && (
                                                <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
                                                    <p className='text-xs text-red-800 font-medium'>
                                                        ❌ No stock available in
                                                        selected bin
                                                    </p>
                                                </div>
                                            )}
                                    </div>

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
                                            disabled={
                                                creating ||
                                                (availableStock !== null &&
                                                    (parseInt(
                                                        createForm.quantity
                                                    ) > availableStock ||
                                                        availableStock === 0))
                                            }
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
                                            onClick={() => {
                                                setCreateForm({
                                                    itemId: '',
                                                    type: 'INBOUND',
                                                    quantity: '',
                                                    warehouseId: '',
                                                    fromBin: '',
                                                    toBin: '',
                                                    notes: '',
                                                });
                                                setItems([]);
                                                setWarehouses([]);
                                                setBins([]);
                                                setAvailableStock(null);
                                                setLoadingStock(false);
                                                setShowCreateModal(false);
                                            }}
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
        </>
    );
}
