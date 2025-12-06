# WMS Flutter Mobile Application

Complete setup guide for Flutter mobile application with barcode scanning, offline support, and backend integration.

---

## ⚠️ IMPORTANT: SEPARATE PROJECT STRUCTURE

**The Flutter mobile app MUST be in a separate folder from the backend project.**

```
D:\WORKSPACE\PROJECT\
├── wms/                    # Backend (Next.js) - THIS PROJECT
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ...
│
└── wms_mobile/             # Mobile (Flutter) - SEPARATE PROJECT
    ├── lib/
    ├── android/
    ├── ios/
    ├── pubspec.yaml
    └── ...
```

**Do NOT create the Flutter project inside the `wms` folder.**

---

## 📱 Setup Instructions

### 1. Create Flutter Project (SEPARATE FOLDER)

```bash
# Navigate to projects directory (NOT inside wms folder)
cd D:\WORKSPACE\PROJECT

# Create Flutter project as a SEPARATE directory
flutter create --org com.wms wms_mobile

cd wms_mobile
```

### 2. Update pubspec.yaml

Add the following dependencies:

```yaml
dependencies:
    flutter:
        sdk: flutter

    # Networking
    dio: ^5.3.1

    # State Management
    riverpod: ^2.4.0
    flutter_riverpod: ^2.4.0

    # Local Storage
    hive: ^2.2.3
    hive_flutter: ^1.1.0

    # Barcode Scanning
    mobile_scanner: ^3.5.0

    # Date/Time
    intl: ^0.19.0

    # Utilities
    uuid: ^4.0.0
    logger: ^2.1.0

dev_dependencies:
    flutter_test:
        sdk: flutter
    flutter_lints: ^3.0.0
    hive_generator: ^2.0.1
    build_runner: ^2.4.6
    riverpod_generator: ^2.3.0
    custom_lint: ^0.5.0
    riverpod_lint: ^0.1.1

flutter:
    uses-material-design: true
```

### 3. Install Dependencies

```bash
flutter pub get
```

### 4. Generate Hive Adapters

```bash
# For Hive model generation
flutter packages pub run build_runner build

# Or use watch mode for development
flutter packages pub run build_runner watch
```

## 🗂️ Project Structure

```
wms_mobile/
├── lib/
│   ├── config/
│   │   ├── api_config.dart      # API configuration
│   │   ├── hive_config.dart     # Hive setup
│   │   └── app_routes.dart      # Navigation routes
│   │
│   ├── data/
│   │   ├── local/
│   │   │   ├── models/          # Hive models
│   │   │   └── dao/             # Data access objects
│   │   │
│   │   ├── remote/
│   │   │   ├── api_client.dart  # Dio client
│   │   │   └── api_services/    # API service classes
│   │   │
│   │   └── repositories/        # Repository pattern
│   │
│   ├── domain/
│   │   ├── entities/            # Business entities
│   │   └── usecases/            # Use cases
│   │
│   ├── presentation/
│   │   ├── providers/           # Riverpod providers
│   │   ├── widgets/             # Reusable widgets
│   │   └── screens/
│   │       ├── auth/
│   │       ├── home/
│   │       ├── inventory/
│   │       ├── scan/
│   │       └── movement/
│   │
│   └── main.dart
│
├── android/                     # Android native code
├── ios/                         # iOS native code
├── pubspec.yaml
└── README.md
```

## 🔐 Authentication Setup

### 1. Create Models

**lib/data/local/models/user_model.dart**:

```dart
import 'package:hive/hive.dart';

part 'user_model.g.dart';

@HiveType(typeId: 0)
class UserModel extends HiveObject {
  @HiveField(0)
  late String id;

  @HiveField(1)
  late String email;

  @HiveField(2)
  late String username;

  @HiveField(3)
  late String fullName;

  @HiveField(4)
  late String role;

  @HiveField(5)
  late String? accessToken;

  @HiveField(6)
  late DateTime createdAt;
}
```

### 2. Setup API Client

**lib/data/remote/api_client.dart**:

