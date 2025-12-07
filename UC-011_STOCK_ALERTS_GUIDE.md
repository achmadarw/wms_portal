# UC-011: Stock Level Alerts - Implementation Guide

## 📋 Overview

UC-011 implements automated stock monitoring and alerting system that:

-   Continuously monitors inventory levels across all warehouses
-   Generates intelligent alerts based on configurable thresholds
-   Sends email notifications to stakeholders
-   Provides comprehensive dashboard for alert management
-   Supports acknowledge and resolve workflows

**Status**: ✅ **FULLY IMPLEMENTED** (December 7, 2025)

---

## 🎯 Features Implemented

### 1. Alert Types (4 Types)

| Type              | Condition                            | Severity    | Description                                       |
| ----------------- | ------------------------------------ | ----------- | ------------------------------------------------- |
| **OUT_OF_STOCK**  | `qty = 0`                            | 🔴 CRITICAL | Item completely depleted, urgent action required  |
| **LOW_STOCK**     | `0 < qty ≤ minStockLevel`            | 🟠 HIGH     | Quantity below minimum, reorder recommended       |
| **REORDER_POINT** | `minStockLevel < qty ≤ reorderPoint` | 🟡 MEDIUM   | Reorder point reached, initiate purchase          |
| **OVERSTOCK**     | `qty > maxStockLevel`                | 🔵 LOW      | Excess inventory, consider promotional activities |

### 2. Severity Levels (4 Levels)

-   **CRITICAL** (Red): Immediate action required - stock depleted
-   **HIGH** (Orange): Urgent attention - stock running low
-   **MEDIUM** (Yellow): Action needed - approaching reorder point
-   LOW (Blue): Informational - overstock condition

### 3. Alert Dashboard (`/dashboard/alerts`)

-   **Summary Cards**: Total Alerts, Unresolved, Critical, Unacknowledged
-   **Type Breakdown**: Individual cards for each alert type with counts
-   **Smart Filtering**: Filter by severity, type, acknowledged status, resolved status
-   **Alert List**: Detailed view with item info, warehouse, quantities, timestamps
-   **Actions**: Acknowledge and Resolve buttons with instant updates
-   **Manual Trigger**: "Check Stock Levels" button for on-demand monitoring

### 4. Email Notifications

-   **Beautiful HTML Templates**: Professional, color-coded emails
-   **Severity Styling**: Color-matched to alert severity (red/orange/yellow/blue)
-   **Detailed Information**: Item, SKU, warehouse, quantities, threshold
-   **Actionable Recommendations**: Type-specific action items
-   **Dashboard Link**: Direct link to alert dashboard
-   **Text Fallback**: Plain text version for all email clients

### 5. Smart Alert Logic

-   **Duplicate Prevention**: Checks for existing unresolved alerts before creating new ones
-   **Auto-Resolution**: Automatically resolves alerts when stock levels normalize
-   **Bulk Operations**: Acknowledge or resolve multiple alerts at once
-   **Email Tracking**: Tracks emailSent status to prevent duplicate notifications

---

## 🔧 Configuration

### Email Setup

1. **Gmail SMTP Configuration**:

    ```env
    # In .env file
    EMAIL_HOST="smtp.gmail.com"
    EMAIL_PORT=587
    EMAIL_USER="your-email@gmail.com"
    EMAIL_PASSWORD="your-app-password"
    ```

2. **Generate Gmail App Password**:

    - Go to Google Account Settings
    - Security → 2-Step Verification (enable if not enabled)
    - Security → App passwords
    - Generate new app password for "Mail"
    - Copy the 16-character password to `EMAIL_PASSWORD`

3. **Configure Recipients**:

    ```env
    # Comma-separated list of recipients
    ALERT_EMAIL_RECIPIENTS="purchasing@company.com,warehouse@company.com,manager@company.com"
    ```

4. **Application URL**:
    ```env
    # Used in email links
    NEXT_PUBLIC_APP_URL="http://localhost:3009"  # Dev
    NEXT_PUBLIC_APP_URL="https://wms.company.com"  # Production
    ```

### Database Migration

Already completed. StockAlert model added with schema:

