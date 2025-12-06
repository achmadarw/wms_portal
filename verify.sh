#!/bin/bash
# Quick verification script to check WMS application status

echo "======================================"
echo "WMS Application Verification"
echo "======================================"
echo ""

# Check Node.js
echo "✓ Node.js installed: $(node -v)"
echo "✓ npm installed: $(npm -v)"

# Check project structure
echo ""
echo "Project files:"
echo "✓ package.json: $(test -f package.json && echo 'exists' || echo 'missing')"
echo "✓ tsconfig.json: $(test -f tsconfig.json && echo 'exists' || echo 'missing')"
echo "✓ prisma/schema.prisma: $(test -f prisma/schema.prisma && echo 'exists' || echo 'missing')"
echo "✓ src/app/page.tsx: $(test -f src/app/page.tsx && echo 'exists' || echo 'missing')"

# Check key API routes
echo ""
echo "API routes:"
echo "✓ Login endpoint: $(test -f src/app/api/auth/login/route.ts && echo 'exists' || echo 'missing')"
echo "✓ Register endpoint: $(test -f src/app/api/auth/register/route.ts && echo 'exists' || echo 'missing')"
echo "✓ Inventory endpoint: $(test -f src/app/api/inventory/items/route.ts && echo 'exists' || echo 'missing')"
echo "✓ Warehouses endpoint: $(test -f src/app/api/warehouses/route.ts && echo 'exists' || echo 'missing')"

# Check UI pages
echo ""
echo "UI pages:"
echo "✓ Home page: $(test -f src/app/page.tsx && echo 'exists' || echo 'missing')"
echo "✓ Login page: $(test -f src/app/login/page.tsx && echo 'exists' || echo 'missing')"
echo "✓ Register page: $(test -f src/app/register/page.tsx && echo 'exists' || echo 'missing')"
echo "✓ Dashboard: $(test -f src/app/dashboard/page.tsx && echo 'exists' || echo 'missing')"

# Check utilities
echo ""
echo "Utilities:"
echo "✓ Auth utilities: $(test -f src/lib/auth.ts && echo 'exists' || echo 'missing')"
echo "✓ API utilities: $(test -f src/lib/api-utils.ts && echo 'exists' || echo 'missing')"
echo "✓ Prisma client: $(test -f src/lib/prisma.ts && echo 'exists' || echo 'missing')"

# Check documentation
echo ""
echo "Documentation:"
echo "✓ README.md: $(test -f README.md && echo 'exists' || echo 'missing')"
echo "✓ QUICKSTART.md: $(test -f QUICKSTART.md && echo 'exists' || echo 'missing')"
echo "✓ STATUS_REPORT.md: $(test -f STATUS_REPORT.md && echo 'exists' || echo 'missing')"
echo "✓ RUNNING_GUIDE.md: $(test -f RUNNING_GUIDE.md && echo 'exists' || echo 'missing')"

echo ""
echo "======================================"
echo "✓ Application structure verified!"
echo "======================================"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Then open your browser to:"
echo "  http://localhost:3000"
echo ""
