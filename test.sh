#!/bin/sh
set -e

node QuickHashGenCLI.js --seed 1 --tests 100 tests/input1.txt > tests/out1.c
node QuickHashGenCLI.js --seed 123 --tests 100 tests/input2.txt > tests/out2.c

diff -u tests/golden1.c tests/out1.c
rm tests/out1.c

diff -u tests/golden2.c tests/out2.c
rm tests/out2.c

echo "All tests passed."
