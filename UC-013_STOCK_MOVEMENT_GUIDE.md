# UC-013: Create Stock Movement - Implementation Guide

## Overview
UC-013 implements comprehensive stock movement tracking for all inventory transactions in the WMS. This system automatically updates inventory quantities and maintains a complete audit trail of all stock movements across warehouses and bin locations.

**Implementation Date:** December 7, 2024  
**Status:** ✅ Complete  
**Location:** `/wms_portal/src/`

---

## Movement Types

The system supports 6 types of stock movements, each with specific inventory impact:

### 1. INBOUND 📥
**Purpose:** Receiving goods into inventory  
**Inventory Impact:**
- `quantity` += movement quantity
- `availableQty` += movement quantity
- Optionally sets `toBin` location

**Use Cases:**
- Purchase order receipts
- Production output
- Transfer receipts from other warehouses
- Initial stock setup

**Example:**
```
Receive 100 units → Current: 50 → New: 150
```

### 2. OUTBOUND 📤
**Purpose:** Shipping goods from inventory  
**Inventory Impact:**
- `quantity` -= movement quantity
- `availableQty` -= movement quantity
- Optionally records `fromBin` location

**Validation:**
- Checks sufficient available quantity before creating
- Prevents negative inventory

**Use Cases:**
- Customer order shipments
- Transfer shipments to other warehouses
- Production consumption

**Example:**
```
Ship 30 units → Current: 150 → New: 120
```

### 3. TRANSFER 🔄
**Purpose:** Moving items between bin locations  
**Inventory Impact:**
- Updates item `binId` to destination bin
- Decreases `fromBin.currentQty`
- Increases `toBin.currentQty`
- Total quantity unchanged

**Required Fields:**
- `fromBin` (source location)
- `toBin` (destination location)

**Use Cases:**
- Warehouse reorganization
- Optimizing pick paths
- Moving slow-movers to back locations
- Consolidating partial bins

**Example:**
```
Transfer 50 units: A-01-01 → B-02-03
Bin A-01-01: 100 → 50
Bin B-02-03: 20 → 70
```

### 4. ADJUSTMENT ⚖️
**Purpose:** Correcting inventory discrepancies  
**Inventory Impact:**
- Sets `quantity` to absolute value (not increment)
- Automatically adjusts `availableQty` (quantity - reservedQty)

**Important:** Unlike other types, adjustment sets the FINAL quantity, not a change amount.

**Use Cases:**
- Physical count corrections
- Fixing system errors
- Cycle count adjustments
- Reconciliation after audits

**Example:**
```
Adjustment to 75 → Current: 120 → New: 75 (reduction of 45)
Adjustment to 200 → Current: 75 → New: 200 (increase of 125)
```

### 5. RETURN ↩️
**Purpose:** Processing customer returns  
**Inventory Impact:**
- `quantity` += movement quantity
- `availableQty` += movement quantity
- Optionally sets `toBin` for returned goods location

**Use Cases:**
- Customer product returns
- Defective item returns for inspection
- Cancelled order returns

**Example:**
```
Return 10 units → Current: 75 → New: 85
```

### 6. DAMAGE ⚠️
**Purpose:** Recording damaged or unsellable inventory  
**Inventory Impact:**
- `quantity` -= movement quantity
- `availableQty` -= movement quantity
- Optionally records `fromBin` where damage occurred

**Use Cases:**
- Physical damage during handling
- Expired products
- Quality failures
- Shrinkage/loss

**Example:**
```
Damage 5 units → Current: 85 → New: 80
```

---

## Reference Number Format

Every movement gets a unique reference number automatically generated:

**Format:** `MOV-{TYPE}-{TIMESTAMP}-{RANDOM}`

**Components:**
- `MOV` - Movement prefix
- `{TYPE}` - Movement type (INBOUND, OUTBOUND, etc.)
- `{TIMESTAMP}` - YYYYMMDDHHmmss format
- `{RANDOM}` - 4-character alphanumeric (for uniqueness)

