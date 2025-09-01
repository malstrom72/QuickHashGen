/* Built with QuickHashGen CLI */
// Seed: 13
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[20] = {
		"baaaa", "abaaa", "aabaa", "aaaba", "aaaab", "caaaa", "acaaa", "aacaa", 
		"aaaca", "aaaac", "daaaa", "adaaa", "aadaa", "aaada", "aaaad", "eaaaa", 
		"aeaaa", "aaeaa", "aaaea", "aaaae"
	};
	static const int HASH_TABLE[128] = {
		13, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
		10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 6, -1, -1, -1, -1, 
		-1, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 18, 1, -1, 
		-1, -1, 4, 9, 14, 19, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 
		-1, 12, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 15, -1, -1, 
		-1, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, 5, -1, -1, 3, -1, 
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 16, 0, -1, 
		11, 17, -1, -1, -1, -1, -1, -1, -1, -1, -1, 8, -1, -1, -1, -1
	};
	const unsigned char* p = (const unsigned char*) s;
	if (n < 5 || n > 5) return -1;
	int stringIndex = HASH_TABLE[(p[0] * (30u + 23u) ^ p[4] ^ (p[3] * 53u ^ (0u + (114u ^ n)) << 15) * ((0u + p[2]) << 4 ^ p[1])) & 127u];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
