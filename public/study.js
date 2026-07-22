/**
 * Anki-style single-card study page.
 * Event delegation only — no fragile per-button rebinding.
 * Front/back via re-render + CSS fade (no 3D).
 */
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
  codeOpen: true, // answer side: code expanded by default
  animating: false,
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

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  const link = $('hljs-theme');
  if (link) {
    link.href =
      next === 'light'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css';
  }
  const btn = $('btn-theme');
  if (btn) btn.textContent = next === 'light' ? '☀' : '☾';
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
      <div class="front-top">
        <span class="badge">${escapeHtml(p.category || '—')}</span>
        <span class="badge ${mClass}">${escapeHtml(mLabel)}</span>
      </div>
      <div class="front-body">
        <div class="pid">#${escapeHtml(p.id)}</div>
        <h1 class="ptitle">${escapeHtml(p.title || '')}</h1>
        <p class="hint">想好后再显示答案</p>
      </div>
      <button type="button" class="reveal" data-act="show" title="快捷键 空格">显示答案 <span class="btn-kbd">空格</span></button>
    </div>
  `;
}

function backHtml(p) {
  const m = getMastery(p.id);
  const hints = Array.isArray(p.hints) ? p.hints : [];
  const notes = Array.isArray(p.notes) ? p.notes : [];
  const hasCode = p.status !== 'stub' && !!p.code;

  let codeSection = '';
  if (!hasCode) {
    codeSection = `<div class="stub">待补全 — 笔记里还没有代码</div>`;
  } else if (state.codeOpen) {
    codeSection = `
      <div class="code-head">
        <h3>题解代码</h3>
        <button type="button" class="ghost" data-act="toggle-code">收起</button>
      </div>
      <pre class="codebox"><code class="language-go" id="code-el"></code></pre>
    `;
  } else {
    codeSection = `
      <div class="code-head">
        <h3>题解代码</h3>
        <button type="button" class="ghost" data-act="toggle-code">展开代码</button>
      </div>
    `;
  }

  const notesBlock = notes.length
    ? `<div class="block"><h3>易错 / 补充</h3><ul>${listHtml(notes)}</ul></div>`
    : '';

  const lc = p.url
    ? `<a class="ghost" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">LeetCode</a>`
    : '';

  return `
    <div class="back">
      <div class="back-head">
        <h2 class="back-title">#${escapeHtml(p.id)} ${escapeHtml(p.title || '')}</h2>
        <div class="back-actions">
          ${lc}
          <button type="button" class="ghost" data-act="hide" title="快捷键 空格">回到正面 <span class="btn-kbd">空格</span></button>
        </div>
      </div>
      <div class="scroll">
        <div class="block">
          <h3>思路要点</h3>
          <ul>${listHtml(hints)}</ul>
        </div>
        ${notesBlock}
        <div class="block">${codeSection}</div>
      </div>
      <div class="rate">
        <button type="button" class="again ${m === 'unknown' ? 'is-on' : ''}" data-act="rate" data-level="unknown" title="快捷键 1">不会 <span class="btn-kbd">1</span></button>
        <button type="button" class="hard ${m === 'fuzzy' ? 'is-on' : ''}" data-act="rate" data-level="fuzzy" title="快捷键 2">模糊 <span class="btn-kbd">2</span></button>
        <button type="button" class="good ${m === 'known' ? 'is-on' : ''}" data-act="rate" data-level="known" title="快捷键 3">记住了 <span class="btn-kbd">3</span></button>
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
    if (p && codeEl && state.codeOpen && p.code) {
      codeEl.textContent = p.code;
      if (window.hljs) {
        try {
          window.hljs.highlightElement(codeEl);
        } catch {
          /* ignore */
        }
      }
    }
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
    state.animating = false;
    face.classList.remove('is-leaving');
  }

  if (!animate) {
    apply(false);
    return;
  }

  state.animating = true;
  face.classList.add('is-leaving');
  state.animTimer = setTimeout(() => {
    state.animTimer = null;
    state.animating = false;
    apply(true);
  }, 160);
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
  state.codeOpen = true;
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
  state.codeOpen = true;
  render({ animate: true });
}

function showAnswer() {
  state.showing = 'back';
  state.codeOpen = true; // default expanded when revealing answer
  render({ animate: true });
}

function hideAnswer() {
  state.showing = 'front';
  state.codeOpen = true;
  render({ animate: true });
}

function toggleCode() {
  state.codeOpen = !state.codeOpen;
  // no leave animation for code toggle — keep side
  render({ animate: false });
}

function rate(level) {
  const p = current();
  if (!p) return;
  setMastery(p.id, level);
  const keepId = p.id;
  rebuildDeck({ keepId });
  if (!state.deck.length) {
    render({ animate: false });
    return;
  }
  const idx = state.deck.findIndex((x) => String(x.id) === String(keepId));
  state.index = idx >= 0 ? idx : Math.min(state.index, state.deck.length - 1);
  // Anki-like: after rating, go next
  if (state.deck.length > 1) {
    // move to next in deck after current
    const nextIdx = (state.index + 1) % state.deck.length;
    state.index = nextIdx;
    state.showing = 'front';
    state.codeOpen = true;
    render({ animate: true });
  } else {
    render({ animate: false });
  }
}

function fillCategories() {
  const sel = $('cat');
  if (!sel || !catalog) return;
  const prev = state.category;
  sel.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = `全部分类 (${catalog.problems.length})`;
  sel.append(all);
  for (const c of catalog.categories) {
    const o = document.createElement('option');
    o.value = c.name;
    o.textContent = `${c.name} (${c.count})`;
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
  state.codeOpen = true;
  rebuildDeck();
  render({ animate: true });
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
      case 'toggle-code':
        toggleCode();
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
    applyTheme(cur === 'light' ? 'dark' : 'light');
  });

  $('cat')?.addEventListener('change', (e) => {
    state.category = e.target.value;
    onFilter();
  });
  $('mastery')?.addEventListener('change', (e) => {
    state.masteryFilter = e.target.value;
    onFilter();
  });

  document.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (state.showing === 'front') showAnswer();
      else hideAnswer();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'j') {
      e.preventDefault();
      next();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'k') {
      e.preventDefault();
      prev();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      randomOne();
      return;
    }
    if (state.showing === 'back') {
      if (e.key === '1') {
        e.preventDefault();
        rate('unknown');
      } else if (e.key === '2') {
        e.preventDefault();
        rate('fuzzy');
      } else if (e.key === '3') {
        e.preventDefault();
        rate('known');
      }
    }
  });
}

async function main() {
  initTheme();
  loadMastery();
  bind();

  const res = await fetch('./problems.json');
  if (!res.ok) throw new Error('problems.json load failed');
  catalog = await res.json();
  if (!catalog?.problems?.length) throw new Error('empty catalog');

  fillCategories();
  rebuildDeck();
  render({ animate: false });
}

main().catch((err) => {
  console.error(err);
  const empty = $('empty');
  if (empty) {
    empty.hidden = false;
    empty.textContent = '加载失败，请刷新页面';
  }
});
