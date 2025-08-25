set -e

tmpdir="$(mktemp -d)"
trap "rm -rf '$tmpdir'" EXIT

while true
do
	node QuickHashGenTest.node.js >"$tmpdir/test.cpp"
	g++ -o "$tmpdir/test" "$tmpdir/test.cpp"
	"$tmpdir/test"
done
