# 🧪 WMS Portal - Testing Flow Guide

## Tujuan Testing

Memastikan semua fitur yang sudah diimplementasikan berjalan dengan baik dan memahami alur kerja aplikasi WMS secara menyeluruh.

---

## ⚠️ PENTING: Movement & Inventory Flow

### **Dua-Langkah Process:**

1. **CREATE Movement (Status: PENDING)**

    - Movement record ter-create dengan status `PENDING`
    - Jika inventory item BELUM ada untuk warehouse/bin tersebut:
        - System auto-create **InventoryItem placeholder** dengan `quantity = 0`
        - Ini diperlukan karena Movement membutuhkan foreign key ke InventoryItem
    - Jika inventory item SUDAH ada:
        - Quantity **TIDAK berubah** sama sekali
    - **Kesimpulan**: Inventory quantity masih **0 atau tetap** saat PENDING

2. **PROCESS Movement (Status: COMPLETED)**
    - User klik tombol "Process" di UI
    - Status berubah PENDING → COMPLETED
    - **Baru di step ini** inventory quantity di-update:
        - INBOUND: quantity += X
        - OUTBOUND: quantity -= X
        - ADJUSTMENT: quantity = X (absolute)
        - TRANSFER: binId updated
        - DAMAGE: quantity -= X
        - RETURN: quantity += X

### **Yang Normal:**

✅ InventoryItem ter-create dengan qty=0 saat movement PENDING (placeholder)  
✅ Quantity masih 0 sampai movement di-PROCESS

### **Yang TIDAK Normal:**

❌ InventoryItem quantity > 0 saat movement masih PENDING  
❌ Movement langsung COMPLETED saat create

---

## 🔐 RBAC - Quick Reference

### **Role Capabilities Summary:**

| Role           | Main Function                     | Can Create Movement? | Can Process Movement?  | Can Edit Master Data?     |
| -------------- | --------------------------------- | -------------------- | ---------------------- | ------------------------- |
| **ADMIN**      | System management                 | ✅ Yes               | ✅ Yes                 | ✅ Yes (all)              |
| **SUPERVISOR** | Operational management & approval | ✅ Yes               | ✅ Yes ⭐              | ✅ Yes (items/categories) |
| **OPERATOR**   | Daily warehouse operations        | ✅ Yes ⭐            | ❌ No (needs approval) | ❌ No (read-only)         |

### **Approval Workflow (Real-World):**

```
OPERATOR creates → Movement status: PENDING → Waits for approval
                                    ↓
SUPERVISOR reviews → Clicks "Process" → Status: COMPLETED → Inventory updated
```

**Why this matters:**

-   ✅ Separation of duties (creator ≠ approver)
-   ✅ Prevents unauthorized stock changes
-   ✅ Creates audit trail
-   ✅ Industry best practice

### **Testing Strategy:**

1. **Test with ADMIN** - Verify full access
2. **Test with SUPERVISOR** - Verify can approve movements
3. **Test with OPERATOR** - Verify CANNOT process own movements
4. **Test approval workflow** - Create as Operator, Process as Supervisor

---

## 📋 Pre-Requisites

### Data Yang Harus Sudah Ada:

-   ✅ 3 Warehouses (Jakarta, Surabaya, Bandung)
-   ✅ 105 Bins total
-   ✅ 12 Categories (hierarki 3 level)
-   ✅ 13 Item Master products
-   ✅ Users (Admin, Supervisor, Operator)

---

## 🎯 Testing Scenarios

### **SCENARIO 1: Warehouse & Bin Management**

**Tujuan:** Verifikasi manajemen gudang dan lokasi penyimpanan dengan RBAC

#### Test 1.1 - View Warehouse List (All Roles)

**As ADMIN:**

1. Login sebagai Admin (`admin@wms.com` / admin123)
2. Navigate ke **Dashboard → Warehouse Management**
3. **Verify:**
    - Tampil 3 warehouses (Jakarta, Surabaya, Bandung)
    - Status "Active" untuk semua warehouse
    - Tombol "Create Warehouse" tersedia ✅
    - Tombol "Edit" dan "Delete" tersedia ✅

**As SUPERVISOR:**

1. Login sebagai Supervisor (`supervisor.jkt@wms.com` / super123)
2. Navigate ke **Dashboard → Warehouse Management**
3. **Verify:**
    - Tampil 3 warehouses (read-only untuk yang bukan assigned)
    - Dapat edit warehouse yang di-assign (Jakarta) ✅
    - Tombol "Create Warehouse" TIDAK tersedia ❌
    - Tidak bisa delete warehouse ❌

**As OPERATOR:**

1. Login sebagai Operator (`operator@wms.com` / operator123)
2. Navigate ke **Dashboard → Warehouse Management**
3. **Verify:**
    - Tampil list warehouses (read-only) ✅
    - Tidak ada tombol "Create" ❌
    - Tidak ada tombol "Edit" atau "Delete" ❌

#### Test 1.2 - Create Warehouse (RBAC Test)

**As ADMIN (Success):**

1. Login sebagai Admin
2. Klik **"Create Warehouse"**
3. Input data warehouse baru
4. **Verify:** ✅ Warehouse ter-create, status 201 Created

**As SUPERVISOR (Forbidden):**

1. Login sebagai Supervisor
2. Try POST `/api/warehouses` via API
3. **Verify:** ❌ Response 403 Forbidden
4. UI tidak menampilkan tombol "Create Warehouse"

**As OPERATOR (Forbidden):**

1. Login sebagai Operator
2. Try POST `/api/warehouses` via API
3. **Verify:** ❌ Response 403 Forbidden
4. UI tidak menampilkan tombol "Create Warehouse"

#### Test 1.3 - View Warehouse Details (All Roles)

**As ADMIN:**

1. Klik warehouse "Gudang Pusat Jakarta" (WH-JKT-001)
2. **Verify:**
    - Informasi detail warehouse benar ✅
    - Tombol "Edit" tersedia ✅
    - Tombol "Manage Bins" tersedia ✅
    - Tombol "Delete" tersedia ✅

**As SUPERVISOR (Assigned Warehouse):**

1. Login sebagai Supervisor Jakarta
2. Klik warehouse Jakarta (assigned warehouse)
3. **Verify:**
    - Dapat view details ✅
    - Tombol "Edit" tersedia (untuk warehouse sendiri) ✅
    - Tombol "Manage Bins" tersedia ✅
    - Tombol "Delete" TIDAK tersedia ❌

**As OPERATOR:**

1. Login sebagai Operator
2. Klik warehouse Jakarta
3. **Verify:**
    - Dapat view details (read-only) ✅
    - Semua tombol edit TIDAK tersedia ❌

#### Test 1.4 - Bin Management (RBAC Test)

**As ADMIN:**

1. Navigate ke **Storage Bin Management**
2. Filter: Jakarta
3. **Verify:**
    - Tampil 75 bins ✅
    - Tombol "Create Bin" tersedia ✅
    - Tombol "Edit" dan "Delete" tersedia ✅

**As SUPERVISOR (Assigned Warehouse):**

1. Login sebagai Supervisor Jakarta
2. Navigate ke **Storage Bin Management**
3. Filter: Jakarta (warehouse sendiri)
4. **Verify:**
    - Tampil bins di warehouse Jakarta ✅
    - Tombol "Create Bin" tersedia ✅ (untuk warehouse sendiri)
    - Dapat edit/delete bins di warehouse sendiri ✅
    - Tidak bisa create/edit bins di warehouse lain ❌

**As OPERATOR:**

1. Login sebagai Operator
2. Navigate ke **Storage Bin Management**
3. **Verify:**
    - Dapat view bins (read-only) ✅
    - Tombol "Create Bin" TIDAK tersedia ❌
    - Tidak ada tombol "Edit" atau "Delete" ❌

