'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    phone?: string;
    active: boolean;
    lastLogin?: string;
    createdAt: string;
    managedWarehouse?: {
        id: string;
        code: string;
        name: string;
    };
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [filter, setFilter] = useState({
        role: '',
        active: '',
    });
    const [stats, setStats] = useState({
        total: 0,
        byRole: {} as Record<string, number>,
    });

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'OPERATOR',
        warehouseId: '',
        phone: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Bulk import state
    const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
    const [bulkImporting, setBulkImporting] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchWarehouses();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            const params = new URLSearchParams();
            if (filter.role) params.append('role', filter.role);
            if (filter.active) params.append('active', filter.active);

            const response = await fetch(`/api/users?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.users);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/warehouses', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch warehouses');

            const data = await response.json();
            setWarehouses(data.warehouses || []);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.fullName || formData.fullName.length < 3) {
            errors.fullName = 'Full name must be at least 3 characters';
        }

        if (
            !formData.email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            errors.email = 'Invalid email address';
        }

        if (!formData.password || formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!formData.role) {
            errors.role = 'Role is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    warehouseId: formData.warehouseId || undefined,
                    phone: formData.phone || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setFormErrors({ email: 'Email already exists' });
                } else if (data.details) {
                    // Validation errors from server
                    const errors: Record<string, string> = {};
                    data.details.forEach((err: any) => {
                        errors[err.path[0]] = err.message;
                    });
                    setFormErrors(errors);
                } else {
                    throw new Error(data.error || 'Failed to create user');
                }
                return;
            }

            // Success
            alert('User created successfully!');
            setShowModal(false);
            setFormData({
                fullName: '',
                email: '',
                password: '',
                role: 'OPERATOR',
                warehouseId: '',
                phone: '',
            });
            setFormErrors({});
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            alert(
                error instanceof Error ? error.message : 'Failed to create user'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            password: '', // Don't populate password
            role: user.role,
            warehouseId: user.managedWarehouse?.id || '',
            phone: user.phone || '',
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setFormErrors({});
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');

            // Only send fields that are filled
            const updateData: any = {
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role,
                phone: formData.phone,
                warehouseId: formData.warehouseId || null,
            };

            // Only include password if changed
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error === 'Email already exists') {
                    setFormErrors({ email: 'Email already exists' });
                } else {
                    throw new Error(data.error || 'Failed to update user');
                }
                return;
            }

            alert('User updated successfully!');
            setShowEditModal(false);
            setEditingUser(null);
            setFormData({
                fullName: '',
                email: '',
                password: '',
                role: 'OPERATOR',
                warehouseId: '',
                phone: '',
            });
            setFormErrors({});
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert(
                error instanceof Error ? error.message : 'Failed to update user'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (
            !confirm(
                `Are you sure you want to deactivate ${user.fullName}? This will set the user as inactive.`
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to deactivate user');
            }

            alert('User deactivated successfully!');
            fetchUsers();
        } catch (error) {
            console.error('Error deactivating user:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to deactivate user'
            );
        }
    };

    const handleBulkImport = async () => {
        if (!bulkImportFile) {
            alert('Please select a CSV file');
            return;
        }

        setBulkImporting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const formData = new FormData();
            formData.append('file', bulkImportFile);

            const response = await fetch('/api/users/bulk-import', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to import users');
            }

            const { summary, results } = data;
            let message = `Import completed!\n\n`;
            message += `Total: ${summary.total}\n`;
            message += `Success: ${summary.success}\n`;
            message += `Failed: ${summary.failed}\n`;

            if (results.failed && results.failed.length > 0) {
                message += `\nFailed users:\n`;
                results.failed.forEach((f: any) => {
                    message += `- ${f.email}: ${f.error}\n`;
                });
            }

            alert(message);
            setShowBulkImportModal(false);
            setBulkImportFile(null);
            fetchUsers();
        } catch (error) {
            console.error('Error importing users:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to import users'
            );
        } finally {
            setBulkImporting(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800';
            case 'SUPERVISOR':
                return 'bg-blue-100 text-blue-800';
            case 'OPERATOR':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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
                                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                                />
                            </svg>
                            <h1 className='text-3xl font-bold'>
                                Users Management
                            </h1>
                        </div>
                        <p className='text-primary-100 ml-11'>
                            Manage system users, roles, and permissions
                        </p>
                    </div>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => setShowBulkImportModal(true)}
                            className='flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition font-semibold shadow-lg border border-white/30'
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
                                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                />
                            </svg>
                            Bulk Import
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
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
                            Add New User
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Total Users
                            </div>
                            <div className='text-3xl font-bold text-slate-900 mt-2'>
                                {stats.total}
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
                                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Admins
                            </div>
                            <div className='text-3xl font-bold text-red-600 mt-2'>
                                {stats.byRole['ADMIN'] || 0}
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
                                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Supervisors
                            </div>
                            <div className='text-3xl font-bold text-blue-600 mt-2'>
                                {stats.byRole['SUPERVISOR'] || 0}
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
                                    d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <div className='text-sm font-semibold text-slate-600'>
                                Operators
                            </div>
                            <div className='text-3xl font-bold text-emerald-600 mt-2'>
                                {stats.byRole['OPERATOR'] || 0}
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
                                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
                <div className='flex items-center gap-6'>
                    <div className='flex items-center gap-2 text-slate-700'>
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
                                d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                            />
                        </svg>
                        <span className='font-semibold'>Filters:</span>
                    </div>
                    <div className='flex gap-4 flex-1'>
                        <div className='flex-1'>
                            <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                Role
                            </label>
                            <select
                                value={filter.role}
                                onChange={(e) =>
                                    setFilter((prev) => ({
                                        ...prev,
                                        role: e.target.value,
                                    }))
                                }
                                className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                            >
                                <option value=''>All Roles</option>
                                <option value='ADMIN'>Admin</option>
                                <option value='SUPERVISOR'>Supervisor</option>
                                <option value='OPERATOR'>Operator</option>
                            </select>
                        </div>
                        <div className='flex-1'>
                            <label className='block text-sm font-semibold text-slate-700 mb-2'>
                                Status
                            </label>
                            <select
                                value={filter.active}
                                onChange={(e) =>
                                    setFilter((prev) => ({
                                        ...prev,
                                        active: e.target.value,
                                    }))
                                }
                                className='w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-900'
                            >
                                <option value=''>All Status</option>
                                <option value='true'>Active</option>
                                <option value='false'>Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
                <table className='min-w-full divide-y divide-slate-200'>
                    <thead className='bg-gradient-to-r from-slate-50 to-slate-100'>
                        <tr>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                User
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Email / Username
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Role
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Assigned Warehouse
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Status
                            </th>
                            <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                Last Login
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
                                    <div className='flex flex-col items-center gap-3'>
                                        <div className='w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin'></div>
                                        <p className='text-slate-600 font-medium'>
                                            Loading users...
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className='px-6 py-12 text-center text-slate-500'
                                >
                                    <div className='flex flex-col items-center gap-2'>
                                        <svg
                                            className='w-16 h-16 text-slate-300'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={1.5}
                                                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                            />
                                        </svg>
                                        <p className='font-semibold text-lg'>
                                            No users found
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className='hover:bg-slate-50 transition-colors'
                                >
                                    <td className='px-6 py-4 whitespace-nowrap'>
                                        <div className='flex items-center'>
                                            <div className='h-12 w-12 flex-shrink-0'>
                                                <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg'>
                                                    <span className='text-white font-bold text-lg'>
                                                        {user.fullName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='ml-4'>
                                                <div className='text-sm font-bold text-slate-900'>
                                                    {user.fullName}
                                                </div>
                                                {user.phone && (
                                                    <div className='text-sm text-slate-500 flex items-center gap-1'>
                                                        <svg
                                                            className='w-3.5 h-3.5'
                                                            fill='none'
                                                            stroke='currentColor'
                                                            viewBox='0 0 24 24'
                                                        >
                                                            <path
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                                strokeWidth={2}
                                                                d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                                                            />
                                                        </svg>
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap'>
                                        <div className='text-sm text-gray-900'>
                                            {user.email}
                                        </div>
                                        <div className='text-sm text-gray-500'>
                                            {user.username}
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap'>
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                                                user.role
                                            )}`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                        {user.managedWarehouse ? (
                                            <div>
                                                <div className='font-medium'>
                                                    {user.managedWarehouse.name}
                                                </div>
                                                <div className='text-gray-500'>
                                                    {user.managedWarehouse.code}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className='text-gray-400'>
                                                Not assigned
                                            </span>
                                        )}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap'>
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {user.active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                        {user.lastLogin
                                            ? new Date(
                                                  user.lastLogin
                                              ).toLocaleString()
                                            : 'Never'}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-semibold'
                                                title='Edit user'
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
                                            {user.active && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(user)
                                                    }
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-semibold'
                                                    title='Deactivate user'
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
                                                            d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                                                        />
                                                    </svg>
                                                    Deactivate
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

            {/* Add User Modal */}
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
                    <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slideUp'>
                        {/* Modal Header */}
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
                                            d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                                        />
                                    </svg>
                                    Add New User
                                </h2>
                                <p className='text-primary-100 text-sm mt-1'>
                                    Create a new user account
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setFormData({
                                        fullName: '',
                                        email: '',
                                        password: '',
                                        role: 'OPERATOR',
                                        warehouseId: '',
                                        phone: '',
                                    });
                                    setFormErrors({});
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
                                onSubmit={handleSubmit}
                                className='p-8 space-y-5'
                            >
                                {/* Full Name */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Full Name{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='fullName'
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                                            formErrors.fullName
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-primary-500'
                                        }`}
                                        placeholder='John Doe'
                                    />
                                    {formErrors.fullName && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.fullName}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Email{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='email'
                                        name='email'
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                                            formErrors.email
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-primary-500'
                                        }`}
                                        placeholder='john.doe@example.com'
                                    />
                                    {formErrors.email && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Password{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='password'
                                        name='password'
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                                            formErrors.password
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-primary-500'
                                        }`}
                                        placeholder='Minimum 6 characters'
                                    />
                                    {formErrors.password && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Role */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Role{' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <select
                                        name='role'
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                                            formErrors.role
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-primary-500'
                                        }`}
                                    >
                                        <option value='OPERATOR'>
                                            Operator
                                        </option>
                                        <option value='SUPERVISOR'>
                                            Supervisor
                                        </option>
                                        <option value='ADMIN'>Admin</option>
                                    </select>
                                    {formErrors.role && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.role}
                                        </p>
                                    )}
                                </div>

                                {/* Assigned Warehouse */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Assigned Warehouse (Optional)
                                    </label>
                                    <select
                                        name='warehouseId'
                                        value={formData.warehouseId}
                                        onChange={handleInputChange}
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all'
                                    >
                                        <option value=''>None</option>
                                        {warehouses.map((warehouse) => (
                                            <option
                                                key={warehouse.id}
                                                value={warehouse.id}
                                            >
                                                {warehouse.name} (
                                                {warehouse.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Phone (Optional)
                                    </label>
                                    <input
                                        type='tel'
                                        name='phone'
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all'
                                        placeholder='+1234567890'
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className='flex gap-3 pt-4 border-t border-slate-200'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='flex-1 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                    >
                                        {submitting ? (
                                            <>
                                                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
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
                                                        d='M5 13l4 4L19 7'
                                                    />
                                                </svg>
                                                Create User
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setShowModal(false);
                                            setFormData({
                                                fullName: '',
                                                email: '',
                                                password: '',
                                                role: 'OPERATOR',
                                                warehouseId: '',
                                                phone: '',
                                            });
                                            setFormErrors({});
                                        }}
                                        className='px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition font-bold'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
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
                    <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slideUp'>
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex justify-between items-center flex-shrink-0 rounded-t-2xl'>
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
                                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                        />
                                    </svg>
                                    Edit User
                                </h2>
                                <p className='text-blue-100 text-sm mt-1'>
                                    {editingUser.fullName}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingUser(null);
                                    setFormData({
                                        fullName: '',
                                        email: '',
                                        password: '',
                                        role: 'OPERATOR',
                                        warehouseId: '',
                                        phone: '',
                                    });
                                    setFormErrors({});
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
                                onSubmit={handleUpdateUser}
                                className='p-8 space-y-5'
                            >
                                {/* Full Name */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Full Name *
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                fullName: e.target.value,
                                            }))
                                        }
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                            formErrors.fullName
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-blue-500'
                                        }`}
                                        required
                                    />
                                    {formErrors.fullName && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.fullName}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Email *
                                    </label>
                                    <input
                                        type='email'
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                            formErrors.email
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-blue-500'
                                        }`}
                                        required
                                    />
                                    {formErrors.email && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Password (leave blank to keep current)
                                    </label>
                                    <input
                                        type='password'
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                            formErrors.password
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-blue-500'
                                        }`}
                                        placeholder='Enter new password or leave blank'
                                    />
                                    {formErrors.password && (
                                        <p className='text-red-600 text-sm mt-1.5 flex items-center gap-1'>
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
                                            {formErrors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Role */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Role *
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                role: e.target.value,
                                            }))
                                        }
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                        required
                                    >
                                        <option value='OPERATOR'>
                                            Operator
                                        </option>
                                        <option value='SUPERVISOR'>
                                            Supervisor
                                        </option>
                                        <option value='ADMIN'>Admin</option>
                                    </select>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Phone Number
                                    </label>
                                    <input
                                        type='tel'
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                phone: e.target.value,
                                            }))
                                        }
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                        placeholder='+62812345678'
                                    />
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Assigned Warehouse
                                    </label>
                                    <select
                                        value={formData.warehouseId}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                warehouseId: e.target.value,
                                            }))
                                        }
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                    >
                                        <option value=''>Not assigned</option>
                                        {warehouses.map((warehouse) => (
                                            <option
                                                key={warehouse.id}
                                                value={warehouse.id}
                                            >
                                                {warehouse.code} -{' '}
                                                {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div className='flex gap-3 pt-4 border-t border-slate-200'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                    >
                                        {submitting ? (
                                            <>
                                                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                                Updating...
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
                                                Update User
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingUser(null);
                                            setFormData({
                                                fullName: '',
                                                email: '',
                                                password: '',
                                                role: 'OPERATOR',
                                                warehouseId: '',
                                                phone: '',
                                            });
                                            setFormErrors({});
                                        }}
                                        className='px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition font-bold'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImportModal && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full'>
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 flex justify-between items-center rounded-t-2xl'>
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
                                            d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                        />
                                    </svg>
                                    Bulk Import Users
                                </h2>
                                <p className='text-emerald-100 text-sm mt-1'>
                                    Upload CSV file to import multiple users
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowBulkImportModal(false);
                                    setBulkImportFile(null);
                                }}
                                className='text-white/80 hover:text-white transition'
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
                                        strokeWidth={2}
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className='p-8 space-y-6'>
                            {/* Instructions */}
                            <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-5'>
                                <h3 className='font-bold text-blue-900 mb-3 flex items-center gap-2'>
                                    <svg
                                        className='w-5 h-5'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    CSV Format Instructions
                                </h3>
                                <ul className='text-sm text-blue-800 space-y-2'>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-blue-600 font-bold'>
                                            •
                                        </span>
                                        <span>
                                            Required columns:{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                fullName
                                            </code>
                                            ,{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                email
                                            </code>
                                            ,{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                password
                                            </code>
                                            ,{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                role
                                            </code>
                                        </span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-blue-600 font-bold'>
                                            •
                                        </span>
                                        <span>
                                            Optional columns:{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                phone
                                            </code>
                                            ,{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                warehouseCode
                                            </code>
                                        </span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-blue-600 font-bold'>
                                            •
                                        </span>
                                        <span>
                                            Roles: ADMIN, SUPERVISOR, OPERATOR
                                        </span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-blue-600 font-bold'>
                                            •
                                        </span>
                                        <span>
                                            Sample file:{' '}
                                            <code className='bg-white px-2 py-0.5 rounded font-mono text-xs'>
                                                sample-users.csv
                                            </code>
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className='block text-sm font-bold text-slate-700 mb-3'>
                                    Select CSV File
                                </label>
                                <div className='relative'>
                                    <input
                                        type='file'
                                        accept='.csv'
                                        onChange={(e) =>
                                            setBulkImportFile(
                                                e.target.files?.[0] || null
                                            )
                                        }
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-semibold hover:file:bg-emerald-700 file:cursor-pointer'
                                    />
                                </div>
                                {bulkImportFile && (
                                    <div className='mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3'>
                                        <svg
                                            className='w-5 h-5 text-emerald-600'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                        <div className='flex-1'>
                                            <p className='text-sm font-semibold text-emerald-900'>
                                                {bulkImportFile.name}
                                            </p>
                                            <p className='text-xs text-emerald-700'>
                                                {(
                                                    bulkImportFile.size / 1024
                                                ).toFixed(2)}{' '}
                                                KB
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Warning */}
                            <div className='bg-amber-50 border-2 border-amber-200 rounded-xl p-5'>
                                <div className='flex items-start gap-3'>
                                    <svg
                                        className='w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <p className='text-sm text-amber-900'>
                                        <strong className='font-bold'>
                                            Important:
                                        </strong>{' '}
                                        All users will receive welcome emails
                                        with their login credentials.
                                        {!process.env.SMTP_HOST &&
                                            ' (Currently logging to console - configure SMTP for real emails)'}
                                    </p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className='flex gap-3 pt-2'>
                                <button
                                    onClick={handleBulkImport}
                                    disabled={!bulkImportFile || bulkImporting}
                                    className='flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                >
                                    {bulkImporting ? (
                                        <>
                                            <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                            Importing...
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
                                                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                                />
                                            </svg>
                                            Import Users
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBulkImportModal(false);
                                        setBulkImportFile(null);
                                    }}
                                    className='px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition font-bold'
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
