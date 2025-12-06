#!/bin/bash

# Build script for deployment

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo "Building application..."
npm run build

echo "Build completed successfully!"
