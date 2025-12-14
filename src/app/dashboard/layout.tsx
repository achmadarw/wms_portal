'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [userName, setUserName] = useState('User');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            setUserName(userData.name || userData.email || 'User');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const isActive = (path: string) => {
        // Exact match for dashboard root
        if (path === '/dashboard') {
            return pathname === '/dashboard';
        }
        // For other paths, check if current pathname starts with the menu path
        return pathname.startsWith(path);
    };

    const menuItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: (
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
                        d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/inventory',
            label: 'Inventory',
            icon: (
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
                        d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/alerts',
            label: 'Alerts',
            icon: (
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
                        d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/reservations',
            label: 'Reservations',
            icon: (
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
                        d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/movements',
            label: 'Movements',
            icon: (
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
                        d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/items',
            label: 'Items',
            icon: (
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
                        d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/categories',
            label: 'Categories',
            icon: (
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
                        d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/warehouses',
            label: 'Warehouses',
            icon: (
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
                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/reports',
            label: 'Reports',
            icon: (
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
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                </svg>
            ),
        },
        {
            path: '/dashboard/users',
            label: 'Users',
            icon: (
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
                        d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                </svg>
            ),
        },
    ];

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'>
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out z-40 flex flex-col ${
                    sidebarOpen ? 'w-64' : 'w-16'
                }`}
            >
                {/* Logo Section - Fixed at top */}
                <div className='flex-shrink-0 p-4 border-b border-slate-200 bg-gradient-to-br from-primary-600 to-primary-700'>
                    {sidebarOpen ? (
                        <div className='flex items-center gap-3'>
                            <div className='w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg'>
                                <svg
                                    className='w-7 h-7 text-primary-600'
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
                                <h1 className='text-xl font-bold text-white'>
                                    WMS
                                </h1>
                                <p className='text-primary-100 text-xs'>
                                    Enterprise Edition
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className='flex items-center justify-center'>
                            <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg'>
                                <svg
                                    className='w-6 h-6 text-primary-600'
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
                        </div>
                    )}
                </div>

                {/* Navigation - Scrollable */}
                <nav className='flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1'>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            title={!sidebarOpen ? item.label : ''}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                                isActive(item.path)
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-primary-600'
                            } ${!sidebarOpen ? 'justify-center' : ''}`}
                        >
                            <span className='flex-shrink-0'>{item.icon}</span>
                            {sidebarOpen && (
                                <span className='font-medium whitespace-nowrap'>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* User Info & Logout - Fixed at bottom */}
                <div className='flex-shrink-0 p-3 border-t border-slate-200 bg-slate-50'>
                    {sidebarOpen ? (
                        <>
                            <div className='mb-3 px-4 py-3 bg-white rounded-xl border border-slate-200'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold'>
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-semibold text-slate-900 truncate'>
                                            {userName}
                                        </p>
                                        <p className='text-xs text-slate-500'>
                                            Administrator
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-medium'
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
                                        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                                    />
                                </svg>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <div className='mb-2 flex justify-center'>
                                <div
                                    className='w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold'
                                    title={userName}
                                >
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                title='Logout'
                                className='w-full flex items-center justify-center p-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl'
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
                                        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                                    />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'ml-64' : 'ml-16'
                }`}
            >
                {/* Top Bar */}
                <header className='bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30'>
                    <div className='px-6 py-4 flex justify-between items-center'>
                        <div className='flex items-center gap-4'>
                            {/* Toggle Sidebar Button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className='p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 hover:text-primary-600'
                                title={
                                    sidebarOpen
                                        ? 'Hide Sidebar'
                                        : 'Show Sidebar'
                                }
                            >
                                <svg
                                    className='w-6 h-6'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    {sidebarOpen ? (
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                                        />
                                    ) : (
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13 5l7 7-7 7M5 5l7 7-7 7'
                                        />
                                    )}
                                </svg>
                            </button>
                            <div>
                                <h2 className='text-xl font-bold text-slate-900'>
                                    Warehouse Management System
                                </h2>
                                <p className='text-sm text-slate-600 mt-0.5'>
                                    Internal Use Only • Enterprise Edition
                                </p>
                            </div>
                        </div>
                        <div className='flex items-center gap-4'>
                            <div className='text-right'>
                                <p className='text-sm text-slate-600'>
                                    Welcome back,
                                </p>
                                <p className='text-sm font-semibold text-slate-900'>
                                    {userName}
                                </p>
                            </div>
                            <div className='w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg'>
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className='p-6'>{children}</div>
            </main>
        </div>
    );
}
