#!/usr/bin/env python3
"""Generate a yourBuoy blog hero thumbnail with OpenAI gpt-image-2 or Gemini.

Reads a post's front matter + opening paragraphs, asks an image model for a
flat-vector illustration scene (no text baked in), crops it to the site's
1.9:1 hero convention, saves it under assets/images/thumbnail/, and writes
the hero_image front matter field back into the post.

Usage:
  python3 tools/thumbnail.py _posts/2026-09-14-do-i-leave-this-job.md
  python3 tools/thumbnail.py _drafts/some-draft.md
  python3 tools/thumbnail.py _posts/....md --force
  python3 tools/thumbnail.py _posts/....md --force --quality low   # cheap preview
  python3 tools/thumbnail.py _posts/....md --force --provider gemini

Provider is auto-detected from whichever API key is set (OPENAI_API_KEY or
GEMINI_API_KEY); pass --provider to force one. Requires OPENAI_API_KEY +
`pip install openai`, or GEMINI_API_KEY + `pip install google-genai`.
"""
import argparse
import base64
import io
import os
import re
import sys
from pathlib import Path

import yaml
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
THUMB_DIR = REPO_ROOT / "assets" / "images" / "thumbnail"

OPENAI_MODEL = "gpt-image-2"
GEMINI_MODEL = "gemini-3-pro-image-preview"
GEN_SIZE = "1536x816"  # OpenAI target size (closest 16px-multiple to 1.9:1)
GEMINI_SIZE_BY_QUALITY = {"low": "1K", "medium": "2K", "high": "4K"}
FINAL_SIZE = (1200, 630)

STYLE_TEMPLATE = """Use case: illustration-story (flat vector scene)
Asset type: blog hero thumbnail
Primary request: {scene}
Style/medium: flat vector illustration, corporate-flat style, clean bold shapes
Composition/framing: wide, one clear human figure or scene, negative space on one side
Color palette: pick one vivid solid or duotone background color that fits the mood; vary it, do not default to teal
Constraints: no text, no letters, no words, no logos, no watermark, no signature"""

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n?(.*)$", re.DOTALL)


def parse_post(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        raise ValueError("frontmatter를 찾을 수 없음 (--- ... --- 블록 필요)")
    fm_text, body = m.group(1), m.group(2)
    fm = yaml.safe_load(fm_text) or {}
    return fm, fm_text, body


def extract_scene_context(fm, body):
    clean = body.replace("<!--more-->", "")
    clean = re.sub(r"<[^>]+>", "", clean)  # html tags
    clean = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", clean)  # markdown images
    clean = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", clean)  # markdown links -> text
    paragraphs = [
        p.strip()
        for p in clean.split("\n\n")
        if p.strip() and not p.strip().startswith("#") and not p.strip().startswith(">")
    ]
    excerpt = " ".join(paragraphs[:2])[:600]

    parts = [fm.get("title", ""), fm.get("subtitle", "")]
    tags = fm.get("tags") or []
    if tags:
        parts.append(str(tags[0]))
    if excerpt:
        parts.append(excerpt)
    return " / ".join(p for p in parts if p)


def build_prompt(fm, body):
    scene = extract_scene_context(fm, body)
    if not scene:
        raise ValueError("제목/본문에서 장면을 뽑을 내용이 없음")
    return STYLE_TEMPLATE.format(scene=scene)


def slug_and_date(post_path, fm):
    stem = post_path.stem
    m = re.match(r"^(\d{4}-\d{2}-\d{2})-(.+)$", stem)
    if m:
        return m.group(1), m.group(2)
    date_field = str(fm.get("date", "")).strip()
    date = date_field.split(" ")[0] if date_field else ""
    if not date:
        raise ValueError("발행일을 알 수 없음 (파일명 YYYY-MM-DD-slug 또는 frontmatter date 필요)")
    return date, stem


def resolve_provider(requested):
    if requested:
        return requested
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    if os.environ.get("GEMINI_API_KEY"):
        return "gemini"
    print(
        "OPENAI_API_KEY도 GEMINI_API_KEY도 설정되어 있지 않습니다.\n"
        "  OpenAI: https://platform.openai.com/api-keys\n"
        "  Gemini: https://aistudio.google.com/apikey\n"
        "발급 후 쉘 프로필(~/.zshrc 등)에 export ...=... 추가하고 재시도하세요.",
        file=sys.stderr,
    )
    sys.exit(1)


def generate_image_openai(prompt, quality):
    from openai import OpenAI

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print(
            "OPENAI_API_KEY가 설정되어 있지 않습니다.\n"
            "  1) https://platform.openai.com/api-keys 에서 키 발급\n"
            "  2) 쉘 프로필(~/.zshrc 등)에 export OPENAI_API_KEY=... 추가 후 재시도",
            file=sys.stderr,
        )
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    resp = client.images.generate(
        model=OPENAI_MODEL,
        prompt=prompt,
        size=GEN_SIZE,
        quality=quality,
        output_format="png",
        n=1,
    )
    b64 = resp.data[0].b64_json
    return Image.open(io.BytesIO(base64.b64decode(b64)))


def generate_image_gemini(prompt, quality):
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print(
            "GEMINI_API_KEY가 설정되어 있지 않습니다.\n"
            "  1) https://aistudio.google.com/apikey 에서 키 발급\n"
            "  2) 쉘 프로필(~/.zshrc 등)에 export GEMINI_API_KEY=... 추가 후 재시도",
            file=sys.stderr,
        )
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio="16:9",
                image_size=GEMINI_SIZE_BY_QUALITY[quality],
            ),
        ),
    )
    for part in response.parts:
        if part.inline_data:
            return Image.open(io.BytesIO(part.inline_data.data))
    raise RuntimeError("Gemini 응답에 이미지가 없음 (텍스트만 반환됨)")


