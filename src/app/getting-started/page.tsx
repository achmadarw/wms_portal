import Link from 'next/link';

export default function GettingStartedPage() {
    return (
        <div className='max-w-4xl mx-auto py-12 px-4'>
            {/* Header */}
            <div className='text-center mb-12'>
                <h1 className='text-4xl font-bold text-gray-900 mb-4'>
                    Welcome to WMS
                </h1>
                <p className='text-xl text-gray-600'>
                    Warehouse Management System - Complete Setup Guide
                </p>
            </div>

            {/* Quick Start Sections */}
            <div className='space-y-8'>
                {/* Web Setup */}
                <section className='bg-white rounded-lg shadow p-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                        🌐 Web Application Setup
                    </h2>
                    <div className='space-y-4'>
                        <Step
                            number={1}
                            title='Install Dependencies'
                            command='npm install'
                        />
                        <Step
                            number={2}
                            title='Configure Database'
                            description='Update .env.local with your PostgreSQL connection string'
                            command='DATABASE_URL="postgresql://user:password@localhost:5432/wms_db"'
                        />
                        <Step
                            number={3}
                            title='Setup Database'
                            command='npm run prisma:migrate'
                        />
                        <Step
                            number={4}
                            title='Start Development'
                            command='npm run dev'
                        />
                        <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded'>
                            <p className='text-blue-900'>
                                ✅ Web app will be available at{' '}
                                <a
                                    href='http://localhost:3000'
                                    className='font-bold hover:underline'
                                >
                                    http://localhost:3000
                                </a>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mobile Setup */}
                <section className='bg-white rounded-lg shadow p-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                        📱 Flutter Mobile Setup
                    </h2>
                    <div className='space-y-4'>
                        <Step
                            number={1}
                            title='Create Flutter Project'
                            command='flutter create --org com.wms wms_mobile'
                        />
                        <Step
                            number={2}
                            title='Navigate to Project'
                            command='cd wms_mobile'
                        />
                        <Step
                            number={3}
                            title='Update Dependencies'
                            description='Update pubspec.yaml with required packages (see FLUTTER_SETUP.md)'
                        />
                        <Step
                            number={4}
                            title='Install Packages'
                            command='flutter pub get'
                        />
                        <Step
                            number={5}
                            title='Run Application'
                            command='flutter run'
                        />
                        <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded'>
                            <p className='text-blue-900'>
                                📖 See{' '}
                                <Link
                                    href='/FLUTTER_SETUP.md'
                                    className='font-bold hover:underline'
                                >
                                    FLUTTER_SETUP.md
                                </Link>{' '}
                                for detailed Flutter configuration
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Overview */}
                <section className='bg-white rounded-lg shadow p-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                        ✨ Key Features
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <FeatureCard
                            icon='🔐'
                            title='Authentication'
                            description='Role-based access control (Admin, Supervisor, Operator)'
                        />
                        <FeatureCard
                            icon='📦'
                            title='Inventory Management'
                            description='Track items, SKUs, and product categories'
                        />
                        <FeatureCard
                            icon='🏭'
                            title='Warehouse Management'
                            description='Manage multiple warehouses and bin locations'
                        />
                        <FeatureCard
                            icon='🔄'
                            title='Stock Movements'
                            description='Track inbound, outbound, and transfer transactions'
                        />
                        <FeatureCard
                            icon='📱'
                            title='Mobile Scanning'
                            description='Barcode/QR code scanning on Flutter app'
                        />
                        <FeatureCard
                            icon='📊'
                            title='Analytics & Reports'
                            description='Stock levels, movement history, and inventory value'
                        />
                    </div>
                </section>

                {/* API Documentation */}
                <section className='bg-white rounded-lg shadow p-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                        📚 API Endpoints
                    </h2>
                    <div className='space-y-4'>
                        <APIEndpoint
                            method='POST'
                            path='/api/auth/login'
                            description='User login with email and password'
                        />
                        <APIEndpoint
                            method='POST'
                            path='/api/auth/register'
                            description='Register new user account'
                        />
                        <APIEndpoint
                            method='GET'
                            path='/api/inventory/items'
                            description='Get all items in catalog'
                        />
                        <APIEndpoint
                            method='POST'
                            path='/api/inventory/items'
                            description='Create new item'
                        />
                        <APIEndpoint
                            method='GET'
                            path='/api/inventory/stock'
                            description='Get stock levels by warehouse'
                        />
                        <APIEndpoint
                            method='GET'
                            path='/api/movements'
                            description='Get all stock movements'
                        />
                        <APIEndpoint
                            method='POST'
                            path='/api/movements'
                            description='Create new stock movement'
                        />
                        <APIEndpoint
                            method='GET'
                            path='/api/warehouses'
                            description='Get all warehouses'
                        />
                        <APIEndpoint
                            method='GET'
                            path='/api/reports'
                            description='Generate stock report'
                        />
                    </div>
                </section>

                {/* Database Schema */}
                <section className='bg-white rounded-lg shadow p-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                        🗄️ Database Schema
                    </h2>
                    <div className='bg-gray-50 p-4 rounded-lg overflow-x-auto'>
                        <pre className='text-sm text-gray-800'>
                            {`Tables:
├── User (id, email, username, password, role)
├── Warehouse (id, code, name, address, city, state)
├── Bin (id, code, warehouse_id, row, column, level)
├── ItemMaster (id, sku, name, category, unitCost)
├── InventoryItem (id, quantity, item_id, warehouse_id, bin_id)
├── Movement (id, reference_no, type, quantity, item_id)
└── Activity (id, action, entity, user_id, timestamp)`}
                        </pre>
                    </div>
                </section>

                {/* Next Steps */}
                <section className='bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow p-8 text-white'>
                    <h2 className='text-2xl font-bold mb-4'>🚀 Next Steps</h2>
                    <ul className='space-y-2 text-lg'>
                        <li>✅ Complete npm install for web app</li>
                        <li>✅ Setup PostgreSQL database connection</li>
                        <li>✅ Run Prisma migrations</li>
                        <li>📋 Create Flutter mobile project</li>
                        <li>📋 Configure barcode scanning</li>
                        <li>📋 Setup offline synchronization</li>
                        <li>
                            📋 Deploy to Vercel (web) and Play Store (mobile)
                        </li>
                    </ul>
                </section>
            </div>

            {/* Footer Links */}
            <div className='mt-12 flex justify-center gap-6'>
                <Link
                    href='/login'
                    className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                >
                    Go to Login
                </Link>
                <Link
                    href='/README.md'
                    className='px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
                >
                    View README
                </Link>
            </div>
        </div>
    );
}

