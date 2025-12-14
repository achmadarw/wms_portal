import React, { memo } from 'react';

interface StatusItemProps {
    label: string;
    status: 'operational' | 'warning' | 'error';
}

const STATUS_COLORS = {
    operational: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
};

export default function StatusItem({ label, status }: StatusItemProps) {
    return (
        <div className='flex items-center justify-between py-2'>
            <span className='text-sm text-slate-700'>{label}</span>
            <div className='flex items-center gap-2'>
                <div
                    className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`}
                ></div>
                <span className='text-xs text-slate-600 capitalize'>
                    {status}
                </span>
            </div>
        </div>
    );
}
