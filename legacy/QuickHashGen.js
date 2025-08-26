"use strict";

var DEBUG = true;

var assert;
if (DEBUG) {
	var AssertionError = function(message) {
		this.name = "AssertionError";
		this.message = (message || "");
	};
	AssertionError.prototype = Error.prototype;
	assert = function(condition, message) {
		if (!condition) {
			if ("assert" in console) console.assert(condition, message);
			throw new AssertionError(message);
		}
	};
} else {
	assert = function() { };
}

var C_ESCAPE_CHARS = "\\\"\'abfnrtv?";

var C_ESCAPE_CODES = "\\\"\'\x07\b\f\n\r\t\v?";

if (DEBUG) assert(C_ESCAPE_CODES.length === C_ESCAPE_CHARS.length, "C_ESCAPE_CODES.length === C_ESCAPE_CHARS.length");

function XorshiftPRNG2x32(seed0, seed1) {
	if (typeof seed0 === "undefined") seed0 = 123456789;
	if (typeof seed1 === "undefined") seed1 = 362436069;

	var px = seed0;
	var py = seed1;

	function next() {
		var t = px ^ (px << 10);
		px = py;
		py = py ^ (py >>> 13) ^ t ^ (t >>> 10);
	}

	this.nextInt32 = function() {
		next();
		return py >>> 0;
	};

	this.nextFloat = function() {
		next();
		return (py >>> 0) * 2.3283064365386962890625e-10 +
				(px >>> 0) * 5.42101086242752217003726400434970855712890625e-20;
	};

	this.nextInt = function(max) {
		next();
		return (py >>> 0) % max;
	};

	this.clone = function() {
		return new XorshiftPRNG2x32(px, py);
	};
}

var globalPRNG = new XorshiftPRNG2x32();

// Returns pair: [ string, length ]
function parseCString(s) {
	if (DEBUG) assert(s[0] === '\"' || s[0] === '\'', "s[0] === '\"' || s[0] === '\''");

	var o = '';
	var i = 1;
	var b = 1;
	var endChar = s[0];

	while (i < s.length && s[i] !== endChar && s[i] !== '\r' && s[i] !== '\n') {
		if (s[i] === '\\') {
			o += s.substring(b, i);
			var c = s[i + 1];
			i += 2;
			var index = C_ESCAPE_CHARS.indexOf(c);
			if (index >= 0) o += C_ESCAPE_CODES[index];
			else {
				b = i;
				switch (c) {
					case '\r': if (s[i] === '\n') ++i; break;
					case '\n': break;

					case 'u':
						while ("0123456789abcdefABCDEF".indexOf(s[i]) >= 0 && i < b + 4) ++i;
						if (i !== b + 4) throw new Error("Illegal C escape sequence");
						o += String.fromCharCode(parseInt(s.substring(b, i), 16));
						break;

					case 'x':
						while ("0123456789abcdefABCDEF".indexOf(s[i]) >= 0) ++i;
						if (i === b) throw new Error("Illegal C escape sequence");
						o += String.fromCharCode(parseInt(s.substring(b, i), 16));
						break;
					
					default:
						b = --i;
						while ("01234567".indexOf(s[i]) >= 0 && i < b + 3) ++i;
						if (i === b) throw new Error("Illegal C escape sequence");
						o += String.fromCharCode(parseInt(s.substring(b, i), 8));
						break;
				}
			}
			b = i;
		} else {
			++i;
		}
	}
	if (s[i] !== endChar) throw new Error("Unterminated C string");
	return [ o + s.substring(b, i), i + 1 ];
}

function toHex(i, length) {
	if (DEBUG) assert(1 <= length && length <= 16, "1 <= length && length <= 16");
	var s = i.toString(16);
	return ("0000000000000000".slice(0, length - s.length) + s).slice(-length);
}

