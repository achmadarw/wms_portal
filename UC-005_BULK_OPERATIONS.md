# UC-005: Bulk Bin Operations - Implementation Guide

**Implementation Date:** December 8, 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0

---

## Overview

Two powerful features for creating multiple storage bins efficiently:

1. **Bulk Creation** - Generate bins with pattern-based rules
2. **CSV Import** - Import bins from spreadsheet files

Both features include validation, duplicate detection, and detailed reporting.

---

## Feature 1: Bulk Bin Creation

### Purpose

Create hundreds of bins quickly using range-based pattern generation (e.g., create bins A-01-01 to E-05-03 in one operation).

### Access

-   **Location:** Warehouse → Bins page
-   **Button:** "Bulk Create" (amber button in header)
-   **Permissions:** ADMIN or SUPERVISOR only

### User Interface

**Modal Components:**

1. **Code Prefix** - Optional prefix for all bin codes (e.g., "WH1-")
2. **Row Range** - Start row to end row (1=A, 2=B, 3=C, etc.)
3. **Column Range** - Start column to end column (numeric)
4. **Level Range** - Start level to end level (numeric)
5. **Max Capacity** - Default capacity for all bins
6. **Summary** - Real-time calculation of total bins

**Example:**

```
Prefix: WH1-
Rows: 1 to 5 (A to E)
Columns: 1 to 5
Levels: 1 to 3
Max Capacity: 100

Result: 75 bins (5 rows × 5 columns × 3 levels)
Codes: WH1-A-01-01, WH1-A-01-02, ..., WH1-E-05-03
```

### Flow

1. User clicks "Bulk Create" button
2. Modal opens with form
3. User enters parameters:
    - Prefix (optional)
    - Row range (start and end)
    - Column range (start and end)
    - Level range (start and end)
    - Max capacity
4. Summary shows total bins to be created
5. User clicks "Create Bins"
6. System validates:
    - All ranges valid (start ≤ end, all ≥ 1)
    - Total bins ≤ 1000 (safety limit)
    - Warehouse exists
7. System generates bin data with pattern
8. System checks for duplicate codes and coordinates
9. System creates bins in batch
10. System shows result:
    - Number created
    - Number skipped (with reasons)
    - Total processed

### Code Generation Pattern

**Format:** `{prefix}{ROW_LETTER}-{COLUMN_PADDED}-{LEVEL_PADDED}`

-   Row number → Letter (1=A, 2=B, ..., 26=Z, 27=AA)
-   Column → Padded with zeros (1 → 01, 12 → 12)
-   Level → Padded with zeros (1 → 01, 3 → 03)

**Examples:**

-   Row 1, Col 1, Lvl 1 → `A-01-01`
-   Row 5, Col 12, Lvl 3 → `E-12-03`
-   With prefix "WH1-" → `WH1-A-01-01`

### Validation Rules

1. **Range Validation:**
    - Start row ≥ 1
    - End row ≥ start row
    - Start column ≥ 1
    - End column ≥ start column
    - Start level ≥ 1
    - End level ≥ start level
2. **Capacity Limit:**
    - Total bins ≤ 1000
3. **Duplicate Detection:**
    - Skips if bin code already exists
    - Skips if coordinates already exist
4. **Database Constraints:**
    - Enforces unique [warehouseId, code]
    - Enforces unique [warehouseId, row, column, level]

### Response Format

```json
{
    "success": true,
    "created": 72,
    "skipped": 3,
    "skippedDetails": [
        {
            "code": "A-01-01",
            "row": 1,
            "column": 1,
            "level": 1,
            "reason": "Code already exists"
        },
        {
            "code": "A-02-01",
            "row": 1,
            "column": 2,
            "level": 1,
            "reason": "Coordinates already exist"
        }
    ],
    "total": 75,
    "message": "Successfully created 72 bins. 3 skipped."
}
```

---

## Feature 2: CSV Import

### Purpose

Import bins from spreadsheet (Excel/CSV) for maximum flexibility and integration with external systems.

### Access

-   **Location:** Warehouse → Bins page
-   **Button:** "Import CSV" (blue button in header)
-   **Permissions:** ADMIN or SUPERVISOR only

### CSV Format