**Examples:**
```
MOV-INBOUND-20241207-143025-A4B2
MOV-OUTBOUND-20241207-150612-X7K9
MOV-TRANSFER-20241207-163345-M2P1
MOV-ADJUSTMENT-20241207-171823-Q5R8
MOV-RETURN-20241207-184501-N3W6
MOV-DAMAGE-20241207-192734-C8V4
```

**Benefits:**
- Unique identification for every movement
- Type immediately visible in reference
- Chronologically sortable
- Audit trail tracking
- Customer/vendor communication

---

## Technical Architecture

### File Structure

```
wms_portal/src/
├── lib/
│   └── movement-manager.ts          # Core business logic (400+ lines)
├── app/
│   ├── api/
│   │   └── movements/
│   │       └── route.ts             # REST API endpoints (260 lines)
│   └── dashboard/
│       └── movements/
│           └── page.tsx             # UI dashboard (876 lines)
└── prisma/
    └── schema.prisma                # Movement model
```

### Movement Manager (`lib/movement-manager.ts`)

**Core Functions:**

#### 1. `generateMovementReferenceNo(type: MovementType): string`
Generates unique reference numbers with type prefix and timestamp.

```typescript
const refNo = await generateMovementReferenceNo('INBOUND');
// Returns: MOV-INBOUND-20241207-143025-A4B2
```

#### 2. `createMovement(data: CreateMovementData): Promise<Movement>`
Main function for creating movements with full validation and inventory updates.

**Parameters:**
```typescript
interface CreateMovementData {
  itemId: number;
  type: MovementType;
  quantity: number;
  warehouseId: number;
  fromBin?: string;
  toBin?: string;
  notes?: string;
  createdById: number;
}
```

**Process:**
1. Generate unique reference number
2. Validate movement (stock availability, bins exist, quantity > 0)
3. Begin database transaction
4. Create movement record
5. Update inventory based on type
6. Update bin quantities (for transfers)
7. Commit transaction
8. Return created movement with full details

**Example:**
```typescript
const movement = await createMovement({
  itemId: 15,
  type: 'OUTBOUND',
  quantity: 50,
  warehouseId: 1,
  fromBin: 'A-01-05',
  notes: 'Customer order #12345',
  createdById: userId
});
```

#### 3. `getMovementSummary(filters): Promise<Summary>`
Aggregates statistics about movements.

**Returns:**
```typescript
{
  total: 1250,
  byType: {
    INBOUND: 450,
    OUTBOUND: 380,
    TRANSFER: 220,
    ADJUSTMENT: 120,
    RETURN: 55,
    DAMAGE: 25
  },
  byStatus: {
    PENDING: 45,
    IN_PROGRESS: 12,
    COMPLETED: 1190,
    CANCELLED: 3
  },
  quantities: {
    totalIn: 25680,
    totalOut: 18420,
    net: 7260
  }
}
```

#### 4. `validateMovement(data): Promise<ValidationResult>`
Pre-validates movement before creation.

**Checks:**
- Item exists and belongs to warehouse
- Stock availability (for OUTBOUND/DAMAGE)
- Bin existence and capacity
- Quantity > 0
- Required fields for type

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

### API Endpoints (`app/api/movements/route.ts`)

#### GET `/api/movements`
**Purpose:** List movements with filtering and statistics

**Query Parameters:**
- `type` - Filter by movement type (INBOUND, OUTBOUND, etc.)
- `status` - Filter by status (PENDING, COMPLETED, etc.)
- `warehouseId` - Filter by warehouse
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)
- `search` - Search in reference, SKU, item name

**Response:**
```json
{
  "movements": [
    {
      "id": 123,
      "referenceNo": "MOV-INBOUND-20241207-143025-A4B2",
      "type": "INBOUND",
      "quantity": 100,
      "status": "COMPLETED",
      "fromBin": null,
      "toBin": "A-01-05",
      "notes": "PO-2024-001",
      "createdAt": "2024-12-07T14:30:25Z",
      "item": {
        "id": 15,
        "quantity": 550,
        "availableQty": 480,
        "itemMaster": {
          "sku": "ITEM-001",
          "name": "Widget Pro",
          "unitOfMeasure": "pcs"
        }
      },
      "warehouse": {
        "id": 1,
        "name": "Main Warehouse"
      },
      "createdBy": {
        "fullName": "John Doe"
      }
    }
  ],
  "stats": {
    "totalMovements": 1250,
    "inbound": 450,
    "outbound": 380,
    "adjustments": 120,
    "transfers": 220,
    "totalQuantityIn": 25680,
    "totalQuantityOut": 18420
  }
}
```

