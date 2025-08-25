set -e

while true
do
	./NuXJS QuickHashGenTest.js >test.cpp
	g++ -otest test.cpp
	./test
done
