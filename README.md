# 英宏博客

基于 Hugo 的静态博客，部署在 Cloudflare Pages，域名 `yinghong.l.cd`。

## 本地预览

```bash
hugo server --config hugo.yaml --theme yinghong --buildDrafts
```

打开 http://localhost:1313

## 构建

```bash
hugo --config hugo.yaml --theme yinghong --minify --destination public
```

产物在 `public/`。

## 写文章

在 `content/posts/` 里新建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "一句话摘要"
date: 2026-09-13
datestr: "2026-09-13"
---

正文内容，支持 Markdown。
```

## 部署到 Cloudflare Pages

1. 把这个项目推到一个 GitHub 仓库。
2. Cloudflare Dashboard → Pages → Create a project → 连接该仓库。
3. 构建配置：

```text
构建命令: hugo --minify
输出目录: public
环境变量: HUGO_VERSION=0.166.0
```

4. 部署完成后绑定现有域名 `yinghong.l.cd`，替换掉原来的导航页。

## 说明

- 主题是极简自有主题，在 `themes/yinghong/`，可直接改样式。
- 首页文章列表由 `themes/yinghong/layouts/shortcodes/latest-posts.html` 生成（取最新 10 篇）。
- 文章归档页面在 `/posts/`。