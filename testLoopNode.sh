set -e

while true
do
	node QuickHashGenTest.node.js >test.cpp
	g++ -otest test.cpp
	./test
done
