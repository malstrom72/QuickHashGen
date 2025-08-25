set -e

while true
do
	./NuXJS QuickHashMakerTest.js >test.cpp
	g++ -otest test.cpp
	./test
done