**Example Requests:**
```bash
# All movements
GET /api/movements

# Inbound movements only
GET /api/movements?type=INBOUND

# Movements for specific warehouse
GET /api/movements?warehouseId=1

# Movements in date range
GET /api/movements?dateFrom=2024-12-01&dateTo=2024-12-07

# Search by reference or item
GET /api/movements?search=MOV-INBOUND

# Combined filters
GET /api/movements?type=OUTBOUND&status=COMPLETED&warehouseId=1&dateFrom=2024-12-01
```

#### POST `/api/movements`
**Purpose:** Create new movement

**Request Body:**
```json
{
  "itemId": 15,
  "type": "OUTBOUND",
  "quantity": 50,
  "warehouseId": 1,
  "fromBin": "A-01-05",
  "toBin": null,
  "notes": "Customer order #12345"
}
```

**Field Requirements by Type:**

| Type | itemId | quantity | warehouseId | fromBin | toBin | Notes |
|------|--------|----------|-------------|---------|-------|-------|
| INBOUND | ✓ | ✓ | ✓ | - | Optional | Optional |
| OUTBOUND | ✓ | ✓ | ✓ | Optional | - | Optional |
| TRANSFER | ✓ | ✓ | ✓ | **Required** | **Required** | Optional |
| ADJUSTMENT | ✓ | ✓ | ✓ | - | - | Optional |
| RETURN | ✓ | ✓ | ✓ | - | Optional | Optional |
| DAMAGE | ✓ | ✓ | ✓ | Optional | - | Optional |

**Response:**
```json
{
  "movement": {
    "id": 124,
    "referenceNo": "MOV-OUTBOUND-20241207-150612-X7K9",
    "type": "OUTBOUND",
    "quantity": 50,
    "status": "COMPLETED",
    "fromBin": "A-01-05",
    "toBin": null,
    "notes": "Customer order #12345",
    "createdAt": "2024-12-07T15:06:12Z",
    "item": { /* full item details */ },
    "warehouse": { /* warehouse details */ },
    "createdBy": { /* user details */ }
  }
}
```

**Error Responses:**

```json
// Insufficient stock
{
  "error": "Insufficient available quantity. Available: 30, Requested: 50"
}

// Bin not found
{
  "error": "Bin location 'A-01-99' not found"
}

// Validation error
{
  "error": "Quantity must be greater than 0"
}

// Missing required fields
{
  "error": "Missing required fields: fromBin, toBin"
}
```

---

## Dashboard UI (`app/dashboard/movements/page.tsx`)

### Features

1. **Summary Statistics Cards**
   - Total movements count
   - Inbound movements
   - Outbound movements  
   - Adjustments count
   - Transfers count
   - Total quantity in
   - Total quantity out

2. **Advanced Filtering**
   - Movement type dropdown (6 types)
   - Status dropdown (4 statuses)
   - Date range (from/to)
   - Search (reference, SKU, item name)
   - Clear filters button

3. **Create Movement Modal**
   - Type selection with descriptions
   - Item picker (with current stock display)
   - Warehouse selector
   - Quantity input with validation
   - Conditional bin selectors (based on type)
   - Notes textarea
   - Real-time validation feedback

4. **Movements Table**
   - Reference number
   - Date & time
   - Item (SKU + name)
   - Type (with color badges)
   - Status (with color badges)
   - Quantity (with +/- indicator)
   - Warehouse
   - Location (from/to bins)
   - Notes
   - Created by

### Color Coding

