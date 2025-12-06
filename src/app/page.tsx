import React from 'react';

export default function Home() {
    return (
        <main className='min-h-screen bg-gradient-to-br from-blue-600 to-blue-800'>
            <div className='flex items-center justify-center min-h-screen'>
                <div className='text-center text-white'>
                    <h1 className='text-5xl font-bold mb-4'>
                        Warehouse Management System
                    </h1>
                    <p className='text-xl mb-8'>
                        Professional inventory & stock management
                    </p>
                    <div className='space-x-4'>
                        <a
                            href='/login'
                            className='bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition'
                        >
                            Login
                        </a>
                        <a
                            href='/register'
                            className='bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition'
                        >
                            Register
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
