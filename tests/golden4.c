/* Built with QuickHashGen CLI */
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[5] = {
		"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 
		"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxy", 
		"yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", 
		"abcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyzabcxyz", 
		"01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567"
	};
	static const int HASH_TABLE[8] = {
		0, 4, 2, 3, -1, -1, -1, 1
	};
	const unsigned char* p = (const unsigned char*) s;
	if (n < 128 || n > 240) return -1;
	int stringIndex = HASH_TABLE[(((0u + 28u * 45u) << 1) - (p[127] ^ p[16]) - p[73] - (n - 11u * (p[87] + n))) & 7u];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
