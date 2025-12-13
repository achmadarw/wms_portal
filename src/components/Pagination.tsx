import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    showItemsPerPage?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    showItemsPerPage = true,
}) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className='p-6 border-t border-slate-200 bg-slate-50'>
            <div className='flex items-center justify-between'>
                {/* Items Per Page Selector */}
                {showItemsPerPage && onItemsPerPageChange && (
                    <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-2'>
                            <label className='text-sm text-slate-600 font-medium'>
                                Items per page:
                            </label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    onItemsPerPageChange(
                                        Number(e.target.value)
                                    );
                                    onPageChange(1); // Reset to first page
                                }}
                                className='px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all'
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* Results Info */}
                        <div className='text-sm text-slate-600'>
                            Showing{' '}
                            <span className='font-semibold text-slate-900'>
                                {startIndex + 1}
                            </span>{' '}
                            to{' '}
                            <span className='font-semibold text-slate-900'>
                                {endIndex}
                            </span>{' '}
                            of{' '}
                            <span className='font-semibold text-slate-900'>
                                {totalItems}
                            </span>{' '}
                            items
                        </div>
                    </div>
                )}

                {!showItemsPerPage && (
                    <div className='text-sm text-slate-600'>
                        Showing{' '}
                        <span className='font-semibold text-slate-900'>
                            {startIndex + 1}
                        </span>{' '}
                        to{' '}
                        <span className='font-semibold text-slate-900'>
                            {endIndex}
                        </span>{' '}
                        of{' '}
                        <span className='font-semibold text-slate-900'>
                            {totalItems}
                        </span>{' '}
                        items
                    </div>
                )}

                {/* Pagination Buttons */}
                <div className='flex items-center gap-2'>
                    {/* First Page */}
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                        title='First page'
                    >
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
                                d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                            />
                        </svg>
                    </button>

                    {/* Previous Page */}
                    <button
                        onClick={() =>
                            onPageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                        title='Previous page'
                    >
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
                                d='M15 19l-7-7 7-7'
                            />
                        </svg>
                    </button>

                    {/* Page Numbers */}
                    <div className='flex items-center gap-1'>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                                // Show first page, last page, current page, and pages around current
                                return (
                                    page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1
                                );
                            })
                            .map((page, index, array) => (
                                <div key={page} className='flex items-center'>
                                    {/* Show ellipsis if there's a gap */}
                                    {index > 0 &&
                                        array[index - 1] !== page - 1 && (
                                            <span className='px-2 text-slate-400'>
                                                ...
                                            </span>
                                        )}
                                    <button
                                        onClick={() => onPageChange(page)}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${
                                            currentPage === page
                                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                                                : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                </div>
                            ))}
                    </div>

                    {/* Next Page */}
                    <button
                        onClick={() =>
                            onPageChange(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                        title='Next page'
                    >
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
                                d='M9 5l7 7-7 7'
                            />
                        </svg>
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className='px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition'
                        title='Last page'
                    >
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
                                d='M13 5l7 7-7 7M5 5l7 7-7 7'
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
