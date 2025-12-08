'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Bin {
    id: string;
    code: string;
    name: string;
    row: number;
    column: number;
    level: number;
    maxCapacity: number;
    currentQty: number;
    active: boolean;
    createdAt: string;
    warehouseId: string;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

export default function WarehouseBinsPage() {
    const params = useParams();
    const router = useRouter();
    const warehouseId = params.id as string;

    const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingBin, setEditingBin] = useState<Bin | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        row: '',
        column: '',
        level: '',
        maxCapacity: '100',
    });

    const [bulkFormData, setBulkFormData] = useState({
        prefix: '',
        startRow: '1',
        endRow: '1',
        startColumn: '1',
        endColumn: '1',
        startLevel: '1',
        endLevel: '1',
        maxCapacity: '100',
        nameTemplate: '',
    });

    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<any[]>([]);

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWarehouse();
        fetchBins();
    }, [warehouseId]);

    const fetchWarehouse = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.warehouses) {
                const wh = data.warehouses.find(
                    (w: Warehouse) => w.id === warehouseId
                );
                setWarehouse(wh || null);
            }
        } catch (error) {
            console.error('Error fetching warehouse:', error);
        }
    };

    const fetchBins = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(
                `/api/warehouses/bins?warehouseId=${warehouseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
            if (res.ok && data.bins) {
                setBins(data.bins);
            }
        } catch (error) {
            console.error('Error fetching bins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.code.trim()) errors.code = 'Bin code is required';
        if (!formData.name.trim()) errors.name = 'Bin name is required';
        if (!formData.row || parseInt(formData.row) < 1)
            errors.row = 'Row must be a positive number';
        if (!formData.column || parseInt(formData.column) < 1)
            errors.column = 'Column must be a positive number';
        if (!formData.level || parseInt(formData.level) < 1)
            errors.level = 'Level must be a positive number';
        if (!formData.maxCapacity || parseInt(formData.maxCapacity) < 1)
            errors.maxCapacity = 'Max capacity must be a positive number';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/warehouses/bins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    warehouseId,
                    code: formData.code.trim(),
                    name: formData.name.trim(),
                    row: parseInt(formData.row),
                    column: parseInt(formData.column),
                    level: parseInt(formData.level),
                    maxCapacity: parseInt(formData.maxCapacity),
                }),
            });

            const data = await res.json();

            if (res.ok && data.bin) {
                alert('Bin created successfully!');
                setShowModal(false);
                setFormData({
                    code: '',
                    name: '',
                    row: '',
                    column: '',
                    level: '',
                    maxCapacity: '100',
                });
                fetchBins();
            } else {
                alert(data.error || 'Failed to create bin');
            }
        } catch (error) {
            console.error('Error creating bin:', error);
            alert('Error creating bin');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            code: '',
            name: '',
            row: '',
            column: '',
            level: '',
            maxCapacity: '100',
        });
        setFormErrors({});
    };

    const handleEdit = (bin: Bin) => {
        setEditingBin(bin);
        setFormData({
            code: bin.code,
            name: bin.name,
            row: bin.row.toString(),
            column: bin.column.toString(),
            level: bin.level.toString(),
            maxCapacity: bin.maxCapacity.toString(),
        });
        setShowEditModal(true);
    };

    const handleUpdateBin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !editingBin) return;

        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/warehouses/bins/${editingBin.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code: formData.code.trim(),
                    name: formData.name.trim(),
                    row: parseInt(formData.row),
                    column: parseInt(formData.column),
                    level: parseInt(formData.level),
                    maxCapacity: parseInt(formData.maxCapacity),
                }),
            });

            const data = await res.json();

            if (res.ok && data.bin) {
                alert('Bin updated successfully!');
                setShowEditModal(false);
                setEditingBin(null);
                setFormData({
                    code: '',
                    name: '',
                    row: '',
                    column: '',
                    level: '',
                    maxCapacity: '100',
                });
                fetchBins();
            } else {
                alert(data.error || 'Failed to update bin');
            }
        } catch (error) {
            console.error('Error updating bin:', error);
            alert('Error updating bin');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (bin: Bin) => {
        if (bin.currentQty > 0) {
            alert(
                'Cannot delete bin with existing stock. Please move items first.'
            );
            return;
        }

        if (!confirm(`Are you sure you want to delete bin "${bin.code}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/warehouses/bins/${bin.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                alert('Bin deleted successfully!');
                fetchBins();
            } else {
                alert(data.error || 'Failed to delete bin');
            }
        } catch (error) {
            console.error('Error deleting bin:', error);
            alert('Error deleting bin');
        }
    };

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/warehouses/bins/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    warehouseId,
                    prefix: bulkFormData.prefix.trim(),
                    startRow: parseInt(bulkFormData.startRow),
                    endRow: parseInt(bulkFormData.endRow),
                    startColumn: parseInt(bulkFormData.startColumn),
                    endColumn: parseInt(bulkFormData.endColumn),
                    startLevel: parseInt(bulkFormData.startLevel),
                    endLevel: parseInt(bulkFormData.endLevel),
                    maxCapacity: parseInt(bulkFormData.maxCapacity),
                    nameTemplate: bulkFormData.nameTemplate.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(
                    data.message || `Successfully created ${data.created} bins!`
                );
                setShowBulkModal(false);
                setBulkFormData({
                    prefix: '',
                    startRow: '1',
                    endRow: '1',
                    startColumn: '1',
                    endColumn: '1',
                    startLevel: '1',
                    endLevel: '1',
                    maxCapacity: '100',
                    nameTemplate: '',
                });
                fetchBins();
            } else {
                alert(data.error || 'Failed to create bins');
            }
        } catch (error) {
            console.error('Error creating bulk bins:', error);
            alert('Error creating bulk bins');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);

        // Parse CSV
        const text = await file.text();
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
            alert('CSV file must contain header and at least one data row');
            return;
        }

        // Parse header
        const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

        // Parse data
        const preview = lines
            .slice(1, Math.min(6, lines.length))
            .map((line) => {
                const values = line.split(',').map((v) => v.trim());
                const row: any = {};
                header.forEach((key, index) => {
                    row[key] = values[index] || '';
                });
                return row;
            });

        setImportPreview(preview);
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!importFile) {
            alert('Please select a file');
            return;
        }

        setSubmitting(true);

        try {
            const text = await importFile.text();
            const lines = text.split('\n').filter((line) => line.trim());

            if (lines.length < 2) {
                alert('CSV file must contain header and at least one data row');
                return;
            }

            // Parse header
            const header = lines[0]
                .split(',')
                .map((h) => h.trim().toLowerCase());

            // Parse data
            const bins = lines.slice(1).map((line) => {
                const values = line.split(',').map((v) => v.trim());
                const row: any = {};
                header.forEach((key, index) => {
                    row[key] = values[index] || '';
                });
                return {
                    code: row.code || row.bincode || '',
                    name: row.name || row.binname || '',
                    row: parseInt(row.row) || 0,
                    column: parseInt(row.column || row.col) || 0,
                    level: parseInt(row.level || row.lvl) || 0,
                    maxCapacity:
                        parseInt(row.maxcapacity || row.capacity) || 100,
                };
            });

            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/warehouses/bins/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    warehouseId,
                    bins,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(
                    data.message ||
                        `Successfully imported ${data.created} bins!`
                );
                setShowImportModal(false);
                setImportFile(null);
                setImportPreview([]);
                fetchBins();
            } else {
                alert(data.error || 'Failed to import bins');
                if (data.errors) {
                    console.error('Import errors:', data.errors);
                }
            }
        } catch (error) {
            console.error('Error importing bins:', error);
            alert('Error importing bins');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadTemplate = () => {
        const csv =
            'code,name,row,column,level,maxCapacity\nA-01-01,Bin A-01-01,1,1,1,100\nA-01-02,Bin A-01-02,1,1,2,100\nA-02-01,Bin A-02-01,1,2,1,100';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bins_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter bins based on search query
    const filteredBins = bins.filter((bin) => {
        const query = searchQuery.toLowerCase();
        return (
            bin.code.toLowerCase().includes(query) ||
            bin.name.toLowerCase().includes(query) ||
            bin.row.toString().includes(query) ||
            bin.column.toString().includes(query) ||
            bin.level.toString().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredBins.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBins = filteredBins.slice(startIndex, endIndex);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getCapacityColor = (current: number, max: number) => {
        const percentage = (current / max) * 100;
        if (percentage >= 90) return 'text-red-600 bg-red-50';
        if (percentage >= 70) return 'text-amber-600 bg-amber-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    const getCapacityPercentage = (current: number, max: number) => {
        return Math.round((current / max) * 100);
    };

    if (loading) {
        return (
            <div className='space-y-6'>
                <div className='animate-pulse'>
                    {/* Header Skeleton */}
                    <div className='bg-gray-200 rounded-2xl h-40 mb-6'></div>

                    {/* Stats Cards Skeleton */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className='bg-gray-200 rounded-2xl h-32'
                            ></div>
                        ))}
                    </div>

                    {/* Filters Skeleton */}
                    <div className='bg-gray-200 rounded-2xl h-32 mb-6'></div>

                    {/* Bins Grid Skeleton */}
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div
                                key={i}
                                className='bg-gray-200 rounded-2xl h-48'
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl shadow-xl p-8 text-white'>
                <div className='flex items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <button
                                onClick={() =>
                                    router.push('/dashboard/warehouses')
                                }
                                className='hover:bg-white/20 p-2 rounded-xl transition'
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
                                        d='M15 19l-7-7 7-7'
                                    />
                                </svg>
                            </button>
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
                                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                />
                            </svg>
                            <div>
                                <h1 className='text-3xl font-bold'>
                                    Storage Bins Management
                                </h1>
                                <p className='text-amber-100 text-sm'>
                                    {warehouse?.name} ({warehouse?.code})
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className='bg-white text-amber-700 px-6 py-3 rounded-xl font-bold hover:bg-amber-50 transition shadow-lg flex items-center gap-2'
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
                                    d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                                />
                            </svg>
                            Bulk Create
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className='bg-white text-amber-700 px-6 py-3 rounded-xl font-bold hover:bg-amber-50 transition shadow-lg flex items-center gap-2'
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
                            Import CSV
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className='bg-white text-amber-700 px-6 py-3 rounded-xl font-bold hover:bg-amber-50 transition shadow-lg flex items-center gap-2'
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
                            Add New Bin
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center'>
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
                        <div>
                            <div className='text-3xl font-bold text-slate-900'>
                                {bins.length}
                            </div>
                            <div className='text-sm text-slate-600 font-medium'>
                                Total Bins
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center'>
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
                        <div>
                            <div className='text-3xl font-bold text-slate-900'>
                                {bins.filter((b) => b.active).length}
                            </div>
                            <div className='text-sm text-slate-600 font-medium'>
                                Active Bins
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center'>
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
                                    d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                                />
                            </svg>
                        </div>
                        <div>
                            <div className='text-3xl font-bold text-slate-900'>
                                {bins.reduce(
                                    (sum, b) => sum + b.maxCapacity,
                                    0
                                )}
                            </div>
                            <div className='text-sm text-slate-600 font-medium'>
                                Total Capacity
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center'>
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
                                    d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                                />
                            </svg>
                        </div>
                        <div>
                            <div className='text-3xl font-bold text-slate-900'>
                                {bins.reduce((sum, b) => sum + b.currentQty, 0)}
                            </div>
                            <div className='text-sm text-slate-600 font-medium'>
                                Current Stock
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bins Table */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200'>
                <div className='p-6 border-b border-slate-200'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <svg
                                className='w-6 h-6 text-amber-600'
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
                            <h2 className='text-xl font-bold text-slate-900'>
                                Storage Bins List
                            </h2>
                        </div>

                        {/* Search Bar */}
                        <div className='flex items-center gap-3'>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder='Search bins...'
                                    className='pl-10 pr-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64'
                                />
                                <svg
                                    className='w-5 h-5 text-slate-400 absolute left-3 top-2.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                    />
                                </svg>
                            </div>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className='px-4 py-2 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                            >
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-amber-200'>
                            <tr>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Bin Code
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Bin Name
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    3D Coordinates
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Capacity
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Occupancy
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Status
                                </th>
                                <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200'>
                            {paginatedBins.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='px-6 py-12 text-center'
                                    >
                                        <div className='flex flex-col items-center gap-3'>
                                            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center'>
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
                                                        d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className='text-lg font-semibold text-slate-900'>
                                                    {searchQuery
                                                        ? 'No bins match your search'
                                                        : 'No bins found'}
                                                </p>
                                                <p className='text-sm text-slate-600 mt-1'>
                                                    {searchQuery
                                                        ? 'Try different search terms'
                                                        : 'Create your first storage bin to get started'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedBins.map((bin) => (
                                    <tr
                                        key={bin.id}
                                        className='hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-transparent transition'
                                    >
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center'>
                                                    <span className='text-amber-700 font-bold text-sm'>
                                                        {bin.code.substring(
                                                            0,
                                                            2
                                                        )}
                                                    </span>
                                                </div>
                                                <span className='font-semibold text-slate-900'>
                                                    {bin.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className='text-slate-900'>
                                                {bin.name}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-2'>
                                                <span className='inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium'>
                                                    R:{bin.row}
                                                </span>
                                                <span className='inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium'>
                                                    C:{bin.column}
                                                </span>
                                                <span className='inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium'>
                                                    L:{bin.level}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className='text-slate-900 font-medium'>
                                                {bin.maxCapacity} units
                                            </span>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex-1 bg-slate-100 rounded-full h-2 max-w-[120px]'>
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            getCapacityPercentage(
                                                                bin.currentQty,
                                                                bin.maxCapacity
                                                            ) >= 90
                                                                ? 'bg-red-500'
                                                                : getCapacityPercentage(
                                                                      bin.currentQty,
                                                                      bin.maxCapacity
                                                                  ) >= 70
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                        }`}
                                                        style={{
                                                            width: `${getCapacityPercentage(
                                                                bin.currentQty,
                                                                bin.maxCapacity
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span
                                                    className={`text-xs font-bold px-2 py-1 rounded-lg ${getCapacityColor(
                                                        bin.currentQty,
                                                        bin.maxCapacity
                                                    )}`}
                                                >
                                                    {getCapacityPercentage(
                                                        bin.currentQty,
                                                        bin.maxCapacity
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            {bin.active ? (
                                                <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800'>
                                                    <span className='w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse'></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800'>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(bin)
                                                    }
                                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-blue-700 hover:text-white hover:bg-blue-600 border border-blue-300 rounded-lg transition-all font-medium'
                                                    title='Edit Bin'
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
                                                        handleDelete(bin)
                                                    }
                                                    disabled={
                                                        bin.currentQty > 0
                                                    }
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg transition-all font-medium ${
                                                        bin.currentQty > 0
                                                            ? 'text-slate-400 border-slate-200 cursor-not-allowed'
                                                            : 'text-red-700 hover:text-white hover:bg-red-600 border-red-300'
                                                    }`}
                                                    title={
                                                        bin.currentQty > 0
                                                            ? 'Cannot delete bin with stock'
                                                            : 'Delete Bin'
                                                    }
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
                                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                        />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredBins.length > 0 && (
                    <div className='p-6 border-t border-slate-200 bg-slate-50'>
                        <div className='flex items-center justify-between'>
                            {/* Results Info */}
                            <div className='text-sm text-slate-600'>
                                Showing{' '}
                                <span className='font-semibold text-slate-900'>
                                    {startIndex + 1}
                                </span>{' '}
                                to{' '}
                                <span className='font-semibold text-slate-900'>
                                    {Math.min(endIndex, filteredBins.length)}
                                </span>{' '}
                                of{' '}
                                <span className='font-semibold text-slate-900'>
                                    {filteredBins.length}
                                </span>{' '}
                                bins
                            </div>

                            {/* Pagination Buttons */}
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='First page'
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
                                            d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                                        />
                                    </svg>
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
                                            d='M15 19l-7-7 7-7'
                                        />
                                    </svg>
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
                                                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
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
                                            d='M9 5l7 7-7 7'
                                        />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                    title='Last page'
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
                                            d='M13 5l7 7-7 7M5 5l7 7-7 7'
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Bin Modal */}
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
                        <div className='bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
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
                                                d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Create New Storage Bin
                                        </h2>
                                        <p className='text-amber-100 text-sm'>
                                            Add a new storage location with 3D
                                            coordinates
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
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
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form
                                onSubmit={handleSubmit}
                                className='p-8 space-y-6'
                            >
                                {/* Bin Code & Name */}
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Bin Code{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            name='code'
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                                                formErrors.code
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 focus:border-amber-500'
                                            }`}
                                            placeholder='e.g., A-01-01'
                                        />
                                        {formErrors.code && (
                                            <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
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
                                        <p className='mt-1 text-xs text-slate-500'>
                                            Format: ROW-COLUMN-LEVEL (e.g.,
                                            A-01-01)
                                        </p>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Bin Name{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            name='name'
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                                                formErrors.name
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 focus:border-amber-500'
                                            }`}
                                            placeholder='e.g., Main Storage Row A'
                                        />
                                        {formErrors.name && (
                                            <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
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
                                </div>

                                {/* 3D Coordinates */}
                                <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-4'>
                                    <h3 className='text-sm font-bold text-blue-900 mb-3 flex items-center gap-2'>
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
                                                d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
                                            />
                                        </svg>
                                        3D Coordinates (Physical Location)
                                    </h3>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Row{' '}
                                                <span className='text-red-500'>
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type='number'
                                                name='row'
                                                value={formData.row}
                                                onChange={handleInputChange}
                                                min='1'
                                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                    formErrors.row
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-slate-200 focus:border-blue-500'
                                                }`}
                                                placeholder='1'
                                            />
                                            {formErrors.row && (
                                                <p className='mt-1 text-sm text-red-600'>
                                                    {formErrors.row}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Column{' '}
                                                <span className='text-red-500'>
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type='number'
                                                name='column'
                                                value={formData.column}
                                                onChange={handleInputChange}
                                                min='1'
                                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                                                    formErrors.column
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-slate-200 focus:border-green-500'
                                                }`}
                                                placeholder='1'
                                            />
                                            {formErrors.column && (
                                                <p className='mt-1 text-sm text-red-600'>
                                                    {formErrors.column}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Level{' '}
                                                <span className='text-red-500'>
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type='number'
                                                name='level'
                                                value={formData.level}
                                                onChange={handleInputChange}
                                                min='1'
                                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${
                                                    formErrors.level
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-slate-200 focus:border-purple-500'
                                                }`}
                                                placeholder='1'
                                            />
                                            {formErrors.level && (
                                                <p className='mt-1 text-sm text-red-600'>
                                                    {formErrors.level}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className='mt-2 text-xs text-blue-700'>
                                        💡 Row = Aisle number, Column = Position
                                        in aisle, Level = Shelf height
                                    </p>
                                </div>

                                {/* Max Capacity */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Max Capacity (units){' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='number'
                                        name='maxCapacity'
                                        value={formData.maxCapacity}
                                        onChange={handleInputChange}
                                        min='1'
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all ${
                                            formErrors.maxCapacity
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-200 focus:border-amber-500'
                                        }`}
                                        placeholder='100'
                                    />
                                    {formErrors.maxCapacity && (
                                        <p className='mt-1 text-sm text-red-600 flex items-center gap-1'>
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
                                            {formErrors.maxCapacity}
                                        </p>
                                    )}
                                    <p className='mt-1 text-xs text-slate-500'>
                                        Default: 100 units (currentQty will
                                        start at 0)
                                    </p>
                                </div>

                                {/* Info Box */}
                                <div className='bg-amber-50 border-2 border-amber-200 rounded-xl p-4'>
                                    <div className='flex gap-3'>
                                        <svg
                                            className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                        <div className='text-sm text-amber-800'>
                                            <p className='font-bold mb-1'>
                                                Bin Creation Rules:
                                            </p>
                                            <ul className='space-y-1 list-disc list-inside'>
                                                <li>
                                                    Bin code must be unique
                                                    within this warehouse
                                                </li>
                                                <li>
                                                    Same bin code can exist in
                                                    different warehouses
                                                </li>
                                                <li>
                                                    All coordinate values must
                                                    be positive integers
                                                </li>
                                                <li>
                                                    Default values: active=true,
                                                    currentQty=0
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className='flex justify-end gap-3 pt-6 border-t-2 border-slate-100'>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
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
                                                Creating Bin...
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
                                                Create Bin
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Bin Modal */}
            {showEditModal && editingBin && (
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
                        <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
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
                                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Edit Storage Bin
                                        </h2>
                                        <p className='text-blue-100 text-sm'>
                                            Update bin information and
                                            coordinates
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingBin(null);
                                        setFormData({
                                            code: '',
                                            name: '',
                                            row: '',
                                            column: '',
                                            level: '',
                                            maxCapacity: '100',
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
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <form
                                onSubmit={handleUpdateBin}
                                className='p-8 space-y-6'
                            >
                                {/* Bin Code & Name */}
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Bin Code{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            name='code'
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                formErrors.code
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 focus:border-blue-500'
                                            }`}
                                            placeholder='e.g., A-01-01'
                                        />
                                        {formErrors.code && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.code}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Bin Name{' '}
                                            <span className='text-red-500'>
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type='text'
                                            name='name'
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                formErrors.name
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 focus:border-blue-500'
                                            }`}
                                            placeholder='e.g., Main Storage Row A'
                                        />
                                        {formErrors.name && (
                                            <p className='mt-1 text-sm text-red-600'>
                                                {formErrors.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 3D Coordinates */}
                                <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-4'>
                                    <h3 className='text-sm font-bold text-blue-900 mb-3'>
                                        3D Coordinates
                                    </h3>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Row{' '}
                                                <span className='text-red-500'>
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type='number'
                                                name='row'
                                                value={formData.row}
                                                onChange={handleInputChange}
                                                min='1'
                                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                    formErrors.row
                                                        ? 'border-red-500'
                                                        : 'border-slate-200'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Column{' '}
                                                <span className='text-red-500'>
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type='number'
                                                name='column'
                                                value={formData.column}
                                                onChange={handleInputChange}
                                                min='1'
                                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                                                    formErrors.column
                                                        ? 'border-red-500'
                                                        : 'border-slate-200'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Level{' '}
                                                <span className='text-red-500'>
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type='number'
                                                name='level'
                                                value={formData.level}
                                                onChange={handleInputChange}
                                                min='1'
                                                className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${
                                                    formErrors.level
                                                        ? 'border-red-500'
                                                        : 'border-slate-200'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Max Capacity */}
                                <div>
                                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                                        Max Capacity (units){' '}
                                        <span className='text-red-500'>*</span>
                                    </label>
                                    <input
                                        type='number'
                                        name='maxCapacity'
                                        value={formData.maxCapacity}
                                        onChange={handleInputChange}
                                        min='1'
                                        className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                            formErrors.maxCapacity
                                                ? 'border-red-500'
                                                : 'border-slate-200'
                                        }`}
                                    />
                                </div>

                                {/* Current Stock Info */}
                                <div className='bg-amber-50 border-2 border-amber-200 rounded-xl p-4'>
                                    <div className='flex items-center gap-2'>
                                        <svg
                                            className='w-5 h-5 text-amber-600'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                        <p className='text-sm font-bold text-amber-800'>
                                            Current Stock:{' '}
                                            {editingBin.currentQty} units
                                        </p>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className='flex justify-end gap-3 pt-6 border-t-2 border-slate-100'>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingBin(null);
                                        }}
                                        className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={submitting}
                                        className='px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
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
                                                Update Bin
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Create Modal */}
            {showBulkModal && (
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
                    <div className='bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl'>
                        {/* Modal Header - Sticky */}
                        <div className='bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
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
                                                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Bulk Create Bins
                                        </h2>
                                        <p className='text-amber-100 text-sm'>
                                            Generate multiple bins with a
                                            pattern (e.g., A-01-01 to E-05-03)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowBulkModal(false);
                                        setBulkFormData({
                                            prefix: '',
                                            startRow: '1',
                                            endRow: '1',
                                            startColumn: '1',
                                            endColumn: '1',
                                            startLevel: '1',
                                            endLevel: '1',
                                            maxCapacity: '100',
                                            nameTemplate: '',
                                        });
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
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <div className='p-8'>
                                <form
                                    onSubmit={handleBulkCreate}
                                    className='space-y-6'
                                >
                                    {/* Prefix */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Code Prefix *
                                        </label>
                                        <input
                                            type='text'
                                            value={bulkFormData.prefix}
                                            onChange={(e) =>
                                                setBulkFormData((prev) => ({
                                                    ...prev,
                                                    prefix: e.target.value,
                                                }))
                                            }
                                            className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                            placeholder='e.g., WH1- or leave empty'
                                            required
                                        />
                                        <p className='text-xs text-slate-500 mt-1'>
                                            Pattern: {bulkFormData.prefix}
                                            A-01-01
                                        </p>
                                    </div>

                                    {/* Row Range */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Start Row *
                                            </label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={bulkFormData.startRow}
                                                onChange={(e) =>
                                                    setBulkFormData((prev) => ({
                                                        ...prev,
                                                        startRow:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                                required
                                            />
                                            <p className='text-xs text-slate-500 mt-1'>
                                                1 = A, 2 = B, etc.
                                            </p>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                End Row *
                                            </label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={bulkFormData.endRow}
                                                onChange={(e) =>
                                                    setBulkFormData((prev) => ({
                                                        ...prev,
                                                        endRow: e.target.value,
                                                    }))
                                                }
                                                className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Column Range */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Start Column *
                                            </label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={bulkFormData.startColumn}
                                                onChange={(e) =>
                                                    setBulkFormData((prev) => ({
                                                        ...prev,
                                                        startColumn:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                End Column *
                                            </label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={bulkFormData.endColumn}
                                                onChange={(e) =>
                                                    setBulkFormData((prev) => ({
                                                        ...prev,
                                                        endColumn:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Level Range */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                Start Level *
                                            </label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={bulkFormData.startLevel}
                                                onChange={(e) =>
                                                    setBulkFormData((prev) => ({
                                                        ...prev,
                                                        startLevel:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-bold text-slate-700 mb-2'>
                                                End Level *
                                            </label>
                                            <input
                                                type='number'
                                                min='1'
                                                value={bulkFormData.endLevel}
                                                onChange={(e) =>
                                                    setBulkFormData((prev) => ({
                                                        ...prev,
                                                        endLevel:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Max Capacity */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Max Capacity (default) *
                                        </label>
                                        <input
                                            type='number'
                                            min='1'
                                            value={bulkFormData.maxCapacity}
                                            onChange={(e) =>
                                                setBulkFormData((prev) => ({
                                                    ...prev,
                                                    maxCapacity: e.target.value,
                                                }))
                                            }
                                            className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                                            required
                                        />
                                    </div>

                                    {/* Summary */}
                                    <div className='bg-amber-50 border-2 border-amber-200 rounded-xl p-4'>
                                        <h3 className='font-bold text-amber-900 mb-2'>
                                            Summary
                                        </h3>
                                        <p className='text-sm text-amber-800'>
                                            Total bins to create:{' '}
                                            <strong>
                                                {(parseInt(
                                                    bulkFormData.endRow
                                                ) -
                                                    parseInt(
                                                        bulkFormData.startRow
                                                    ) +
                                                    1) *
                                                    (parseInt(
                                                        bulkFormData.endColumn
                                                    ) -
                                                        parseInt(
                                                            bulkFormData.startColumn
                                                        ) +
                                                        1) *
                                                    (parseInt(
                                                        bulkFormData.endLevel
                                                    ) -
                                                        parseInt(
                                                            bulkFormData.startLevel
                                                        ) +
                                                        1)}
                                            </strong>
                                        </p>
                                    </div>

                                    {/* Form Actions */}
                                    <div className='flex justify-end gap-3 pt-6 border-t-2 border-slate-100'>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setShowBulkModal(false);
                                                setBulkFormData({
                                                    prefix: '',
                                                    startRow: '1',
                                                    endRow: '1',
                                                    startColumn: '1',
                                                    endColumn: '1',
                                                    startLevel: '1',
                                                    endLevel: '1',
                                                    maxCapacity: '100',
                                                    nameTemplate: '',
                                                });
                                            }}
                                            className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            disabled={submitting}
                                            className='px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
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
                                                            d='M5 13l4 4L19 7'
                                                        />
                                                    </svg>
                                                    Create Bins
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
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
                    <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl'>
                        {/* Modal Header - Sticky */}
                        <div className='bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6 rounded-t-2xl flex-shrink-0'>
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
                                                d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className='text-2xl font-bold text-white'>
                                            Import Bins from CSV
                                        </h2>
                                        <p className='text-amber-100 text-sm'>
                                            Upload a CSV file with bin data
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportFile(null);
                                        setImportPreview([]);
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
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className='overflow-y-auto flex-1'>
                            <div className='p-8'>
                                <form
                                    onSubmit={handleImport}
                                    className='space-y-6'
                                >
                                    {/* Template Download */}
                                    <div className='bg-amber-50 border-2 border-amber-200 rounded-xl p-4'>
                                        <h3 className='font-bold text-amber-900 mb-2'>
                                            CSV Template
                                        </h3>
                                        <p className='text-sm text-amber-800 mb-3'>
                                            Required columns: code, name, row,
                                            column, level, maxCapacity
                                        </p>
                                        <button
                                            type='button'
                                            onClick={downloadTemplate}
                                            className='px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-bold flex items-center gap-2'
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
                                                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                                                />
                                            </svg>
                                            Download Template
                                        </button>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className='block text-sm font-bold text-slate-700 mb-2'>
                                            Select CSV File *
                                        </label>
                                        <input
                                            type='file'
                                            accept='.csv'
                                            onChange={handleFileChange}
                                            className='w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-bold hover:file:bg-amber-100'
                                            required
                                        />
                                    </div>

                                    {/* Preview */}
                                    {importPreview.length > 0 && (
                                        <div>
                                            <h3 className='font-bold text-slate-700 mb-2'>
                                                Preview (first 5 rows)
                                            </h3>
                                            <div className='overflow-x-auto border-2 border-slate-200 rounded-xl'>
                                                <table className='w-full text-sm'>
                                                    <thead className='bg-slate-100'>
                                                        <tr>
                                                            <th className='px-4 py-2 text-left font-bold'>
                                                                Code
                                                            </th>
                                                            <th className='px-4 py-2 text-left font-bold'>
                                                                Name
                                                            </th>
                                                            <th className='px-4 py-2 text-left font-bold'>
                                                                Row
                                                            </th>
                                                            <th className='px-4 py-2 text-left font-bold'>
                                                                Column
                                                            </th>
                                                            <th className='px-4 py-2 text-left font-bold'>
                                                                Level
                                                            </th>
                                                            <th className='px-4 py-2 text-left font-bold'>
                                                                Capacity
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {importPreview.map(
                                                            (row, index) => (
                                                                <tr
                                                                    key={index}
                                                                    className='border-t border-slate-200'
                                                                >
                                                                    <td className='px-4 py-2'>
                                                                        {row.code ||
                                                                            row.bincode}
                                                                    </td>
                                                                    <td className='px-4 py-2'>
                                                                        {row.name ||
                                                                            row.binname}
                                                                    </td>
                                                                    <td className='px-4 py-2'>
                                                                        {
                                                                            row.row
                                                                        }
                                                                    </td>
                                                                    <td className='px-4 py-2'>
                                                                        {row.column ||
                                                                            row.col}
                                                                    </td>
                                                                    <td className='px-4 py-2'>
                                                                        {row.level ||
                                                                            row.lvl}
                                                                    </td>
                                                                    <td className='px-4 py-2'>
                                                                        {row.maxcapacity ||
                                                                            row.capacity ||
                                                                            100}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Form Actions */}
                                    <div className='flex justify-end gap-3 pt-6 border-t-2 border-slate-100'>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setShowImportModal(false);
                                                setImportFile(null);
                                                setImportPreview([]);
                                            }}
                                            className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            disabled={submitting || !importFile}
                                            className='px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
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
                                                            d='M5 13l4 4L19 7'
                                                        />
                                                    </svg>
                                                    Import Bins
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
