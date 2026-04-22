#!/usr/bin/env bash
# verify-determinism.sh — compares 3 subagent outputs on the same RED scenario.
# Usage: ./verify-determinism.sh run1.txt run2.txt run3.txt
# Exit 0 if classifications + decisions converge; non-zero otherwise.
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "usage: $0 run1.txt run2.txt run3.txt" >&2
  exit 2
fi

s1=$(grep -m1 '^SHAPE:' "$1" | awk -F': ' '{print $2}' || echo "")
s2=$(grep -m1 '^SHAPE:' "$2" | awk -F': ' '{print $2}' || echo "")
s3=$(grep -m1 '^SHAPE:' "$3" | awk -F': ' '{print $2}' || echo "")

if [ "$s1" != "$s2" ] || [ "$s2" != "$s3" ]; then
  echo "FAIL: shape classifications diverge: [$s1] [$s2] [$s3]" >&2
  exit 1
fi

c1=$(grep -m1 '^CANON:' "$1" | awk -F': ' '{print $2}' || echo "")
c2=$(grep -m1 '^CANON:' "$2" | awk -F': ' '{print $2}' || echo "")
c3=$(grep -m1 '^CANON:' "$3" | awk -F': ' '{print $2}' || echo "")

if [ "$c1" != "$c2" ] || [ "$c2" != "$c3" ]; then
  echo "FAIL: canon paths diverge: [$c1] [$c2] [$c3]" >&2
  exit 1
fi

awk '/^DECISIONS_START$/,/^DECISIONS_END$/' "$1" | sort > /tmp/.zg_d1
awk '/^DECISIONS_START$/,/^DECISIONS_END$/' "$2" | sort > /tmp/.zg_d2
awk '/^DECISIONS_START$/,/^DECISIONS_END$/' "$3" | sort > /tmp/.zg_d3

if ! diff -q /tmp/.zg_d1 /tmp/.zg_d2 > /dev/null || ! diff -q /tmp/.zg_d2 /tmp/.zg_d3 > /dev/null; then
  echo "FAIL: decision sets diverge. Diffs:" >&2
  diff /tmp/.zg_d1 /tmp/.zg_d2 || true
  diff /tmp/.zg_d2 /tmp/.zg_d3 || true
  exit 1
fi

echo "PASS: shape=[$s1] canon=[$c1] decisions converge across 3 runs"
exit 0
