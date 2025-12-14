interface PageSkeletonProps {
    variant?: 'table' | 'dashboard';
    hasStats?: boolean;
    statsCount?: number;
    hasFilters?: boolean;
    filterCount?: number;
    tableRows?: number;
    tableColumns?: number;
}

export default function PageSkeleton({
    variant = 'table',
    hasStats = true,
    statsCount = 4,
    hasFilters = false,
    filterCount = 4,
    tableRows = 10,
    tableColumns = 6,
}: PageSkeletonProps) {
    // Dashboard variant
    if (variant === 'dashboard') {
        return (
            <div className='min-h-screen bg-slate-50'>
                {/* Header Skeleton */}
                <div className='bg-white border-b border-slate-200 px-8 py-6 mb-8 animate-pulse'>
                    <div className='flex items-center justify-between'>
                        <div className='space-y-3 flex-1'>
                            <div className='h-8 bg-slate-200 rounded w-1/3'></div>
                            <div className='h-4 bg-slate-200 rounded w-1/4'></div>
                        </div>
                        <div className='h-10 w-40 bg-slate-200 rounded-xl'></div>
                    </div>
                </div>

                <div className='px-8 space-y-8'>
                    {/* Stats Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 animate-pulse'
                            >
                                <div className='flex items-center justify-between mb-4'>
                                    <div className='h-5 bg-slate-200 rounded w-2/3'></div>
                                    <div className='w-12 h-12 bg-slate-200 rounded-xl'></div>
                                </div>
                                <div className='h-10 bg-slate-200 rounded w-1/2'></div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                        <div className='animate-pulse space-y-6'>
                            <div className='h-6 bg-slate-200 rounded w-1/4'></div>
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='p-4 border-2 border-slate-200 rounded-xl'
                                    >
                                        <div className='flex flex-col items-center gap-3'>
                                            <div className='w-12 h-12 bg-slate-200 rounded-xl'></div>
                                            <div className='h-4 bg-slate-200 rounded w-3/4'></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid for Activity, Low Stock, and Status */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'
                            >
                                <div className='animate-pulse space-y-4'>
                                    <div className='flex items-center justify-between mb-6'>
                                        <div className='h-6 bg-slate-200 rounded w-1/2'></div>
                                        <div className='h-8 w-20 bg-slate-200 rounded-lg'></div>
                                    </div>
                                    <div className='space-y-4'>
                                        {Array.from({ length: 5 }).map(
                                            (_, j) => (
                                                <div
                                                    key={j}
                                                    className='flex items-center gap-4 p-3 border border-slate-200 rounded-lg'
                                                >
                                                    <div className='w-10 h-10 bg-slate-200 rounded-lg flex-shrink-0'></div>
                                                    <div className='flex-1 space-y-2'>
                                                        <div className='h-4 bg-slate-200 rounded w-3/4'></div>
                                                        <div className='h-3 bg-slate-200 rounded w-1/2'></div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Table variant (default)
    return (
        <div className='space-y-6'>
            {/* Header Skeleton */}
            <div className='bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl shadow-xl p-8 animate-pulse'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 flex-1'>
                        <div className='w-16 h-16 bg-slate-300 rounded-xl'></div>
                        <div className='space-y-3 flex-1'>
                            <div className='h-8 bg-slate-300 rounded w-1/3'></div>
                            <div className='h-4 bg-slate-300 rounded w-1/2'></div>
                        </div>
                    </div>
                    <div className='h-10 w-40 bg-slate-300 rounded-xl'></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            {hasStats && (
                <div
                    className={`grid grid-cols-1 md:grid-cols-${statsCount} gap-6`}
                >
                    {Array.from({ length: statsCount }).map((_, i) => (
                        <div
                            key={i}
                            className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200 animate-pulse'
                        >
                            <div className='flex items-center justify-between'>
                                <div className='space-y-3 flex-1'>
                                    <div className='h-4 bg-slate-200 rounded w-2/3'></div>
                                    <div className='h-8 bg-slate-200 rounded w-1/2'></div>
                                </div>
                                <div className='w-14 h-14 bg-slate-200 rounded-xl'></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters Skeleton (optional) */}
            {hasFilters && (
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
                    <div className='animate-pulse'>
                        <div className='h-6 bg-slate-200 rounded w-1/4 mb-6'></div>
                        <div
                            className={`grid grid-cols-1 md:grid-cols-${filterCount} gap-4`}
                        >
                            {Array.from({ length: filterCount }).map((_, i) => (
                                <div key={i}>
                                    <div className='h-4 bg-slate-200 rounded w-1/3 mb-2'></div>
                                    <div className='h-10 bg-slate-200 rounded'></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Table Skeleton */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
                <div className='animate-pulse'>
                    {/* Table Header */}
                    <div className='bg-slate-50 border-b border-slate-200'>
                        <table className='w-full'>
                            <thead>
                                <tr>
                                    {Array.from({ length: tableColumns }).map(
                                        (_, i) => (
                                            <th
                                                key={i}
                                                className='px-6 py-4 text-left'
                                            >
                                                <div className='h-4 bg-slate-200 rounded'></div>
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                        </table>
                    </div>

                    {/* Table Body */}
                    <table className='w-full'>
                        <tbody className='divide-y divide-slate-200'>
                            {Array.from({ length: tableRows }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: tableColumns }).map(
                                        (_, j) => (
                                            <td key={j} className='px-6 py-4'>
                                                <div className='h-4 bg-slate-200 rounded'></div>
                                            </td>
                                        )
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Skeleton */}
                    <div className='p-6 border-t border-slate-200 bg-slate-50'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='h-10 w-40 bg-slate-200 rounded-lg'></div>
                                <div className='h-6 w-60 bg-slate-200 rounded'></div>
                            </div>
                            <div className='flex items-center gap-2'>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='h-10 w-10 bg-slate-200 rounded-lg'
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
