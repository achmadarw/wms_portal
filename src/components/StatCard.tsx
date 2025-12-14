import React from 'react';
import { ArrowUpIcon } from './icons';

interface StatCardProps {
    title: string;
    value: number | string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    gradient: string;
}

export default function StatCard({
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
                {trend && trendUp !== undefined && (
                    <div
                        className={`flex items-center gap-1 text-sm font-semibold ${
                            trendUp ? 'text-emerald-600' : 'text-red-600'
                        }`}
                    >
                        <ArrowUpIcon
                            className={`w-4 h-4 ${trendUp ? '' : 'rotate-180'}`}
                        />
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className='text-sm text-slate-600 mb-1'>{title}</p>
                <p className='text-3xl font-bold text-slate-900'>{value}</p>
            </div>
        </div>
    );
}
