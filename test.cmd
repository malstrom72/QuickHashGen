@echo off
setlocal

node QuickHashGenCLI.js --seed 1 --tests 100 tests\input1.txt > tests\out1.c
node QuickHashGenCLI.js --seed 1 --tests 100 --force-eval --eval-test tests\input1.txt > tests\out1_eval.c
if errorlevel 1 exit /b 1
fc tests\out1.c tests\out1_eval.c > nul
if errorlevel 1 exit /b 1
fc tests\out1.c tests\golden1.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 123 --tests 100 tests\input2.txt > tests\out2.c
if errorlevel 1 exit /b 1
fc tests\out2.c tests\golden2.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 10 --tests 50000 tests\input3.txt > tests\out3.c
if errorlevel 1 exit /b 1
fc tests\out3.c tests\golden3.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 7 --tests 1000 tests\input4.txt > tests\out4.c
if errorlevel 1 exit /b 1
fc tests\out4.c tests\golden4.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 11 --tests 2000 tests\input5.txt > tests\out5.c
if errorlevel 1 exit /b 1
fc tests\out5.c tests\golden5.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 13 --tests 100000 tests\input6.txt > tests\out6.c
if errorlevel 1 exit /b 1
fc tests\out6.c tests\golden6.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 17 --tests 500 tests\input7.txt > tests\out7.c
if errorlevel 1 exit /b 1
fc tests\out7.c tests\golden7.c > nul
if errorlevel 1 exit /b 1
node QuickHashGenCLI.js --seed 19 --tests 2000 tests\input8.txt > tests\out8.c
if errorlevel 1 exit /b 1
fc tests\out8.c tests\golden8.c > nul
if errorlevel 1 exit /b 1

del tests\out1.c tests\out1_eval.c tests\out2.c tests\out3.c tests\out4.c tests\out5.c tests\out6.c tests\out7.c tests\out8.c

echo All tests passed.
