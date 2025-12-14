import React, { memo } from 'react';
import {
    InboundIcon,
    TransferIcon,
    AdjustmentIcon,
    ReturnIcon,
    DamageIcon,
} from './icons';

interface ActivityItemProps {
    type:
        | 'inbound'
        | 'outbound'
        | 'transfer'
        | 'adjustment'
        | 'return'
        | 'receive'
        | 'dispatch'
        | 'adjust'
        | 'damage';
    action: string;
    details: string;
    time: string;
    user: string;
}

const ACTIVITY_CONFIG = {
    colors: {
        inbound: 'bg-blue-100 text-blue-700',
        receive: 'bg-blue-100 text-blue-700',
        outbound: 'bg-emerald-100 text-emerald-700',
        dispatch: 'bg-emerald-100 text-emerald-700',
        transfer: 'bg-purple-100 text-purple-700',
        adjustment: 'bg-amber-100 text-amber-700',
        adjust: 'bg-amber-100 text-amber-700',
        return: 'bg-orange-100 text-orange-700',
        damage: 'bg-red-100 text-red-700',
    },
};

const getActivityIcon = (type: ActivityItemProps['type']) => {
    const iconClass = 'w-5 h-5';
    switch (type) {
        case 'transfer':
            return <TransferIcon className={iconClass} />;
        case 'adjustment':
        case 'adjust':
            return <AdjustmentIcon className={iconClass} />;
        case 'return':
            return <ReturnIcon className={iconClass} />;
        case 'damage':
            return <DamageIcon className={iconClass} />;
        default:
            return <InboundIcon className={iconClass} />;
    }
};

export default function ActivityItem({
    type,
    action,
    details,
    time,
    user,
}: ActivityItemProps) {
    const color =
        ACTIVITY_CONFIG.colors[type] || ACTIVITY_CONFIG.colors.inbound;
    const icon = getActivityIcon(type);

    return (
        <div className='flex items-start gap-4 pb-4 border-b last:border-b-0 border-slate-100'>
            <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
                {icon}
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
