# 📋 WMS Portal - Feature Development Standards

> **Tujuan:** Dokumentasi standar pengembangan fitur untuk memastikan konsistensi, user experience yang baik, dan maintainability aplikasi WMS Portal.

---

## 📑 Table of Contents

-   [1. Error Handling Standards](#1-error-handling-standards)
-   [2. Delete Operations](#2-delete-operations)
-   [3. Form Validation](#3-form-validation)
-   [4. User Feedback](#4-user-feedback)
-   [5. RBAC Implementation](#5-rbac-implementation)
-   [6. API Response Standards](#6-api-response-standards)
-   [7. UI/UX Patterns](#7-uiux-patterns)
-   [8. State Management](#8-state-management)
-   [9. Loading States](#9-loading-states)
-   [10. Accessibility](#10-accessibility)

---

## 1. Error Handling Standards

### ✅ Best Practices

#### **1.1 Frontend Error Handling**

**❌ BAD - Menggunakan throw Error untuk validation:**

```typescript
if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error); // ❌ Muncul di console, menakutkan user
}
```

**✅ GOOD - Menggunakan state untuk error display:**

```typescript
const data = await response.json();

if (!response.ok) {
    // Validation/business logic errors
    if (response.status === 409) {
        setFormErrors({
            managerId: data.error || 'Manager already assigned',
        });
    } else if (response.status === 400) {
        setFormErrors({
            general: data.error || 'Invalid input',
        });
    }
    return; // ✅ Tidak throw, cukup return
}
```

#### **1.2 Kapan Menggunakan throw Error**

**✅ ONLY untuk unexpected errors:**

```typescript
try {
    const response = await fetch('/api/endpoint');
    const data = await response.json();

    if (!response.ok) {
        // Handle validation errors dengan state
        setFormErrors({ ... });
        return;
    }
} catch (error) {
    // ✅ Hanya untuk network errors, parse errors, dll
    console.error('Unexpected error:', error);
    setFormErrors({
        general: 'Network error. Please check your connection.',
    });
}
```

#### **1.3 Error Message Guidelines**

**Karakteristik pesan error yang baik:**

-   ✅ **User-friendly** - Hindari technical jargon
-   ✅ **Actionable** - Berikan solusi atau next steps
-   ✅ **Specific** - Jelaskan apa yang salah
-   ✅ **Polite** - Gunakan bahasa yang sopan

**Contoh:**

```typescript
// ❌ BAD
'Error 409: Unique constraint failed on managerId';

// ✅ GOOD
"Manager already assigned to warehouse 'Gudang Bandung'. A user can only manage one warehouse.";

// ❌ BAD
'Invalid input';

// ✅ GOOD
"Warehouse code must be unique. Code 'WH-001' is already in use.";
```

---

## 2. Delete Operations

### ✅ Soft Delete Pattern

**Prinsip:**

-   🔒 **Preserve Data** - Jangan hapus data permanen dari database
-   🏷️ **Use Status Flag** - Gunakan field `active: boolean` atau `deletedAt: DateTime`
-   🔄 **Recoverable** - Data bisa di-restore jika diperlukan
-   📊 **Audit Trail** - History tetap terjaga

#### **2.1 Database Schema**

```prisma
model Warehouse {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  active    Boolean  @default(true) // ✅ Soft delete flag
  deletedAt DateTime? // Optional: timestamp deletion
  // ... other fields
}
```

#### **2.2 API Implementation**

```typescript
// ✅ GOOD - Soft Delete
export async function DELETE(request: NextRequest, { params }) {
    const { id } = await params;

    // Check permissions
    if (auth.payload?.role !== 'ADMIN') {
        return errorResponse('Insufficient permissions', 403);
    }

    // Validate before delete
    const warehouse = await prisma.warehouse.findUnique({
        where: { id },
        include: { bins: true },
    });

    if (!warehouse) {
        return errorResponse('Warehouse not found', 404);
    }

    if (warehouse.bins && warehouse.bins.length > 0) {
        return errorResponse(
            'Cannot delete warehouse with existing bins. Please remove all bins first.',
            400
        );
    }

    // ✅ Soft delete - set active to false
    const deletedWarehouse = await prisma.warehouse.update({
        where: { id },
        data: {
            active: false,
            deletedAt: new Date(), // Optional
        },
    });

    return successResponse({
        message: 'Warehouse deleted successfully',
    });
}
```

#### **2.3 Frontend Implementation**

```typescript
const handleDelete = async (warehouse: Warehouse) => {
    // ✅ ALWAYS ask for confirmation
    const confirmMessage = `Are you sure you want to delete warehouse "${warehouse.name}"?\n\nThis will set the warehouse status to inactive. The warehouse data will be preserved but marked as inactive.`;

    if (!confirm(confirmMessage)) {
        return; // User cancelled
    }

    try {
        const token = localStorage.getItem('accessToken');

        const response = await fetch(`/api/warehouses/${warehouse.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // ✅ Handle specific error cases
            if (response.status === 403) {
                alert(
                    'Permission denied. Only administrators can delete warehouses.'
                );
            } else if (response.status === 400) {
                alert(
                    data.error || 'Cannot delete warehouse with existing bins.'
                );
            } else {
                alert(data.error || 'Failed to delete warehouse');
            }
            return;
        }

        // ✅ Success feedback
        alert(
            `Warehouse "${warehouse.name}" has been deactivated successfully.`
        );
        await fetchWarehouses(); // Refresh list
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        alert('Network error. Please check your connection and try again.');
    }
};
```

#### **2.4 UI Considerations**

```tsx
{
    /* ✅ Only show delete button for active items */
}
{
    warehouse.active && (
        <button
            onClick={() => handleDelete(warehouse)}
            className='text-red-700 hover:bg-red-600'
            title='Deactivate warehouse'
        >
            <TrashIcon />
            Delete
        </button>
    );
}

{
    /* ✅ Show status badge */
}
<span className={warehouse.active ? 'bg-green-100' : 'bg-red-100'}>
    {warehouse.active ? 'Active' : 'Inactive'}
</span>;
```

---

## 3. Form Validation

### ✅ Validation Strategy

#### **3.1 Multi-Layer Validation**

1. **Client-side (Frontend)** - Immediate feedback
2. **API-side (Backend)** - Security & data integrity
3. **Database-side (Schema)** - Last line of defense

#### **3.2 Frontend Validation**

```typescript
const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.code.trim()) {
        errors.code = 'Warehouse code is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
        errors.code =
            'Code must contain only uppercase letters, numbers, and hyphens';
    }

    if (!formData.name.trim()) {
        errors.name = 'Warehouse name is required';
    } else if (formData.name.length < 3) {
        errors.name = 'Name must be at least 3 characters';
    }

    // Conditional validation
    if (formData.role === 'SUPERVISOR' && !formData.warehouseId) {
        errors.warehouseId = 'Supervisor must be assigned to a warehouse';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
};
```

#### **3.3 Backend Validation (Zod Schema)**

```typescript
import { z } from 'zod';

const createWarehouseSchema = z.object({
    code: z
        .string()
        .min(1, 'Code is required')
        .regex(/^[A-Z0-9-]+$/, 'Invalid code format'),
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name too long'),
    address: z.string().min(1, 'Address is required'),
    managerId: z.string().optional(),
});

// Usage in API
const validationResult = createWarehouseSchema.safeParse(body);

if (!validationResult.success) {
    return NextResponse.json(
        {
            error: 'Validation failed',
            details: validationResult.error.issues,
        },
        { status: 400 }
    );
}
```

#### **3.4 Display Validation Errors**

```tsx
{
    /* ✅ Field-specific errors */
}
<input
    value={formData.code}
    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
    className={formErrors.code ? 'border-red-500' : 'border-gray-200'}
/>;
{
    formErrors.code && (
        <p className='text-red-600 text-sm mt-1 flex items-center gap-1'>
            <AlertIcon />
            {formErrors.code}
        </p>
    );
}

{
    /* ✅ General errors */
}
{
    formErrors.general && (
        <div className='bg-red-50 border-red-200 rounded-xl p-4'>
            <div className='flex items-start gap-3'>
                <ErrorIcon className='text-red-600' />
                <div>
                    <h4 className='font-semibold text-red-900'>Error</h4>
                    <p className='text-sm text-red-700'>{formErrors.general}</p>
                </div>
            </div>
        </div>
    );
}
```

---

## 4. User Feedback

### ✅ Feedback Guidelines

#### **4.1 Confirmation Dialogs**

**Gunakan untuk:**

-   ✅ Destructive actions (delete, deactivate)
-   ✅ Irreversible operations
-   ✅ High-impact changes

```typescript
// ✅ GOOD - Informative confirmation
const confirmed = confirm(
    `Are you sure you want to delete "${itemName}"?\n\n` +
        `This action will:\n` +
        `- Set the status to inactive\n` +
        `- Preserve all data for audit purposes\n` +
        `- Prevent future operations on this item\n\n` +
        `You can reactivate it later if needed.`
);

// ❌ BAD - Vague confirmation
const confirmed = confirm('Delete?');
```

#### **4.2 Success Messages**

```typescript
// ✅ Specific & informative
alert(`Warehouse "${warehouse.name}" has been created successfully!`);

// ✅ Include next steps
alert(
    `User "${user.fullName}" created successfully!\n\n` +
        `Login credentials have been sent to ${user.email}`
);

// ❌ Generic
alert('Success');
```

#### **4.3 Toast Notifications (Future Enhancement)**

```typescript
// Recommended: Replace alert() with toast library
import { toast } from 'react-hot-toast';

// Success
toast.success('Warehouse updated successfully!', {
    duration: 3000,
    position: 'top-right',
});

// Error
toast.error('Failed to update warehouse', {
    description: 'Please check your input and try again',
});

// Loading
const toastId = toast.loading('Updating warehouse...');
// Later: toast.dismiss(toastId);
```

---

## 5. RBAC Implementation

### ✅ Role-Based Access Control Pattern

#### **5.1 Role Hierarchy**

```typescript
enum Role {
    ADMIN = 'ADMIN', // Full system access
    SUPERVISOR = 'SUPERVISOR', // Warehouse management
    OPERATOR = 'OPERATOR', // Daily operations only
}

// Permission matrix
const PERMISSIONS = {
    warehouse: {
        create: ['ADMIN'],
        read: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
        update: ['ADMIN', 'SUPERVISOR'], // SUPERVISOR: own warehouse only
        delete: ['ADMIN'],
    },
    user: {
        create: ['ADMIN'],
        read: ['ADMIN', 'SUPERVISOR'],
        update: ['ADMIN'],
        delete: ['ADMIN'],
    },
    movement: {
        create: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
        read: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
        update: ['ADMIN', 'SUPERVISOR'], // Status: PENDING -> COMPLETED
        delete: ['ADMIN'],
    },
};
```

#### **5.2 Backend Authorization**

```typescript
// lib/auth.ts
export function isAdmin(role: string): boolean {
    return role === 'ADMIN';
}

export function canManageWarehouse(
    userRole: string,
    userWarehouseId: string,
    targetWarehouseId: string
): boolean {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'SUPERVISOR' && userWarehouseId === targetWarehouseId)
        return true;
    return false;
}

// API route
export async function PUT(request: NextRequest, { params }) {
    const auth = verifyJWT(request);

    if (!auth.authenticated) {
        return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    // ✅ Check specific permissions
    if (auth.payload.role !== 'ADMIN' && auth.payload.role !== 'SUPERVISOR') {
        return errorResponse('Insufficient permissions', 403);
    }

    // ✅ SUPERVISOR can only edit assigned warehouse
    if (auth.payload.role === 'SUPERVISOR') {
        const user = await prisma.user.findUnique({
            where: { id: auth.payload.userId },
        });

        if (user?.warehouseId !== id) {
            return errorResponse(
                'You can only edit your assigned warehouse',
                403
            );
        }
    }

    // Proceed with update...
}
```

#### **5.3 Frontend UI Conditional Rendering**

```tsx
// ✅ Hide/show buttons based on role
const user = getUserFromToken();

{
    user.role === 'ADMIN' && (
        <button onClick={handleCreate}>Create Warehouse</button>
    );
}

{
    (user.role === 'ADMIN' || user.role === 'SUPERVISOR') && (
        <button onClick={handleEdit}>Edit</button>
    );
}

{
    user.role === 'ADMIN' && <button onClick={handleDelete}>Delete</button>;
}

// ✅ Disable instead of hide (for better UX awareness)
<button
    onClick={handleEdit}
    disabled={user.role === 'OPERATOR'}
    title={
        user.role === 'OPERATOR'
            ? 'You do not have permission to edit'
            : 'Edit warehouse'
    }
>
    Edit
</button>;
```

---

## 6. API Response Standards

### ✅ Consistent Response Format

#### **6.1 Success Responses**

```typescript
// lib/api-utils.ts
export function successResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status });
}

// Usage
return successResponse({
    warehouse: updatedWarehouse,
    message: 'Warehouse updated successfully',
});

// List responses with pagination
return successResponse({
    warehouses: data,
    pagination: {
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
    },
    stats: {
        active: 95,
        inactive: 5,
    },
});
```

#### **6.2 Error Responses**

```typescript
export function errorResponse(error: string, status: number = 500) {
    return NextResponse.json({ error }, { status });
}

// ✅ Use appropriate HTTP status codes
return errorResponse('Warehouse not found', 404);
return errorResponse('Unauthorized', 401);
return errorResponse('Insufficient permissions', 403);
return errorResponse('Validation failed', 400);
return errorResponse('Warehouse code already exists', 409); // Conflict
return errorResponse('Internal server error', 500);
```

#### **6.3 Validation Error Details**

```typescript
// ✅ Include validation details for better debugging
if (!validationResult.success) {
    return NextResponse.json(
        {
            error: 'Validation failed',
            details: validationResult.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        },
        { status: 400 }
    );
}

// Frontend handling
if (data.details) {
    const errors: Record<string, string> = {};
    data.details.forEach((detail: any) => {
        errors[detail.field] = detail.message;
    });
    setFormErrors(errors);
}
```

---

## 7. UI/UX Patterns

### ✅ Consistent Design Patterns

#### **7.1 Button Styles**

```tsx
// Primary action (create, save, submit)
<button className='bg-gradient-to-r from-primary-600 to-primary-700 text-white'>
    Save
</button>

// Secondary action (cancel, back)
<button className='border-2 border-slate-300 text-slate-700'>
    Cancel
</button>

// Destructive action (delete, remove)
<button className='text-red-700 hover:bg-red-600 border-red-300'>
    Delete
</button>

// Info action (view, details)
<button className='text-blue-700 hover:bg-blue-600'>
    View Details
</button>
```

#### **7.2 Status Badges**

```tsx
// Active/Inactive
<span className={`px-3 py-1 rounded-full ${
    item.active
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300'
}`}>
    {item.active ? 'Active' : 'Inactive'}
</span>

// Movement status
<span className={`px-3 py-1 rounded-full ${
    status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
    status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800'
}`}>
    {status}
</span>
```

#### **7.3 Loading States**

```tsx
{
    loading ? (
        <div className='flex items-center justify-center py-12'>
            <div className='w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin'></div>
            <p className='text-slate-600 font-medium ml-4'>Loading...</p>
        </div>
    ) : (
        <Content />
    );
}

// Button loading state
<button disabled={submitting}>
    {submitting ? (
        <>
            <SpinnerIcon className='animate-spin' />
            Saving...
        </>
    ) : (
        <>
            <SaveIcon />
            Save
        </>
    )}
</button>;
```

#### **7.4 Empty States**

```tsx
{
    items.length === 0 ? (
        <div className='flex flex-col items-center gap-2 py-12'>
            <EmptyBoxIcon className='w-16 h-16 text-slate-300' />
            <p className='font-semibold text-lg'>No items found</p>
            <p className='text-slate-500'>
                Get started by creating your first item
            </p>
            <button className='mt-4 bg-primary-600 text-white'>
                Create Item
            </button>
        </div>
    ) : (
        <ItemList items={items} />
    );
}
```

---

## 8. State Management

### ✅ State Organization

#### **8.1 Form State Pattern**

```typescript
// ✅ Separate concerns
const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
});

const [formErrors, setFormErrors] = useState<Record<string, string>>({});
const [submitting, setSubmitting] = useState(false);

// ✅ Clear errors when starting new submission
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    setSubmitting(true);

    try {
        // ... submission logic
    } finally {
        setSubmitting(false);
    }
};

// ✅ Reset form after success
const resetForm = () => {
    setFormData({ code: '', name: '', description: '' });
    setFormErrors({});
};
```

#### **8.2 Modal State Pattern**

```typescript
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);