interface StepProps {
    number: number;
    title: string;
    command?: string;
    description?: string;
}

function Step({ number, title, command, description }: StepProps) {
    return (
        <div className='flex gap-4'>
            <div className='flex-shrink-0'>
                <div className='flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold'>
                    {number}
                </div>
            </div>
            <div className='flex-1'>
                <p className='font-semibold text-gray-900'>{title}</p>
                {description && (
                    <p className='text-sm text-gray-600'>{description}</p>
                )}
                {command && (
                    <code className='block mt-2 px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm font-mono overflow-x-auto'>
                        {command}
                    </code>
                )}
            </div>
        </div>
    );
}

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className='p-4 border border-gray-200 rounded-lg'>
            <div className='text-3xl mb-2'>{icon}</div>
            <h3 className='font-bold text-gray-900'>{title}</h3>
            <p className='text-sm text-gray-600'>{description}</p>
        </div>
    );
}

interface APIEndpointProps {
    method: string;
    path: string;
    description: string;
}

function APIEndpoint({ method, path, description }: APIEndpointProps) {
    const methodColor =
        {
            GET: 'bg-blue-100 text-blue-800',
            POST: 'bg-green-100 text-green-800',
            PUT: 'bg-yellow-100 text-yellow-800',
            DELETE: 'bg-red-100 text-red-800',
        }[method] || 'bg-gray-100 text-gray-800';

    return (
        <div className='flex items-center justify-between p-3 border border-gray-200 rounded'>
            <div className='flex items-center gap-4'>
                <span
                    className={`px-3 py-1 rounded font-semibold text-sm ${methodColor}`}
                >
                    {method}
                </span>
                <code className='font-mono text-gray-800'>{path}</code>
            </div>
            <p className='text-sm text-gray-600'>{description}</p>
        </div>
    );
}
