'use client';

import { useState, useCallback } from 'react';

interface AlertConfig {
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
}

export function useAlert() {
    const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const showAlert = useCallback((config: AlertConfig) => {
        setAlertConfig(config);
        setIsOpen(true);
    }, []);

    const showSuccess = useCallback(
        (message: string, title?: string) => {
            showAlert({
                title: title || 'Berhasil',
                message,
                type: 'success',
            });
        },
        [showAlert]
    );

    const showError = useCallback(
        (message: string, title?: string) => {
            showAlert({
                title: title || 'Error',
                message,
                type: 'error',
            });
        },
        [showAlert]
    );

    const showWarning = useCallback(
        (message: string, title?: string) => {
            showAlert({
                title: title || 'Peringatan',
                message,
                type: 'warning',
            });
        },
        [showAlert]
    );

    const showInfo = useCallback(
        (message: string, title?: string) => {
            showAlert({
                title: title || 'Informasi',
                message,
                type: 'info',
            });
        },
        [showAlert]
    );

    const showConfirm = useCallback(
        (message: string, onConfirm: () => void, title?: string) => {
            showAlert({
                title: title || 'Konfirmasi',
                message,
                type: 'warning',
                showCancel: true,
                onConfirm,
            });
        },
        [showAlert]
    );

    const closeAlert = useCallback(() => {
        setIsOpen(false);
        // Clear config after animation
        setTimeout(() => setAlertConfig(null), 300);
    }, []);

    return {
        alertConfig,
        isOpen,
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        closeAlert,
    };
}
