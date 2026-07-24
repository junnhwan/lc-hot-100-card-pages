/**
 * Anki-style single-card study page.
 * Event delegation only — no fragile per-button rebinding.
 * Front/back via re-render + spring face motion.
 */
import { applyThemeIcon, iconAttr, mountIcons, ICON } from './ui-icons.js';
import { installAmbient } from './ui-ambient.js';
import { MOTION, motionMs, runThemeTransition } from './ui-motion.js';

const MASTER_KEY = 'lc-hot100-mastery';
const THEME_KEY = 'lc-hot100-theme';

const LABEL = { unknown: '不会', fuzzy: '模糊', known: '记住了' };

/** @type {{ categories: any[], problems: any[] } | null} */
let catalog = null;
/** @type {Record<string, string>} */
let masteryMap = {};

const state = {
  category: 'all',
  masteryFilter: 'all',
  deck: /** @type {any[]} */ ([]),
  index: 0,
  showing: 'front', // front | back
  /** @type {ReturnType<typeof setTimeout> | null} */
  animTimer: null,
};

const $ = (id) => document.getElementById(id);

function loadMastery() {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    masteryMap = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    masteryMap = {};
  }
}

function saveMastery() {
  try {
    localStorage.setItem(MASTER_KEY, JSON.stringify(masteryMap));
  } catch {
    /* ignore */
  }
}

function getMastery(id) {
  const v = masteryMap[String(id)];
  return v === 'known' || v === 'fuzzy' || v === 'unknown' ? v : 'unknown';
}

function setMastery(id, level) {
  masteryMap[String(id)] = level;
  saveMastery();
}

function applyTheme(theme, { animate = false } = {}) {
  const next = theme === 'light' ? 'light' : 'dark';
  if (animate) runThemeTransition();
  document.documentElement.setAttribute('data-theme', next);
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    next === 'light' ? '#f3efe6' : '#06080c'
  );
  const link = $('hljs-theme');
  if (link) {
    link.href =
      next === 'light'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css';
  }
  applyThemeIcon($('btn-theme'), next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }
}

function initTheme() {
  let theme = 'dark';
  try {
    const s = localStorage.getItem(THEME_KEY);
    if (s === 'light' || s === 'dark') theme = s;
  } catch {
    /* ignore */
  }
  applyTheme(theme);
}

function filtered() {
  if (!catalog) return [];
  let list = catalog.problems.slice();
  if (state.category !== 'all') list = list.filter((p) => p.category === state.category);
  const mf = state.masteryFilter;
  if (mf === 'stub') list = list.filter((p) => p.status === 'stub');
  else if (mf === 'unknown' || mf === 'fuzzy' || mf === 'known') {
    list = list.filter((p) => getMastery(p.id) === mf);
  }
  return list;
}

function rebuildDeck({ keepId = null, shuffle = false } = {}) {
  let list = filtered();
  if (shuffle) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  } else {
    list.sort((a, b) => (a.categoryOrder - b.categoryOrder) || (Number(a.id) - Number(b.id)));
  }
  state.deck = list;
  if (!list.length) {
    state.index = 0;
    return;
  }
  if (keepId != null) {
    const idx = list.findIndex((p) => String(p.id) === String(keepId));
    state.index = idx >= 0 ? idx : 0;
  } else {
    state.index = Math.min(Math.max(0, state.index), list.length - 1);
  }
}

