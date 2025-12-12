'use client';

import { useEffect } from 'react';

interface AlertProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    onConfirm?: () => void;
    cancelText?: string;
    showCancel?: boolean;
}

export default function Alert({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    onConfirm,
    cancelText = 'Batal',
    showCancel = false,
}: AlertProps) {
    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-900',
                    buttonBg: 'bg-green-600 hover:bg-green-700',
                    icon: (
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                        />
                    ),
                };
            case 'error':
                return {
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-900',
                    buttonBg: 'bg-red-600 hover:bg-red-700',
                    icon: (
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                        />
                    ),
                };
            case 'warning':
                return {
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-yellow-900',
                    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
                    icon: (
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                        />
                    ),
                };
            default: // info
                return {
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-blue-900',
                    buttonBg: 'bg-blue-600 hover:bg-blue-700',
                    icon: (
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                    ),
                };
        }
    };

    const styles = getTypeStyles();

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    return (
        <div
            className='fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn'
            onClick={onClose}
        >
            <div
                className='bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className={`p-6 border-b ${styles.borderColor}`}>
                    <div className='flex items-start gap-4'>
                        <div
                            className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}
                        >
                            <svg
                                className={`w-6 h-6 ${styles.iconColor}`}
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                {styles.icon}
                            </svg>
                        </div>
                        <div className='flex-1'>
                            {title && (
                                <h3
                                    className={`text-lg font-bold ${styles.titleColor} mb-1`}
                                >
                                    {title}
                                </h3>
                            )}
                            <p className='text-slate-700 text-sm leading-relaxed whitespace-pre-line'>
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer with Buttons */}
                <div className='p-6 flex gap-3 justify-end'>
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className='px-6 py-2.5 bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-all'
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2.5 ${styles.buttonBg} text-white rounded-xl font-semibold shadow-lg transition-all`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