#### Test 1.4 - View Bin Details

1. Pilih bin "A-01-01"
2. **Verify:**
    - Coordinate: Row 1, Column 1, Level 1
    - Max Capacity: 100
    - Current Quantity sesuai inventory
    - Status: Active

#### Test 1.5 - Create New Bin

1. Klik **"Add New Bin"**
2. Input:
    - Warehouse: Gudang Pusat Jakarta
    - Code: F-01-01
    - Name: Zona F - Col 1 - Level 1
    - Row: 6, Column: 1, Level: 1
    - Max Capacity: 150
3. Save
4. **Verify:** Bin baru muncul di list

#### Test 1.6 - Edit Bin

1. Pilih bin yang baru dibuat (F-01-01)
2. Edit Max Capacity jadi 200
3. Save
4. **Verify:** Perubahan tersimpan

---

### **SCENARIO 2: Category Management**

**Tujuan:** Verifikasi hierarki kategori produk dengan RBAC

#### Test 2.1 - View Category Hierarchy (All Roles)

**As ADMIN:**

1. Navigate ke **Dashboard → Categories**
2. **Verify:**
    - Tampil 4 main categories ✅
    - Tombol "Create Category" tersedia ✅
    - Tombol "Edit" dan "Delete" tersedia ✅

**As SUPERVISOR:**

1. Login sebagai Supervisor
2. Navigate ke **Categories**
3. **Verify:**
    - Tampil categories (read/write) ✅
    - Tombol "Create Category" tersedia ✅
    - Dapat edit categories ✅

**As OPERATOR:**

1. Login sebagai Operator
2. Navigate ke **Categories**
3. **Verify:**
    - Tampil categories (read-only) ✅
    - Tombol "Create" TIDAK tersedia ❌
    - Tidak ada tombol "Edit" atau "Delete" ❌

#### Test 2.2 - Create Parent Category

1. Klik **"Add New Category"**
2. Input:
    - Code: TOYS
    - Name: Toys & Games
    - Description: Mainan dan Permainan
    - Parent: (kosongkan)
3. Save
4. **Verify:** Category baru muncul sebagai root category

#### Test 2.3 - Create Child Category

1. Klik **"Add New Category"**
2. Input:
    - Code: TOYS-EDU
    - Name: Educational Toys
    - Description: Mainan Edukatif
    - Parent: Toys & Games
3. Save
4. **Verify:**
    - Category baru muncul dibawah "Toys & Games"
    - Hierarki ditampilkan dengan benar

#### Test 2.4 - Edit Category

1. Edit category "TOYS-EDU"
2. Ubah description
3. **Verify:** Perubahan tersimpan

#### Test 2.5 - Search Category

1. Search: "Computer"
2. **Verify:**
    - Tampil "Computers" dan sub-categories
    - Search case-sensitive (SQLite limitation)

---

### **SCENARIO 3: Item Master Management**

**Tujuan:** Verifikasi katalog produk dengan RBAC

#### Test 3.1 - View Item Master List (All Roles)

**As ADMIN:**

1. Navigate ke **Dashboard → Item Master**
2. **Verify:**
    - Tampil 13 items ✅
    - Tombol "Create Item" tersedia ✅
    - Tombol "Edit" dan "Delete" tersedia ✅
    - Dapat view selling price & unit cost ✅

**As SUPERVISOR:**

1. Login sebagai Supervisor
2. Navigate ke **Item Master**
3. **Verify:**
    - Tampil items ✅
    - Tombol "Create Item" tersedia ✅
    - Dapat edit items ✅
    - Dapat view pricing information ✅

**As OPERATOR:**

1. Login sebagai Operator
2. Navigate ke **Item Master**
3. **Verify:**
    - Tampil items (read-only) ✅
    - Tombol "Create" TIDAK tersedia ❌
    - Tidak ada tombol "Edit" atau "Delete" ❌
    - Mungkin tidak dapat view pricing (tergantung policy) ⚠️

#### Test 3.2 - Search Items

1. Search: "LAP-DELL-001"
2. **Verify:** Tampil "Laptop Dell XPS 15"
3. Search: "Laptop"
4. **Verify:** Tampil semua laptop items

#### Test 3.3 - Filter by Category

1. Filter category: "Laptops" (COMP-LAP)
2. **Verify:** Tampil 3 laptops (Dell, HP, Lenovo)

#### Test 3.4 - View Item Details

1. Klik item "Laptop Dell XPS 15"
2. **Verify:**
    - SKU: LAP-DELL-001
    - Barcode: 8991234567801
    - Category: Laptops (COMP-LAP)
    - Unit Cost: Rp 15,000,000
    - Selling Price: Rp 18,500,000
    - Lead Time Days: 7
    - Min Stock: 5, Max Stock: 50
    - Reorder Point: 10, Reorder Qty: 20
    - Supplier: PT. Dell Indonesia

#### Test 3.5 - Create New Item (RBAC Test)

**As ADMIN (Success):**

1. Login sebagai Admin
2. Klik **"Add New Item"**
3. Input:
    - SKU: ACC-CAB-001
    - Barcode: 8991234567850
    - Name: USB-C Cable 2m
    - Description: USB-C to USB-C cable, 100W PD
    - Category: Accessories (ELEC-ACC)
    - UOM: PCS
    - Unit Cost: 50000
    - Selling Price: 85000
    - Weight: 0.05
    - Dimensions: 200x10x10
    - Min Stock: 100
    - Max Stock: 1000
    - Reorder Point: 200
    - Reorder Qty: 500
    - Supplier: PT. Anker Indonesia
    - Lead Time: 3
4. Save
5. **Verify:**
    - ✅ Item ter-create successfully (Admin)
    - Total items jadi 14

**As SUPERVISOR (Success):**

1. Login sebagai Supervisor
2. Create item via API atau UI
3. **Verify:** ✅ Item ter-create (Supervisor can create)

**As OPERATOR (Forbidden):**

1. Login sebagai Operator
2. Try POST `/api/items` via API
3. **Verify:** ❌ Response 403 Forbidden atau UI tidak ada tombol create

#### Test 3.6 - Edit Item (RBAC Test)

**As ADMIN:**

1. Edit item "USB-C Cable 2m"
2. Ubah selling price
3. **Verify:** ✅ Changes saved successfully

**As SUPERVISOR:**

1. Login sebagai Supervisor
2. Edit item
3. **Verify:** ✅ Can edit items

**As OPERATOR:**

1. Login sebagai Operator
2. Try to edit item
3. **Verify:** ❌ Edit button not available atau 403 Forbidden

#### Test 3.7 - Delete Item (RBAC Test)

1. Edit item "USB-C Cable 2m"
2. Ubah selling price jadi 95000
3. **Verify:** Perubahan tersimpan

#### Test 3.7 - Change Items Per Page

1. Pilih "20" items per page
2. **Verify:**
    - Tampil semua 14 items dalam 1 page
    - Pagination reset ke page 1

---

### **SCENARIO 4: Inventory Management**

**Tujuan:** Verifikasi tracking stok per lokasi

> **📌 PREREQUISITE:** Inventory items harus sudah ada. Pilih salah satu cara:
>
> **Cara 1 (Recommended - Standard Flow):**
>
> -   Buat INBOUND movements via UI → System auto-create inventory
> -   Ikuti SCENARIO 5 terlebih dahulu untuk create movements
>
> **Cara 2 (Quick Setup - Testing Only):**
>
> ```powershell
> # Run inventory seed script
> cd wms_portal
> npm run seed:inventory
> ```
>
> Lihat detail di: `INVENTORY_DATA_FLOW.md`