```prisma
model StockAlert {
  id              String    @id @default(uuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  alertType       String    // OUT_OF_STOCK, LOW_STOCK, REORDER_POINT, OVERSTOCK
  severity        String    // CRITICAL, HIGH, MEDIUM, LOW
  message         String

  itemMasterId    String
  itemMaster      ItemMaster @relation(fields: [itemMasterId], references: [id])

  warehouseId     String
  warehouse       Warehouse  @relation(fields: [warehouseId], references: [id])

  currentQty      Float
  threshold       Float

  acknowledged    Boolean   @default(false)
  acknowledgedBy  String?
  acknowledgedAt  DateTime?

  resolved        Boolean   @default(false)
  resolvedAt      DateTime?

  emailSent       Boolean   @default(false)
  emailSentAt     DateTime?

  @@index([alertType])
  @@index([severity])
  @@index([acknowledged])
  @@index([resolved])
  @@index([createdAt])
  @@index([itemMasterId])
  @@index([warehouseId])
}
```

---

## 🚀 Usage

### Manual Alert Check (via Dashboard)

1. Navigate to `http://localhost:3009/dashboard/alerts`
2. Click **"Check Stock Levels"** button in the top right
3. System will:
    - Scan all inventory across all warehouses
    - Generate alerts based on stock levels vs thresholds
    - Send email notifications for new unacknowledged alerts
    - Display results in the dashboard

### API Endpoints

#### 1. Get Alerts (with Filtering)

```bash
GET /api/alerts
Query Parameters:
  - severity: CRITICAL | HIGH | MEDIUM | LOW
  - alertType: OUT_OF_STOCK | LOW_STOCK | REORDER_POINT | OVERSTOCK
  - acknowledged: true | false
  - resolved: true | false
  - warehouseId: <warehouse-uuid>

Headers:
  - Authorization: Bearer <jwt-token>
```

**Response**:

```json
{
    "alerts": [
        {
            "id": "alert-uuid",
            "alertType": "LOW_STOCK",
            "severity": "HIGH",
            "message": "Stock level below minimum threshold",
            "currentQty": 45,
            "threshold": 50,
            "acknowledged": false,
            "resolved": false,
            "emailSent": true,
            "emailSentAt": "2025-12-07T10:30:00Z",
            "createdAt": "2025-12-07T10:00:00Z",
            "itemMaster": {
                "sku": "ITEM-001",
                "name": "Product A",
                "category": { "name": "Electronics" }
            },
            "warehouse": {
                "name": "Main Warehouse",
                "code": "WH-01"
            }
        }
    ],
    "summary": {
        "total": 15,
        "unresolved": 12,
        "unacknowledged": 8,
        "critical": 2,
        "high": 5,
        "medium": 6,
        "low": 2,
        "outOfStock": 2,
        "lowStock": 5,
        "reorderPoint": 6,
        "overstock": 2
    }
}
```

#### 2. Acknowledge/Resolve Alerts

```bash
POST /api/alerts
Headers:
  - Authorization: Bearer <jwt-token>
  - Content-Type: application/json

Body:
{
  "action": "acknowledge",  // or "resolve"
  "alertIds": ["alert-uuid-1", "alert-uuid-2"]
}
```

**Response**:

```json
{
    "success": true,
    "message": "2 alerts acknowledged successfully",
    "updated": 2
}
```

#### 3. Manual Trigger Alert Check

```bash
POST /api/alerts/check
Headers:
  - Authorization: Bearer <jwt-token>

Access: ADMIN and SUPERVISOR only (403 for OPERATOR)
```

**Response**:

```json
{
    "success": true,
    "message": "Alert check completed",
    "alertsGenerated": 5,
    "emailsSent": 3,
    "errors": []
}
```

---

## 📊 Alert Generation Logic

### Flow Diagram

```
1. Scan Inventory
   ↓
2. For each item in each warehouse:
   ↓
3. Check availableQty vs thresholds
   ↓
4. Determine alert type and severity:
   - qty = 0          → OUT_OF_STOCK (CRITICAL)
   - 0 < qty ≤ min    → LOW_STOCK (HIGH)
   - min < qty ≤ ROP  → REORDER_POINT (MEDIUM)
   - qty > max        → OVERSTOCK (LOW)
   ↓
5. Check for existing unresolved alert
   - If exists: Skip (prevent duplicates)
   - If not: Create new alert
   ↓
6. Auto-resolve if stock normalized
   ↓
7. Send email for unacknowledged alerts
   ↓
8. Mark as emailSent
```

### Code Example

```typescript
import {
    checkStockLevelsAndGenerateAlerts,
    sendAlertEmails,
} from '@/lib/alert-checker';

// Trigger alert check
const checkResult = await checkStockLevelsAndGenerateAlerts();
console.log(`Generated ${checkResult.alertsGenerated} alerts`);

// Send email notifications
const emailResult = await sendAlertEmails();
console.log(`Sent ${emailResult.emailsSent} emails`);
```

