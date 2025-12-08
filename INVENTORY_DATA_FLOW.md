# 📦 Inventory Data Flow - WMS Portal

## Overview

Document ini menjelaskan **bagaimana data masuk ke tabel InventoryItem** dalam aplikasi WMS.

---

## 🔄 Flow Diagram

```
┌─────────────────┐
│  Item Master    │  ← Master data produk (SKU, name, category, dll)
└────────┬────────┘
         │
         │ Reference
         ▼
┌─────────────────┐      ┌──────────────┐
│   Movement      │─────▶│ Movement API │
│   (INBOUND)     │      └──────┬───────┘
└─────────────────┘             │
    User Input                  │ Process
    - Warehouse                 │
    - Bin Location              ▼
    - Quantity           ┌──────────────────┐
    - Reference No       │ Inventory Logic  │
                         │ (movement-manager)│
                         └──────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              Check Exists?           Create/Update
                    │                       │
                    ▼                       ▼
         ┌─────────────────┐    ┌──────────────────┐
         │ InventoryItem   │    │  InventoryItem   │
         │ EXISTS          │    │  NEW RECORD      │
         │ → UPDATE qty    │    │  → INSERT        │
         └─────────────────┘    └──────────────────┘
```

---

## 📝 Detailed Flow

### **Cara 1: Melalui Movement (Standard & Recommended)**

#### **Step 1: Create INBOUND Movement**

**Endpoint:** `POST /api/movements`

**Request Body:**

```json
{
    "type": "INBOUND",
    "itemMasterId": "clxxxxx...", // ID dari Item Master
    "warehouseId": "clxxxxx...", // Warehouse tujuan
    "binId": "clxxxxx...", // Bin location tujuan
    "quantity": 100,
    "notes": "Receiving from PO-2025-001"
}
```

**Process di Backend:**

1. Validate item master exists
2. Validate warehouse & bin exists
3. Generate reference number: `MOV-INBOUND-20251208-120000-A1B2`
4. **Check if InventoryItem exists:**
    - Cari kombinasi: `itemMasterId` + `warehouseId` + `binId`

#### **Step 2: Auto Create/Update InventoryItem**

**Scenario A: InventoryItem BELUM ADA**

```typescript
// Backend auto-create new InventoryItem
await prisma.inventoryItem.create({
    data: {
        itemMasterId: '...',
        warehouseId: '...',
        binId: '...',
        quantity: 100,
        availableQty: 100,
        reservedQty: 0,
    },
});
```

**Scenario B: InventoryItem SUDAH ADA**

```typescript
// Backend auto-update existing InventoryItem
await prisma.inventoryItem.update({
    where: { id: existingInventoryId },
    data: {
        quantity: { increment: 100 }, // Add to existing
        availableQty: { increment: 100 },
    },
});
```

#### **Step 3: Movement Completed**

Movement record created dengan status `COMPLETED` dan inventory sudah terupdate.

---

### **Movement Types & Impact ke Inventory**

| Movement Type  | Impact ke InventoryItem | Logic                                |
| -------------- | ----------------------- | ------------------------------------ |
| **INBOUND**    | ✅ Increase quantity    | `quantity += X`, `availableQty += X` |
| **OUTBOUND**   | ❌ Decrease quantity    | `quantity -= X`, `availableQty -= X` |
| **TRANSFER**   | 🔄 Change location      | Update `binId`, quantity tetap       |
| **ADJUSTMENT** | ⚖️ Set absolute value   | Set `quantity = X` (stock opname)    |
| **DAMAGE**     | ❌ Decrease quantity    | `quantity -= X`, `availableQty -= X` |
| **RETURN**     | ✅ Increase quantity    | `quantity += X`, `availableQty += X` |

---

### **Cara 2: Direct Database Seeding (Initial Setup)**

Untuk testing atau initial data setup:

#### **Option A: Menggunakan Prisma Seed Script**

1. Buat file `prisma/seed-inventory.ts`
2. Run command: `npm run seed:inventory`

#### **Option B: Manual SQL Insert**

Langsung insert ke database SQLite.

**⚠️ Important:** Pastikan data reference sudah ada:

-   ✅ ItemMaster (items)
-   ✅ Warehouse
-   ✅ Bin

---

## 🎯 Testing Flow untuk SCENARIO 4

### **Prerequisite:**

Pastikan data master sudah ada:

```sql
-- Check Item Master
SELECT COUNT(*) FROM ItemMaster;  -- Should have items

-- Check Warehouse
SELECT COUNT(*) FROM Warehouse;   -- Should have 3 warehouses

-- Check Bins
SELECT COUNT(*) FROM Bin;         -- Should have 105+ bins
```

### **Flow Testing:**

#### **1. Initial State: Inventory Kosong**

```sql
SELECT COUNT(*) FROM InventoryItem;  -- Returns 0
```

#### **2. Create INBOUND Movement via UI**

1. Login ke dashboard
2. Navigate: **Dashboard → Movements**
3. Klik **"Create Movement"**
4. Fill form:
    ```
    Type: INBOUND
    Reference Number: PO-2025-12-08-001
    Warehouse: Gudang Pusat Jakarta
    Item: Laptop Dell XPS 15 (LAP-DELL-001)
    To Bin: A-01-01
    Quantity: 25
    Notes: Initial stock for testing
    ```
5. Click **"Save & Process"**

#### **3. Verify InventoryItem Created**

```sql
SELECT
  ii.quantity,
  ii.availableQty,
  im.sku,
  im.name,
  w.name as warehouse,
  b.code as bin
FROM InventoryItem ii
JOIN ItemMaster im ON ii.itemMasterId = im.id
JOIN Warehouse w ON ii.warehouseId = w.id
LEFT JOIN Bin b ON ii.binId = b.id;
```

