'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
    totalWarehouses: number;
    totalItems: number;
    totalMovements: number;
    activeUsers: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalWarehouses: 0,
        totalItems: 0,
        totalMovements: 0,
        activeUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }

            // Get user info
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserName(user.fullName || user.email);
            }

            // Simulate loading dashboard data
            setLoading(false);
            setStats({
                totalWarehouses: 5,
                totalItems: 1250,
                totalMovements: 342,
                activeUsers: 12,
            });
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className='flex justify-center items-center h-96'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin'></div>
                    <div className='text-lg text-slate-600'>
                        Loading dashboard...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-slate-50'>
            {/* Header */}
            <div className='bg-white border-b border-slate-200 px-8 py-6 mb-8'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900'>
                            Welcome back, {userName}
                        </h1>
                        <p className='text-slate-600 mt-1'>
                            Here's what's happening in your warehouse today
                        </p>
                    </div>
                    <div className='text-right'>
                        <div className='text-sm text-slate-500'>
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                        <div className='text-lg font-semibold text-slate-700 mt-1'>
                            {new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className='px-8 pb-8'>
                {/* Stats Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                    <StatCard
                        title='Total Warehouses'
                        value={stats.totalWarehouses}
                        trend='+2.5%'
                        trendUp={true}
                        icon={
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
                                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                />
                            </svg>
                        }
                        gradient='from-blue-500 to-blue-600'
                    />
                    <StatCard
                        title='Total Items'
                        value={stats.totalItems.toLocaleString()}
                        trend='+12.3%'
                        trendUp={true}
                        icon={
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
                        }
                        gradient='from-emerald-500 to-emerald-600'
                    />
                    <StatCard
                        title='Total Movements'
                        value={stats.totalMovements}
                        trend='+8.7%'
                        trendUp={true}
                        icon={
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
                                    d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                />
                            </svg>
                        }
                        gradient='from-amber-500 to-amber-600'
                    />
                    <StatCard
                        title='Active Users'
                        value={stats.activeUsers}
                        trend='+5.2%'
                        trendUp={true}
                        icon={
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
                                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                                />
                            </svg>
                        }
                        gradient='from-purple-500 to-purple-600'
                    />
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* Quick Actions */}
                    <div className='lg:col-span-2'>
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8'>
                            <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
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
                                        d='M13 10V3L4 14h7v7l9-11h-7z'
                                    />
                                </svg>
                                Quick Actions
                            </h2>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                                <QuickActionCard
                                    title='Receive Stock'
                                    icon={
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
                                                d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                                            />
                                        </svg>
                                    }
                                    color='bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    href='/inventory/receive'
                                />
                                <QuickActionCard
                                    title='Dispatch Items'
                                    icon={
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
                                                d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                                            />
                                        </svg>
                                    }
                                    color='bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    href='/inventory/dispatch'
                                />
                                <QuickActionCard
                                    title='Stock Transfer'
                                    icon={
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
                                                d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                            />
                                        </svg>
                                    }
                                    color='bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    href='/inventory/transfer'
                                />
                                <QuickActionCard
                                    title='View Reports'
                                    icon={
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
                                                d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                            />
                                        </svg>
                                    }
                                    color='bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    href='/reports'
                                />
                                <QuickActionCard
                                    title='Manage Users'
                                    icon={
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
                                                d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                                            />
                                        </svg>
                                    }
                                    color='bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    href='/dashboard/users'
                                />
                                <QuickActionCard
                                    title='Settings'
                                    icon={
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
                                                d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                            />
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                            />
                                        </svg>
                                    }
                                    color='bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    href='/settings'
                                />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
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
                                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                                Recent Activity
                            </h2>
                            <div className='space-y-4'>
                                <ActivityItem
                                    type='receive'
                                    action='Stock Received'
                                    details='100 units of SKU-001 added to Warehouse A'
                                    time='2 hours ago'
                                    user='John Doe'
                                />
                                <ActivityItem
                                    type='dispatch'
                                    action='Stock Dispatched'
                                    details='50 units of SKU-002 sent to Customer XYZ'
                                    time='4 hours ago'
                                    user='Jane Smith'
                                />
                                <ActivityItem
                                    type='transfer'
                                    action='Stock Transfer'
                                    details='25 units moved from Warehouse A to B'
                                    time='6 hours ago'
                                    user='Mike Johnson'
                                />
                                <ActivityItem
                                    type='adjust'
                                    action='Inventory Adjustment'
                                    details='Corrected stock count for SKU-003'
                                    time='1 day ago'
                                    user='Sarah Williams'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div>
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8'>
                            <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
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
                                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                    />
                                </svg>
                                Low Stock Alert
                            </h2>
                            <div className='space-y-4'>
                                <LowStockItem
                                    sku='SKU-001'
                                    name='Product A'
                                    current={45}
                                    minimum={100}
                                    percentage={45}
                                />
                                <LowStockItem
                                    sku='SKU-005'
                                    name='Product E'
                                    current={78}
                                    minimum={150}
                                    percentage={52}
                                />
                                <LowStockItem
                                    sku='SKU-012'
                                    name='Product L'
                                    current={23}
                                    minimum={50}
                                    percentage={46}
                                />
                            </div>
                        </div>

                        {/* System Status */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                                <svg
                                    className='w-6 h-6 text-emerald-600'
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
                                System Status
                            </h2>
                            <div className='space-y-3'>
                                <StatusItem
                                    label='Database'
                                    status='operational'
                                />
                                <StatusItem
                                    label='API Server'
                                    status='operational'
                                />
                                <StatusItem
                                    label='Email Service'
                                    status='operational'
                                />
                                <StatusItem
                                    label='Backup System'
                                    status='operational'
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number | string;
    trend: string;
    trendUp: boolean;
    icon: React.ReactNode;
    gradient: string;
}

function StatCard({
    title,
    value,
    trend,
    trendUp,
    icon,
    gradient,
}: StatCardProps) {
    return (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-start justify-between mb-4'>
                <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                >
                    {icon}
                </div>
                <div
                    className={`flex items-center gap-1 text-sm font-semibold ${
                        trendUp ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                    <svg
                        className={`w-4 h-4 ${trendUp ? '' : 'rotate-180'}`}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 10l7-7m0 0l7 7m-7-7v18'
                        />
                    </svg>
                    {trend}
                </div>
            </div>
            <div>
                <p className='text-sm text-slate-600 mb-1'>{title}</p>
                <p className='text-3xl font-bold text-slate-900'>{value}</p>
            </div>
        </div>
    );
}

interface QuickActionCardProps {
    title: string;
    icon: React.ReactNode;
    color: string;
    href: string;
}

function QuickActionCard({ title, icon, color, href }: QuickActionCardProps) {
    return (
        <Link
            href={href}
            className={`${color} rounded-xl p-4 flex flex-col items-center text-center gap-3 transition-all hover:scale-105 hover:shadow-md`}
        >
            {icon}
            <span className='font-semibold text-sm'>{title}</span>
        </Link>
    );
}

interface ActivityItemProps {
    type: 'receive' | 'dispatch' | 'transfer' | 'adjust';
    action: string;
    details: string;
    time: string;
    user: string;
}

function ActivityItem({
    type,
    action,
    details,
    time,
    user,
}: ActivityItemProps) {
    const colors = {
        receive: 'bg-blue-100 text-blue-700',
        dispatch: 'bg-emerald-100 text-emerald-700',
        transfer: 'bg-purple-100 text-purple-700',
        adjust: 'bg-amber-100 text-amber-700',
    };

    const icons = {
        receive: (
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
                    d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                />
            </svg>
        ),
        dispatch: (
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
                    d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                />
            </svg>
        ),
        transfer: (
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
        adjust: (
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
                    d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
                />
            </svg>
        ),
    };

    return (
        <div className='flex items-start gap-4 pb-4 border-b last:border-b-0 border-slate-100'>
            <div className={`p-2 rounded-lg ${colors[type]} flex-shrink-0`}>
                {icons[type]}
            </div>
            <div className='flex-1 min-w-0'>
                <p className='font-semibold text-slate-900 text-sm'>{action}</p>
                <p className='text-sm text-slate-600 truncate'>{details}</p>
                <div className='flex items-center gap-2 mt-1'>
                    <span className='text-xs text-slate-500'>{user}</span>
                    <span className='text-xs text-slate-400'>•</span>
                    <span className='text-xs text-slate-500'>{time}</span>
                </div>
            </div>
        </div>
    );
}

interface LowStockItemProps {
    sku: string;
    name: string;
    current: number;
    minimum: number;
    percentage: number;
}

function LowStockItem({
    sku,
    name,
    current,
    minimum,
    percentage,
}: LowStockItemProps) {
    const getColor = (pct: number) => {
        if (pct < 30) return 'bg-red-500';
        if (pct < 50) return 'bg-amber-500';
        return 'bg-yellow-500';
    };

    return (
        <div className='pb-4 border-b last:border-b-0 border-slate-100'>
            <div className='flex items-center justify-between mb-2'>
                <div>
                    <p className='font-semibold text-slate-900 text-sm'>
                        {name}
                    </p>
                    <p className='text-xs text-slate-500'>{sku}</p>
                </div>
                <span className='text-sm font-semibold text-slate-700'>
                    {current}/{minimum}
                </span>
            </div>
            <div className='w-full bg-slate-100 rounded-full h-2'>
                <div
                    className={`h-2 rounded-full ${getColor(
                        percentage
                    )} transition-all`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

interface StatusItemProps {
    label: string;
    status: 'operational' | 'warning' | 'error';
}

function StatusItem({ label, status }: StatusItemProps) {
    const colors = {
        operational: 'bg-emerald-500',
        warning: 'bg-amber-500',
        error: 'bg-red-500',
    };

    return (
        <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-slate-700'>{label}</span>
            <div className='flex items-center gap-2'>
                <div className={`w-2 h-2 rounded-full ${colors[status]}`}></div>
                <span className='text-xs text-slate-600 capitalize'>
                    {status}
                </span>
            </div>
        </div>
    );
}
