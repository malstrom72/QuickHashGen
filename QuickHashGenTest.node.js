var quickHashGen = require('./QuickHashGenCore');

var QuickHashGen = quickHashGen.QuickHashGen;
var globalPRNG = quickHashGen.globalPRNG;
var XorshiftPRNG2x32 = quickHashGen.XorshiftPRNG2x32;

var MAX_COMPLEXITY = 32;
var MAX_SIZE_MULTIPLIER = 8;

var TEMPLATE =
'#include <iostream>\n' +
'#include <cstring>\n' +
'#include <cassert>\n' +
'\n' +
'static int lookup(int n /* string length */, const char* s /* zero-terminated string */) {\n' +
'       static const char* STRINGS[${stringCount}] = {\n' +
'               ${stringList}\n' +
'       };\n' +
'       static const int HASH_TABLE[${tableSize}] = {\n' +
'               ${tableData}\n' +
'       };\n' +
'       const unsigned char* p = (const unsigned char*) s;\n' +
'       assert(s[n] == \'\\0\');\n' +
'       if (n < ${minLength} || n > ${maxLength}) return -1;\n' +
'       int stringIndex = HASH_TABLE[${hashExpression}];\n' +
'       return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;\n' +
'}\n' +
'\n' +
'int main()\n' +
'{\n' +
'    static const char* STRINGS[${stringCount}] = {\n' +
'               ${stringList}\n' +
'       };\n' +
'    for (int i = 0; i < ${stringCount}; ++i) {\n' +
'        // std::cout << STRINGS[i] << std::endl;\n' +
'        int j = lookup(strlen(STRINGS[i]), STRINGS[i]);\n' +
'        if (j != i) {\n' +
'            std::cout << std::endl << "BAD!! (" << i << "==" << j << ")" << std::endl;\n' +
'            return 1;\n' +
'        }\n' +
'    }\n' +
'   \n' +
'   std::cout << std::endl << "GOOD!!" << std::endl;\n' +
'   return 0;\n' +
'}\n';

var seed = ((Math.random() * 1000000) + 1) | 0;
process.stdout.write("// seed: " + seed + "\n");
var rnd = new XorshiftPRNG2x32(seed);

var wordCount = rnd.nextInt(100) + 1;
var strings = [ ];
var didStrings = { };
for (var i = 0; i < wordCount; ++i) {
        var wordLength = rnd.nextInt(20);
        var randomWord = '';
        for (var j = 0; j < wordLength; ++j) {
                randomWord += String.fromCharCode(1 + rnd.nextInt(256 - 1));
        }
        if (!(randomWord in didStrings)) {
                didStrings[randomWord] = true;
                strings.push(randomWord);
        }
}

var minSize;
for (minSize = 1; strings.length > minSize; minSize <<= 1) ;
var maxSize = minSize * MAX_SIZE_MULTIPLIER;

var theHashMaker = new QuickHashGen(strings, minSize, maxSize, true, true, true);

var found = null;
while (found === null) {
        var complexity = globalPRNG.nextInt(MAX_COMPLEXITY) + 1;
        found = theHashMaker.search(complexity, 100000);
}

if (found !== null) {
        process.stdout.write(theHashMaker.generateCOutput(TEMPLATE, found));
        process.exit(0);
} else {
        process.exit(1);
}
