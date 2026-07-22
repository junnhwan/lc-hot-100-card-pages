const MASTER_KEY = 'lc-hot100-mastery';
const THEME_KEY = 'lc-hot100-theme';

const MASTERY_LABELS = {
  unknown: '不会',
  fuzzy: '模糊',
  known: '记住了',
};

/** @type {{ selectedCategory: string | null, searchQuery: string, masteryFilter: string, expandedId: string | null, codeOpen: Set<string> }} */
const state = {
  selectedCategory: null, // null = all
  searchQuery: '',
  masteryFilter: 'all', // all | unknown | fuzzy | known | stub
  expandedId: null,
  codeOpen: new Set(),
};

/** @type {{ categories: Array<{name:string,count:number,order:number}>, problems: Array<object> } | null} */
let catalog = null;

/** @type {Record<string, 'unknown' | 'fuzzy' | 'known'>} */
let masteryMap = {};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadMastery() {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (!raw) {
      masteryMap = {};
      return;
    }
    const parsed = JSON.parse(raw);
    masteryMap = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    masteryMap = {};
  }
}

function saveMastery() {
  try {
    localStorage.setItem(MASTER_KEY, JSON.stringify(masteryMap));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string | number} id
 * @returns {'unknown' | 'fuzzy' | 'known'}
 */
function getMastery(id) {
  const v = masteryMap[String(id)];
  if (v === 'fuzzy' || v === 'known' || v === 'unknown') return v;
  return 'unknown';
}

/**
 * @param {string | number} id
 * @param {'unknown' | 'fuzzy' | 'known'} level
 */
function setMastery(id, level) {
  masteryMap[String(id)] = level;
  saveMastery();
}

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  const hljsLink = document.getElementById('hljs-theme');
  if (hljsLink) {
    hljsLink.href =
      next === 'light'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css';
  }
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }
}

function initTheme() {
  let theme = 'dark';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {
    /* ignore */
  }
  applyTheme(theme);

  $('theme-toggle')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'light' ? 'dark' : 'light');
  });
}

function filteredProblems() {
  if (!catalog) return [];
  let list = catalog.problems;

  if (state.selectedCategory) {
    list = list.filter((p) => p.category === state.selectedCategory);
  }

  const q = state.searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => {
      const id = String(p.id ?? '');
      const title = String(p.title ?? '').toLowerCase();
      const slug = String(p.slug ?? '').toLowerCase();
      return id.includes(q) || title.includes(q) || slug.includes(q);
    });
  }

  const mf = state.masteryFilter;
  if (mf === 'stub') {
    list = list.filter((p) => p.status === 'stub');
  } else if (mf === 'unknown' || mf === 'fuzzy' || mf === 'known') {
    list = list.filter((p) => getMastery(p.id) === mf);
  }

  return list;
}

function setCategory(name) {
  state.selectedCategory = name;
  state.expandedId = null;
  render(catalog);
}

function setMasteryFilter(filter) {
  state.masteryFilter = filter;
  state.expandedId = null;
  renderFilterChips();
  renderProblemList();
  renderStats();
}

function renderFilterChips() {
  const wrap = $('filter-chips');
  if (!wrap) return;
  for (const btn of wrap.querySelectorAll('.chip[data-filter]')) {
    const f = btn.getAttribute('data-filter');
    const active = f === state.masteryFilter;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function bindFilterChips() {
  const wrap = $('filter-chips');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip[data-filter]');
    if (!btn || btn.disabled) return;
    const f = btn.getAttribute('data-filter');
    if (!f) return;
    setMasteryFilter(f);
  });
}

