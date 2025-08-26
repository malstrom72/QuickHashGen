"use strict";
// ===== Output templates =====
var ZERO_TERMINATED_TEMPLATE =
        "/* Built with http://nuedge.net/StringHashMaker */\n" +
        "static int <<findSomething>>(int n /* string length */, const char* s /* string (zero terminated) */) {\n" +
        "\tstatic const char* STRINGS[${stringCount}] = {\n" +
        "\t\t${stringList}\n" +
        "\t};\n" +
        "\tstatic const int HASH_TABLE[${tableSize}] = {\n" +
        "\t\t${tableData}\n" +
        "\t};\n" +
        "\tconst unsigned char* p = (const unsigned char*) s;\n" +
        "\tassert(s[n] == '\\0');\n" +
        "\tif (n < ${minLength} || n > ${maxLength}) return -1;\n" +
        "\tint stringIndex = HASH_TABLE[${hashExpression}];\n" +
        "\treturn (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;\n" +
        "}";
var NON_ZERO_TERMINATED_TEMPLATE =
        "/* Built with http://nuedge.net/StringHashMaker */\n" +
        "static int <<findSomething>>(int n /* string length */, const char* s /* string (zero termination not required) */) {\n" +
        "\tstatic const char* STRINGS[${stringCount}] = {\n" +
        "\t\t${stringList}\n" +
        "\t};\n" +
        "\tstatic const int HASH_TABLE[${tableSize}] = {\n" +
        "\t\t${tableData}\n" +
        "\t};\n" +
        "\tconst unsigned char* p = (const unsigned char*) s;\n" +
        "\t// zero-termination not expected\n" +
        "\tif (n < ${minLength} || n > ${maxLength}) return -1;\n" +
        "\tint stringIndex = HASH_TABLE[${hashExpression}];\n" +
        "\treturn (stringIndex >= 0 && strncmp(s, STRINGS[stringIndex], n) == 0 && STRINGS[stringIndex][n] == 0) ? stringIndex : -1;\n" +
        "}";
// ===== DOM wiring & state =====
var HTML_ELEMENTS = [
	"editor",
	"solutionsCount",
	"complexity",
	"tableSize",
	"testedCount",
	"requireZeroTermination",
	"allowMultiplications",
	"allowLength",
	"evalTest",
	"forceEval",
	"hashes",
	"startPause",
	"testStatus",
];
var elements = {};
for (var i = 0; i < HTML_ELEMENTS.length; ++i)
	elements[HTML_ELEMENTS[i]] = document.getElementById(HTML_ELEMENTS[i]);
// Pause on edits/toggles
var isRunning = false;
if (elements.editor)
	elements.editor.addEventListener("input", function () {
		if (isRunning) {
			isRunning = false;
			elements.startPause.textContent = "Start";
		}
	});
if (elements.allowMultiplications)
	elements.allowMultiplications.addEventListener("change", function () {
		if (isRunning) {
			isRunning = false;
			elements.startPause.textContent = "Start";
		}
	});
if (elements.allowLength)
	elements.allowLength.addEventListener("change", function () {
		if (isRunning) {
			isRunning = false;
			elements.startPause.textContent = "Start";
		}
	});
if (elements.requireZeroTermination)
	elements.requireZeroTermination.addEventListener("change", function () {
		currentTemplate = elements.requireZeroTermination.checked
			? ZERO_TERMINATED_TEMPLATE
			: NON_ZERO_TERMINATED_TEMPLATE;
		// Apply signature/assert/return rewrite so the editor stays in sync with the toggle
		try {
			var code = elements.editor.value || "";
			if (code) {
				elements.editor.value = rewriteZeroTerminationMode(
					code,
					elements.requireZeroTermination.checked,
				);
				lastInputText = elements.editor.value;
			}
		} catch (_) {}
		if (isRunning) {
			isRunning = false;
			elements.startPause.textContent = "Start";
		}
	});
