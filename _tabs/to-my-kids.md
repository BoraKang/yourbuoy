---
title: 아이에게
icon: fas fa-heart
order: 3
---

엄마가 일과 삶에서 얻은 단상과 교훈, 언젠가 아이가 읽었으면 하는 글입니다.

{% assign posts = site.categories["아이에게"] %}
{% if posts and posts.size > 0 %}
{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>· {{ post.date | date: "%Y-%m-%d" }}</small>
{% endfor %}
{% else %}
첫 편지를 쓰는 중입니다.
{% endif %}
