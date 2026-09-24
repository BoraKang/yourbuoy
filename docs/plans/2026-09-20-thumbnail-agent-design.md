# 썸네일 자동 생성 설계

## 배경

yourBuoy 글 발행 시 히어로 이미지(`hero_image`, 1.9:1)를 매번 수동으로 만들어왔다.
`yourbuoy-writing` 스킬의 발행 게이트는 `hero_image` 값 존재만 검사할 뿐 생성 방법은
다루지 않는다. WORK.md에는 "Pillow 스크립트 + 브랜드 색 3종 로테이션 + 플랫 오브젝트"
방식이 확정 항목으로 적혀 있었으나, 실제로 지금까지 올라간 썸네일(`assets/images/thumbnail/`)을
확인한 결과 실물은 그것과 다르다: **비비드하고 다양한 단색 배경 + 글 내용과 관련된 장면을
연출하는 플랫 벡터 인물 일러스트**. WORK.md 항목은 이 설계로 대체한다.

## 범위

- 이번 작업은 **썸네일 생성 자동화만** 다룬다. 본문 삽입 이미지를 찾는 에이전트는 별도 과제.
- 새로 쓰는 글뿐 아니라, **기존에 발행된 12편의 히어로 이미지도 이번에 함께 재생성**한다
  (아래 "기존 이미지 처리" 참고).

## 원칙

- **이미지에 텍스트를 넣지 않는다.** 제목을 이미지에 박으면 나중에 제목을 고칠 때마다
  이미지를 다시 만들어야 하는 문제가 있어서, 애초에 프롬프트에서 "no text, no letters,
  no words, no logos"를 명시해 텍스트 렌더링 자체를 피한다.
- 배경색은 브랜드 컬러(잉크/Sea 틸/오렌지)에 고정하지 않는다. 카테고리별 색 변주는
  과거에 히어로 그라데이션에서 시도했다가 "촌스럽다"는 이유로 폐기된 적이 있어서
  (WORK.md 2단계), 같은 실수를 반복하지 않는다. 대신 AI가 매 글마다 어울리는 비비드한
  색을 자유롭게 고르게 둔다.
- 실패 시 조용히 넘어가지 않는다. `yourbuoy-writing` 발행 게이트의 "걸리면 보고하고
  멈춘다" 원칙을 그대로 따른다 (API 키 없음, 생성 실패 등).

## 트리거

1. **자동**: `yourbuoy-writing` 스킬의 발행 게이트에서 `hero_image`가 비어 있으면
   `tools/thumbnail.py`를 자동 실행해 채운다. 사용자가 별도로 명령할 필요 없음.
2. **수동 재생성**: `python3 tools/thumbnail.py _posts/YYYY-MM-DD-slug.md --force`로
   언제든 다시 만들 수 있다.

## 생성 파이프라인

**모델**: OpenAI `gpt-image-2` (Images API, `client.images.generate`). 로컬에 있는
codex 이미지 생성 가이드(`~/.codex/skills/.system/imagegen/`)를 참고해 최신 모델/파라미터를
확인했다 — `gpt-image-1`은 legacy, 현재 기본은 `gpt-image-2`.

**입력**: 포스트 프런트매터(title, subtitle, category, 첫 번째 tag)와 본문 앞 1~2문단.
별도 LLM 호출로 "장면"을 미리 추출하지 않고, 이미지 모델에 원문 맥락을 통째로 주고
알아서 장면을 착안하게 한다 (호출 1회로 끝).

**프롬프트 스키마** (codex 가이드의 공유 스키마 채택):
```
Use case: illustration-story (flat vector scene)
Asset type: blog hero thumbnail
Primary request: <제목/부제/본문에서 뽑은 핵심 상황>
Style/medium: flat vector illustration, corporate-flat style
Composition/framing: wide, one clear human figure, negative space on one side
Color palette: vivid solid or duotone background (다양하게, 브랜드색 고정 아님)
Constraints: no text, no letters, no words, no logos, no watermark
```

**사이즈**: `gpt-image-2`는 16px 배수 폭·높이면 자유 지정 가능하므로 `1536x816`
(1.9:1에 가장 가까운 값)으로 바로 생성 → Pillow로 최종 `1200x630`에 맞게 센터크롭
(거의 크롭 없음).

**품질/포맷**: `quality="medium"`, `output_format="png"`, `n=1`.

**출력**: `assets/images/thumbnail/YYYY-MM-DD_slug.png` 저장 →
포스트 프런트매터 `hero_image` 필드 자동 기록.

## 의존성

- `OPENAI_API_KEY`: 이미 `~/.zshrc`에 등록되어 있음 (별도 조치 불요)
- `pip install openai` 필요 (미설치 확인됨)
- Pillow는 이미 설치되어 있음 (12.2.0)

## 기존 이미지 처리 (1회성 배치 작업)

기존 발행 글 12편의 히어로 이미지를 전수 확인한 결과:

| 등급 | 파일 | 문제 |
|---|---|---|
| 심각 | `2021-05-23_..._Bad-Attitude...jpg` | 지금 글 제목과 다른 텍스트가 박혀있음, `.jpg` 확장자 |
| 심각 | `2021-04-25_megaphone.png` | 포토리얼 스톡사진, 스타일 이질적 |
| 심각 | `2026-08-31_reading-ai-written-documents.png` | "AI" 텍스트가 박혀있음 (텍스트 없음 원칙 위반) |
| 경미 | anxiety(2021-02-07), email-writing, supervisor-nags-you, time-management, note-taking-effectively | 비율이 2.33~2.86:1로 제각각 (기준 1.9:1과 불일치) |
| 경미 | `2026-07-08_why-i-write-again.png` | 비율은 맞지만 글 내용과 무관한 제네릭 부표 로고 |
| 양호 | anxiety-at-work(2021-01-31), feedback-v3(2026-09-04), do-i-leave-this-job(2026-09-11) | 원하는 톤에 가장 가까움. 단 파일 용량이 1MB 안팎으로 큼 |

**처리 방침**: 12편 모두 새 파이프라인으로 재생성한다 (양호한 3편도 포함 — 사이트 전체의
비율·용량·톤을 통일하기 위해). 단, AI 생성은 비결정적이라 이미 괜찮았던 결과보다
나빠질 위험이 있으므로 **한 장 생성할 때마다 사람이 확인하고 승인한 뒤 다음으로
넘어간다** (일괄 생성 후 일괄 커밋 아님).

파일명은 실제 발행일·slug 기준으로 정규화한다 (`2026-09-11_do-i-leave-this-job.png`→
`2026-09-14_do-i-leave-this-job.png`, `-v2`/`-v3` 접미사 제거). 이 과정에서
`assets/images/thumbnail/` 안의 미참조 잔여 파일(`Group92.png`, `2020_blog-thumbnail_01.png`
등 어느 포스트에서도 안 쓰는 파일)도 함께 정리한다.

## 구현 항목

1. `tools/thumbnail.py`: 포스트 경로를 받아 프런트매터·본문을 읽고, 프롬프트를 구성해
   `gpt-image-2`를 호출, `1200x630` PNG로 저장, `hero_image` 프런트매터 자동 기록.
   `--force` 플래그로 기존 이미지가 있어도 재생성.
2. `yourbuoy-writing` 스킬의 발행 게이트 문서에 "`hero_image` 없으면 `tools/thumbnail.py`
   자동 실행" 단계 추가.
3. 기존 12편 배치 재생성 — 장별 승인 후 커밋, 미참조 파일 정리.
