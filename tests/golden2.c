/* Built with QuickHashGen CLI */
// Seed: 123
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[4] = {
		"black", "white", "blue", "yellow"
	};
	static const int HASH_TABLE[16] = {
		-1, 0, -1, -1, -1, 2, -1, -1, -1, 1, -1, -1, 3, -1, -1, -1
	};
	const unsigned char* p = (const unsigned char*) s;
	if (n < 4 || n > 6) return -1;
	int stringIndex = HASH_TABLE[(p[2]) & 15u];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