function escapeCString(s) {
	var o = '"';
	var b = 0;
	var forbid = '';
	for (var i = 0; i < s.length; ++i) {
		var c = s[i];
		var v = c.charCodeAt(0);
		if (v < 32 || v >= 127 || c === '\"' || c === '\\' || forbid.indexOf(c) >= 0) {
			forbid = '';
			o += s.substring(b, i);
			var index = C_ESCAPE_CODES.indexOf(c);
			if (index >= 0) {
				o += "\\" + C_ESCAPE_CHARS[index];
			}
			else if (v === 0) {
				o += "\\0";
				forbid = '01234567';
			}
			else if (v <= 0xFF) {
				o += "\\x" + toHex(v, 2);
				forbid = '0123456789abcdefABCDEF';
			}
			else {
				o += "\\u" + toHex(v, 4);
			}
			b = i + 1;
		} else {
			forbid = '';
		}
	}
	o += s.substring(b, i) + '"';
//	process.stderr.write(s + " -> " + o + " -> " + parseCString(o)[0] + "\n");
	if (DEBUG) assert(parseCString(o)[0] === s, "parseCString(o)[0] === s");
	return o;
}

// Q & D test

if (DEBUG) {
	var p = parseCString('"ab\\0cdef\\\\gjio\\n\\\r\nx\\x45\\u0045\\u0123\\?\\053\\1012end"slack');
	assert(p[0] === "ab\0cdef\\gjio\nxEE\u0123?+A2end" && p[1] === 52);
	assert(escapeCString("hej \n \x22''\\ \x04 \u2414 \0 \r du") === "\"hej \\n \\\"''\\\\ \\x04 \\u2414 \\0 \\r du\"");
	assert(escapeCString("\x050018efgef") === '"\\x05\\x30\\x30\\x31\\x38\\x65\\x66gef"'); // \x in C++ is greedy (stupid)
	assert(escapeCString("\u050018efgef") === '"\\u050018efgef"'); // \u isn't greedy
}

function stringListToC(strings, maxCols, pre) {
	var s = "";
	var l = "";
	var n = strings.length;
	for (var i = 0; i < n; ++i) {
		var w = escapeCString(strings[i]);
		if (i < n - 1) {
			w += ', ';
		}
		if (l.length + w.length > maxCols && l !== "") {
			s += l + "\n" + pre;
			l = "";
		}
		l += w;
	}
	return s + l;
}

var RADIX_PREFIXES = { 8: '0', 10: '', 16: '0x' };
	
function numberListToC(numbers, elementsPerLine, radix, pre) {
	if (DEBUG) assert(radix === 0 || radix in RADIX_PREFIXES, "radix === 0 || radix in RADIX_PREFIXES");
	var s = '';
	var n = numbers.length;
	for (var i = 0; i < n; ++i) {
		s += (radix === 0 ? numbers[i] : RADIX_PREFIXES[radix] + numbers[i].toString(radix));
		if (i < n - 1) {
			s += ', ';
			if ((i % elementsPerLine) === elementsPerLine - 1) {
				s += "\n" + pre;
			}
		}
	}
	return s;
}

if (!("imul" in Math)) {
	// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
	Math.imul = function(a, b) {
		var ah  = (a >>> 16) & 0xffff;
		var al = a & 0xffff;
		var bh  = (b >>> 16) & 0xffff;
		var bl = b & 0xffff;
		// the shift by 0 fixes the sign on the high part
		// the final |0 converts the unsigned value into a signed value
		return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
	};
}

