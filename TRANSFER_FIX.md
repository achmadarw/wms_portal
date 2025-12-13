# TRANSFER Movement Fix

## Problem

User melakukan TRANSFER movement dari Bin A ke Bin B, tapi data tidak muncul di inventory bin destination.

## Root Cause

Logika TRANSFER lama (broken):

```typescript
case 'TRANSFER':
    // SALAH - hanya update binId, violate unique constraint
    await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { binId: toBin }
    });
```

**Masalah:**

-   InventoryItem memiliki unique constraint: `[itemMasterId, warehouseId, binId]`
-   Tidak bisa hanya update `binId` karena akan duplicate
-   Quantity tidak ter-transfer antara bins

## Fix Applied

### 1. Backend Logic (movement-manager.ts)

Logika TRANSFER yang benar:

```typescript
case 'TRANSFER':
    // 1. Check if destination bin already has this item
    const destItem = await tx.inventoryItem.findFirst({
        where: {
            itemMasterId: inventoryItem.itemMasterId,
            warehouseId: inventoryItem.warehouseId,
            binId: toBin
        }
    });

    if (destItem) {
        // 2a. Destination exists - increment quantity
        await tx.inventoryItem.update({
            where: { id: destItem.id },
            data: {
                quantity: { increment: quantity },
                availableQty: { increment: quantity }
            }
        });
    } else {
        // 2b. Destination doesn't exist - create new inventory
        await tx.inventoryItem.create({
            data: {
                itemMasterId: inventoryItem.itemMasterId,
                warehouseId: inventoryItem.warehouseId,
                binId: toBin,
                quantity: quantity,
                availableQty: quantity,
                reservedQty: 0
            }
        });
    }

    // 3. Decrement from source bin
    await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
            quantity: { decrement: quantity },
            availableQty: { decrement: quantity }
        }
    });
```

### 2. Fix Existing Broken Data

Run this script to fix already broken transfers:

```bash
cd wms_portal
node fix-transfer-movements.js
```

Script akan:

1. Scan semua TRANSFER movements yang COMPLETED
2. Check apakah destination bin sudah punya quantity
3. Jika belum, transfer quantity dari source ke destination
4. Update bin quantities

## Testing

### Test Case 1: TRANSFER - Destination bin kosong

**Before:**

-   Bin A: Item X = 10 pcs
-   Bin B: Item X = 0 pcs (no record)

**Create TRANSFER:**

-   From: Bin A
-   To: Bin B
-   Quantity: 5

**After Process:**

-   Bin A: Item X = 5 pcs ✅
-   Bin B: Item X = 5 pcs ✅ (new record created)

### Test Case 2: TRANSFER - Destination bin sudah ada item

**Before:**

-   Bin A: Item X = 10 pcs
-   Bin B: Item X = 3 pcs

**Create TRANSFER:**

-   From: Bin A
-   To: Bin B
-   Quantity: 5

**After Process:**

-   Bin A: Item X = 5 pcs ✅
-   Bin B: Item X = 8 pcs ✅ (incremented)

### Test Case 3: TRANSFER - All quantity moved

**Before:**

-   Bin A: Item X = 10 pcs
-   Bin B: Item X = 0 pcs

**Create TRANSFER:**

-   From: Bin A
-   To: Bin B
-   Quantity: 10

**After Process:**

-   Bin A: Item X = 0 pcs ✅ (kept for audit trail)
-   Bin B: Item X = 10 pcs ✅

## Related Files

-   `src/lib/movement-manager.ts` - Fixed TRANSFER logic
-   `fix-transfer-movements.js` - Script to fix broken data
