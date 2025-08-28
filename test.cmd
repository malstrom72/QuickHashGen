@echo off
setlocal

rem Fail helper label for uniform error handling
rem Usage: any_command || goto :error

node QuickHashGenCLI.node.js --help > tests\help.log 2>&1 || goto :error
findstr /R /C:"Usage:" tests\help.log >nul || goto :error
node QuickHashGenCLI.node.js -h > tests\help.log 2>&1 || goto :error
findstr /R /C:"Usage:" tests\help.log >nul || goto :error
del tests\help.log

node QuickHashGenCLI.node.js --seed 1 --tests 100 tests\input1.txt > tests\out1.c || goto :error
node QuickHashGenCLI.node.js --seed 1 --tests 100 --force-eval --eval-test tests\input1.txt > tests\out1_eval.c || goto :error
fc tests\out1.c tests\out1_eval.c > nul || goto :error
fc tests\out1.c tests\golden1.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 123 --tests 100 tests\input2.txt > tests\out2.c || goto :error
fc tests\out2.c tests\golden2.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 10 --tests 50000 tests\input3.txt > tests\out3.c || goto :error
fc tests\out3.c tests\golden3.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 7 --tests 1000 tests\input4.txt > tests\out4.c || goto :error
fc tests\out4.c tests\golden4.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 11 --tests 2000 tests\input5.txt > tests\out5.c || goto :error
fc tests\out5.c tests\golden5.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 13 --tests 100000 tests\input6.txt > tests\out6.c || goto :error
fc tests\out6.c tests\golden6.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 17 --tests 500 tests\input7.txt > tests\out7.c || goto :error
fc tests\out7.c tests\golden7.c > nul || goto :error
node QuickHashGenCLI.node.js --seed 19 --tests 2000 tests\input8.txt > tests\out8.c || goto :error
fc tests\out8.c tests\golden8.c > nul || goto :error

del tests\out1.c tests\out1_eval.c tests\out2.c tests\out3.c tests\out4.c tests\out5.c tests\out6.c tests\out7.c tests\out8.c

REM Exercise the README example (default 100000 tests) to ensure it completes
(
echo black
echo silver
echo gray
echo white
echo maroon
echo red
echo purple
echo fuchsia
echo green
echo lime
echo olive
echo yellow
echo navy
echo blue
echo teal
echo aqua
) | node QuickHashGenCLI.node.js > colors.c || goto :error
if not exist colors.c goto :error
for %%A in (colors.c) do if %%~zA LSS 1 goto :error
del colors.c

echo All tests passed.
goto :eof

:error
exit /b 1
