/**
 * Format number with thousand separators
 * Example: 1000000 -> "1,000,000"
 */
export function formatNumber(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format number to compact notation
 * Example: 1000000 -> "1M", 1500 -> "1.5K"
 */
export function formatCompactNumber(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1_000_000_000) {
        return sign + (absNum / 1_000_000_000).toFixed(1) + 'B';
    } else if (absNum >= 1_000_000) {
        return sign + (absNum / 1_000_000).toFixed(1) + 'M';
    } else if (absNum >= 1_000) {
        return sign + (absNum / 1_000).toFixed(1) + 'K';
    }
    return sign + absNum.toString();
}

/**
 * Format currency (Indonesian Rupiah)
 * Example: 1000000 -> "Rp 1,000,000" (no decimals)
 */
export function formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

/**
 * Format currency to compact notation
 * Example: 1590350000 -> "Rp 1.59B", 1000000 -> "Rp 1M" (no trailing zeros)
 */
export function formatCompactCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Rp 0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1_000_000_000) {
        const billions = absNum / 1_000_000_000;
        return sign + 'Rp ' + Number(billions.toFixed(2)) + 'B';
    } else if (absNum >= 1_000_000) {
        const millions = absNum / 1_000_000;
        return sign + 'Rp ' + Number(millions.toFixed(2)) + 'M';
    } else if (absNum >= 1_000) {
        const thousands = absNum / 1_000;
        return sign + 'Rp ' + Number(thousands.toFixed(1)) + 'K';
    }
    return 'Rp ' + formatNumber(absNum);
}

/**
 * Get responsive font size class based on number length
 */
export function getNumberFontSize(value: number | string): string {
    const str = value.toString().replace(/[,.-]/g, '');
    const length = str.length;

    if (length >= 12) return 'text-xl'; // Very long numbers
    if (length >= 9) return 'text-2xl'; // Billions
    if (length >= 7) return 'text-3xl'; // Millions
    return 'text-3xl'; // Normal
}
