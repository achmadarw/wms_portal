'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { useAlert } from '@/hooks/useAlert';
import Pagination from '@/components/Pagination';
import { withProgress } from '@/lib/progress';
import PageSkeleton from '@/components/PageSkeleton';
import {
    MovementIcon,
    PlusIcon,
    InboundIcon,
    OutboundIcon,
    TransferIcon,
    AdjustmentIcon,
    DamageIcon,
    ReturnIcon,
    FilterIcon,
    SearchIcon,
    EditIcon,
    TrashIcon,
    EyeIcon,
    CheckIcon,
    XIcon,
    ClipboardIcon,
    BoxEmptyIcon,
    BoxIcon,
    TagIcon,
    WarehouseIcon,
    ClockFilledIcon,
    CheckCircleFilledIcon,
    XCircleFilledIcon,
    LocationPinIcon,
    HashIcon,
    DocumentIcon,
    SpinnerIcon,
} from '@/components/icons';

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
    damage: number;
    returns: number;
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
    const [toBins, setToBins] = useState<any[]>([]); // Separate state for To Bin dropdown
    const [availableStock, setAvailableStock] = useState<number | null>(null);
    const [loadingStock, setLoadingStock] = useState(false);
    // For RETURN - max returnable quantity
    const [maxReturnable, setMaxReturnable] = useState<number | null>(null);
    const [returnInfo, setReturnInfo] = useState<{
        totalOutbound: number;
        totalReturned: number;
    } | null>(null);
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
                // For all movement types, bins are already filtered from available-bins API
                // Just extract bins from the selected warehouse
                console.log(
                    '[DEBUG] Looking for warehouse:',
                    createForm.warehouseId
                );
                console.log(
                    '[DEBUG] Available warehouses:',
                    warehouses.map((w: any) => ({
                        id: w.id,
                        name: w.name,
                        binsCount: w.bins?.length,
                    }))
                );

                const selectedWarehouse = warehouses.find(
                    (w: any) => w.id === createForm.warehouseId
                );
                if (selectedWarehouse) {
                    console.log(
                        '[DEBUG] Using filtered bins:',
                        selectedWarehouse.bins
                    );
                    setBins(selectedWarehouse.bins || []);
                } else {
                    console.log(
                        '[DEBUG] Warehouse not found in warehouses list'
                    );
                    setBins([]);
                }
            } else {
                setBins([]);
            }
        };
        fetchBins();
    }, [createForm.warehouseId, createForm.type, warehouses]);

    // Fetch all bins for To Bin dropdown on TRANSFER
    useEffect(() => {
        const fetchToBins = async () => {
            if (createForm.type === 'TRANSFER' && createForm.warehouseId) {
                try {
                    const token = localStorage.getItem('accessToken');
                    console.log(
                        '[DEBUG] TRANSFER - Fetching all bins for To Bin in warehouse:',
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
                        console.log(
                            '[DEBUG] TRANSFER - To Bins response:',
                            binsData.bins?.length
                        );
                        setToBins(binsData.bins || []);
                    } else {
                        console.error(
                            '[API] Failed to fetch to bins:',
                            binsRes.status
                        );
                        setToBins([]);
                    }
                } catch (error) {
                    console.error('[API] Error fetching to bins:', error);
                    setToBins([]);
                }
            } else {
                setToBins([]);
            }
        };
        fetchToBins();
    }, [createForm.warehouseId, createForm.type]);

    // Fetch available stock when item and warehouse are selected (for OUTBOUND/TRANSFER/DAMAGE)
    useEffect(() => {
        const fetchTotalAvailableStock = async () => {
            const needsStockCheck = ['OUTBOUND', 'TRANSFER', 'DAMAGE'].includes(
                createForm.type
            );

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
            // For ADJUSTMENT, use fromBin instead of toBin
            const binToCheck =
                createForm.type === 'ADJUSTMENT'
                    ? createForm.fromBin
                    : createForm.toBin;

            if (
                ['INBOUND', 'RETURN', 'TRANSFER', 'ADJUSTMENT'].includes(
                    createForm.type
                ) &&
                binToCheck &&
                createForm.warehouseId
            ) {
                try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(
                        `/api/bins/capacity?binCode=${binToCheck}&warehouseId=${createForm.warehouseId}`,
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
    }, [
        createForm.toBin,
        createForm.fromBin,
        createForm.warehouseId,
        createForm.type,
    ]);

    // Fetch returnable quantity for RETURN movements
    useEffect(() => {
        const fetchReturnableQuantity = async () => {
            if (
                createForm.type === 'RETURN' &&
                createForm.itemId &&
                createForm.warehouseId
            ) {
                try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(
                        `/api/movements/returnable-quantity?itemId=${createForm.itemId}&warehouseId=${createForm.warehouseId}`,
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
                        setMaxReturnable(data.maxReturnable);
                        setReturnInfo({
                            totalOutbound: data.totalOutbound,
                            totalReturned: data.totalReturned,
                        });
                    } else {
                        setMaxReturnable(null);
                        setReturnInfo(null);
                    }
                } catch (error) {
                    setMaxReturnable(null);
                    setReturnInfo(null);
                }
            } else {
                setMaxReturnable(null);
                setReturnInfo(null);
            }
        };
        fetchReturnableQuantity();
    }, [createForm.type, createForm.itemId, createForm.warehouseId]);

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
                    damage: 0,
                    returns: 0,
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
                damage: 0,
                returns: 0,
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

        await withProgress(async () => {
            try {
                const token = localStorage.getItem('accessToken');

                // For ADJUSTMENT, toBin should be the same as fromBin
                const adjustedToBin =
                    createForm.type === 'ADJUSTMENT' && createForm.fromBin
                        ? createForm.fromBin
                        : createForm.toBin;

                // For ADJUSTMENT, calculate the absolute quantity from relative input
                let finalQuantity = parseInt(createForm.quantity);
                if (createForm.type === 'ADJUSTMENT' && binCapacityInfo) {
                    const inputValue = createForm.quantity;
                    console.log('[ADJUSTMENT FRONTEND] Input received:', {
                        inputValue,
                        currentQty: binCapacityInfo.currentQty,
                        isRelative:
                            inputValue.startsWith('+') ||
                            inputValue.startsWith('-'),
                    });

                    if (
                        inputValue.startsWith('+') ||
                        inputValue.startsWith('-')
                    ) {
                        // Relative adjustment - convert to absolute
                        const adjustment = parseInt(inputValue);
                        finalQuantity = binCapacityInfo.currentQty + adjustment;
                        console.log(
                            '[ADJUSTMENT FRONTEND] Converting relative to absolute:',
                            {
                                input: inputValue,
                                currentQty: binCapacityInfo.currentQty,
                                adjustment,
                                finalQuantity,
                            }
                        );
                    } else {
                        // Absolute value
                        finalQuantity = parseInt(inputValue);
                        console.log(
                            '[ADJUSTMENT FRONTEND] Using absolute value:',
                            {
                                input: inputValue,
                                finalQuantity,
                            }
                        );
                    }
                }

                const requestBody = {
                    itemId: createForm.itemId,
                    type: createForm.type,
                    quantity: finalQuantity,
                    warehouseId: createForm.warehouseId,
                    fromBin: createForm.fromBin || undefined,
                    toBin: adjustedToBin || undefined,
                    notes: createForm.notes || undefined,
                };

                console.log(
                    '[DEBUG] Creating movement with data:',
                    requestBody
                );

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
        });
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

    // Pagination calculations
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMovements = movements.slice(startIndex, endIndex);
    const totalPages = Math.ceil(movements.length / itemsPerPage);

    if (loading) {
        return (
            <PageSkeleton
                hasFilters={true}
                filterCount={6}
                tableRows={15}
                tableColumns={10}
            />
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
                <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white animate-fadeIn'>
                    <div className='flex justify-between items-center'>
                        <div>
                            <div className='flex items-center gap-3 mb-2'>
                                <MovementIcon className='w-8 h-8' />
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
                            <PlusIcon className='w-5 h-5' />
                            Create Movement
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slideUp'>
                        {/* Total Movements - Spans 2 rows */}
                        <div className='bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-2xl shadow-xl border-2 border-primary-500 hover:shadow-2xl transition-all lg:row-span-2'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='flex items-center gap-2 mb-3'>
                                        <div className='w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center'>
                                            <ClipboardIcon className='w-7 h-7 text-white' />
                                        </div>
                                        <div className='text-sm font-bold text-primary-100 uppercase tracking-wider'>
                                            Total Movements
                                        </div>
                                    </div>
                                    <div className='text-6xl font-bold text-white mt-4 mb-3'>
                                        {stats?.totalMovements || 0}
                                    </div>
                                    <div className='text-sm text-primary-100 mb-4'>
                                        All transaction types across warehouses
                                    </div>
                                    <div className='space-y-2 pt-4 border-t border-white/20'>
                                        <div className='flex justify-between items-center text-xs'>
                                            <span className='text-primary-100 font-medium'>
                                                Total In:
                                            </span>
                                            <span className='text-white font-bold'>
                                                +
                                                {(
                                                    stats?.totalQuantityIn || 0
                                                ).toLocaleString()}{' '}
                                                units
                                            </span>
                                        </div>
                                        <div className='flex justify-between items-center text-xs'>
                                            <span className='text-primary-100 font-medium'>
                                                Total Out:
                                            </span>
                                            <span className='text-white font-bold'>
                                                -
                                                {(
                                                    stats?.totalQuantityOut || 0
                                                ).toLocaleString()}{' '}
                                                units
                                            </span>
                                        </div>
                                        <div className='flex justify-between items-center text-xs pt-2 border-t border-white/20'>
                                            <span className='text-primary-100 font-medium'>
                                                Net Change:
                                            </span>
                                            <span className='text-white font-bold'>
                                                {(stats?.totalQuantityIn || 0) -
                                                    (stats?.totalQuantityOut ||
                                                        0) >=
                                                0
                                                    ? '+'
                                                    : ''}
                                                {(
                                                    (stats?.totalQuantityIn ||
                                                        0) -
                                                    (stats?.totalQuantityOut ||
                                                        0)
                                                ).toLocaleString()}{' '}
                                                units
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inbound */}
                        <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:border-green-300'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='text-xs font-bold text-slate-600 uppercase tracking-wide'>
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
                                <div className='flex justify-end mt-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow'>
                                        <InboundIcon className='w-5 h-5 text-white' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Outbound */}
                        <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:border-red-300'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='text-xs font-bold text-slate-600 uppercase tracking-wide'>
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
                                <div className='flex justify-end mt-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow'>
                                        <OutboundIcon className='w-5 h-5 text-white' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transfer */}
                        <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:border-blue-300'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='text-xs font-bold text-slate-600 uppercase tracking-wide'>
                                        Transfer
                                    </div>
                                    <div className='text-3xl font-bold text-blue-600 mt-2'>
                                        {stats?.transfers || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        Bin movements
                                    </div>
                                </div>
                                <div className='flex justify-end mt-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow'>
                                        <TransferIcon className='w-5 h-5 text-white' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Adjustment */}
                        <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:border-amber-300'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='text-xs font-bold text-slate-600 uppercase tracking-wide'>
                                        Adjustment
                                    </div>
                                    <div className='text-3xl font-bold text-amber-600 mt-2'>
                                        {stats?.adjustments || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        Stock corrections
                                    </div>
                                </div>
                                <div className='flex justify-end mt-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center shadow'>
                                        <AdjustmentIcon className='w-5 h-5 text-white' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Damage */}
                        <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:border-orange-300'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='text-xs font-bold text-slate-600 uppercase tracking-wide'>
                                        Damage
                                    </div>
                                    <div className='text-3xl font-bold text-orange-600 mt-2'>
                                        {stats?.damage || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        Damaged items
                                    </div>
                                </div>
                                <div className='flex justify-end mt-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center shadow'>
                                        <DamageIcon className='w-5 h-5 text-white' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Return */}
                        <div className='bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:border-purple-300'>
                            <div className='flex flex-col h-full justify-between'>
                                <div>
                                    <div className='text-xs font-bold text-slate-600 uppercase tracking-wide'>
                                        Return
                                    </div>
                                    <div className='text-3xl font-bold text-purple-600 mt-2'>
                                        {stats?.returns || 0}
                                    </div>
                                    <div className='text-xs text-slate-500 mt-1 font-medium'>
                                        Returned items
                                    </div>
                                </div>
                                <div className='flex justify-end mt-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow'>
                                        <ReturnIcon className='w-5 h-5 text-white' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
                    <div className='flex items-center gap-3 mb-4'>
                        <FilterIcon className='w-5 h-5 text-primary-600' />
                        <span className='font-semibold text-slate-900'>
                            Filters:
                        </span>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-6 gap-4 animate-slideUp'>
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
                                {paginatedMovements.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className='px-6 py-16 text-center'
                                        >
                                            <div className='flex flex-col items-center justify-center'>
                                                <BoxEmptyIcon className='w-16 h-16 text-slate-300 mb-4' />
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
                                    paginatedMovements.map((movement) => (
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
                                                                : movement.quantity <
                                                                  0
                                                                ? 'text-red-600'
                                                                : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {movement.quantity > 0
                                                            ? `+${movement.quantity}`
                                                            : movement.quantity}
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
                                                                    <CheckIcon className='w-3.5 h-3.5' />
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
                                                                    <XIcon className='w-3.5 h-3.5' />
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className='inline-flex items-center gap-1.5 text-yellow-700 text-xs font-semibold bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200'>
                                                                <ClockFilledIcon className='w-3.5 h-3.5 animate-pulse' />
                                                                Awaiting
                                                            </span>
                                                        )
                                                    ) : movement.status ===
                                                      'COMPLETED' ? (
                                                        <span className='inline-flex items-center gap-1.5 text-green-700 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200'>
                                                            <CheckCircleFilledIcon className='w-3.5 h-3.5' />
                                                            Done
                                                        </span>
                                                    ) : movement.status ===
                                                      'CANCELLED' ? (
                                                        <span className='inline-flex items-center gap-1.5 text-red-700 text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200'>
                                                            <XCircleFilledIcon className='w-3.5 h-3.5' />
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

                    {/* Pagination */}
                    {movements.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(
                                movements.length / itemsPerPage
                            )}
                            totalItems={movements.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    )}
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
                                        <MovementIcon className='w-7 h-7' />
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
                                    <XIcon className='w-6 h-6' />
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
                                            <TagIcon className='w-4 h-4 text-primary-600' />
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
                                            <BoxIcon className='w-4 h-4 text-primary-600' />
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
                                            <WarehouseIcon className='w-4 h-4 text-primary-600' />
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

                                    {/* From Bin (for OUTBOUND, TRANSFER, DAMAGE, ADJUSTMENT) */}
                                    {[
                                        'OUTBOUND',
                                        'TRANSFER',
                                        'DAMAGE',
                                        'ADJUSTMENT',
                                    ].includes(createForm.type) && (
                                        <div>
                                            <label className='flex items-center gap-2 text-sm font-bold text-slate-800 mb-3'>
                                                <LocationPinIcon className='w-4 h-4 text-primary-600' />
                                                {createForm.type ===
                                                'ADJUSTMENT'
                                                    ? 'Bin to Adjust'
                                                    : 'From Bin'}{' '}
                                                {createForm.type === 'TRANSFER'
                                                    ? '*'
                                                    : createForm.type ===
                                                      'ADJUSTMENT'
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
                                                <LocationPinIcon className='w-4 h-4 text-primary-600' />
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
                                                    (createForm.type ===
                                                    'TRANSFER'
                                                        ? toBins.length === 0
                                                        : bins.length === 0)
                                                }
                                                className='w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed'
                                            >
                                                <option value=''>
                                                    {!createForm.warehouseId
                                                        ? 'Select warehouse first...'
                                                        : (
                                                              createForm.type ===
                                                              'TRANSFER'
                                                                  ? toBins.length ===
                                                                    0
                                                                  : bins.length ===
                                                                    0
                                                          )
                                                        ? 'No bins available...'
                                                        : 'Select destination bin...'}
                                                </option>
                                                {(createForm.type === 'TRANSFER'
                                                    ? toBins
                                                    : bins
                                                ).map((bin) => (
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
                                            <HashIcon className='w-4 h-4 text-primary-600' />
                                            Quantity *
                                            {createForm.type ===
                                                'ADJUSTMENT' && (
                                                <span className='ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                                                    💡 Enter new total quantity
                                                    (absolute value)
                                                </span>
                                            )}
                                            {availableStock !== null &&
                                                createForm.type !==
                                                    'ADJUSTMENT' && (
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
                                            type={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? 'text'
                                                    : 'number'
                                            }
                                            value={createForm.quantity}
                                            onWheel={(e) =>
                                                (
                                                    e.target as HTMLInputElement
                                                ).blur()
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                // Special handling for ADJUSTMENT - support relative values like +2, -2
                                                if (
                                                    createForm.type ===
                                                    'ADJUSTMENT'
                                                ) {
                                                    // Allow empty, numbers, and +/- prefix
                                                    if (
                                                        value !== '' &&
                                                        !/^[+-]?\d*$/.test(
                                                            value
                                                        )
                                                    ) {
                                                        return; // Block invalid input
                                                    }

                                                    // Calculate the resulting quantity
                                                    if (
                                                        value !== '' &&
                                                        binCapacityInfo
                                                    ) {
                                                        const currentQty =
                                                            binCapacityInfo.currentQty;
                                                        let resultingQty: number;

                                                        if (
                                                            value.startsWith(
                                                                '+'
                                                            ) ||
                                                            value.startsWith(
                                                                '-'
                                                            )
                                                        ) {
                                                            // Relative adjustment
                                                            const adjustment =
                                                                parseInt(value);
                                                            if (
                                                                !isNaN(
                                                                    adjustment
                                                                )
                                                            ) {
                                                                resultingQty =
                                                                    currentQty +
                                                                    adjustment;
                                                            } else {
                                                                // Allow partial input like "+" or "-"
                                                                setCreateForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        quantity:
                                                                            value,
                                                                    })
                                                                );
                                                                return;
                                                            }
                                                        } else {
                                                            // Absolute value
                                                            resultingQty =
                                                                parseInt(value);
                                                        }

                                                        // Validate resulting quantity
                                                        if (
                                                            !isNaN(resultingQty)
                                                        ) {
                                                            if (
                                                                resultingQty <
                                                                    0 ||
                                                                resultingQty >
                                                                    binCapacityInfo.maxCapacity
                                                            ) {
                                                                return; // Block if out of range
                                                            }
                                                        }
                                                    }

                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        quantity: value,
                                                    }));
                                                    return;
                                                }

                                                const numValue =
                                                    parseInt(value);

                                                // RETURN quantity validation - cannot exceed max returnable
                                                if (
                                                    createForm.type ===
                                                        'RETURN' &&
                                                    maxReturnable !== null &&
                                                    numValue > maxReturnable
                                                ) {
                                                    return; // Block input if exceeds max returnable
                                                }

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
                                                // For ADJUSTMENT, allow +/- keys
                                                if (
                                                    createForm.type ===
                                                    'ADJUSTMENT'
                                                ) {
                                                    // Only prevent e, E, and dot
                                                    if (
                                                        [
                                                            'e',
                                                            'E',
                                                            '.',
                                                        ].includes(e.key)
                                                    ) {
                                                        e.preventDefault();
                                                    }
                                                } else {
                                                    // For other types, prevent e, E, +, -, and dot
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
                                                }
                                            }}
                                            onPaste={(e) => {
                                                // For ADJUSTMENT, allow +/- in paste
                                                if (
                                                    createForm.type ===
                                                    'ADJUSTMENT'
                                                ) {
                                                    const pastedText =
                                                        e.clipboardData.getData(
                                                            'text'
                                                        );
                                                    if (
                                                        !/^[+-]?\d*$/.test(
                                                            pastedText
                                                        )
                                                    ) {
                                                        e.preventDefault();
                                                    }
                                                } else {
                                                    // Prevent pasting non-numeric or scientific notation
                                                    const pastedText =
                                                        e.clipboardData.getData(
                                                            'text'
                                                        );
                                                    if (
                                                        !/^\d+$/.test(
                                                            pastedText
                                                        )
                                                    ) {
                                                        e.preventDefault();
                                                    }
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
                                            min={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? undefined
                                                    : '1'
                                            }
                                            max={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? undefined
                                                    : availableStock !== null &&
                                                      [
                                                          'OUTBOUND',
                                                          'TRANSFER',
                                                          'DAMAGE',
                                                      ].includes(
                                                          createForm.type
                                                      )
                                                    ? availableStock
                                                    : undefined
                                            }
                                            step={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? undefined
                                                    : '1'
                                            }
                                            pattern={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? '[+-]?[0-9]+'
                                                    : '[0-9]*'
                                            }
                                            inputMode={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? 'text'
                                                    : 'numeric'
                                            }
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
                                            placeholder={
                                                createForm.type === 'ADJUSTMENT'
                                                    ? 'Enter quantity (+5, -3, or 50)'
                                                    : 'Enter quantity'
                                            }
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
                                        {createForm.type === 'ADJUSTMENT' &&
                                            binCapacityInfo && (
                                                <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                                    <div className='space-y-1'>
                                                        <p className='text-xs text-blue-900 font-semibold'>
                                                            📊 Stok Saat Ini:{' '}
                                                            {
                                                                binCapacityInfo.currentQty
                                                            }{' '}
                                                            unit
                                                        </p>
                                                        <p className='text-xs text-blue-800'>
                                                            📦 Kapasitas
                                                            Maksimum:{' '}
                                                            {
                                                                binCapacityInfo.maxCapacity
                                                            }{' '}
                                                            unit
                                                        </p>
                                                        <div className='mt-2 pt-2 border-t border-blue-200'>
                                                            <p className='text-xs text-blue-900 font-medium mb-1'>
                                                                💡 Cara Input:
                                                            </p>
                                                            <p className='text-xs text-blue-700'>
                                                                • Absolut:{' '}
                                                                <span className='font-mono bg-blue-100 px-1 rounded'>
                                                                    50
                                                                </span>{' '}
                                                                (set menjadi 50
                                                                unit)
                                                            </p>
                                                            <p className='text-xs text-blue-700'>
                                                                • Tambah:{' '}
                                                                <span className='font-mono bg-blue-100 px-1 rounded'>
                                                                    +5
                                                                </span>{' '}
                                                                (tambah 5 unit)
                                                            </p>
                                                            <p className='text-xs text-blue-700'>
                                                                • Kurang:{' '}
                                                                <span className='font-mono bg-blue-100 px-1 rounded'>
                                                                    -3
                                                                </span>{' '}
                                                                (kurangi 3 unit)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        {createForm.type === 'ADJUSTMENT' &&
                                            binCapacityInfo &&
                                            createForm.quantity &&
                                            (() => {
                                                const currentQty =
                                                    binCapacityInfo.currentQty;
                                                const maxCapacity =
                                                    binCapacityInfo.maxCapacity;
                                                const inputValue =
                                                    createForm.quantity;
                                                let resultingQty:
                                                    | number
                                                    | null = null;
                                                let isRelative = false;

                                                if (
                                                    inputValue.startsWith(
                                                        '+'
                                                    ) ||
                                                    inputValue.startsWith('-')
                                                ) {
                                                    const adjustment =
                                                        parseInt(inputValue);
                                                    if (!isNaN(adjustment)) {
                                                        resultingQty =
                                                            currentQty +
                                                            adjustment;
                                                        isRelative = true;
                                                    }
                                                } else {
                                                    const absValue =
                                                        parseInt(inputValue);
                                                    if (!isNaN(absValue)) {
                                                        resultingQty = absValue;
                                                    }
                                                }

                                                if (resultingQty !== null) {
                                                    const isValid =
                                                        resultingQty >= 0 &&
                                                        resultingQty <=
                                                            maxCapacity;
                                                    const difference =
                                                        resultingQty -
                                                        currentQty;

                                                    return (
                                                        <div
                                                            className={`mt-2 p-3 rounded-lg border ${
                                                                isValid
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : 'bg-red-50 border-red-200'
                                                            }`}
                                                        >
                                                            <p
                                                                className={`text-xs font-semibold ${
                                                                    isValid
                                                                        ? 'text-green-900'
                                                                        : 'text-red-900'
                                                                }`}
                                                            >
                                                                {isValid
                                                                    ? '✅'
                                                                    : '❌'}{' '}
                                                                Hasil:{' '}
                                                                {resultingQty}{' '}
                                                                unit
                                                            </p>
                                                            <p
                                                                className={`text-xs ${
                                                                    isValid
                                                                        ? 'text-green-800'
                                                                        : 'text-red-800'
                                                                }`}
                                                            >
                                                                {difference > 0
                                                                    ? '+'
                                                                    : ''}
                                                                {difference}{' '}
                                                                dari stok saat
                                                                ini (
                                                                {currentQty})
                                                            </p>
                                                            {!isValid && (
                                                                <p className='text-xs text-red-800 mt-1 font-medium'>
                                                                    {resultingQty <
                                                                    0
                                                                        ? '⚠️ Stok tidak boleh kurang dari 0'
                                                                        : `⚠️ Melebihi kapasitas maksimum (${maxCapacity})`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        {createForm.type === 'RETURN' &&
                                            returnInfo &&
                                            maxReturnable !== null && (
                                                <div className='mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg'>
                                                    <div className='space-y-1'>
                                                        <p className='text-xs text-purple-900 font-semibold'>
                                                            📤 Total OUTBOUND:{' '}
                                                            {
                                                                returnInfo.totalOutbound
                                                            }{' '}
                                                            unit
                                                        </p>
                                                        <p className='text-xs text-purple-800'>
                                                            ↩️ Sudah di-RETURN:{' '}
                                                            {
                                                                returnInfo.totalReturned
                                                            }{' '}
                                                            unit
                                                        </p>
                                                        <p className='text-xs text-purple-900 font-bold mt-2 pt-2 border-t border-purple-200'>
                                                            ✅ Maksimum bisa
                                                            di-RETURN:{' '}
                                                            {maxReturnable} unit
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        {createForm.type === 'RETURN' &&
                                            maxReturnable !== null &&
                                            parseInt(createForm.quantity) >
                                                maxReturnable && (
                                                <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
                                                    <p className='text-xs text-red-800 font-medium'>
                                                        ❌ Quantity RETURN
                                                        melebihi maksimum yang
                                                        bisa dikembalikan!
                                                        <br />
                                                        Maksimum:{' '}
                                                        {maxReturnable} unit
                                                    </p>
                                                </div>
                                            )}
                                        {createForm.type === 'RETURN' &&
                                            maxReturnable === 0 && (
                                                <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                                                    <p className='text-xs text-yellow-800 font-medium'>
                                                        ⚠️ Tidak ada barang yang
                                                        bisa di-RETURN untuk
                                                        item ini.
                                                        <br />
                                                        Semua OUTBOUND sudah
                                                        di-RETURN atau belum ada
                                                        OUTBOUND.
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
                                            <DocumentIcon className='w-4 h-4 text-primary-600' />
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
                                                    <SpinnerIcon className='animate-spin h-5 w-5' />
                                                    Creating Movement...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckIcon className='w-5 h-5' />
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
