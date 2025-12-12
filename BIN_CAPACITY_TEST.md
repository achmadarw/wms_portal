# Bin Capacity Validation Test

## Problem

User dapat membuat movement INBOUND dengan quantity 1000 ke bin yang hanya memiliki kapasitas 100.

## Root Cause Analysis

1. ✅ Validasi bin capacity sudah ada di `validateMovement()` function
2. ✅ `validateMovement()` dipanggil sebelum `createMovement()` di API
3. ⚠️ **POTENTIAL ISSUE**: Jika `maxCapacity` adalah 0, validasi tidak akan berjalan (diperbaiki dengan pengecekan `maxCapacity > 0`)

## Fix Applied

1. **movement-manager.ts**:

    - Ubah `const maxCapacity = toBin.maxCapacity || 0` menjadi `const maxCapacity = toBin.maxCapacity`
    - Tambahkan kondisi `if (maxCapacity && maxCapacity > 0)` untuk memastikan validasi hanya berjalan jika bin memiliki batasan kapasitas
    - Tambahkan logging detail untuk debugging

2. **route.ts**:
    - Tambahkan logging pada konversi bin code ke ID
    - Tambahkan logging pada hasil validasi

## Test Cases

### Test 1: INBOUND dengan quantity melebihi capacity

-   Bin capacity: 100
-   Current qty: 0
-   Pending qty: 0
-   Request qty: 1000
-   **Expected**: ❌ Error "insufficient capacity. Available space: 100 units, Required: 1000 units"

### Test 2: INBOUND dengan quantity pas di batas capacity

-   Bin capacity: 100
-   Current qty: 0
-   Pending qty: 0
-   Request qty: 100
-   **Expected**: ✅ Success

### Test 3: INBOUND dengan pending movement

-   Bin capacity: 100
-   Current qty: 0
-   Pending qty: 60
-   Request qty: 50
-   **Expected**: ❌ Error "insufficient capacity. Available space: 40 units, Required: 50 units, Pending: 60"

### Test 4: INBOUND dengan bin unlimited capacity (maxCapacity = 0)

-   Bin capacity: 0
-   Current qty: 0
-   Request qty: 10000
-   **Expected**: ✅ Success (no capacity limit)

## Debugging Steps

1. Check terminal logs for `[DEBUG] Converted toBin code to ID`
2. Check terminal logs for `[VALIDATE] Bin capacity check`
3. Check terminal logs for `[VALIDATE] Capacity calculation`
4. Check terminal logs for `[DEBUG] Validation result`

## Expected Log Output (for failing case)

```
[DEBUG] Converted toBin code to ID: { code: 'A-01-01', id: 'xxx', maxCapacity: 100, currentQty: 0 }
[VALIDATE] Bin capacity check: { binCode: 'A-01-01', binId: 'xxx', currentOccupancy: 0, maxCapacity: 100, requestedQty: 1000, movementType: 'INBOUND' }
[VALIDATE] Capacity calculation: { pendingQty: 0, plannedOccupancy: 0, availableSpace: 100, willExceed: true }
[VALIDATE] Capacity error: Destination bin "A-01-01" has insufficient capacity. Available space: 100 units, Required: 1000 units, Current occupancy: 0/100
[DEBUG] Validation result: { valid: false, errors: [...], params: { type: 'INBOUND', quantity: 1000, toBinId: 'xxx' } }
```

## Next Steps

1. Restart development server untuk memastikan perubahan terload
2. Test dengan create INBOUND movement quantity 1000 ke bin capacity 100
3. Periksa logs di terminal
4. Verifikasi error message muncul di Alert modal
