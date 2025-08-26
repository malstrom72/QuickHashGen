/* Built with QuickHashGen CLI */
static int lookup(int n /* string length */, const char* s /* string (zero terminated) */) {
	static const char* STRINGS[100] = {
		"item000", "item001", "item002", "item003", "item004", "item005", "item006", 
		"item007", "item008", "item009", "item010", "item011", "item012", "item013", 
		"item014", "item015", "item016", "item017", "item018", "item019", "item020", 
		"item021", "item022", "item023", "item024", "item025", "item026", "item027", 
		"item028", "item029", "item030", "item031", "item032", "item033", "item034", 
		"item035", "item036", "item037", "item038", "item039", "item040", "item041", 
		"item042", "item043", "item044", "item045", "item046", "item047", "item048", 
		"item049", "item050", "item051", "item052", "item053", "item054", "item055", 
		"item056", "item057", "item058", "item059", "item060", "item061", "item062", 
		"item063", "item064", "item065", "item066", "item067", "item068", "item069", 
		"item070", "item071", "item072", "item073", "item074", "item075", "item076", 
		"item077", "item078", "item079", "item080", "item081", "item082", "item083", 
		"item084", "item085", "item086", "item087", "item088", "item089", "item090", 
		"item091", "item092", "item093", "item094", "item095", "item096", "item097", 
		"item098", "item099"
	};
	static const int HASH_TABLE[128] = {
		75, 69, 60, 54, 48, -1, 33, 27, -1, 12, 6, 98, -1, 83, 77, -1, 
		62, 56, -1, 41, 35, 29, 20, 14, 8, -1, 91, 85, 79, 70, 64, 58, 
		-1, 43, 37, -1, 22, 16, -1, 1, 93, 87, -1, 72, 66, -1, 51, 45, 
		39, 30, 24, 18, -1, 3, 95, 89, 80, 74, 68, -1, 53, 47, -1, 32, 
		26, -1, 11, 5, 97, -1, 82, 76, -1, 61, 55, 49, 40, 34, 28, -1, 
		13, 7, 99, 90, 84, 78, -1, 63, 57, -1, 42, 36, -1, 21, 15, 9, 
		0, 92, 86, -1, 71, 65, 59, 50, 44, 38, -1, 23, 17, -1, 2, 94, 
		88, -1, 73, 67, -1, 52, 46, -1, 31, 25, 19, 10, 4, 96, -1, 81
	};
	if (n < 7 || n > 7) return -1;
	int stringIndex = HASH_TABLE[(s[2] * (s[6] * 187 - s[5])) & 127];
	return (stringIndex >= 0 && strcmp(s, STRINGS[stringIndex]) == 0) ? stringIndex : -1;
}
