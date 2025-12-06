'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            localStorage.setItem('accessToken', data.token.accessToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            router.push('/dashboard');
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-6 relative overflow-hidden'>
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-5'>
                <div
                    className='absolute inset-0'
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 2px 2px, rgb(51, 65, 85) 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            {/* Main Content */}
            <div className='relative z-10 w-full max-w-xl'>
                {/* Company Branding */}
                <div className='text-center mb-8'>
                    <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-6 transform hover:scale-105 transition-transform'>
                        <svg
                            className='w-11 h-11 text-white'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                            />
                        </svg>
                    </div>
                    <h1 className='text-3xl font-bold text-slate-900 mb-2'>
                        Warehouse Management System
                    </h1>
                </div>

                {/* Login Card */}
                <div className='bg-white rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden'>
                    {/* Header */}
                    <div className='bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 text-white'>
                        <h2 className='text-2xl font-bold mb-1'>
                            Welcome Back
                        </h2>
                        <p className='text-primary-100 text-sm'>
                            Sign in to access your dashboard
                        </p>
                    </div>

                    {/* Form */}
                    <div className='p-8'>
                        <form onSubmit={handleSubmit} className='space-y-5'>
                            {/* Email Input */}
                            <div>
                                <label className='block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2'>
                                    <svg
                                        className='w-4 h-4 text-slate-500'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                                        />
                                    </svg>
                                    Email Address
                                </label>
                                <input
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 placeholder:text-slate-400'
                                    placeholder='you@company.com'
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <label className='block text-sm font-semibold text-slate-700 flex items-center gap-2'>
                                        <svg
                                            className='w-4 h-4 text-slate-500'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                            />
                                        </svg>
                                        Password
                                    </label>
                                    <Link
                                        href='/forgot-password'
                                        className='text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition'
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className='relative'>
                                    <input
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className='w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 placeholder:text-slate-400'
                                        placeholder='Enter your password'
                                        required
                                    />
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition'
                                    >
                                        {showPassword ? (
                                            <svg
                                                className='w-5 h-5'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className='w-5 h-5'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                                />
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className='bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl flex items-start gap-3 animate-shake'>
                                    <svg
                                        className='w-5 h-5 flex-shrink-0 mt-0.5'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span className='text-sm font-medium'>
                                        {error}
                                    </span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type='submit'
                                disabled={loading}
                                className='w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2'
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className='animate-spin h-5 w-5'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                        >
                                            <circle
                                                className='opacity-25'
                                                cx='12'
                                                cy='12'
                                                r='10'
                                                stroke='currentColor'
                                                strokeWidth='4'
                                            ></circle>
                                            <path
                                                className='opacity-75'
                                                fill='currentColor'
                                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                            ></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className='w-5 h-5'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                                            />
                                        </svg>
                                        Sign In to Dashboard
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security Notice */}
                        <div className='mt-6 pt-6 border-t border-slate-200'>
                            <div className='flex items-center justify-center gap-2 text-sm text-slate-600'>
                                <svg
                                    className='w-4 h-4 text-emerald-600'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                                <span className='font-medium'>
                                    Secure encrypted connection
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Links */}
                <div className='mt-6 text-center space-y-3'>
                    <Link
                        href='/'
                        className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition font-medium'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M10 19l-7-7m0 0l7-7m-7 7h18'
                            />
                        </svg>
                        Back to Home
                    </Link>
                    <div className='text-xs text-slate-500'>
                        <p> 2025 WMS Enterprise. All rights reserved.</p>
                        <p className='mt-1'>
                            Internal Use Only Authorized Personnel
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
