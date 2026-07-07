# 배포 가이드

## 1. 기존 사이트 백업 (기존 로컬 리포에서)
```bash
cd yourbuoy   # 기존 클론
git checkout master && git pull
git branch backup-text-theme
git push origin backup-text-theme
```

## 2. 새 파일로 교체
```bash
# master에서 기존 파일 전부 제거 후 새 폴더 내용 복사
git rm -rf --quiet .
cp -R <다운받은 yourbuoy-new 폴더>/. .
git add -A
git commit -m "Chirpy 테마 전환 + 섹션 개편 (Work/AI Lab/아이에게/Life)"
git push origin master
```

## 3. GitHub Pages 설정 변경 (1회만)
GitHub 리포 → Settings → Pages → Build and deployment →
**Source: "GitHub Actions"** 로 변경.
(기존 "Deploy from a branch" 방식은 Chirpy를 빌드하지 못합니다)

## 4. 확인
- Actions 탭에서 "Build and Deploy" 성공 확인 (2~3분)
- https://yourbuoy.kr 접속 (CNAME 포함되어 있어 도메인 그대로 유지)

## 유지된 것들
- 기존 글 8개 URL 그대로 (`/work/글제목/`) — SEO 유지
- 네이버 서치어드바이저 인증 메타태그, GTM(GTM-W8NMB79)
- 이미지 전부 (`assets/images/`)

## 참고
- 재시작 글("블로그를 3년만에 다시 시작한 이유")은 본문이 미완성이라 `_drafts/`에 있습니다. 완성 후 `_posts/`로 옮기고 파일명 앞에 날짜를 붙이면 발행됩니다.
- 임신일기·경력단절 글 초안 2개는 '아이에게' 카테고리로 `_drafts/`에 있습니다.
- 로컬 미리보기: `bundle install` 후 `bundle exec jekyll serve` (Ruby 3.1+ 필요)
