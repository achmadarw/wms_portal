# 🚀 Quick Start - Populate Inventory Data

## Tujuan

Mengisi data `InventoryItem` untuk testing SCENARIO 4 (Inventory Management)

---

## 🎯 Pilih Metode

### **Metode 1: Standard Flow (Recommended)**

**✅ Gunakan jika:** Ingin memahami flow lengkap aplikasi WMS

**Cara:**

1. Login ke dashboard
2. Create INBOUND movements via UI
3. System auto-create inventory items

**Ikuti:** `TESTING_FLOW.md` → SCENARIO 5

---

### **Metode 2: Seed Script (Quick Testing)**

**✅ Gunakan jika:** Hanya ingin cepat test fitur inventory

**Cara:**

```powershell
# 1. Masuk ke folder wms_portal
cd d:\WORKSPACE\PROJECT\WMS\wms_portal

# 2. Install ts-node jika belum (first time only)
npm install -D ts-node

# 3. Run seed script
npx ts-node prisma/seed-inventory.ts
```

**Output:**

```
🌱 Starting Inventory Seed...
📦 Fetching warehouses...
✅ Found 3 warehouses

📦 Fetching item masters...
✅ Found 9 items

📦 Fetching bins...
✅ Found 105 bins

📦 Creating inventory items...

✅ Created: Dell XPS 15 @ Jakarta A-01-01
✅ Created: HP Pavilion @ Jakarta A-02-01
✅ Created: Logitech Mouse @ Jakarta B-01-01
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Inventory Seed Complete!
   - Created: 10 new items
   - Total in DB: 10 items
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Inventory by Warehouse:
   Gudang Pusat Jakarta: 5 items, 335 total qty
   Gudang Surabaya: 3 items, 555 total qty
   Gudang Bandung: 2 items, 50 total qty
```

---

## ✅ Verification

### Check via Database:

```powershell
# Open Prisma Studio
npm run prisma:studio

# Navigate to InventoryItem table
# Should see 10 records
```

### Check via UI:

1. Login ke dashboard
2. Navigate: **Dashboard → Inventory**
3. Should see 10 inventory items
4. Test filters:
    - Filter by Warehouse: Jakarta
    - Filter by Category: Electronics
    - Search: "Dell"

---

## 📋 Data yang Akan Dibuat

| Item               | Warehouse | Bin     | Qty | Status       |
| ------------------ | --------- | ------- | --- | ------------ |
| Dell XPS 15        | Jakarta   | A-01-01 | 25  | In Stock     |
| HP Pavilion        | Jakarta   | A-02-01 | 45  | In Stock     |
| Logitech Mouse     | Jakarta   | B-01-01 | 150 | In Stock     |
| Keychron Keyboard  | Jakarta   | B-02-01 | 80  | In Stock     |
| iPhone 15 Pro      | Jakarta   | C-01-01 | 35  | In Stock     |
| Dell XPS 15        | Surabaya  | A-01-01 | 15  | In Stock     |
| Samsung Galaxy S24 | Surabaya  | A-02-01 | 40  | In Stock     |
| Moleskine Notebook | Surabaya  | B-01-01 | 500 | In Stock     |
| Lenovo ThinkPad    | Bandung   | A-01-01 | 5   | 🔴 Low Stock |
| USB-C Hub          | Bandung   | A-02-01 | 45  | 🔴 Low Stock |

---

## 🐛 Troubleshooting

### Error: "Warehouses not found"

**Fix:** Seed warehouses terlebih dahulu

```powershell
# Check if warehouses exist
npm run prisma:studio
# Navigate to Warehouse table
# Should have 3 warehouses (Jakarta, Surabaya, Bandung)
```

### Error: "Items not found"

**Fix:** Seed item masters terlebih dahulu

```powershell
# Check if items exist
npm run prisma:studio
# Navigate to ItemMaster table
# Should have items with SKU: LAP-DELL-001, LAP-HP-001, etc.
```

### Error: "Bins not found"

**Fix:** Seed bins terlebih dahulu

```powershell
# Check if bins exist
npm run prisma:studio
# Navigate to Bin table
# Should have 105+ bins
```

### Script already run - "Already exists"

**Normal behavior:** Script akan skip items yang sudah ada

```
⏭️  Already exists: Dell XPS 15 @ Jakarta A-01-01
```

---

## 🔄 Re-run / Reset

### Option 1: Delete existing inventory

```powershell
# Open Prisma Studio
npm run prisma:studio

# Navigate to InventoryItem table
# Delete all records manually

# Re-run seed
npx ts-node prisma/seed-inventory.ts
```

### Option 2: Reset entire database

```powershell
# ⚠️ WARNING: This will delete ALL data!
npm run prisma:reset

# Re-seed everything (warehouses, bins, categories, items, inventory)
```

---

## 📚 Next Steps

Setelah inventory data seeded:

1. ✅ Test SCENARIO 4 - Inventory Management
2. ✅ Test SCENARIO 5 - Stock Movement (INBOUND)
3. ✅ Test SCENARIO 6 - Stock Movement (OUTBOUND)
4. ✅ Test SCENARIO 11 - Stock Alerts (Low stock di Bandung)

---

**Need help?** Check `INVENTORY_DATA_FLOW.md` for detailed explanation.
