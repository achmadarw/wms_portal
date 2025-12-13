# UPDATE: RETURN Movement - Warehouse & Bin Filtering

## 🎯 Masalah yang Diperbaiki

Sebelumnya, untuk movement RETURN:

-   ❌ Dropdown warehouse menampilkan **semua warehouse**
-   ❌ Dropdown bin menampilkan **semua bin di warehouse**

Seharusnya:

-   ✅ Dropdown warehouse hanya menampilkan **warehouse yang pernah melakukan OUTBOUND untuk item tersebut**
-   ✅ Dropdown bin hanya menampilkan **bin yang pernah menjadi sumber OUTBOUND (fromBin) untuk item tersebut**

## 🔧 Perubahan yang Dilakukan

### File: `/api/movements/available-bins/route.ts`

**Sebelum:**

```typescript
// For INBOUND and RETURN, return all warehouses and bins
if (movementType === 'INBOUND' || movementType === 'RETURN') {
    const warehouses = await prisma.warehouse.findMany({
        where: { active: true },
        include: {
            bins: {
                where: { active: true },
                // ... menampilkan SEMUA bin
            },
        },
    });
    return successResponse({ warehouses });
}
```

**Sesudah:**

```typescript
// For INBOUND, return all warehouses and bins
if (movementType === 'INBOUND') {
    // ... all warehouses & bins
}

// For RETURN, only show warehouses/bins where this item was OUTBOUNDed
if (movementType === 'RETURN') {
    // Get all completed OUTBOUND movements for this item
    const outboundMovements = await prisma.movement.findMany({
        where: {
            type: 'OUTBOUND',
            status: 'COMPLETED',
            item: {
                itemMasterId: itemId,
            },
        },
        select: {
            warehouseId: true,
            fromBin: true,
            warehouse: { ... },
        },
    });

    // Group by warehouse and collect bin codes from OUTBOUND
    // Only return warehouses and bins that were used in OUTBOUND
}
```

## 📊 Logika Filter RETURN

### 1. Warehouse Filtering

-   Query semua movement dengan:
    -   `type = 'OUTBOUND'`
    -   `status = 'COMPLETED'`
    -   `item.itemMasterId = itemId` (item yang dipilih user)
-   Extract unique `warehouseId` dari hasil query
-   Hanya tampilkan warehouse yang ada dalam list ini

### 2. Bin Filtering

-   Dari movement OUTBOUND yang sama, extract `fromBin`
-   Collect unique bin codes per warehouse
-   Query bin details berdasarkan:
    -   `warehouseId` (dari warehouse yang di-filter)
    -   `code IN (binCodes)` (bin yang pernah OUTBOUND)
    -   `active = true`
-   Hanya tampilkan bin-bin ini di dropdown

## 🎯 Alur User Experience

### Skenario: User ingin RETURN item "Anker Hub"

1. **Pilih Movement Type: RETURN** ✅
2. **Pilih Item: "Anker 7-in-1 USB-C Hub"** ✅

    - Dropdown hanya menampilkan item yang pernah OUTBOUND

3. **Pilih Warehouse** ✅

    - Dropdown **HANYA** menampilkan:
        - "Gudang Bandung" (jika pernah OUTBOUND dari sini)
        - "Gudang Jakarta" (jika pernah OUTBOUND dari sini)
    - **TIDAK** menampilkan:
        - "Gudang Surabaya" (jika belum pernah OUTBOUND dari sini)

4. **Pilih Bin** ✅

    - Jika user pilih "Gudang Bandung"
    - Dropdown **HANYA** menampilkan:
        - "A-02-01" (jika pernah OUTBOUND dari bin ini)
        - "B-01-02" (jika pernah OUTBOUND dari bin ini)
    - **TIDAK** menampilkan:
        - "C-03-01" (jika belum pernah OUTBOUND dari bin ini)

5. **Auto-fetch Max Returnable** ✅
    - Setelah warehouse dipilih
    - API: `/api/movements/returnable-quantity?itemId=xxx&warehouseId=yyy`
    - Display info: Total OUTBOUND, Total RETURN, Max Returnable

## ✅ Validasi yang Tetap Berjalan

1. ✅ **Item validation**: Hanya item dengan OUTBOUND history
2. ✅ **Warehouse validation**: Hanya warehouse dengan OUTBOUND history untuk item ini
3. ✅ **Bin validation**: Hanya bin yang pernah jadi sumber OUTBOUND untuk item ini
4. ✅ **Quantity validation**: Tidak boleh melebihi (OUTBOUND - RETURNED) per warehouse
5. ✅ **Bin capacity validation**: Tidak boleh melebihi kapasitas bin tujuan
6. ✅ **Real-time feedback**: Display info dan error messages

