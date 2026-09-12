@echo off
cd /d "%~dp0booking-backend"
echo Provjeravam da li su svi paketi instalirani...
call npm install --no-fund --no-audit --loglevel=error
echo.
echo Pokrecem Traveler backend...
npm start
