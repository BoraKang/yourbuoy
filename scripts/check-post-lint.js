#!/usr/bin/env node
/*
 * Catches the recurring Typora WYSIWYG corruption pattern in yourBuoy posts:
 * escaped markdown chars, blank lines breaking kramdown IALs, mangled
 * .yb-img-grid blocks, and broken/missing image references.
 * Runs on staged _posts/*.md files as a pre-commit hook.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getStagedPostFiles() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter((f) => f.startsWith('_posts/') && f.endsWith('.md'));
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

function lintFile(content) {
  const issues = [];
  const lines = content.split('\n');

  // 1. Escaped markdown special chars (Typora re-serialization artifact)
  lines.forEach((line, i) => {
    if (/\\[_*~]/.test(line)) {
      issues.push(`L${i + 1}: escaped markdown char (Typora artifact) -> ${line.trim()}`);
    }
  });

  // 2. Blank line between a heading and its kramdown IAL (breaks attachment)
  for (let i = 0; i < lines.length - 2; i++) {
    if (
      /^#{1,6}\s/.test(lines[i]) &&
      lines[i + 1].trim() === '' &&
      /^\{:\s*[\w-]+=/.test(lines[i + 2])
    ) {
      issues.push(`L${i + 2}: blank line between heading and IAL "${lines[i + 2].trim()}" (breaks kramdown attachment)`);
    }
  }

  // 3. .yb-img-grid blocks: blank lines inside, or a dropped/unmatched wrapper
  const gridOpenRe = /<div class="yb-img-grid[^"]*">/;
  for (let i = 0; i < lines.length; i++) {
    if (gridOpenRe.test(lines[i])) {
      let j = i + 1;
      let closed = false;
      while (j < lines.length && j < i + 30) {
        if (lines[j].trim() === '</div>') {
          closed = true;
          break;
        }
        if (lines[j].trim() === '') {
          issues.push(`L${j + 1}: blank line inside yb-img-grid block (Typora artifact, inconsistent with convention)`);
        }
        j++;
      }
      if (!closed) {
        issues.push(`L${i + 1}: <div class="yb-img-grid..."> has no matching </div> within 30 lines (wrapper likely dropped)`);
      }
    }
  }

  // 4. Image references: broken relative paste paths + missing files
  const imgSrcRe = /<img[^>]+src="([^"]+)"/g;
  const mdImgRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  const refs = [];
  let m;
  while ((m = imgSrcRe.exec(content))) refs.push({ src: m[1], index: m.index });
  while ((m = mdImgRe.exec(content))) refs.push({ src: m[1], index: m.index });

  refs.forEach(({ src, index }) => {
    const lineNo = lineNumberAt(content, index);
    if (!src.startsWith('/')) {
      issues.push(`L${lineNo}: image path "${src}" is not an absolute /assets path (likely a broken clipboard paste)`);
      return;
    }
    if (src.startsWith('/assets/')) {
      const resolved = path.join(process.cwd(), src.replace(/^\//, ''));
      if (!fs.existsSync(resolved)) {
        issues.push(`L${lineNo}: image file missing on disk -> ${src}`);
      }
    }
  });

  return issues;
}

function main() {
  const files = getStagedPostFiles();
  if (files.length === 0) process.exit(0);

  let hasIssues = false;
  files.forEach((file) => {
    if (!fs.existsSync(file)) return; // deleted file, nothing to lint
    const content = fs.readFileSync(file, 'utf8');
    const issues = lintFile(content);
    if (issues.length) {
      hasIssues = true;
      console.error(`\n✖ ${file}`);
      issues.forEach((issue) => console.error(`  ${issue}`));
    }
  });

  if (hasIssues) {
    console.error('\nyourBuoy 포스트 린트 실패: Typora 손상 패턴이 발견됐어요. 고친 뒤 다시 커밋해주세요.\n');
    process.exit(1);
  }
  console.log('yourBuoy post lint: OK');
}

main();
