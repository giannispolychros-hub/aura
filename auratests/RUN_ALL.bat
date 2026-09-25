@echo off
setlocal enabledelayedexpansion
echo === AURA REGRESSION - every suite in this folder, discovered not listed ===
echo.
set N=0
set SILENT=0
for %%f in (test_*.js stress_test_*.js) do (
  set /a N+=1
  echo|set /p="%%~nf: "
  node "%%f" 2>&1 | findstr /C:"passed"
  if errorlevel 1 (
    echo NO RESULT LINE - this suite reported nothing
    set /a SILENT+=1
  )
)
echo.
echo suites run: !N!     suites that reported nothing: !SILENT!
if not "!SILENT!"=="0" echo *** A SILENT SUITE IS WORSE THAN A FAILING ONE - fix before trusting this run ***
echo.
pause
