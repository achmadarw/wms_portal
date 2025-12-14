'use client';

import { useState, useEffect } from 'react';
import {
    TagIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    XIcon,
    CheckIcon,
    ChevronRightIcon,
    FolderIcon,
    ChevronLeftDoubleIcon,
    ChevronLeftIcon,
    ChevronRightDoubleIcon,
    ChevronDownIcon,
} from '@/components/icons';
import { User } from '@prisma/client';
import TableSkeleton from '@/components/TableSkeleton';

interface Category {
    id: string;
    code: string;
    name: string;
    description: string | null;
    parentId: string | null;
    parent: Category | null;
    children: Category[];
    items: any[];
    itemCount: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        parentId: '',
    });
    const [formErrors, setFormErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    // RBAC: userRole from localStorage
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                console.log('User role:', user.role);
                setUserRole(user.role || '');
            } catch (e) {
                setUserRole('');
            }
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        // Filter categories based on search
        if (searchTerm) {
            const filtered = categories.filter(
                (cat) =>
                    cat.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(categories);
        }
    }, [searchTerm, categories]);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/categories', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data);
                setFilteredCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ code: '', name: '', description: '', parentId: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleOpenEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            code: category.code,
            name: category.name,
            description: category.description || '',
            parentId: category.parentId || '',
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    parentId: formData.parentId || null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowModal(false);
                fetchCategories();
                setFormData({
                    code: '',
                    name: '',
                    description: '',
                    parentId: '',
                });
            } else {
                setFormErrors({
                    general: data.error || 'Failed to create category',
                });
            }
        } catch (error) {
            setFormErrors({ general: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        setSubmitting(true);
        setFormErrors({});

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `/api/categories/${editingCategory.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...formData,
                        parentId: formData.parentId || null,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setShowEditModal(false);
                setEditingCategory(null);
                fetchCategories();
            } else {
                setFormErrors({
                    general: data.error || 'Failed to update category',
                });
            }
        } catch (error) {
            setFormErrors({ general: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (categoryId: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                fetchCategories();
            } else {
                alert(data.error || 'Failed to delete category');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    // Calculate total items including all subcategories recursively
    const getTotalItemCount = (category: Category): number => {
        let total = category.itemCount || 0;
        if (category.children && category.children.length > 0) {
            category.children.forEach((child) => {
                total += getTotalItemCount(child);
            });
        }
        return total;
    };

    const renderCategoryTree = (cats: Category[], level: number = 0) => {
        const topLevelCats = cats.filter((cat) =>
            level === 0 ? !cat.parentId : cat.parentId === cats[0]?.parentId
        );

        return topLevelCats.map((category) => (
            <div key={category.id} className='mb-2'>
                <div
                    className='flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all'
                    style={{ marginLeft: `${level * 2}rem` }}
                >
                    <div className='flex items-center gap-4 flex-1'>
                        {category.children && category.children.length > 0 ? (
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className='p-1 hover:bg-slate-100 rounded transition-colors'
                                title={
                                    expandedCategories.has(category.id)
                                        ? 'Collapse'
                                        : 'Expand'
                                }
                            >
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-slate-600 transition-transform ${
                                        expandedCategories.has(category.id)
                                            ? 'rotate-0'
                                            : '-rotate-90'
                                    }`}
                                />
                            </button>
                        ) : (
                            <div className='w-7' />
                        )}
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg'>
                                <FolderIcon className='w-5 h-5 text-purple-700' />
                            </div>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <span className='font-semibold text-slate-800'>
                                        {category.name}
                                    </span>
                                    <span className='px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md'>
                                        {category.code}
                                    </span>
                                </div>
                                {category.description && (
                                    <p className='text-sm text-slate-600 mt-1'>
                                        {category.description}
                                    </p>
                                )}
                                {category.parent && (
                                    <p className='text-xs text-slate-500 mt-1'>
                                        Parent: {category.parent.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center gap-4'>
                        <div className='text-sm text-slate-600'>
                            <span className='font-medium'>
                                {getTotalItemCount(category)}
                            </span>{' '}
                            items
                            {category.children &&
                                category.children.length > 0 && (
                                    <span className='text-xs text-slate-500 ml-1'>
                                        ({category.itemCount || 0} direct)
                                    </span>
                                )}
                        </div>
                        <div className='flex gap-2'>
                            {(userRole === 'ADMIN' ||
                                userRole === 'SUPERVISOR') && (
                                <button
                                    onClick={() =>
                                        handleOpenEditModal(category)
                                    }
                                    className='p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors'
                                    title='Edit Category'
                                >
                                    <EditIcon className='w-4 h-4' />
                                </button>
                            )}
                            {userRole === 'ADMIN' && (
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className='p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors'
                                    title='Delete Category'
                                >
                                    <TrashIcon className='w-4 h-4' />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {category.children &&
                    category.children.length > 0 &&
                    expandedCategories.has(category.id) && (
                        <div className='mt-2'>
                            {renderCategoryTree(category.children, level + 1)}
                        </div>
                    )}
            </div>
        ));
    };

    if (loading) {
        return <TableSkeleton rows={10} columns={5} />;
    }

    const topLevelCategories = filteredCategories.filter(
        (cat) => !cat.parentId
    );
    const totalItems = categories.reduce((sum, cat) => sum + cat.itemCount, 0);

    // Pagination calculations
    const totalPages = Math.ceil(topLevelCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCategories = topLevelCategories.slice(startIndex, endIndex);

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 animate-fadeIn'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-white/20 backdrop-blur-sm rounded-xl'>
                            <TagIcon className='w-8 h-8 text-white' />
                        </div>
                        <div>
                            <h1 className='text-3xl font-bold text-white'>
                                Category Management
                            </h1>
                            <p className='text-primary-100 mt-1'>
                                Organize items into categories and hierarchies
                            </p>
                        </div>
                    </div>
                    {/* Only show Add Category for ADMIN and SUPERVISOR */}
                    {(userRole === 'ADMIN' || userRole === 'SUPERVISOR') && (
                        <button
                            onClick={handleOpenModal}
                            className='flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all'
                        >
                            <PlusIcon className='w-5 h-5' />
                            Add Category
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-slideUp'>
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl'>
                            <FolderIcon className='w-6 h-6 text-blue-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Total Categories
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {categories.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl'>
                            <TagIcon className='w-6 h-6 text-green-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Top Level
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {topLevelCategories.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl'>
                            <TagIcon className='w-6 h-6 text-purple-700' />
                        </div>
                        <div>
                            <p className='text-sm font-medium text-slate-600'>
                                Total Items
                            </p>
                            <p className='text-2xl font-bold text-slate-800'>
                                {totalItems}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                <input
                    type='text'
                    placeholder='Search categories by code or name...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                />
            </div>

            {/* Category Tree */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
                {filteredCategories.length === 0 ? (
                    <div className='text-center py-12'>
                        <FolderIcon className='w-16 h-16 text-slate-300 mx-auto mb-4' />
                        <p className='text-slate-600 text-lg'>
                            No categories found
                        </p>
                        <p className='text-slate-500 mt-2'>
                            Create your first category to get started
                        </p>
                    </div>
                ) : (
                    <div className='space-y-2'>
                        {renderCategoryTree(paginatedCategories)}
                    </div>
                )}

                {/* Pagination Controls */}
                {topLevelCategories.length > 0 && (
                    <div className='p-6 border-t border-slate-200 bg-slate-50'>
                        <div className='flex items-center justify-between'>
                            {/* Items Per Page Selector */}
                            <div className='flex items-center gap-3'>
                                <div className='flex items-center gap-2'>
                                    <label className='text-sm text-slate-600 font-medium'>
                                        Categories per page:
                                    </label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(
                                                Number(e.target.value)
                                            );
                                            setCurrentPage(1);
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
                                            topLevelCategories.length
                                        )}
                                    </span>{' '}
                                    of{' '}
                                    <span className='font-semibold text-slate-900'>
                                        {topLevelCategories.length}
                                    </span>{' '}
                                    categories
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

            {/* Create Modal */}
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
                    <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 p-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                                        <TagIcon className='w-6 h-6 text-white' />
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Add New Category
                                        </h2>
                                        <p className='text-primary-100 text-sm mt-1'>
                                            Create a new category for organizing
                                            items
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className='p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20'
                                >
                                    <XIcon className='w-6 h-6 text-white' />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className='p-6 overflow-y-auto flex-1'>
                            <form onSubmit={handleSubmit} className='space-y-4'>
                                {formErrors.general && (
                                    <div className='p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700'>
                                        {formErrors.general}
                                    </div>
                                )}

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideUp'>
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Category Code *
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                            placeholder='e.g., ELEC'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Category Name *
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                            placeholder='e.g., Electronics'
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Parent Category
                                    </label>
                                    <select
                                        value={formData.parentId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                parentId: e.target.value,
                                            })
                                        }
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                    >
                                        <option value=''>
                                            None (Top Level)
                                        </option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} ({cat.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
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
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                        placeholder='Category description...'
                                    />
                                </div>

                                <div className='flex gap-3 pt-4 border-t'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        {submitting ? (
                                            <>
                                                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className='w-5 h-5' />
                                                Create Category
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setShowModal(false)}
                                        className='px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingCategory && (
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
                    <div className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-primary-600 to-primary-700 p-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                                        <EditIcon className='w-6 h-6 text-white' />
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Edit Category
                                        </h2>
                                        <p className='text-primary-100 text-sm mt-1'>
                                            Update category information
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className='p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20'
                                >
                                    <XIcon className='w-6 h-6 text-white' />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className='p-6 overflow-y-auto flex-1'>
                            <form onSubmit={handleUpdate} className='space-y-4'>
                                {formErrors.general && (
                                    <div className='p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700'>
                                        {formErrors.general}
                                    </div>
                                )}

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideUp'>
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Category Code *
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Category Name *
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Parent Category
                                    </label>
                                    <select
                                        value={formData.parentId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                parentId: e.target.value,
                                            })
                                        }
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                    >
                                        <option value=''>
                                            None (Top Level)
                                        </option>
                                        {categories
                                            .filter(
                                                (cat) =>
                                                    cat.id !==
                                                    editingCategory.id
                                            )
                                            .map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name} ({cat.code})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
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
                                        className='w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                                    />
                                </div>

                                <div className='flex gap-3 pt-4 border-t'>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        {submitting ? (
                                            <>
                                                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className='w-5 h-5' />
                                                Update Category
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setShowEditModal(false)}
                                        className='px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors'
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
    );
}
