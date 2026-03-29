#!/bin/bash
# Basic HTML tag matching check
REPO_ROOT="$(git rev-parse --show-toplevel)"
FILE="$REPO_ROOT/index.html"

if [ ! -f "$FILE" ]; then
  echo "OK: No index.html to check"
  exit 0
fi

# Check for common HTML issues
ISSUES=0

# Check for unclosed script tags
OPEN_SCRIPTS=$(grep -c "<script" "$FILE")
CLOSE_SCRIPTS=$(grep -c "</script>" "$FILE")
if [ "$OPEN_SCRIPTS" -ne "$CLOSE_SCRIPTS" ]; then
  echo "WARNING: Mismatched script tags (open: $OPEN_SCRIPTS, close: $CLOSE_SCRIPTS)"
  ISSUES=1
fi

# Check for unclosed style tags
OPEN_STYLES=$(grep -c "<style" "$FILE")
CLOSE_STYLES=$(grep -c "</style>" "$FILE")
if [ "$OPEN_STYLES" -ne "$CLOSE_STYLES" ]; then
  echo "WARNING: Mismatched style tags (open: $OPEN_STYLES, close: $CLOSE_STYLES)"
  ISSUES=1
fi

if [ $ISSUES -eq 0 ]; then
  echo "OK: HTML syntax check passed"
fi
