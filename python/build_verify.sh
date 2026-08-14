#!/bin/bash
# Build and verify Python SDK
set -e

echo "=== Building A3M Router Python SDK v2.2.0 ==="
cd "$(dirname "$0")"

echo "1. Installing build dependencies..."
pip install build twine 2>/dev/null || pip3 install build twine

echo "2. Cleaning old builds..."
rm -rf dist/ build/ *.egg-info

echo "3. Building package..."
python -m build

echo "4. Checking package..."
python -m twine check dist/*

echo "5. Listing built files..."
ls -lh dist/

echo ""
echo "=== Build complete! ==="
echo "To publish to Test PyPI:"
echo "  cd python && python -m twine upload --repository testpypi dist/*"
echo ""
echo "To publish to PyPI:"
echo "  cd python && python -m twine upload dist/*"
echo ""
echo "To install locally:"
echo "  pip install dist/a3m_router-*.whl"