#### Test 4.1 - View Inventory Dashboard

1. Navigate ke **Dashboard → Inventory**
2. **Verify:**
    - Tampil inventory items dari semua warehouse
    - Informasi: Item Name, SKU, Warehouse, Bin Location, Quantity

#### Test 4.2 - Filter by Warehouse

1. Filter: "Gudang Pusat Jakarta"
2. **Verify:**
    - Tampil hanya inventory di Jakarta
    - Ada Dell XPS, HP Pavilion, Mouse, Keyboard, iPhone

#### Test 4.3 - Filter by Item

1. Filter item: "LAP-DELL-001"
2. **Verify:**
    - Tampil inventory Dell XPS di Jakarta (25 pcs) dan Surabaya (15 pcs)
    - Total quantity: 40 pcs

#### Test 4.4 - Check Stock Details

1. Klik inventory "Dell XPS 15 - Jakarta - A-01-01"
2. **Verify:**
    - Total Quantity: 25
    - Available Qty: 20
    - Reserved Qty: 5
    - Bin: A-01-01
    - Max Capacity: 100

#### Test 4.5 - Low Stock Alert Check

1. Filter warehouse: "Gudang Bandung"
2. **Verify:**
    - Lenovo ThinkPad: 5 pcs (below reorder point 8) → Should trigger alert
    - USB-C Hub: 45 pcs (below reorder point 100) → Should trigger alert

---

### **SCENARIO 5: Stock Movement - INBOUND**

**Tujuan:** Test penerimaan barang masuk dengan RBAC

#### Test 5.1 - Create INBOUND Movement (All Roles Can Create)

**As ADMIN:**

1. Login sebagai Admin
2. Navigate ke **Dashboard → Movements**
3. Klik **"Create Movement"**
4. Pilih Type: **INBOUND**
5. Input:
    - Reference Number: PO-2025-12-08-001 (auto-generated, bisa custom)
    - Warehouse: Gudang Pusat Jakarta
    - Item: Laptop HP Pavilion (LAP-HP-001)
    - To Bin: A-02-01
    - Quantity: 30
    - Notes: Receiving dari PO supplier HP
6. Save
7. **Verify:**
    - Movement status: **PENDING** (bukan COMPLETED!)
    - Movement muncul di list dengan status PENDING
    - Tombol "Process" muncul di kolom Actions
8. **Check Inventory (Important!):**

    - Navigate ke **Dashboard → Inventory**
    - Filter item: HP Pavilion, Warehouse: Jakarta
    - **Verify:**
        - Jika item BELUM pernah ada di warehouse/bin tersebut:
            - InventoryItem **ter-create** dengan quantity = **0** (placeholder)
            - Ini normal! Quantity masih 0 karena movement belum di-process
        - Jika item SUDAH ada di warehouse/bin tersebut:
            - Quantity **TIDAK berubah** dari nilai sebelumnya

9. **Verify:**
    - ✅ Movement ter-create dengan status PENDING (Admin)

**As SUPERVISOR:**

1. Login sebagai Supervisor
2. Create INBOUND movement (same steps)
3. **Verify:**
    - ✅ Movement ter-create (Supervisor can create movements)

**As OPERATOR:**

1. Login sebagai Operator
2. Create INBOUND movement (same steps)
3. **Verify:**
    - ✅ Movement ter-create (Operator can create movements)
    - Operator role CAN create movements for daily operations ✅

#### Test 5.2 - Process INBOUND Movement (RBAC: Who Can Process?)

**As ADMIN (Can Process):**

1. Login sebagai Admin
2. Klik movement PENDING
3. Klik tombol **"Process"**
4. **Verify:**
    - ✅ Status → COMPLETED
    - ✅ Inventory updated

**As SUPERVISOR (Can Process):**

1. Login sebagai Supervisor
2. Process movement PENDING
3. **Verify:**
    - ✅ Supervisor CAN process movements (approval authority)
    - ✅ Status → COMPLETED

**As OPERATOR (Cannot Process - Needs Approval):**

1. Login sebagai Operator
2. Try to process movement
3. **Verify:**
    - ❌ Tombol "Process" TIDAK tersedia untuk Operator
    - ❌ Atau Response 403 jika try via API
    - **Policy:** Operator create, Supervisor/Admin approve ✅

#### Test 5.3 - Verify Inventory Update

1. Navigate ke **Inventory**
2. Filter: HP Pavilion di Jakarta, Bin A-02-01
3. **Verify:**
    - Quantity sekarang: 45 + 30 = 75 pcs
    - Available Qty update

#### Test 5.4 - Cancel/Reject PENDING Movement (RBAC Test)

**Tujuan:** Test pembatalan movement dengan role-based access

**As SUPERVISOR/ADMIN (Can Cancel):**

1. Login sebagai Supervisor atau Admin
2. Create movement baru (INBOUND):
    - Reference: PO-2025-12-08-002
    - Item: Dell Monitor 27" (ACC-MON-002)
    - Warehouse: Jakarta
    - To Bin: B-03-01
    - Quantity: 15
    - Notes: PO dari supplier Dell - akan dibatalkan
3. Save → Status PENDING
4. **Verify inventory BEFORE cancel:**
    - Navigate ke Inventory
    - Check Dell Monitor di Jakarta, Bin B-03-01
    - **Expected:**
        - InventoryItem ter-create dengan `quantity = 0` (placeholder)
        - Atau quantity tetap jika item sudah ada sebelumnya
5. **Cancel Movement:**
    - Kembali ke Movements list
    - Klik movement PO-2025-12-08-002 (status PENDING)
    - Klik tombol **"Cancel"** atau **"Reject"** (jika ada di UI)
    - Atau gunakan API: `PATCH /api/movements/[id]` dengan `action: 'cancel'`
    - Confirm cancellation
6. **Verify AFTER cancel:**
    - Movement status berubah: `CANCELLED`
    - Tombol Process hilang (movement tidak bisa diproses lagi)
    - Inventory quantity **TETAP** tidak berubah:
        - Jika placeholder (qty=0) → tetap 0
        - Jika sudah ada stok → tetap sesuai nilai sebelumnya
7. **Verify movement tidak bisa di-delete:**
    - Movement dengan status CANCELLED tetap ada di history
    - Untuk audit trail purposes

**As OPERATOR (Cannot Cancel - Needs Supervisor):**

1. Login sebagai Operator
2. Try to cancel movement yang dia buat
3. **Verify:**
    - ❌ Tombol "Cancel" TIDAK tersedia
    - ❌ Atau Response 403 Forbidden jika via API
    - **Policy:** Only Supervisor/Admin can cancel movements ✅

**Expected Behavior Summary:**

| Action           | ADMIN | SUPERVISOR | OPERATOR |
| ---------------- | ----- | ---------- | -------- |
| Create Movement  | ✅    | ✅         | ✅       |
| Process Movement | ✅    | ✅         | ❌       |
| Cancel Movement  | ✅    | ✅         | ❌       |
| Delete Movement  | ✅    | ❌         | ❌       |

**Business Rules:**

-   ✅ PENDING → CANCELLED (Supervisor/Admin only)
-   ✅ Inventory quantity tidak berubah saat cancel
-   ✅ Movement tetap ada di database (audit trail)
-   ❌ COMPLETED → CANCELLED (NOT allowed - harus reverse movement)
-   ❌ OPERATOR cannot cancel/process (needs approval workflow)

---

### **SCENARIO 6: Stock Movement - OUTBOUND**

**Tujuan:** Test pengiriman barang keluar

#### Test 6.1 - Create OUTBOUND Movement

