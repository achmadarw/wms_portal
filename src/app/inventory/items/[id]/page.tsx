'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ItemDetail {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    description?: string;
    category: string;
    unitOfMeasure: string;
    weight?: number;
    unitCost: number;
    sellingPrice?: number;
    minStockLevel: number;
    maxStockLevel?: number;
    reorderPoint: number;
    reorderQty: number;
    manufacturer?: string;
    supplier?: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    isLowStock: boolean;
    stockStatus: string;
    inventoryItems: any[];
}

export default function ItemDetailPage() {
    const router = useRouter();
    const params = useParams();
    const itemId = params.id as string;

    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<
        'details' | 'stock' | 'movements'
    >('details');

    useEffect(() => {
        fetchItemDetail();
    }, [itemId]);

    const fetchItemDetail = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `/api/inventory/items?barcode=${itemId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch item');

            const data = await response.json();
            const items = data.items || [];
            if (items.length > 0) {
                setItem(items[0]);
            }
        } catch (error) {
            console.error('Error fetching item:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OUT_OF_STOCK':
                return 'bg-red-100 text-red-800';
            case 'LOW_STOCK':
                return 'bg-yellow-100 text-yellow-800';
            case 'IN_STOCK':
                return 'bg-green-100 text-green-800';
            case 'OVERSTOCK':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className='p-6'>
                <div className='animate-pulse'>
                    <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
                    <div className='h-64 bg-gray-200 rounded'></div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className='p-6'>
                <div className='text-center py-12'>
                    <h2 className='text-2xl font-bold text-gray-700'>
                        Item Not Found
                    </h2>
                    <button
                        onClick={() => router.back()}
                        className='mt-4 text-blue-600 hover:text-blue-800'
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='p-6'>
            {/* Header */}
            <div className='flex justify-between items-start mb-6'>
                <div>
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
                    <h1 className='text-3xl font-bold'>{item.name}</h1>
                    <p className='text-gray-600 mt-1'>SKU: {item.sku}</p>
                </div>
                <div className='flex gap-2'>
                    <button
                        onClick={() =>
                            router.push(`/inventory/items/${item.id}/adjust`)
                        }
                        className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'
                    >
                        Adjust Stock
                    </button>
                    <button
                        onClick={() =>
                            router.push(`/inventory/items/${item.id}/edit`)
                        }
                        className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                    >
                        Edit Item
                    </button>
                </div>
            </div>

            {/* Stock Overview Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Total Stock</div>
                    <div className='text-3xl font-bold mt-2'>
                        {item.totalStock}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                        {item.unitOfMeasure}
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Available</div>
                    <div className='text-3xl font-bold mt-2 text-green-600'>
                        {item.availableStock}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                        Ready to use
                    </div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Reserved</div>
                    <div className='text-3xl font-bold mt-2 text-orange-600'>
                        {item.reservedStock}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>On hold</div>
                </div>
                <div className='bg-white p-6 rounded-lg shadow'>
                    <div className='text-sm text-gray-600'>Status</div>
                    <div className='mt-2'>
                        <span
                            className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                                item.stockStatus
                            )}`}
                        >
                            {item.stockStatus.replace('_', ' ')}
                        </span>
                    </div>
                    {item.isLowStock && (
                        <div className='text-xs text-red-600 mt-2'>
                            ⚠️ Low Stock Alert
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className='bg-white rounded-lg shadow'>
                <div className='border-b border-gray-200'>
                    <div className='flex'>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'details'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Item Details
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'stock'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Stock Locations
                        </button>
                        <button
                            onClick={() => setActiveTab('movements')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'movements'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Movement History
                        </button>
                    </div>
                </div>

                <div className='p-6'>
                    {activeTab === 'details' && (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <h3 className='font-semibold text-lg mb-4'>
                                    Basic Information
                                </h3>
                                <div className='space-y-3'>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            SKU:
                                        </span>
                                        <span className='font-medium'>
                                            {item.sku}
                                        </span>
                                    </div>
                                    {item.barcode && (
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>
                                                Barcode:
                                            </span>
                                            <span className='font-medium'>
                                                {item.barcode}
                                            </span>
                                        </div>
                                    )}
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            Category:
                                        </span>
                                        <span className='font-medium'>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            Unit of Measure:
                                        </span>
                                        <span className='font-medium'>
                                            {item.unitOfMeasure}
                                        </span>
                                    </div>
                                    {item.weight && (
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>
                                                Weight:
                                            </span>
                                            <span className='font-medium'>
                                                {item.weight} kg
                                            </span>
                                        </div>
                                    )}
                                    {item.description && (
                                        <div>
                                            <span className='text-gray-600'>
                                                Description:
                                            </span>
                                            <p className='mt-1'>
                                                {item.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className='font-semibold text-lg mb-4'>
                                    Pricing & Stock Control
                                </h3>
                                <div className='space-y-3'>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            Unit Cost:
                                        </span>
                                        <span className='font-medium'>
                                            ${item.unitCost.toFixed(2)}
                                        </span>
                                    </div>
                                    {item.sellingPrice && (
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>
                                                Selling Price:
                                            </span>
                                            <span className='font-medium'>
                                                ${item.sellingPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            Min Stock Level:
                                        </span>
                                        <span className='font-medium'>
                                            {item.minStockLevel}
                                        </span>
                                    </div>
                                    {item.maxStockLevel && (
                                        <div className='flex justify-between'>
                                            <span className='text-gray-600'>
                                                Max Stock Level:
                                            </span>
                                            <span className='font-medium'>
                                                {item.maxStockLevel}
                                            </span>
                                        </div>
                                    )}
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            Reorder Point:
                                        </span>
                                        <span className='font-medium'>
                                            {item.reorderPoint}
                                        </span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-gray-600'>
                                            Reorder Quantity:
                                        </span>
                                        <span className='font-medium'>
                                            {item.reorderQty}
                                        </span>
                                    </div>
                                </div>

                                {(item.manufacturer || item.supplier) && (
                                    <>
                                        <h3 className='font-semibold text-lg mb-4 mt-6'>
                                            Supplier Information
                                        </h3>
                                        <div className='space-y-3'>
                                            {item.manufacturer && (
                                                <div className='flex justify-between'>
                                                    <span className='text-gray-600'>
                                                        Manufacturer:
                                                    </span>
                                                    <span className='font-medium'>
                                                        {item.manufacturer}
                                                    </span>
                                                </div>
                                            )}
                                            {item.supplier && (
                                                <div className='flex justify-between'>
                                                    <span className='text-gray-600'>
                                                        Supplier:
                                                    </span>
                                                    <span className='font-medium'>
                                                        {item.supplier}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && (
                        <div>
                            <h3 className='font-semibold text-lg mb-4'>
                                Stock by Location
                            </h3>
                            {item.inventoryItems &&
                            item.inventoryItems.length > 0 ? (
                                <table className='w-full'>
                                    <thead className='bg-gray-50'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Warehouse
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Bin
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Quantity
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Available
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                                                Reserved
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-200'>
                                        {item.inventoryItems.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className='px-6 py-4'>
                                                    {inv.warehouse?.name ||
                                                        'N/A'}
                                                </td>
                                                <td className='px-6 py-4'>
                                                    {inv.bin?.code || 'No Bin'}
                                                </td>
                                                <td className='px-6 py-4 font-semibold'>
                                                    {inv.quantity}
                                                </td>
                                                <td className='px-6 py-4 text-green-600'>
                                                    {inv.availableQty}
                                                </td>
                                                <td className='px-6 py-4 text-orange-600'>
                                                    {inv.reservedQty}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className='text-gray-500 text-center py-8'>
                                    No stock locations found
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'movements' && (
                        <div>
                            <h3 className='font-semibold text-lg mb-4'>
                                Recent Movements
                            </h3>
                            <p className='text-gray-500 text-center py-8'>
                                Movement history coming soon...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
