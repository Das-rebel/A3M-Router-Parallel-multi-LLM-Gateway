#!/bin/bash
#
# A3M Router — Sitemap Submission Script
# Submits sitemap to Google, Bing, and IndexNow for faster indexing
#
set -e

SITEMAP_URL="${SITEMAP_URL:-https://a3m-router.com/sitemap.xml}"
INDEXNOW_KEY="${INDEXNOW_KEY:-}"

echo "=== A3M Router Sitemap Submission ==="
echo "Sitemap: $SITEMAP_URL"
echo ""

# ─── Google ───────────────────────────────────────────
echo "[1/3] Submitting to Google..."
GOOGLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://www.google.com/ping?sitemap=$SITEMAP_URL")
if [ "$GOOGLE_STATUS" = "200" ]; then
  echo "  ✅ Google: OK (HTTP $GOOGLE_STATUS)"
else
  echo "  ⚠️  Google: HTTP $GOOGLE_STATUS"
fi

# ─── Bing ─────────────────────────────────────────────
echo "[2/3] Submitting to Bing..."
BING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://www.bing.com/ping?sitemap=$SITEMAP_URL")
if [ "$BING_STATUS" = "200" ]; then
  echo "  ✅ Bing: OK (HTTP $BING_STATUS)"
else
  echo "  ⚠️  Bing: HTTP $BING_STATUS"
fi

# ─── IndexNow ─────────────────────────────────────────
echo "[3/3] Submitting to IndexNow..."
if [ -z "$INDEXNOW_KEY" ]; then
  echo "  ⚠️  Skipped: INDEXNOW_KEY env var not set"
  echo "  To enable IndexNow: export INDEXNOW_KEY=your_key_from_indexnow.org"
else
  # Get the sitemap URLs and submit each to IndexNow
  curl -s "$SITEMAP_URL" | grep -oP '(?<=<loc>)[^<]+' | while read -r url; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
      "https://indexnow.org/ping" \
      -H "Content-Type: text/plain" \
      -d "url=$url&key=$INDEXNOW_KEY")
    echo "  IndexNow: $url → HTTP $RESPONSE"
  done
fi

echo ""
echo "=== Done ==="