1. Navigate ke **Movements**
2. Klik **"Create Movement"**
3. Pilih Type: **OUTBOUND**
4. Input:
    - Reference Number: SO-2025-12-08-001
    - Warehouse: Gudang Pusat Jakarta
    - Item: Logitech Mouse (ACC-MOU-001)
    - From Bin: B-01-01
    - Quantity: 50
    - Notes: Shipping to corporate customer - SO-2025-001
5. Save

#### Test 6.2 - Check Stock Before Processing

1. Navigate ke **Inventory**
2. Check Mouse di Jakarta, Bin B-01-01
3. **Verify:**
    - Current available: 120 pcs
    - Reserved akan bertambah: 50 pcs (jika ada reservation system)

#### Test 6.3 - Process OUTBOUND Movement

1. Kembali ke movement SO-2025-12-08-001
2. Process movement → COMPLETED
3. **Verify:**
    - Status COMPLETED
    - Inventory Mouse berkurang 50 pcs
    - Available qty: 120 - 50 = 70 pcs

---

### **SCENARIO 7: Stock Movement - TRANSFER**

**Tujuan:** Test pemindahan barang antar lokasi

#### Test 7.1 - Create TRANSFER Movement (Same Warehouse)

1. Navigate ke **Movements**
2. Klik **"Create Movement"**
3. Pilih Type: **TRANSFER**
4. Input:
    - Reference Number: TRF-2025-12-08-001
    - Warehouse: Gudang Pusat Jakarta
    - Item: Keychron Keyboard (ACC-KEY-001)
    - From Bin: B-02-01
    - To Bin: C-01-02
    - Quantity: 20
    - Notes: Relokasi untuk optimasi picking
5. Save

#### Test 7.2 - Process TRANSFER

1. Process movement → COMPLETED
2. **Verify:**
    - Inventory di B-02-01 berkurang 20 pcs (dari 70 jadi 50)
    - Inventory di C-01-02 bertambah 20 pcs (atau create new inventory item)
    - Bin B-02-01 current qty berkurang
    - Bin C-01-02 current qty bertambah

---

### **SCENARIO 8: Stock Movement - ADJUSTMENT**

**Tujuan:** Test koreksi stok (stock opname)

#### Test 8.1 - Stock Opname - Find Discrepancy

1. Physical count di Bin C-01-01 (iPhone 15 Pro)
2. System shows: 30 pcs (available) + 5 pcs (reserved) = 35 total
3. Physical count result: 33 pcs (2 pcs hilang)

#### Test 8.2 - Create ADJUSTMENT Movement

1. Navigate ke **Movements**
2. Klik **"Create Movement"**
3. Pilih Type: **ADJUSTMENT**
4. Input:
    - Reference Number: ADJ-2025-12-08-001
    - Warehouse: Gudang Pusat Jakarta
    - Item: iPhone 15 Pro (PHONE-APL-001)
    - Bin: C-01-01 _(REQUIRED - pilih bin yang akan di-adjust)_
    - Quantity: **33** _(New total quantity - ABSOLUTE VALUE, bukan delta)_
    - Notes: Stock opname correction - shortage found (Physical count: 33, System: 35)
5. Save & Process

**💡 IMPORTANT**: ADJUSTMENT menggunakan **ABSOLUTE quantity** (set quantity = X), bukan delta (±X).

-   Jika current qty = 35 dan physical count = 33, input **33** (bukan -2)
-   Jika current qty = 10 dan physical count = 15, input **15** (bukan +5)

#### Test 8.3 - Verify Adjustment

1. Check inventory iPhone di C-01-01
2. **Verify:**
    - Quantity sekarang adalah **33 pcs** (absolute value yang di-input)
    - Available qty juga berubah menjadi **33 pcs**
    - Notes/history mencatat adjustment dengan quantity baru

---

### **SCENARIO 9: Stock Movement - DAMAGE**

**Tujuan:** Test pencatatan barang rusak

#### Test 9.1 - Report Damaged Items

1. Navigate ke **Movements**
2. Klik **"Create Movement"**
3. Pilih Type: **DAMAGE**
4. Input:
    - Reference Number: DMG-2025-12-08-001
    - Warehouse: Gudang Pusat Jakarta
    - Item: Samsung Galaxy S24 (PHONE-SAM-001)
    - From Bin: A-02-01 (if exists in Jakarta)
    - Quantity: 3
    - Notes: Screen damaged during picking - claim insurance
5. Save & Process

#### Test 9.2 - Verify Damage Recording

1. **Verify:**
    - Inventory berkurang 3 pcs
    - Movement history mencatat damage
    - Available qty berkurang

---

### **SCENARIO 10: Stock Movement - RETURN**

**Tujuan:** Test penerimaan barang retur dari customer

#### Test 10.1 - Create RETURN Movement

1. Navigate ke **Movements**
2. Klik **"Create Movement"**
3. Pilih Type: **RETURN**
4. Input:
    - Reference Number: RET-2025-12-08-001
    - Warehouse: Gudang Pusat Jakarta
    - Item: Dell XPS 15 (LAP-DELL-001)
    - To Bin: A-01-01
    - Quantity: 2
    - Notes: Customer return - SO-2024-001234 - Wrong spec
5. Save & Process

#### Test 10.2 - Verify Return

1. **Verify:**
    - Inventory Dell XPS bertambah 2 pcs
    - Status return recorded
    - Item masuk ke bin yang ditentukan

---

### **SCENARIO 11: Stock Alerts**

**Tujuan:** Verifikasi sistem peringatan stok

#### Test 11.1 - View Stock Alerts

1. Navigate ke **Dashboard → Stock Alerts** (jika ada)
2. **Verify:**
    - Alert untuk Lenovo ThinkPad (Bandung) - REORDER_POINT
    - Alert untuk USB-C Hub (Bandung) - REORDER_POINT
    - Severity: MEDIUM

#### Test 11.2 - Check Low Stock Items

1. Navigate ke **Inventory**
2. Filter warehouse: Bandung
3. **Verify:**
    - Lenovo: 5 pcs (reorder point: 8) → ALERT
    - USB-C Hub: 45 pcs (reorder point: 100) → ALERT

#### Test 11.3 - Acknowledge Alert

1. Klik alert Lenovo ThinkPad
2. Klik **"Acknowledge"**
3. **Verify:** Alert status berubah jadi "Acknowledged"

#### Test 11.4 - Resolve Alert with INBOUND

1. Create INBOUND movement:
    - Item: Lenovo ThinkPad
    - Warehouse: Bandung
    - Bin: A-01-01
    - Quantity: 15 (reorder qty)
2. Process movement
3. **Verify:**
    - Stock jadi 5 + 15 = 20 pcs
    - Alert auto-resolved atau perlu manual resolve

---

### **SCENARIO 12: Movement History & Reporting**

**Tujuan:** Verifikasi tracking dan pelaporan

#### Test 12.1 - View All Movements

1. Navigate ke **Movements**
2. **Verify:**
    - Tampil semua movement history
    - Default sort: terbaru dahulu

#### Test 12.2 - Filter by Type

1. Filter: INBOUND only
2. **Verify:** Tampil hanya movement type INBOUND
3. Filter: OUTBOUND only
4. **Verify:** Tampil hanya movement type OUTBOUND

#### Test 12.3 - Filter by Date Range

1. Filter: Last 7 days
2. **Verify:** Tampil movement dalam 7 hari terakhir
3. Filter: Custom range (Dec 1 - Dec 8)
4. **Verify:** Tampil movement dalam range tersebut

#### Test 12.4 - Filter by Warehouse

1. Filter: Gudang Pusat Jakarta
2. **Verify:** Tampil hanya movement di Jakarta

