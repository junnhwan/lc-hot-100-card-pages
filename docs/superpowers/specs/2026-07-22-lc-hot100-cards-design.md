# LC Hot 100 速记卡 — 设计文档

**日期:** 2026-07-22  
**仓库:** `D:\dev\lc-hot-100-card-pages` → `git@github.com:junnhwan/lc-hot-100-card-pages.git`  
**状态:** 已通过用户确认（brainstorming §1–§4）

## 1. 问题与目标

### 问题

用户在刷 LeetCode Hot 100 时，答案多为对照题解背诵，算法基础一般。现有材料是单文件 Markdown（`LC Hot 100.md`，约 100 题、18 个分类、以 Go 代码为主），包含代码与少量行内注释，缺少结构化「快速回忆」层。重复整题盲写成本高，更需要**多看、主动回忆、按掌握度扫盲**。

### 目标

做一个**精美、可部署的静态网页速记卡**，支持：

1. 按分类浏览全部 Hot 100 题目与题解代码  
2. 每题有独立于代码的「思路要点 / 易错补充」，便于快速回忆  
3. 默认渐进展开；单题可进入卡片 / 测验模式  
4. 本地记录掌握度（记住了 / 模糊 / 不会）  
5. 部署到 GitHub Pages，手机与电脑均可打开  

### 非目标（第一版不做）

- 登录、云同步掌握度  
- 网页内编辑代码或 Markdown  
- 完整题面复述（外链 LeetCode 即可）  
- 刷题计时器、排行榜、社交  
- 服务端 / 数据库  

### 成功标准

- 打开 Pages URL（或本地 `dist`）即可用，无需后端  
- 30 秒内可按分类找到某题并看到思路要点  
- 代码默认折叠；需要时一键展开  
- 掌握度刷新后仍在（同一浏览器）  
- 空题（无有效代码）仍在清单中，标为「待补全」  

## 2. 用户决策摘要

| 决策点 | 选择 |
|--------|------|
| 交互形态 | 混合：默认分类浏览 + 渐进展开；单题可进卡片 / 测验 |
| 要点来源 | 自动提炼 + 可覆盖（MD 手写优先，其次 override 文件，再次启发式） |
| 掌握度 | 三级，仅 `localStorage` |
| 交付 | 静态站，GitHub Pages 部署 |
| 空题 | 收录，状态 `stub` / UI「待补全」 |
| 代码展示 | **默认折叠**（强制先看要点再揭代码） |
| 视觉 | 侧栏分类 + 主列表；**Ink Studio** 深色气质 |
| 实现路线 | 构建时解析 Markdown → `problems.json` + 轻量前端 |
| 工程位置 | `D:\dev\lc-hot-100-card-pages`，远程已建 |

## 3. 信息架构

### 页面骨架

```
顶栏：标题 · 搜索 · 掌握度统计 · 浅/深色切换
侧栏：全部分类（含计数）· 筛选 chips（掌握度 / 待补全）
主区：题目列表（折叠行 / 展开详情）
Overlay：卡片模式 · 测验模式
```

- 桌面（≥900px）：侧栏固定  
- 小屏：分类改为顶部横向 chips 或抽屉  

### 三种模式

| 模式 | 默认可见 | 揭晓方式 | 场景 |
|------|----------|----------|------|
| 浏览（默认） | 题号、标题、掌握度、要点预览；展开后见完整 hints/notes，**代码默认折叠** | 点「展开代码」 | 按专题扫 |
| 卡片 | 正面：题号+标题+`hints[0]` | 翻转 → 要点+notes+代码 | 单题回忆 |
| 测验 | 标题 +「先自己过一遍」 | 「揭晓」→ 同背面；鼓励标掌握度 | 考前自测 |

### 单题展开内容（顺序固定）

1. 标题区：题号、中文名、分类、LC 外链、掌握度三档  
2. **思路要点**（默认展开）  
3. **易错 / 补充**（有则显示）  
4. **代码**（默认折叠；`stub` 显示「待补全」）  
5. 操作：卡片模式 / 测验模式  

