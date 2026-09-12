@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Pokrecem Traveler...
echo ============================================
echo.

echo [1/4] Pokrecem PostgreSQL servis...
net start postgresql-x64-18 >nul 2>&1
net start postgresql-x64-17 >nul 2>&1
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql-x64-14 >nul 2>&1
echo    (ako je vec pokrenut, to je normalno da javi gresku - nastavljamo)
echo.

REM Marker fajl se cuva u korisnickom profilu (NE u ovom folderu) - tako
REM preživljava i kad izbrišeš i ponovo raspakuješ ovaj folder za novo
REM azuriranje. Popravka dozvola se onda radi STVARNO samo jednom, ikad.
set MARKER=%LOCALAPPDATA%\TravelerApp\.ownership-fixed

if not exist "%MARKER%" (
    echo [2/4] Prvi put - popravljam dozvole u bazi...
    echo       (ovo se radi SAMO SADA, nikad vise nakon ovoga)
    echo.

    set PSQL=
    for %%v in (18 17 16 15 14) do (
        if exist "C:\Program Files\PostgreSQL\%%v\bin\psql.exe" (
            set PSQL="C:\Program Files\PostgreSQL\%%v\bin\psql.exe"
        )
    )

    if defined PSQL (
        echo Unesi lozinku za "postgres" korisnika kad zatrazi:
        !PSQL! -U postgres -d havenly_db -c "DO $fixowner$ DECLARE r RECORD; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO havenly'; END LOOP; END $fixowner$;" 2>nul
        if not exist "%LOCALAPPDATA%\TravelerApp" mkdir "%LOCALAPPDATA%\TravelerApp"
        echo. > "%MARKER%"
        echo    Gotovo.
    ) else (
        echo    (PostgreSQL nije pronadjen na uobicajenoj putanji, preskacem ovaj korak)
        if not exist "%LOCALAPPDATA%\TravelerApp" mkdir "%LOCALAPPDATA%\TravelerApp"
        echo. > "%MARKER%"
    )
    echo.
) else (
    echo [2/4] Dozvole u bazi su vec provjerene ranije - preskacem.
    echo.
)

echo [3/4] Pokrecem backend server (novi prozor)...
start "Traveler - Backend" cmd /k "%~dp0run-backend.bat"

echo    Cekam da backend stvarno zavrsi pokretanje...
set READY=0
for /l %%i in (1,1,60) do (
    if !READY! equ 0 (
        powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:4000/api/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
        if !errorlevel! equ 0 (
            set READY=1
        ) else (
            timeout /t 1 /nobreak >nul
        )
    )
)
if !READY! equ 1 (
    echo    Backend je spreman!
) else (
    echo    Backend jos nije odgovorio nakon 60 sekundi - nastavljam ipak
    echo    (moguce da baza puni puno podataka prvi put, pricekaj malo)
)
echo.

echo [4/4] Pokrecem web aplikaciju (novi prozor)...
start "Traveler - Frontend" cmd /k "%~dp0run-frontend.bat"

echo    Cekam par sekundi da se web aplikacija pripremi...
timeout /t 4 /nobreak >nul

echo.
echo ============================================
echo   Otvaram aplikaciju u browseru...
echo ============================================
start http://localhost:5173

echo.
echo Gotovo! Ostavi oba nova prozora (Backend i Frontend) otvorena
echo dok koristis aplikaciju. Ovaj prozor mozes zatvoriti.
echo.
pause
