#!/bin/bash

# WMS Setup Script
# This script helps setup the WMS application

echo "======================================"
echo "Warehouse Management System Setup"
echo "======================================"
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
  echo "❌ Failed to install dependencies"
  exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Step 2: Generate Prisma client
echo "Step 2: Generating Prisma client..."
npm run prisma:generate

if [ $? -ne 0 ]; then
  echo "❌ Failed to generate Prisma client"
  exit 1
fi

echo "✅ Prisma client generated"
echo ""

# Step 3: Run migrations
echo "Step 3: Running database migrations..."
npm run prisma:migrate

if [ $? -ne 0 ]; then
  echo "❌ Failed to run migrations"
  echo "Make sure PostgreSQL is running and database URL is correct in .env.local"
  exit 1
fi

echo "✅ Database migrations completed"
echo ""

# Step 4: Start development server
echo "Step 4: Starting development server..."
echo "Access the application at: http://localhost:3000"
echo ""

npm run dev