def generate_image(provider, prompt, quality):
    if provider == "openai":
        return generate_image_openai(prompt, quality)
    if provider == "gemini":
        return generate_image_gemini(prompt, quality)
    raise ValueError(f"알 수 없는 provider: {provider}")


def crop_to_final(img):
    target_w, target_h = FINAL_SIZE
    target_ratio = target_w / target_h
    w, h = img.size
    ratio = w / h
    if ratio > target_ratio:
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif ratio < target_ratio:
        new_h = int(round(w / target_ratio))
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))
    return img.convert("RGB").resize(FINAL_SIZE, Image.LANCZOS)


def update_hero_image_field(full_text, fm_text, new_value):
    line = f"hero_image: {new_value}"
    if re.search(r"^hero_image:.*$", fm_text, re.MULTILINE):
        new_fm_text = re.sub(r"^hero_image:.*$", line, fm_text, count=1, flags=re.MULTILINE)
    else:
        new_fm_text = fm_text.rstrip("\n") + "\n" + line
    return full_text.replace(f"---\n{fm_text}\n---", f"---\n{new_fm_text}\n---", 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("post", type=Path, help="_posts 또는 _drafts 안의 .md 파일 경로")
    parser.add_argument("--force", action="store_true", help="hero_image가 이미 있어도 재생성")
    parser.add_argument("--quality", choices=["low", "medium", "high"], default="medium")
    parser.add_argument("--provider", choices=["openai", "gemini"], default=None, help="기본: 설정된 키로 자동 판단")
    args = parser.parse_args()
    provider = resolve_provider(args.provider)

    post_path = args.post
    if not post_path.exists():
        print(f"파일을 찾을 수 없음: {post_path}", file=sys.stderr)
        sys.exit(1)

    full_text = post_path.read_text(encoding="utf-8")
    fm, fm_text, body = parse_post(full_text)

    existing = fm.get("hero_image")
    if existing and not args.force:
        print(f"hero_image가 이미 있음 (재생성하려면 --force): {existing}")
        sys.exit(0)

    date, slug = slug_and_date(post_path, fm)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    out_path = THUMB_DIR / f"{date}_{slug}.png"

    prompt = build_prompt(fm, body)
    print(f"[thumbnail] provider: {provider} | 품질: {args.quality} | 최종 크기: {FINAL_SIZE[0]}x{FINAL_SIZE[1]}")
    print(f"[thumbnail] 프롬프트:\n{prompt}\n")

    img = generate_image(provider, prompt, args.quality)
    img = crop_to_final(img)
    img.save(out_path, format="PNG")

    hero_value = f"/{out_path.relative_to(REPO_ROOT).as_posix()}"
    new_text = update_hero_image_field(full_text, fm_text, hero_value)
    post_path.write_text(new_text, encoding="utf-8")

    # 기존 hero_image가 다른 파일을 가리키고 있었다면(파일명 정규화 등) 정리
    if existing:
        old_path = REPO_ROOT / str(existing).lstrip("/")
        if old_path != out_path and old_path.exists() and THUMB_DIR in old_path.parents:
            old_path.unlink()
            print(f"[thumbnail] 이전 파일 삭제: {old_path.relative_to(REPO_ROOT)}")

    print(f"[thumbnail] 저장 완료: {out_path.relative_to(REPO_ROOT)}")
    print(f"[thumbnail] front matter 반영: hero_image: {hero_value}")


if __name__ == "__main__":
    main()