**Expected Result:**

```
quantity | availableQty | sku           | name              | warehouse           | bin
---------|--------------|---------------|-------------------|---------------------|--------
25       | 25           | LAP-DELL-001  | Laptop Dell XPS   | Gudang Pusat Jakarta| A-01-01
```

#### **4. Navigate ke Inventory Page**

1. Navigate: **Dashboard → Inventory**
2. **Verify:**
    - Tampil 1 inventory item
    - Details match: Dell XPS, 25 pcs, Jakarta, Bin A-01-01

#### **5. Create More Inventory via Movements**

Repeat step 2 dengan items berbeda:

```
Movement #2:
- Item: HP Pavilion
- Warehouse: Jakarta
- Bin: A-02-01
- Quantity: 45

Movement #3:
- Item: Logitech Mouse
- Warehouse: Jakarta
- Bin: B-01-01
- Quantity: 150
```

#### **6. Verify Multiple Inventory Items**

Dashboard → Inventory should now show 3 items.

#### **7. Test Filters**

-   **Filter by Warehouse:** Jakarta → Show all 3 items
-   **Filter by Category:** Electronics → Show all
-   **Search:** "Dell" → Show only Dell laptop

---

## 🔧 Quick Seed Script (Alternative)

Jika ingin langsung populate inventory tanpa create movements satu-satu:

### **File: `prisma/seed-inventory.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInventory() {
    console.log('🌱 Seeding Inventory Items...');

    // Get required references
    const jakarta = await prisma.warehouse.findFirst({
        where: { code: 'WH-JKT-001' },
    });

    const surabaya = await prisma.warehouse.findFirst({
        where: { code: 'WH-SBY-001' },
    });

    const bandung = await prisma.warehouse.findFirst({
        where: { code: 'WH-BDG-001' },
    });

    // Get items
    const dellLaptop = await prisma.itemMaster.findFirst({
        where: { sku: 'LAP-DELL-001' },
    });

    const hpLaptop = await prisma.itemMaster.findFirst({
        where: { sku: 'LAP-HP-001' },
    });

    const mouse = await prisma.itemMaster.findFirst({
        where: { sku: 'ACC-MOU-001' },
    });

    // Get bins
    const binA0101_JKT = await prisma.bin.findFirst({
        where: {
            code: 'A-01-01',
            warehouseId: jakarta!.id,
        },
    });

    const binA0201_JKT = await prisma.bin.findFirst({
        where: {
            code: 'A-02-01',
            warehouseId: jakarta!.id,
        },
    });

    const binB0101_JKT = await prisma.bin.findFirst({
        where: {
            code: 'B-01-01',
            warehouseId: jakarta!.id,
        },
    });

    // Create inventory items
    const inventoryData = [
        {
            itemMasterId: dellLaptop!.id,
            warehouseId: jakarta!.id,
            binId: binA0101_JKT!.id,
            quantity: 25,
            availableQty: 20,
            reservedQty: 5,
        },
        {
            itemMasterId: hpLaptop!.id,
            warehouseId: jakarta!.id,
            binId: binA0201_JKT!.id,
            quantity: 45,
            availableQty: 45,
            reservedQty: 0,
        },
        {
            itemMasterId: mouse!.id,
            warehouseId: jakarta!.id,
            binId: binB0101_JKT!.id,
            quantity: 150,
            availableQty: 120,
            reservedQty: 30,
        },
    ];

    for (const data of inventoryData) {
        await prisma.inventoryItem.create({ data });
    }

    console.log('✅ Seeded', inventoryData.length, 'inventory items');
}

seedInventory()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
```

### **Run Seed:**

```bash
npx ts-node prisma/seed-inventory.ts
```

---

## ✅ Validation Checklist

Setelah seed/create movements:

-   [ ] InventoryItem count > 0
-   [ ] Each item has valid itemMasterId reference
-   [ ] Each item has valid warehouseId reference
-   [ ] Each item has valid binId reference (if applicable)
-   [ ] quantity = availableQty + reservedQty
-   [ ] Bin.currentQty updated (sum of all items in that bin)
-   [ ] Inventory page shows items correctly
-   [ ] Filters work (warehouse, category, search)
-   [ ] Stock status calculated correctly (in stock, low stock, out of stock)

---

## 🐛 Common Issues & Fixes

### **Issue 1: Inventory Page Empty**

**Check:**

```sql
SELECT COUNT(*) FROM InventoryItem;
```

**If 0:** Need to create INBOUND movements or run seed script.

### **Issue 2: "Item Not Found" Error**

**Cause:** ItemMaster doesn't exist.

**Fix:** Create Item Master first via Dashboard → Item Master.

### **Issue 3: "Warehouse Not Found"**

**Cause:** Warehouse doesn't exist.

**Fix:** Create Warehouse via Dashboard → Warehouses.

### **Issue 4: "Bin Not Found"**

**Cause:** Bin doesn't exist for that warehouse.

**Fix:** Create Bin via Dashboard → Storage Bin Management.

### **Issue 5: Duplicate InventoryItem**

**Cause:** Same item + warehouse + bin combination created multiple times.

**Fix:** System should auto-detect and UPDATE instead of CREATE.

---

## 🎓 Summary

**Best Practice Flow:**

1. ✅ Setup Master Data (Warehouse → Bins → Categories → Items)
2. ✅ Create INBOUND Movement dengan UI
3. ✅ System auto-create/update InventoryItem
4. ✅ View di Inventory Dashboard

**For Quick Testing:**

1. ✅ Run seed script to populate inventory
2. ✅ Directly test Inventory page features

---

**Questions?** Check movement-manager.ts for inventory update logic.
