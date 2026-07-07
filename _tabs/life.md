---
title: Life
icon: fas fa-seedling
order: 4
---

일기와 일상, 생각 정리.

{% assign posts = site.categories["Life"] %}
{% if posts and posts.size > 0 %}
{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>· {{ post.date | date: "%Y-%m-%d" }}</small>
{% endfor %}
{% else %}
아직 글이 없습니다.
{% endif %}
