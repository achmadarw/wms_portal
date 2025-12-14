import React from 'react';
import Link from 'next/link';

interface QuickActionCardProps {
    title: string;
    icon: React.ReactNode;
    color: string;
    href: string;
}

export default function QuickActionCard({
    title,
    icon,
    color,
    href,
}: QuickActionCardProps) {
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
