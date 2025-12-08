# 🔧 Panduan Memperbaiki Bug User Assignment

## ✅ Yang Sudah Diperbaiki:

### 1. **Database Schema** ✅

-   Menambahkan field `warehouseId` di tabel User
-   Migration sudah dijalankan: `20251208094655_add_warehouse_assignment_to_users`
-   Prisma Client sudah di-generate ulang

### 2. **API Logic** ✅

-   POST /api/users: Sudah menyimpan `warehouseId` saat create user
-   POST /api/users: Hanya SUPERVISOR yang di-set sebagai warehouse manager
-   GET /api/users: Sudah include field `warehouse` dan `warehouseId`
-   Validasi: Warehouse bisa punya multiple users, tapi hanya 1 manager

### 3. **Test Data** ✅

-   File `TEST_SARAH_JOHN.sql` untuk quick test
-   File `CLEAN_USERS.sql` untuk reset database

---

## 🧪 Cara Testing Manual Via UI:

### **Langkah 1: Clean Database (Opsional)**

Jika ingin mulai dari awal:

```bash
# Di terminal PowerShell
cd D:\WORKSPACE\PROJECT\WMS\wms_portal
Get-Content .\CLEAN_USERS.sql | sqlite3 .\prisma\dev.db
```

### **Langkah 2: Restart Development Server**

```bash
# Stop server yang sedang running (Ctrl+C)
# Restart
npm run dev
```

### **Langkah 3: Test Create Users via UI**

**A. Create Sarah (SUPERVISOR Jakarta):**

1. Login sebagai Admin (`admin@wms.com`)
2. Navigate ke **User Management**
3. Klik **"Create User"**
4. Isi form:
    - Full Name: `Sarah Supervisor Jakarta`
    - Email: `sarah.test@wms.com`
    - Password: `Password123!`
    - Role: **SUPERVISOR**
    - Warehouse: **Gudang Pusat Jakarta** (WH-JKT-001)
    - Phone: `08123456789` (optional)
5. Submit
6. **Verify di UI:**
    - Sarah muncul di user list ✅
    - Role: SUPERVISOR ✅
    - Warehouse: Jakarta ✅

**B. Create John (OPERATOR Jakarta):**

1. (Masih login sebagai Admin)
2. Klik **"Create User"** lagi
3. Isi form:
    - Full Name: `John Operator Jakarta`
    - Email: `john.test@wms.com`
    - Password: `Password123!`
    - Role: **OPERATOR**
    - Warehouse: **Gudang Pusat Jakarta** (WH-JKT-001)
    - Phone: `08987654321` (optional)
4. Submit
5. **Verify di UI:**
    - John muncul di user list ✅
    - **Sarah MASIH ada** di user list ✅ ← **INI YANG PENTING!**
    - Role John: OPERATOR ✅
    - Warehouse John: Jakarta ✅

**C. Create Lisa (OPERATOR Jakarta):**

1. Klik **"Create User"** lagi
2. Isi form:
    - Full Name: `Lisa Operator Jakarta`
    - Email: `lisa.test@wms.com`
    - Password: `Password123!`
    - Role: **OPERATOR**
    - Warehouse: **Gudang Pusat Jakarta**
3. Submit
4. **Verify di UI:**
    - Lisa muncul di user list ✅
    - **Sarah MASIH ada** ✅
    - **John MASIH ada** ✅ ← **SEMUA USER TETAP ADA!**

---

## 🔍 Cara Verify via Database:

### **Check 1: Lihat Semua User Jakarta**

```sql
SELECT
  fullName,
  role,
  warehouseId,
  CASE WHEN id IN (SELECT managerId FROM Warehouse WHERE id = 'WH-JKT-001')
    THEN 'MANAGER'
    ELSE 'USER'
  END as status
FROM User
WHERE warehouseId = 'WH-JKT-001'
ORDER BY role;
```

**Expected Result:**

```
Sarah Supervisor Jakarta | SUPERVISOR | WH-JKT-001 | MANAGER
John Operator Jakarta    | OPERATOR   | WH-JKT-001 | USER
Lisa Operator Jakarta    | OPERATOR   | WH-JKT-001 | USER
```

### **Check 2: Lihat Warehouse Details**

```sql
SELECT
  w.name,
  m.fullName as manager,
  COUNT(u.id) as total_users
FROM Warehouse w
LEFT JOIN User m ON w.managerId = m.id
LEFT JOIN User u ON u.warehouseId = w.id
WHERE w.id = 'WH-JKT-001'
GROUP BY w.id;
```

**Expected Result:**

```
Gudang Pusat Jakarta | Sarah Supervisor Jakarta | 3
```

---

## ❌ Jika Masih Error:

### **Error 1: "Warehouse already has a manager"**

✅ **Ini normal!** Berarti validation bekerja dengan baik.

-   Anda **tidak bisa** create 2 SUPERVISOR untuk warehouse yang sama
-   **Solusi:** Pilih warehouse lain, atau ubah role jadi OPERATOR

### **Error 2: User hilang setelah create user baru**

❌ **Ini bug yang belum fixed.**

**Debug Steps:**

1. Buka browser console (F12)
2. Lihat response dari POST `/api/users`
3. Check database langsung:
    ```sql
    SELECT id, fullName, role, warehouseId FROM User;
    ```
4. Share screenshot error atau log untuk analisis lebih lanjut

### **Error 3: Column 'warehouseId' not found**

❌ **Migration belum dijalankan.**

**Fix:**

```bash
cd D:\WORKSPACE\PROJECT\WMS\wms_portal
npx prisma migrate dev
npx prisma generate
```

---

## 📊 Struktur Yang Benar:

```
User Table:
├── id
├── email
├── fullName
├── role (ADMIN/SUPERVISOR/OPERATOR)
├── warehouseId ← NEW! (foreign key to Warehouse)
└── ... other fields

Warehouse Table:
├── id
├── name
├── managerId ← (foreign key to User, UNIQUE)
└── ... other fields

Relasi:
- User.warehouseId → Warehouse.id (many-to-one)
- Warehouse.managerId → User.id (one-to-one)
```

**Artinya:**

-   ✅ 1 warehouse bisa punya BANYAK users (via User.warehouseId)
-   ✅ 1 warehouse hanya punya 1 manager (via Warehouse.managerId)
-   ✅ 1 user hanya bisa di-assign ke 1 warehouse
-   ✅ SUPERVISOR = assigned as user DAN set as manager
-   ✅ OPERATOR = assigned as user SAJA (bukan manager)

---

## 🎯 Expected Behavior Summary:

| Action             | Sarah (SUPERVISOR)             | John (OPERATOR) | Lisa (OPERATOR) |
| ------------------ | ------------------------------ | --------------- | --------------- |
| After create Sarah | ✅ Exists, Manager             | -               | -               |
| After create John  | ✅ Still exists, Still Manager | ✅ Exists       | -               |
| After create Lisa  | ✅ Still exists, Still Manager | ✅ Still exists | ✅ Exists       |

**All 3 users harus tetap ada di database!** ✅

---

## 📞 Need Help?

Jika masih mengalami masalah:

1. Restart dev server
2. Clear browser cache / hard refresh (Ctrl+Shift+R)
3. Check browser console untuk error
4. Check server terminal untuk error log
5. Verify database schema dengan: `npx prisma studio`

---

**Last Updated:** December 8, 2025  
**Migration:** `20251208094655_add_warehouse_assignment_to_users`  
**Status:** ✅ READY FOR TESTING