function current() {
  return state.deck[state.index] || null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listHtml(items) {
  if (!items?.length) return '<li>暂无</li>';
  return items.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
}

function frontHtml(p) {
  const m = getMastery(p.id);
  const mLabel = p.status === 'stub' ? '待补全' : LABEL[m];
  const mClass = p.status === 'stub' ? 'm-unknown' : `m-${m}`;
  return `
    <div class="front">
      <div class="front-watermark" aria-hidden="true">${escapeHtml(p.id)}</div>
      <div class="front-top">
        <span class="badge">${escapeHtml(p.category || '—')}</span>
        <span class="badge ${mClass}">${escapeHtml(mLabel)}</span>
      </div>
      <div class="front-body">
        <div class="pid">#${escapeHtml(p.id)}</div>
        <h1 class="ptitle">${escapeHtml(p.title || '')}</h1>
        <p class="hint">想好后再显示答案</p>
      </div>
      <button type="button" class="reveal" data-act="show" title="快捷键 空格">
        ${iconAttr(ICON.eye)}
        <span>显示答案</span>
        <span class="btn-kbd desktop-only">空格</span>
      </button>
    </div>
  `;
}

function backHtml(p) {
  const m = getMastery(p.id);
  const hints = Array.isArray(p.hints) ? p.hints : [];
  const notes = Array.isArray(p.notes) ? p.notes : [];
  const hasCode = p.status !== 'stub' && !!p.code;

  let codeBody = '';
  if (!hasCode) {
    codeBody = `<div class="stub">待补全 — 笔记里还没有代码</div>`;
  } else {
    // code always shown on answer side; only this pane scrolls when long
    codeBody = `<pre class="codebox"><code class="language-go" id="code-el"></code></pre>`;
  }

  const notesBlock = notes.length
    ? `<div class="subblock"><h4>易错 / 补充</h4><ul>${listHtml(notes)}</ul></div>`
    : '';

  const codeTitle = hasCode
    ? `<div class="pane-head">
          <h3 class="pane-title">题解代码</h3>
          <button type="button" class="ghost copy-btn" data-act="copy-code" title="复制代码">
            ${iconAttr(ICON.copy)}
            <span class="copy-label">复制</span>
          </button>
        </div>`
    : `<h3 class="pane-title">题解代码</h3>`;

  const lcBtn = p.url
    ? `<a class="ghost" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">
        ${iconAttr(ICON.externalLink)}
        <span>LeetCode</span>
      </a>`
    : '';

  return `
    <div class="back">
      <div class="back-head">
        <div class="back-head-main">
          <span class="badge">${escapeHtml(p.category || '—')}</span>
          <h2 class="back-title">#${escapeHtml(p.id)} ${escapeHtml(p.title || '')}</h2>
        </div>
        <div class="back-actions">
          ${lcBtn}
          <button type="button" class="ghost" data-act="hide" title="快捷键 空格">
            ${iconAttr(ICON.rotateCcw)}
            <span>回到正面</span>
            <span class="btn-kbd desktop-only">空格</span>
          </button>
        </div>
      </div>
      <div class="split">
        <section class="pane pane-left">
          <h3 class="pane-title">思路要点</h3>
          <ul class="pane-list">${listHtml(hints)}</ul>
          ${notesBlock}
        </section>
        <section class="pane pane-right">
          ${codeTitle}
          ${codeBody}
        </section>
      </div>
      <div class="rate">
        <button type="button" class="again ${m === 'unknown' ? 'is-on' : ''}" data-act="rate" data-level="unknown" title="快捷键 1">不会 <span class="btn-kbd desktop-only">1</span></button>
        <button type="button" class="hard ${m === 'fuzzy' ? 'is-on' : ''}" data-act="rate" data-level="fuzzy" title="快捷键 2">模糊 <span class="btn-kbd desktop-only">2</span></button>
        <button type="button" class="good ${m === 'known' ? 'is-on' : ''}" data-act="rate" data-level="known" title="快捷键 3">记住了 <span class="btn-kbd desktop-only">3</span></button>
      </div>
    </div>
  `;
}

function paintFace(html, { animate = false } = {}) {
  const face = $('face');
  if (!face) return;

  const apply = (withEnter) => {
    face.innerHTML = html;
    face.classList.remove('is-leaving', 'is-entering');
    // inject code text safely after HTML paint (never put code in template HTML)
    const p = current();
    const codeEl = document.getElementById('code-el');
    if (p && codeEl && p.code) {
      codeEl.textContent = p.code;
      if (window.hljs) {
        try {
          window.hljs.highlightElement(codeEl);
        } catch {
          /* ignore */
        }
      }
    }
    mountIcons(face);
    if (withEnter) {
      face.classList.add('is-entering');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          face.classList.remove('is-entering');
        });
      });
    }
  };

  // Cancel any in-flight leave animation so rapid clicks never stick on opacity:0
  if (state.animTimer != null) {
    clearTimeout(state.animTimer);
    state.animTimer = null;
    face.classList.remove('is-leaving');
  }

  if (!animate) {
    apply(false);
    return;
  }

  face.classList.add('is-leaving');
  state.animTimer = setTimeout(() => {
    state.animTimer = null;
    apply(true);
  }, motionMs(MOTION.faceLeaveMs));
}

function render({ animate = false } = {}) {
  const p = current();
  const empty = $('empty');
  const card = $('card');
  const progress = $('progress');

  if (!p) {
    if (empty) empty.hidden = false;
    if (card) card.hidden = true;
    if (progress) progress.textContent = '0 / 0';
    return;
  }

  if (empty) empty.hidden = true;
  if (card) card.hidden = false;
  if (progress) progress.textContent = `${state.index + 1}  /  ${state.deck.length}`;

  const html = state.showing === 'back' ? backHtml(p) : frontHtml(p);
  const face = $('face');
  if (face) face.dataset.showing = state.showing;
  paintFace(html, { animate });
}

function goTo(i, { animate = true } = {}) {
  if (!state.deck.length) return;
  const n = state.deck.length;
  state.index = ((i % n) + n) % n;
  state.showing = 'front';
  render({ animate });
}

