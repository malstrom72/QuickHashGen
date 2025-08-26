/* Built with QuickHashGen CLI */
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[10] = {
		"abc123450xyz", "abc123451xyz", "abc123452xyz", "abc123453xyz", "abc123454xyz", 
		"abc123455xyz", "abc123456xyz", "abc123457xyz", "abc123458xyz", "abc123459xyz"
	};
	static const int HASH_TABLE[16] = {
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, -1, -1, -1, -1
	};
	if (n < 12 || n > 12) return -1;
	int stringIndex = HASH_TABLE[(s[8]) & 15];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
