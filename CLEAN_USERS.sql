-- ============================================================
-- WMS Portal - Clean and Reset User Data
-- Use this to fix existing database after schema migration
-- ============================================================

-- Step 1: Clear all warehouse manager assignments
UPDATE "Warehouse" SET managerId = NULL WHERE managerId IS NOT NULL;

-- Step 2: Clear all user warehouse assignments
UPDATE "User" SET warehouseId = NULL WHERE warehouseId IS NOT NULL;

-- Step 3: Delete all test users (keep only real users if any)
DELETE FROM "User" WHERE email LIKE '%@wms.com' OR email LIKE '%test@%';

-- Step 4: Verify cleanup
SELECT 'Warehouses without managers:' as status, COUNT(*) as count FROM "Warehouse" WHERE managerId IS NULL;
SELECT 'Users without warehouse:' as status, COUNT(*) as count FROM "User" WHERE warehouseId IS NULL;
SELECT 'Remaining users:' as status, COUNT(*) as count FROM "User";

-- ============================================================
-- Now you can run TEST_USERS.sql to recreate test users
-- ============================================================