#### Test 12.5 - Search by Reference Number

1. Search: "PO-2025-12-08-001"
2. **Verify:** Tampil movement dengan reference tersebut

#### Test 12.6 - View Movement Details

1. Klik salah satu movement
2. **Verify:**
    - Reference number
    - Type, Status
    - Item details
    - Quantity
    - Warehouse, From/To Bin
    - Created by, Created at
    - Notes

---

### **SCENARIO 13: User & Role Management (RBAC Comprehensive)**

**Tujuan:** Test akses kontrol berbasis role secara menyeluruh

#### Test 13.1 - ADMIN Role - Full Access

**Login & Navigation:**

1. Login: `admin@wms.com` / admin123
2. **Verify Menu Access:**
    - ✅ Dashboard (full access)
    - ✅ Warehouses (create/edit/delete)
    - ✅ Storage Bins (create/edit/delete)
    - ✅ Categories (create/edit/delete)
    - ✅ Item Master (create/edit/delete)
    - ✅ Inventory (full access)
    - ✅ Movements (create/process/cancel/delete)
    - ✅ Users (create/edit/delete/change roles)
    - ✅ Reports (all reports)
    - ✅ Settings (system configuration)

**Specific Permissions:**

-   ✅ Create warehouse
-   ✅ Assign warehouse managers
-   ✅ Process/cancel movements
-   ✅ View all pricing (cost/selling price)
-   ✅ Delete records (dengan validation)
-   ✅ Change user roles
-   ✅ Access audit logs
-   ✅ System configuration

#### Test 13.2 - SUPERVISOR Role - Operational Management

**Login & Navigation:**

1. Login: `supervisor.jkt@wms.com` / super123
2. **Verify Menu Access:**
    - ✅ Dashboard (view assigned warehouse)
    - ⚠️ Warehouses (view only, edit assigned warehouse)
    - ✅ Storage Bins (create/edit for assigned warehouse)
    - ✅ Categories (create/edit)
    - ✅ Item Master (create/edit)
    - ✅ Inventory (full access)
    - ✅ Movements (create/process/cancel)
    - ⚠️ Users (view only, no edit)
    - ✅ Reports (operational reports)
    - ❌ Settings (no access)

**Specific Permissions:**

-   ❌ Cannot create warehouse
-   ✅ Can manage assigned warehouse
-   ✅ Can create bins (for assigned warehouse)
-   ✅ Can create/edit items
-   ✅ Can create movements (all types)
-   ✅ Can process/approve movements ← **KEY DIFFERENCE**
-   ✅ Can cancel movements
-   ✅ View pricing information
-   ❌ Cannot delete warehouses
-   ❌ Cannot change user roles
-   ⚠️ Can view users (read-only)

**Test Supervisor-Specific Scenarios:**

**A. Assigned Warehouse Management:**

1. Navigate to Warehouses
2. Click Jakarta warehouse (assigned)
3. **Verify:**
    - ✅ Can edit Jakarta warehouse details
    - ✅ Can manage bins in Jakarta
    - ❌ Cannot edit Surabaya/Bandung warehouses

**B. Movement Approval Workflow:**

1. Login sebagai Operator
2. Create INBOUND movement (status: PENDING)
3. Logout, login sebagai Supervisor
4. Find PENDING movement
5. Click "Process"
6. **Verify:**
    - ✅ Supervisor CAN process movement
    - ✅ Status → COMPLETED
    - ✅ Inventory updated
    - **Business Rule:** Supervisor approves Operator's work ✅

**C. Cross-Warehouse Restrictions:**

1. Try to create bin in Surabaya (not assigned warehouse)
2. **Verify:**
    - ⚠️ Depends on policy: May be restricted to assigned warehouse
    - Or allowed but logged for audit

#### Test 13.3 - OPERATOR Role - Daily Operations

**Login & Navigation:**

1. Login: `operator@wms.com` / operator123
2. **Verify Menu Access:**
    - ✅ Dashboard (view only)
    - ✅ Warehouses (view only)
    - ✅ Storage Bins (view only)
    - ✅ Categories (view only)
    - ✅ Item Master (view only)
    - ✅ Inventory (view/search)
    - ✅ Movements (view/create only)
    - ✅ Users (view only)
    - ❌ Reports (limited or no access)
    - ❌ Settings (no access)

**Specific Permissions:**

-   ❌ Cannot create warehouse
-   ❌ Cannot create bins
-   ❌ Cannot create/edit categories
-   ❌ Cannot create/edit items
-   ✅ Can view inventory (read-only)
-   ✅ Can create movements (INBOUND/OUTBOUND/TRANSFER/etc) ← **MAIN JOB**
-   ❌ Cannot process movements (needs Supervisor approval) ← **KEY RESTRICTION**
-   ❌ Cannot cancel movements
-   ❌ Cannot delete anything
-   ⚠️ May have limited pricing view (hide cost prices)

**Test Operator-Specific Scenarios:**

**A. Create Movement (Operator Daily Task):**

1. Login sebagai Operator
2. Navigate to Movements
3. Click "Create Movement"
4. Select INBOUND
5. Fill details:
    - Item: Dell XPS 15
    - Warehouse: Jakarta
    - To Bin: A-01-01
    - Quantity: 10
6. Save
7. **Verify:**
    - ✅ Movement ter-create dengan status PENDING
    - ⚠️ Operator TIDAK bisa langsung process
    - **Workflow:** Create → Wait for Supervisor approval ✅

**B. Cannot Process Own Movement:**

1. After creating movement (status PENDING)
2. Try to click "Process" button
3. **Verify:**
    - ❌ Button "Process" TIDAK tersedia
    - ❌ Atau disabled dengan tooltip: "Needs Supervisor Approval"
    - **Policy:** Separation of duties (Operator ≠ Approver) ✅

**C. Cannot Edit Master Data:**

1. Navigate to Item Master
2. Try to click "Create Item"
3. **Verify:**
    - ❌ Button tidak tersedia
    - **Verify via API:**
        ```
        POST /api/items
        Authorization: Bearer {operator_token}
        → Response: 403 Forbidden
        ```

**D. Limited Delete Access:**

1. Try to delete movement (even own movement)
2. **Verify:**
    - ❌ Delete button tidak tersedia
    - ❌ API returns 403 Forbidden

#### Test 13.4 - Role Change Testing

**Promote Operator to Supervisor:**

1. Login sebagai Admin
2. Navigate to Users
3. Find Operator user
4. Click "Edit"
5. Change role: OPERATOR → SUPERVISOR
6. Save
7. **Verify:**
    - ✅ User role updated in database
    - Operator logout dan login kembali
    - ✅ JWT token berisi role "SUPERVISOR"
    - ✅ Menu access berubah (now can process movements)

**Demote Supervisor to Operator:**

1. Login sebagai Admin
2. Change Supervisor → OPERATOR
3. **Verify:**
    - ✅ Lost access to process movements
    - ✅ Lost access to edit master data
    - ✅ Warehouse assignment cleared (optional)

#### Test 13.5 - RBAC Enforcement via API

**Test All Endpoints with Each Role:**

**Warehouse Creation:**

```bash
# ADMIN → 201 Created
curl -X POST /api/warehouses -H "Authorization: Bearer {admin_token}" -d '{...}'

# SUPERVISOR → 403 Forbidden
curl -X POST /api/warehouses -H "Authorization: Bearer {supervisor_token}" -d '{...}'

# OPERATOR → 403 Forbidden
curl -X POST /api/warehouses -H "Authorization: Bearer {operator_token}" -d '{...}'
```

**Movement Processing:**

