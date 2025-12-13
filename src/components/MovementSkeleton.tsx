export default function MovementSkeleton() {
    return (
        <div className='p-6'>
            <div className='animate-pulse'>
                {/* Header Skeleton */}
                <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>

                {/* Stats Grid Skeleton */}
                <div className='grid grid-cols-4 gap-4 mb-6'>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className='h-24 bg-gray-200 rounded'></div>
                    ))}
                </div>

                {/* Filters Skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className='h-10 bg-gray-200 rounded'></div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className='h-96 bg-gray-200 rounded'></div>
            </div>
        </div>
    );
}
