# Custom Alert Component - Usage Guide

## Overview

Custom Alert component yang modern, reusable, dan mudah digunakan untuk menggantikan `alert()` dan `confirm()` bawaan browser.

## Files

-   **Component**: `src/components/Alert.tsx`
-   **Hook**: `src/hooks/useAlert.ts`

## Features

✅ Modern UI dengan animasi smooth
✅ 4 tipe alert: success, error, warning, info
✅ Support konfirmasi (confirm dialog)
✅ Keyboard support (ESC untuk close)
✅ Fully customizable
✅ TypeScript support

## Usage

### 1. Import hook

```tsx
import { useAlert } from '@/hooks/useAlert';
import Alert from '@/components/Alert';
```

### 2. Setup hook dalam component

```tsx
export default function MyPage() {
    const {
        alertConfig,
        isOpen: isAlertOpen,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        closeAlert,
    } = useAlert();

    // ... your code
}
```

### 3. Add Alert component di JSX

```tsx
return (
    <>
        {/* Alert Component */}
        {alertConfig && (
            <Alert
                isOpen={isAlertOpen}
                onClose={closeAlert}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm}
            />
        )}

        {/* Your page content */}
        <div>...</div>
    </>
);
```

### 4. Gunakan dalam event handler

#### Success Alert

```tsx
showSuccess(
    'Data berhasil disimpan!',
    'Berhasil' // optional title
);
```

#### Error Alert

```tsx
showError(
    'Gagal menyimpan data. Silakan coba lagi.',
    'Error' // optional title
);
```

#### Warning Alert

```tsx
showWarning(
    'Sesi login Anda telah berakhir.',
    'Peringatan' // optional title
);
```

#### Info Alert

```tsx
showInfo(
    'Proses ini akan memakan waktu beberapa menit.',
    'Informasi' // optional title
);
```

#### Confirmation Dialog

```tsx
showConfirm(
    'Apakah Anda yakin ingin menghapus data ini?',
    () => {
        // Action when user clicks confirm
        deleteData();
    },
    'Konfirmasi Hapus' // optional title
);
```

## API Reference

### useAlert Hook

| Method        | Parameters                                                 | Description                   |
| ------------- | ---------------------------------------------------------- | ----------------------------- |
| `showSuccess` | `(message: string, title?: string)`                        | Tampilkan success alert       |
| `showError`   | `(message: string, title?: string)`                        | Tampilkan error alert         |
| `showWarning` | `(message: string, title?: string)`                        | Tampilkan warning alert       |
| `showInfo`    | `(message: string, title?: string)`                        | Tampilkan info alert          |
| `showConfirm` | `(message: string, onConfirm: () => void, title?: string)` | Tampilkan confirmation dialog |
| `closeAlert`  | `()`                                                       | Tutup alert secara manual     |

### Alert Component Props

| Prop          | Type                                          | Default   | Description             |
| ------------- | --------------------------------------------- | --------- | ----------------------- |
| `isOpen`      | `boolean`                                     | -         | Control visibility      |
| `onClose`     | `() => void`                                  | -         | Callback saat close     |
| `title`       | `string`                                      | -         | Judul alert (optional)  |
| `message`     | `string`                                      | -         | Pesan alert             |
| `type`        | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'`  | Tipe alert              |
| `confirmText` | `string`                                      | `'OK'`    | Text tombol confirm     |
| `cancelText`  | `string`                                      | `'Batal'` | Text tombol cancel      |
| `showCancel`  | `boolean`                                     | `false`   | Tampilkan tombol cancel |
| `onConfirm`   | `() => void`                                  | -         | Callback saat confirm   |

## Examples

### Replace native alert()

```tsx
// Before
alert('Data berhasil disimpan!');

// After
showSuccess('Data berhasil disimpan!');
```

### Replace native confirm()

```tsx
// Before
if (confirm('Hapus data ini?')) {
    deleteData();
}

// After
showConfirm('Hapus data ini?', () => deleteData(), 'Konfirmasi');
```

### Multi-line message

```tsx
showInfo(
    'Langkah-langkah:\n\n1. Pilih item\n2. Input quantity\n3. Klik simpan',
    'Panduan'
);
```

## Styling

Alert menggunakan Tailwind CSS dan sudah responsive. Setiap tipe memiliki warna yang berbeda:

-   **Success**: Green
-   **Error**: Red
-   **Warning**: Yellow
-   **Info**: Blue

## Notes

-   Alert otomatis close saat user klik tombol atau tekan ESC
-   Untuk confirmation, callback `onConfirm` akan dipanggil sebelum alert close
-   Multi-line message didukung dengan `\n`
-   Alert menggunakan z-index 100000 untuk memastikan selalu di atas