```bash
# ADMIN → 200 OK
curl -X PATCH /api/movements/{id} -H "Authorization: Bearer {admin_token}" -d '{"action":"process"}'

# SUPERVISOR → 200 OK
curl -X PATCH /api/movements/{id} -H "Authorization: Bearer {supervisor_token}" -d '{"action":"process"}'

# OPERATOR → 403 Forbidden
curl -X PATCH /api/movements/{id} -H "Authorization: Bearer {operator_token}" -d '{"action":"process"}'
```

**User Role Change:**

```bash
# ADMIN → 200 OK
curl -X PUT /api/users/{id} -H "Authorization: Bearer {admin_token}" -d '{"role":"SUPERVISOR"}'

# SUPERVISOR → 403 Forbidden
curl -X PUT /api/users/{id} -H "Authorization: Bearer {supervisor_token}" -d '{"role":"ADMIN"}'

# OPERATOR → 403 Forbidden
curl -X PUT /api/users/{id} -H "Authorization: Bearer {operator_token}" -d '{...}'
```

#### Test 13.6 - Real-World Workflow Scenario

**Daily Warehouse Operations (Multi-Role Collaboration):**

**Morning - Operator receives goods:**

1. Login sebagai Operator (08:00)
2. Create INBOUND movement:
    - PO-2025-001
    - 50 pcs Laptop HP
    - Warehouse: Jakarta
    - Bin: A-02-01
3. Status: PENDING
4. **Note:** "Barang sudah diterima dan di-check quality OK"

**Mid-Morning - Supervisor approves:**

1. Login sebagai Supervisor (09:30)
2. Review PENDING movements
3. Verify physical goods received
4. Click "Process" on PO-2025-001
5. Status: PENDING → COMPLETED
6. Inventory updated: +50 pcs

**Afternoon - Operator prepares outbound:**

1. Login sebagai Operator (14:00)
2. Create OUTBOUND movement:
    - SO-2025-042
    - 20 pcs Laptop HP
    - From Bin: A-02-01
3. Status: PENDING
4. **Note:** "Prepared for customer order"

**Late Afternoon - Supervisor approves shipment:**

1. Login sebagai Supervisor (16:00)
2. Verify picking done correctly
3. Process SO-2025-042
4. Status: COMPLETED
5. Inventory: -20 pcs
6. Goods ready for shipping

**End of Day - Admin reviews:**

1. Login sebagai Admin (17:30)
2. View movement report
3. **Verify:**
    - Total INBOUND: 50 pcs
    - Total OUTBOUND: 20 pcs
    - Net movement: +30 pcs
    - All movements approved by Supervisor ✅
    - Audit trail complete ✅

---

### **SCENARIO 14: Advanced Search & Filters**

**Tujuan:** Test kemampuan filtering dan pencarian

#### Test 14.1 - Multi-Filter Inventory

1. Navigate ke **Inventory**
2. Apply filters:
    - Warehouse: Jakarta
    - Category: Electronics
    - Low Stock: Yes (below reorder point)
3. **Verify:** Result sesuai semua kriteria

#### Test 14.2 - Item Master Search

1. Navigate ke **Item Master**
2. Search: "Dell"
3. **Verify:** Tampil Dell XPS 15
4. Search: "LAP" (SKU prefix)
5. **Verify:** Tampil semua laptops

#### Test 14.3 - Barcode Search

1. Search by barcode: "8991234567801"
2. **Verify:** Tampil Dell XPS 15

---

### **SCENARIO 15: Pagination & Performance**

**Tujuan:** Test performa dengan data banyak

#### Test 15.1 - Items Per Page

1. Navigate ke **Item Master**
2. Change items per page: 5
3. **Verify:**
    - Tampil 5 items
    - Pagination shows correct total pages (14 items / 5 = 3 pages)
4. Change to 20
5. **Verify:** Tampil all 14 items in 1 page

#### Test 15.2 - Navigate Pages

1. Set items per page: 5
2. Klik page 2
3. **Verify:** Tampil items 6-10
4. Klik "Next"
5. **Verify:** Pindah ke page 3 (items 11-14)
6. Klik "Previous"
7. **Verify:** Balik ke page 2

#### Test 15.3 - Bin List Pagination

1. Navigate ke **Storage Bin Management**
2. Filter: Gudang Pusat Jakarta (75 bins)
3. **Verify:**
    - Default 10 items per page
    - Total 8 pages
    - Pagination controls work smoothly

---

### **SCENARIO 16: Edge Cases & Validations**

**Tujuan:** Test validasi dan error handling

#### Test 16.1 - Insufficient Stock OUTBOUND

1. Try create OUTBOUND:
    - Item with only 5 pcs available
    - Request 10 pcs
2. **Expected:** Error "Insufficient stock" atau warning

#### Test 16.2 - Bin Capacity Exceeded

1. Try INBOUND to bin with:
    - Max capacity: 100
    - Current: 95
    - Incoming: 10 (total would be 105)
2. **Expected:** Warning "Bin capacity exceeded"

#### Test 16.3 - Duplicate SKU

1. Try create item with existing SKU "LAP-DELL-001"
2. **Expected:** Error "SKU already exists"

#### Test 16.4 - Required Fields

1. Try create item without:
    - Name (required)
    - SKU (required)
    - Category (required)
2. **Expected:** Validation error messages

#### Test 16.5 - Invalid Bin Coordinates

1. Try create bin with:
    - Row: -1 (negative)
    - Level: 0 (should be > 0)
2. **Expected:** Validation error

#### Test 16.6 - Delete Item with Inventory

1. Try delete item "Dell XPS 15" yang punya inventory
2. **Expected:**
    - Error "Cannot delete item with existing inventory"
    - Atau warning dengan konfirmasi

---

### **SCENARIO 17: Dashboard & Analytics**

**Tujuan:** Test reporting dan visualisasi (jika ada)

#### Test 17.1 - Dashboard Overview

1. Navigate ke **Dashboard** home
2. **Verify (jika ada widgets):**
    - Total warehouses: 3
    - Total items: 14 (after new item created)
    - Total bins: 106 (after new bin created)
    - Low stock alerts: 2

#### Test 17.2 - Inventory Value Report

1. Navigate ke **Reports → Inventory Value** (jika ada)
2. **Verify:**
    - Total inventory value calculation
    - Breakdown by warehouse
    - Breakdown by category

#### Test 17.3 - Movement Report

1. Navigate ke **Reports → Movement Report** (jika ada)
2. Filter: Last 30 days
3. **Verify:**
    - Total INBOUND quantity
    - Total OUTBOUND quantity
    - Net movement
    - Movement by type chart

---

## 🎓 Learning Points

### 🔐 RBAC (Role-Based Access Control) - Comprehensive Permission Matrix

