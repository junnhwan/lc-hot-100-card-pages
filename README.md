# LC Hot 100 速记卡 / Flashcard Pages

静态站：把 LeetCode Hot 100 笔记渲染成可搜索、可筛选、可标掌握度的速记页（列表 + 翻转卡片 + 自测模式）。

Static flashcard site for LeetCode Hot 100 notes — search, category filters, local mastery tracking, card/quiz overlays.

线上地址（推送 `main` 并开启 Pages 后）：

`https://junnhwan.github.io/lc-hot-100-card-pages/`

> 资源路径使用相对路径（`./app.js`、`./problems.json` 等），在项目页子路径下可正常加载。

## 本地预览 / Preview

```bash
npm test
npm run build
npm run preview
```

浏览器打开：http://localhost:4173

## 更新内容 / Update content

1. 编辑笔记源：`content/LC Hot 100.md`
2. （可选）补全 / 覆盖提示与笔记：`data/notes-override.json`
3. 重新构建：

```bash
npm run build
```

生成物：`public/problems.json`（与 `public/index.html`、`public/app.js`、`public/styles.css` 一并部署）。

## 部署 / Deploy

1. 推送到 `main`：

```bash
git push origin main
```

2. 在 GitHub 仓库 **Settings → Pages** 将 Source 设为 **GitHub Actions**（只需配置一次）。
3. Workflow：`.github/workflows/pages.yml`  
   - 跑 `npm test` + `npm run build`  
   - 上传 `public/` 到 GitHub Pages

## 掌握度 / Mastery

掌握度（不会 / 模糊 / 记住了）只存在浏览器 **localStorage**（键 `lc-hot100-mastery`），不会上传、不会写入仓库。换设备或清站点数据会丢失。

主题偏好同样本地持久化（键 `lc-hot100-theme`），默认深色。

## 脚本

| 命令 | 作用 |
|------|------|
| `npm test` | 解析 / 合并笔记单测 |
| `npm run build` | 从 markdown + override 生成 `public/problems.json` |
| `npm run preview` | 静态服务 `public`（端口 4173） |

## 技术要点

- 纯静态前端，无构建打包器
- highlight.js CDN（深色 `github-dark` / 浅色 `github` 随主题切换）
- 数据构建：`scripts/build-data.mjs` + `scripts/lib/*`
