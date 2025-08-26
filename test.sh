#!/bin/sh
set -e

node QuickHashGenCLI.js --seed 1 --tests 100 tests/input1.txt > tests/out1.c
node QuickHashGenCLI.js --seed 123 --tests 100 tests/input2.txt > tests/out2.c
node QuickHashGenCLI.js --seed 42 --tests 50000 tests/input3.txt > tests/out3.c
node QuickHashGenCLI.js --seed 7 --tests 1000 tests/input4.txt > tests/out4.c
node QuickHashGenCLI.js --seed 11 --tests 2000 tests/input5.txt > tests/out5.c
node QuickHashGenCLI.js --seed 13 --tests 100000 tests/input6.txt > tests/out6.c
node QuickHashGenCLI.js --seed 17 --tests 500 tests/input7.txt > tests/out7.c
node QuickHashGenCLI.js --seed 19 --tests 2000 tests/input8.txt > tests/out8.c

diff -u tests/golden1.c tests/out1.c
rm tests/out1.c

diff -u tests/golden2.c tests/out2.c
rm tests/out2.c

diff -u tests/golden3.c tests/out3.c
rm tests/out3.c

diff -u tests/golden4.c tests/out4.c
rm tests/out4.c

diff -u tests/golden5.c tests/out5.c
rm tests/out5.c

diff -u tests/golden6.c tests/out6.c
rm tests/out6.c

diff -u tests/golden7.c tests/out7.c
rm tests/out7.c

diff -u tests/golden8.c tests/out8.c
rm tests/out8.c

echo "All tests passed."