| Feature / Action            | ADMIN | SUPERVISOR     | OPERATOR       | Notes                             |
| --------------------------- | ----- | -------------- | -------------- | --------------------------------- |
| **User Management**         |
| Create User                 | ✅    | ❌             | ❌             | Admin only                        |
| Edit User                   | ✅    | ❌             | ❌             | Admin only                        |
| Change User Role            | ✅    | ❌             | ❌             | Admin only                        |
| Delete/Deactivate User      | ✅    | ❌             | ❌             | Admin only                        |
| View Users                  | ✅    | ✅ (read-only) | ✅ (read-only) | All can view                      |
| **Warehouse Management**    |
| Create Warehouse            | ✅    | ❌             | ❌             | Admin only                        |
| Edit Warehouse (Any)        | ✅    | ❌             | ❌             | Admin can edit all                |
| Edit Warehouse (Assigned)   | ✅    | ✅             | ❌             | Supervisor can edit assigned      |
| Delete Warehouse            | ✅    | ❌             | ❌             | Admin only                        |
| View Warehouses             | ✅    | ✅             | ✅             | All can view                      |
| Assign Warehouse Manager    | ✅    | ❌             | ❌             | Admin only                        |
| **Storage Bin Management**  |
| Create Bin (Any Warehouse)  | ✅    | ❌             | ❌             | Admin can create anywhere         |
| Create Bin (Assigned WH)    | ✅    | ✅             | ❌             | Supervisor for assigned WH        |
| Edit Bin                    | ✅    | ✅ (assigned)  | ❌             | Admin all, Supervisor assigned    |
| Delete Bin                  | ✅    | ⚠️ (assigned)  | ❌             | Restricted, must be empty         |
| View Bins                   | ✅    | ✅             | ✅             | All can view                      |
| **Category Management**     |
| Create Category             | ✅    | ✅             | ❌             | Admin + Supervisor                |
| Edit Category               | ✅    | ✅             | ❌             | Admin + Supervisor                |
| Delete Category             | ✅    | ⚠️             | ❌             | Must have no items                |
| View Categories             | ✅    | ✅             | ✅             | All can view                      |
| **Item Master Management**  |
| Create Item                 | ✅    | ✅             | ❌             | Admin + Supervisor                |
| Edit Item                   | ✅    | ✅             | ❌             | Admin + Supervisor                |
| Delete Item                 | ✅    | ⚠️             | ❌             | Must have no inventory            |
| View Items                  | ✅    | ✅             | ✅             | All can view                      |
| View Unit Cost              | ✅    | ✅             | ⚠️             | Operator may have limited view    |
| View Selling Price          | ✅    | ✅             | ⚠️             | Operator may have limited view    |
| **Inventory Management**    |
| View Inventory              | ✅    | ✅             | ✅             | All can view                      |
| Manual Adjustment           | ✅    | ✅             | ❌             | Via ADJUSTMENT movement           |
| View Stock Alerts           | ✅    | ✅             | ✅             | All can view alerts               |
| Acknowledge Alerts          | ✅    | ✅             | ❌             | Admin + Supervisor                |
| **Movement Operations**     |
| Create Movement (All Types) | ✅    | ✅             | ✅             | **All roles can create**          |
| Process Movement (Approve)  | ✅    | ✅             | ❌             | **Only Supervisor/Admin approve** |
| Cancel Movement             | ✅    | ✅             | ❌             | Supervisor/Admin only             |
| Delete Movement             | ✅    | ❌             | ❌             | Admin only (PENDING/CANCELLED)    |
| View Movement History       | ✅    | ✅             | ✅             | All can view                      |
| **Reporting & Analytics**   |
| View All Reports            | ✅    | ✅             | ⚠️             | Operator limited reports          |
| Export Reports              | ✅    | ✅             | ❌             | Admin + Supervisor                |
| View Audit Logs             | ✅    | ⚠️             | ❌             | Admin full, Supervisor limited    |
| Inventory Valuation Report  | ✅    | ✅             | ❌             | Contains cost information         |
| Movement Reports            | ✅    | ✅             | ✅             | All can view                      |
| **System Configuration**    |
| System Settings             | ✅    | ❌             | ❌             | Admin only                        |
| Database Backup             | ✅    | ❌             | ❌             | Admin only                        |
| Email Templates             | ✅    | ❌             | ❌             | Admin only                        |

### 🔄 Real-World Workflow - Approval Process

**SCENARIO: Daily Warehouse Receiving (INBOUND)**

```
08:00 - OPERATOR (John) - Creates Movement
├─ Item: Laptop HP Pavilion
├─ Quantity: 50 pcs
├─ PO Number: PO-2025-001
├─ Status: PENDING ⏳
└─ Inventory: NOT updated yet (qty still 0 or unchanged)

09:30 - SUPERVISOR (Sarah) - Reviews & Approves
├─ Checks physical goods received
├─ Verifies PO documents
├─ Clicks "Process" button
├─ Status: PENDING → COMPLETED ✅
└─ Inventory: +50 pcs (quantity updated)

Result:
✅ Separation of duties enforced (creator ≠ approver)
✅ Audit trail: Created by John, Approved by Sarah
✅ Inventory accurate and verified
```

**SCENARIO: Stock Outbound (OUTBOUND)**

```
14:00 - OPERATOR (Mike) - Picks Items
├─ Item: Mouse Logitech
├─ Quantity: 30 pcs
├─ SO Number: SO-2025-042
├─ Status: PENDING ⏳
└─ Picks items physically, puts in staging area

15:00 - SUPERVISOR (Tom) - Verifies & Ships
├─ Checks picked items match SO
├─ Verifies quality OK
├─ Clicks "Process"
├─ Status: COMPLETED ✅
├─ Inventory: -30 pcs
└─ Goods released for shipping

Result:
✅ Cannot ship without Supervisor approval
✅ Prevents unauthorized stock removal
✅ Dual verification (picker + approver)
```

**SCENARIO: Stock Adjustment (ADJUSTMENT)**

```
10:00 - OPERATOR (Lisa) - Physical Count
├─ Counts items in Bin A-01-01
├─ System: 100 pcs
├─ Physical: 98 pcs
└─ Reports discrepancy to Supervisor

10:30 - SUPERVISOR (David) - Creates Adjustment
├─ Type: ADJUSTMENT
├─ Quantity: -2 (correction)
├─ Reason: "Stock opname - 2 pcs shortage"
├─ Status: PENDING ⏳
└─ Waits for Admin approval (optional, depends on policy)

11:00 - ADMIN (Manager) - Approves Adjustment
├─ Reviews adjustment reason
├─ Investigates discrepancy
├─ Clicks "Process"
├─ Status: COMPLETED ✅
└─ Inventory: Corrected to 98 pcs

Result:
✅ High-level approval for adjustments
✅ Prevents unauthorized inventory changes
✅ Full audit trail for discrepancies
```

### 📊 Permission Hierarchy

```
ADMIN (Full Control)
│
├── Create/Edit/Delete Master Data (Warehouses, Bins, Categories, Items)
├── Manage Users & Roles
├── Process/Cancel/Delete Movements
├── View All Reports (including cost/profit)
├── System Configuration
└── Full Audit Access

SUPERVISOR (Operational Management)
│
├── Create/Edit Master Data (Categories, Items)
├── Manage Assigned Warehouse & Bins
├── Create Movements (All Types)
├── Process/Approve Movements ⭐ KEY PERMISSION
├── Cancel Movements
├── View Most Reports (operational)
└── Limited Audit Access

OPERATOR (Daily Operations)
│
├── View Master Data (Read-Only)
├── View Inventory (Read-Only)
├── Create Movements (All Types) ⭐ MAIN JOB
├── View Movement History
└── Limited Reports
```

### 🎯 Business Rules - Movement Approval

| Movement Type  | Operator Creates  | Supervisor Approves        | Inventory Impact              |
| -------------- | ----------------- | -------------------------- | ----------------------------- |
| **INBOUND**    | ✅ Receives goods | ✅ Verifies & processes    | Inventory +X (after approval) |
| **OUTBOUND**   | ✅ Picks items    | ✅ Verifies & ships        | Inventory -X (after approval) |
| **TRANSFER**   | ✅ Moves items    | ✅ Confirms relocation     | Bin changed (after approval)  |
| **ADJUSTMENT** | Reports count     | ✅ Investigates & approves | Inventory corrected           |
| **DAMAGE**     | Reports damage    | ✅ Verifies & writes off   | Inventory -X (after approval) |
| **RETURN**     | Receives return   | ✅ Inspects & accepts      | Inventory +X (after approval) |

**Why Two-Step Approval?**

