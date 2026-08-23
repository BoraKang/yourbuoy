# Daily Catch (저녁 채집 루프)

Daily Catch는 글감 생산이나 회고가 아니라 그날 실제 경험과 사용자의 표현을
잃지 않도록 보존하는 별도 루프다.

## 실제 데이터 흐름

```
21:30 Telegram 질문
  → Alma VPS memory/YYYY-MM-DD.md의 `## Daily Catch` (비공개 정본)
  → Mac이 오늘부터 최근 3일을 확인
  → Obsidian i. Raw/alma/YYYY-MM-DD Daily Catch.md (동기화본)
  → 일요일 Codex 주간 씨앗 선별
  → 사용자 선택
  → Notion yourBuoy Blog Pipeline의 씨앗
```

`_meta/daily-catch.md`는 사용하지 않는 레거시 자리표시자다. Daily Catch
전체가 자동으로 씨앗이 되지 않으며, 사용자가 고른 후보만 Notion에 들어간다.

## 질문 규칙

- 매일 거의 같은 첫 질문을 한 번 보낸다.
- 답변이 구체적이면 추가 질문 없이 종료한다.
- 장면이나 맥락이 부족할 때만 후속 질문을 최대 1개 한다.
- 답하지 않아도 된다. 24시간이 지난 pending은 만료하고 다음 질문을 보낸다.
- 교훈·배운 점·해결책을 요구하거나 글감이 되도록 유도하지 않는다.

## 동기화 형식

```markdown
---
date: YYYY-MM-DD
source: Alma Daily Catch
private: true
---

# YYYY-MM-DD Daily Catch

<!-- ALMA DAILY CATCH START: 자동 동기화 영역, 직접 수정하지 않음 -->
### Nicky 원문
사용자가 실제로 한 말

### Alma Note
있을 때만 Alma의 관찰. 사용자 발언으로 취급하지 않음
<!-- ALMA DAILY CATCH END -->

## 내 메모
사용자가 Obsidian에서 덧붙이는 영역
```

동기화는 자동 영역만 교체하고 `## 내 메모`를 보존한다. 예전 형식의 파일을
처음 변환할 때는 같은 위치에 `.pre-managed` 백업을 한 번 남긴다.

## 오염 방지

사례 충분 판정에는 `Nicky 원문`만 사용한다. `Alma Note`는 사용자의 생각,
감정, 판단이 아니다. 민감한 사적 내용과 원문 전체는 Notion에 복제하지 않는다.
