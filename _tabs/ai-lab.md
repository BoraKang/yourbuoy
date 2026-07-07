---
title: AI Lab
icon: fas fa-flask
order: 2
---

AI로 만든 것들 — 작업물, 데모, 만드는 과정의 기록입니다.

{% assign posts = site.categories["AI Lab"] %}
{% if posts and posts.size > 0 %}
{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>· {{ post.date | date: "%Y-%m-%d" }}</small>
{% endfor %}
{% else %}
첫 작업물을 준비하고 있습니다.
{% endif %}
