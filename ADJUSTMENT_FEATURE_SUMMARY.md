# Fitur ADJUSTMENT dengan Input Relatif (+/-)

## 📋 Perubahan yang Dilakukan

### 1. **Frontend (page.tsx)**

#### Input Field

-   ✅ Input type diubah menjadi `text` untuk ADJUSTMENT (dari `number`)
-   ✅ Mendukung karakter `+` dan `-` untuk input relatif
-   ✅ Validasi regex: `/^[+-]?\d*$/` (hanya angka dengan opsional +/-)

#### Logika Perhitungan

-   ✅ **Input Relatif** (`+5` atau `-3`): Hitung dari stok saat ini
    -   Contoh: Stok 100, input `-40` → hasil 60 unit
    -   Contoh: Stok 50, input `+10` → hasil 60 unit
-   ✅ **Input Absolut** (`50`): Set langsung ke nilai tersebut
    -   Contoh: Stok 100, input `50` → hasil 50 unit

#### Konversi ke Backend

-   ✅ Frontend mengirim **nilai absolut** ke backend
-   ✅ Konversi terjadi sebelum submit:
    ```typescript
    if (inputValue.startsWith('+') || inputValue.startsWith('-')) {
        // Relative: convert to absolute
        finalQuantity = currentQty + parseInt(inputValue);
    } else {
        // Already absolute
        finalQuantity = parseInt(inputValue);
    }
    ```

#### UI/UX

-   ✅ Tampilkan info stok saat ini dan kapasitas maksimum
-   ✅ Real-time preview hasil adjustment dengan warna:
    -   🟢 Hijau: Valid (dalam range 0 - maxCapacity)
    -   🔴 Merah: Invalid (< 0 atau > maxCapacity)
-   ✅ Panduan input dengan contoh (+5, -3, 50)
-   ✅ Validasi langsung: blok input jika hasil keluar range

### 2. **Backend (movement-manager.ts)**

#### Penyimpanan Movement

-   ✅ Movement.quantity menyimpan **delta (perubahan)**, bukan absolut
-   ✅ Saat create movement untuk ADJUSTMENT:
    ```typescript
    movementQuantity = newAbsoluteQty - currentQty; // Store delta
    ```
    -   Contoh: Stok 100 → 60, tersimpan `-40`
    -   Contoh: Stok 50 → 60, tersimpan `+10`

#### Process Movement

-   ✅ Saat process ADJUSTMENT, gunakan delta yang tersimpan:
    ```typescript
    const quantityDelta = movement.quantity; // Already delta
    const newQuantity = oldQuantity + quantityDelta;
    ```

#### Update Inventory & Bin

-   ✅ **Inventory**: Update ke quantity baru
    ```typescript
    await tx.inventoryItem.update({
        data: {
            quantity: newQuantity,
            availableQty: newQuantity,
        },
    });
    ```
-   ✅ **Bin**: Update berdasarkan delta
    ```typescript
    const binUpdateData =
        quantityDelta > 0
            ? { increment: quantityDelta }
            : { decrement: Math.abs(quantityDelta) };
    ```

#### Validasi

-   ✅ Quantity target tidak boleh negatif
-   ✅ Quantity target tidak boleh melebihi bin capacity
-   ✅ Validasi di frontend mencegah input invalid sebelum submit

### 3. **Tampilan Movement List**

#### Display Logic

-   ✅ Semua movement (termasuk ADJUSTMENT) menampilkan quantity dengan tanda:
    -   Positif: `+40` (hijau)
    -   Negatif: `-40` (merah)
    -   Nol: `0` (abu-abu)
-   ✅ Color coding berdasarkan nilai:
    ```typescript
    className={
        movement.quantity > 0 ? 'text-green-600' :
        movement.quantity < 0 ? 'text-red-600' :
        'text-slate-600'
    }
    ```

## 🎯 Alur Lengkap

### Skenario 1: Pengurangan Stok

1. **User**: Stok saat ini 100, input `-40`
2. **Frontend**: Konversi ke absolut: 100 + (-40) = 60
3. **Backend Create**: Simpan delta: 60 - 100 = `-40`
4. **Backend Process**: Update inventory: 100 + (-40) = 60
5. **Backend Process**: Update bin: decrement 40
6. **Display**: Tampilkan `-40` dengan warna merah

### Skenario 2: Penambahan Stok

1. **User**: Stok saat ini 50, input `+10`
2. **Frontend**: Konversi ke absolut: 50 + 10 = 60
3. **Backend Create**: Simpan delta: 60 - 50 = `+10`
4. **Backend Process**: Update inventory: 50 + 10 = 60
5. **Backend Process**: Update bin: increment 10
6. **Display**: Tampilkan `+10` dengan warna hijau

### Skenario 3: Set Absolut

1. **User**: Stok saat ini 100, input `50`
2. **Frontend**: Sudah absolut: 50
3. **Backend Create**: Simpan delta: 50 - 100 = `-50`
4. **Backend Process**: Update inventory: 100 + (-50) = 50
5. **Backend Process**: Update bin: decrement 50
6. **Display**: Tampilkan `-50` dengan warna merah

## ✅ Checklist Fitur

-   [x] User bisa memasukkan karakter `+` atau `-`
-   [x] Perhitungan benar: `-40` berarti kurangi 40 (bukan set ke 40)
-   [x] Tampilan list menunjukkan `+40` atau `-40` sesuai perubahan
-   [x] Stock di bin terupdate dengan benar
-   [x] Inventory terupdate dengan benar
-   [x] Validasi frontend mencegah input invalid
-   [x] Backend validasi nilai target tidak negatif
-   [x] Backend validasi tidak melebihi bin capacity
-   [x] UI menampilkan preview hasil real-time
-   [x] Color coding untuk valid/invalid input

## 🚀 Testing Checklist

1. ✅ Test input `+10`: Stok bertambah 10
2. ✅ Test input `-5`: Stok berkurang 5
3. ✅ Test input `50`: Stok set ke 50
4. ✅ Test input `-100` dengan stok 50: Diblokir (hasil negatif)
5. ✅ Test input `+200` dengan capacity 100: Diblokir (melebihi kapasitas)
6. ✅ Verifikasi bin quantity sync dengan inventory
7. ✅ Verifikasi movement list menampilkan +/- dengan benar
8. ✅ Test multiple adjustment berturut-turut
