'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6'>
            <div className='max-w-4xl w-full'>
                <div className='text-center mb-12'>
                    <div className='inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-6 shadow-lg'>
                        <svg className='w-12 h-12 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
                        </svg>
                    </div>
                    <h1 className='text-5xl font-bold text-slate-900 mb-4'>Warehouse Management System</h1>
                    <p className='text-xl text-slate-600 max-w-2xl mx-auto'>Enterprise inventory management and logistics platform</p>
                </div>
                <div className='bg-white rounded-2xl shadow-xl p-12 border border-slate-200'>
                    <div className='text-center mb-8'>
                        <h2 className='text-2xl font-bold text-slate-900 mb-2'>Access Your Warehouse</h2>
                        <p className='text-slate-600'>Sign in to manage inventory, orders, and operations</p>
                    </div>
                    <div className='flex justify-center'>
                        <Link href='/login' className='inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg'>
                            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' />
                            </svg>
                            Sign In
                        </Link>
                    </div>
                    <div className='mt-12 pt-8 border-t border-slate-200'>
                        <div className='grid grid-cols-3 gap-6 text-center'>
                            <div>
                                <div className='text-3xl font-bold text-primary-600 mb-1'>24/7</div>
                                <div className='text-sm text-slate-600'>System Uptime</div>
                            </div>
                            <div>
                                <div className='text-3xl font-bold text-primary-600 mb-1'>
                                    <svg className='w-8 h-8 inline text-emerald-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div className='text-sm text-slate-600'>Secure Access</div>
                            </div>
                            <div>
                                <div className='text-3xl font-bold text-primary-600 mb-1'>Real-time</div>
                                <div className='text-sm text-slate-600'>Data Sync</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='text-center mt-8 text-slate-500 text-sm'>
                    <p> 2025 Warehouse Management System. All rights reserved.</p>
                    <p className='mt-2'>Enterprise Edition  Internal Use Only</p>
                </div>
            </div>
        </div>
    );
}
