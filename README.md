# QuickHashGen

QuickHashGen generates tiny, collision-free hash functions and lookup tables for fixed sets of strings. It is useful when you need a fast switch-on-strings in C/C++ or any environment where a small perfect hash is required.

## Why QuickHashGen?

- Eliminates run-time hashing by precomputing a perfect hash.
- Produces compact lookup tables and simple hash expressions.
- Supports zero-terminated or non-zero-terminated strings.
- Configurable to disallow multiplications or length checks.

## Command line usage

A Node-based CLI is provided:

```
node QuickHashGenCLI.js [options] [input-file]
```

Options:

* `--tests N` &ndash; number of expressions to try (default `100000`). A larger value
  increases the search space and the odds of discovering a lower-complexity hash
  at the cost of longer runtime.
* `--no-multiplications` &ndash; disallow multiplication instructions in the generated
  hash expression. Useful for targets where multiplies are expensive or
  unavailable.
* `--no-length` &ndash; prevent use of the string length variable `n` in the hash
  expression. This keeps the hash based strictly on character data so strings of
  differing lengths don't simply hash to their length. The generated lookup still
  receives `n` for bounds checking.
* `--no-zero-termination` &ndash; generate a lookup function that does not require the
  input strings to be zero-terminated. The resulting C template uses `strncmp`
  and expects the caller to supply the string length.
* `--eval-test` &ndash; after a candidate expression is found, evaluate it on all input
  strings using the selected engine to verify that it maps each string to the
  expected index. Adds runtime but provides a safety check when modifying the
  algorithm.
* `--force-eval` &ndash; use the `eval` engine instead of the default `Function`
  constructor when searching and testing. Mirrors the HTML interface’s "Use eval
  engine" checkbox and can influence performance depending on the environment.
* `--bench` &ndash; run a simple benchmark comparing the `Function` constructor and
  `eval` engines after a solution is found.

### Input formats

Strings are read from a file or standard input. Each line may be:

* plain text, representing a single string per line, or
* one or more C-style quoted strings separated by whitespace or commas.

Quoted strings support standard C escape sequences such as `\n` or `\xFF`,
allowing spaces and binary data.

Example generating C code:

```
printf "red\ngreen\nblue\n" | node QuickHashGenCLI.js > lookup.c
```

The generated `lookup` function returns the index of a matching string or `-1` if the string is absent.

### Example: 16 basic web colors

As a concrete example, the 16 HTML color keywords can be hashed like so:

```bash
printf "black\nsilver\ngray\nwhite\nmaroon\nred\npurple\nfuchsia\ngreen\nlime\nolive\nyellow\nnavy\nblue\nteal\naqua\n" | node QuickHashGenCLI.js > colors.c
```

The resulting `colors.c` starts like this:

```c
/* Built with QuickHashGen CLI */
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
        static const char* STRINGS[16] = {
                "black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia",
                "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua"
        };
        static const int HASH_TABLE[32] = {
                -1, -1, -1, -1, -1, 15, 13, 0, -1, -1, -1, 2, 8, 7, -1, -1,
                9, -1, 12, 4, 10, 5, 6, -1, 14, 1, -1, -1, 3, -1, -1, 11
        };
        if (n < 3 || n > 7) return -1;
        int stringIndex = HASH_TABLE[(n + s[0]) & 31];
        return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
```

A C++ program can then switch on the returned index:

```cpp
#include <string>
#include <stdexcept>
extern int lookup(int n, const char* s);
enum Color {BLACK, SILVER, GRAY, WHITE, MAROON, RED, PURPLE, FUCHSIA, GREEN, LIME, OLIVE, YELLOW, NAVY, BLUE, TEAL, AQUA};

Color classify(const std::string& color) {
    switch (lookup(color.size(), color.c_str())) {
    case BLACK:   return BLACK;
    case SILVER:  return SILVER;
    case GRAY:    return GRAY;
    case WHITE:   return WHITE;
    case MAROON:  return MAROON;
    case RED:     return RED;
    case PURPLE:  return PURPLE;
    case FUCHSIA: return FUCHSIA;
    case GREEN:   return GREEN;
    case LIME:    return LIME;
    case OLIVE:   return OLIVE;
    case YELLOW:  return YELLOW;
    case NAVY:    return NAVY;
    case BLUE:    return BLUE;
    case TEAL:    return TEAL;
    case AQUA:    return AQUA;
    default: throw std::invalid_argument("unknown color");
    }
}
```

## Programmatic use

The `QuickHashGenCore.js` module exposes the algorithm for use within Node or the browser:

```javascript
const qh = require('./QuickHashGenCore');
const strings = ['red', 'green', 'blue'];

let minSize = 1;
while (strings.length > minSize) minSize <<= 1;
const maxSize = minSize * 8;

const gen = new qh.QuickHashGen(strings, minSize, maxSize,
                                true  /* zero-terminated */, 
                                true  /* allow multiplications */, 
                                true  /* allow length */);
const best = gen.search(10, 1000);
console.log(gen.generateCOutput('${hashExpression}', best));
```

## Browser interface

`QuickHashGen.html` offers an interactive front end. The single text area
acts as both input and output: type one string per line, paste a list of
quoted strings, or drop in previously generated C code. The app parses the
contents, updates the `STRINGS` array and length guards, and regenerates
the hash when you press **Start**. Editing the text or toggling any option
automatically pauses the search so you can resume with new parameters.

Checkboxes mirror the CLI flags, letting you disallow multiplications,
omit the length variable, toggle zero-termination handling, run an
evaluation check, or switch to the `eval` engine when the environment
permits it.

## License

Released under the [BSD 2-Clause License](LICENSE).