```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiClient {
  late Dio _dio;
  final String baseUrl;

  ApiClient({
    required this.baseUrl,
    String? token,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        contentType: 'application/json',
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ),
    );

    // Add logging interceptor
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(responseBody: true));
    }
  }

  Future<Response> get(String path) => _dio.get(path);

  Future<Response> post(String path, {required Map<String, dynamic> data}) =>
      _dio.post(path, data: data);

  Future<Response> put(String path, {required Map<String, dynamic> data}) =>
      _dio.put(path, data: data);

  Future<Response> delete(String path) => _dio.delete(path);

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
}
```

### 3. Create Auth Service

**lib/data/remote/api_services/auth_service.dart**:

```dart
import 'package:dio/dio.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient apiClient;

  AuthService({required this.apiClient});

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await apiClient.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String username,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await apiClient.post(
        '/auth/register',
        data: {
          'email': email,
          'username': username,
          'password': password,
          'fullName': fullName,
          'role': 'OPERATOR',
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}
```

## 📦 Inventory & Stock Management

### Create Inventory Service

**lib/data/remote/api_services/inventory_service.dart**:

```dart
class InventoryService {
  final ApiClient apiClient;

  InventoryService({required this.apiClient});

  Future<List<dynamic>> getItems() async {
    final response = await apiClient.get('/inventory/items');
    return response.data['items'] ?? [];
  }

  Future<Map<String, dynamic>> getStock({required String warehouseId}) async {
    final response = await apiClient.get(
      '/inventory/stock?warehouseId=$warehouseId',
    );
    return response.data;
  }

  Future<Map<String, dynamic>> updateStock({
    required String itemMasterId,
    required String warehouseId,
    required int quantity,
    String? binId,
  }) async {
    final response = await apiClient.post(
      '/inventory/stock',
      data: {
        'itemMasterId': itemMasterId,
        'warehouseId': warehouseId,
        'quantity': quantity,
        if (binId != null) 'binId': binId,
      },
    );
    return response.data;
  }
}
```

## 📱 Barcode Scanning Setup

### Android Configuration

**android/app/build.gradle**:

```gradle
android {
    ...
    defaultConfig {
        ...
        minSdkVersion 21
        ...
    }
}
```

**android/app/src/main/AndroidManifest.xml**:

```xml
<manifest>
    <uses-permission android:name="android.permission.CAMERA" />
    ...
</manifest>
```

### iOS Configuration

**ios/Podfile** - uncomment platform:

```ruby
platform :ios, '11.0'
```

**ios/Runner/Info.plist**:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for scanning barcodes</string>
```

### Create Scanner Widget

**lib/presentation/widgets/barcode_scanner.dart**:

```dart
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class BarcodeScanner extends StatefulWidget {
  final Function(String) onBarcodeDetected;

  const BarcodeScanner({
    Key? key,
    required this.onBarcodeDetected,
  }) : super(key: key);

  @override
  State<BarcodeScanner> createState() => _BarcodeScannerState();
}

