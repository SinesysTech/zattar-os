#!/usr/bin/env bash
# update-imports.sh — Rewrite @/features/<name> import paths across the codebase
# Usage: ./scripts/update-imports.sh <feature-name> <new-import-path>
# Example: ./scripts/update-imports.sh partes @/app/app/partes/_feature

set -euo pipefail

# ─── Args ────────────────────────────────────────────────────────────────────

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <feature-name> <new-import-path>" >&2
  echo "  feature-name     — e.g. partes" >&2
  echo "  new-import-path  — e.g. @/app/app/partes/_feature" >&2
  exit 1
fi

FEATURE="$1"
NEW_PATH="$2"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/src"

OLD_PATH="@/features/$FEATURE"

echo "=== update-imports: $FEATURE ==="
echo "  old : $OLD_PATH"
echo "  new : $NEW_PATH"
echo ""

# ─── Find affected files ──────────────────────────────────────────────────────

# Collect all .ts / .tsx files that reference the old path
# Use a temp file to avoid subshell / bash 3 mapfile limitations
TMPFILE="$(mktemp)"
grep -rl --include="*.ts" --include="*.tsx" \
     -e "$OLD_PATH" \
     "$SRC_DIR" \
     2>/dev/null > "$TMPFILE" || true

FILE_COUNT=$(wc -l < "$TMPFILE" | tr -d ' ')

if [[ $FILE_COUNT -eq 0 ]]; then
  rm -f "$TMPFILE"
  echo "  No files reference '$OLD_PATH' — nothing to do."
  echo ""
  echo "=== Done === (0 files updated)"
  exit 0
fi

echo "  Found $FILE_COUNT file(s) with references to update:"
while IFS= read -r f; do
  echo "    ${f#"$REPO_ROOT/"}"
done < "$TMPFILE"
echo ""

# ─── Rewrite imports ─────────────────────────────────────────────────────────

# Escape special characters for use in sed patterns
escape_sed() {
  printf '%s' "$1" | sed 's/[\/&@]/\\&/g'
}

OLD_ESCAPED="$(escape_sed "$OLD_PATH")"
NEW_ESCAPED="$(escape_sed "$NEW_PATH")"

UPDATED_COUNT=0

while IFS= read -r f; do
  # macOS sed requires '' after -i (no backup extension)
  sed -i '' "s/${OLD_ESCAPED}/${NEW_ESCAPED}/g" "$f"
  (( UPDATED_COUNT++ )) || true
done < "$TMPFILE"

rm -f "$TMPFILE"

echo "  Rewrote imports in $UPDATED_COUNT file(s)."
echo ""

# ─── Verify no references remain ─────────────────────────────────────────────

REMAINING=$(
  grep -rl --include="*.ts" --include="*.tsx" \
       -e "$OLD_PATH" \
       "$SRC_DIR" \
       2>/dev/null | wc -l | tr -d ' '
)

if [[ "$REMAINING" -gt 0 ]]; then
  echo "  WARNING: $REMAINING file(s) still contain '$OLD_PATH' — check for dynamic or split strings:"
  grep -rl --include="*.ts" --include="*.tsx" \
       -e "$OLD_PATH" \
       "$SRC_DIR" 2>/dev/null | while read -r f; do
    echo "    ${f#"$REPO_ROOT/"}"
  done
  echo ""
  echo "=== Done with warnings === ($UPDATED_COUNT files updated, $REMAINING remaining)"
  exit 2
fi

echo "  Verified: no remaining references to '$OLD_PATH'."
echo ""
echo "=== Done === ($UPDATED_COUNT files updated)"
exit 0