-   ✅ Prevents fraud (requires two people)
-   ✅ Improves accuracy (dual verification)
-   ✅ Creates audit trail (who created, who approved)
-   ✅ Enforces accountability
-   ✅ Industry best practice (SOX compliance)

### Alur Kerja Utama:

1. **Setup Master Data (Admin/Supervisor):**

    - Warehouse → Bins → Categories → Items

2. **Daily Operations (Operator):**

    - Create INBOUND movements (goods received)
    - Create OUTBOUND movements (picking)
    - Create TRANSFER movements (relocation)
    - Status: All PENDING (waiting approval)

3. **Approval & Processing (Supervisor):**

    - Review PENDING movements
    - Verify physical goods/documents
    - Process movements → COMPLETED
    - Inventory updated automatically

4. **Monitoring (All Roles):**
    - View stock alerts
    - Check movement history
    - View inventory levels
    - Generate reports (role-based access)

### Key Features Learned:

✅ **Multi-warehouse management** - 3 gudang berbeda
✅ **3D Bin location system** - Row, Column, Level
✅ **Hierarchical categories** - 3 level depth
✅ **Comprehensive item master** - dengan lead time, supplier, pricing
✅ **Inventory tracking** - Available vs Reserved qty
✅ **6 Movement types** - INBOUND, OUTBOUND, TRANSFER, ADJUSTMENT, DAMAGE, RETURN
✅ **Two-step approval workflow** - Create (Operator) → Approve (Supervisor) ⭐
✅ **RBAC with 3 roles** - ADMIN, SUPERVISOR, OPERATOR
✅ **Stock alerts** - Automated reorder point detection
✅ **Pagination** - Configurable items per page
✅ **Search & filter** - Multi-criteria filtering
✅ **Audit trail** - Complete history of who did what

---

## ✅ Testing Checklist

Use this checklist to track your testing progress:

### RBAC & User Management

-   [ ] Login as ADMIN - verify full access
-   [ ] Login as SUPERVISOR - verify operational management access
-   [ ] Login as OPERATOR - verify limited daily operations access
-   [ ] Test role promotion (OPERATOR → SUPERVISOR)
-   [ ] Test role demotion (SUPERVISOR → OPERATOR)
-   [ ] Verify JWT token contains correct role
-   [ ] Test ADMIN-only endpoints (403 for other roles)
-   [ ] Test Supervisor approval workflow
-   [ ] Test Operator cannot process movements
-   [ ] Test separation of duties (creator ≠ approver)

### Master Data (with RBAC)

-   [ ] **Warehouse Management**
    -   [ ] ADMIN can create/edit/delete warehouses
    -   [ ] SUPERVISOR can view all, edit assigned only
    -   [ ] OPERATOR can view only (read-only)
-   [ ] **Bin Management**
    -   [ ] ADMIN can create bins anywhere
    -   [ ] SUPERVISOR can create bins in assigned warehouse
    -   [ ] OPERATOR read-only access
-   [ ] **Category Management**
    -   [ ] ADMIN can create/edit categories
    -   [ ] SUPERVISOR can create/edit categories
    -   [ ] OPERATOR read-only
-   [ ] **Item Master**
    -   [ ] ADMIN can create/edit/delete items
    -   [ ] SUPERVISOR can create/edit items
    -   [ ] OPERATOR read-only, limited pricing view

### Inventory (with RBAC)

-   [ ] All roles can view inventory
-   [ ] ADMIN/SUPERVISOR can adjust inventory
-   [ ] OPERATOR read-only access
-   [ ] Low stock alerts visible to all
-   [ ] Pricing visibility per role

### Movements - Multi-Role Workflow

-   [ ] **Creation (All Roles)**
    -   [ ] ADMIN can create movements
    -   [ ] SUPERVISOR can create movements
    -   [ ] OPERATOR can create movements ✅
-   [ ] **Processing (Approval Required)**
    -   [ ] ADMIN can process movements ✅
    -   [ ] SUPERVISOR can process movements ✅
    -   [ ] OPERATOR CANNOT process movements ❌
-   [ ] **Cancellation**
    -   [ ] ADMIN can cancel movements
    -   [ ] SUPERVISOR can cancel movements
    -   [ ] OPERATOR CANNOT cancel movements
-   [ ] **Deletion**
    -   [ ] ADMIN can delete (with restrictions)
    -   [ ] SUPERVISOR cannot delete
    -   [ ] OPERATOR cannot delete

### Real-World Workflow Tests

-   [ ] **Daily Operations**
    -   [ ] Operator creates INBOUND (PENDING)
    -   [ ] Supervisor reviews and processes (COMPLETED)
    -   [ ] Inventory updated after approval
-   [ ] **Cross-Warehouse Restrictions**
    -   [ ] Supervisor limited to assigned warehouse
    -   [ ] Operator can work in any warehouse (create movements)
-   [ ] **Approval Workflow**
    -   [ ] Movement stays PENDING until Supervisor approves
    -   [ ] Operator sees "Waiting for Approval" status
    -   [ ] Email notification to Supervisor (optional)
-   [ ] **Audit Trail**
    -   [ ] All movements logged with creator
    -   [ ] Approver logged separately
    -   [ ] Admin can view full audit log

### API Endpoint RBAC Tests

-   [ ] POST /api/warehouses (Admin only)
-   [ ] POST /api/bins (Admin/Supervisor)
-   [ ] POST /api/items (Admin/Supervisor)
-   [ ] POST /api/movements (All roles)
-   [ ] PATCH /api/movements/[id] process (Admin/Supervisor only)
-   [ ] PATCH /api/movements/[id] cancel (Admin/Supervisor only)
-   [ ] PUT /api/users/[id] (Admin only)
-   [ ] DELETE endpoints (Admin only with restrictions)

### Edge Cases & Security

-   [ ] Insufficient stock error (all roles see this)
-   [ ] Bin capacity validation
-   [ ] Operator tries to process own movement → 403
-   [ ] Supervisor tries to create warehouse → 403
-   [ ] Operator tries to delete item → 403
-   [ ] Invalid JWT token → 401
-   [ ] Expired JWT token → 401
-   [ ] CSRF protection (if implemented)
-   [ ] XSS prevention in inputs

---

## 🐛 Bug Report Template

Jika menemukan bug saat testing, catat dengan format:

```
**Bug ID:** BUG-001
**Scenario:** SCENARIO 5.2 - Process INBOUND Movement
**Steps to Reproduce:**
1. Create INBOUND movement
2. Click "Process Movement"
3. ...

**Expected Result:**
Inventory should increase by 30 pcs

**Actual Result:**
Inventory tidak berubah

**Priority:** High/Medium/Low
**Screenshot:** (optional)
```

---

## 📊 Testing Summary Template

Setelah selesai testing, buat summary:

```
**Testing Date:** December 8, 2025
**Tester:** [Your Name]
**Total Scenarios:** 17
**Scenarios Passed:** __
**Scenarios Failed:** __
**Bugs Found:** __
**Success Rate:** __%

**Critical Issues:**
1. ...
2. ...

**Minor Issues:**
1. ...

**Recommendations:**
1. ...
```

---

## 🚀 Next Steps After Testing

Berdasarkan hasil testing, prioritas development selanjutnya:

1. **High Priority:**

    - Fix critical bugs found
    - Implement missing validations
    - Add user feedback messages

2. **Medium Priority:**

    - Enhance reporting features
    - Add export functionality (Excel/PDF)
    - Implement barcode scanning (mobile)

3. **Low Priority:**
    - Dashboard analytics
    - Advanced filtering
    - Batch operations

---

**Happy Testing! 🎉**

_Jika ada pertanyaan atau menemukan issue, silahkan dokumentasikan dengan detail._