if (elements.forceEval)
	elements.forceEval.addEventListener("change", function () {
		ENGINE_USE_EVAL = !!(EVAL_ALLOWED && elements.forceEval.checked);
		if (isRunning) {
			isRunning = false;
			elements.startPause.textContent = "Start";
		}
		updateModeLabel();
	});
var currentTemplate = ZERO_TERMINATED_TEMPLATE;
var theHashMaker = null,
	lastInputText = elements.editor.value,
	solutionsCounter = 0,
	strings = [],
	minSize,
	maxSize,
	best = null;
var ENGINE_USE_EVAL = false;
var EVAL_ALLOWED = false;
// ===== Controls =====
function toggleRun() {
	if (isRunning) {
		isRunning = false;
		elements.startPause.textContent = "Start";
		return;
	}
	isRunning = true;
	elements.startPause.textContent = "Pause";
	resetSearch(); // re-parse editor (C++ or raw list)
	updateCodeMetadata(); // sync STRINGS length and min/max guard
}
window.toggleRun = toggleRun; // expose for inline onclick
function parseStringsFromEditor(text) {
	var p = text.indexOf("STRINGS");
	if (p >= 0) {
		p = text.indexOf("{", p);
		if (p < 0) throw new Error("No '{' after STRINGS.");
		var i = p + 1,
			depth = 1,
			body = "";
		while (i < text.length && depth > 0) {
			var ch = text[i++];
			if (ch === "{") depth++;
			else if (ch === "}") depth--;
			if (depth > 0) body += ch;
		}
		var out = [],
			j = 0;
		while (j < body.length) {
			while (j < body.length && body[j] !== '"' && body[j] !== "'") j++;
			if (j >= body.length) break;
			var parsed = parseCString(body.slice(j));
			out.push(parsed[0]);
			j += parsed[1];
		}
		if (out.length === 0)
			throw new Error("Found STRINGS but no string literals.");
		return out;
	}
	return parseQuickHashGenInput(text);
}
function findInitializerRange(code, declStart) {
	var eq = code.indexOf("=", declStart);
	if (eq < 0) return null;
	var open = code.indexOf("{", eq);
	if (open < 0) return null;
	var depth = 1,
		k = open + 1;
	while (k < code.length && depth > 0) {
		var ch = code[k++];
		if (ch === "{") depth++;
		else if (ch === "}") depth--;
	}
	if (depth !== 0) return null;
	return { open: open, close: k - 1 };
}
function findMatchingSquare(code, openIndex) {
	if (openIndex < 0 || code[openIndex] !== "[") return -1;
	var depth = 0;
	for (var i = openIndex; i < code.length; ++i) {
		var ch = code[i];
		if (ch === "[") depth++;
		else if (ch === "]") {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

function detectEvalAllowed(){
  try {
    var f = eval("(function(n,w){return (n|0)+(w[0]|0);})");
    return f(1,[2]) === 3;
  } catch (_) {
    return false;
  }
}
// ---- Eval-based verification (expression generated for C) ----
function _baseStatusText() {
	var t = elements.testStatus.textContent || "";
	var p = t.indexOf(" | ");
	return p >= 0 ? t.slice(0, p) : t;
}
function stopAndReport(header, details) {
	try {
		isRunning = false;
		if (elements.startPause) elements.startPause.textContent = "Start";
	} catch (_) {}
	var msg = "[FAIL] " + header;
	var body = "";
	try {
		body = "\n" + JSON.stringify(details, null, 2);
	} catch (_) {
		body = "\n" + String(details);
	}
	try {
		var prev = elements.hashes.textContent || "";
		elements.hashes.textContent = (prev ? prev + "\n" : "") + msg + body;
		console.error("QuickHashGen failure:", header, details);
	} catch (_) {}
}
function updateModeLabel() {
	try {
		var base = elements.testStatus.textContent || "";
		var core = base.split(" | ")[0];
		var mode = ENGINE_USE_EVAL
			? "eval"
			: EVAL_ALLOWED
				? "csp-safe (manual)"
				: "csp-safe (CSP)";
		elements.testStatus.textContent =
			core + (core ? " | " : "") + "Mode: " + mode;
	} catch (_) {}
}
function verifyByEval(found) {
	if (!elements.evalTest || !elements.evalTest.checked) return; // disabled
	var expr = theHashMaker.generateCOutput("${hashExpression}", found).trim();
	var fn;
	try {
		fn = eval("(function(n,s){return " + expr + ";})");
	} catch (e) {
		elements.testStatus.textContent =
			_baseStatusText() +
			" | Eval: compile error: " +
			(e && e.message ? e.message : String(e));
		stopAndReport("Self-tests: Eval compile error", {
			expr: expr,
			error: e && e.stack ? e.stack : String(e),
		});
		return;
	}
	var minLen = Infinity;
	for (var i = 0; i < strings.length; ++i) {
		var L = strings[i].length;
		if (L < minLen) minLen = L;
	}
	if (!isFinite(minLen)) {
		elements.testStatus.textContent = _baseStatusText() + " | Eval: no strings";
		return;
	}
	var padLen = elements.requireZeroTermination.checked ? minLen + 1 : minLen;
	var mismatches = 0,
		firstMsg = "";
	var mod = found.table.length;
	var details = [];
	for (var j = 0; j < strings.length; ++j) {
		var str = strings[j],
			n = str.length;
		var sArr = new Array(Math.max(padLen, n));
		for (var k = 0; k < sArr.length; ++k) {
			var c = k < n ? str.charCodeAt(k) : 0;
			if (c >= 128) c -= 256;
			sArr[k] = c;
		}
		var got;
		try {
			got = fn(n, sArr);
		} catch (e2) {
			mismatches++;
			if (!firstMsg)
				firstMsg =
					"runtime error on #" +
					j +
					": " +
					(e2 && e2.message ? e2.message : String(e2));
			if (details.length < 20)
				details.push({
					index: j,
					string: str,
					n: n,
					error: e2 && e2.stack ? e2.stack : String(e2),
				});
			continue;
		}
		var idxEval = got & (mod - 1);
		var idxFunc = found.hashes[j] & (mod - 1);
		if ((idxEval | 0) !== (idxFunc | 0) || found.table[idxEval] !== j) {
			mismatches++;
			if (!firstMsg)
				firstMsg =
					"mismatch on #" +
					j +
					" (" +
					escapeCString(str) +
					"): eval=" +
					idxEval +
					", func=" +
					idxFunc +
					", table[" +
					idxEval +
					"]=" +
					found.table[idxEval];
			if (details.length < 20)
				details.push({
					index: j,
					string: str,
					n: n,
					got: got,
					idxEval: idxEval | 0,
					idxFunc: idxFunc | 0,
					tableAt: found.table[idxEval],
				});
		}
	}
	elements.testStatus.textContent =
		_baseStatusText() +
		(mismatches === 0
			? " | Eval: OK (" + strings.length + " checked)"
			: " | Eval: " +
				mismatches +
				" mismatch" +
				(mismatches > 1 ? "es" : "") +
				(firstMsg ? " — " + firstMsg : ""));
	if (mismatches > 0) {
		stopAndReport("Self-tests: Eval mismatch", {
			expr: expr,
			tableSize: found.table.length,
			details: details,
		});
	}
}
// ---- Editor-line verification (checks the actual text in editor) ----
function extractEditorHashExpr(code) {
	var useStart = code.indexOf("int stringIndex");
	var startIdx =
		useStart >= 0
			? code.indexOf("HASH_TABLE[", useStart)
			: code.lastIndexOf("HASH_TABLE[");
	if (startIdx < 0) return null;
	var bOpen = code.indexOf("[", startIdx);
	var bClose = findMatchingSquare(code, bOpen);
	if (bOpen < 0 || bClose <= bOpen) return null;
	return code.slice(bOpen + 1, bClose);
}
function verifyEditorLine(found) {
	if (!elements.evalTest || !elements.evalTest.checked) return;
	var code = elements.editor.value || "";
	var expr = extractEditorHashExpr(code);
	if (!expr) {
		elements.testStatus.textContent =
			_baseStatusText() + " | Editor: expr not found";
		stopAndReport("Editor: expr not found", {
			codeSample: code.slice(
				Math.max(0, code.indexOf("int stringIndex") - 80),
				Math.min(code.length, code.indexOf("int stringIndex") + 120),
			),
		});
		return;
	}
	var fn;
	try {
		fn = eval("(function(n,s){return (" + expr + ");})");
	} catch (e) {
		elements.testStatus.textContent =
			_baseStatusText() +
			" | Editor: compile error: " +
			(e && e.message ? e.message : String(e));
		stopAndReport("Editor: compile error", {
			expr: expr,
			error: e && e.stack ? e.stack : String(e),
		});
		return;
	}
	var minLen = Infinity;
	for (var i = 0; i < strings.length; ++i) {
		var L = strings[i].length;
		if (L < minLen) minLen = L;
	}
	if (!isFinite(minLen)) {
		elements.testStatus.textContent =
			_baseStatusText() + " | Editor: no strings";
		return;
	}
	var padLen = elements.requireZeroTermination.checked ? minLen + 1 : minLen;
	var mismatches = 0,
		firstMsg = "";
	var mod = found.table.length;
	var details = [];
	for (var j = 0; j < strings.length; ++j) {
		var str = strings[j],
			n = str.length;
		var sArr = new Array(Math.max(padLen, n));
		for (var k = 0; k < sArr.length; ++k) {
			var c = k < n ? str.charCodeAt(k) : 0;
			if (c >= 128) c -= 256;
			sArr[k] = c;
		}
		var got;
		try {
			got = fn(n, sArr);
		} catch (e2) {
			mismatches++;
			if (!firstMsg)
				firstMsg =
					"runtime error on #" +
					j +
					": " +
					(e2 && e2.message ? e2.message : String(e2));
			if (details.length < 20)
				details.push({
					index: j,
					string: str,
					n: n,
					error: e2 && e2.stack ? e2.stack : String(e2),
				});
			continue;
		}
		var idxEval = got & (mod - 1);
		var idxFunc = found.hashes[j] & (mod - 1);
		if ((idxEval | 0) !== (idxFunc | 0) || found.table[idxEval] !== j) {
			mismatches++;
			if (!firstMsg)
				firstMsg =
					"mismatch on #" +
					j +
					" (" +
					escapeCString(str) +
					"): editor=" +
					idxEval +
					", func=" +
					idxFunc +
					", table[" +
					idxEval +
					"]=" +
					found.table[idxEval];
			if (details.length < 20)
				details.push({
					index: j,
					string: str,
					n: n,
					got: got,
					idxEditor: idxEval | 0,
					idxFunc: idxFunc | 0,
					tableAt: found.table[idxEval],
				});
		}
	}
	var prev = elements.testStatus.textContent || _baseStatusText();
	var left = prev.split(" | ")[0];
	elements.testStatus.textContent =
		left +
		(mismatches === 0
			? " | Editor: OK (" + strings.length + " checked)"
			: " | Editor: " +
				mismatches +
				" mismatch" +
				(mismatches > 1 ? "es" : "") +
				(firstMsg ? " — " + firstMsg : ""));
	if (mismatches > 0) {
		stopAndReport("Editor: mismatch", {
			expr: expr,
			tableSize: found.table.length,
			details: details,
		});
	}
}
function applyBestToEditor(found) {
	var code = elements.editor.value || "";
	var hasStrings = code.indexOf("STRINGS") >= 0;
	if (!hasStrings) {
		elements.editor.value = theHashMaker.generateCOutput(
			currentTemplate,
			found,
		);
		lastInputText = elements.editor.value;
		return;
	}
	var tableSize = found.table.length;
	var tableBody = numberListToC(found.table, 16, 0, "\t\t");
	var declStart = code.indexOf("static const int HASH_TABLE[");
	if (declStart < 0) declStart = code.indexOf("HASH_TABLE[");
	if (declStart >= 0) {
		var declOpen = code.indexOf("[", declStart) + 1;
		var declClose = code.indexOf("]", declOpen);
		if (declOpen > 0 && declClose > declOpen)
			code =
				code.slice(0, declOpen) + String(tableSize) + code.slice(declClose);
	}
	var rng = findInitializerRange(code, declStart);
	if (rng) {
		var header = code.slice(0, rng.open + 1);
		var footer = code.slice(rng.close);
		code = header + "\n\t\t" + tableBody + "\n\t" + footer;
	}
	var useStart = code.indexOf("int stringIndex");
	var startIdx =
		useStart >= 0
			? code.indexOf("HASH_TABLE[", useStart)
			: code.lastIndexOf("HASH_TABLE[");
	if (startIdx >= 0) {
		var bOpen = code.indexOf("[", startIdx);
		var bClose = findMatchingSquare(code, bOpen);
		if (bOpen >= 0 && bClose > bOpen) {
			var cExpr = theHashMaker
				.generateCOutput("${hashExpression}", found)
				.trim();
			code = code.slice(0, bOpen + 1) + cExpr + code.slice(bClose);
		}
	}
	elements.editor.value = code;
	lastInputText = elements.editor.value;
}
function resetSearch() {
	theHashMaker = null;
	solutionsCounter = 0;
	lastInputText = elements.editor.value;
	best = null;
	EVAL_ALLOWED = detectEvalAllowed();
	if (elements.forceEval) {
		if (EVAL_ALLOWED) {
			elements.forceEval.disabled = false;
		} else {
			elements.forceEval.checked = false;
			elements.forceEval.disabled = true;
		}
	}
	ENGINE_USE_EVAL = !!(
		EVAL_ALLOWED &&
		elements.forceEval &&
		elements.forceEval.checked
	);
	updateModeLabel();
	try {
		strings = parseStringsFromEditor(lastInputText);
	} catch (_) {
		strings = [];
	}
	if (strings.length > 0) {
		for (minSize = 1; strings.length > minSize; minSize <<= 1);
		maxSize = minSize * 8;
		theHashMaker = new QuickHashGen(
			strings,
			minSize,
			maxSize,
			elements.requireZeroTermination.checked,
			elements.allowMultiplications.checked,
			elements.allowLength.checked,
			ENGINE_USE_EVAL,
		);
		elements.hashes.innerHTML = "";
		elements.testedCount.innerHTML = "0";
		elements.solutionsCount.innerHTML = "0";
		elements.complexity.innerHTML = "?";
		elements.tableSize.innerHTML = "?";
	}
}
function updateCodeMetadata() {
	try {
		var code = elements.editor.value || "";
		if (code.indexOf("STRINGS") < 0) return;
		var list =
			Array.isArray(strings) && strings.length
				? strings
				: parseStringsFromEditor(code);
		var count = list.length,
			minLen = Infinity,
			maxLen = 0;
		for (var i = 0; i < list.length; ++i) {
			var n = list[i].length;
			if (n < minLen) minLen = n;
			if (n > maxLen) maxLen = n;
		}
		if (!isFinite(minLen)) {
			minLen = 0;
			maxLen = 0;
		}
		var idx = code.indexOf("STRINGS[");
		if (idx >= 0) {
			idx += 8;
			var close = code.indexOf("]", idx);
			if (close >= 0)
				code = code.slice(0, idx) + String(count) + code.slice(close);
		}
		var t0 = code.indexOf("if (n < ");
		if (t0 >= 0) {
			var aStart = t0 + 8,
				aEnd = aStart;
			while (
				aEnd < code.length &&
				code.charCodeAt(aEnd) >= 48 &&
				code.charCodeAt(aEnd) <= 57
			)
				++aEnd;
			var orIdx = code.indexOf("|| n > ", aEnd);
			if (orIdx >= 0) {
				var bStart = orIdx + 7,
					bEnd = bStart;
				while (
					bEnd < code.length &&
					code.charCodeAt(bEnd) >= 48 &&
					code.charCodeAt(bEnd) <= 57
				)
					++bEnd;
				code =
					code.slice(0, aStart) +
					String(minLen) +
					code.slice(aEnd, bStart) +
					String(maxLen) +
					code.slice(bEnd);
			}
		}
		elements.editor.value = code;
		lastInputText = elements.editor.value;
	} catch (_) {}
}
function updateOutput() {
	if (best !== null) {
		try {
			applyBestToEditor(best);
		} catch (_) {}
		try {
			verifyByEval(best);
		} catch (_) {}
		try {
			verifyEditorLine(best);
		} catch (_) {}
		var s = "";
		for (var i = 0; i < strings.length; ++i)
			s +=
				escapeCString(strings[i]) +
				" : " +
				(best.hashes[i] & (best.table.length - 1)) +
				" (" +
				best.hashes[i] +
				")\n";
		elements.hashes.innerHTML = s;
	} else elements.hashes.innerHTML = "";
}
function intervalFunction() {
	try {
		if (!isRunning) return;
		if (elements.editor.value !== lastInputText) resetSearch();
		if (theHashMaker !== null) {
			var timeOut = Date.now() + 100;
			while (Date.now() - timeOut < 0) {
				var complexity =
					globalPRNG.nextInt(best === null ? 32 : best.complexity) + 1;
				var iters = Math.max(200 / strings.length, 1);
				var found = theHashMaker.search(complexity, iters);
				if (found !== null) {
					if (
						best === null ||
						found.complexity < best.complexity ||
						(found.complexity === best.complexity &&
							found.table.length < best.table.length)
					) {
						best = found;
						updateOutput();
					}
					++solutionsCounter;
				}
			}
			elements.testedCount.textContent = theHashMaker.getTestedCount();
			elements.solutionsCount.textContent = solutionsCounter;
			elements.complexity.textContent = best === null ? "?" : best.complexity;
			elements.tableSize.textContent = best === null ? "?" : best.table.length;
		}
	} catch (err) {
		elements.hashes.textContent = String(err);
		theHashMaker = null;
		isRunning = false;
		elements.startPause.textContent = "Start";
	}
}
window.setInterval(intervalFunction, 200);
// ===== Zero-termination mode rewriter =====
function rewriteZeroTerminationMode(code, zeroTerminated) {
	try {
		// 1) Update function arg comment
		code = code.replace(
			/\/\*\s*string\s*\((?:zero terminated|zero termination not required)\)\s*\*\//,
			zeroTerminated
				? "/* string (zero terminated) */"
				: "/* string (zero termination not required) */",
		);
                // 2) Toggle assert (preserve indentation and following line's tab)
                if (zeroTerminated) {
                        code = code.replace(
                                /\t\/\/\s*zero-termination not expected\s*\n\t\/\/\s*assert\(s\[n\]\s*==\s*'\\0'\);/m,
                                "\tassert(s[n] == '\\0');",
                        );
                } else {
                        code = code.replace(
                                /\tassert\(s\[n\]\s*==\s*'\\0'\);/m,
                                "\t// zero-termination not expected\n\t// assert(s[n] == '\\0');",
                        );
                }
                // 3) Switch return line
                if (zeroTerminated) {
                        code = code.replace(
                                /return\s*\(stringIndex\s*>=\s*0\s*&&\s*strncmp\(s,/m,
                                "return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;",
                        );
                } else {
                        code = code.replace(
                                /return\s*\(stringIndex\s*>=\s*0\s*&&\s*strcmp\(s,/m,
                                "return (stringIndex >= 0 && strncmp(s, STRINGS[stringIndex], n) == 0 && STRINGS[stringIndex][n] == 0) ? stringIndex : -1;",
                        );
                }
	} catch (_) {}
	return code;
}
// ===== Self tests =====
function runSelfTests() {
	var ok = 0,
		fail = 0,
		failures = [];
	function T(name, fn) {
		try {
			fn();
			ok++;
		} catch (e) {
			console.error("Test fail:", name, e);
			failures.push({ test: name, error: e && e.stack ? e.stack : String(e) });
			fail++;
		}
	}
	T("escape/parse roundtrip", function () {
		var s = "hej \n \"''\\ \x04 \u2414 \0 \r du";
		var esc = escapeCString(s);
		var back = parseCString(esc)[0];
		if (back !== s) throw new Error("roundtrip");
	});
	T("parse list", function () {
		var arr = parseQuickHashGenInput('a\nb\n"c d"');
		if (arr.length !== 3 || arr[2] !== "c d") throw new Error("bad parse");
	});
	T("parse from C", function () {
		var code = 'static const char* STRINGS[2] = { "aa", "bb" };';
		var arr = parseStringsFromEditor(code);
		if (arr.length !== 2 || arr[1] !== "bb") throw new Error("bad extract");
	});
	T("initializer range", function () {
		var code = "int x; static const int HASH_TABLE[4] = { 1, 2, 3, 4 };";
		var ds = code.indexOf("HASH_TABLE[");
		var r = findInitializerRange(code, ds);
		if (!r || code.slice(r.open, r.close + 1).indexOf("{") !== 0)
			throw new Error("range");
	});
	T("toggleRun exists", function () {
		if (typeof toggleRun !== "function") throw new Error("missing");
		if (typeof window.toggleRun !== "function") throw new Error("not global");
	});
	T("match HASH_TABLE brackets", function () {
                var line =
                        "int stringIndex = HASH_TABLE[((p[1] + n) & 31) ^ (9 < n ? p[9] : 0)];";
		var i = line.indexOf("[");
		var j = findMatchingSquare(line, i);
		if (j !== line.length - 2) throw new Error("mismatch " + j);
	});
	T("extract editor expr", function () {
                var code = "int stringIndex = HASH_TABLE[(n ^ p[0]) & 15];";
                var expr = extractEditorHashExpr(code);
                if (!expr || expr.indexOf("(n ^ p[0]) & 15") < 0)
                        throw new Error("extract failed: " + expr);
	});
	T("rewrite zero-term off/on", function () {
                var code0 =
                        "static int f(int n, const char* s /* string (zero terminated) */) {\n\tconst unsigned char* p = (const unsigned char*) s;\n\tassert(s[n] == '\\0');\n\tif (n < 2) return -1;\n\tint stringIndex = 0;\n\treturn (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;\n}";
		var off = rewriteZeroTerminationMode(code0, false);
		if (off.indexOf("zero termination not required") < 0)
			throw new Error("sig not switched");
		if (off.indexOf("strncmp(") < 0) throw new Error("return not switched");
		if (off.indexOf("\n\t// zero-termination not expected") < 0)
			throw new Error("assert not commented");
		if (off.indexOf("\n\tif (n < 2)") < 0)
			throw new Error("indent after assert lost");
		var on = rewriteZeroTerminationMode(off, true);
		if (on.indexOf("zero terminated") < 0) throw new Error("sig not restored");
		if (on.indexOf("strcmp(") < 0) throw new Error("return not restored");
                if (/\tassert\(s\[n\]\s*==\s*'\\0'\)/.test(on) === false)
                        throw new Error("assert not restored");
	});
	var msg =
		fail === 0
			? "All tests passed (" + ok + ")"
			: ok + " passed, " + fail + " failed";
	elements.testStatus.textContent = "Self-tests: " + msg + ".";
	if (fail > 0) {
		stopAndReport("Self-tests failed", { summary: msg, failures: failures });
	}
}
try {
	runSelfTests();
} catch (_) {}