class _BarcodeScannerState extends State<BarcodeScanner> {
  late MobileScannerController controller;

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        MobileScanner(
          controller: controller,
          onDetect: (capture) {
            final List<Barcode> barcodes = capture.barcodes;
            for (final barcode in barcodes) {
              if (barcode.rawValue != null) {
                widget.onBarcodeDetected(barcode.rawValue!);
                Navigator.pop(context);
              }
            }
          },
        ),
        Positioned(
          bottom: 20,
          left: 20,
          right: 20,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              FloatingActionButton(
                onPressed: () => controller.toggleTorch(),
                tooltip: 'Toggle Torch',
                child: const Icon(Icons.flashlight_on),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
```

## 🔄 Offline Sync

### Create Sync Service

**lib/data/local/sync_service.dart**:

```dart
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';

class SyncService {
  final Box pendingBox;
  final Connectivity connectivity;

  SyncService({
    required this.pendingBox,
    required this.connectivity,
  });

  Future<void> addPendingOperation({
    required String operation,
    required Map<String, dynamic> data,
  }) async {
    await pendingBox.add({
      'operation': operation,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
      'synced': false,
    });
  }

  Future<void> syncPendingOperations({
    required Function(Map<String, dynamic>) onSync,
  }) async {
    final connectivityResult = await connectivity.checkConnectivity();

    if (connectivityResult == ConnectivityResult.none) {
      return; // No connection, skip sync
    }

    for (int i = 0; i < pendingBox.length; i++) {
      final item = pendingBox.getAt(i);
      if (!item['synced']) {
        try {
          await onSync(item);
          item['synced'] = true;
          await item.save();
        } catch (e) {
          print('Sync failed for operation: $e');
        }
      }
    }
  }
}
```

## 🎯 Riverpod Providers

### Create Auth Provider

**lib/presentation/providers/auth_provider.dart**:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/remote/api_services/auth_service.dart';
import '../../data/local/models/user_model.dart';

final authServiceProvider = Provider((ref) {
  // Create auth service with API client
  return AuthService(apiClient: apiClient);
});

final userProvider = StateNotifierProvider<UserNotifier, UserModel?>((ref) {
  return UserNotifier(ref.watch(authServiceProvider));
});

class UserNotifier extends StateNotifier<UserModel?> {
  final AuthService authService;

  UserNotifier(this.authService) : super(null);

  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      final result = await authService.login(
        email: email,
        password: password,
      );
      // Store user and token
      state = UserModel()
        ..email = result['user']['email']
        ..id = result['user']['id']
        ..accessToken = result['token']['accessToken'];
    } catch (e) {
      rethrow;
    }
  }
}
```

## 🚀 Run Mobile App

### Android

```bash
flutter run -d android
```

### iOS

```bash
flutter run -d ios
```

### Web (optional)

```bash
flutter run -d chrome
```

## 📋 Next Steps

1. ✅ Project structure created
2. ⏳ Implement authentication screens
3. ⏳ Build inventory management UI
4. ⏳ Add barcode scanning screens
5. ⏳ Setup offline synchronization
6. ⏳ Add reporting screens
7. ⏳ Test on device
8. ⏳ Build and deploy to Play Store

## 🐛 Common Issues

### Hive Adapter Not Generated

```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## ⚠️ PROJECT STRUCTURE REMINDER

**ALWAYS create Flutter project as a SEPARATE folder:**

```
✅ CORRECT:
D:\WORKSPACE\PROJECT\
├── wms/           (Backend - Next.js)
└── wms_mobile/    (Mobile - Flutter) ← Separate folder

❌ WRONG:
D:\WORKSPACE\PROJECT\wms\
├── src/
├── prisma/
└── wms_mobile/    ← Do NOT put here!
```

**Benefits of separate structure:**

-   Clean separation of concerns
-   Easier to manage dependencies
-   Can deploy independently
-   No conflicts between npm and pub
-   Easier for team development

**How to run both:**

Terminal 1 - Backend:

```bash
cd D:\WORKSPACE\PROJECT\wms
npm run dev
```

Terminal 2 - Mobile:

```bash
cd D:\WORKSPACE\PROJECT\wms_mobile
flutter run
```

---

## 📖 Additional Resources

-   Flutter Official Documentation: https://flutter.dev/docs
-   Flutter Getting Started: https://flutter.dev/docs/get-started
-   Riverpod Documentation: https://riverpod.dev
-   Dio HTTP Client: https://pub.dev/packages/dio
-   Mobile Scanner: https://pub.dev/packages/mobile_scanner
-   Hive Database: https://pub.dev/packages/hive

### Camera Permission Denied

-   Check AndroidManifest.xml and Info.plist
-   Request runtime permissions:

```dart
import 'package:permission_handler/permission_handler.dart';

Permission.camera.request();
```

### API Connection Issues

-   Ensure backend is running
-   Check API_BASE_URL configuration
-   Verify network connectivity
-   Use `http://10.0.2.2:3000` for emulator

## 📚 Resources

-   [Flutter Documentation](https://flutter.dev/docs)
-   [Riverpod Guide](https://riverpod.dev)
-   [Mobile Scanner Package](https://pub.dev/packages/mobile_scanner)
-   [Hive Database](https://docs.hivedb.dev/)

---

**Last Updated**: December 1, 2025