function next() {
  goTo(state.index + 1);
}
function prev() {
  goTo(state.index - 1);
}

function randomOne() {
  if (state.deck.length < 2) {
    goTo(0);
    return;
  }
  let i = state.index;
  while (i === state.index) i = Math.floor(Math.random() * state.deck.length);
  goTo(i);
}

function shuffle() {
  rebuildDeck({ shuffle: true });
  state.index = 0;
  state.showing = 'front';
  render({ animate: true });
}

function showAnswer() {
  state.showing = 'back';
  render({ animate: true });
}

function hideAnswer() {
  state.showing = 'front';
  render({ animate: true });
}

/** Blur focused control so Space / arrows don't double-fire native button activation. */
function blurActiveControl() {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el !== document.body) el.blur();
}

async function copyCode(btn) {
  const p = current();
  if (!p?.code) return;

  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(p.code);
      ok = true;
    }
  } catch {
    ok = false;
  }

  // Fallback for insecure contexts / blocked clipboard API
  if (!ok) {
    try {
      const ta = document.createElement('textarea');
      ta.value = p.code;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      ok = false;
    }
  }

  if (!(btn instanceof HTMLElement)) return;
  const label = btn.querySelector('.copy-label');
  const prev = label?.textContent || '复制';
  if (label) label.textContent = ok ? '已复制' : '复制失败';
  else btn.textContent = ok ? '已复制' : '复制失败';
  btn.classList.toggle('is-copied', ok);
  btn.classList.toggle('is-failed', !ok);
  window.setTimeout(() => {
    // button may have been re-rendered away
    if (document.body.contains(btn)) {
      if (label) label.textContent = prev;
      else btn.textContent = prev;
      btn.classList.remove('is-copied', 'is-failed');
    }
  }, 1200);
}

/**
 * Apply mastery rating, rebuild the filtered deck, then advance.
 * - Card still in deck → go to the next card after it.
 * - Card dropped by filter → stay at old index (next card slides into place).
 * Always show the front of the resulting card.
 */
function rate(level) {
  const p = current();
  if (!p) return;
  const oldIndex = state.index;
  const ratedId = p.id;
  setMastery(ratedId, level);
  rebuildDeck();
  fillCategories(); // counts reflect mastery filter

  if (!state.deck.length) {
    state.index = 0;
    state.showing = 'front';
    render({ animate: false });
    updateFilterToggleLabel();
    return;
  }

  const stillIdx = state.deck.findIndex((x) => String(x.id) === String(ratedId));
  if (stillIdx >= 0) {
    state.index = (stillIdx + 1) % state.deck.length;
  } else {
    // Removed: the card now at oldIndex is already the "next" one.
    state.index = oldIndex >= state.deck.length ? 0 : oldIndex;
  }
  state.showing = 'front';
  render({ animate: true });
  updateFilterToggleLabel();
}

/** Problems matching mastery filter only (ignores category) — for option counts. */
function masteryFilteredProblems() {
  if (!catalog) return [];
  let list = catalog.problems.slice();
  const mf = state.masteryFilter;
  if (mf === 'stub') list = list.filter((p) => p.status === 'stub');
  else if (mf === 'unknown' || mf === 'fuzzy' || mf === 'known') {
    list = list.filter((p) => getMastery(p.id) === mf);
  }
  return list;
}

function fillCategories() {
  const sel = $('cat');
  if (!sel || !catalog) return;
  const prev = state.category;
  const base = masteryFilteredProblems();
  const countByCat = new Map();
  for (const p of base) {
    countByCat.set(p.category, (countByCat.get(p.category) || 0) + 1);
  }

  sel.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = `全部分类 (${base.length})`;
  sel.append(all);
  for (const c of catalog.categories) {
    const o = document.createElement('option');
    o.value = c.name;
    o.textContent = `${c.name} (${countByCat.get(c.name) || 0})`;
    sel.append(o);
  }
  sel.value = prev;
  if (sel.value !== prev) {
    state.category = 'all';
    sel.value = 'all';
  }
}

function onFilter() {
  state.index = 0;
  state.showing = 'front';
  rebuildDeck();
  fillCategories();
  // Mobile: collapse filter panel so the card is fully visible after choosing.
  if (isMobileFiltersMode()) {
    $('filters')?.classList.remove('is-open');
  }
  render({ animate: true });
  updateFilterToggleLabel();
}

function isMobileFiltersMode() {
  return window.matchMedia('(max-width: 860px)').matches;
}

