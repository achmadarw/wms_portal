# WMS - Quick Start Guide

Complete guide to set up and run both the web and mobile Warehouse Management System.

## 📋 Prerequisites

### For Web (Next.js)

-   Node.js 22+ installed
-   PostgreSQL 12+ running
-   npm or yarn package manager

### For Mobile (Flutter)

-   Flutter SDK latest version
-   Android Studio (for Android development)
-   Xcode (for iOS development on Mac)
-   Physical device or emulator

---

## 🌐 Web Application - First Run

### 1. Navigate to Project

```bash
cd d:/WORKSPACE/PROJECT/wms
```

### 2. Environment Configuration

The `.env.local` file is already created with default values. Update PostgreSQL connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wms_db"
JWT_SECRET="wms-secret-key-development"
NEXTAUTH_SECRET="nextauth-secret-development"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NODE_ENV="development"
```

**Steps to create PostgreSQL database:**

```bash
# On Windows with PostgreSQL installed
psql -U postgres

# In PostgreSQL CLI
CREATE DATABASE wms_db;
\q
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate
```

This will prompt you to name the migration. Type: `init`

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### 5. Test Login

-   **URL**: http://localhost:3000/login
-   **Getting Started**: http://localhost:3000/getting-started

---

## 📱 Mobile Application - First Run

### 1. Create Flutter Project

```bash
cd d:/WORKSPACE/PROJECT
flutter create --org com.wms wms_mobile
cd wms_mobile
```

### 2. Update Dependencies

Edit `pubspec.yaml` and replace dependencies section with:

```yaml
dependencies:
    flutter:
        sdk: flutter
    dio: ^5.3.1
    riverpod: ^2.4.0
    flutter_riverpod: ^2.4.0
    hive: ^2.2.3
    hive_flutter: ^1.1.0
    mobile_scanner: ^3.5.0
    intl: ^0.19.0
    uuid: ^4.0.0
    logger: ^2.1.0

dev_dependencies:
    flutter_test:
        sdk: flutter
    flutter_lints: ^3.0.0
    hive_generator: ^2.0.1
    build_runner: ^2.4.6
    riverpod_generator: ^2.3.0
```

### 3. Install Dependencies

```bash
flutter pub get
```

### 4. Generate Code

```bash
flutter pub run build_runner build
```

### 5. Run on Emulator/Device

```bash
# List available devices
flutter devices

# Run app
flutter run

# Or specific device
flutter run -d emulator-5554
```

---

## 🔧 Common Setup Issues & Solutions

### Issue: Database Connection Failed

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:

1. Verify PostgreSQL is running
2. Check database credentials in `.env.local`
3. Ensure database exists:

```bash
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname='wms_db';"
```

### Issue: Prisma Migration Error

**Error**: `Can't reach database server`

**Solution**:

```bash
# Reset database (WARNING: deletes all data!)
npm run prisma:reset

# Or manually create it again
psql -U postgres
CREATE DATABASE wms_db;
```

### Issue: Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:

```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or run on different port
PORT=3001 npm run dev
```

### Issue: Flutter Not Found

**Error**: `'flutter' is not recognized`

**Solution**:

1. Install Flutter from https://flutter.dev/docs/get-started/install
2. Add Flutter to PATH environment variable
3. Run `flutter doctor` to verify installation

### Issue: Android Emulator Not Starting

**Error**: Emulator won't launch

**Solution**:

```bash
# List available emulators
flutter emulators

# Launch specific emulator
flutter emulators --launch emulator_name
```

---

## 🗂️ Project Structure Overview

```
d:/WORKSPACE/PROJECT/
├── wms/                          # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # API routes
│   │   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── login/           # Login page
│   │   │   ├── register/        # Registration page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Home page
│   │   ├── components/          # React components
│   │   ├── lib/                 # Utilities & helpers
│   │   └── types/               # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── .env.local               # Environment variables
│   ├── package.json
│   ├── README.md
│   └── FLUTTER_SETUP.md
│
└── wms_mobile/                   # Flutter Mobile App
    ├── lib/
    │   ├── config/              # Configuration
    │   ├── data/                # Data layer
    │   ├── domain/              # Business logic
    │   ├── presentation/        # UI screens
    │   └── main.dart            # Entry point
    ├── android/                 # Android native
    ├── ios/                     # iOS native
    ├── pubspec.yaml
    └── README.md
```

