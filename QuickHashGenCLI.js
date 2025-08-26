#!/usr/bin/env node
"use strict";

const fs = require('fs');
const core = require('./QuickHashGenCore');

function printUsage() {
    console.error('Usage: node QuickHashGenCLI.js [options] [input-file]');
    console.error('Options:');
    console.error('  --tests N                number of expressions to try (default 100000)');
    console.error('  --no-multiplications     disallow multiplications');
    console.error('  --no-length              disallow use of n (string length)');
    console.error('  --no-zero-termination    allow non-zero-terminated strings');
    console.error('  --eval-test              verify result with eval engine');
    console.error('  --force-eval             use eval engine (if available)');
    console.error('  --bench                  benchmark eval engine');
    console.error('  --seed N                seed the random generator');
    console.error('');
    console.error('Strings are read from [input-file] or stdin. Each line may be');
    console.error('plain text or one or more C-style quoted strings separated by');
    console.error('commas or whitespace.');
}

let args = process.argv.slice(2);
let opts = {
    tests: 100000,
    allowMultiplications: true,
    allowLength: true,
    requireZeroTermination: true,
    evalTest: false,
    forceEval: false,
    bench: false
};
let inputFile = null;
for (let i = 0; i < args.length; ++i) {
    const a = args[i];
    if (a === '--tests' && i + 1 < args.length) {
        opts.tests = parseInt(args[++i], 10);
    } else if (a === '--no-multiplications') {
        opts.allowMultiplications = false;
    } else if (a === '--no-length') {
        opts.allowLength = false;
    } else if (a === '--no-zero-termination') {
        opts.requireZeroTermination = false;
    } else if (a === '--eval-test') {
        opts.evalTest = true;
    } else if (a === '--force-eval') {
        opts.forceEval = true;
    } else if (a === '--bench') {
        opts.bench = true;
    } else if (a === '--seed' && i + 1 < args.length) {
        const s0 = parseInt(args[++i], 10);
        core.globalPRNG = new core.XorshiftPRNG2x32(s0);
    } else if (a[0] === '-') {
        printUsage();
        process.exit(1);
    } else {
        inputFile = a;
    }
}

let inputText;
if (inputFile) {
    inputText = fs.readFileSync(inputFile, 'utf8');
} else {
    inputText = fs.readFileSync(0, 'utf8');
}

let strings = core.parseQuickHashGenInput(inputText);
if (!strings.length) {
    console.error('No strings provided');
    process.exit(1);
}

let minSize = 1;
while (strings.length > minSize) minSize <<= 1;
let maxSize = minSize * 8;

let qh = new core.QuickHashGen(strings, minSize, maxSize, opts.requireZeroTermination, opts.allowMultiplications, opts.allowLength, opts.forceEval);
let best = null;

while (qh.getTestedCount() < opts.tests) {
    let complexity = core.globalPRNG.nextInt(best === null ? 32 : best.complexity) + 1;
    let remaining = opts.tests - qh.getTestedCount();
    let iters = Math.max(1, Math.min(remaining, Math.floor(200 / strings.length)));
    let found = qh.search(complexity, iters);
    if (found && (best === null || found.complexity < best.complexity || (found.complexity === best.complexity && found.table.length < best.table.length))) {
        best = found;
        if (best.complexity === 1) break;
    }
}

if (!best) {
    console.error('No solution found after ' + qh.getTestedCount() + ' tests');
    process.exit(1);
}

if (opts.evalTest) {
    let expr = qh.generateCOutput("${hashExpression}", best).trim();
    let fn;
    try { fn = eval('(function(n,s){return ' + expr + ';})'); }
    catch (e) {
        console.error('Eval compile error: ' + (e && e.message ? e.message : String(e)));
        process.exit(1);
    }
    let minLen = Infinity; for (let i = 0; i < strings.length; ++i) { let L = strings[i].length; if (L < minLen) minLen = L; }
    let padLen = opts.requireZeroTermination ? (minLen + 1) : minLen;
    for (let j = 0; j < strings.length; ++j) {
        let str = strings[j];
        let n = str.length;
        let arr = new Array(Math.max(padLen, n));
        for (let k = 0; k < arr.length; ++k) {
            let c = (k < n ? str.charCodeAt(k) : 0);
            if (c >= 128) c -= 256;
            arr[k] = c;
        }
        let idx = fn(n, arr) & (best.table.length - 1);
        if (best.table[idx] !== j) {
            console.error('Eval mismatch on #' + j);
            process.exit(1);
        }
    }
}

if (opts.bench) {
    let expr = qh.generateCOutput("${hashExpression}", best).trim();
    let sample = strings[0];
    let n = sample.length;
    let arrLen = opts.requireZeroTermination ? (n + 1) : n;
    let arr = new Array(arrLen);
    for (let i = 0; i < arrLen; ++i) {
        let c = (i < n ? sample.charCodeAt(i) : 0);
        if (c >= 128) c -= 256;
        arr[i] = c;
    }
    const ITERS = 100000;
    let fnEval = eval('(function(n,s){return ' + expr + ';})');
    let t0 = Date.now();
    for (let i = 0; i < ITERS; ++i) fnEval(n, arr);
    let tEval = Date.now() - t0;
    console.error('Benchmark (' + ITERS + ' iterations): eval=' + tEval + 'ms');
}

const ZERO_TEMPLATE = '/* Built with QuickHashGen CLI */\n'
 + 'static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {\n'
 + '\tstatic const char* STRINGS[${stringCount}] = {\n'
 + '\t\t${stringList}\n'
 + '\t};\n'
 + '\tstatic const int HASH_TABLE[${tableSize}] = {\n'
 + '\t\t${tableData}\n'
 + '\t};\n'
 + '\tif (n < ${minLength} || n > ${maxLength}) return -1;\n'
 + '\tint stringIndex = HASH_TABLE[${hashExpression}];\n'
 + '\treturn (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;\n'
 + '}\n';

const NONZERO_TEMPLATE = '/* Built with QuickHashGen CLI */\n'
 + 'static int lookup(int n /* string length */, const char* s /* string (zero termination not required) */) {\n'
 + '\tstatic const char* STRINGS[${stringCount}] = {\n'
 + '\t\t${stringList}\n'
 + '\t};\n'
 + '\tstatic const int HASH_TABLE[${tableSize}] = {\n'
 + '\t\t${tableData}\n'
 + '\t};\n'
 + '\t// zero-termination not expected\n'
 + '\tif (n < ${minLength} || n > ${maxLength}) return -1;\n'
 + '\tint stringIndex = HASH_TABLE[${hashExpression}];\n'
 + '\treturn (stringIndex >= 0 && strncmp(s, STRINGS[stringIndex], n) == 0 && STRINGS[stringIndex][n] == 0) ? stringIndex : -1;\n'
 + '}\n';

let TEMPLATE = opts.requireZeroTermination ? ZERO_TEMPLATE : NONZERO_TEMPLATE;
process.stdout.write(qh.generateCOutput(TEMPLATE, best));
