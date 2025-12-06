'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className='min-h-screen bg-gray-100'>
            {/* Sidebar */}
            <aside className='fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-lg'>
                <div className='p-6'>
                    <h1 className='text-2xl font-bold'>WMS</h1>
                    <p className='text-gray-400 text-sm'>Warehouse System</p>
                </div>

                <nav className='space-y-2 px-4'>
                    <Link
                        href='/dashboard'
                        className='block px-4 py-3 rounded-lg hover:bg-gray-800 transition'
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        href='/dashboard/inventory'
                        className='block px-4 py-3 rounded-lg hover:bg-gray-800 transition'
                    >
                        📦 Inventory
                    </Link>
                    <Link
                        href='/dashboard/movements'
                        className='block px-4 py-3 rounded-lg hover:bg-gray-800 transition'
                    >
                        🔄 Movements
                    </Link>
                    <Link
                        href='/dashboard/warehouses'
                        className='block px-4 py-3 rounded-lg hover:bg-gray-800 transition'
                    >
                        🏭 Warehouses
                    </Link>
                    <Link
                        href='/dashboard/reports'
                        className='block px-4 py-3 rounded-lg hover:bg-gray-800 transition'
                    >
                        📈 Reports
                    </Link>
                    <Link
                        href='/dashboard/users'
                        className='block px-4 py-3 rounded-lg hover:bg-gray-800 transition'
                    >
                        👥 Users
                    </Link>
                </nav>

                <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800'>
                    <button
                        onClick={handleLogout}
                        className='w-full px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition'
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className='ml-64'>
                {/* Top Bar */}
                <header className='bg-white shadow'>
                    <div className='px-6 py-4 flex justify-between items-center'>
                        <h2 className='text-xl font-bold text-gray-900'>
                            Warehouse Management System
                        </h2>
                        <div className='text-sm text-gray-600'>
                            Welcome, <span className='font-semibold'>User</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className='p-6'>{children}</div>
            </main>
        </div>
    );
}