const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setFormErrors({});
    setShowModal(true);
};

const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    resetForm();
};
```

---

## 9. Loading States

### ✅ Loading Pattern

```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<Data[]>([]);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/endpoint');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            setData(result.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, []);
```

---

## 10. Accessibility

### ✅ Accessibility Guidelines

#### **10.1 Semantic HTML**

```tsx
// ✅ Use semantic elements
<button type="button" onClick={handleClick}>Click Me</button>
<form onSubmit={handleSubmit}>...</form>
<nav>...</nav>
<main>...</main>

// ❌ Avoid div soup
<div onClick={handleClick}>Click Me</div> // Bad for keyboard users
```

#### **10.2 ARIA Labels**

```tsx
<button
    onClick={handleDelete}
    aria-label="Delete warehouse Jakarta"
    title="Delete warehouse"
>
    <TrashIcon aria-hidden="true" />
</button>

<input
    type="text"
    aria-label="Warehouse code"
    aria-required="true"
    aria-invalid={!!formErrors.code}
    aria-describedby={formErrors.code ? 'code-error' : undefined}
/>
{formErrors.code && (
    <p id="code-error" role="alert">{formErrors.code}</p>
)}
```

#### **10.3 Keyboard Navigation**

```tsx
// ✅ Ensure all interactive elements are keyboard accessible
<button
    onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
        }
    }}
