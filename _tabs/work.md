---
title: Work
icon: fas fa-briefcase
order: 1
---

일하는 법, 업무 팁, 커리어에 대한 글을 모았습니다.

{% assign posts = site.categories["Work"] %}
{% if posts and posts.size > 0 %}
{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>· {{ post.date | date: "%Y-%m-%d" }}</small>
{% endfor %}
{% else %}
아직 글이 없습니다.
{% endif %}
