@echo off
echo ========================================
echo Railway Database Migration Script
echo ========================================
echo.
echo INSTRUCTIONS:
echo 1. Go to Railway Dashboard
echo 2. Click your PostgreSQL service
echo 3. Go to Variables tab
echo 4. Copy the DATABASE_URL value
echo.
set /p RAILWAY_DB_URL="Paste your Railway DATABASE_URL here: "
echo.
echo Running migrations...
set DATABASE_URL=%RAILWAY_DB_URL%
npx prisma migrate deploy
echo.
echo ========================================
echo Migration complete!
echo ========================================
echo.
echo Do you want to seed dummy data? (y/n)
set /p SEED_CHOICE="Enter choice: "
if /i "%SEED_CHOICE%"=="y" (
    echo Seeding data...
    psql "%RAILWAY_DB_URL%" -f prisma/seed_dummy_bins.sql
    echo Data seeded successfully!
)
pause
