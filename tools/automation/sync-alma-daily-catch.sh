#!/bin/sh
set -eu

vault="/Users/riverpurple/Library/Mobile Documents/iCloud~md~obsidian/Documents/NickyObsidian"
destination="$vault/i. Raw/alma"
requested_date="${1:-}"

case "$requested_date" in
  "") ;;
  [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]) ;;
  *) echo "날짜는 YYYY-MM-DD 형식이어야 합니다." >&2; exit 2 ;;
esac

sync_one() {
  catch_date="$1"
  remote_body="$(mktemp)"
  managed="$(mktemp)"
  output="$(mktemp)"
  preserved="$(mktemp)"
  target="$destination/$catch_date Daily Catch.md"
  backup="$target.pre-managed"
  trap 'rm -f "$remote_body" "$managed" "$output" "$preserved"' EXIT HUP INT TERM

  ssh -o BatchMode=yes -o ConnectTimeout=15 vps \
    "if test -f /root/.openclaw/workspaces/alma/memory/$catch_date.md; then awk '/^## Daily Catch[[:space:]]*$/{on=1} on && /^## / && !/^## Daily Catch[[:space:]]*$/{exit} on{print}' /root/.openclaw/workspaces/alma/memory/$catch_date.md; fi" \
    > "$remote_body"

  if ! grep -q '^## Daily Catch' "$remote_body"; then
    rm -f "$remote_body" "$managed" "$output" "$preserved"
    trap - EXIT HUP INT TERM
    return 0
  fi

  mkdir -p "$destination"
  {
    printf '%s\n' '<!-- ALMA DAILY CATCH START: 자동 동기화 영역, 직접 수정하지 않음 -->'
    awk 'NR == 1 && /^## Daily Catch/ {next} {print}' "$remote_body"
    printf '%s\n' '<!-- ALMA DAILY CATCH END -->'
  } > "$managed"

  if [ ! -f "$target" ]; then
    {
      printf '%s\n' '---'
      printf 'date: %s\n' "$catch_date"
      printf '%s\n' 'source: Alma Daily Catch' 'private: true' '---' ''
      printf '# %s Daily Catch\n\n' "$catch_date"
      cat "$managed"
      printf '%s\n' '' '## 내 메모' ''
    } > "$output"
  elif grep -q '^<!-- ALMA DAILY CATCH START:' "$target"; then
    awk '
      FNR == NR { block = block $0 ORS; next }
      /^<!-- ALMA DAILY CATCH START:/ { printf "%s", block; skipping = 1; next }
      skipping && /^<!-- ALMA DAILY CATCH END -->$/ { skipping = 0; next }
      !skipping { print }
    ' "$managed" "$target" > "$output"
  else
    if [ ! -f "$backup" ]; then
      cp -p "$target" "$backup"
    fi
    awk '/^## 내 메모[[:space:]]*$/{keep=1} keep{print}' "$target" > "$preserved"
    {
      printf '%s\n' '---'
      printf 'date: %s\n' "$catch_date"
      printf '%s\n' 'source: Alma Daily Catch' 'private: true' '---' ''
      printf '# %s Daily Catch\n\n' "$catch_date"
      cat "$managed"
      if [ -s "$preserved" ]; then
        printf '\n'
        cat "$preserved"
      else
        printf '%s\n' '' '## 내 메모' ''
      fi
    } > "$output"
  fi

  mv "$output" "$target"
  rm -f "$remote_body" "$managed" "$preserved"
  trap - EXIT HUP INT TERM
}

if [ -n "$requested_date" ]; then
  sync_one "$requested_date"
else
  # 자정 이후 답변과 Mac 미실행을 회수하기 위해 오늘부터 최근 3일을 백필한다.
  sync_one "$(date '+%Y-%m-%d')"
  sync_one "$(date -v-1d '+%Y-%m-%d')"
  sync_one "$(date -v-2d '+%Y-%m-%d')"
fi
