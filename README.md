# Warehouse Management System (WMS)

Professional Web & Mobile Warehouse Management System built with **Next.js**, **Prisma**, **PostgreSQL**, and **Flutter**.

## 🚀 Features

### Web Application (Next.js)

-   ✅ **Authentication & Authorization** - Role-based access (Admin, Supervisor, Operator)
-   ✅ **Inventory Management** - Item master data, SKU tracking, categories
-   ✅ **Stock Management** - Real-time stock levels, bin locations
-   ✅ **Movements & Transactions** - Inbound, outbound, transfer, adjustment, return
-   ✅ **Warehouse Management** - Multiple warehouses, bin management with coordinates
-   ✅ **Reporting & Analytics** - Stock reports, movement history, inventory value
-   ✅ **User Management** - Create/manage users with different roles
-   ✅ **Activity Logging** - Audit trail for all operations

### Mobile Application (Flutter)

-   📱 **Barcode/QR Scanning** - Scan items for fast data entry
-   📱 **Offline Support** - Work without internet, auto-sync when online
-   📱 **Full Feature Parity** - Access all web features from mobile
-   📱 **Real-time Sync** - Synchronize data between web and mobile
-   📱 **Cross-Platform** - iOS and Android support

## 🛠️ Tech Stack

### Backend/Web

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **ORM**: Prisma 5
-   **Database**: PostgreSQL
-   **Authentication**: JWT + Bcrypt
-   **Styling**: Tailwind CSS
-   **Deployment**: Vercel

### Mobile

-   **Framework**: Flutter
-   **Language**: Dart
-   **State Management**: Riverpod
-   **Local Storage**: Hive
-   **HTTP Client**: Dio/HTTP
-   **Barcode Scanning**: mobile_scanner
-   **Deployment**: Google Play Store, App Store

## 📋 Project Structure

```
wms/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── inventory/     # Inventory management
│   │   │   ├── movements/     # Stock movements
│   │   │   ├── warehouses/    # Warehouse management
│   │   │   └── reports/       # Analytics & reports
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home page
│   │   └── globals.css
│   ├── components/            # Reusable React components
│   ├── lib/
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── api-utils.ts      # API middleware & helpers
│   │   └── prisma.ts         # Prisma client
│   └── types/                # TypeScript interfaces
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.local                # Environment variables
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

-   Node.js 22+ or higher
-   PostgreSQL 12+
-   npm or yarn
-   Flutter SDK (for mobile development)

### 1. Setup Web Application

#### Install Dependencies

```bash
cd wms
npm install
```

#### Configure Database

Create a PostgreSQL database and update `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wms_db"
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

#### Initialize Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will create all necessary tables in your PostgreSQL database.

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Setup Mobile Application (Flutter)

#### Prerequisites

-   Flutter SDK installed
-   Android Studio or Xcode
-   Mobile device or emulator

#### Create Flutter Project

```bash
flutter create wms_mobile
cd wms_mobile
```

#### Add Dependencies

Update `pubspec.yaml`:

```yaml
dependencies:
    flutter:
        sdk: flutter
    riverpod:
    hive:
    dio:
    mobile_scanner:
```

Install dependencies:

```bash
flutter pub get
```

#### Connect to Backend

Update API configuration to point to your Next.js backend:

```dart
const String API_URL = 'http://localhost:3000/api';
```

#### Run Mobile App

```bash
flutter run
```

## 📚 API Documentation

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "username": "username",
        "fullName": "Full Name",
        "role": "ADMIN"
    },
    "token": {
        "accessToken": "jwt-token",
        "expiresIn": 86400
    }
}
```

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "fullName": "New User",
  "role": "OPERATOR"
}
```

### Inventory Management

#### Get Items

```http
GET /api/inventory/items
Authorization: Bearer {jwt-token}
```

#### Create Item

```http
POST /api/inventory/items
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "sku": "SKU-001",
  "name": "Product Name",
  "category": "Electronics",
  "unitCost": 100.00
}
```

#### Get Stock Levels

```http
GET /api/inventory/stock?warehouseId={warehouseId}
Authorization: Bearer {jwt-token}
```

### Movements

#### Get Movements

```http
GET /api/movements?warehouseId={warehouseId}
Authorization: Bearer {jwt-token}
```

#### Create Movement

```http
POST /api/movements
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "itemId": "uuid",
  "warehouseId": "uuid",
  "type": "INBOUND",
  "quantity": 50,
  "notes": "Received from supplier"
}
```

### Reports

#### Get Stock Report

```http
GET /api/reports?warehouseId={warehouseId}
Authorization: Bearer {jwt-token}
```

## 🔐 Authentication & Authorization

The system uses JWT-based authentication with role-based access control (RBAC):

-   **ADMIN**: Full system access
-   **SUPERVISOR**: Can manage inventory, movements, and reports
-   **OPERATOR**: Can view and perform stock movements

## 🗄️ Database Schema

### Key Tables

-   **User**: System users with roles
-   **Warehouse**: Warehouse locations
-   **Bin**: Storage locations within warehouses
-   **ItemMaster**: Product catalog
-   **InventoryItem**: Stock levels by item, warehouse, and bin
-   **Movement**: Stock transaction history
-   **Activity**: Audit log of all operations

## 📱 Using Mobile App

### Login

1. Open the Flutter app
2. Enter your credentials
3. Authenticate with your user account

### Scanning Items

1. Navigate to "Scan" tab
2. Point camera at barcode/QR code
3. Confirm item details
4. Complete stock movement

### Offline Mode

-   All data syncs automatically when internet is available
-   Can continue working offline - changes are queued
-   Conflicts are resolved based on timestamp

## 🚀 Deployment

### Web (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Mobile (Google Play Store)

1. Build release APK:
    ```bash
    flutter build apk --release
    ```
2. Upload to Google Play Console

## 🐛 Troubleshooting

### Database Connection Issues

-   Ensure PostgreSQL is running
-   Verify `DATABASE_URL` in `.env.local`
-   Check database credentials

### API Connection Issues (Mobile)

-   Ensure backend is running (`npm run dev`)
-   Update API_URL in Flutter app
-   Check firewall/network settings
-   Use `http://10.0.2.2:3000` for Android emulator

### Prisma Issues

```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (development only!)
npm run prisma:reset
```

## 📝 Development Guidelines

-   Follow TypeScript strict mode
-   Use Tailwind CSS for styling
-   Document API endpoints
-   Test API routes before deployment
-   Use environment variables for sensitive data

## 🤝 Contributing

1. Create a feature branch
2. Commit changes
3. Push to repository
4. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review API documentation
3. Check database schema
4. Create an issue on GitHub

---

**Last Updated**: December 1, 2025
**Version**: 1.0.0-beta
