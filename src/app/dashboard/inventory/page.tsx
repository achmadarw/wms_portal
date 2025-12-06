'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
    id: string;
    sku: string;
    name: string;
    category: string;
    unitCost: number;
    active: boolean;
}

export default function InventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category: '',
        unitCost: '',
    });

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }
            fetchItems();
        };

        checkAuth();
    }, [router]);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/inventory/items', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch items');

            const data = await response.json();
            setItems(data.items || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching items:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/inventory/items', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    unitCost: parseFloat(formData.unitCost),
                }),
            });

            if (!response.ok) throw new Error('Failed to create item');

            setFormData({ sku: '', name: '', category: '', unitCost: '' });
            setShowForm(false);
            fetchItems();
        } catch (error) {
            console.error('Error creating item:', error);
        }
    };

    if (loading) {
        return <div className='text-center py-8'>Loading...</div>;
    }

    return (
        <div>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-3xl font-bold text-gray-900'>
                    Inventory Management
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                >
                    {showForm ? 'Cancel' : '+ Add Item'}
                </button>
            </div>

            {showForm && (
                <div className='bg-white rounded-lg shadow p-6 mb-6'>
                    <h2 className='text-xl font-bold mb-4'>Add New Item</h2>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <input
                                type='text'
                                placeholder='SKU'
                                value={formData.sku}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        sku: e.target.value,
                                    })
                                }
                                className='px-4 py-2 border rounded-lg'
                                required
                            />
                            <input
                                type='text'
                                placeholder='Product Name'
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className='px-4 py-2 border rounded-lg'
                                required
                            />
                            <input
                                type='text'
                                placeholder='Category'
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category: e.target.value,
                                    })
                                }
                                className='px-4 py-2 border rounded-lg'
                                required
                            />
                            <input
                                type='number'
                                placeholder='Unit Cost'
                                value={formData.unitCost}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        unitCost: e.target.value,
                                    })
                                }
                                className='px-4 py-2 border rounded-lg'
                                required
                            />
                        </div>
                        <button
                            type='submit'
                            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
                        >
                            Save Item
                        </button>
                    </form>
                </div>
            )}

            <div className='bg-white rounded-lg shadow overflow-hidden'>
                <table className='w-full'>
                    <thead className='bg-gray-50 border-b'>
                        <tr>
                            <th className='px-6 py-3 text-left text-sm font-bold text-gray-900'>
                                SKU
                            </th>
                            <th className='px-6 py-3 text-left text-sm font-bold text-gray-900'>
                                Name
                            </th>
                            <th className='px-6 py-3 text-left text-sm font-bold text-gray-900'>
                                Category
                            </th>
                            <th className='px-6 py-3 text-left text-sm font-bold text-gray-900'>
                                Unit Cost
                            </th>
                            <th className='px-6 py-3 text-left text-sm font-bold text-gray-900'>
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y'>
                        {items.map((item) => (
                            <tr key={item.id} className='hover:bg-gray-50'>
                                <td className='px-6 py-4 text-sm text-gray-900 font-semibold'>
                                    {item.sku}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900'>
                                    {item.name}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-600'>
                                    {item.category}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900'>
                                    ${item.unitCost.toFixed(2)}
                                </td>
                                <td className='px-6 py-4 text-sm'>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            item.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {item.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
