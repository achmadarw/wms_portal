# 🐛 DEBUG: User Assignment Bug

## Problem Description

When creating users for Jakarta warehouse:

1. Create Sarah (SUPERVISOR, Jakarta) ✅ - Works
2. Create John (OPERATOR, Jakarta) ❌ - Sarah disappears!

---

## Debugging Steps

### Step 1: Check API Logic

File: `src/app/api/users/route.ts` lines 220-250

**Current code:**

```typescript
// Create user
const newUser = await prisma.user.create({
    data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        role,
        phone,
        warehouseId: warehouseId || null, // ✅ This is correct
        active: true,
    },
});

// If user is SUPERVISOR, also set as warehouse manager
if (warehouseId && role === 'SUPERVISOR') {
    await prisma.warehouse.update({
        where: { id: warehouseId },
        data: { managerId: newUser.id }, // ✅ This is correct
    });
}
```

**Analysis:** ✅ API logic looks correct

-   OPERATOR: Only sets `warehouseId` (NOT manager)
-   SUPERVISOR: Sets `warehouseId` + updates `managerId`

---

### Step 2: Check if Frontend is Sending Correct Data

**Need to verify:**

1. Is `warehouseId` being sent correctly from frontend?
2. Are both users being created with correct data?
3. Is there a DELETE call happening somewhere?

---

### Step 3: Enable Debug Logging

Add this to API POST handler before user creation:

```typescript
console.log('=== DEBUG USER CREATE ===');
console.log('Request body:', { fullName, email, role, warehouseId });
console.log(
    'Existing users in warehouse:',
    await prisma.user.findMany({
        where: { warehouseId },
        select: { id: true, fullName: true, role: true },
    })
);
```

Add this after user creation:

```typescript
console.log('User created:', newUser);
console.log(
    'All users now:',
    await prisma.user.findMany({
        where: { warehouseId },
        select: { id: true, fullName: true, role: true, warehouseId: true },
    })
);
```

---

## Test via cURL (Bypassing Frontend)

### 1. Login as Admin

```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@wms.com","password":"admin123"}'
$token = $loginResponse.token
```

### 2. Create Sarah (SUPERVISOR Jakarta)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -Headers @{"Authorization"="Bearer $token"} -ContentType "application/json" -Body '{
  "fullName": "Sarah Supervisor Jakarta",
  "email": "sarah.test@wms.com",
  "password": "Password123!",
  "role": "SUPERVISOR",
  "warehouseId": "WH-JKT-001"
}'
```

### 3. Verify Sarah Exists

```powershell
sqlite3 .\prisma\dev.db "SELECT id, fullName, role, warehouseId FROM User WHERE email='sarah.test@wms.com'"
```

### 4. Create John (OPERATOR Jakarta)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -Headers @{"Authorization"="Bearer $token"} -ContentType "application/json" -Body '{
  "fullName": "John Operator Jakarta",
  "email": "john.test@wms.com",
  "password": "Password123!",
  "role": "OPERATOR",
  "warehouseId": "WH-JKT-001"
}'
```

### 5. Verify BOTH Users Exist

```powershell
sqlite3 .\prisma\dev.db "SELECT id, fullName, role, warehouseId FROM User WHERE warehouseId='WH-JKT-001' ORDER BY role"
```

**Expected Result:**

```
sarah-id|Sarah Supervisor Jakarta|SUPERVISOR|WH-JKT-001
john-id|John Operator Jakarta|OPERATOR|WH-JKT-001
```

---

## Possible Root Causes

### ❌ Hypothesis 1: Frontend Deletes Previous User

-   Check if `src/app/dashboard/users/page.tsx` has any DELETE logic
-   Check if form submission triggers multiple API calls

### ❌ Hypothesis 2: Database Constraint Issue

-   Check if there's a hidden UNIQUE constraint on warehouseId
-   Run: `sqlite3 .\prisma\dev.db ".schema User"`

### ❌ Hypothesis 3: Prisma Client Cache Issue

-   Try: `npx prisma generate` to regenerate client

### ❌ Hypothesis 4: Transaction Rollback

-   Check if there's error in Activity logging causing rollback

---

## Next Steps

1. **Add debug logging** to API (see Step 3)
2. **Test via cURL** to isolate frontend vs backend issue
3. **Check browser console** when creating users via UI
4. **Check server logs** for any errors or warnings

---

## Quick Database Check

```powershell
# Check schema
sqlite3 .\prisma\dev.db ".schema User"

# Check all users
sqlite3 .\prisma\dev.db "SELECT id, fullName, role, warehouseId FROM User"

# Check warehouse
sqlite3 .\prisma\dev.db "SELECT id, name, managerId FROM Warehouse WHERE id='WH-JKT-001'"
```