**Required Columns:**

-   `code` - Bin code (unique per warehouse)
-   `name` - Bin name/description
-   `row` - Row number (integer ≥ 1)
-   `column` - Column number (integer ≥ 1)
-   `level` - Level number (integer ≥ 1)
-   `maxCapacity` - Maximum capacity (integer ≥ 1)

**Alternative Column Names:**

-   `code` or `bincode`
-   `name` or `binname`
-   `column` or `col`
-   `level` or `lvl`
-   `maxCapacity` or `capacity`

**Example CSV:**

```csv
code,name,row,column,level,maxCapacity
A-01-01,Bin A-01-01,1,1,1,100
A-01-02,Bin A-01-02,1,1,2,100
A-02-01,Bin A-02-01,1,2,1,100
B-01-01,Bin B-01-01,2,1,1,150
B-01-02,Bin B-01-02,2,1,2,150
```

### Flow

1. User clicks "Import CSV" button
2. Modal opens with upload form
3. User downloads template (optional):
    - Click "Download Template" button
    - Gets sample CSV with correct format
4. User prepares CSV file
5. User selects CSV file
6. System parses CSV and shows preview (first 5 rows)
7. User reviews preview
8. User clicks "Import Bins"
9. System validates all rows:
    - Required fields present
    - Data types correct (numbers are numeric)
    - Values in valid ranges (all ≥ 1)
10. System checks for duplicates
11. System creates bins in batch
12. System shows result:
    - Number imported
    - Number skipped (with reasons)
    - Validation errors (if any)

### Validation Rules

**Field Validation:**

1. **Code:**
    - Required
    - Non-empty string
    - Must be unique per warehouse
2. **Name:**
    - Required
    - Non-empty string
3. **Row:**
    - Required
    - Must be numeric
    - Must be ≥ 1
4. **Column:**
    - Required
    - Must be numeric
    - Must be ≥ 1
5. **Level:**
    - Required
    - Must be numeric
    - Must be ≥ 1
6. **MaxCapacity:**
    - Optional (defaults to 100)
    - Must be numeric if provided
    - Must be ≥ 1

**Duplicate Detection:**

-   Checks against existing bins in warehouse
-   Checks within import batch itself
-   Skips duplicates with detailed reason

**Capacity Limit:**

-   Maximum 1000 bins per import

### Response Formats

**Success:**

```json
{
    "success": true,
    "created": 47,
    "skipped": 3,
    "skippedDetails": [
        {
            "row": 5,
            "code": "A-01-01",
            "reason": "Code already exists"
        }
    ],
    "total": 50,
    "message": "Successfully imported 47 bins. 3 skipped."
}
```

**Validation Error:**

```json
{
    "success": false,
    "error": "Validation failed for 2 rows",
    "errors": [
        {
            "row": 3,
            "data": { "code": "A-01-01", "name": "Bin", "row": "abc" },
            "error": "Row, column, level, and maxCapacity must be numbers"
        },
        {
            "row": 7,
            "data": { "code": "", "name": "Test" },
            "error": "Code and name are required"
        }
    ]
}
```

---

## API Endpoints

### 1. Bulk Create Bins

**Endpoint:** `POST /api/warehouses/bins/bulk`

**Request Body:**

```json
{
    "warehouseId": "cm123...",
    "prefix": "WH1-",
    "startRow": 1,
    "endRow": 5,
    "startColumn": 1,
    "endColumn": 5,
    "startLevel": 1,
    "endLevel": 3,
    "maxCapacity": 100,
    "nameTemplate": "Warehouse 1 - {coordinates}"
}
```

**Parameters:**

-   `warehouseId` (required) - Warehouse ID
-   `prefix` (required) - Code prefix (can be empty string)
-   `startRow` (required) - Start row number
-   `endRow` (required) - End row number
-   `startColumn` (required) - Start column number
-   `endColumn` (required) - End column number
-   `startLevel` (required) - Start level number
-   `endLevel` (required) - End level number
-   `maxCapacity` (optional) - Default 100
-   `nameTemplate` (optional) - Custom name template

**Success Response (201):**

