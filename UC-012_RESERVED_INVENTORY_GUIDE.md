# UC-012: Reserved Inventory Management - Implementation Guide

## 📋 Overview

UC-012 implements a comprehensive reservation system that tracks stock reserved for orders, transfers, and production, ensuring accurate available quantity calculations and preventing overselling.

**Status**: ✅ **FULLY IMPLEMENTED** (December 7, 2025)

---

## 🎯 Features Implemented

### 1. Reservation Types (4 Types)

| Type           | Description                                  | Use Case                        |
| -------------- | -------------------------------------------- | ------------------------------- |
| **ORDER**      | Stock reserved for customer orders           | E-commerce, sales orders        |
| **TRANSFER**   | Stock reserved for inter-warehouse transfers | Warehouse redistribution        |
| **PRODUCTION** | Stock reserved for manufacturing/assembly    | Production planning             |
| **MANUAL**     | Manual reservation by warehouse staff        | Special requests, VIP customers |

### 2. Reservation Status (4 States)

-   **ACTIVE** (Green): Reservation is active and holding stock
-   **FULFILLED** (Blue): Order shipped, reservation completed
-   **RELEASED** (Gray): Reservation cancelled, stock returned
-   **EXPIRED** (Red): Reservation expired automatically

### 3. Automatic Quantity Management

```typescript
// When creating reservation:
reservedQty += reservationQty
availableQty -= reservationQty
totalQty remains unchanged

// When releasing reservation:
reservedQty -= reservationQty
availableQty += reservationQty

// When fulfilling reservation (shipped):
quantity -= reservationQty
reservedQty -= reservationQty
availableQty remains unchanged
```

### 4. Expiry Management

-   **Optional Expiry Date**: Set expiration time for reservations
-   **Auto-Expiry**: Scheduled job automatically expires old reservations
-   **Manual Trigger**: Dashboard button to expire all old reservations
-   **Expiry Warnings**: Visual indicators for reservations expiring within 24 hours

### 5. Reservations Dashboard (`/dashboard/reservations`)

-   **Summary Cards**: 6 cards (Total, Active, Fulfilled, Released, Expired, Total Reserved Qty)
-   **Advanced Filtering**: Status, Type, Reference/Item search
-   **Bulk Operations**: Select multiple reservations for release
-   **Expiry Indicators**: Color-coded warnings for expiring/expired reservations
-   **Full Details**: Item info, location, quantity, timestamps, created by

### 6. Transaction Safety

-   All operations use Prisma transactions
-   Atomic updates (reservation + inventory)
-   Data integrity guaranteed
-   Rollback on errors

---

## 🗄️ Database Schema

### Reservation Model

```prisma
model Reservation {
  id              String        @id @default(cuid())
  reservationType String        // ORDER, TRANSFER, PRODUCTION, MANUAL
  referenceNo     String        // Order number, Transfer ID, etc.
  quantity        Int
  status          String        @default("ACTIVE") // ACTIVE, RELEASED, EXPIRED, FULFILLED
  notes           String?
  expiresAt       DateTime?     // Auto-release if expired
  releasedAt      DateTime?
  fulfilledAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  inventoryItemId String
  createdById     String
  releasedById    String?

  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  createdBy       User          @relation("ReservationCreatedBy", fields: [createdById], references: [id])
  releasedBy      User?         @relation("ReservationReleasedBy", fields: [releasedById], references: [id])

  @@index([status])
  @@index([reservationType])
  @@index([referenceNo])
  @@index([inventoryItemId])
  @@index([createdById])
  @@index([expiresAt])
  @@index([createdAt])
}
```

### InventoryItem Updates

```prisma
model InventoryItem {
  id                String        @id @default(cuid())
  quantity          Int           @default(0)      // Total physical stock
  reservedQty       Int           @default(0)      // Stock reserved for orders
  availableQty      Int           @default(0)      // Free stock (quantity - reservedQty)
  // ... other fields
  reservations      Reservation[]
}
```

**Quantity Relationships:**

```
availableQty = quantity - reservedQty

Example:
- quantity: 100 (total in warehouse)
- reservedQty: 30 (20 for order A, 10 for transfer B)
- availableQty: 70 (can be sold/transferred)
```

---

## 🚀 Usage

### API Endpoints

#### 1. Create Reservation

