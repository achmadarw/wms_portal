'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sku: '',
        barcode: '',
        name: '',
        description: '',
        category: '',
        unitOfMeasure: 'PCS',
        weight: '',
        unitCost: '',
        sellingPrice: '',
        minStockLevel: '0',
        maxStockLevel: '',
        reorderPoint: '0',
        reorderQty: '0',
        manufacturer: '',
        supplier: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/inventory/items', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    weight: formData.weight
                        ? parseFloat(formData.weight)
                        : null,
                    unitCost: parseFloat(formData.unitCost) || 0,
                    sellingPrice: formData.sellingPrice
                        ? parseFloat(formData.sellingPrice)
                        : null,
                    minStockLevel: parseInt(formData.minStockLevel) || 0,
                    maxStockLevel: formData.maxStockLevel
                        ? parseInt(formData.maxStockLevel)
                        : null,
                    reorderPoint: parseInt(formData.reorderPoint) || 0,
                    reorderQty: parseInt(formData.reorderQty) || 0,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create item');
            }

            router.push('/inventory');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className='p-6 max-w-4xl mx-auto'>
            <div className='mb-6'>
                <h1 className='text-3xl font-bold'>Add New Item</h1>
                <p className='text-gray-600 mt-1'>
                    Create a new inventory item
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className='bg-white rounded-lg shadow p-6'
            >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Basic Information */}
                    <div className='md:col-span-2'>
                        <h2 className='text-xl font-semibold mb-4'>
                            Basic Information
                        </h2>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            SKU <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            name='sku'
                            value={formData.sku}
                            onChange={handleChange}
                            required
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='ITEM-001'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Barcode
                        </label>
                        <input
                            type='text'
                            name='barcode'
                            value={formData.barcode}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='123456789'
                        />
                    </div>

                    <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Item Name <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Product Name'
                        />
                    </div>

                    <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Description
                        </label>
                        <textarea
                            name='description'
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Item description...'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Category <span className='text-red-500'>*</span>
                        </label>
                        <select
                            name='category'
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value=''>Select Category</option>
                            <option value='Electronics'>Electronics</option>
                            <option value='Food'>Food</option>
                            <option value='Clothing'>Clothing</option>
                            <option value='Tools'>Tools</option>
                            <option value='Other'>Other</option>
                        </select>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Unit of Measure
                        </label>
                        <select
                            name='unitOfMeasure'
                            value={formData.unitOfMeasure}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value='PCS'>PCS (Pieces)</option>
                            <option value='BOX'>BOX</option>
                            <option value='KG'>KG (Kilogram)</option>
                            <option value='LTR'>LTR (Liter)</option>
                            <option value='MTR'>MTR (Meter)</option>
                        </select>
                    </div>

                    {/* Physical Properties */}
                    <div className='md:col-span-2 mt-4'>
                        <h2 className='text-xl font-semibold mb-4'>
                            Physical Properties
                        </h2>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Weight (kg)
                        </label>
                        <input
                            type='number'
                            step='0.01'
                            name='weight'
                            value={formData.weight}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='0.00'
                        />
                    </div>

                    {/* Pricing */}
                    <div className='md:col-span-2 mt-4'>
                        <h2 className='text-xl font-semibold mb-4'>Pricing</h2>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Unit Cost <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='number'
                            step='0.01'
                            name='unitCost'
                            value={formData.unitCost}
                            onChange={handleChange}
                            required
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='0.00'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Selling Price
                        </label>
                        <input
                            type='number'
                            step='0.01'
                            name='sellingPrice'
                            value={formData.sellingPrice}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='0.00'
                        />
                    </div>

                    {/* Stock Control */}
                    <div className='md:col-span-2 mt-4'>
                        <h2 className='text-xl font-semibold mb-4'>
                            Stock Control
                        </h2>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Min Stock Level
                        </label>
                        <input
                            type='number'
                            name='minStockLevel'
                            value={formData.minStockLevel}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='0'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Max Stock Level
                        </label>
                        <input
                            type='number'
                            name='maxStockLevel'
                            value={formData.maxStockLevel}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='1000'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Reorder Point
                        </label>
                        <input
                            type='number'
                            name='reorderPoint'
                            value={formData.reorderPoint}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='0'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Reorder Quantity
                        </label>
                        <input
                            type='number'
                            name='reorderQty'
                            value={formData.reorderQty}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='0'
                        />
                    </div>

                    {/* Supplier Info */}
                    <div className='md:col-span-2 mt-4'>
                        <h2 className='text-xl font-semibold mb-4'>
                            Supplier Information
                        </h2>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Manufacturer
                        </label>
                        <input
                            type='text'
                            name='manufacturer'
                            value={formData.manufacturer}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Manufacturer name'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Supplier
                        </label>
                        <input
                            type='text'
                            name='supplier'
                            value={formData.supplier}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Supplier name'
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-4 mt-8'>
                    <button
                        type='submit'
                        disabled={loading}
                        className='flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium'
                    >
                        {loading ? 'Creating...' : 'Create Item'}
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