```json
{
    "success": true,
    "created": 75,
    "skipped": 0,
    "skippedDetails": [],
    "total": 75,
    "message": "Successfully created 75 bins. 0 skipped."
}
```

**Error Responses:**

-   `400` - Invalid parameters
-   `401` - Unauthorized
-   `403` - Insufficient permissions
-   `404` - Warehouse not found
-   `500` - Internal server error

---

### 2. Import Bins from CSV

**Endpoint:** `POST /api/warehouses/bins/import`

**Request Body:**

```json
{
    "warehouseId": "cm123...",
    "bins": [
        {
            "code": "A-01-01",
            "name": "Bin A-01-01",
            "row": 1,
            "column": 1,
            "level": 1,
            "maxCapacity": 100
        },
        {
            "code": "A-01-02",
            "name": "Bin A-01-02",
            "row": 1,
            "column": 1,
            "level": 2,
            "maxCapacity": 100
        }
    ]
}
```

**Success Response (201):**

```json
{
    "success": true,
    "created": 2,
    "skipped": 0,
    "skippedDetails": [],
    "total": 2,
    "message": "Successfully imported 2 bins. 0 skipped."
}
```

**Error Response (400):**

```json
{
    "success": false,
    "error": "Validation failed for 1 rows",
    "errors": [
        {
            "row": 1,
            "data": { "code": "A-01-01", "name": "" },
            "error": "Code and name are required"
        }
    ]
}
```

---

## Implementation Details

### File Structure

```
wms_portal/
├── src/app/api/warehouses/bins/
│   ├── bulk/
│   │   └── route.ts         # Bulk creation API
│   └── import/
│       └── route.ts         # CSV import API
└── src/app/dashboard/warehouses/[id]/bins/
    └── page.tsx            # UI with modals
```

### Helper Functions

**Number to Letter Conversion:**

```typescript
function numberToLetter(num: number): string {
    let letter = '';
    while (num > 0) {
        const remainder = (num - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        num = Math.floor((num - 1) / 26);
    }
    return letter;
}
```

**Number Padding:**

```typescript
function padNumber(num: number, length: number = 2): string {
    return num.toString().padStart(length, '0');
}
```

### Performance Optimizations

1. **Batch Creation:**
    - Uses `prisma.bin.createMany()` for efficiency
    - Single database transaction
    - Supports `skipDuplicates` flag
2. **Duplicate Detection:**
    - Loads existing bins once
    - Uses Set data structure for O(1) lookups
    - Checks both code and coordinates
3. **Memory Management:**
    - 1000 bin limit prevents memory issues
    - Streams CSV parsing (future enhancement)

### Security Considerations

1. **Authentication:**
    - JWT token required
    - Token verification on every request
2. **Authorization:**
    - ADMIN or SUPERVISOR role required
    - OPERATOR users get 403 error
3. **Input Validation:**
    - Sanitizes all user inputs
    - Validates data types and ranges
    - Prevents SQL injection (Prisma ORM)
4. **Rate Limiting:**
    - 1000 bins per operation
    - Prevents abuse and DoS attacks

---

## Usage Examples

### Example 1: Small Warehouse Setup

**Scenario:** Create bins for small warehouse (2 rows, 3 columns, 2 levels = 12 bins)

**Bulk Create Form:**

```
Prefix: (empty)
Start Row: 1
End Row: 2
Start Column: 1
End Column: 3
Start Level: 1
End Level: 2
Max Capacity: 100
```

**Result:**

```
Created: 12 bins
Codes: A-01-01, A-01-02, A-02-01, A-02-02, A-03-01, A-03-02,
       B-01-01, B-01-02, B-02-01, B-02-02, B-03-01, B-03-02
```

---

### Example 2: Large Warehouse with Prefix

**Scenario:** Jakarta warehouse (5 rows, 5 columns, 3 levels = 75 bins)

**Bulk Create Form:**

```
Prefix: JKT-
Start Row: 1
End Row: 5
Start Column: 1
End Column: 5
Start Level: 1
End Level: 3
Max Capacity: 150
```

**Result:**

```
Created: 75 bins
Codes: JKT-A-01-01 through JKT-E-05-03
```

---

### Example 3: CSV Import with Mixed Data

**CSV File (bins.csv):**

