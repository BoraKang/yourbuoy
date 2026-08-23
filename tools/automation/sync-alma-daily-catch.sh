#!/bin/sh
set -eu

vault="/Users/riverpurple/Library/Mobile Documents/iCloud~md~obsidian/Documents/NickyObsidian"
destination="$vault/i. Raw/alma"
requested_date="${1:-$(date -v-1d '+%Y-%m-%d')}"

case "$requested_date" in
  ????-??-??) ;;
  *) echo "날짜는 YYYY-MM-DD 형식이어야 합니다." >&2; exit 2 ;;
esac

tmp="$(mktemp)"
body="$(mktemp)"
trap 'rm -f "$tmp" "$body"' EXIT

# Daily Catch 섹션만 가져온다. 다른 Alma 기억과 회고 본문은 동기화하지 않는다.
ssh -o BatchMode=yes -o ConnectTimeout=15 vps \
  "if test -f /root/.openclaw/workspaces/alma/memory/$requested_date.md; then awk '/^## Daily Catch[[:space:]]*$/{on=1} on && /^## / && !/^## Daily Catch[[:space:]]*$/{exit} on{print}' /root/.openclaw/workspaces/alma/memory/$requested_date.md; fi" \
  > "$body"

if ! grep -q '^## Daily Catch' "$body"; then
  exit 0
fi

mkdir -p "$destination"
{
  printf '%s\n' '---'
  printf 'date: %s\n' "$requested_date"
  printf '%s\n' 'source: Alma Daily Catch' 'private: true' '---' ''
  printf '# %s Daily Catch\n\n' "$requested_date"
  awk 'NR == 1 && /^## Daily Catch/ {next} {print}' "$body"
} > "$tmp"

mv "$tmp" "$destination/$requested_date Daily Catch.md"
trap 'rm -f "$body"' EXIT
