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
            <div className='flex justify-between items-center'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>
                        Users Management
                    </h1>
                    <p className='text-gray-600 mt-1'>
                        Manage system users and permissions
                    </p>
                </div>
                <div className='flex gap-3'>
                    <button
                        onClick={() => setShowBulkImportModal(true)}
                        className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold'
                    >
                        📁 Bulk Import
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold'
                    >
                        + Add New User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Total Users</div>
                    <div className='text-3xl font-bold text-gray-900 mt-2'>
                        {stats.total}
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Admins</div>
                    <div className='text-3xl font-bold text-red-600 mt-2'>
                        {stats.byRole['ADMIN'] || 0}
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Supervisors</div>
                    <div className='text-3xl font-bold text-blue-600 mt-2'>
                        {stats.byRole['SUPERVISOR'] || 0}
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Operators</div>
                    <div className='text-3xl font-bold text-green-600 mt-2'>
                        {stats.byRole['OPERATOR'] || 0}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-4 rounded-lg shadow flex gap-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
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
                        className='px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    >
                        <option value=''>All Roles</option>
                        <option value='ADMIN'>Admin</option>
                        <option value='SUPERVISOR'>Supervisor</option>
                        <option value='OPERATOR'>Operator</option>
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
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
                        className='px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    >
                        <option value=''>All Status</option>
                        <option value='true'>Active</option>
                        <option value='false'>Inactive</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className='bg-white rounded-lg shadow overflow-hidden'>
                <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                User
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Email / Username
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Role
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Assigned Warehouse
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Status
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Last Login
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className='px-6 py-4 text-center text-gray-500'
                                >
                                    Loading users...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className='px-6 py-4 text-center text-gray-500'
                                >
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className='hover:bg-gray-50'>
                                    <td className='px-6 py-4 whitespace-nowrap'>
                                        <div className='flex items-center'>
                                            <div className='h-10 w-10 flex-shrink-0'>
                                                <div className='h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center'>
                                                    <span className='text-gray-600 font-semibold'>
                                                        {user.fullName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='ml-4'>
                                                <div className='text-sm font-medium text-gray-900'>
                                                    {user.fullName}
                                                </div>
                                                {user.phone && (
                                                    <div className='text-sm text-gray-500'>
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
                                                className='text-blue-600 hover:text-blue-900'
                                                title='Edit user'
                                            >
                                                ✏️ Edit
                                            </button>
                                            {user.active && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(user)
                                                    }
                                                    className='text-red-600 hover:text-red-900'
                                                    title='Deactivate user'
                                                >
                                                    🗑️ Deactivate
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
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-2xl font-bold text-gray-900'>
                                Add New User
                            </h2>
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
                                className='text-gray-500 hover:text-gray-700'
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

                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {/* Full Name */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Full Name{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    name='fullName'
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.fullName
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder='John Doe'
                                />
                                {formErrors.fullName && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Email{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='email'
                                    name='email'
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.email
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder='john.doe@example.com'
                                />
                                {formErrors.email && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Password{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='password'
                                    name='password'
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.password
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder='Minimum 6 characters'
                                />
                                {formErrors.password && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Role <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    name='role'
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.role
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                >
                                    <option value='OPERATOR'>Operator</option>
                                    <option value='SUPERVISOR'>
                                        Supervisor
                                    </option>
                                    <option value='ADMIN'>Admin</option>
                                </select>
                                {formErrors.role && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.role}
                                    </p>
                                )}
                            </div>

                            {/* Assigned Warehouse */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Assigned Warehouse (Optional)
                                </label>
                                <select
                                    name='warehouseId'
                                    value={formData.warehouseId}
                                    onChange={handleInputChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                                >
                                    <option value=''>None</option>
                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={warehouse.id}
                                        >
                                            {warehouse.name} ({warehouse.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Phone (Optional)
                                </label>
                                <input
                                    type='tel'
                                    name='phone'
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                                    placeholder='+1234567890'
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className='flex gap-4 pt-4'>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {submitting ? 'Creating...' : 'Create User'}
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
                                    className='px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold'
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-2xl font-bold text-gray-900'>
                                Edit User: {editingUser.fullName}
                            </h2>
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
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className='space-y-6'>
                            {/* Full Name */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.fullName
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                    required
                                />
                                {formErrors.fullName && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.email ? 'border-red-500' : ''
                                    }`}
                                    required
                                />
                                {formErrors.email && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.password
                                            ? 'border-red-500'
                                            : ''
                                    }`}
                                    placeholder='Enter new password or leave blank'
                                />
                                {formErrors.password && (
                                    <p className='text-red-500 text-sm mt-1'>
                                        {formErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                                    className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                    required
                                >
                                    <option value='OPERATOR'>Operator</option>
                                    <option value='SUPERVISOR'>
                                        Supervisor
                                    </option>
                                    <option value='ADMIN'>Admin</option>
                                </select>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                                    className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                    placeholder='+62812345678'
                                />
                            </div>

                            {/* Warehouse */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                                    className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                >
                                    <option value=''>Not assigned</option>
                                    {warehouses.map((warehouse) => (
                                        <option
                                            key={warehouse.id}
                                            value={warehouse.id}
                                        >
                                            {warehouse.code} - {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className='flex gap-4 pt-4'>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400'
                                >
                                    {submitting ? 'Updating...' : 'Update User'}
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
                                    className='px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold'
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImportModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-8 max-w-2xl w-full'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-2xl font-bold text-gray-900'>
                                Bulk Import Users
                            </h2>
                            <button
                                onClick={() => {
                                    setShowBulkImportModal(false);
                                    setBulkImportFile(null);
                                }}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ✕
                            </button>
                        </div>

                        <div className='space-y-6'>
                            {/* Instructions */}
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                                <h3 className='font-semibold text-blue-900 mb-2'>
                                    📋 CSV Format Instructions
                                </h3>
                                <ul className='text-sm text-blue-800 space-y-1'>
                                    <li>
                                        • Required columns:{' '}
                                        <code className='bg-white px-1 rounded'>
                                            fullName
                                        </code>
                                        ,{' '}
                                        <code className='bg-white px-1 rounded'>
                                            email
                                        </code>
                                        ,{' '}
                                        <code className='bg-white px-1 rounded'>
                                            password
                                        </code>
                                        ,{' '}
                                        <code className='bg-white px-1 rounded'>
                                            role
                                        </code>
                                    </li>
                                    <li>
                                        • Optional columns:{' '}
                                        <code className='bg-white px-1 rounded'>
                                            phone
                                        </code>
                                        ,{' '}
                                        <code className='bg-white px-1 rounded'>
                                            warehouseCode
                                        </code>
                                    </li>
                                    <li>
                                        • Roles: ADMIN, SUPERVISOR, OPERATOR
                                    </li>
                                    <li>
                                        • Sample file available:{' '}
                                        <code className='bg-white px-1 rounded'>
                                            sample-users.csv
                                        </code>
                                    </li>
                                </ul>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Select CSV File
                                </label>
                                <input
                                    type='file'
                                    accept='.csv'
                                    onChange={(e) =>
                                        setBulkImportFile(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                    className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                />
                                {bulkImportFile && (
                                    <p className='text-sm text-gray-600 mt-2'>
                                        Selected: {bulkImportFile.name} (
                                        {(bulkImportFile.size / 1024).toFixed(
                                            2
                                        )}{' '}
                                        KB)
                                    </p>
                                )}
                            </div>

                            {/* Warning */}
                            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                                <p className='text-sm text-yellow-800'>
                                    ⚠️ <strong>Important:</strong> All users
                                    will receive welcome emails with their login
                                    credentials.
                                    {!process.env.SMTP_HOST &&
                                        ' (Currently logging to console - configure SMTP for real emails)'}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className='flex gap-4 pt-4'>
                                <button
                                    onClick={handleBulkImport}
                                    disabled={!bulkImportFile || bulkImporting}
                                    className='flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400'
                                >
                                    {bulkImporting
                                        ? 'Importing...'
                                        : '📁 Import Users'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBulkImportModal(false);
                                        setBulkImportFile(null);
                                    }}
                                    className='px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold'
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
