@echo off
REM ===========================================
REM KASIR-KAF POS System - Setup & Run (Windows)
REM ===========================================

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   🍗 KASIR-KAF POS System - Setup Guide          ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Step 1: Install dependencies
echo 📦 Step 1: Installing dependencies...
call npm install

if errorlevel 1 (
    echo ✗ Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully
echo.

REM Step 2: Seed initial data
echo 🌱 Step 2: Seeding initial data...
call npm run seed

if errorlevel 1 (
    echo ✗ Failed to seed database
    pause
    exit /b 1
)

echo ✓ Database seeded successfully
echo.

REM Step 3: Start server
echo 🚀 Step 3: Starting server...
echo.
call npm start

pause
