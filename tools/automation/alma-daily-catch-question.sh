#!/bin/sh
set -eu

workspace="/root/.openclaw/workspaces/alma"
pending="$workspace/memory/daily-catch-pending.md"

# 24시간 안에 보낸 질문은 기다린다. 답하지 않은 날 때문에 다음 질문이
# 영구 중단되지 않도록 오래된 대기는 만료한다.
if [ -f "$pending" ]; then
  now_epoch="$(date '+%s')"
  pending_epoch="$(stat -c '%Y' "$pending" 2>/dev/null || stat -f '%m' "$pending")"
  pending_age="$((now_epoch - pending_epoch))"

  if [ "$pending_age" -lt 86400 ]; then
    exit 0
  fi

  rm -f "$pending"
fi

sent_at="$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M')"

openclaw message send \
  --channel telegram \
  --account alma \
  --target 1542524536 \
  -m "오늘 뭐 있었어? 기억에 남는 일, 예상과 달랐던 일, 짜증났던 일, 새로 해본 일 중 아무거나 이야기해줘."

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
printf '# Daily Catch 대기 중\n질문 보낸 시각: %s (Asia/Seoul)\n아직 답변 없음\n' "$sent_at" > "$tmp"
mv "$tmp" "$pending"
trap - EXIT