function renderCategories() {
  if (!catalog) return;

  const total = catalog.problems.length;
  const items = [
    { name: null, label: '全部', count: total },
    ...catalog.categories.map((c) => ({
      name: c.name,
      label: c.name,
      count: c.count,
    })),
  ];

  const catList = $('cat-list');
  const catChips = $('cat-chips');
  if (!catList || !catChips) return;

  catList.replaceChildren();
  catChips.replaceChildren();

  for (const item of items) {
    const active = state.selectedCategory === item.name;

    const sideBtn = document.createElement('button');
    sideBtn.type = 'button';
    sideBtn.className = 'cat-item' + (active ? ' is-active' : '');
    sideBtn.setAttribute('aria-current', active ? 'true' : 'false');

    const nameEl = document.createElement('span');
    nameEl.className = 'cat-name';
    nameEl.textContent = item.label;

    const countEl = document.createElement('span');
    countEl.className = 'cat-count';
    countEl.textContent = String(item.count);

    sideBtn.append(nameEl, countEl);
    sideBtn.addEventListener('click', () => setCategory(item.name));
    catList.appendChild(sideBtn);

    const chipBtn = document.createElement('button');
    chipBtn.type = 'button';
    chipBtn.className = 'chip-cat' + (active ? ' is-active' : '');
    chipBtn.setAttribute('aria-current', active ? 'true' : 'false');

    const chipLabel = document.createTextNode(item.label);
    const chipCount = document.createElement('span');
    chipCount.className = 'chip-count';
    chipCount.textContent = String(item.count);

    chipBtn.append(chipLabel, chipCount);
    chipBtn.addEventListener('click', () => setCategory(item.name));
    catChips.appendChild(chipBtn);
  }
}

/**
 * @param {object} p
 * @returns {HTMLElement}
 */
function createMasteryBadge(p) {
  if (p.status === 'stub') {
    const badge = document.createElement('span');
    badge.className = 'mastery-badge mastery-stub';
    badge.textContent = '待补全';
    return badge;
  }
  const level = getMastery(p.id);
  const badge = document.createElement('span');
  badge.className = 'mastery-badge mastery-' + level;
  badge.textContent = MASTERY_LABELS[level];
  badge.dataset.level = level;
  return badge;
}

/**
 * @param {object} p
 * @returns {HTMLElement}
 */