要点与 notes **永不写入用户代码函数体**，始终在独立 UI 区块。

## 4. 数据模型

### `problems.json`（构建产物）

```ts
type Problem = {
  id: string              // "1"
  title: string           // "两数之和"
  slug: string            // "two-sum"
  url: string             // leetcode.cn URL
  category: string        // "哈希"（去掉标题尾部数字）
  categoryOrder: number
  code: string | null     // 原样；stub 为 null
  status: "ready" | "stub"
  hints: string[]         // 2–4 条口诀
  notes: string[]         // 易错 / 补充
  tags?: string[]
}

type Catalog = {
  generatedAt: string
  categories: { name: string; count: number; order: number }[]
  problems: Problem[]
}
```

### 掌握度（仅浏览器）

```ts
// localStorage key: "lc-hot100-mastery"
Record<string /* id */, "unknown" | "fuzzy" | "known">
```

第一版不做导出/导入；换设备会丢失（可接受）。

### 要点优先级

1. Markdown 内可选覆盖块（最高）  
2. `data/notes-override.json`（批量人工补充）  
3. 从代码与行内注释启发式生成（兜底）  

## 5. Markdown 约定

### 兼容现状（必须）

源文件结构保持用户现有习惯：

```markdown
### 哈希 3

[1\. 两数之和](https://leetcode.cn/problems/two-sum/)

```Go
func twoSum(...) { ... }
```
```

- 分类：`### 名称` 可选尾部数字，导航名去掉尾部数字  
- 题目：`[题号\. 标题](url)` + 紧随 fenced code  
- 语言标记不可靠（部分标成 `SQL` 实为 Go）→ 前端统一按 Go 高亮  
- `### template` 等非题分类：忽略  
- 空代码块或仅题号占位 → `status: "stub"`, `code: null`  
- 重复题号：后者覆盖，build 打印警告  

### 可选覆盖（用户日后打磨）

写在链接与代码块之间：

```markdown
[1\. 两数之和](https://leetcode.cn/problems/two-sum/)

> **hints**
> - map 存已遍历值
> - 先查 target-num 再写入

> **notes**
> - 返回下标不是值

```Go
...
```
```

有 `hints`/`notes` 块则完全覆盖同名字段的自动/override 结果（MD 优先于 override 文件）。

### 源文件来源

- 初始：从 `D:\ai-chat\LC Hot 100.md` 拷贝或迁入仓库 `content/LC Hot 100.md`  
- 之后以仓库内 `content/` 为唯一构建源；用户本地笔记可双向同步（流程在实现计划中约定，设计层要求「单一构建入口」）  

## 6. UI / 视觉

### 布局

**侧栏分类 + 主列表**（已确认）。

### 气质：Ink Studio

- 背景：`#0b0f14`  
- 面板：`#111822` / `#121a24`  
- 边框：`#243041`  
- 强调：`#3b82f6` / `#93c5fd`  
- 正文：`#c5d0de`；标题：`#e7eef8`  
- 掌握度：绿（known）/ 黄（fuzzy）/ 红（unknown）— 弱饱和  
- 字体：UI 系统栈；代码 `ui-monospace`, Consolas  
- 默认深色，顶栏可切换浅色  

### 列表行为

- 折叠行：题号、标题、分类、掌握度徽章、`hints[0]` 预览、卡片/测验快捷入口  
- 点击行：就地展开（非整页跳转）  
- 代码区默认折叠，标题栏显示「展开代码 ▾」  
- 搜索：题号、标题、slug 本地过滤  
- 筛选：掌握度 ∩ 分类 ∩ 待补全  

### 卡片 / 测验

- Overlay 或全屏层；Esc / 返回关闭  
- 卡片：翻转（CSS）；左右键同筛选集内上一题/下一题  
- 测验：揭晓前不显示要点与代码；揭晓后可标掌握度再下一题  

### 空题

