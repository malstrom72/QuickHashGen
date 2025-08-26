/* Built with QuickHashGen CLI */
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[20] = {
		"baaaa", "abaaa", "aabaa", "aaaba", "aaaab", "caaaa", "acaaa", "aacaa", 
		"aaaca", "aaaac", "daaaa", "adaaa", "aadaa", "aaada", "aaaad", "eaaaa", 
		"aeaaa", "aaeaa", "aaaea", "aaaae"
	};
	static const int HASH_TABLE[128] = {
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 14, -1, -1, 
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, -1, -1, 
		-1, -1, -1, -1, -1, -1, -1, -1, 19, -1, -1, -1, 17, -1, -1, -1, 
		-1, -1, -1, -1, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
		18, -1, -1, 1, -1, -1, -1, -1, -1, -1, 6, -1, 0, -1, -1, -1, 
		-1, 11, -1, -1, -1, -1, -1, 4, 16, -1, -1, -1, 5, -1, -1, 13, 
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 10, -1, -1, -1, 
		12, -1, 9, -1, -1, -1, -1, -1, 2, -1, -1, -1, 15, -1, 8, -1
	};
	if (n < 5 || n > 5) return -1;
	int stringIndex = HASH_TABLE[(((s[0] - n << 4) - (52 - s[1]) * 199 * s[4] - s[3]) * s[2]) & 127];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