---

## 📧 Email Template Features

### HTML Email Includes:

-   **Header**: Gradient background with severity color
-   **Alert Badge**: Color-coded severity indicator
-   **Message Box**: Yellow-highlighted alert message
-   **Info Grid**: 6-cell grid with item/warehouse/quantity details
-   **Recommended Actions**: Type-specific action items with icons
-   **CTA Button**: Direct link to alert dashboard
-   **Footer**: Professional branding with copyright

### Color Scheme:

```typescript
{
  CRITICAL: '#DC2626',  // Red
  HIGH: '#EA580C',      // Orange
  MEDIUM: '#CA8A04',    // Yellow
  LOW: '#2563EB'        // Blue
}
```

### Recommended Actions by Type:

**OUT_OF_STOCK (Critical)**:

-   🔴 URGENT: Place emergency order immediately
-   📞 Contact supplier for expedited delivery
-   📧 Notify sales team about stock unavailability

**LOW_STOCK (High)**:

-   🟠 Review and approve purchase requisition
-   📦 Check for pending inbound orders
-   📊 Verify consumption rate and forecast demand

**REORDER_POINT (Medium)**:

-   🟡 Initiate reorder process
-   📋 Review supplier lead times
-   💰 Check budget availability

**OVERSTOCK (Low)**:

-   🔵 Consider promotional activities
-   📦 Review storage capacity
-   💵 Evaluate return-to-supplier options

---

## 🧪 Testing Guide

### Test Scenario 1: Generate OUT_OF_STOCK Alert

1. **Setup**: Create inventory with qty = 0

    ```sql
    UPDATE Inventory
    SET availableQty = 0
    WHERE itemMasterId = '<item-id>' AND warehouseId = '<warehouse-id>';
    ```

2. **Trigger**: Click "Check Stock Levels" in dashboard

3. **Expected**:
    - New alert created with alertType=OUT_OF_STOCK, severity=CRITICAL
    - Email sent to configured recipients
    - Alert appears in dashboard with red badge
    - Summary cards updated

### Test Scenario 2: Acknowledge Alert

1. **Setup**: Have at least one unacknowledged alert
2. **Action**: Click "Acknowledge" button on alert
3. **Expected**:
    - Alert acknowledged status changes to true
    - acknowledgedBy and acknowledgedAt populated
    - Badge changes from red "Unacknowledged" to gray "Acknowledged"
    - Summary card "Unacknowledged" count decreases

### Test Scenario 3: Auto-Resolution

1. **Setup**: Have LOW_STOCK alert (qty ≤ minStockLevel)
2. **Action**: Increase inventory quantity above minStockLevel
    ```sql
    UPDATE Inventory
    SET availableQty = 100
    WHERE itemMasterId = '<item-id>' AND warehouseId = '<warehouse-id>';
    ```
3. **Trigger**: Click "Check Stock Levels"
4. **Expected**:
    - Existing alert resolved automatically
    - resolvedAt timestamp set
    - Alert moved to resolved section
    - No duplicate alert created

### Test Scenario 4: Email Notification

1. **Setup**: Configure valid SMTP credentials in .env
2. **Trigger**: Generate new alert (use scenario 1)
3. **Expected**:
    - Email received at configured recipients
    - HTML formatted with severity color
    - Item details, warehouse, quantities displayed
    - Dashboard link functional
    - emailSent flag set to true

### Test Scenario 5: Filter Alerts

1. **Setup**: Have alerts with different types and severities
2. **Action**: Apply filters in dashboard:
    - Select "CRITICAL" severity
    - Select "OUT_OF_STOCK" type
3. **Expected**:
    - Alert list shows only matching alerts
    - Summary cards reflect filtered data
    - URL updates with query parameters

---

## 🔄 Scheduled Monitoring (Optional)

For production, set up automated periodic checks using cron or scheduled jobs.

### Option 1: Node Cron (In-App)

```typescript
// lib/cron-jobs.ts
import cron from 'node-cron';
import {
    checkStockLevelsAndGenerateAlerts,
    sendAlertEmails,
} from '@/lib/alert-checker';

// Run every hour
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Starting hourly stock level check...');
    const checkResult = await checkStockLevelsAndGenerateAlerts();
    const emailResult = await sendAlertEmails();
    console.log(
        `[CRON] Generated ${checkResult.alertsGenerated} alerts, sent ${emailResult.emailsSent} emails`
    );
});
```

