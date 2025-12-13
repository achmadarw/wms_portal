export default function DashboardSkeleton() {
    return (
        <div className='min-h-screen bg-slate-50'>
            <div className='animate-pulse'>
                {/* Header Skeleton */}
                <div className='bg-white border-b border-slate-200 px-8 py-6 mb-8'>
                    <div className='h-8 bg-gray-200 rounded w-1/3 mb-2'></div>
                    <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                </div>

                <div className='px-8 pb-8'>
                    {/* Stats Grid Skeleton */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'
                            >
                                <div className='h-16 bg-gray-200 rounded mb-4'></div>
                                <div className='h-4 bg-gray-200 rounded w-2/3 mb-2'></div>
                                <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                            </div>
                        ))}
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                        {/* Left Column Skeleton */}
                        <div className='lg:col-span-2 space-y-8'>
                            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                                <div className='h-6 bg-gray-200 rounded w-1/4 mb-6'></div>
                                <div className='grid grid-cols-2 gap-4'>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className='h-20 bg-gray-200 rounded'
                                        ></div>
                                    ))}
                                </div>
                            </div>
                            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                                <div className='h-6 bg-gray-200 rounded w-1/4 mb-6'></div>
                                <div className='space-y-4'>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className='flex gap-4'>
                                            <div className='h-12 w-12 bg-gray-200 rounded-lg flex-shrink-0'></div>
                                            <div className='flex-1 space-y-2'>
                                                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                                                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column Skeleton */}
                        <div className='space-y-8'>
                            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                                <div className='h-6 bg-gray-200 rounded w-2/3 mb-6'></div>
                                <div className='space-y-4'>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className='space-y-2'>
                                            <div className='h-4 bg-gray-200 rounded'></div>
                                            <div className='h-2 bg-gray-200 rounded'></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                                <div className='h-6 bg-gray-200 rounded w-1/2 mb-4'></div>
                                <div className='space-y-3'>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className='h-8 bg-gray-200 rounded'
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