```bash
POST /api/reservations
Headers:
  - Authorization: Bearer <jwt-token>
  - Content-Type: application/json

Body:
{
  "inventoryItemId": "item-uuid",
  "quantity": 50,
  "reservationType": "ORDER",
  "referenceNo": "ORD-2025-001",
  "notes": "VIP customer order",
  "expiresAt": "2025-12-10T23:59:59Z"  // Optional
}
```

**Response**:

```json
{
    "success": true,
    "message": "Successfully reserved 50 units",
    "reservation": {
        "id": "reservation-uuid",
        "reservationType": "ORDER",
        "referenceNo": "ORD-2025-001",
        "quantity": 50,
        "status": "ACTIVE",
        "inventoryItem": {
            "quantity": 100,
            "reservedQty": 50,
            "availableQty": 50,
            "itemMaster": {
                "sku": "ITEM-001",
                "name": "Product A"
            }
        }
    }
}
```

**Validation**:

-   ✅ Checks available quantity before reserving
-   ✅ Returns error if insufficient stock
-   ✅ Validates reservation type
-   ✅ Requires all mandatory fields

#### 2. List Reservations (with Filtering)

```bash
GET /api/reservations
Query Parameters:
  - status: ACTIVE | RELEASED | FULFILLED | EXPIRED
  - reservationType: ORDER | TRANSFER | PRODUCTION | MANUAL
  - warehouseId: <warehouse-uuid>
  - referenceNo: <search-term>

Headers:
  - Authorization: Bearer <jwt-token>
```

**Response**:

```json
{
    "reservations": [
        {
            "id": "reservation-uuid",
            "reservationType": "ORDER",
            "referenceNo": "ORD-2025-001",
            "quantity": 50,
            "status": "ACTIVE",
            "expiresAt": "2025-12-10T23:59:59Z",
            "createdAt": "2025-12-07T10:00:00Z",
            "inventoryItem": {
                "itemMaster": {
                    "sku": "ITEM-001",
                    "name": "Product A",
                    "category": { "name": "Electronics" }
                },
                "warehouse": {
                    "name": "Main Warehouse",
                    "code": "WH-01"
                }
            },
            "createdBy": {
                "fullName": "John Doe",
                "email": "john@company.com"
            }
        }
    ],
    "summary": {
        "total": 25,
        "active": 10,
        "released": 8,
        "fulfilled": 5,
        "expired": 2,
        "totalReservedQty": 450
    }
}
```

#### 3. Release Reservation (Cancel Order)

```bash
POST /api/reservations
Headers:
  - Authorization: Bearer <jwt-token>
  - Content-Type: application/json

Body:
{
  "action": "release",
  "reservationIds": ["reservation-uuid-1", "reservation-uuid-2"],
  "notes": "Customer cancelled order"
}
```

**Response**:

```json
{
    "success": true,
    "message": "Released 2 reservation(s)",
    "released": 2,
    "errors": []
}
```

**Effect**:

-   Status changed to RELEASED
-   releasedAt timestamp set
-   releasedById set to current user
-   Stock returned to available:
    ```
    reservedQty -= reservation.quantity
    availableQty += reservation.quantity
    ```

#### 4. Fulfill Reservation (Ship Order)

```bash
POST /api/reservations
Headers:
  - Authorization: Bearer <jwt-token>
  - Content-Type: application/json

Body:
{
  "action": "fulfill",
  "reservationId": "reservation-uuid"
}
```

**Response**:

```json
{
    "success": true,
    "message": "Successfully fulfilled 50 units",
    "reservation": {
        "id": "reservation-uuid",
        "status": "FULFILLED",
        "fulfilledAt": "2025-12-07T14:30:00Z"
    }
}
```

**Effect**:

-   Status changed to FULFILLED
-   fulfilledAt timestamp set
-   Actual stock reduced:
    ```
    quantity -= reservation.quantity
    reservedQty -= reservation.quantity
    ```

#### 5. Manual Expire Old Reservations

```bash
POST /api/reservations/expire
Headers:
  - Authorization: Bearer <jwt-token>

Access: ADMIN and SUPERVISOR only (403 for OPERATOR)
```

**Response**:

```json
{
    "success": true,
    "message": "Reservation expiration check completed",
    "expiredCount": 3,
    "errors": []
}
```

---

## 📊 Reservation Workflows

### Workflow 1: Create Order Reservation

