import React, { memo } from 'react';

interface LowStockItemProps {
    sku: string;
    name: string;
    current: number;
    minimum: number;
    percentage: number;
}

const getColor = (pct: number) => {
    if (pct < 30) return 'bg-red-500';
    if (pct < 50) return 'bg-amber-500';
    return 'bg-yellow-500';
};

export default function LowStockItem({
    sku,
    name,
    current,
    minimum,
    percentage,
}: LowStockItemProps) {
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
