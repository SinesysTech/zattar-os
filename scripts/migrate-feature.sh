#!/usr/bin/env bash
# migrate-feature.sh — Move a feature module to a new destination with merge logic
# Usage: ./scripts/migrate-feature.sh <feature-name> <destination-path>
# Example: ./scripts/migrate-feature.sh partes src/app/app/partes/_feature

set -euo pipefail

# ─── Args ────────────────────────────────────────────────────────────────────

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <feature-name> <destination-path>" >&2
  echo "  feature-name     — name under src/features/ (e.g. partes)" >&2
  echo "  destination-path — target directory (created if it does not exist)" >&2
  exit 1
fi

FEATURE="$1"
DEST="$2"

# Resolve to absolute paths from the repo root (cwd when the script is run)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/src/features/$FEATURE"

# Resolve DEST: if relative, resolve from the current working directory (not REPO_ROOT)
# macOS does not ship realpath -m, so we handle it manually
if [[ "$DEST" = /* ]]; then
  : # already absolute — use as-is
else
  DEST="$(pwd)/$DEST"
fi

# ─── Validation ──────────────────────────────────────────────────────────────

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: Source directory does not exist: $SRC" >&2
  exit 1
fi

echo "=== migrate-feature: $FEATURE ==="
echo "  src  : $SRC"
echo "  dest : $DEST"
echo ""

# ─── Helpers ─────────────────────────────────────────────────────────────────

COLLISION_COUNT=0
MOVED_COUNT=0

# Move a single file; report collisions instead of overwriting
move_file() {
  local src_file="$1"
  local dest_file="$2"

  if [[ -e "$dest_file" ]]; then
    echo "  COLLISION — skipped (manual review needed):"
    echo "    src : $src_file"
    echo "    dest: $dest_file"
    (( COLLISION_COUNT++ )) || true
    return
  fi

  local dest_dir
  dest_dir="$(dirname "$dest_file")"
  mkdir -p "$dest_dir"
  mv "$src_file" "$dest_file"
  (( MOVED_COUNT++ )) || true
}

# Recursively merge src_dir into dest_dir, file by file
merge_dir() {
  local src_dir="$1"
  local dest_dir="$2"

  # Walk every file under src_dir
  while IFS= read -r -d '' src_file; do
    local rel="${src_file#"$src_dir/"}"
    local dest_file="$dest_dir/$rel"
    move_file "$src_file" "$dest_file"
  done < <(find "$src_dir" -type f -print0)

  # Clean up empty subdirectories left in src_dir
  find "$src_dir" -type d -empty -delete 2>/dev/null || true
}

# ─── Main logic ──────────────────────────────────────────────────────────────

mkdir -p "$DEST"

# Iterate over top-level entries in the source feature directory
while IFS= read -r -d '' src_entry; do
  name="$(basename "$src_entry")"
  dest_entry="$DEST/$name"

  if [[ -f "$src_entry" ]]; then
    # Plain file — move with collision check
    move_file "$src_entry" "$dest_entry"

  elif [[ -d "$src_entry" ]]; then
    if [[ -d "$dest_entry" ]]; then
      # Both sides have the same directory — merge contents
      echo "  MERGE dir: $name/"
      merge_dir "$src_entry" "$dest_entry"
    else
      # Destination directory does not exist — move the whole thing
      mkdir -p "$(dirname "$dest_entry")"
      mv "$src_entry" "$dest_entry"
      echo "  MOVED dir: $name/"
      # Count files inside for the report
      file_count=$(find "$dest_entry" -type f | wc -l | tr -d ' ')
      (( MOVED_COUNT += file_count )) || true
    fi
  fi
done < <(find "$SRC" -maxdepth 1 -mindepth 1 -print0)

# ─── Cleanup ─────────────────────────────────────────────────────────────────

# Remove source if now empty
if [[ -d "$SRC" ]]; then
  remaining=$(find "$SRC" -type f | wc -l | tr -d ' ')
  if [[ "$remaining" -eq 0 ]]; then
    rm -rf "$SRC"
    echo "  REMOVED empty source: $SRC"
  else
    echo "  WARNING: $remaining file(s) remain in $SRC (collisions or errors — review manually)"
  fi
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo "=== Done ==="
echo "  Files moved    : $MOVED_COUNT"
echo "  Collisions     : $COLLISION_COUNT"

if [[ $COLLISION_COUNT -gt 0 ]]; then
  echo ""
  echo "  ACTION REQUIRED: $COLLISION_COUNT collision(s) were skipped."
  echo "  Manually merge the files listed above, then remove the source remnants."
  exit 2
fi

exit 0
