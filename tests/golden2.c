/* Built with QuickHashGen CLI */
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[4] = {
		"black", "white", "blue", "yellow"
	};
	static const int HASH_TABLE[16] = {
		-1, 0, -1, -1, -1, 2, -1, -1, -1, 1, -1, -1, 3, -1, -1, -1
	};
	if (n < 4 || n > 6) return -1;
	int stringIndex = HASH_TABLE[(s[2]) & 15];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
