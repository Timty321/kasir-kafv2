#!/bin/bash
# ===========================================
# KASIR-KAF POS System - Setup & Run Guide
# ===========================================

echo "╔════════════════════════════════════════════════════╗"
echo "║   🍗 KASIR-KAF POS System - Setup Guide          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo ""

# Step 2: Seed initial data
echo "🌱 Step 2: Seeding initial data..."
npm run seed

if [ $? -eq 0 ]; then
    echo "✓ Database seeded successfully"
else
    echo "✗ Failed to seed database"
    exit 1
fi

echo ""

# Step 3: Start server
echo "🚀 Step 3: Starting server..."
echo ""
npm start
