# ADJUSTMENT Bin Quantity Fix

## Problem

When ADJUSTMENT movement was processed, it updated `InventoryItem.quantity` correctly but **failed to update `Bin.currentQty`**, causing a mismatch between inventory and bin records.

### Example Issue

-   User created ADJUSTMENT: change quantity from 50 to 45 in bin A-02-01
-   After processing:
    -   ✅ `InventoryItem.quantity` = 45 (correct)
    -   ❌ `Bin.currentQty` = 50 (incorrect, should be 45)
    -   Difference: 5 units

## Root Cause

The ADJUSTMENT case in `processMovement()` (line 581-595) only updated `InventoryItem` but didn't update the associated `Bin.currentQty`.

Other movement types correctly updated bins:

-   INBOUND/RETURN: increment bin quantity
-   OUTBOUND/DAMAGE: decrement bin quantity
-   TRANSFER: decrement source bin, increment destination bin

ADJUSTMENT was missing from this logic.

## Solution

Updated the ADJUSTMENT case to:

1. Calculate the delta: `quantityDelta = newQuantity - oldQuantity`
2. Update inventory to absolute value (existing behavior)
3. **NEW**: Update bin quantity based on delta
    - If delta > 0: increment bin by delta (stock increased)
    - If delta < 0: decrement bin by absolute delta (stock decreased)
    - If delta = 0: no bin update needed

### Code Changes

**File**: `src/lib/movement-manager.ts`
**Lines**: 581-595

**Before**:

```typescript
case 'ADJUSTMENT':
    // Adjustment sets absolute quantity
    await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
            quantity,
            availableQty: quantity,
        },
    });
    break;
```

**After**:

```typescript
case 'ADJUSTMENT':
    // Adjustment sets absolute quantity
    const oldQuantity = inventoryItem.quantity;
    const quantityDelta = quantity - oldQuantity;

    await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
            quantity,
            availableQty: quantity,
        },
    });

    // Update bin quantity based on the delta
    if (toBin && quantityDelta !== 0) {
        await tx.bin.update({
            where: { id: toBin },
            data: {
                currentQty: {
                    [quantityDelta > 0 ? 'increment' : 'decrement']: Math.abs(quantityDelta),
                },
            },
        });
    }
    break;
```

## Test Scenarios

### Test 1: Decrease Quantity (50 → 45)

-   Old quantity: 50
-   New quantity: 45
-   Delta: -5
-   Expected: Decrement bin by 5
-   Result: Bin.currentQty = 45 ✅

### Test 2: Increase Quantity (45 → 60)

-   Old quantity: 45
-   New quantity: 60
-   Delta: +15
-   Expected: Increment bin by 15
-   Result: Bin.currentQty = 60 ✅

### Test 3: No Change (45 → 45)

-   Old quantity: 45
-   New quantity: 45
-   Delta: 0
-   Expected: No bin update
-   Result: Bin.currentQty = 45 ✅

## Related Issues

-   Similar to TRANSFER bug where inventory was updated but bin quantities weren't synced
-   Both issues highlight the importance of maintaining consistency between `InventoryItem` and `Bin` records

## Verification

Run `check-bin-qty.mjs` script to verify bin quantities match actual inventory totals.

```bash
node check-bin-qty.mjs
```

The script will:

1. Check bin's currentQty
2. Sum all inventory items in that bin
3. Compare and report any mismatches
4. Optionally fix the mismatch

## Date

Fixed: December 13, 2025
