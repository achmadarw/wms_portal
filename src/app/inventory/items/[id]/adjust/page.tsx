'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdjustStockPage() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE'>(
        'ADD'
    );
    const [formData, setFormData] = useState({
        quantity: '',
        reason: '',
        batchNumber: '',
        expiryDate: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Get warehouse ID (you might want to make this selectable)
            const whResponse = await fetch('/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const whData = await whResponse.json();
            const warehouseId = whData.warehouses?.[0]?.id;

            if (!warehouseId) {
                throw new Error('No warehouse found');
            }

            const response = await fetch('/api/inventory/stock/adjust', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemMasterId: itemId,
                    warehouseId,
                    quantity: parseInt(formData.quantity),
                    type: adjustmentType,
                    reason: formData.reason,
                    batchNumber: formData.batchNumber || undefined,
                    expiryDate: formData.expiryDate || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to adjust stock');
            }

            alert('Stock adjusted successfully');
            router.push(`/inventory/items/${itemId}`);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='p-6 max-w-2xl mx-auto'>
            <div className='mb-6'>
                <button
                    onClick={() => router.back()}
                    className='text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1'
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
                    Back
                </button>
                <h1 className='text-3xl font-bold'>Adjust Stock</h1>
                <p className='text-gray-600 mt-1'>
                    Add or remove stock quantity
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className='bg-white rounded-lg shadow p-6'
            >
                {/* Adjustment Type */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                        Adjustment Type
                    </label>
                    <div className='flex gap-4'>
                        <button
                            type='button'
                            onClick={() => setAdjustmentType('ADD')}
                            className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-colors ${
                                adjustmentType === 'ADD'
                                    ? 'border-green-600 bg-green-50 text-green-700'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <svg
                                className='w-6 h-6 mx-auto mb-1'
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
                            Add Stock
                        </button>
                        <button
                            type='button'
                            onClick={() => setAdjustmentType('REMOVE')}
                            className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-colors ${
                                adjustmentType === 'REMOVE'
                                    ? 'border-red-600 bg-red-50 text-red-700'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <svg
                                className='w-6 h-6 mx-auto mb-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M20 12H4'
                                />
                            </svg>
                            Remove Stock
                        </button>
                    </div>
                </div>

                {/* Quantity */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Quantity <span className='text-red-500'>*</span>
                    </label>
                    <input
                        type='number'
                        min='1'
                        value={formData.quantity}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                quantity: e.target.value,
                            })
                        }
                        required
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='Enter quantity'
                    />
                </div>

                {/* Batch Number */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Batch Number (Optional)
                    </label>
                    <input
                        type='text'
                        value={formData.batchNumber}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                batchNumber: e.target.value,
                            })
                        }
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='BATCH-001'
                    />
                </div>

                {/* Expiry Date */}
                {adjustmentType === 'ADD' && (
                    <div className='mb-6'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Expiry Date (Optional)
                        </label>
                        <input
                            type='date'
                            value={formData.expiryDate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    expiryDate: e.target.value,
                                })
                            }
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                    </div>
                )}

                {/* Reason */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Reason <span className='text-red-500'>*</span>
                    </label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) =>
                            setFormData({ ...formData, reason: e.target.value })
                        }
                        required
                        rows={4}
                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='Enter reason for stock adjustment...'
                    />
                </div>

                {/* Submit Buttons */}
                <div className='flex gap-4'>
                    <button
                        type='submit'
                        disabled={loading}
                        className={`flex-1 px-6 py-3 rounded-lg text-white font-medium ${
                            adjustmentType === 'ADD'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                        } disabled:bg-gray-400`}
                    >
                        {loading
                            ? 'Processing...'
                            : `${
                                  adjustmentType === 'ADD' ? 'Add' : 'Remove'
                              } Stock`}
                    </button>
                    <button
                        type='button'
                        onClick={() => router.back()}
                        className='px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium'
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
