'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import components langsung (tidak perlu dynamic untuk small components)
import StatCard from '@/components/StatCard';
import QuickActionCard from '@/components/QuickActionCard';
import ActivityItem from '@/components/ActivityItem';
import LowStockItem from '@/components/LowStockItem';
import StatusItem from '@/components/StatusItem';

// Only skeleton needs dynamic import
const DashboardSkeleton = dynamic(
    () => import('@/components/DashboardSkeleton'),
    { ssr: false }
);

// Icons di-import secara normal karena ringan
import {
    WarehouseIcon,
    BoxIcon,
    MovementIcon,
    UsersIcon,
    LightningIcon,
    InboundIcon,
    ReportIcon,
    SettingsIcon,
    ClockIcon,
    AlertIcon,
    CheckCircleIcon,
    ArrowRightIcon,
} from '@/components/icons';

interface DashboardStats {
    totalWarehouses: number;
    totalItems: number;
    totalMovements: number;
    activeUsers: number;
    lowStockCount: number;
    outOfStockCount: number;
}

interface LowStockItem {
    id: string;
    sku: string;
    name: string;
    currentStock: number;
    minStockLevel: number;
    reorderPoint: number;
}

interface RecentActivity {
    id: string;
    type: string;
    itemSku: string;
    itemName: string;
    warehouseName: string;
    quantity: number;
    notes?: string;
    createdAt: string;
    createdBy: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalWarehouses: 0,
        totalItems: 0,
        totalMovements: 0,
        activeUsers: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('User');
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
        []
    );

    useEffect(() => {
        const checkAuth = async () => {
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

            // Fetch dashboard data
            await fetchDashboardData();
        };

        checkAuth();
    }, [router]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.error('No access token found');
                setLoading(false);
                return;
            }

            console.log('Fetching dashboard data...');
            const response = await fetch('/api/dashboard/stats', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('Dashboard API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data received:', data);
                setStats(data.stats);
                setLowStockItems(data.lowStockItems || []);
                setRecentActivities(data.recentActivities || []);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(
                    'Failed to fetch dashboard data:',
                    response.status,
                    errorData
                );
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
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
                        icon={<WarehouseIcon className='w-8 h-8' />}
                        gradient='from-blue-500 to-blue-600'
                    />
                    <StatCard
                        title='Total Items'
                        value={stats.totalItems.toLocaleString()}
                        icon={<BoxIcon className='w-8 h-8' />}
                        gradient='from-emerald-500 to-emerald-600'
                    />
                    <StatCard
                        title='Total Movements'
                        value={stats.totalMovements}
                        icon={<MovementIcon className='w-8 h-8' />}
                        gradient='from-amber-500 to-amber-600'
                    />
                    <StatCard
                        title='Active Users'
                        value={stats.activeUsers}
                        icon={<UsersIcon className='w-8 h-8' />}
                        gradient='from-purple-500 to-purple-600'
                    />
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* Quick Actions */}
                    <div className='lg:col-span-2'>
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8'>
                            <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                                <LightningIcon className='w-6 h-6 text-primary-600' />
                                Quick Actions
                            </h2>
                            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                                <QuickActionCard
                                    title='Receive Stock'
                                    icon={<InboundIcon className='w-6 h-6' />}
                                    color='bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    href='/dashboard/movements'
                                />
                                <QuickActionCard
                                    title='Dispatch Items'
                                    icon={<InboundIcon className='w-6 h-6' />}
                                    color='bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    href='/dashboard/movements'
                                />
                                <QuickActionCard
                                    title='Stock Transfer'
                                    icon={<MovementIcon className='w-6 h-6' />}
                                    color='bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    href='/dashboard/movements'
                                />
                                <QuickActionCard
                                    title='View Reports'
                                    icon={<ReportIcon className='w-6 h-6' />}
                                    color='bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    href='/inventory/reports'
                                />
                                <QuickActionCard
                                    title='Manage Users'
                                    icon={<UsersIcon className='w-6 h-6' />}
                                    color='bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    href='/dashboard/users'
                                />
                                <QuickActionCard
                                    title='Settings'
                                    icon={<SettingsIcon className='w-6 h-6' />}
                                    color='bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    href='/dashboard/users'
                                />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                                <ClockIcon className='w-6 h-6 text-primary-600' />
                                Recent Activity
                            </h2>
                            {recentActivities.length === 0 ? (
                                <div className='text-center py-8 text-slate-500'>
                                    No recent activities
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    {recentActivities
                                        .slice(0, 4)
                                        .map((activity) => (
                                            <ActivityItem
                                                key={activity.id}
                                                type={
                                                    activity.type.toLowerCase() as any
                                                }
                                                action={`${activity.type} Movement`}
                                                details={`${activity.quantity} units of ${activity.itemName} at ${activity.warehouseName}`}
                                                time={new Date(
                                                    activity.createdAt
                                                ).toLocaleString('id-ID', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                })}
                                                user={activity.createdBy}
                                            />
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div>
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8'>
                            <Link href='/dashboard/alerts'>
                                <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 hover:text-primary-600 transition-colors cursor-pointer'>
                                    <AlertIcon className='w-6 h-6 text-amber-600' />
                                    Low Stock Alert ({stats.lowStockCount})
                                    <ArrowRightIcon className='w-4 h-4 ml-auto' />
                                </h2>
                            </Link>
                            {lowStockItems.length === 0 ? (
                                <div className='text-center py-8'>
                                    <CheckCircleIcon className='w-12 h-12 text-green-500 mx-auto mb-3' />
                                    <p className='text-slate-600 font-medium'>
                                        All items are well stocked!
                                    </p>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    {lowStockItems.slice(0, 4).map((item) => {
                                        const percentage =
                                            (item.currentStock /
                                                item.reorderPoint) *
                                            100;
                                        return (
                                            <LowStockItem
                                                key={item.id}
                                                sku={item.sku}
                                                name={item.name}
                                                current={item.currentStock}
                                                minimum={item.reorderPoint}
                                                percentage={Math.min(
                                                    percentage,
                                                    100
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* System Status */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-xl font-bold text-slate-900 mb-2 flex items-center gap-2'>
                                <CheckCircleIcon className='w-6 h-6 text-emerald-600' />
                                System Status
                            </h2>
                            <p className='text-xs text-slate-500 mb-4'>
                                Static indicators - not real-time monitoring
                            </p>
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
