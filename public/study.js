const MASTER_KEY = 'lc-hot100-mastery';
const THEME_KEY = 'lc-hot100-theme';

const MASTERY_LABELS = {
  unknown: '不会',
  fuzzy: '模糊',
  known: '记住了',
};

/** @type {{ categories: Array<{name:string,count:number,order:number}>, problems: Array<object> } | null} */
let catalog = null;
/** @type {Record<string, 'unknown'|'fuzzy'|'known'>} */
let masteryMap = {};

const state = {
  category: 'all',
  masteryFilter: 'all',
  /** @type {object[]} */
  deck: [],
  index: 0,
  side: 'front', // front | back
  codeOpen: false,
};

function $(id) {
  return document.getElementById(id);
}

function loadMastery() {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    masteryMap = raw ? JSON.parse(raw) || {} : {};
    if (typeof masteryMap !== 'object' || masteryMap === null) masteryMap = {};
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
  if (v === 'fuzzy' || v === 'known' || v === 'unknown') return v;
  return 'unknown';
}

function setMasteryValue(id, level) {
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
  const btn = $('theme-toggle');
  if (btn) {
    btn.textContent = next === 'light' ? '☀' : '☾';
    btn.title = next === 'light' ? '切换到深色' : '切换到浅色';
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

function filteredBase() {
  if (!catalog) return [];
  let list = catalog.problems.slice();
  if (state.category !== 'all') {
    list = list.filter((p) => p.category === state.category);
  }
  const mf = state.masteryFilter;
  if (mf === 'stub') list = list.filter((p) => p.status === 'stub');
  else if (mf === 'unknown' || mf === 'fuzzy' || mf === 'known') {
    list = list.filter((p) => getMastery(p.id) === mf);
  }
  return list;
}

function rebuildDeck({ keepId = null, shuffle = false } = {}) {
  let list = filteredBase();
  if (shuffle) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  } else {
    list.sort((a, b) => {
      const ao = a.categoryOrder ?? 0;
      const bo = b.categoryOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return Number(a.id) - Number(b.id);
    });
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

function fillCategories() {
  const sel = $('cat-select');
  if (!sel || !catalog) return;
  const prev = state.category;
  sel.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = `全部分类 (${catalog.problems.length})`;
  sel.append(all);
  for (const c of catalog.categories) {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = `${c.name} (${c.count})`;
    sel.append(opt);
  }
  sel.value = prev;
  if (sel.value !== prev) {
    state.category = 'all';
    sel.value = 'all';
  }
}

function renderStats() {
  if (!catalog) return;
  let known = 0;
  let fuzzy = 0;
  let unknown = 0;
  for (const p of catalog.problems) {
    const m = getMastery(p.id);
    if (m === 'known') known++;
    else if (m === 'fuzzy') fuzzy++;
    else unknown++;
  }
  const el = $('stats');
  if (el) el.innerHTML = `记 <b>${known}</b> · 模 <b>${fuzzy}</b> · 不 <b>${unknown}</b>`;
}

function fillList(ul, items) {
  ul.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = '暂无';
    ul.append(li);
    return;
  }
  for (const t of items) {
    const li = document.createElement('li');
    li.textContent = String(t);
    ul.append(li);
  }
}

function showSide(side) {
  state.side = side === 'back' ? 'back' : 'front';
  const front = $('side-front');
  const back = $('side-back');
  const card = $('card');
  if (!front || !back || !card) return;
  const isBack = state.side === 'back';
  front.hidden = isBack;
  back.hidden = !isBack;
  card.dataset.side = state.side;
}

function renderCode(p) {
  const wrap = $('code-wrap');
  const stub = $('stub-wrap');
  const btn = $('btn-code');
  const codeEl = $('back-code');
  if (!wrap || !stub || !btn || !codeEl) return;

  if (p.status === 'stub' || !p.code) {
    wrap.hidden = true;
    stub.hidden = false;
    btn.hidden = true;
    return;
  }

  stub.hidden = true;
  btn.hidden = false;
  btn.textContent = state.codeOpen ? '收起代码' : '展开代码';
  wrap.hidden = !state.codeOpen;
  if (state.codeOpen) {
    codeEl.textContent = p.code;
    if (window.hljs) {
      codeEl.className = 'language-go';
      try {
        window.hljs.highlightElement(codeEl);
      } catch {
        /* ignore */
      }
    }
  }
}

function renderMastery(p) {
  const level = getMastery(p.id);
  const wrap = $('mastery-btns');
  if (!wrap) return;
  for (const btn of wrap.querySelectorAll('.m-btn')) {
    btn.classList.toggle('is-active', btn.getAttribute('data-level') === level);
  }
}

function renderCard() {
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
  if (progress) progress.textContent = `${state.index + 1} / ${state.deck.length}`;

  const m = getMastery(p.id);
  const mLabel = p.status === 'stub' ? '待补全' : MASTERY_LABELS[m];

  $('front-cat').textContent = p.category || '—';
  const fm = $('front-mastery');
  fm.textContent = mLabel;
  fm.dataset.level = p.status === 'stub' ? 'unknown' : m;
  $('front-pos').textContent = `${state.index + 1} / ${state.deck.length}`;
  $('front-id').textContent = `#${p.id}`;
  $('front-title').textContent = p.title || '—';

  $('back-cat').textContent = p.category || '—';
  $('back-title').textContent = `#${p.id}  ${p.title || ''}`;
  const lc = $('back-lc');
  if (lc) {
    if (p.url) {
      lc.href = p.url;
      lc.hidden = false;
    } else {
      lc.hidden = true;
    }
  }

  fillList($('back-hints'), Array.isArray(p.hints) ? p.hints : []);

  const notes = Array.isArray(p.notes) ? p.notes : [];
  const notesPanel = $('notes-panel');
  if (notesPanel) {
    if (notes.length) {
      notesPanel.hidden = false;
      fillList($('back-notes'), notes);
    } else {
      notesPanel.hidden = true;
    }
  }

  renderCode(p);
  renderMastery(p);
  showSide(state.side);
}

function goTo(index) {
  if (!state.deck.length) return;
  const n = state.deck.length;
  state.index = ((index % n) + n) % n;
  state.side = 'front';
  state.codeOpen = false;
  renderCard();
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

function shuffleDeck() {
  rebuildDeck({ shuffle: true });
  state.index = 0;
  state.side = 'front';
  state.codeOpen = false;
  renderCard();
}

function onFilterChange() {
  state.index = 0;
  state.side = 'front';
  state.codeOpen = false;
  rebuildDeck({ shuffle: false });
  renderCard();
}

function bind() {
  $('cat-select')?.addEventListener('change', (e) => {
    state.category = e.target.value;
    onFilterChange();
  });
  $('mastery-select')?.addEventListener('change', (e) => {
    state.masteryFilter = e.target.value;
    onFilterChange();
  });

  $('btn-prev')?.addEventListener('click', prev);
  $('btn-next')?.addEventListener('click', next);
  $('btn-shuffle')?.addEventListener('click', shuffleDeck);
  $('btn-random')?.addEventListener('click', randomOne);

  // Reliable show/hide — no 3D hit-testing issues
  $('btn-show')?.addEventListener('click', () => {
    state.side = 'back';
    renderCard();
  });
  $('btn-hide')?.addEventListener('click', () => {
    state.side = 'front';
    renderCard();
  });

  $('btn-code')?.addEventListener('click', () => {
    state.codeOpen = !state.codeOpen;
    const p = current();
    if (p) renderCode(p);
  });

  $('mastery-btns')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.m-btn');
    if (!btn) return;
    const level = btn.getAttribute('data-level');
    const p = current();
    if (!p || !level) return;
    setMasteryValue(p.id, level);
    renderStats();
    const keepId = p.id;
    rebuildDeck({ keepId });
    if (!state.deck.length) {
      renderCard();
      return;
    }
    const idx = state.deck.findIndex((x) => String(x.id) === String(keepId));
    state.index = idx >= 0 ? idx : Math.min(state.index, state.deck.length - 1);
    renderCard();
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') {
      // still allow shortcuts when focus not in text field except space on buttons
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    }
    if (e.key === ' ' || e.code === 'Space') {
      if (tag === 'BUTTON') return;
      e.preventDefault();
      state.side = state.side === 'front' ? 'back' : 'front';
      renderCard();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
      e.preventDefault();
      next();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      prev();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      randomOne();
    }
  });
}

async function main() {
  initTheme();
  loadMastery();
  bind();

  const res = await fetch('./problems.json');
  if (!res.ok) throw new Error('load failed');
  catalog = await res.json();
  if (!catalog?.problems?.length) throw new Error('empty catalog');

  fillCategories();
  rebuildDeck();
  renderStats();
  renderCard();
}

main().catch((err) => {
  console.error(err);
  const t = $('front-title');
  if (t) t.textContent = '加载失败，请刷新';
  const card = $('card');
  if (card) card.hidden = false;
  const front = $('side-front');
  if (front) front.hidden = false;
});
