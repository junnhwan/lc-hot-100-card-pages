# LC Hot 100 速记卡 / Flashcard Pages

静态站：默认 **Anki 式单卡刷题**，列表模式用于搜索与扫库。

- 首页刷卡：`/` / `index.html`
- 题库列表：`list.html`

线上：`https://junnhwan.github.io/lc-hot-100-card-pages/`

> 资源使用相对路径，GitHub Pages 项目子路径可用。

## 本地预览

```bash
npm test
npm run build
npm run preview
```

打开 http://localhost:4173 （默认进入卡片模式）  
列表：http://localhost:4173/list.html

## 更新内容

1. 编辑 `content/LC Hot 100.md`
2. 可选：`data/notes-override.json`
3. `npm run build` → 更新 `public/problems.json`

## 部署

推送 `main` 后由 GitHub Actions 部署 `public/`。  
Settings → Pages → Source = GitHub Actions。

## 掌握度

localStorage 键 `lc-hot100-mastery`（不会 / 模糊 / 记住了），仅本机。  
主题键 `lc-hot100-theme`。