**Movement Types:**
- 🟢 INBOUND - Green
- 🔴 OUTBOUND - Red
- 🔵 TRANSFER - Blue
- 🟡 ADJUSTMENT - Yellow
- 🟣 RETURN - Purple
- 🟠 DAMAGE - Orange

**Statuses:**
- 🟢 COMPLETED - Green
- 🔵 IN_PROGRESS - Blue
- 🟡 PENDING - Yellow
- 🔴 CANCELLED - Red

### Create Movement Form

#### Field Visibility by Type

**INBOUND:**
- ✓ Item (required)
- ✓ Warehouse (required)
- ✓ Quantity (required)
- ✓ To Bin (optional)
- ✓ Notes (optional)

**OUTBOUND:**
- ✓ Item (required)
- ✓ Warehouse (required)
- ✓ Quantity (required)
- ✓ From Bin (optional)
- ✓ Notes (optional)

**TRANSFER:**
- ✓ Item (required)
- ✓ Warehouse (required)
- ✓ Quantity (required)
- ✓ From Bin (**REQUIRED**)
- ✓ To Bin (**REQUIRED**)
- ✓ Notes (optional)

**ADJUSTMENT:**
- ✓ Item (required)
- ✓ Warehouse (required)
- ✓ Quantity (required - NEW absolute value)
- ✓ Notes (optional - recommended for audit)

**RETURN:**
- ✓ Item (required)
- ✓ Warehouse (required)
- ✓ Quantity (required)
- ✓ To Bin (optional)
- ✓ Notes (optional)

**DAMAGE:**
- ✓ Item (required)
- ✓ Warehouse (required)
- ✓ Quantity (required)
- ✓ From Bin (optional)
- ✓ Notes (optional - recommended to document damage)

---

## Database Schema

### Movement Model

```prisma
model Movement {
  id          Int      @id @default(autoincrement())
  referenceNo String   @unique
  
  item        InventoryItem @relation(fields: [itemId], references: [id])
  itemId      Int
  
  type        MovementType
  quantity    Int
  notes       String?
  
  status      MovementStatus @default(PENDING)
  
  fromBin     String?
  toBin       String?
  
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  warehouseId Int
  
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById Int
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([referenceNo])
  @@index([status])
  @@index([type])
  @@index([itemId])
  @@index([warehouseId])
  @@index([createdById])
  @@index([createdAt])
}

enum MovementType {
  INBOUND
  OUTBOUND
  TRANSFER
  ADJUSTMENT
  RETURN
  DAMAGE
}

enum MovementStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

**Indexes:** 7 indexes for optimal query performance on filters and searches.

---

## Testing Scenarios

### Test Case 1: INBOUND Movement
**Objective:** Verify receiving goods increases inventory

**Setup:**
- Item: WIDGET-001
- Current quantity: 100
- Current availableQty: 80

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "INBOUND",
  "quantity": 50,
  "warehouseId": 1,
  "toBin": "A-01-05",
  "notes": "PO-2024-001 receipt"
}
```

**Expected Result:**
- ✓ Movement created with status COMPLETED
- ✓ Reference: MOV-INBOUND-YYYYMMDD-HHmmss-XXXX
- ✓ Item quantity: 100 → 150 (+50)
- ✓ Item availableQty: 80 → 130 (+50)
- ✓ Movement visible in dashboard
- ✓ Statistics updated

### Test Case 2: OUTBOUND Movement (Success)
**Objective:** Verify shipping decreases inventory when sufficient stock

**Setup:**
- Item: WIDGET-001
- Current quantity: 150
- Current availableQty: 130

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "OUTBOUND",
  "quantity": 40,
  "warehouseId": 1,
  "fromBin": "A-01-05",
  "notes": "Order #12345"
}
```

**Expected Result:**
- ✓ Movement created with status COMPLETED
- ✓ Reference: MOV-OUTBOUND-YYYYMMDD-HHmmss-XXXX
- ✓ Item quantity: 150 → 110 (-40)
- ✓ Item availableQty: 130 → 90 (-40)
- ✓ Dashboard shows negative quantity in red

### Test Case 3: OUTBOUND Movement (Insufficient Stock)
**Objective:** Verify prevention of negative inventory

**Setup:**
- Item: WIDGET-001
- Current quantity: 110
- Current availableQty: 90

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "OUTBOUND",
  "quantity": 100,
  "warehouseId": 1
}
```