```csv
code,name,row,column,level,maxCapacity
COLD-A-01-01,Cold Storage A1L1,1,1,1,50
COLD-A-01-02,Cold Storage A1L2,1,1,2,50
COLD-A-02-01,Cold Storage A2L1,1,2,1,50
HAZ-B-01-01,Hazardous Materials B1L1,2,1,1,25
HAZ-B-01-02,Hazardous Materials B1L2,2,1,2,25
```

**Result:**

```
Created: 5 bins
Skipped: 0
Total: 5
```

---

## Troubleshooting

### Common Issues

**Issue 1: "Cannot create more than 1000 bins at once"**

-   **Cause:** Total bins exceeds safety limit
-   **Solution:** Split into smaller batches or adjust ranges

**Issue 2: "Bin code already exists"**

-   **Cause:** Duplicate code in warehouse
-   **Solution:** Check existing bins, use different prefix or range

**Issue 3: "Bin coordinates already exist"**

-   **Cause:** Duplicate 3D coordinates (row, column, level)
-   **Solution:** Verify no overlapping ranges with existing bins

**Issue 4: "CSV file must contain header and at least one data row"**

-   **Cause:** Empty or malformed CSV
-   **Solution:** Download template and ensure proper format

**Issue 5: "Row, column, level must be numbers"**

-   **Cause:** Non-numeric values in CSV
-   **Solution:** Check CSV data types, ensure no text in numeric columns

---

## Best Practices

### Planning Bulk Operations

1. **Calculate First:**
    - Total bins = (rows) × (columns) × (levels)
    - Ensure total ≤ 1000 per operation
2. **Check Existing Bins:**
    - Review current bins to avoid duplicates
    - Plan non-overlapping ranges
3. **Use Prefixes:**
    - Organize by warehouse or zone (e.g., "WH1-", "COLD-")
    - Makes filtering and searching easier

### CSV Import Guidelines

1. **Use Template:**
    - Download template for correct format
    - Copy-paste your data into template
2. **Validate Offline:**
    - Check for duplicates in Excel before upload
    - Verify all numeric columns are actually numbers
3. **Test Small First:**
    - Import 5-10 bins as test
    - Review results before full import
4. **Backup Data:**
    - Export existing bins before large import
    - Keep original CSV file for reference

### Performance Tips

1. **Batch Wisely:**
    - 100-500 bins per operation is optimal
    - Larger batches increase processing time
2. **Off-Peak Hours:**
    - Run large imports during low traffic
    - Reduces impact on other users
3. **Monitor Results:**
    - Check created vs skipped counts
    - Review skipped details for issues

---

## Testing Checklist

### Bulk Creation Tests

-   ✅ Small range (1-10 bins)
-   ✅ Large range (100+ bins)
-   ✅ Maximum limit (1000 bins)
-   ✅ Over limit (1001+ bins) - should fail
-   ✅ Invalid ranges (start > end) - should fail
-   ✅ Duplicate codes - should skip
-   ✅ Duplicate coordinates - should skip
-   ✅ With prefix
-   ✅ Without prefix
-   ✅ OPERATOR role - should get 403
-   ✅ Unauthorized - should get 401

### CSV Import Tests

-   ✅ Valid CSV (all correct)
-   ✅ Template CSV
-   ✅ Missing columns - should fail
-   ✅ Empty values - should fail
-   ✅ Non-numeric values - should fail
-   ✅ Negative numbers - should fail
-   ✅ Duplicate codes - should skip
-   ✅ Duplicate coordinates - should skip
-   ✅ Large file (1000 rows)
-   ✅ Over limit (1001+ rows) - should fail
-   ✅ Alternative column names
-   ✅ Preview displays correctly

---

## Version History

| Version | Date       | Changes                                  |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2025-12-08 | Initial implementation with bulk & CSV   |
| -       | -          | Added duplicate detection                |
| -       | -          | Added validation and error reporting     |
| -       | -          | Added preview for CSV                    |
| -       | -          | Added template download                  |
| -       | -          | Added 1000 bin safety limit              |
| -       | -          | Comprehensive documentation and examples |

---

**Document Status:** Complete  
**Last Updated:** December 8, 2025  
**Maintained By:** WMS Development Team