```
1. Customer places order for 50 units of ITEM-001
   ↓
2. System checks available stock:
   - Current: quantity=100, reserved=20, available=80
   - Required: 50
   - Check: available (80) >= required (50) ✓
   ↓
3. Create reservation:
   POST /api/reservations
   {
     "inventoryItemId": "item-001-warehouse-01",
     "quantity": 50,
     "reservationType": "ORDER",
     "referenceNo": "ORD-2025-123",
     "expiresAt": "2025-12-10T23:59:59Z"
   }
   ↓
4. System updates inventory in transaction:
   - reservedQty: 20 → 70 (+50)
   - availableQty: 80 → 30 (-50)
   - quantity: 100 (unchanged)
   ↓
5. Reservation created (status: ACTIVE)
   ✓ Stock reserved successfully
   ✓ Other customers see availableQty=30
```

### Workflow 2: Ship Order (Fulfill)

```
1. Order ready to ship
   ↓
2. Warehouse picks items (50 units)
   ↓
3. System fulfills reservation:
   POST /api/reservations
   {
     "action": "fulfill",
     "reservationId": "res-123"
   }
   ↓
4. System updates inventory in transaction:
   - quantity: 100 → 50 (-50)  // Physical stock reduced
   - reservedQty: 70 → 20 (-50)  // Release reservation
   - availableQty: 30 (unchanged)  // Already accounted
   ↓
5. Reservation status: ACTIVE → FULFILLED
   ✓ Order shipped
   ✓ Stock levels accurate
```

### Workflow 3: Cancel Order (Release)

```
1. Customer cancels order
   ↓
2. System releases reservation:
   POST /api/reservations
   {
     "action": "release",
     "reservationIds": ["res-123"],
     "notes": "Customer requested cancellation"
   }
   ↓
3. System updates inventory in transaction:
   - reservedQty: 70 → 20 (-50)  // Release reservation
   - availableQty: 30 → 80 (+50)  // Return to available
   - quantity: 100 (unchanged)  // No physical change
   ↓
4. Reservation status: ACTIVE → RELEASED
   ✓ Stock returned to available pool
   ✓ Can be sold to other customers
```

### Workflow 4: Auto-Expire Reservations

```
1. Scheduled job runs (hourly/daily)
   ↓
2. System finds expired reservations:
   - WHERE status = 'ACTIVE'
   - AND expiresAt <= NOW()
   ↓
3. For each expired reservation:
   - Update status: ACTIVE → EXPIRED
   - Return stock to available:
     * reservedQty -= quantity
     * availableQty += quantity
   - Set releasedAt timestamp
   ↓
4. Log expiration events
   ✓ Old reservations cleaned up
   ✓ Stock returned to circulation
```

---

## 🧪 Testing Guide

### Test Scenario 1: Create Reservation

**Setup**:

-   Item: ITEM-001 in Warehouse WH-01
-   Current stock: quantity=100, reserved=0, available=100

**Steps**:

1. Navigate to `/dashboard/reservations`
2. Open developer console or use API client
3. Create reservation:
    ```javascript
    fetch('/api/reservations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
        },
        body: JSON.stringify({
            inventoryItemId: 'item-001-uuid',
            quantity: 30,
            reservationType: 'ORDER',
            referenceNo: 'TEST-ORD-001',
        }),
    });
    ```

**Expected**:

-   ✅ Reservation created with status ACTIVE
-   ✅ Inventory updated: reserved=30, available=70
-   ✅ Appears in dashboard reservations list
-   ✅ Summary card "Active" count increased

**Verification**:

```sql
SELECT quantity, reservedQty, availableQty
FROM InventoryItem
WHERE id = 'item-001-uuid';
-- Should show: 100, 30, 70
```

### Test Scenario 2: Insufficient Stock Validation

**Setup**:

-   Item with: quantity=100, reserved=80, available=20

**Steps**:

1. Attempt to reserve 50 units (more than available=20)
    ```javascript
    // Same API call with quantity=50
    ```

**Expected**:

-   ❌ API returns 400 error
-   ❌ Error message: "Insufficient available quantity. Available: 20, Required: 50"
-   ✅ No reservation created
-   ✅ Inventory unchanged

### Test Scenario 3: Release Reservation

**Setup**:

-   Active reservation: 30 units for ORD-001
-   Current: quantity=100, reserved=30, available=70

