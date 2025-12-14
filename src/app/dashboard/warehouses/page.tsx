'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    WarehouseIcon,
    PlusIcon,
    CheckCircleFilledIcon,
    UserIcon,
    BoxIcon,
    ClipboardIcon,
    LocationPinIcon,
    XIcon,
    EditIcon,
    TrashIcon,
    CubeIcon,
    MapIcon,
    ErrorIcon,
    CheckIcon,
    AlertInfoIcon,
    XCircleFilledIcon,
    SpinnerIcon,
} from '@/components/icons';

interface Warehouse {
    id: string;
    code: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    managerId?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    manager?: {
        id: string;
        username: string;
        fullName: string;
        email: string;
    };
    bins?: Array<{
        id: string;
        code: string;
        name: string;
    }>;
}

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    warehouseId?: string;
}

export default function WarehousesPage() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
        null
    );
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Indonesia',
        managerId: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

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

        fetchWarehouses();
        fetchSupervisors();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            if (!token) {
                alert('No authentication token found. Please login again.');
                router.push('/login');
                return;
            }

            const response = await fetch('/api/warehouses', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch warehouses');
            }

            if (data.warehouses) {
                setWarehouses(data.warehouses);
            } else {
                console.warn('No warehouses field in response:', data);
                setWarehouses([]);
            }
        } catch (error: any) {
            console.error('Error fetching warehouses:', error);
            alert(error.message || 'Failed to fetch warehouses');
        } finally {
            setLoading(false);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                '/api/users?role=SUPERVISOR&limit=100',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch supervisors');

            const data = await response.json();
            console.log('Supervisors data:', data); // Debug log
            setSupervisors(data.users || []);
        } catch (error) {
            console.error('Error fetching supervisors:', error);
            setSupervisors([]); // Set empty array on error
        }
    };

    const handleOpenModal = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Indonesia',
            managerId: '',
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            code: '',
            name: '',
            description: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Indonesia',
            managerId: '',
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.code.trim()) errors.code = 'Warehouse code is required';
        if (!formData.name.trim()) errors.name = 'Warehouse name is required';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.state.trim()) errors.state = 'State is required';
        if (!formData.zipCode.trim()) errors.zipCode = 'Zip code is required';
        if (!formData.country.trim()) errors.country = 'Country is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/warehouses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create warehouse');
            }

            await fetchWarehouses();
            handleCloseModal();
            alert('Warehouse created successfully!');
        } catch (error: any) {
            console.error('Error creating warehouse:', error);
            alert(error.message || 'Failed to create warehouse');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (warehouse: Warehouse) => {
        console.log('Opening edit modal for warehouse:', warehouse);
        console.log('Available supervisors:', supervisors);
        setEditingWarehouse(warehouse);
        setFormData({
            code: warehouse.code,
            name: warehouse.name,
            description: warehouse.description || '',
            address: warehouse.address,
            city: warehouse.city,
            state: warehouse.state,
            zipCode: warehouse.zipCode,
            country: warehouse.country,
            managerId: warehouse.managerId || '',
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingWarehouse(null);
        setFormData({
            code: '',
            name: '',
            description: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Indonesia',
            managerId: '',
        });
        setFormErrors({});
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !editingWarehouse) return;

        try {
            setSubmitting(true);
            setFormErrors({}); // Clear previous errors
            const token = localStorage.getItem('accessToken');

            const response = await fetch(
                `/api/warehouses/${editingWarehouse.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // Handle validation/business logic errors gracefully
                if (response.status === 409) {
                    // Conflict - manager already assigned or code exists
                    setFormErrors({
                        managerId:
                            data.error ||
                            'This manager is already assigned to another warehouse',
                    });
                } else {
                    // Other errors
                    setFormErrors({
                        general: data.error || 'Failed to update warehouse',
                    });
                }
                return; // Don't throw, just return
            }

            await fetchWarehouses();
            handleCloseEditModal();
            alert('Warehouse updated successfully!');
        } catch (error: any) {
            // Only for unexpected errors (network failure, etc)
            console.error('Error updating warehouse:', error);
            setFormErrors({
                general:
                    'Network error. Please check your connection and try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (warehouse: Warehouse) => {
        // Confirm delete
        const confirmMessage = `Are you sure you want to delete warehouse "${warehouse.name}"?\n\nThis will set the warehouse status to inactive. The warehouse data will be preserved but marked as inactive.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`/api/warehouses/${warehouse.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    alert(
                        'Permission denied. Only administrators can delete warehouses.'
                    );
                } else if (response.status === 400) {
                    alert(
                        data.error ||
                            'Cannot delete warehouse with existing bins.'
                    );
                } else {
                    alert(data.error || 'Failed to delete warehouse');
                }
                return;
            }

            alert(
                `Warehouse "${warehouse.name}" has been deactivated successfully.`
            );
            await fetchWarehouses();
        } catch (error: any) {
            console.error('Error deleting warehouse:', error);
            alert('Network error. Please check your connection and try again.');
        }
    };

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white animate-fadeIn'>
                <div className='flex justify-between items-center'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <WarehouseIcon className='w-8 h-8' />
                            <h1 className='text-3xl font-bold'>
                                Warehouses Management
                            </h1>
                        </div>
                        <p className='text-primary-100 ml-11'>
                            Manage warehouse locations and facilities
                        </p>
                    </div>
                    {userRole === 'ADMIN' && (
                        <button
                            onClick={handleOpenModal}
                            className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition font-bold shadow-xl'
                        >
                            <PlusIcon className='w-5 h-5' />
                            Add New Warehouse
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 animate-slideUp'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Total Warehouses
                            </div>
                            <div className='text-3xl font-bold text-slate-900 mt-2'>
                                {warehouses.length}
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <WarehouseIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Active
                            </div>
                            <div className='text-3xl font-bold text-emerald-600 mt-2'>
                                {warehouses.filter((w) => w.active).length}
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <CheckCircleFilledIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                With Manager
                            </div>
                            <div className='text-3xl font-bold text-blue-600 mt-2'>
                                {warehouses.filter((w) => w.managerId).length}
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <UserIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Total Bins
                            </div>
                            <div className='text-3xl font-bold text-amber-600 mt-2'>
                                {warehouses.reduce(
                                    (sum, w) => sum + (w.bins?.length || 0),
                                    0
                                )}
                            </div>
                        </div>
                        <div className='w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center shadow-lg'>
                            <CubeIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouses Table */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
                <div className='px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white'>
                    <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                        <ClipboardIcon className='w-5 h-5 text-primary-600' />
                        All Warehouses
                    </h3>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-primary-200'>
                            <tr>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Code
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Name
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Location
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Manager
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Bins
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Status
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-slate-100'>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='px-6 py-12 text-center'
                                    >
                                        <div className='flex flex-col items-center justify-center'>
                                            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
                                            <p className='mt-4 text-slate-600 font-medium'>
                                                Loading warehouses...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : warehouses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='px-6 py-12 text-center'
                                    >
                                        <div className='flex flex-col items-center justify-center'>
                                            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
                                                <WarehouseIcon className='w-8 h-8 text-slate-400' />
                                            </div>
                                            <p className='text-slate-600 font-medium mb-2'>
                                                No warehouses found
                                            </p>
                                            <p className='text-sm text-slate-500'>
                                                Create your first warehouse to
                                                get started
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((warehouse) => (
                                    <tr
                                        key={warehouse.id}
                                        className='hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200'
                                    >
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center'>
                                                    <span className='text-primary-700 font-bold text-sm'>
                                                        {warehouse.code
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className='text-sm font-bold text-slate-900'>
                                                    {warehouse.code}
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='text-sm font-semibold text-slate-900'>
                                                {warehouse.name}
                                            </div>
                                            {warehouse.description && (
                                                <div className='text-xs text-slate-500 mt-1 line-clamp-1'>
                                                    {warehouse.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-start gap-2'>
                                                <LocationPinIcon className='w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0' />
                                                <div>
                                                    <div className='text-sm text-slate-900 font-medium'>
                                                        {warehouse.city},{' '}
                                                        {warehouse.state}
                                                    </div>
                                                    <div className='text-xs text-slate-500'>
                                                        {warehouse.country}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            {warehouse.manager ? (
                                                <div className='flex items-center gap-2'>
                                                    <div className='w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center'>
                                                        <span className='text-blue-700 font-bold text-xs'>
                                                            {warehouse.manager.fullName
                                                                .split(' ')
                                                                .map((n) =>
                                                                    n[0]?.toUpperCase()
                                                                )
                                                                .join('')
                                                                .substring(
                                                                    0,
                                                                    2
                                                                )}
                                                        </span>
                                                    </div>
                                                    <div className='text-sm'>
                                                        <div className='font-semibold text-slate-900'>
                                                            {
                                                                warehouse
                                                                    .manager
                                                                    .fullName
                                                            }
                                                        </div>
                                                        <div className='text-xs text-slate-500'>
                                                            {
                                                                warehouse
                                                                    .manager
                                                                    .email
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className='inline-flex items-center gap-1 text-sm text-slate-400'>
                                                    <XIcon className='w-4 h-4' />
                                                    No manager
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center'>
                                                    <CubeIcon className='w-4 h-4 text-amber-700' />
                                                </div>
                                                <span className='text-sm font-semibold text-slate-900'>
                                                    {warehouse.bins?.length ||
                                                        0}{' '}
                                                    bins
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full ${
                                                    warehouse.active
                                                        ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300'
                                                        : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                                                }`}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        warehouse.active
                                                            ? 'bg-emerald-600 animate-pulse'
                                                            : 'bg-red-600'
                                                    }`}
                                                ></span>
                                                {warehouse.active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/dashboard/warehouses/${warehouse.id}/bins`
                                                        )
                                                    }
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-300 rounded-lg transition-all font-medium'
                                                >
                                                    <CubeIcon className='w-4 h-4' />
                                                    Bins
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/dashboard/warehouses/${warehouse.id}/layout`
                                                        )
                                                    }
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-purple-700 hover:text-white hover:bg-purple-600 border border-purple-300 rounded-lg transition-all font-medium'
                                                >
                                                    <MapIcon className='w-4 h-4' />
                                                    Layout
                                                </button>
                                                {/* Edit button - ADMIN can edit all, SUPERVISOR can edit assigned warehouse */}
                                                {(userRole === 'ADMIN' ||
                                                    (userRole ===
                                                        'SUPERVISOR' &&
                                                        currentUser?.warehouseId ===
                                                            warehouse.id)) && (
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(
                                                                warehouse
                                                            )
                                                        }
                                                        className='inline-flex items-center gap-1 px-3 py-1.5 text-primary-700 hover:text-white hover:bg-primary-600 border border-primary-300 rounded-lg transition-all font-medium'
                                                    >
                                                        <EditIcon className='w-4 h-4' />
                                                        Edit
                                                    </button>
                                                )}
                                                {/* Delete button - ADMIN only */}
                                                {warehouse.active &&
                                                    userRole === 'ADMIN' && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    warehouse
                                                                )
                                                            }
                                                            className='inline-flex items-center gap-1 px-3 py-1.5 text-red-700 hover:text-white hover:bg-red-600 border border-red-300 rounded-lg transition-all font-medium'
                                                            title='Deactivate warehouse'
                                                        >
                                                            <TrashIcon className='w-4 h-4' />
                                                            Delete
                                                        </button>
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

            {/* Create Warehouse Modal */}
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
                    <div className='bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-slideUp'>
                        {/* Modal Header - Sticky */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                                        <WarehouseIcon className='w-6 h-6 text-white' />
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Create New Warehouse
                                        </h2>
                                        <p className='text-primary-100 text-sm mt-0.5'>
                                            Add a new warehouse location to the
                                            system
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className='text-white hover:text-white hover:bg-white/30 bg-white/10 rounded-xl p-2 transition-all duration-200 border border-white/20 hover:border-white/40 shadow-lg'
                                    title='Close'
                                >
                                    <XIcon className='w-6 h-6' />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form onSubmit={handleSubmit} className='p-8'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp'>
                                    {/* Warehouse Code */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Warehouse Code{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='e.g., WH-001'
                                        />
                                        {formErrors.code && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.code}
                                            </p>
                                        )}
                                    </div>

                                    {/* Warehouse Name */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Warehouse Name{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
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
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Main Warehouse'
                                        />
                                        {formErrors.name && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
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
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none'
                                            placeholder='Optional warehouse description'
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Street Address{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.address}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    address: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Street address'
                                        />
                                        {formErrors.address && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            City{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    city: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Jakarta'
                                        />
                                        {formErrors.city && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.city}
                                            </p>
                                        )}
                                    </div>

                                    {/* State */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            State/Province{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    state: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='DKI Jakarta'
                                        />
                                        {formErrors.state && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.state}
                                            </p>
                                        )}
                                    </div>

                                    {/* Zip Code */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Zip Code{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.zipCode}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    zipCode: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='12345'
                                        />
                                        {formErrors.zipCode && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.zipCode}
                                            </p>
                                        )}
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Country{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.country}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    country: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Indonesia'
                                        />
                                        {formErrors.country && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.country}
                                            </p>
                                        )}
                                    </div>

                                    {/* Manager */}
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Warehouse Manager (Optional)
                                        </label>
                                        <select
                                            value={formData.managerId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    managerId: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white'
                                        >
                                            <option value=''>
                                                No manager assigned
                                            </option>
                                            {supervisors.length > 0 ? (
                                                supervisors.map(
                                                    (supervisor) => (
                                                        <option
                                                            key={supervisor.id}
                                                            value={
                                                                supervisor.id
                                                            }
                                                        >
                                                            {
                                                                supervisor.fullName
                                                            }{' '}
                                                            ({supervisor.email})
                                                        </option>
                                                    )
                                                )
                                            ) : (
                                                <option disabled>
                                                    No supervisors available
                                                </option>
                                            )}
                                        </select>
                                        {supervisors.length === 0 && (
                                            <p className='text-amber-600 text-sm mt-1.5 flex items-center gap-1'>
                                                <AlertInfoIcon className='w-4 h-4' />
                                                No supervisors found. Please
                                                create supervisor users first.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className='flex justify-end gap-3 mt-8 pt-6 border-t-2 border-slate-100'>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold'
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <SpinnerIcon className='h-5 w-5' />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon className='w-5 h-5' />
                                                Create Warehouse
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Warehouse Modal */}
            {showEditModal && editingWarehouse && (
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
                    <div className='bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-slideUp'>
                        {/* Modal Header - Sticky */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                                        <EditIcon className='w-6 h-6 text-white' />
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Edit Warehouse
                                        </h2>
                                        <p className='text-primary-100 text-sm mt-0.5'>
                                            Update warehouse information
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseEditModal}
                                    className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white'
                                    disabled={submitting}
                                >
                                    <XIcon className='w-5 h-5' />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='flex-1 overflow-y-auto px-8 py-6'>
                            <form onSubmit={handleUpdate}>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp'>
                                    {/* Code */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Warehouse Code{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='WH-001'
                                        />
                                        {formErrors.code && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.code}
                                            </p>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Warehouse Name{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
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
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Main Warehouse'
                                        />
                                        {formErrors.name && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Description (Optional)
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
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none'
                                            placeholder='Warehouse description...'
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Address{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    address: e.target.value,
                                                })
                                            }
                                            rows={2}
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none'
                                            placeholder='Street address'
                                        />
                                        {formErrors.address && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            City{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    city: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Jakarta'
                                        />
                                        {formErrors.city && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.city}
                                            </p>
                                        )}
                                    </div>

                                    {/* State */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            State/Province{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    state: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='DKI Jakarta'
                                        />
                                        {formErrors.state && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.state}
                                            </p>
                                        )}
                                    </div>

                                    {/* Zip Code */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Zip Code{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.zipCode}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    zipCode: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='12345'
                                        />
                                        {formErrors.zipCode && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.zipCode}
                                            </p>
                                        )}
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Country{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            value={formData.country}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    country: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'
                                            placeholder='Indonesia'
                                        />
                                        {formErrors.country && (
                                            <p className='text-red-500 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.country}
                                            </p>
                                        )}
                                    </div>

                                    {/* Manager */}
                                    <div className='md:col-span-2'>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Warehouse Manager (Optional)
                                        </label>
                                        <select
                                            value={formData.managerId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    managerId: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white'
                                        >
                                            <option value=''>
                                                No manager assigned
                                            </option>
                                            {supervisors.length > 0 ? (
                                                supervisors.map(
                                                    (supervisor) => (
                                                        <option
                                                            key={supervisor.id}
                                                            value={
                                                                supervisor.id
                                                            }
                                                        >
                                                            {
                                                                supervisor.fullName
                                                            }{' '}
                                                            ({supervisor.email})
                                                        </option>
                                                    )
                                                )
                                            ) : (
                                                <option disabled>
                                                    No supervisors available
                                                </option>
                                            )}
                                        </select>
                                        {supervisors.length === 0 && (
                                            <p className='text-amber-600 text-sm mt-1.5 flex items-center gap-1'>
                                                <AlertInfoIcon className='w-4 h-4' />
                                                No supervisors found. Please
                                                create supervisor users first.
                                            </p>
                                        )}
                                        {formErrors.managerId && (
                                            <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
                                                <ErrorIcon className='w-4 h-4' />
                                                {formErrors.managerId}
                                            </p>
                                        )}
                                    </div>

                                    {/* General Error Message */}
                                    {formErrors.general && (
                                        <div className='md:col-span-2'>
                                            <div className='bg-red-50 border-2 border-red-200 rounded-xl p-4'>
                                                <div className='flex items-start gap-3'>
                                                    <XCircleFilledIcon className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                                                    <div>
                                                        <h4 className='font-semibold text-red-900'>
                                                            Error
                                                        </h4>
                                                        <p className='text-sm text-red-700 mt-1'>
                                                            {formErrors.general}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className='flex justify-end gap-3 mt-8 pt-6 border-t-2 border-slate-100'>
                                    <button
                                        type='button'
                                        onClick={handleCloseEditModal}
                                        className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold'
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <SpinnerIcon className='h-5 w-5' />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className='w-5 h-5' />
                                                Update Warehouse
                                            </>
                                        )}
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
