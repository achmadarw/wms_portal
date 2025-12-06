'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
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
                <div className='text-xl text-gray-600'>Loading...</div>
            </div>
        );
    }

    return (
        <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-8'>Dashboard</h1>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                <StatCard
                    title='Warehouses'
                    value={stats.totalWarehouses}
                    icon='🏭'
                    color='bg-blue-500'
                />
                <StatCard
                    title='Items'
                    value={stats.totalItems}
                    icon='📦'
                    color='bg-green-500'
                />
                <StatCard
                    title='Movements'
                    value={stats.totalMovements}
                    icon='🔄'
                    color='bg-yellow-500'
                />
                <StatCard
                    title='Active Users'
                    value={stats.activeUsers}
                    icon='👥'
                    color='bg-purple-500'
                />
            </div>

            {/* Recent Activity */}
            <div className='bg-white rounded-lg shadow p-6'>
                <h2 className='text-xl font-bold text-gray-900 mb-4'>
                    Recent Activity
                </h2>
                <div className='space-y-4'>
                    <ActivityItem
                        action='Stock received'
                        details='100 units of SKU-001'
                        time='2 hours ago'
                        icon='📥'
                    />
                    <ActivityItem
                        action='Stock dispatched'
                        details='50 units of SKU-002'
                        time='4 hours ago'
                        icon='📤'
                    />
                    <ActivityItem
                        action='Inventory adjustment'
                        details='Corrected stock for SKU-003'
                        time='1 day ago'
                        icon='⚙️'
                    />
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number | string;
    icon: string;
    color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <div className={`${color} rounded-lg shadow p-6 text-white`}>
            <div className='flex justify-between items-start'>
                <div>
                    <p className='text-gray-100 text-sm'>{title}</p>
                    <p className='text-3xl font-bold mt-2'>{value}</p>
                </div>
                <span className='text-4xl'>{icon}</span>
            </div>
        </div>
    );
}

interface ActivityItemProps {
    action: string;
    details: string;
    time: string;
    icon: string;
}

function ActivityItem({ action, details, time, icon }: ActivityItemProps) {
    return (
        <div className='flex items-center space-x-4 pb-4 border-b last:border-b-0'>
            <span className='text-2xl'>{icon}</span>
            <div className='flex-1'>
                <p className='font-semibold text-gray-900'>{action}</p>
                <p className='text-sm text-gray-600'>{details}</p>
            </div>
            <p className='text-sm text-gray-500'>{time}</p>
        </div>
    );
}
