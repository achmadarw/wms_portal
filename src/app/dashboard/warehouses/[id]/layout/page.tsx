'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Bin {
    id: string;
    code: string;
    name: string;
    row: number;
    column: number;
    level: number;
    maxCapacity: number;
    currentQty: number;
    active: boolean;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

type ViewMode = 'grid' | '3d' | 'list';

export default function WarehouseLayoutPage() {
    const params = useParams();
    const router = useRouter();
    const warehouseId = params.id as string;

    const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
    const [bins, setBins] = useState<Bin[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedLevel, setSelectedLevel] = useState<number>(1);
    const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
    const [showBinDetails, setShowBinDetails] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetchWarehouse();
        fetchBins();
    }, [warehouseId]);

    const fetchWarehouse = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.warehouses) {
                const wh = data.warehouses.find(
                    (w: Warehouse) => w.id === warehouseId
                );
                setWarehouse(wh || null);
            }
        } catch (error) {
            console.error('Error fetching warehouse:', error);
        }
    };

    const fetchBins = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(
                `/api/warehouses/bins?warehouseId=${warehouseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
            if (res.ok && data.bins) {
                setBins(data.bins);
            }
        } catch (error) {
            console.error('Error fetching bins:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMaxDimensions = () => {
        if (bins.length === 0) return { maxRow: 0, maxColumn: 0, maxLevel: 0 };

        return {
            maxRow: Math.max(...bins.map((b) => b.row)),
            maxColumn: Math.max(...bins.map((b) => b.column)),
            maxLevel: Math.max(...bins.map((b) => b.level)),
        };
    };

    const { maxRow, maxColumn, maxLevel } = getMaxDimensions();

    const getBinAtPosition = (row: number, column: number, level: number) => {
        return bins.find(
            (b) => b.row === row && b.column === column && b.level === level
        );
    };

    const getOccupancyColor = (bin: Bin | undefined) => {
        if (!bin) return 'bg-slate-100 border-slate-200';
        if (!bin.active) return 'bg-slate-200 border-slate-300';

        const percentage = (bin.currentQty / bin.maxCapacity) * 100;
        if (percentage === 0)
            return 'bg-white border-emerald-300 hover:bg-emerald-50';
        if (percentage < 50)
            return 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200';
        if (percentage < 80)
            return 'bg-amber-100 border-amber-400 hover:bg-amber-200';
        if (percentage < 100)
            return 'bg-orange-100 border-orange-400 hover:bg-orange-200';
        return 'bg-red-100 border-red-400 hover:bg-red-200';
    };

    const getOccupancyPercentage = (bin: Bin) => {
        return Math.round((bin.currentQty / bin.maxCapacity) * 100);
    };

    const handleBinClick = (bin: Bin | undefined) => {
        if (bin && !isDragging) {
            setSelectedBin(bin);
            setShowBinDetails(true);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - panPosition.x,
            y: e.clientY - panPosition.y,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPanPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setTimeout(() => setIsDragging(false), 10);
    };

    const handleResetView = () => {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
    };

    const getLevelBins = (level: number) => {
        return bins.filter((b) => b.level === level);
    };

    if (loading) {
        return (
            <div className='space-y-6'>
                <div className='animate-pulse'>
                    {/* Header Skeleton */}
                    <div className='bg-gray-200 rounded-2xl h-40 mb-6'></div>

                    {/* Controls Skeleton */}
                    <div className='bg-gray-200 rounded-2xl h-24 mb-6'></div>

                    {/* Layout Grid Skeleton */}
                    <div className='bg-gray-200 rounded-2xl h-[600px]'></div>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white'>
                <div className='flex items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-3 mb-2'>
                            <button
                                onClick={() =>
                                    router.push('/dashboard/warehouses')
                                }
                                className='hover:bg-white/20 p-2 rounded-xl transition'
                            >
                                <svg
                                    className='w-6 h-6'
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
                            <svg
                                className='w-8 h-8'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                                />
                            </svg>
                            <div>
                                <h1 className='text-3xl font-bold'>
                                    Warehouse Layout & Bin Mapping
                                </h1>
                                <p className='text-purple-100 text-sm'>
                                    {warehouse?.name} ({warehouse?.code}) -
                                    Visual 3D Layout
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() =>
                            router.push(
                                `/dashboard/warehouses/${warehouseId}/bins`
                            )
                        }
                        className='bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition shadow-lg flex items-center gap-2'
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
                                d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
                            />
                        </svg>
                        Manage Bins
                    </button>
                </div>
            </div>

            {/* View Mode & Level Selector */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    {/* View Mode Tabs */}
                    <div className='flex items-center gap-2 bg-slate-100 p-1 rounded-xl'>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                                viewMode === 'grid'
                                    ? 'bg-white text-purple-700 shadow-md'
                                    : 'text-slate-600 hover:text-purple-700'
                            }`}
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
                                    d='M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'
                                />
                            </svg>
                            Grid View
                        </button>
                        <button
                            onClick={() => setViewMode('3d')}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                                viewMode === '3d'
                                    ? 'bg-white text-purple-700 shadow-md'
                                    : 'text-slate-600 hover:text-purple-700'
                            }`}
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
                                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                />
                            </svg>
                            3D View
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                                viewMode === 'list'
                                    ? 'bg-white text-purple-700 shadow-md'
                                    : 'text-slate-600 hover:text-purple-700'
                            }`}
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
                                    d='M4 6h16M4 10h16M4 14h16M4 18h16'
                                />
                            </svg>
                            List View
                        </button>
                    </div>

                    {/* Level Selector */}
                    {viewMode !== 'list' && (
                        <div className='flex items-center gap-3'>
                            <span className='text-sm font-bold text-slate-700'>
                                Floor Level:
                            </span>
                            <div className='flex items-center gap-1'>
                                {Array.from(
                                    { length: maxLevel },
                                    (_, i) => i + 1
                                ).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSelectedLevel(level)}
                                        className={`px-4 py-2 rounded-lg font-bold transition ${
                                            selectedLevel === level
                                                ? 'bg-purple-600 text-white shadow-lg'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        L{level}
                                    </button>
                                ))}
                            </div>
                            <div className='text-sm text-slate-600'>
                                ({getLevelBins(selectedLevel).length} bins)
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
                <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                    <svg
                        className='w-5 h-5 text-purple-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                    >
                        <path
                            fillRule='evenodd'
                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                            clipRule='evenodd'
                        />
                    </svg>
                    Occupancy Legend
                </h3>
                <div className='grid grid-cols-2 md:grid-cols-6 gap-4'>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-white border-2 border-emerald-300 rounded-lg'></div>
                        <span className='text-sm font-medium text-slate-700'>
                            Empty (0%)
                        </span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-emerald-100 border-2 border-emerald-400 rounded-lg'></div>
                        <span className='text-sm font-medium text-slate-700'>
                            Low (&lt;50%)
                        </span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-amber-100 border-2 border-amber-400 rounded-lg'></div>
                        <span className='text-sm font-medium text-slate-700'>
                            Medium (50-79%)
                        </span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-orange-100 border-2 border-orange-400 rounded-lg'></div>
                        <span className='text-sm font-medium text-slate-700'>
                            High (80-99%)
                        </span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-red-100 border-2 border-red-400 rounded-lg'></div>
                        <span className='text-sm font-medium text-slate-700'>
                            Full (100%)
                        </span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-slate-200 border-2 border-slate-300 rounded-lg'></div>
                        <span className='text-sm font-medium text-slate-700'>
                            Inactive
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout Views */}
            {viewMode === 'grid' && (
                <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
                    <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                        <svg
                            className='w-6 h-6 text-purple-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'
                            />
                        </svg>
                        Level {selectedLevel} - Grid Layout
                    </h2>

                    {bins.length === 0 ? (
                        <div className='text-center py-12'>
                            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg
                                    className='w-8 h-8 text-slate-400'
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
                            <p className='text-lg font-semibold text-slate-900'>
                                No bins configured
                            </p>
                            <p className='text-sm text-slate-600 mt-1'>
                                Create bins to visualize warehouse layout
                            </p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <div className='inline-block min-w-full'>
                                {/* Column Headers */}
                                <div className='flex mb-2'>
                                    <div className='w-16 flex-shrink-0'></div>
                                    {Array.from(
                                        { length: maxColumn },
                                        (_, i) => i + 1
                                    ).map((col) => (
                                        <div
                                            key={col}
                                            className='w-24 flex-shrink-0 text-center font-bold text-sm text-slate-600'
                                        >
                                            Col {col}
                                        </div>
                                    ))}
                                </div>

                                {/* Grid Rows */}
                                {Array.from(
                                    { length: maxRow },
                                    (_, i) => i + 1
                                ).map((row) => (
                                    <div key={row} className='flex mb-2'>
                                        <div className='w-16 flex-shrink-0 flex items-center justify-center font-bold text-sm text-slate-600'>
                                            Row {row}
                                        </div>
                                        {Array.from(
                                            { length: maxColumn },
                                            (_, i) => i + 1
                                        ).map((col) => {
                                            const bin = getBinAtPosition(
                                                row,
                                                col,
                                                selectedLevel
                                            );
                                            return (
                                                <div
                                                    key={`${row}-${col}`}
                                                    onClick={() =>
                                                        handleBinClick(bin)
                                                    }
                                                    className={`w-24 h-24 flex-shrink-0 mr-2 border-2 rounded-lg transition-all cursor-pointer ${getOccupancyColor(
                                                        bin
                                                    )} ${
                                                        bin
                                                            ? 'hover:scale-105 hover:shadow-lg'
                                                            : ''
                                                    }`}
                                                >
                                                    {bin ? (
                                                        <div className='p-2 h-full flex flex-col justify-between'>
                                                            <div>
                                                                <div className='text-xs font-bold text-slate-900 truncate'>
                                                                    {bin.code}
                                                                </div>
                                                                <div className='text-[10px] text-slate-600 truncate'>
                                                                    {bin.name}
                                                                </div>
                                                            </div>
                                                            <div className='text-right'>
                                                                <div className='text-xs font-bold text-slate-900'>
                                                                    {
                                                                        bin.currentQty
                                                                    }
                                                                    /
                                                                    {
                                                                        bin.maxCapacity
                                                                    }
                                                                </div>
                                                                <div className='text-[10px] font-bold text-purple-600'>
                                                                    {getOccupancyPercentage(
                                                                        bin
                                                                    )}
                                                                    %
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className='h-full flex items-center justify-center text-slate-400'>
                                                            <svg
                                                                className='w-8 h-8'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                viewBox='0 0 24 24'
                                                            >
                                                                <path
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    strokeWidth={
                                                                        1
                                                                    }
                                                                    d='M6 18L18 6M6 6l12 12'
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {viewMode === '3d' && (
                <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
                    <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                        <svg
                            className='w-6 h-6 text-purple-600'
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
                        Level {selectedLevel} - 3D Isometric View
                    </h2>

                    {/* Zoom Controls */}
                    <div className='flex justify-end gap-2 mb-4'>
                        <button
                            onClick={() =>
                                setZoomLevel(Math.max(0.5, zoomLevel - 0.1))
                            }
                            className='px-4 py-2 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition font-bold flex items-center gap-2'
                            title='Zoom Out'
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
                                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7'
                                />
                            </svg>
                            Zoom Out
                        </button>
                        <span className='px-4 py-2 bg-slate-100 border-2 border-slate-300 rounded-lg font-bold flex items-center'>
                            {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                            onClick={() =>
                                setZoomLevel(Math.min(2, zoomLevel + 0.1))
                            }
                            className='px-4 py-2 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition font-bold flex items-center gap-2'
                            title='Zoom In'
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
                                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                                />
                            </svg>
                            Zoom In
                        </button>
                        <button
                            onClick={handleResetView}
                            className='px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-bold'
                            title='Reset Zoom'
                        >
                            Reset
                        </button>
                    </div>

                    <div
                        className='flex justify-center items-center min-h-[500px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 overflow-hidden cursor-move'
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div
                            className='relative transition-transform duration-200 pointer-events-none'
                            style={{
                                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel}) rotateX(60deg) rotateZ(45deg)`,
                                transformStyle: 'preserve-3d',
                                left: `${-((maxColumn * 70) / 2)}px`,
                                top: `${-((maxRow * 70) / 2)}px`,
                            }}
                        >
                            {Array.from(
                                { length: maxRow },
                                (_, i) => i + 1
                            ).map((row) =>
                                Array.from(
                                    { length: maxColumn },
                                    (_, i) => i + 1
                                ).map((col) => {
                                    const bin = getBinAtPosition(
                                        row,
                                        col,
                                        selectedLevel
                                    );
                                    return (
                                        <div
                                            key={`${row}-${col}`}
                                            onClick={() => handleBinClick(bin)}
                                            className={`absolute border-2 rounded cursor-pointer transition-all hover:scale-110 pointer-events-auto ${getOccupancyColor(
                                                bin
                                            )}`}
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                left: `${col * 70}px`,
                                                top: `${row * 70}px`,
                                                transform: `translateZ(${
                                                    bin ? bin.currentQty : 0
                                                }px)`,
                                            }}
                                        >
                                            {bin && (
                                                <div className='p-1 text-center'>
                                                    <div className='text-[8px] font-bold'>
                                                        {bin.code}
                                                    </div>
                                                    <div className='text-[7px]'>
                                                        {bin.currentQty}/
                                                        {bin.maxCapacity}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'list' && (
                <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6'>
                    <h2 className='text-xl font-bold text-slate-900 mb-6'>
                        All Bins - List View
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {bins.map((bin) => (
                            <div
                                key={bin.id}
                                onClick={() => handleBinClick(bin)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${getOccupancyColor(
                                    bin
                                )}`}
                            >
                                <div className='flex items-start justify-between mb-3'>
                                    <div>
                                        <div className='font-bold text-lg text-slate-900'>
                                            {bin.code}
                                        </div>
                                        <div className='text-sm text-slate-600'>
                                            {bin.name}
                                        </div>
                                    </div>
                                    <div className='flex gap-1'>
                                        <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-bold'>
                                            R{bin.row}
                                        </span>
                                        <span className='px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-bold'>
                                            C{bin.column}
                                        </span>
                                        <span className='px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-bold'>
                                            L{bin.level}
                                        </span>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='flex-1 bg-slate-200 rounded-full h-2'>
                                        <div
                                            className='bg-purple-600 rounded-full h-2 transition-all'
                                            style={{
                                                width: `${getOccupancyPercentage(
                                                    bin
                                                )}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <span className='text-xs font-bold text-purple-600'>
                                        {getOccupancyPercentage(bin)}%
                                    </span>
                                </div>
                                <div className='flex items-center justify-between text-sm'>
                                    <span className='text-slate-600'>
                                        {bin.currentQty} / {bin.maxCapacity}{' '}
                                        units
                                    </span>
                                    {bin.active ? (
                                        <span className='text-emerald-600 font-medium'>
                                            Active
                                        </span>
                                    ) : (
                                        <span className='text-slate-500'>
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bin Details Modal */}
            {showBinDetails && selectedBin && (
                <div
                    className='fixed top-0 left-0 right-0 bottom-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[100000] p-4'
                    onClick={() => setShowBinDetails(false)}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        margin: 0,
                        padding: '1rem',
                        zIndex: 100000,
                    }}
                >
                    <div
                        className='bg-white rounded-2xl max-w-2xl w-full shadow-2xl'
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className='bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 rounded-t-2xl'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h3 className='text-2xl font-bold text-white'>
                                        {selectedBin.code}
                                    </h3>
                                    <p className='text-purple-100 text-sm'>
                                        {selectedBin.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowBinDetails(false)}
                                    className='text-white hover:bg-white/20 p-2 rounded-xl transition'
                                >
                                    <svg
                                        className='w-6 h-6'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className='p-8 space-y-6'>
                            {/* 3D Coordinates */}
                            <div>
                                <h4 className='text-sm font-bold text-slate-700 mb-3'>
                                    3D Coordinates
                                </h4>
                                <div className='grid grid-cols-3 gap-4'>
                                    <div className='bg-blue-50 p-4 rounded-xl border border-blue-200'>
                                        <div className='text-xs text-blue-600 font-medium'>
                                            Row
                                        </div>
                                        <div className='text-2xl font-bold text-blue-900'>
                                            {selectedBin.row}
                                        </div>
                                    </div>
                                    <div className='bg-green-50 p-4 rounded-xl border border-green-200'>
                                        <div className='text-xs text-green-600 font-medium'>
                                            Column
                                        </div>
                                        <div className='text-2xl font-bold text-green-900'>
                                            {selectedBin.column}
                                        </div>
                                    </div>
                                    <div className='bg-purple-50 p-4 rounded-xl border border-purple-200'>
                                        <div className='text-xs text-purple-600 font-medium'>
                                            Level
                                        </div>
                                        <div className='text-2xl font-bold text-purple-900'>
                                            {selectedBin.level}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Capacity Info */}
                            <div>
                                <h4 className='text-sm font-bold text-slate-700 mb-3'>
                                    Capacity Information
                                </h4>
                                <div className='bg-slate-50 p-4 rounded-xl border border-slate-200'>
                                    <div className='flex items-center justify-between mb-2'>
                                        <span className='text-sm text-slate-600'>
                                            Current Stock
                                        </span>
                                        <span className='text-lg font-bold text-slate-900'>
                                            {selectedBin.currentQty} units
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between mb-3'>
                                        <span className='text-sm text-slate-600'>
                                            Max Capacity
                                        </span>
                                        <span className='text-lg font-bold text-slate-900'>
                                            {selectedBin.maxCapacity} units
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <div className='flex-1 bg-slate-200 rounded-full h-3'>
                                            <div
                                                className={`rounded-full h-3 transition-all ${
                                                    getOccupancyPercentage(
                                                        selectedBin
                                                    ) >= 90
                                                        ? 'bg-red-500'
                                                        : getOccupancyPercentage(
                                                              selectedBin
                                                          ) >= 70
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                                }`}
                                                style={{
                                                    width: `${getOccupancyPercentage(
                                                        selectedBin
                                                    )}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <span className='text-lg font-bold text-purple-600'>
                                            {getOccupancyPercentage(
                                                selectedBin
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h4 className='text-sm font-bold text-slate-700 mb-3'>
                                    Status
                                </h4>
                                <div>
                                    {selectedBin.active ? (
                                        <span className='inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800'>
                                            <span className='w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse'></span>
                                            Active
                                        </span>
                                    ) : (
                                        <span className='inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-800'>
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className='flex gap-3 pt-4 border-t'>
                                <button
                                    onClick={() => {
                                        setShowBinDetails(false);
                                        router.push(
                                            `/dashboard/warehouses/${warehouseId}/bins`
                                        );
                                    }}
                                    className='flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold'
                                >
                                    Manage This Bin
                                </button>
                                <button
                                    onClick={() => setShowBinDetails(false)}
                                    className='px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
