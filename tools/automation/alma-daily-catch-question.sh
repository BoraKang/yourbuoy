#!/bin/sh
set -eu

workspace="/root/.openclaw/workspaces/alma"
pending="$workspace/memory/daily-catch-pending.md"

# 답변을 기다리는 질문이 있으면 새 질문으로 덮어쓰지 않는다.
if [ -f "$pending" ]; then
  exit 0
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