function QuickHashGen(strings, minTableSize, maxTableSize, zeroTerminated, allowMultiplication, allowLength) {
	var stringSet = { };

	var maxLength = 0;
	var minLength = 10000000;
	for (var i = 0; i < strings.length; ++i) {
		var s = strings[i];
		if (s in stringSet) {
			throw new Error("String " + escapeCString(s) + " appears more than once");
		}
		stringSet[s] = s;
		var n = s.length;
		minLength = Math.min(n, minLength);
		maxLength = Math.max(n, maxLength);
	}

	var stringChars = new Array(strings.length);
	for (var i = 0; i < strings.length; ++i) {
		var n = strings[i].length;
		var a = new Array(maxLength + 1);
		for (var j = 0; j <= maxLength; ++j) {
			var c = (j < n ? strings[i].charCodeAt(j) : 0);
			if (c >= 128) c -= 256;
			a[j] = c;
		}
		stringChars[i] = a;
	}

	var safeLength = (zeroTerminated ? minLength + 1 : minLength);

	function generateRandomExpression(rnd, complexity, constantMask, cpp, compact) {

		var OPS;
		if (cpp) {
			// [ precedence, min complexity, max complexity, generator function ]
			OPS = [
				[ 4, 1, 1, function() { return 'n'; } ],
				[ 4, 1, 1, function() { return (rnd.nextInt32() & constantMask); } ],
                                [ 4, 1, 1, function() { return 'p[' + rnd.nextInt(safeLength) + ']'; } ],
                                [ 4, 2, 2, function() { var i = (rnd.nextInt(maxLength - safeLength) + safeLength); return '(' + i + ' < n ? p[' + i + '] : 0)'; } ],
                                [ 1, 2, Infinity, function(c) { return '0u + ' + rndExpr(c - 1, 1) + ' << ' + (rnd.nextInt(31) + 1); } ],
				[ 1, 2, Infinity, function(c) { return rndExpr(c - 1, 1) + ' >> ' + (rnd.nextInt(31) + 1); } ],
				[ 2, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 2) + ' + ' + rndExpr(c - b, 2); } ],
				[ 2, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 2) + ' - ' + rndExpr(c - b, 3); } ], // that's right, right-hand side of - must have one higher prec to avoid x - (y - z) becoming x - y - z
				[ 0, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 0) + ' ^ ' + rndExpr(c - b, 0); } ],
				[ 3, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 3) + ' * ' + rndExpr(c - b, 3); } ]
			];
		} else {
			// [ precedence, min complexity, max complexity, generator function ]
			OPS = [
				[ 4, 1, 1, function() { return 'n'; } ],
				[ 4, 1, 1, function() { return (rnd.nextInt32() & constantMask); } ],
				[ 4, 1, 1, function() { return 'w[' + rnd.nextInt(safeLength) + ']'; } ],
				[ 4, 2, 2, function() { return 'w[' + (rnd.nextInt(maxLength - safeLength) + safeLength) + ']'; } ],
                                [ 1, 2, Infinity, function(c) { return '0 + ' + rndExpr(c - 1, 1) + ' << ' + (rnd.nextInt(31) + 1); } ],
				[ 1, 2, Infinity, function(c) { return rndExpr(c - 1, 1) + ' >> ' + (rnd.nextInt(31) + 1); } ],
				[ 2, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 2) + ' + ' + rndExpr(c - b, 2); } ],
				[ 2, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 2) + ' - ' + rndExpr(c - b, 3); } ], // that's right, right-hand side of - must have one higher prec to avoid x - (y - z) becoming x - y - z
				[ 0, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return rndExpr(b, 0) + ' ^ ' + rndExpr(c - b, 0); } ],
				[ 3, 2, Infinity, function(c) { var b = rnd.nextInt(c - 1) + 1; return 'Math.imul(' + rndExpr(b, 0) + ', ' + rndExpr(c - b, 0) + ')'; } ] // 0 prec here to avoid any ( )
			];
		}

		var opFrom = (allowLength ? 0 : 1);
		var opCount = OPS.length - (allowMultiplication ? 0 : 1) - (allowLength ? 0 : 1);

		function rndExpr(c, prec) {
			if (DEBUG) assert(c > 0, "c > 0");
			var op;
			do {
				op = OPS[opFrom + rnd.nextInt(opCount)];
			} while (c < op[1] || c > op[2]);
			var s = op[3](c);
			return (!compact || op[0] < prec ? '(' + s + ')' : s);
		}

		return rndExpr(complexity, 0);
	}

	var tried = [ ];
	var triedCounter = 0;
	var counter = 0;
	var collisions = [ ];

	this.search = function(complexity, iterations) {
		if (DEBUG) {
			assert(0 < complexity, "0 < complexity");
			assert(minTableSize | 0 === minTableSize && (minTableSize & (minTableSize - 1)) === 0, "minTableSize | 0 === minTableSize && (minTableSize & (minTableSize - 1)) === 0");
			assert(maxTableSize | 0 === maxTableSize && (maxTableSize & (maxTableSize - 1)) === 0, "maxTableSize | 0 === maxTableSize && (maxTableSize & (maxTableSize - 1)) === 0");
		}
		if (!(complexity in tried)) {
			tried[complexity] = { };
		}
		
		var stringsCount = strings.length;
		var hashes = new Array(stringsCount);

		for (var i = 0; i < iterations; ++i) {
			var prngCopy = globalPRNG.clone();
			var expr = generateRandomExpression(globalPRNG, complexity, maxTableSize - 1, false, false);
			if (complexity >= 4 || !(expr in tried[complexity])) {
				if (complexity < 4) {
					tried[complexity][expr] = true;
				}
				++triedCounter;

				var func = eval("(function(n, w) { return " + expr + "; })");
				
				for (var j = 0; j < stringsCount; ++j) {
					hashes[j] = func(strings[j].length, stringChars[j]);
				}

				var tableSize = minTableSize;
				var found = false;
				while (!found && tableSize <= maxTableSize) {
					var j = 0;
					while (j < stringsCount && collisions[hash = (hashes[j] & (tableSize - 1))] !== counter) {
						collisions[hash] = counter;
						++j;
					}
					counter = (counter + 1) | 0;
					if (j === stringsCount) {
						found = true;
					} else {
						tableSize <<= 1;
					}
				}
								
				if (found) {
					var table = new Array(tableSize);
					for (var j = 0; j < tableSize; ++j) table[j] = -1;
					for (var j = 0; j < stringsCount; ++j) {
						var hash = func(strings[j].length, stringChars[j]) & (tableSize - 1);
						if (DEBUG) assert(table[hash] === -1, "table[hash] === -1");
						table[hash] = j;
					}
					return { "complexity":complexity, "prng":prngCopy, "table":table, "hashes":hashes };
				}
			}
		}
		return null;
	};

	this.getTestedCount = function() {
		return triedCounter;
	};

	this.generateCOutput = function(template, foundSolution) {
		var cExpression = generateRandomExpression(foundSolution.prng.clone(), foundSolution.complexity, maxTableSize - 1, true, true);

		cExpression = '(' + cExpression + ') & ' + (foundSolution.table.length - 1);

		var replaceMap = {
			'minLength': function() { return minLength; },
			'maxLength': function() { return maxLength; },
			'stringCount': function() { return strings.length; },
			'stringList': function(pre) { return stringListToC(strings, 80, pre); },
			'tableSize': function() { return foundSolution.table.length; },
			'tableData': function(pre) { return numberListToC(foundSolution.table, 16, 0, pre); },
			'hashExpression': function() { return cExpression; },
			'stringDescription': function() { return (zeroTerminated ? "zero terminated" : "zero termination not required"); }
		};

		var output = '';
		var input = template;
		while (input !== '') {
			var index = input.indexOf('${');
			index = (index < 0 ? input.length : index);
			output += input.substr(0, index);
			input = input.substr(index);
			if (input !== '') {
				var pre = output.substr(output.lastIndexOf("\n") + 1);
				index = input.indexOf('}');
				index = (index < 0 ? input.length : index);
				output += replaceMap[input.slice(2, index)](pre);
				input = input.substr(index + 1);
			}
		}

		return output;
	};

}

