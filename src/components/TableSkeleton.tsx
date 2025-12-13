interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export default function TableSkeleton({
    rows = 5,
    columns = 6,
}: TableSkeletonProps) {
    return (
        <div className='p-6'>
            <div className='animate-pulse'>
                {/* Header Skeleton */}
                <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>

                {/* Filters Skeleton */}
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className='h-10 bg-gray-200 rounded'></div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className='bg-white rounded-lg shadow overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gray-100'>
                                <tr>
                                    {Array.from({ length: columns }).map(
                                        (_, i) => (
                                            <th key={i} className='px-4 py-3'>
                                                <div className='h-4 bg-gray-200 rounded'></div>
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: rows }).map((_, i) => (
                                    <tr key={i} className='border-t'>
                                        {Array.from({ length: columns }).map(
                                            (_, j) => (
                                                <td
                                                    key={j}
                                                    className='px-4 py-3'
                                                >
                                                    <div className='h-4 bg-gray-200 rounded'></div>
                                                </td>
                                            )
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Skeleton */}
                <div className='mt-6 flex justify-between items-center'>
                    <div className='h-4 bg-gray-200 rounded w-32'></div>
                    <div className='flex gap-2'>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className='h-10 w-10 bg-gray-200 rounded'
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
