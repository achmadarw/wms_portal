# 🐛 Bug Fix: User Warehouse Assignment Issue

## Problem Description

**Reported Issue:**
When creating multiple users assigned to the same warehouse:

1. Create Sarah as SUPERVISOR for Jakarta warehouse ✅ Works
2. Create John as OPERATOR for Jakarta warehouse ✅ Works, BUT Sarah's assignment disappears ❌
3. Create Lisa as OPERATOR for Jakarta warehouse ✅ Works, BUT John's assignment disappears ❌

**Root Cause:** Database schema design flaw + API logic error

---

## 🔍 Analysis

### Issue #1: Schema Design (Relasi One-to-One yang Salah)

**Before (INCORRECT):**

```prisma
model User {
  // No warehouseId field
  managedWarehouse Warehouse? @relation("WarehouseManager")
}

model Warehouse {
  managerId String? @unique  // ❌ UNIQUE constraint causes the problem
  manager   User?   @relation("WarehouseManager", ...)
}
```

**Problem:**

-   `managerId @unique` creates a **one-to-one** relationship
-   1 warehouse can only have 1 user assigned
-   When assigning new user to warehouse, it removes the previous user

**After (CORRECT):**

```prisma
model User {
  warehouseId      String?    // ✅ New field for warehouse assignment
  warehouse        Warehouse? @relation("WarehouseUsers", ...)
  managedWarehouse Warehouse? @relation("WarehouseManager")
}

model Warehouse {
  managerId String?  @unique  // Still unique for manager (1 manager per warehouse)
  users     User[]   @relation("WarehouseUsers") // ✅ Multiple users can be assigned
  manager   User?    @relation("WarehouseManager", ...)
}
```

**Now:**

-   **SUPERVISOR**: Assigned via `User.warehouseId` AND set as manager via `Warehouse.managerId`
-   **OPERATOR**: Assigned via `User.warehouseId` only (NOT set as manager)
-   Multiple users can be assigned to same warehouse ✅

---

### Issue #2: API Logic Error

**Before (INCORRECT):**

```typescript
// Create user
const newUser = await prisma.user.create({
    data: {
        email,
        username,
        password,
        fullName,
        role,
        phone,
        // ❌ No warehouseId in create
    },
});

// If warehouse assigned and user is supervisor/admin, update warehouse manager
if (warehouseId && (role === 'SUPERVISOR' || role === 'ADMIN')) {
    // ❌ This overwrites previous manager!
    await prisma.warehouse.update({
        where: { id: warehouseId },
        data: { managerId: newUser.id },
    });
}
```

**Problems:**

1. User created without `warehouseId` assignment
2. Logic sets warehouse manager for both SUPERVISOR and ADMIN (wrong!)
3. OPERATOR should be assigned to warehouse but NOT set as manager

**After (CORRECT):**

```typescript
// Create user WITH warehouse assignment
const newUser = await prisma.user.create({
    data: {
        email,
        username,
        password,
        fullName,
        role,
        phone,
        warehouseId: warehouseId || null, // ✅ Set warehouse assignment
    },
});

// Only SUPERVISOR becomes warehouse manager
if (warehouseId && role === 'SUPERVISOR') {
    await prisma.warehouse.update({
        where: { id: warehouseId },
        data: { managerId: newUser.id },
    });
}
```

---

## 🔧 Changes Made

### 1. Schema Update (`schema.prisma`)

```prisma
model User {
  warehouseId String? // NEW: Warehouse assignment field
  warehouse   Warehouse? @relation("WarehouseUsers", fields: [warehouseId], references: [id])
  // ... other fields
  @@index([warehouseId]) // NEW: Index for performance
}

model Warehouse {
  users User[] @relation("WarehouseUsers") // NEW: One-to-many relation
  // ... other fields
}
```

### 2. Database Migration

Created migration: `20251208094655_add_warehouse_assignment_to_users`

```sql
ALTER TABLE "User" ADD COLUMN "warehouseId" TEXT;
CREATE INDEX "User_warehouseId_idx" ON "User"("warehouseId");
-- + foreign key constraint
```

### 3. API Update (`src/app/api/users/route.ts`)

**Change 1: Include warehouseId in user creation**

```typescript
const newUser = await prisma.user.create({
    data: {
        // ... other fields
        warehouseId: warehouseId || null, // ✅ ADDED
    },
});
```

**Change 2: Fix manager assignment logic**

```typescript
// BEFORE: if (warehouseId && (role === 'SUPERVISOR' || role === 'ADMIN'))
// AFTER:
if (warehouseId && role === 'SUPERVISOR') {
    // ✅ Only SUPERVISOR
    await prisma.warehouse.update({
        where: { id: warehouseId },
        data: { managerId: newUser.id },
    });
}
```

### 4. Test Data Update (`TEST_USERS.sql`)

Updated to properly assign users:

```sql
-- SUPERVISOR: Set both warehouseId AND managerId
INSERT INTO "User" (..., warehouseId, ...) VALUES (..., 'WH-JKT-001', ...);
UPDATE "Warehouse" SET managerId = 'supervisor-jkt-001' WHERE id = 'WH-JKT-001';

-- OPERATOR: Set warehouseId only (NOT managerId)
INSERT INTO "User" (..., warehouseId, ...) VALUES (..., 'WH-JKT-001', ...);
-- No UPDATE for managerId
```

---

## ✅ Solution Summary

### Data Model (New Structure)

```
Warehouse: Jakarta (WH-JKT-001)
├── Manager (via managerId): Sarah (SUPERVISOR) ← One-to-one
└── Users (via warehouseId):                     ← One-to-many
    ├── Sarah (SUPERVISOR) ✅
    ├── John (OPERATOR) ✅
    └── Lisa (OPERATOR) ✅
```

### Role Assignment Rules

| Role       | User.warehouseId | Warehouse.managerId | Notes                     |
| ---------- | ---------------- | ------------------- | ------------------------- |
| ADMIN      | NULL             | -                   | Not assigned to warehouse |
| SUPERVISOR | Set              | Set to user.id      | Both assigned AND manager |
| OPERATOR   | Set              | -                   | Assigned but NOT manager  |

---

## 🧪 Testing

### Test Scenario 1: Create Multiple Users for Same Warehouse

```sql
-- Create Sarah (Supervisor Jakarta)
INSERT INTO "User" (id, email, fullName, role, warehouseId)
VALUES ('sarah-001', 'sarah@wms.com', 'Sarah', 'SUPERVISOR', 'WH-JKT-001');
UPDATE "Warehouse" SET managerId = 'sarah-001' WHERE id = 'WH-JKT-001';

-- Create John (Operator Jakarta)
INSERT INTO "User" (id, email, fullName, role, warehouseId)
VALUES ('john-001', 'john@wms.com', 'John', 'OPERATOR', 'WH-JKT-001');
-- No UPDATE to Warehouse.managerId

-- Create Lisa (Operator Jakarta)
INSERT INTO "User" (id, email, fullName, role, warehouseId)
VALUES ('lisa-001', 'lisa@wms.com', 'Lisa', 'OPERATOR', 'WH-JKT-001');
-- No UPDATE to Warehouse.managerId

-- ✅ RESULT: All 3 users remain assigned to Jakarta
-- ✅ Sarah is still the manager
-- ✅ John and Lisa are operators
```

### Test Scenario 2: Query Users by Warehouse

```sql
-- Get all users assigned to Jakarta warehouse
SELECT u.fullName, u.role, u.warehouseId
FROM "User" u
WHERE u.warehouseId = 'WH-JKT-001';

-- Expected Result:
-- Sarah  | SUPERVISOR | WH-JKT-001
-- John   | OPERATOR   | WH-JKT-001
-- Lisa   | OPERATOR   | WH-JKT-001
```

### Test Scenario 3: Get Warehouse with Manager and Users

```sql
-- Get warehouse with manager and all assigned users
SELECT
  w.name,
  m.fullName as manager,
  COUNT(u.id) as total_users
FROM "Warehouse" w
LEFT JOIN "User" m ON w.managerId = m.id
LEFT JOIN "User" u ON u.warehouseId = w.id
WHERE w.id = 'WH-JKT-001'
GROUP BY w.id, w.name, m.fullName;

-- Expected Result:
-- Jakarta | Sarah | 3
```

---

## 📝 Migration Steps

1. **Update schema** (already done)
2. **Run migration**:
    ```bash
    npx prisma migrate dev --name add_warehouse_assignment_to_users
    ```
3. **Generate Prisma Client**:
    ```bash
    npx prisma generate
    ```
4. **Update existing data** (if any):
    ```sql
    -- Migrate existing users if needed
    UPDATE "User"
    SET warehouseId = (SELECT id FROM "Warehouse" WHERE managerId = "User".id)
    WHERE role = 'SUPERVISOR';
    ```
5. **Test with TEST_USERS.sql**
6. **Restart application**

---

## 🎯 Benefits

✅ **Multiple users can be assigned to same warehouse**  
✅ **Clear separation: assignment vs. management**  
✅ **SUPERVISOR acts as both user and manager**  
✅ **OPERATOR assigned without management privileges**  
✅ **Proper database normalization**  
✅ **Prevents accidental overwrite of assignments**

---

## 🚀 Next Steps

1. Update frontend UI to display warehouse users list
2. Add endpoint to get all users by warehouse
3. Update user edit form to handle warehouse assignment
4. Add validation to prevent removing last supervisor from warehouse
5. Add audit trail for warehouse assignment changes

---

**Status:** ✅ **FIXED**  
**Date:** December 8, 2025  
**Migration:** `20251208094655_add_warehouse_assignment_to_users`