## 🧪 Testing Checklist

### Test 1: Warehouse Filtering

-   [ ] Buat OUTBOUND dari "Gudang A" untuk item "X"
-   [ ] Buat RETURN untuk item "X"
-   [ ] Dropdown warehouse **HANYA** menampilkan "Gudang A" ✅
-   [ ] Gudang lain **TIDAK** muncul ✅

### Test 2: Bin Filtering

-   [ ] OUTBOUND item "X" dari bin "A-01-01" dan "A-02-01" di Gudang A
-   [ ] Buat RETURN untuk item "X" di Gudang A
-   [ ] Dropdown bin **HANYA** menampilkan "A-01-01" dan "A-02-01" ✅
-   [ ] Bin lain di Gudang A **TIDAK** muncul ✅

### Test 3: Multiple Warehouse

-   [ ] OUTBOUND item "X" dari "Gudang A" dan "Gudang B"
-   [ ] Buat RETURN untuk item "X"
-   [ ] Dropdown warehouse menampilkan "Gudang A" dan "Gudang B" ✅
-   [ ] Gudang lain **TIDAK** muncul ✅

### Test 4: Max Returnable per Warehouse

-   [ ] OUTBOUND 100 unit dari Gudang A
-   [ ] OUTBOUND 50 unit dari Gudang B
-   [ ] RETURN 30 unit ke Gudang A
-   [ ] Buat RETURN baru:
    -   Pilih Gudang A → Max Returnable = 70 (100-30) ✅
    -   Pilih Gudang B → Max Returnable = 50 (50-0) ✅

### Test 5: No OUTBOUND History

-   [ ] Item baru "Y" belum pernah OUTBOUND
-   [ ] Buat RETURN untuk item "Y"
-   [ ] Item "Y" **TIDAK** muncul di dropdown item ✅

## 📁 File yang Diubah

-   ✅ `/api/movements/available-bins/route.ts` - Filter warehouse & bin untuk RETURN

## 🔄 Alur Data Complete

```
User Pilih RETURN
    ↓
User Pilih Item → API: /api/movements/available-items?type=RETURN
    ↓              (Return: Items dengan OUTBOUND history)
    ↓
Dropdown Item     (Filtered: Hanya item yang pernah OUTBOUND)
    ↓
User Pilih Item
    ↓
API: /api/movements/available-bins?itemId=xxx&type=RETURN
    ↓              (Return: Warehouses & bins dengan OUTBOUND history untuk item ini)
    ↓
Dropdown Warehouse (Filtered: Hanya warehouse yang pernah OUTBOUND item ini)
    ↓
User Pilih Warehouse
    ↓
Dropdown Bin      (Filtered: Hanya bin yang pernah jadi fromBin OUTBOUND item ini)
    ↓
API: /api/movements/returnable-quantity?itemId=xxx&warehouseId=yyy
    ↓              (Return: maxReturnable untuk warehouse ini)
    ↓
Display Info Box  (Total OUTBOUND, Total RETURN, Max Returnable)
    ↓
User Input Quantity (Validation: ≤ maxReturnable && ≤ bin capacity)
    ↓
Submit ✅
```

## 💡 Catatan Penting

1. **Warehouse-Specific Returnable**:

    - Max returnable quantity dihitung **per warehouse**
    - Jika item pernah OUTBOUND dari 2 warehouse, masing-masing punya limit sendiri

2. **Bin Selection**:

    - Bin yang ditampilkan adalah bin yang **pernah jadi sumber OUTBOUND**
    - Ini membantu user mengidentifikasi dari mana barang aslinya keluar
    - User **BISA** memilih bin tujuan yang berbeda (toBin) untuk RETURN

3. **Multiple OUTBOUND from Same Bin**:
    - Jika ada multiple OUTBOUND dari bin yang sama
    - Bin tetap hanya muncul 1x di dropdown
    - Max returnable dihitung dari total OUTBOUND - total RETURNED

## 🚀 Benefit

✅ **User Experience Lebih Baik**:

-   User tidak bingung dengan warehouse/bin yang tidak relevan
-   Lebih cepat menemukan warehouse/bin yang benar

✅ **Data Integrity**:

-   Mencegah user RETURN ke warehouse yang salah
-   Validasi lebih ketat dan akurat

✅ **Business Logic**:

-   Sesuai dengan flow bisnis: barang hanya bisa di-RETURN ke warehouse tempat dia keluar
-   Tracking lebih akurat per warehouse
