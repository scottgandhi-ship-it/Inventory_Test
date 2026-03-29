#!/bin/bash
# Check for console.log statements in JS files and index.html
REPO_ROOT="$(git rev-parse --show-toplevel)"
FOUND=0

for file in "$REPO_ROOT"/js/*.js "$REPO_ROOT"/index.html; do
  if [ -f "$file" ]; then
    MATCHES=$(grep -n "console\.log" "$file" 2>/dev/null)
    if [ -n "$MATCHES" ]; then
      echo "WARNING: console.log found in $(basename "$file"):"
      echo "$MATCHES"
      FOUND=1
    fi
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "OK: No console.log statements found"
fi
