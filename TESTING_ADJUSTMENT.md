# TESTING GUIDE - ADJUSTMENT FEATURE

## Persiapan Testing

1. **Restart Server**

    ```powershell
    # Stop server (Ctrl+C)
    npm run dev
    ```

2. **Buka Browser Console** (F12)
    - Pastikan Console tab terbuka untuk melihat log

## Test Cases

### Test 1: Input Karakter + dan -

**Tujuan:** Memverifikasi user bisa mengetik + dan - di input field

**Langkah:**

1. Pilih movement type: ADJUSTMENT
2. Pilih item yang ada stocknya (misal: stok saat ini = 40)
3. Di input Quantity, coba ketik:
    - `+` → harus muncul di input ✅
    - `+5` → harus muncul di input ✅
    - `-` → harus muncul di input ✅
    - `-5` → harus muncul di input ✅
    - `50` → harus muncul di input ✅

**Expected Result:**

-   Semua karakter +, -, dan angka bisa diketik
-   Preview hasil muncul secara real-time

---

### Test 2: Input Relatif Positif (+)

**Kondisi Awal:**

-   Stok saat ini: 40 unit
-   Bin capacity: 100 unit

**Langkah:**

1. Input: `+10`
2. Lihat preview: Harus tampil "Hasil: 50 unit" (hijau) ✅
3. Submit form
4. Lihat Console browser untuk log:
    ```
    [ADJUSTMENT FRONTEND] Input received: { inputValue: "+10", currentQty: 40, isRelative: true }
    [ADJUSTMENT FRONTEND] Converting relative to absolute: { input: "+10", currentQty: 40, adjustment: 10, finalQuantity: 50 }
    ```
5. Process movement
6. Lihat Console server untuk log:
    ```
    [ADJUSTMENT CREATE] Storing delta: { currentQty: 40, targetAbsoluteQty: 50, delta: 10, ... }
    [ADJUSTMENT PROCESS] Processing adjustment: { oldQuantity: 40, quantityDelta: 10, newQuantity: 50, ... }
    [ADJUSTMENT PROCESS] Inventory updated to: 50
    [ADJUSTMENT PROCESS] Updating bin quantity: { willIncrement: true, amount: 10 }
    [ADJUSTMENT PROCESS] Bin quantity updated successfully: { newBinQty: 50 }
    ```

**Expected Result:**

-   Movement list menampilkan: `+10` (hijau)
-   Inventory quantity: 40 → 50 ✅
-   Bin currentQty: 40 → 50 ✅

---

### Test 3: Input Relatif Negatif (-)

**Kondisi Awal:**

-   Stok saat ini: 40 unit
-   Bin capacity: 100 unit

**Langkah:**

1. Input: `-5`
2. Lihat preview: Harus tampil "Hasil: 35 unit" (hijau) ✅
3. Submit form
4. Lihat Console browser untuk log:
    ```
    [ADJUSTMENT FRONTEND] Input received: { inputValue: "-5", currentQty: 40, isRelative: true }
    [ADJUSTMENT FRONTEND] Converting relative to absolute: { input: "-5", currentQty: 40, adjustment: -5, finalQuantity: 35 }
    ```
5. Process movement
6. Lihat Console server untuk log:
    ```
    [ADJUSTMENT CREATE] Storing delta: { currentQty: 40, targetAbsoluteQty: 35, delta: -5, ... }
    [ADJUSTMENT PROCESS] Processing adjustment: { oldQuantity: 40, quantityDelta: -5, newQuantity: 35, ... }
    [ADJUSTMENT PROCESS] Inventory updated to: 35
    [ADJUSTMENT PROCESS] Updating bin quantity: { willIncrement: false, amount: 5 }
    [ADJUSTMENT PROCESS] Bin quantity updated successfully: { newBinQty: 35 }
    ```

**Expected Result:**

-   Movement list menampilkan: `-5` (merah)
-   Inventory quantity: 40 → 35 ✅
-   Bin currentQty: 40 → 35 ✅

---

### Test 4: Input Absolut

**Kondisi Awal:**

-   Stok saat ini: 40 unit
-   Bin capacity: 100 unit

**Langkah:**

1. Input: `25`
2. Lihat preview: Harus tampil "Hasil: 25 unit" (hijau) ✅
3. Submit form
4. Lihat Console browser untuk log:
    ```
    [ADJUSTMENT FRONTEND] Input received: { inputValue: "25", currentQty: 40, isRelative: false }
    [ADJUSTMENT FRONTEND] Using absolute value: { input: "25", finalQuantity: 25 }
    ```
5. Process movement
6. Lihat Console server untuk log:
    ```
    [ADJUSTMENT CREATE] Storing delta: { currentQty: 40, targetAbsoluteQty: 25, delta: -15, ... }
    [ADJUSTMENT PROCESS] Processing adjustment: { oldQuantity: 40, quantityDelta: -15, newQuantity: 25, ... }
    [ADJUSTMENT PROCESS] Inventory updated to: 25
    [ADJUSTMENT PROCESS] Updating bin quantity: { willIncrement: false, amount: 15 }
    [ADJUSTMENT PROCESS] Bin quantity updated successfully: { newBinQty: 25 }
    ```

**Expected Result:**

-   Movement list menampilkan: `-15` (merah) karena delta = 25 - 40 = -15
-   Inventory quantity: 40 → 25 ✅
-   Bin currentQty: 40 → 25 ✅

---

### Test 5: Validasi - Hasil Negatif (Harus Diblokir)

**Kondisi Awal:**

-   Stok saat ini: 40 unit

**Langkah:**

1. Input: `-50`
2. Lihat preview: Harus tampil "Hasil: -10 unit" (merah) dengan pesan error ❌
3. Input tidak bisa diketik lebih lanjut (diblokir)

**Expected Result:**

-   Input diblokir saat hasil < 0
-   Submit button tetap disabled atau error muncul

---

### Test 6: Validasi - Melebihi Kapasitas (Harus Diblokir)

**Kondisi Awal:**

-   Stok saat ini: 40 unit
-   Bin capacity: 100 unit

**Langkah:**

1. Input: `+70`
2. Lihat preview: Harus tampil "Hasil: 110 unit" (merah) dengan pesan error ❌
3. Input tidak bisa diketik lebih lanjut (diblokir)

**Expected Result:**

-   Input diblokir saat hasil > maxCapacity
-   Submit button tetap disabled atau error muncul

---

## Verifikasi Akhir

Jalankan script untuk mengecek data:

```powershell
node scripts/check-adjustments.mjs
```

Pastikan:

-   ✅ Inventory quantity match dengan bin currentQty
-   ✅ Movement list menampilkan delta dengan tanda +/-
-   ✅ Semua log menunjukkan nilai yang konsisten

---

## Troubleshooting

### Input +/- Tidak Bisa Diketik

-   **Penyebab:** `onKeyDown` handler masih memblokir
-   **Solusi:** Sudah diperbaiki - restart server

### Bin Quantity Tidak Update

-   **Penyebab:** Backend tidak menerima delta dengan benar
-   **Solusi:** Periksa log `[ADJUSTMENT CREATE]` dan `[ADJUSTMENT PROCESS]`

### Hasil Perhitungan Salah

-   **Penyebab:** Frontend tidak mengirim absolute value
-   **Solusi:** Periksa log `[ADJUSTMENT FRONTEND]` di browser console