**Steps**:

1. In dashboard, select reservation
2. Click "Release Selected"
3. Confirm dialog

**Expected**:

-   ✅ Reservation status: ACTIVE → RELEASED
-   ✅ releasedAt timestamp set
-   ✅ Inventory: reserved=0, available=100
-   ✅ Stock returned to available pool

### Test Scenario 4: Fulfill Reservation

**Setup**:

-   Active reservation: 30 units
-   Current: quantity=100, reserved=30, available=70

**Steps**:

1. Use API to fulfill:
    ```javascript
    fetch('/api/reservations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
            action: 'fulfill',
            reservationId: 'res-uuid',
        }),
    });
    ```

**Expected**:

-   ✅ Reservation status: ACTIVE → FULFILLED
-   ✅ Inventory: quantity=70, reserved=0, available=70
-   ✅ Physical stock reduced by 30
-   ✅ fulfilledAt timestamp set

### Test Scenario 5: Auto-Expiry

**Setup**:

-   Create reservation with past expiry date:
    ```javascript
    {
      ...
      expiresAt: "2025-12-06T00:00:00Z"  // Yesterday
    }
    ```

**Steps**:

1. Click "Expire Old Reservations" button in dashboard
2. Wait for API response

**Expected**:

-   ✅ Expired reservation count shown
-   ✅ Reservation status: ACTIVE → EXPIRED
-   ✅ Stock returned to available
-   ✅ Dashboard refreshes automatically

### Test Scenario 6: Expiry Warning Indicators

**Setup**:

-   Create reservation expiring in 12 hours

**Steps**:

1. View reservations dashboard
2. Locate the reservation in list

**Expected**:

-   ⚠️ Orange "Expiring soon" warning displayed
-   🟠 Expiry date highlighted in orange
-   ⚠️ Warning text: "Expiring soon"

### Test Scenario 7: Bulk Release

**Setup**:

-   Create 3 active reservations

**Steps**:

1. In dashboard, check all 3 reservations
2. Click "Release Selected (3)"
3. Confirm

**Expected**:

-   ✅ All 3 reservations released
-   ✅ Success message: "Released 3 reservation(s)"
-   ✅ All stock returned to available
-   ✅ Summary cards updated

---

## 🔧 Configuration

### Expiry Schedule (Optional Automated Cron)

For production, set up automated expiry checking:

#### Option 1: Node Cron (In-App)

```typescript
// lib/cron-jobs.ts
import cron from 'node-cron';
import { expireOldReservations } from '@/lib/reservation-manager';

// Run every hour
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running reservation expiry check...');
    const result = await expireOldReservations();
    console.log(`[CRON] Expired ${result.expiredCount} reservations`);
});
```

#### Option 2: External Cron Job

```bash
# crontab entry - run every 6 hours
0 */6 * * * curl -X POST http://localhost:3009/api/reservations/expire \
  -H "Authorization: Bearer <admin-jwt-token>"
```

#### Option 3: Vercel Cron (Production)

```json
// vercel.json
{
    "crons": [
        {
            "path": "/api/reservations/expire",
            "schedule": "0 */6 * * *"
        }
    ]
}
```

---

## 📝 Best Practices

### 1. Always Set Expiry for Time-Sensitive Reservations

```javascript
// Good: 24-hour expiry for customer orders
{
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000);
}

// Bad: No expiry (stock locked forever if order abandoned)
{
    expiresAt: null;
}
```

### 2. Use Appropriate Reservation Types

-   **ORDER**: E-commerce, B2B sales
-   **TRANSFER**: Inter-warehouse movements
-   **PRODUCTION**: Manufacturing raw materials
-   **MANUAL**: Special cases, VIP priority

### 3. Monitor Reserved Quantity

-   Set up alerts when reservedQty > 70% of quantity
-   Prevents stockouts from over-reservation
-   Helps with replenishment planning

### 4. Clean Up Old Reservations

-   Run expiry check regularly (hourly or daily)
-   Archive old fulfilled/released reservations (monthly)
-   Monitor expired count for process improvement

### 5. Validate Before Fulfillment

```javascript
// Check reservation is still active before shipping
const reservation = await getReservation(id);
if (reservation.status !== 'ACTIVE') {
    throw new Error('Cannot fulfill non-active reservation');
}
```

---

