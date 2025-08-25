set -e

while true
do
	node QuickHashMakerTest.node.js >test.cpp
	g++ -otest test.cpp
	./test
done