function createMasteryToggles(p) {
  const wrap = document.createElement('div');
  wrap.className = 'mastery-toggles';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', '掌握度');

  const current = getMastery(p.id);
  for (const level of /** @type {const} */ (['unknown', 'fuzzy', 'known'])) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'mastery-toggle mastery-' +
      level +
      (current === level ? ' is-active' : '');
    btn.textContent = MASTERY_LABELS[level];
    btn.dataset.level = level;
    btn.setAttribute('aria-pressed', current === level ? 'true' : 'false');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMastery(p.id, level);
      // re-render list so badge + filters stay consistent
      renderProblemList();
      renderStats();
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

/**
 * @param {object} p
 * @param {HTMLElement} host
 */
function highlightCodeIfNeeded(p, host) {
  if (typeof hljs === 'undefined') return;
  const codeEl = host.querySelector('code.language-go');
  if (!codeEl || codeEl.dataset.highlighted === 'yes') return;
  try {
    hljs.highlightElement(codeEl);
    codeEl.dataset.highlighted = 'yes';
  } catch (err) {
    console.warn('hljs failed', err);
  }
}

/**
 * @param {object} p
 * @returns {HTMLElement}
 */
function buildExpandedBody(p) {
  const body = document.createElement('div');
  body.className = 'problem-detail';

  // 1. Title + LC link + mastery
  const head = document.createElement('div');
  head.className = 'detail-head';

  const titleRow = document.createElement('div');
  titleRow.className = 'detail-title-row';

  const titleEl = document.createElement('h3');
  titleEl.className = 'detail-title';
  titleEl.textContent = `#${p.id} ${p.title}`;

  const link = document.createElement('a');
  link.className = 'detail-lc-link';
  link.href = p.url || `https://leetcode.cn/problems/${p.slug}/`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'LeetCode';
  link.addEventListener('click', (e) => e.stopPropagation());

  titleRow.append(titleEl, link);

  const metaRow = document.createElement('div');
  metaRow.className = 'detail-meta-row';
  const cat = document.createElement('span');
  cat.className = 'problem-cat';
  cat.textContent = p.category;
  metaRow.append(cat, createMasteryToggles(p));

  head.append(titleRow, metaRow);
  body.appendChild(head);

  // 2. 思路要点
  const hints = Array.isArray(p.hints) ? p.hints.filter(Boolean) : [];
  if (hints.length > 0) {
    const sec = document.createElement('section');
    sec.className = 'detail-section';
    const h = document.createElement('h4');
    h.className = 'detail-section-title';
    h.textContent = '思路要点';
    const ul = document.createElement('ul');
    ul.className = 'detail-list';
    for (const item of hints) {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    }
    sec.append(h, ul);
    body.appendChild(sec);
  }

  // 3. 易错/补充
  const notes = Array.isArray(p.notes) ? p.notes.filter(Boolean) : [];
  if (notes.length > 0) {
    const sec = document.createElement('section');
    sec.className = 'detail-section';
    const h = document.createElement('h4');
    h.className = 'detail-section-title';
    h.textContent = '易错 / 补充';
    const ul = document.createElement('ul');
    ul.className = 'detail-list';
    for (const item of notes) {
      const li = document.createElement('li');
      li.textContent = item;
      ul.appendChild(li);
    }
    sec.append(h, ul);
    body.appendChild(sec);
  }

  // 4. 代码
  const codeSec = document.createElement('section');
  codeSec.className = 'detail-section detail-code-section';
  const codeH = document.createElement('h4');
  codeH.className = 'detail-section-title';
  codeH.textContent = '代码';

  if (p.status === 'stub' || !p.code) {
    const stub = document.createElement('div');
    stub.className = 'code-stub';
    stub.textContent = '待补全';
    codeSec.append(codeH, stub);
  } else {
    const idKey = String(p.id);
    const isOpen = state.codeOpen.has(idKey);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'code-toggle';
    toggle.textContent = isOpen ? '收起代码' : '展开代码';
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    const pre = document.createElement('pre');
    pre.className = 'code-block';
    if (!isOpen) pre.hidden = true;

    const code = document.createElement('code');
    code.className = 'language-go';
    // Escape then set as textContent path: use textContent for safety
    code.textContent = p.code;
    pre.appendChild(code);

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.codeOpen.has(idKey)) {
        state.codeOpen.delete(idKey);
        pre.hidden = true;
        toggle.textContent = '展开代码';
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        state.codeOpen.add(idKey);
        pre.hidden = false;
        toggle.textContent = '收起代码';
        toggle.setAttribute('aria-expanded', 'true');
        highlightCodeIfNeeded(p, codeSec);
      }
    });

    codeSec.append(codeH, toggle, pre);
    if (isOpen) {
      // highlight after attach — caller may call after append
      queueMicrotask(() => highlightCodeIfNeeded(p, codeSec));
    }
  }
  body.appendChild(codeSec);

  // 5. Card / Quiz
  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  const cardBtn = document.createElement('button');
  cardBtn.type = 'button';
  cardBtn.className = 'btn-action';
  cardBtn.textContent = '卡片';
  cardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('card mode (stub)', p.id);
  });

  const quizBtn = document.createElement('button');
  quizBtn.type = 'button';
  quizBtn.className = 'btn-action';
  quizBtn.textContent = '测验';
  quizBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('quiz mode (stub)', p.id);
  });

  actions.append(cardBtn, quizBtn);
  body.appendChild(actions);

  return body;
}

/**
 * @param {object} p
 * @returns {HTMLElement}
 */
function buildCollapsedRow(p) {
  const row = document.createElement('div');
  row.className = 'problem-summary';

  const idEl = document.createElement('span');
  idEl.className = 'problem-id';
  idEl.textContent = '#' + p.id;

  const mainCol = document.createElement('div');
  mainCol.className = 'problem-main';

  const titleEl = document.createElement('span');
  titleEl.className = 'problem-title';
  titleEl.textContent = p.title;

  const hints = Array.isArray(p.hints) ? p.hints : [];
  if (hints[0]) {
    const preview = document.createElement('span');
    preview.className = 'problem-hint-preview';
    preview.textContent = hints[0];
    mainCol.append(titleEl, preview);
  } else {
    mainCol.append(titleEl);
  }

  const catEl = document.createElement('span');
  catEl.className = 'problem-cat';
  catEl.textContent = p.category;

  const badge = createMasteryBadge(p);

  const quick = document.createElement('div');
  quick.className = 'problem-quick';

  const cardBtn = document.createElement('button');
  cardBtn.type = 'button';
  cardBtn.className = 'btn-quick';
  cardBtn.textContent = '卡片';
  cardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('card mode (stub)', p.id);
  });

  const quizBtn = document.createElement('button');
  quizBtn.type = 'button';
  quizBtn.className = 'btn-quick';
  quizBtn.textContent = '测验';
  quizBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('quiz mode (stub)', p.id);
  });

  quick.append(cardBtn, quizBtn);

  row.append(idEl, mainCol, catEl, badge, quick);
  return row;
}