**Expected Result:**
- ✗ Movement creation fails
- ✓ Error: "Insufficient available quantity. Available: 90, Requested: 100"
- ✓ Inventory unchanged
- ✓ No movement record created

### Test Case 4: TRANSFER Movement
**Objective:** Verify bin-to-bin transfer updates locations and bin quantities

**Setup:**
- Item: WIDGET-001
- Current quantity: 110 (in bin A-01-05)
- Bin A-01-05 currentQty: 110
- Bin B-02-03 currentQty: 25

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "TRANSFER",
  "quantity": 60,
  "warehouseId": 1,
  "fromBin": "A-01-05",
  "toBin": "B-02-03",
  "notes": "Reorganization"
}
```

**Expected Result:**
- ✓ Movement created with status COMPLETED
- ✓ Reference: MOV-TRANSFER-YYYYMMDD-HHmmss-XXXX
- ✓ Item binId: A-01-05 → B-02-03
- ✓ Item total quantity unchanged: 110
- ✓ Bin A-01-05 currentQty: 110 → 50 (-60)
- ✓ Bin B-02-03 currentQty: 25 → 85 (+60)
- ✓ Dashboard shows both from and to bins

### Test Case 5: ADJUSTMENT Movement (Increase)
**Objective:** Verify adjustment sets absolute quantity (increase scenario)

**Setup:**
- Item: WIDGET-001
- Current quantity: 110
- Current reservedQty: 20
- Current availableQty: 90

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "ADJUSTMENT",
  "quantity": 200,
  "warehouseId": 1,
  "notes": "Physical count correction - found extra stock"
}
```

**Expected Result:**
- ✓ Movement created
- ✓ Reference: MOV-ADJUSTMENT-YYYYMMDD-HHmmss-XXXX
- ✓ Item quantity: 110 → 200 (absolute value, not +200!)
- ✓ Item availableQty: 90 → 180 (200 - 20 reserved)
- ✓ Net change: +90 units
- ✓ Movement shows quantity: 200

### Test Case 6: ADJUSTMENT Movement (Decrease)
**Objective:** Verify adjustment sets absolute quantity (decrease scenario)

**Setup:**
- Item: WIDGET-001
- Current quantity: 200
- Current reservedQty: 20
- Current availableQty: 180

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "ADJUSTMENT",
  "quantity": 150,
  "warehouseId": 1,
  "notes": "Physical count correction - missing stock"
}
```

**Expected Result:**
- ✓ Movement created
- ✓ Item quantity: 200 → 150 (absolute value)
- ✓ Item availableQty: 180 → 130 (150 - 20 reserved)
- ✓ Net change: -50 units
- ✓ Dashboard shows adjustment with yellow badge

### Test Case 7: RETURN Movement
**Objective:** Verify customer return increases inventory

**Setup:**
- Item: WIDGET-001
- Current quantity: 150

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "RETURN",
  "quantity": 15,
  "warehouseId": 1,
  "toBin": "RETURNS-01",
  "notes": "RMA-2024-789 - Customer return"
}
```

**Expected Result:**
- ✓ Movement created
- ✓ Reference: MOV-RETURN-YYYYMMDD-HHmmss-XXXX
- ✓ Item quantity: 150 → 165 (+15)
- ✓ Item availableQty increased by 15
- ✓ Dashboard shows purple badge

### Test Case 8: DAMAGE Movement
**Objective:** Verify damaged goods reduces inventory

**Setup:**
- Item: WIDGET-001
- Current quantity: 165

**Action:**
```json
POST /api/movements
{
  "itemId": 15,
  "type": "DAMAGE",
  "quantity": 10,
  "warehouseId": 1,
  "fromBin": "A-01-05",
  "notes": "Forklift accident - crushed packaging"
}
```

