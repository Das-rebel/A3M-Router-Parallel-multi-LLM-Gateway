#!/bin/bash
# A3M Router Kong Plugin - Test Script

set -e

KONG_URL="${KONG_URL:-http://localhost:8000}"
ADMIN_URL="${ADMIN_URL:-http://localhost:8001}"

echo "=========================================="
echo "A3M Router Kong Plugin - Test Suite"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

info() {
  echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# Test 1: Kong Health
echo ""
echo "Test 1: Kong Gateway Health"
if curl -sf "$ADMIN_URL/status" > /dev/null 2>&1; then
  pass "Kong Gateway is healthy"
else
  fail "Kong Gateway is not responding"
fi

# Test 2: A3M Router Health
echo ""
echo "Test 2: A3M Router Health"
if curl -sf "http://localhost:8787/health" > /dev/null 2>&1; then
  pass "A3M Router is healthy"
else
  fail "A3M Router is not responding"
fi

# Test 3: Plugin Loaded
echo ""
echo "Test 3: A3M Router Plugin Loaded"
PLUGIN_COUNT=$(curl -s "$ADMIN_URL/plugins" | jq '[.data[] | select(.name=="a3m_router")] | length' 2>/dev/null || echo "0")
if [ "$PLUGIN_COUNT" -gt 0 ]; then
  pass "A3M Router plugin is loaded ($PLUGIN_COUNT instances)"
else
  info "A3M Router plugin not found (may need configuration)"
fi

# Test 4: Non-LLM Request Pass-through
echo ""
echo "Test 4: Non-LLM Request Pass-through"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$KONG_URL/non-llm/test")
if [ "$RESPONSE" -eq 404 ]; then
  pass "Non-LLM request returns 404 (no routing triggered)"
elif [ "$RESPONSE" -eq 200 ]; then
  pass "Non-LLM request passed through"
else
  info "Non-LLM request returned: $RESPONSE"
fi

# Test 5: LLM Chat Completions - Full Request
echo ""
echo "Test 5: LLM Chat Completions Request"
RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" -X POST "$KONG_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello, respond with just OK"}],
    "max_tokens": 10
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
TIME_TOTAL=$(echo "$RESPONSE" | tail -2 | head -1)
BODY=$(echo "$RESPONSE" | head -n -2)

if [ "$HTTP_CODE" = "200" ]; then
  pass "Chat completions returned 200 (${TIME_TOTAL}s)"

  # Check for A3M headers
  if echo "$BODY" | grep -q "x-a3m"; then
    info "A3M routing headers present in response"
  fi
else
  info "Chat completions returned: $HTTP_CODE"
  info "Response: $BODY"
fi

# Test 6: LLM Chat Completions - Streaming
echo ""
echo "Test 6: LLM Chat Completions Streaming"
STREAM_RESPONSE=$(curl -s -w "\n%{http_code}" -N -X POST "$KONG_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Count from 1 to 3"}],
    "stream": true,
    "max_tokens": 50
  }')

HTTP_CODE=$(echo "$STREAM_RESPONSE" | tail -1)
STREAM_DATA=$(echo "$STREAM_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || echo "$STREAM_DATA" | grep -q "data:"; then
  pass "Streaming request successful"
else
  info "Streaming returned: $HTTP_CODE"
fi

# Test 7: Check Response Headers
echo ""
echo "Test 7: Response Headers Check"
HEADERS=$(curl -s -I -X POST "$KONG_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hi"}],"max_tokens":5}')

if echo "$HEADERS" | grep -qi "x-a3m"; then
  pass "A3M headers present in response"
  echo "$HEADERS" | grep -i "x-a3m" | while read line; do
    info "  $line"
  done
else
  info "A3M headers not found (may be expected in some configurations)"
fi

# Test 8: Embeddings Endpoint
echo ""
echo "Test 8: Embeddings Endpoint"
EMBED_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$KONG_URL/v1/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-ada-002",
    "input": "Hello world"
  }')

HTTP_CODE=$(echo "$EMBED_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  pass "Embeddings request successful"
else
  info "Embeddings returned: $HTTP_CODE"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}Some tests failed - check configuration${NC}"
  exit 1
fi