function parseQuickHashGenInput(text) {
	var lines = text.split("\n");
	var strings = [ ];
	for (var i = 0; i < lines.length; ++i) {
		var s = lines[i].trim();
		if (s[0] === '\"' || s[0] === '\'') {
			var o = 0;
			while (o < s.length) {
				var parsed = parseCString(s.substr(o));
				strings.push(parsed[0]);
				o += parsed[1];
				while (" \t\v\n\r".indexOf(s[o]) >= 0) ++o;
				if (s[o] === ',') ++o;
				while (" \t\v\n\r".indexOf(s[o]) >= 0) ++o;
				if (o < s.length && !(s[o] === '\"' || s[o] === '\'')) {
					throw new Error("Invalid input");
				}
			}
		} else {
			if (s !== "") strings.push(s);
		}
	}
	return strings;
}

if (typeof module !== "undefined") {
	module.exports = {
		assert: assert,
		XorshiftPRNG2x32: XorshiftPRNG2x32,
		globalPRNG: globalPRNG,
		toHex: toHex,
		parseCString: parseCString,
		escapeCString: escapeCString,
		stringListToC: stringListToC,
		numberListToC: numberListToC,
		parseQuickHashGenInput: parseQuickHashGenInput,
		QuickHashGen: QuickHashGen
	};
}