**Expected Result:**
- ✓ Movement created
- ✓ Reference: MOV-DAMAGE-YYYYMMDD-HHmmss-XXXX
- ✓ Item quantity: 165 → 155 (-10)
- ✓ Item availableQty decreased by 10
- ✓ Dashboard shows orange badge
- ✓ Notes captured for audit

### Test Case 9: Filter Movements
**Objective:** Verify filtering works correctly

**Actions:**
1. Filter by type: INBOUND
2. Filter by status: COMPLETED
3. Filter by date range
4. Search by reference number
5. Search by item SKU

**Expected Results:**
- ✓ Each filter shows only matching movements
- ✓ Statistics update to reflect filtered data
- ✓ Clear filters button resets all
- ✓ Multiple filters work together (AND logic)

### Test Case 10: Reference Number Uniqueness
**Objective:** Verify no duplicate reference numbers

**Action:**
Create 100 movements rapidly in parallel

**Expected Result:**
- ✓ All 100 movements created successfully
- ✓ All reference numbers unique
- ✓ Format correct: MOV-TYPE-timestamp-random
- ✓ No database constraint violations

---

## Best Practices

### 1. Always Add Notes for Adjustments
```json
// ❌ Bad
{
  "type": "ADJUSTMENT",
  "quantity": 500
}

// ✅ Good
{
  "type": "ADJUSTMENT",
  "quantity": 500,
  "notes": "Physical count on 2024-12-07. Found extra pallet in overflow area. Previous count: 480. Verified by supervisor #123."
}
```

### 2. Specify Bins for Transfers
```json
// ❌ Bad - Missing required bins
{
  "type": "TRANSFER",
  "quantity": 100
}

// ✅ Good
{
  "type": "TRANSFER",
  "quantity": 100,
  "fromBin": "A-01-05",
  "toBin": "B-02-03",
  "notes": "Consolidating slow-movers to back warehouse"
}
```

### 3. Reference External Documents
```json
// ✅ Good - Clear traceability
{
  "type": "INBOUND",
  "quantity": 1000,
  "notes": "PO-2024-001 from Supplier ABC. Invoice #INV-5678. BOL #BOL-9012."
}

{
  "type": "OUTBOUND",
  "quantity": 250,
  "notes": "Sales Order SO-2024-456. Customer: ACME Corp. Carrier: FedEx #1Z234567890."
}
```

### 4. Document Damage Thoroughly
```json
// ✅ Good - Complete damage documentation
{
  "type": "DAMAGE",
  "quantity": 25,
  "fromBin": "A-03-12",
  "notes": "Water damage from roof leak during storm. Affected pallets P-789, P-790. Insurance claim #CLM-2024-123. Photos in shared drive."
}
```

### 5. Use Descriptive Adjustment Notes
```json
// ✅ Good
{
  "type": "ADJUSTMENT",
  "quantity": 850,
  "notes": "Cycle count by team leader. Previous: 900. Variance: -50. Investigation: 50 units found in damaged returns bin, already written off. Count verified 2024-12-07 10:30 AM."
}
```

---

## Integration Points

### With Other Use Cases

**UC-008: View Stock Levels**
- Movements update quantities displayed in stock level reports
- Real-time inventory reflects latest movements

**UC-009: Receive Goods**
- Creates INBOUND movements automatically
- Links to purchase orders

**UC-010: View Low Stock Alerts**
- Movements affect stock levels triggering alerts
- Outbound movements may trigger reorder points

**UC-011: Stock Level Alerts**
- Movement history helps identify consumption patterns
- Supports automated alert thresholds

**UC-012: Reserved Inventory**
- Reservations reduce availableQty
- Outbound movements check available vs reserved
- Future: Auto-create OUTBOUND when fulfilling reservations

**UC-014: View Movement History** (Future)
- Full audit trail from movements table
- Analytics and reporting

**UC-019: Create Pick List** (Future)
- Will auto-generate OUTBOUND movements
- Track picked quantities

---

## Performance Considerations

