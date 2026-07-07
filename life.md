---
layout: page
title: 카바나
permalink: /life/
---

<p>일상과 단상, 삶의 태도. 표류하다 잠시 쉬어가는 곳.</p>

{%- assign _articles = site.categories["life"] -%}
{%- include article-list.html
  articles=_articles
  type='item'
  show_cover=true
  cover_size='sm'
  show_excerpt=true
  excerpt_truncate=220
  show_readmore=true
  show_info=true
-%}