>
    Click Me
</button>;

// ✅ Modal focus trap
useEffect(() => {
    if (showModal) {
        const firstInput = modalRef.current?.querySelector('input');
        firstInput?.focus();
    }
}, [showModal]);
```

---

## 📌 Quick Reference Checklist

### Before Implementing New Feature:

-   [ ] ✅ Define RBAC permissions (who can do what)
-   [ ] ✅ Plan validation strategy (frontend + backend)
-   [ ] ✅ Decide on soft delete vs hard delete
-   [ ] ✅ Design error handling approach
-   [ ] ✅ Plan user feedback messages
-   [ ] ✅ Consider loading states
-   [ ] ✅ Design empty states
-   [ ] ✅ Plan confirmation dialogs for destructive actions
-   [ ] ✅ Ensure keyboard accessibility
-   [ ] ✅ Follow consistent UI patterns

### Code Review Checklist:

-   [ ] ✅ No `throw Error` for validation errors
-   [ ] ✅ User-friendly error messages
-   [ ] ✅ Proper HTTP status codes
-   [ ] ✅ RBAC checks in both frontend and backend
-   [ ] ✅ Soft delete implemented where appropriate
-   [ ] ✅ Confirmation dialogs for destructive actions
-   [ ] ✅ Loading states handled
-   [ ] ✅ Empty states designed
-   [ ] ✅ Form errors displayed near fields
-   [ ] ✅ Success feedback provided
-   [ ] ✅ Consistent button styles
-   [ ] ✅ Accessible markup (ARIA labels, semantic HTML)

---

## 🎯 Example: Complete Feature Implementation

### Feature: User Management Delete

**Step 1: API Implementation**

```typescript
// src/app/api/users/[id]/route.ts
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = verifyJWT(request);

    // ✅ RBAC check
    if (auth.payload?.role !== 'ADMIN') {
        return errorResponse('Only administrators can delete users', 403);
    }

    const { id } = await params;

    // ✅ Validation
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        return errorResponse('User not found', 404);
    }

    if (user.role === 'ADMIN') {
        return errorResponse('Cannot delete admin users', 400);
    }

    // ✅ Soft delete
    await prisma.user.update({
        where: { id },
        data: { active: false, deletedAt: new Date() },
    });

    return successResponse({ message: 'User deactivated successfully' });
}
```

**Step 2: Frontend Implementation**

```typescript
const handleDelete = async (user: User) => {
    // ✅ Confirmation
    if (
        !confirm(
            `Deactivate user "${user.fullName}"?\n\nThe user will no longer be able to login.`
        )
    ) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
            // ✅ Handle specific errors
            if (response.status === 403) {
                alert(
                    'Permission denied. Only administrators can delete users.'
                );
            } else {
                alert(data.error || 'Failed to delete user');
            }
            return;
        }

        // ✅ Success feedback
        alert(`User "${user.fullName}" has been deactivated.`);
        await fetchUsers();
    } catch (error) {
        alert('Network error. Please try again.');
    }
};
```

**Step 3: UI Component**

```tsx
{
    user.active && currentUser.role === 'ADMIN' && (
        <button
            onClick={() => handleDelete(user)}
            className='text-red-700 hover:bg-red-600'
            aria-label={`Deactivate user ${user.fullName}`}
        >
            <TrashIcon aria-hidden='true' />
            Deactivate
        </button>
    );
}
```

---

## 📚 Additional Resources

-   **Next.js Documentation:** https://nextjs.org/docs
-   **Prisma Best Practices:** https://www.prisma.io/docs/guides/performance-and-optimization/best-practices
-   **WCAG Accessibility Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
-   **HTTP Status Codes Reference:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0  
**Maintained by:** WMS Development Team
