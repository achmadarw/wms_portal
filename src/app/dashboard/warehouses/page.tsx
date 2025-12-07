'use client';

import { useState, useEffect } from 'react';

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
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
        null
    );

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
        fetchWarehouses();
        fetchSupervisors();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/warehouses', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const data = await response.json();
            setWarehouses(data.warehouses);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            alert('Failed to fetch warehouses');
        } finally {
            setLoading(false);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/users?role=SUPERVISOR', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch supervisors');

            const data = await response.json();
            setSupervisors(data.users || []);
        } catch (error) {
            console.error('Error fetching supervisors:', error);
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
        setShowEditModal(true);
    };

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
                                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                />
                            </svg>
                            <h1 className='text-3xl font-bold'>
                                Warehouses Management
                            </h1>
                        </div>
                        <p className='text-primary-100 ml-11'>
                            Manage warehouse locations and facilities
                        </p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition font-bold shadow-xl'
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
                        Add New Warehouse
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
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
                                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
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
                                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
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
                                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
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
                                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouses Table */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
                <div className='px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white'>
                    <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
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
                                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                            />
                        </svg>
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
                                                <svg
                                                    className='w-8 h-8 text-slate-400'
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
                                                <svg
                                                    className='w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0'
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
                                                    <svg
                                                        className='w-4 h-4'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                                                        />
                                                    </svg>
                                                    No manager
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center'>
                                                    <svg
                                                        className='w-4 h-4 text-amber-700'
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
                                                        handleEdit(warehouse)
                                                    }
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-primary-700 hover:text-white hover:bg-primary-600 border border-primary-300 rounded-lg transition-all font-medium'
                                                >
                                                    <svg
                                                        className='w-4 h-4'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                        />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        alert(
                                                            'View details coming soon'
                                                        )
                                                    }
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-slate-700 hover:text-white hover:bg-slate-600 border border-slate-300 rounded-lg transition-all font-medium'
                                                >
                                                    <svg
                                                        className='w-4 h-4'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                                        />
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                                        />
                                                    </svg>
                                                    View
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

            {/* Create Warehouse Modal */}
            {showModal && (
                <div
                    className='fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-[99999] animate-fadeIn'
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                    }}
                >
                    <div className='bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-slideUp'>
                        {/* Modal Header - Sticky */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                                        <svg
                                            className='w-6 h-6 text-white'
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
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form onSubmit={handleSubmit} className='p-8'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='currentColor'
                                                    viewBox='0 0 20 20'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                        clipRule='evenodd'
                                                    />
                                                </svg>
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
                                            {supervisors.map((supervisor) => (
                                                <option
                                                    key={supervisor.id}
                                                    value={supervisor.id}
                                                >
                                                    {supervisor.fullName} (
                                                    {supervisor.email})
                                                </option>
                                            ))}
                                        </select>
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
                                                Creating...
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
                                                        d='M12 4v16m8-8H4'
                                                    />
                                                </svg>
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
        </div>
    );
}
