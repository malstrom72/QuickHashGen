@echo off
setlocal

node QuickHashGenCLI.js --seed 1 --tests 100 tests\input1.txt > tests\out1.c
if errorlevel 1 exit /b 1
fc tests\out1.c tests\golden1.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 123 --tests 100 tests\input2.txt > tests\out2.c
if errorlevel 1 exit /b 1
fc tests\out2.c tests\golden2.c > nul
if errorlevel 1 exit /b 1

del tests\out1.c tests\out2.c

echo All tests passed.