## 🔍 Troubleshooting

### Issue: Negative Available Quantity

**Symptoms**: `availableQty < 0` in database

**Causes**:

-   Manual database edits
-   Race condition in concurrent reservations
-   Bug in fulfillment logic

**Solutions**:

1. Check inventory integrity:

    ```sql
    SELECT id, quantity, reservedQty, availableQty,
           (quantity - reservedQty) as calculated_available
    FROM InventoryItem
    WHERE availableQty != (quantity - reservedQty);
    ```

2. Fix with recalculation:

    ```sql
    UPDATE InventoryItem
    SET availableQty = quantity - reservedQty
    WHERE availableQty != (quantity - reservedQty);
    ```

3. Add validation constraint (future enhancement):
    ```sql
    ALTER TABLE InventoryItem
    ADD CONSTRAINT check_available_qty
    CHECK (availableQty >= 0);
    ```

### Issue: Reservation Created with Insufficient Stock

**Symptoms**: availableQty becomes negative after reservation

**Debug**:

1. Check reservation creation logs
2. Verify validation logic in `reserveStock()`
3. Look for race conditions (multiple simultaneous reservations)

**Prevention**:

-   Use database-level locking (FOR UPDATE)
-   Implement optimistic locking with version field
-   Add retry logic with exponential backoff

### Issue: Stock Not Released After Cancellation

**Symptoms**: reservedQty still high after releasing reservation

**Debug**:

1. Check reservation status:
    ```sql
    SELECT * FROM Reservation WHERE id = 'xxx';
    ```
2. Verify transaction completed successfully
3. Check error logs

**Fix**:

```javascript
// Manually release if needed
await releaseReservation({
    reservationId: 'stuck-reservation-id',
    releasedById: 'admin-user-id',
    notes: 'Manual fix for stuck reservation',
});
```

### Issue: Expiry Not Running Automatically

**Symptoms**: Old expired reservations still showing as ACTIVE

**Solutions**:

1. **Manual trigger**: Click "Expire Old Reservations" in dashboard
2. **Check cron configuration**: Verify cron job is running
3. **Database check**:
    ```sql
    SELECT COUNT(*) FROM Reservation
    WHERE status = 'ACTIVE' AND expiresAt < datetime('now');
    ```

---

## 📊 Performance Considerations

### Database Indexes

All critical fields indexed:

-   `status`, `reservationType`, `referenceNo`
-   `inventoryItemId`, `createdById`, `expiresAt`
-   `createdAt` for time-based queries

### Query Optimization

-   Filtering at database level (WHERE clauses)
-   Include optimization with select specific fields
-   Pagination recommended for large datasets (future)

### Transaction Performance

-   Atomic updates prevent race conditions
-   Rollback on error maintains data integrity
-   Connection pooling for concurrent requests

---

## ✅ Completion Checklist

-   [x] Reservation model with relations
-   [x] Migration executed successfully
-   [x] API endpoints (GET /api/reservations, POST create/release/fulfill)
-   [x] Expiry endpoint (POST /api/reservations/expire)
-   [x] reservation-manager.ts utility functions
-   [x] Reserve stock function with validation
-   [x] Release reservation function
-   [x] Fulfill reservation function
-   [x] Auto-expiry function
-   [x] Summary statistics function
-   [x] Reservations dashboard UI
-   [x] Summary cards (6 cards)
-   [x] Filtering system (status, type, search)
-   [x] Bulk release operations
-   [x] Expiry warnings and indicators
-   [x] Navigation menu integration
-   [x] Transaction-based updates
-   [x] Full audit trail
-   [x] Documentation and testing guide

---

## 🚀 Next Steps

After UC-012 completion, recommended next implementations:

1. **UC-013: Create Stock Movement** - Track INBOUND/OUTBOUND/TRANSFER/ADJUSTMENT
2. **UC-014: View Movement History** - Comprehensive audit trail
3. **UC-016: Receive Goods** - Purchase order processing with auto-reservation
4. **UC-019: Create Pick List** - Generate picking tasks with reservation fulfillment

---

## 📞 Support

For issues or questions about UC-012 implementation:

-   Check console logs for detailed error messages
-   Verify inventory quantities with SQL queries
-   Test reservation workflow in dashboard
-   Review API responses in browser DevTools
-   Check transaction logs for failures

**Implementation Date**: December 7, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