### Option 2: External Cron Job

```bash
# crontab entry - run every hour
0 * * * * curl -X POST http://localhost:3009/api/alerts/check \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### Option 3: Vercel Cron (Production)

```json
// vercel.json
{
    "crons": [
        {
            "path": "/api/alerts/check",
            "schedule": "0 * * * *"
        }
    ]
}
```

---

## 📝 Troubleshooting

### Issue: Emails Not Sending

**Symptoms**: emailSent=false, errors in console

**Solutions**:

1. Check SMTP credentials in .env
2. Verify Gmail app password (not regular password)
3. Enable "Less secure app access" if using Gmail
4. Check EMAIL_USER format (must be full email: user@gmail.com)
5. Verify port (587 for TLS, 465 for SSL)

**Debug**:

```typescript
import { testEmailConfig } from '@/lib/email';

const result = await testEmailConfig();
console.log(result); // Should show "Email configuration is working!"
```

### Issue: Duplicate Alerts

**Symptoms**: Multiple alerts for same item/warehouse

**Solutions**:

-   Alert checker already prevents duplicates by checking existing unresolved alerts
-   If duplicates appear, check database indexes
-   Verify alert-checker.ts duplicate prevention logic

**Verify**:

```sql
SELECT itemMasterId, warehouseId, alertType, COUNT(*) as count
FROM StockAlert
WHERE resolved = false
GROUP BY itemMasterId, warehouseId, alertType
HAVING count > 1;
```

### Issue: Alerts Not Auto-Resolving

**Symptoms**: Old alerts remain unresolved after stock replenished

**Solutions**:

1. Trigger manual check: Click "Check Stock Levels"
2. Verify inventory.availableQty updated correctly
3. Check alert-checker.ts auto-resolution logic
4. Ensure thresholds configured properly in ItemMaster

---

## 📈 Performance Considerations

### Database Indexes

All critical fields indexed for fast queries:

-   `alertType`, `severity`, `acknowledged`, `resolved`
-   `createdAt`, `itemMasterId`, `warehouseId`

### Query Optimization

-   Filtering done at database level (WHERE clauses)
-   Includes optimized with select specific fields
-   Pagination recommended for large alert lists (future enhancement)

### Email Throttling

-   Only sends emails for unacknowledged alerts
-   Tracks emailSent to prevent duplicates
-   Consider batch digest emails for high-volume scenarios

---

## 🎓 Key Learning Points

1. **Smart Alert Logic**: Prevents notification fatigue with duplicate detection and auto-resolution
2. **Email Integration**: Professional HTML templates with SMTP integration
3. **User Experience**: Color-coded severity, clear actions, comprehensive filtering
4. **Data Integrity**: Proper relations, indexes, and timestamps for audit trail
5. **Security**: RBAC on manual trigger (ADMIN/SUPERVISOR only)
6. **Scalability**: Designed to handle multiple warehouses and thousands of items

---

## ✅ Completion Checklist

-   [x] StockAlert database model with relations
-   [x] Migration executed successfully
-   [x] API endpoints (GET /api/alerts, POST /api/alerts, POST /api/alerts/check)
-   [x] Alert generation logic with 4 types and 4 severities
-   [x] Duplicate prevention mechanism
-   [x] Auto-resolution when stock normalizes
-   [x] Email template with HTML and text versions
-   [x] SMTP integration with Gmail
-   [x] Alert dashboard UI with summary cards
-   [x] Type breakdown cards
-   [x] Smart filtering (severity, type, status)
-   [x] Acknowledge/resolve workflow
-   [x] Manual trigger button
-   [x] Navigation menu integration
-   [x] Color-coded severity system
-   [x] Documentation and testing guide

---

## 🚀 Next Steps

After UC-011 completion, recommended next implementations:

1. **UC-013: Create Stock Movement** - Track INBOUND/OUTBOUND/TRANSFER/ADJUSTMENT
2. **UC-014: View Movement History** - Comprehensive audit trail
3. **UC-016: Receive Goods** - Purchase order processing
4. **UC-024: Stock Count Adjustment** - Physical inventory reconciliation

---

## 📞 Support

For issues or questions about UC-011 implementation:

-   Check console logs for detailed error messages
-   Review EMAIL configuration in .env
-   Test SMTP with testEmailConfig() function
-   Verify database migration status
-   Check API responses in browser DevTools

**Implementation Date**: December 7, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
