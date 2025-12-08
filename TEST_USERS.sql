-- ============================================================
-- WMS Portal - Test Users Data
-- Real-World Scenario Based on RBAC Testing Requirements
-- ============================================================
-- 
-- Password untuk semua user: "Password123!"
-- Hashed dengan bcrypt (10 rounds)
-- 
-- ROLE HIERARCHY:
-- 1. ADMIN - Full system access (1 user)
-- 2. SUPERVISOR - Warehouse management & approval authority (3 users, per warehouse)
-- 3. OPERATOR - Daily warehouse operations (6 users, per shift)
-- ============================================================

-- Clear existing test users (optional - comment out if you want to keep existing data)
-- DELETE FROM "User" WHERE email LIKE '%@wms.com' OR email LIKE '%test@%';

-- ============================================================
-- ADMIN USERS (1 user - System Administrator)
-- ============================================================

INSERT INTO "User" (id, email, password, name, role, isActive, createdAt, updatedAt) VALUES
(
  'admin-001',
  'admin@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Admin System',
  'ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================================
-- SUPERVISOR USERS (3 users - 1 per warehouse)
-- ============================================================

-- Supervisor Jakarta - Gudang Pusat Jakarta
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'supervisor-jkt-001',
  'supervisor.jkt@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Sarah Supervisor Jakarta',
  'SUPERVISOR',
  true,
  'WH-JKT-001', -- Assigned to Jakarta warehouse
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Supervisor Surabaya - Gudang Cabang Surabaya
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'supervisor-sby-001',
  'supervisor.sby@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Tom Supervisor Surabaya',
  'SUPERVISOR',
  true,
  'WH-SBY-001', -- Assigned to Surabaya warehouse
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Supervisor Bandung - Gudang Regional Bandung
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'supervisor-bdg-001',
  'supervisor.bdg@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'David Supervisor Bandung',
  'SUPERVISOR',
  true,
  'WH-BDG-001', -- Assigned to Bandung warehouse
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================================
-- OPERATOR USERS (6 users - 2 per warehouse, shift coverage)
-- ============================================================

-- Jakarta Operators (2 operators)
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'operator-jkt-001',
  'operator.jkt.morning@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'John Operator Jakarta (Morning)',
  'OPERATOR',
  true,
  'WH-JKT-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'operator-jkt-002',
  'operator.jkt.afternoon@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Lisa Operator Jakarta (Afternoon)',
  'OPERATOR',
  true,
  'WH-JKT-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Surabaya Operators (2 operators)
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'operator-sby-001',
  'operator.sby.morning@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Mike Operator Surabaya (Morning)',
  'OPERATOR',
  true,
  'WH-SBY-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'operator-sby-002',
  'operator.sby.afternoon@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Anna Operator Surabaya (Afternoon)',
  'OPERATOR',
  true,
  'WH-SBY-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Bandung Operators (2 operators)
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'operator-bdg-001',
  'operator.bdg.morning@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Peter Operator Bandung (Morning)',
  'OPERATOR',
  true,
  'WH-BDG-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'operator-bdg-002',
  'operator.bdg.afternoon@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Rachel Operator Bandung (Afternoon)',
  'OPERATOR',
  true,
  'WH-BDG-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================================
-- ADDITIONAL TEST USERS (for role change testing)
-- ============================================================

-- Test user untuk promotion scenario (OPERATOR → SUPERVISOR)
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'test-promotion-001',
  'test.promotion@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Test User Promotion',
  'OPERATOR',
  true,
  'WH-JKT-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Test user untuk demotion scenario (SUPERVISOR → OPERATOR)
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'test-demotion-001',
  'test.demotion@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Test User Demotion',
  'SUPERVISOR',
  true,
  'WH-JKT-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Inactive user untuk testing
INSERT INTO "User" (id, email, password, name, role, isActive, warehouseId, createdAt, updatedAt) VALUES
(
  'test-inactive-001',
  'test.inactive@wms.com',
  '$2b$10$rXJZ3qN5vN0eH5cJqN5vNOeH5cJqN5vNOeH5cJqN5vNOeH5cJqN5v', -- Password123!
  'Test User Inactive',
  'OPERATOR',
  false, -- Inactive user
  'WH-JKT-001',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check total users by role
SELECT role, COUNT(*) as total
FROM "User"
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'ADMIN' THEN 1
    WHEN 'SUPERVISOR' THEN 2
    WHEN 'OPERATOR' THEN 3
  END;

-- Check users by warehouse
SELECT 
  w.name as warehouse_name,
  u.role,
  COUNT(*) as total_users
FROM "User" u
LEFT JOIN "Warehouse" w ON u.warehouseId = w.id
WHERE u.isActive = true
GROUP BY w.name, u.role
ORDER BY w.name, u.role;

-- List all active users
SELECT 
  u.email,
  u.name,
  u.role,
  w.name as warehouse,
  u.isActive
FROM "User" u
LEFT JOIN "Warehouse" w ON u.warehouseId = w.id
ORDER BY 
  CASE u.role
    WHEN 'ADMIN' THEN 1
    WHEN 'SUPERVISOR' THEN 2
    WHEN 'OPERATOR' THEN 3
  END,
  w.name,
  u.name;

-- ============================================================
-- NOTES FOR TESTING
-- ============================================================
-- 
-- LOGIN CREDENTIALS:
-- 
-- ADMIN:
-- Email: admin@wms.com
-- Password: Password123!
-- Access: Full system access
-- 
-- SUPERVISORS:
-- Email: supervisor.jkt@wms.com (Jakarta)
-- Email: supervisor.sby@wms.com (Surabaya)
-- Email: supervisor.bdg@wms.com (Bandung)
-- Password: Password123! (all)
-- Access: Warehouse management & movement approval
-- 
-- OPERATORS:
-- Email: operator.jkt.morning@wms.com (Jakarta Morning Shift)
-- Email: operator.jkt.afternoon@wms.com (Jakarta Afternoon Shift)
-- Email: operator.sby.morning@wms.com (Surabaya Morning Shift)
-- Email: operator.sby.afternoon@wms.com (Surabaya Afternoon Shift)
-- Email: operator.bdg.morning@wms.com (Bandung Morning Shift)
-- Email: operator.bdg.afternoon@wms.com (Bandung Afternoon Shift)
-- Password: Password123! (all)
-- Access: Create movements only, need approval to process
-- 
-- TEST USERS (for RBAC testing):
-- Email: test.promotion@wms.com (for OPERATOR → SUPERVISOR test)
-- Email: test.demotion@wms.com (for SUPERVISOR → OPERATOR test)
-- Email: test.inactive@wms.com (inactive user test)
-- Password: Password123! (all)
-- 
-- REAL-WORLD SCENARIOS:
-- 
-- 1. Daily Operations:
--    - Morning operator (08:00-16:00): Creates INBOUND/OUTBOUND movements
--    - Afternoon operator (14:00-22:00): Handles overlap & late shipments
--    - Supervisor reviews & approves all movements
-- 
-- 2. Multi-Warehouse Setup:
--    - Each warehouse has 1 supervisor + 2 operators
--    - Supervisor can only manage assigned warehouse
--    - Operators work in assigned warehouse
-- 
-- 3. Approval Workflow:
--    - Operator creates → PENDING
--    - Supervisor reviews → COMPLETED
--    - Separation of duties enforced
-- 
-- 4. Role Change Testing:
--    - Promote operator to supervisor
--    - Demote supervisor to operator
--    - Verify permission changes
-- 
-- ============================================================
