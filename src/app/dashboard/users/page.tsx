'use client';

import { useState, useEffect } from 'react';
import {
    UsersIcon,
    PlusIcon,
    UserIcon,
    FilterIcon,
    EditIcon,
    TrashIcon,
    UploadIcon,
    ShieldIcon,
    BriefcaseIcon,
    ErrorIcon,
    CheckIcon,
    SpinnerIcon,
    XIcon,
    PhoneIcon,
    UserPlusIcon,
    FileIcon,
    WarningIcon,
    AlertInfoIcon,
    ChevronLeftDoubleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronRightDoubleIcon,
} from '@/components/icons';

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
    warehouseId?: string;
    warehouse?: {
        id: string;
        code: string;
        name: string;
    };
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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [stats, setStats] = useState({
        total: 0,
        byRole: {} as Record<string, number>,
    });

    // Calculate filtered and paginated users
    const filteredUsers = users;
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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
            warehouseId: user.warehouse?.id || user.warehouseId || '',
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
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white animate-fadeIn'>
                <div className='flex justify-between items-center'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <UsersIcon className='w-8 h-8' />
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
                            <UploadIcon className='w-5 h-5' />
                            Bulk Import
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition font-bold shadow-xl'
                        >
                            <PlusIcon className='w-5 h-5' />
                            Add New User
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 animate-slideUp'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <UsersIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <ShieldIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <BriefcaseIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
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
                            <UserIcon className='w-8 h-8 text-white' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
                <div className='flex items-center gap-6'>
                    <div className='flex items-center gap-2 text-slate-700'>
                        <FilterIcon className='w-5 h-5' />
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
                                        <UsersIcon className='w-16 h-16 text-slate-300' />
                                        <p className='font-semibold text-lg'>
                                            No users found
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user) => (
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
                                                        <PhoneIcon className='w-3.5 h-3.5' />
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
                                        {user.warehouse ? (
                                            <div>
                                                <div className='font-medium'>
                                                    {user.warehouse.name}
                                                </div>
                                                <div className='text-gray-500'>
                                                    {user.warehouse.code}
                                                </div>
                                                {user.managedWarehouse && (
                                                    <div className='mt-1'>
                                                        <span className='px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded'>
                                                            Manager
                                                        </span>
                                                    </div>
                                                )}
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
                                                <EditIcon className='w-4 h-4' />
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
                                                    <XIcon className='w-4 h-4' />
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

                {/* Pagination Controls */}
                {users.length > 0 && (
                    <div className='p-6 border-t border-slate-200 bg-slate-50'>
                        <div className='flex items-center justify-between'>
                            {/* Items Per Page Selector */}
                            <div className='flex items-center gap-3'>
                                <div className='flex items-center gap-2'>
                                    <label className='text-sm text-slate-600 font-medium'>
                                        Users per page:
                                    </label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(
                                                Number(e.target.value)
                                            );
                                            setCurrentPage(1); // Reset to first page
                                        }}
                                        className='px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all'
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Results Info */}
                                <div className='text-sm text-slate-600'>
                                    Showing{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {startIndex + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {Math.min(
                                            endIndex,
                                            filteredUsers.length
                                        )}
                                    </span>{' '}
                                    of{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {filteredUsers.length}
                                    </span>{' '}
                                    users
                                </div>
                            </div>

                            {/* Pagination Buttons */}
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='First page'
                                >
                                    <ChevronLeftDoubleIcon className='w-5 h-5' />
                                </button>

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Previous page'
                                >
                                    <ChevronLeftIcon className='w-5 h-5' />
                                </button>

                                {/* Page Numbers */}
                                <div className='flex items-center gap-1'>
                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => i + 1
                                    )
                                        .filter((page) => {
                                            // Show first page, last page, current page, and pages around current
                                            return (
                                                page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <=
                                                    1
                                            );
                                        })
                                        .map((page, index, array) => (
                                            <div
                                                key={page}
                                                className='flex items-center'
                                            >
                                                {/* Show ellipsis if there's a gap */}
                                                {index > 0 &&
                                                    array[index - 1] !==
                                                        page - 1 && (
                                                        <span className='px-2 text-slate-400'>
                                                            ...
                                                        </span>
                                                    )}
                                                <button
                                                    onClick={() =>
                                                        setCurrentPage(page)
                                                    }
                                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                                        currentPage === page
                                                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                                                            : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Next page'
                                >
                                    <ChevronRightIcon className='w-5 h-5' />
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Last page'
                                >
                                    <ChevronRightDoubleIcon className='w-5 h-5' />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
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
                                    <UserPlusIcon className='w-7 h-7' />
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
                                <XIcon className='w-6 h-6' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                                <CheckIcon className='w-5 h-5' />
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
                                    <EditIcon className='w-7 h-7' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                            <ErrorIcon className='w-4 h-4' />
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
                                    <UploadIcon className='w-7 h-7' />
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
                                <XIcon className='w-6 h-6' />
                            </button>
                        </div>

                        <div className='p-8 space-y-6'>
                            {/* Instructions */}
                            <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-5'>
                                <h3 className='font-bold text-blue-900 mb-3 flex items-center gap-2'>
                                    <AlertInfoIcon className='w-5 h-5' />
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
                                        <FileIcon className='w-5 h-5 text-emerald-600' />
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
                                    <WarningIcon className='w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5' />
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
                                            <UploadIcon className='w-5 h-5' />
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