- 列表可见；徽章「待补全」  
- 要点/notes 仍可显示（来自 override）  
- 代码区固定占位文案，无虚假代码  

## 7. 工程结构

```
lc-hot-100-card-pages/
├── content/
│   └── LC Hot 100.md
├── data/
│   └── notes-override.json
├── scripts/
│   └── build-data.mjs          # MD + override → public/problems.json
├── public/                     # 或 src + Vite 输出到 dist
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── problems.json           # build 生成，可 gitignore 或提交便于预览
├── package.json
├── .github/workflows/pages.yml
└── docs/superpowers/specs/
    └── 2026-07-22-lc-hot100-cards-design.md
```

### 技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 前端 | 原生 HTML/CSS/JS（可用 Vite 仅作静态服务与可选打包） | 100 题静态数据，无需 SPA 框架 |
| 构建 | Node 脚本解析 MD | 可测、可 CI |
| 高亮 | 轻量库（如 highlight.js）或最小 Go tokenizer | 够用即可 |
| 部署 | GitHub Pages + Actions：`npm run build` 后发布 | 与远程仓库一致 |
| 状态 | `localStorage` | 零后端 |

### 构建流水线

```
content/LC Hot 100.md
data/notes-override.json
        │
        ▼
 scripts/build-data.mjs
        │
        ▼
 public/problems.json  +  静态资源
        │
        ▼
 GitHub Pages
```

### 日常工作流

1. 用户在 `content/LC Hot 100.md` 补代码或可选 hints  
2. 维护者更新 `data/notes-override.json`（批量要点）  
3. 本地 `npm run build && npm run preview` 或 push → Action 部署  

### 内容补齐（实现阶段）

- 解析全部分类与题目  
- 对 stub 与注释薄弱题：在 `notes-override.json` 补 `hints`/`notes`  
- 有完整代码的题：优先启发式，不足再手补 override  
- **不修改**用户代码块内容来「塞注释」  

## 8. 错误处理与边界

| 情况 | 行为 |
|------|------|
| MD 解析失败 | build 非零退出，CI 失败 |
| 单题字段缺失 | 尽量降级（无 hints 则空数组 + UI 不渲染该块） |
| `problems.json` 加载失败 | 页面显示错误态，提示刷新/检查部署 |
| localStorage 不可用 | 掌握度功能降级为会话内内存或禁用并提示 |
| 未知题号写入 mastery | 忽略或清理孤儿 key（实现时选简单策略） |

## 9. 测试策略（规划级）

- **解析器单元测试**：样例 MD 片段 → 期望 `Problem`（含 stub、SQL 误标、hints 覆盖、分类名剥离数字）  
- **override 合并测试**：优先级 1>2>3  
- **手动验收**：筛选、搜索、折叠代码、卡片/测验、掌握度刷新、小屏布局、Pages 部署后打开  

第一版不强制 E2E 框架。

## 10. 实现顺序建议（供 writing-plans 使用）

1. 仓库脚手架 + 拷贝 MD + 空 override  
2. `build-data.mjs` 解析与合并 + 解析测试  
3. 静态壳：Ink Studio 布局、列表、筛选、搜索  
4. 题目展开：hints/notes/折叠代码/高亮/stub  
5. localStorage 掌握度 + 统计  
6. 卡片模式、测验模式  
7. 批量补 `notes-override.json`  
8. GitHub Pages workflow + README  

## 11. 已确认的开放问题

| 问题 | 结论 |
|------|------|
| 代码默认展开还是折叠？ | **折叠** |
| 仓库路径与远程？ | `D:\dev\lc-hot-100-card-pages`，`junnhwan/lc-hot-100-card-pages` |
| 视觉 companion 布局/气质？ | 侧栏 A + Ink Studio A |

## 12. 参考

- 源笔记：`D:\ai-chat\LC Hot 100.md`（约 2691 行，~100 题，18 类，约 9 题 stub）  
- 用户现有静态笔记参考气质：`D:\ai-chat\csapp-notes.html`（仅作「单文件/静态可打开」参考，不要求同视觉）  