### Database Indexes
7 indexes on Movement model ensure fast queries:
- `referenceNo` - Unique lookups
- `status` - Filter by status
- `type` - Filter by type
- `itemId` - Item movement history
- `warehouseId` - Warehouse movements
- `createdById` - User audit trail
- `createdAt` - Date range queries

### Transaction Safety
All inventory updates wrapped in Prisma transactions:
```typescript
await prisma.$transaction([
  prisma.movement.create({ /* ... */ }),
  prisma.inventoryItem.update({ /* ... */ }),
  prisma.bin.update({ /* ... */ })
]);
```

Benefits:
- Prevents partial updates
- Ensures data consistency
- Rollback on errors
- Isolation from concurrent updates

### Query Optimization
- Selective includes (only needed relations)
- Pagination ready (add `take` and `skip`)
- Compound indexes for common filter combinations

---

## Security & Validation

### API Security
- ✓ JWT authentication required
- ✓ User ID from token (not request body)
- ✓ Authorization checks (future: role-based)

### Input Validation
- ✓ Quantity must be > 0
- ✓ Item exists and belongs to warehouse
- ✓ Bins exist in database
- ✓ Stock availability for decrements
- ✓ Required fields by type
- ✓ Type-specific validation logic

### Data Integrity
- ✓ Transactions prevent orphaned records
- ✓ Foreign key constraints
- ✓ Unique reference numbers
- ✓ Audit timestamps (createdAt, updatedAt)
- ✓ User tracking (createdById)

---

## Troubleshooting

### Issue: Movement created but inventory not updated
**Cause:** Transaction failed after movement creation  
**Solution:** Check transaction logs, verify database constraints  
**Prevention:** All updates in single transaction

### Issue: "Insufficient stock" error when stock shows available
**Cause:** Reserved quantity not accounted for  
**Check:** `availableQty` = `quantity` - `reservedQty`  
**Solution:** Review reservations, may need to release expired

### Issue: Transfer not updating bin quantities
**Cause:** Bin location strings don't match exactly  
**Check:** Exact string match (case-sensitive)  
**Solution:** Standardize bin location format

### Issue: Duplicate reference numbers
**Cause:** Extremely rapid concurrent requests  
**Solution:** Retry with exponential backoff  
**Note:** Random suffix makes this very rare

### Issue: Adjustment not working as expected
**Cause:** User expecting relative change, not absolute value  
**Solution:** Educate users - adjustment sets FINAL quantity  
**UI Help:** Show "New quantity will be: X" in form

---

## Future Enhancements

### Phase 2 (Planned)
- [ ] Batch movements (process multiple items at once)
- [ ] Movement approval workflow (require supervisor approval)
- [ ] Movement cancellation/reversal
- [ ] Scheduled movements (future-dated)
- [ ] Movement templates (common operations)

### Phase 3 (Planned)
- [ ] Integration with barcode scanning
- [ ] Mobile app for movements
- [ ] Movement notifications (email/SMS)
- [ ] Advanced analytics (velocity, trends)
- [ ] Export to Excel/PDF

### Phase 4 (Future)
- [ ] Automated movements (rules-based)
- [ ] Multi-warehouse transfers (inter-warehouse)
- [ ] Movement cost tracking
- [ ] Integration with accounting system
- [ ] AI-powered movement predictions

---

## Conclusion

UC-013 Create Stock Movement is now fully implemented with:
- ✅ 6 movement types with type-specific logic
- ✅ Automatic reference number generation
- ✅ Comprehensive validation
- ✅ Transaction-safe inventory updates
- ✅ Bin quantity tracking
- ✅ Full audit trail
- ✅ Advanced filtering and search
- ✅ Intuitive dashboard UI
- ✅ Complete API documentation
- ✅ 10 testing scenarios

The system provides a robust foundation for complete inventory tracking and audit compliance in the WMS.

**Next Steps:**
1. Deploy to production
2. Train users on movement types
3. Establish SOP for each movement type
4. Set up monitoring and alerts
5. Proceed to UC-014: View Movement History

---

**Document Version:** 1.0  
**Last Updated:** December 7, 2024  
**Author:** WMS Development Team