function renderProblemList() {
  const main = $('main');
  if (!main || !catalog) return;

  const problems = filteredProblems();
  main.replaceChildren();

  const header = document.createElement('div');
  header.className = 'list-header';

  const h2 = document.createElement('h2');
  h2.textContent = state.selectedCategory ?? '全部题目';

  const meta = document.createElement('span');
  meta.className = 'list-meta';
  meta.textContent = `${problems.length} 题`;

  header.append(h2, meta);
  main.appendChild(header);

  if (problems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const hasSearch = state.searchQuery.trim();
    const hasFilter = state.masteryFilter !== 'all';
    empty.textContent =
      hasSearch || hasFilter ? '没有匹配的题目' : '该分类暂无题目';
    main.appendChild(empty);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'problem-list';

  for (const p of problems) {
    const idKey = String(p.id);
    const expanded = state.expandedId === idKey;

    const li = document.createElement('li');
    li.className = 'problem-row' + (expanded ? ' is-expanded' : '');
    li.dataset.id = idKey;
    li.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    const summary = buildCollapsedRow(p);
    summary.addEventListener('click', (e) => {
      // ignore clicks that already stopped (quick buttons)
      if (e.target.closest('button, a')) return;
      if (state.expandedId === idKey) {
        state.expandedId = null;
      } else {
        state.expandedId = idKey;
        // code stays collapsed when first expanding unless previously open
      }
      renderProblemList();
    });

    li.appendChild(summary);

    if (expanded) {
      const detail = buildExpandedBody(p);
      li.appendChild(detail);
    }

    ul.appendChild(li);
  }

  main.appendChild(ul);
}

/**
 * Count mastery over ALL catalog problems (not filtered).
 * Orphan keys in localStorage for deleted ids are ignored.
 * Missing / invalid keys count as unknown.
 * @returns {{ known: number, fuzzy: number, unknown: number }}
 */
function countMasteryAll() {
  const counts = { known: 0, fuzzy: 0, unknown: 0 };
  if (!catalog) return counts;
  for (const p of catalog.problems) {
    const level = getMastery(p.id);
    counts[level] += 1;
  }
  return counts;
}

function renderStats() {
  const stats = $('stats');
  if (!stats || !catalog) return;
  const { known, fuzzy, unknown } = countMasteryAll();
  stats.textContent = `记住了 ${known} · 模糊 ${fuzzy} · 不会 ${unknown}`;
  stats.title = `全部 ${catalog.problems.length} 题 · 记住了 ${known} · 模糊 ${fuzzy} · 不会 ${unknown}`;
}

/**
 * @param {{ categories: Array, problems: Array }} cat
 */
function render(cat) {
  catalog = cat;
  renderCategories();
  renderFilterChips();
  renderProblemList();
  renderStats();
}

function bindSearch() {
  const input = $('search');
  if (!input) return;

  let timer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      state.searchQuery = input.value;
      state.expandedId = null;
      renderProblemList();
      renderStats();
    }, 120);
  });
}

async function main() {
  initTheme();
  loadMastery();
  bindSearch();
  bindFilterChips();

  const res = await fetch('./problems.json');
  if (!res.ok) throw new Error('failed to load problems.json');
  const data = await res.json();
  render(data);
}

main().catch((err) => {
  const mainEl = document.getElementById('main');
  if (mainEl) mainEl.textContent = '加载失败，请刷新或检查部署。';
  console.error(err);
});