---

## 📚 Key Files to Know

| File                   | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `.env.local`           | Environment variables (database, API keys) |
| `prisma/schema.prisma` | Database schema definition                 |
| `src/app/api/`         | Backend API routes                         |
| `src/app/dashboard/`   | Web UI pages                               |
| `package.json`         | Node.js dependencies & scripts             |
| `pubspec.yaml`         | Flutter dependencies                       |

---

## 🚀 Scripts & Commands

### Web Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run prisma:studio   # Open Prisma Studio (view database)
npm run prisma:migrate  # Create new migration
npm run prisma:reset    # Reset database (⚠️ deletes all data)
```

### Mobile Development

```bash
flutter run             # Run app on connected device/emulator
flutter build apk       # Build Android release APK
flutter build ios       # Build iOS app
flutter clean           # Clean build files
flutter pub get         # Install dependencies
flutter doctor          # Check Flutter setup
```

---

## 🔐 Default User Credentials

After running migrations, create a test user through the registration page:

**Register Page**: http://localhost:3000/register

Example credentials to create:

-   Email: `admin@wms.local`
-   Username: `admin`
-   Password: `Admin@123`
-   Full Name: `Administrator`

Or manually insert in database:

```sql
INSERT INTO "User" (id, email, username, password, "fullName", role, active)
VALUES (
  'user_id_here',
  'admin@wms.local',
  'admin',
  '$2a$10$...hashed_password...',
  'Administrator',
  'ADMIN',
  true
);
```

---

## 🌐 Accessing the Application

### Web Application

-   **Home**: http://localhost:3000
-   **Getting Started**: http://localhost:3000/getting-started
-   **Login**: http://localhost:3000/login
-   **Dashboard**: http://localhost:3000/dashboard
-   **API Base**: http://localhost:3000/api

### API Testing (cURL)

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wms.local","password":"Admin@123"}'

# Get items (with token)
curl -X GET http://localhost:3000/api/inventory/items \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Development Tips

1. **Prisma Studio** - Visualize and edit database:

    ```bash
    npm run prisma:studio
    ```

2. **Hot Reload** - Changes automatically reload during development

3. **TypeScript** - Use strict mode for type safety

4. **API Testing** - Use Postman or VS Code REST Client extension

5. **Mobile Testing** - Test on real device when possible for accurate results

---

## 🐛 Debugging

### Web App Debugging

-   Open browser DevTools: `F12`
-   Check Network tab for API calls
-   View Console for JavaScript errors
-   Server logs appear in terminal

### Mobile App Debugging

```bash
flutter logs              # View app logs
flutter run -v            # Verbose output
flutter run --dart-define DEBUG=true
```

---

## 📞 Support & Troubleshooting

1. Check **README.md** for detailed documentation
2. Review **FLUTTER_SETUP.md** for mobile-specific setup
3. Check terminal output for error messages
4. Verify all prerequisites are installed
5. Ensure database is running and accessible

---

## ✅ Verification Checklist

Before starting development:

-   [ ] Node.js 22+ installed (`node --version`)
-   [ ] PostgreSQL running and accessible
-   [ ] `wms` folder exists with Next.js project
-   [ ] `.env.local` configured with correct DATABASE_URL
-   [ ] `npm install` completed successfully
-   [ ] `npm run prisma:migrate` completed
-   [ ] `npm run dev` starts without errors
-   [ ] http://localhost:3000 loads successfully
-   [ ] Flutter SDK installed (`flutter --version`)
-   [ ] `flutter doctor` shows no errors (or only warnings)

---

**Last Updated**: December 1, 2025
**Version**: 1.0.0-beta