function updateFilterToggleLabel() {
  const btn = $('filter-toggle');
  if (!btn) return;
  const open = $('filters')?.classList.contains('is-open');
  const parts = [];
  if (state.category !== 'all') parts.push(state.category);
  if (state.masteryFilter !== 'all') {
    const map = { unknown: '不会', fuzzy: '模糊', known: '记住了', stub: '待补全' };
    parts.push(map[state.masteryFilter] || state.masteryFilter);
  }
  const base = open ? '收起' : '筛选';
  const label = !open && parts.length ? `筛选 · ${parts.join(' · ')}` : base;
  const labelEl = btn.querySelector('.filter-toggle-label');
  if (labelEl) labelEl.textContent = label;
  else {
    // preserve icon slot if present
    const icon = btn.querySelector('[data-lucide], .icon-slot');
    btn.textContent = label;
    if (icon) btn.prepend(icon);
  }
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function toggleFiltersPanel() {
  const panel = $('filters');
  if (!panel) return;
  panel.classList.toggle('is-open');
  updateFilterToggleLabel();
}

function syncFiltersForViewport() {
  const panel = $('filters');
  if (!panel) return;
  // Desktop: always show. Mobile: collapsed unless user opened it.
  if (!isMobileFiltersMode()) {
    panel.classList.remove('is-open');
  }
  updateFilterToggleLabel();
}

function bind() {
  const app = $('app');
  if (!app) return;

  // Single delegated click handler — never misses re-rendered buttons
  app.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const el = t.closest('[data-act]');
    if (!el) return;
    const act = el.getAttribute('data-act');
    if (!act) return;

    e.preventDefault();

    switch (act) {
      case 'show':
        showAnswer();
        break;
      case 'hide':
        hideAnswer();
        break;
      case 'copy-code':
        copyCode(el);
        break;
      case 'prev':
        prev();
        break;
      case 'next':
        next();
        break;
      case 'random':
        randomOne();
        break;
      case 'shuffle':
        shuffle();
        break;
      case 'toggle-filters':
        toggleFiltersPanel();
        break;
      case 'rate': {
        const level = el.getAttribute('data-level');
        if (level === 'unknown' || level === 'fuzzy' || level === 'known') rate(level);
        break;
      }
      default:
        break;
    }
  });

  $('btn-theme')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'light' ? 'dark' : 'light', { animate: true });
  });

  $('cat')?.addEventListener('change', (e) => {
    state.category = e.target.value;
    onFilter();
    // Blur so ←/→ no longer change <select> options (browser default)
    if (e.target instanceof HTMLElement) e.target.blur();
  });
  $('mastery')?.addEventListener('change', (e) => {
    state.masteryFilter = e.target.value;
    onFilter();
    if (e.target instanceof HTMLElement) e.target.blur();
  });

  window.addEventListener('resize', () => {
    // cheap debounce
    clearTimeout(syncFiltersForViewport._t);
    syncFiltersForViewport._t = setTimeout(syncFiltersForViewport, 120);
  });

  document.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName;
    const onSelect = tag === 'SELECT';
    // Text fields keep native behavior; select is special: ←/→ must switch
    // problems within the current filtered deck, not the category option.
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const isNext = e.key === 'ArrowRight' || e.key === 'j';
    const isPrev = e.key === 'ArrowLeft' || e.key === 'k';

    if (onSelect) {
      if (isNext || isPrev) {
        e.preventDefault();
        if (e.target instanceof HTMLElement) e.target.blur();
        if (isNext) next();
        else prev();
      }
      // leave other keys (arrows up/down, space) to the select
      return;
    }

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      blurActiveControl();
      if (state.showing === 'front') showAnswer();
      else hideAnswer();
      return;
    }
    if (isNext) {
      e.preventDefault();
      blurActiveControl();
      next();
      return;
    }
    if (isPrev) {
      e.preventDefault();
      blurActiveControl();
      prev();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      blurActiveControl();
      randomOne();
      return;
    }
    if (state.showing === 'back') {
      if (e.key === '1') {
        e.preventDefault();
        blurActiveControl();
        rate('unknown');
      } else if (e.key === '2') {
        e.preventDefault();
        blurActiveControl();
        rate('fuzzy');
      } else if (e.key === '3') {
        e.preventDefault();
        blurActiveControl();
        rate('known');
      }
    }
  });
}

async function main() {
  installAmbient({ density: 1, intensity: 1 });
  initTheme();
  loadMastery();
  bind();
  await mountIcons(document);

  const res = await fetch('./problems.json');
  if (!res.ok) throw new Error('problems.json load failed');
  catalog = await res.json();
  if (!catalog?.problems?.length) throw new Error('empty catalog');

  fillCategories();
  rebuildDeck();
  syncFiltersForViewport();
  render({ animate: false });
  document.body.classList.add('is-ready');
}

main().catch((err) => {
  console.error(err);
  const empty = $('empty');
  if (empty) {
    empty.hidden = false;
    empty.textContent = '加载失败，请刷新页面';
  }
});
