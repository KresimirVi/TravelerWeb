@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Traveler - Prvo podesavanje baze podataka
echo ============================================
echo.
echo Ovo se pokrece SAMO JEDNOM, prilikom prve instalacije.
echo.

set PSQL=
for %%v in (18 17 16 15 14) do (
    if exist "C:\Program Files\PostgreSQL\%%v\bin\psql.exe" (
        set PSQL="C:\Program Files\PostgreSQL\%%v\bin\psql.exe"
        goto :found
    )
)

echo GRESKA: Nisam pronasao psql.exe u C:\Program Files\PostgreSQL\
echo Provjeri da li je PostgreSQL instaliran, ili otvori ovaj fajl u Notepad-u
echo i rucno upisi putanju do psql.exe u PSQL varijablu na vrhu.
pause
exit /b 1

:found
echo Pronasao PostgreSQL: %PSQL%
echo.

echo Unesi lozinku za "postgres" korisnika koju si postavio prilikom instalacije PostgreSQL-a.
echo (Ta lozinka ce ti biti trazena nekoliko puta ispod - to je normalno.)
echo.

echo [1/7] Pravim korisnika "havenly"...
%PSQL% -U postgres -c "CREATE USER havenly WITH PASSWORD 'havenly_dev_2026';"

echo.
echo [2/7] Pravim bazu "havenly_db"...
%PSQL% -U postgres -c "CREATE DATABASE havenly_db OWNER havenly;"

echo.
echo [3/7] Pravim tabele...
%PSQL% -U postgres -d havenly_db -f "%~dp0booking-backend\src\db\schema.sql"

echo.
echo [4/7] Prebacujem vlasnistvo SVIH tabela na "havenly" (kljucno! bez ovoga
echo aplikacija ne moze sama dodavati nove kolone/tabele u buducim azuriranjima)...
%PSQL% -U postgres -d havenly_db -c "DO $fixowner$ DECLARE r RECORD; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO havenly'; END LOOP; END $fixowner$;"

echo.
echo [5/7] Dajem prava nad tabelama...
%PSQL% -U postgres -d havenly_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO havenly;"

echo.
echo [6/7] Dajem prava nad sekvencama...
%PSQL% -U postgres -d havenly_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO havenly;"

echo.
echo [7/7] Instaliram Node pakete i punim bazu podacima...
cd /d "%~dp0booking-backend"
call npm install
call npm run seed

echo.
echo Instaliram pakete za web aplikaciju...
cd /d "%~dp0booking-webapp"
call npm install

echo.
echo ============================================
echo   Gotovo! Baza je spremna.
echo ============================================
echo.
echo Sada mozes koristiti start-havenly.bat da pokrenes aplikaciju
echo (i svaki sljedeci put - ovaj setup fajl ti vise ne treba).
echo.
pause
