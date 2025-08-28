#!/bin/sh
set -e

node tests/parseQuickHashGenInput.test.js
node tests/parseCString.test.js
node tests/cli.test.js
node tests/search.test.js
node tests/helpers.test.js

node QuickHashGenCLI.node.js --seed 1 --tests 100 tests/input1.txt > tests/out1.c
# help flag should print usage and succeed
node QuickHashGenCLI.node.js --help >tests/help.log 2>&1
grep -q 'Usage:' tests/help.log
rm tests/help.log
node QuickHashGenCLI.node.js -h >tests/help.log 2>&1
grep -q 'Usage:' tests/help.log
rm tests/help.log
# invalid option values should print usage and fail
if node QuickHashGenCLI.node.js --tests -1 tests/input1.txt >/dev/null 2>tests/err.log; then
    echo "Expected failure for --tests -1" >&2
    rm tests/err.log
    exit 1
fi
grep -q 'Usage:' tests/err.log
rm tests/err.log

if node QuickHashGenCLI.node.js --seed foo tests/input1.txt >/dev/null 2>tests/err.log; then
    echo "Expected failure for --seed foo" >&2
    rm tests/err.log
    exit 1
fi
grep -q 'Usage:' tests/err.log
rm tests/err.log

# verify option handling
node QuickHashGenCLI.node.js --seed 1 --tests 100 --force-eval --eval-test tests/input1.txt > tests/out1_eval.c
node QuickHashGenCLI.node.js --seed 123 --tests 100 tests/input2.txt > tests/out2.c
node QuickHashGenCLI.node.js --seed 10 --tests 50000 tests/input3.txt > tests/out3.c
node QuickHashGenCLI.node.js --seed 7 --tests 1000 tests/input4.txt > tests/out4.c
node QuickHashGenCLI.node.js --seed 11 --tests 2000 tests/input5.txt > tests/out5.c
node QuickHashGenCLI.node.js --seed 13 --tests 100000 tests/input6.txt > tests/out6.c
node QuickHashGenCLI.node.js --seed 17 --tests 500 tests/input7.txt > tests/out7.c
node QuickHashGenCLI.node.js --seed 19 --tests 2000 tests/input8.txt > tests/out8.c
node QuickHashGenCLI.node.js --seed 23 --tests 100000 tests/input9.txt > tests/out9.c

diff -u tests/out1.c tests/out1_eval.c || { echo "Diff found: tests/out1.c vs tests/out1_eval.c" >&2; exit 1; }
diff -u tests/golden1.c tests/out1.c || { echo "Diff found: tests/golden1.c vs tests/out1.c" >&2; exit 1; }
rm tests/out1.c tests/out1_eval.c

diff -u tests/golden2.c tests/out2.c || { echo "Diff found: tests/golden2.c vs tests/out2.c" >&2; exit 1; }
rm tests/out2.c

diff -u tests/golden3.c tests/out3.c || { echo "Diff found: tests/golden3.c vs tests/out3.c" >&2; exit 1; }
rm tests/out3.c

diff -u tests/golden4.c tests/out4.c || { echo "Diff found: tests/golden4.c vs tests/out4.c" >&2; exit 1; }
rm tests/out4.c

diff -u tests/golden5.c tests/out5.c || { echo "Diff found: tests/golden5.c vs tests/out5.c" >&2; exit 1; }
rm tests/out5.c

diff -u tests/golden6.c tests/out6.c || { echo "Diff found: tests/golden6.c vs tests/out6.c" >&2; exit 1; }
rm tests/out6.c

diff -u tests/golden7.c tests/out7.c || { echo "Diff found: tests/golden7.c vs tests/out7.c" >&2; exit 1; }
rm tests/out7.c

diff -u tests/golden8.c tests/out8.c || { echo "Diff found: tests/golden8.c vs tests/out8.c" >&2; exit 1; }
rm tests/out8.c

diff -u tests/golden9.c tests/out9.c || { echo "Diff found: tests/golden9.c vs tests/out9.c" >&2; exit 1; }
rm tests/out9.c

# Exercise the README example (default 100000 tests) to ensure it completes
printf "black\nsilver\ngray\nwhite\nmaroon\nred\npurple\nfuchsia\ngreen\nlime\nolive\nyellow\nnavy\nblue\nteal\naqua\n" | node QuickHashGenCLI.node.js > colors.c
test -s colors.c
rm colors.c

echo "All tests passed."
