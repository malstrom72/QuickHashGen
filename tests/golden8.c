/* Built with QuickHashGen CLI */
// Seed: 19
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[10] = {
		"!!!", "!!@", "!@!", "@!!", "???", "??!", "?!?", "!??", "###", "##!"
	};
	static const int HASH_TABLE[32] = {
		-1, -1, -1, 0, 1, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
		-1, 9, 5, 6, 8, 3, 7, -1, -1, -1, -1, -1, -1, -1, -1, 4
	};
	const unsigned char* p = (const unsigned char*) s;
	if (n < 3 || n > 3) return -1;
	int stringIndex = HASH_TABLE[((0u + ((0u + (p[3] + (p[0] ^ 37u) * p[2]) * ((p[1] ^ n) - ((0u + n) << 14))) << 18 ^ 20u)) >> 25) & 31u];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
