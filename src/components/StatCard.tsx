import React from 'react';
import { ArrowUpIcon } from './icons';
import {
    formatNumber,
    formatCompactNumber,
    getNumberFontSize,
} from '@/lib/formatNumber';

interface StatCardProps {
    title: string;
    value: number | string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    gradient: string;
    formatType?: 'none' | 'number' | 'compact'; // Format type
}

export default function StatCard({
    title,
    value,
    trend,
    trendUp,
    icon,
    gradient,
    formatType = 'compact', // Default to compact
}: StatCardProps) {
    // Format value based on type
    const getFormattedValue = () => {
        if (formatType === 'none') return value;
        if (typeof value === 'number') {
            return formatType === 'compact'
                ? formatCompactNumber(value)
                : formatNumber(value);
        }
        return value;
    };

    // Get full value for tooltip
    const getFullValue = () => {
        if (typeof value === 'number') {
            return formatNumber(value);
        }
        return value.toString();
    };

    const formattedValue = getFormattedValue();
    const fullValue = getFullValue();
    const fontSize =
        typeof value === 'number' ? getNumberFontSize(value) : 'text-3xl';

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
                <p
                    className={`${fontSize} font-bold text-slate-900`}
                    title={formattedValue !== fullValue ? fullValue : undefined}
                >
                    {formattedValue}
                </p>
            </div>
        </div>
    );
}
