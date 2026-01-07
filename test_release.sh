#!/bin/bash
# Quick Battle Test - Automated checks

echo "🧪 RetailManager Battle Test Runner"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAIL_COUNT++))
    fi
}

echo "📋 Running automated checks..."
echo ""

# Test 1: Check if executable exists
echo "Test 1: Executable exists"
if [ -f "./build/bin/RetailManager" ]; then
    test_result 0 "Executable found at build/bin/RetailManager"
else
    test_result 1 "Executable not found!"
fi

# Test 2: Check version constant in code
echo ""
echo "Test 2: Version constant in app.go"
if grep -q 'const AppVersion = "1.1.0"' app.go; then
    test_result 0 "Version constant is 1.1.0"
else
    test_result 1 "Version constant not found or incorrect"
fi

# Test 3: Check wails.json has product info
echo ""
echo "Test 3: Windows metadata in wails.json"
if grep -q '"productVersion": "1.1.0"' wails.json; then
    test_result 0 "Product version set in wails.json"
else
    test_result 1 "Product version not set"
fi

# Test 4: Check frontend package.json version
echo ""
echo "Test 4: Frontend package version"
if grep -q '"version": "1.1.0"' frontend/package.json; then
    test_result 0 "Frontend version is 1.1.0"
else
    test_result 1 "Frontend version not updated"
fi

# Test 5: Check for debug statements
echo ""
echo "Test 5: No debug statements"
if grep -q 'fmt.Println.*Database path' backend/database/database.go; then
    test_result 1 "Debug println still in database.go"
else
    test_result 0 "No debug statements found"
fi

# Test 6: Check CHANGELOG exists
echo ""
echo "Test 6: CHANGELOG.md exists"
if [ -f "CHANGELOG.md" ]; then
    test_result 0 "CHANGELOG.md found"
else
    test_result 1 "CHANGELOG.md missing"
fi

# Test 7: Check French error messages exist
echo ""
echo "Test 7: French error messages in code"
if grep -q "un produit avec la référence" backend/inventory/service.go; then
    test_result 0 "French error messages found in inventory"
else
    test_result 1 "French error messages missing"
fi

# Test 8: Check delete protection exists
echo ""
echo "Test 8: Delete protection implemented"
if grep -q "impossible de supprimer ce produit" backend/inventory/service.go; then
    test_result 0 "Product delete protection found"
else
    test_result 1 "Delete protection missing"
fi

# Test 9: Check icon files exist
echo ""
echo "Test 9: Icon files present"
if [ -f "build/windows/icon.ico" ] && [ -f "build/appicon.png" ]; then
    test_result 0 "Icon files found"
else
    test_result 1 "Icon files missing"
fi

# Test 10: Check GetVersion function exists
echo ""
echo "Test 10: GetVersion function in app.go"
if grep -q 'func.*GetVersion.*string' app.go; then
    test_result 0 "GetVersion function found"
else
    test_result 1 "GetVersion function missing"
fi

echo ""
echo "=================================="
echo "📊 Automated Test Results"
echo "=================================="
echo -e "PASS: ${GREEN}$PASS_COUNT${NC}"
echo -e "FAIL: ${RED}$FAIL_COUNT${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
PASS_RATE=$((PASS_COUNT * 100 / TOTAL))
echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All automated checks passed!${NC}"
    echo ""
    echo "📝 Next: Run manual tests from BATTLE_TEST.md"
    echo "   Open the app and work through the checklist"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix before releasing.${NC}"
    exit 1
fi
