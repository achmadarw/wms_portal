-- Quick Test: Create Sarah (SUPERVISOR) and John (OPERATOR) for Jakarta

-- Step 1: Create Sarah as SUPERVISOR for Jakarta
INSERT INTO "User" (id, email, username, password, fullName, role, warehouseId, active, createdAt, updatedAt) VALUES
(
  'sarah-test-001',
  'sarah.supervisor@wms.com',
  'sarah_supervisor',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v',
  'Sarah Supervisor Jakarta',
  'SUPERVISOR',
  'WH-JKT-001',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Set Sarah as Jakarta warehouse manager
UPDATE "Warehouse" SET managerId = 'sarah-test-001' WHERE id = 'WH-JKT-001';

-- Verify Sarah is created and assigned
SELECT 'Sarah created and assigned:' as status;
SELECT 
  u.fullName, 
  u.role, 
  u.warehouseId,
  w.name as warehouse_name,
  CASE WHEN w.managerId = u.id THEN 'YES' ELSE 'NO' END as is_manager
FROM "User" u
LEFT JOIN "Warehouse" w ON u.warehouseId = w.id
WHERE u.id = 'sarah-test-001';

-- Step 2: Create John as OPERATOR for Jakarta
INSERT INTO "User" (id, email, username, password, fullName, role, warehouseId, active, createdAt, updatedAt) VALUES
(
  'john-test-001',
  'john.operator@wms.com',
  'john_operator',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v',
  'John Operator Jakarta',
  'OPERATOR',
  'WH-JKT-001',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify BOTH users exist
SELECT 'Both users should exist:' as status;
SELECT 
  u.fullName, 
  u.role, 
  u.warehouseId,
  w.name as warehouse_name,
  CASE WHEN w.managerId = u.id THEN 'YES' ELSE 'NO' END as is_manager
FROM "User" u
LEFT JOIN "Warehouse" w ON u.warehouseId = w.id
WHERE u.id IN ('sarah-test-001', 'john-test-001')
ORDER BY u.role DESC;

-- Verify warehouse has correct manager and user count
SELECT 'Warehouse Jakarta details:' as status;
SELECT 
  w.name,
  w.managerId,
  m.fullName as manager_name,
  COUNT(u.id) as total_users
FROM "Warehouse" w
LEFT JOIN "User" m ON w.managerId = m.id
LEFT JOIN "User" u ON u.warehouseId = w.id
WHERE w.id = 'WH-JKT-001'
GROUP BY w.id, w.name, w.managerId, m.fullName;
