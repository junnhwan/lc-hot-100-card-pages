const MASTER_KEY = 'lc-hot100-mastery';
const THEME_KEY = 'lc-hot100-theme';

const MASTERY_LABELS = {
  unknown: '不会',
  fuzzy: '模糊',
  known: '记住了',
};

/** @type {{ categories: Array<{name:string,count:number}>, problems: Array<object> } | null} */
let catalog = null;

/** @type {Record<string, 'unknown'|'fuzzy'|'known'>} */
let masteryMap = {};

const state = {
  category: 'all',
  masteryFilter: 'all',
  /** @type {object[]} */
  deck: [],
  index: 0,
  flipped: false,
  hintsOpen: true,
  codeOpen: false,
};

function $(id) {
  return document.getElementById(id);
}

function loadMastery() {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    masteryMap = raw ? JSON.parse(raw) || {} : {};
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

function setMastery(id, level) {
  masteryMap[String(id)] = level;
  saveMastery();
}

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  const hljsLink = $('hljs-theme');
  if (hljsLink) {
    hljsLink.href =
      next === 'light'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css';
  }
  const btn = $('theme-toggle');
  if (btn) {
    const icon = btn.querySelector('.theme-icon');
    if (icon) icon.textContent = next === 'light' ? '☀' : '☾';
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
  if (mf === 'stub') {
    list = list.filter((p) => p.status === 'stub');
  } else if (mf === 'unknown' || mf === 'fuzzy' || mf === 'known') {
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
      if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
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
    state.index = Math.min(state.index, list.length - 1);
  }
}

function currentProblem() {
  return state.deck[state.index] || null;
}

function fillCategorySelect() {
  const sel = $('cat-select');
  if (!sel || !catalog) return;
  const prev = state.category;
  sel.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = `全部 (${catalog.problems.length})`;
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
  const el = $('study-stats');
  if (el) {
    el.innerHTML = `记住 <strong>${known}</strong> · 模糊 <strong>${fuzzy}</strong> · 不会 <strong>${unknown}</strong>`;
  }
}

function setFlipped(on) {
  state.flipped = !!on;
  const card = $('flashcard');
  if (card) card.dataset.flipped = state.flipped ? 'true' : 'false';
}

function renderProgress() {
  const el = $('progress-text');
  if (!el) return;
  if (!state.deck.length) {
    el.textContent = '0 / 0';
    return;
  }
  el.innerHTML = `${state.index + 1} <span>/</span> ${state.deck.length}`;
}

function renderMasteryButtons(p) {
  const wrap = $('mastery-btns');
  if (!wrap || !p) return;
  const level = getMastery(p.id);
  for (const btn of wrap.querySelectorAll('.m-btn')) {
    const l = btn.getAttribute('data-level');
    btn.classList.toggle('is-active', l === level);
  }
}

function fillList(ul, items) {
  ul.replaceChildren();
  for (const t of items) {
    const li = document.createElement('li');
    li.textContent = t;
    ul.append(li);
  }
}

function renderCode(p) {
  const codePanel = $('code-panel');
  const stubPanel = $('stub-panel');
  const codeEl = $('back-code');
  const toggle = $('btn-toggle-code');
  if (!codePanel || !stubPanel || !codeEl || !toggle) return;

  if (p.status === 'stub' || !p.code) {
    codePanel.hidden = true;
    stubPanel.hidden = false;
    toggle.hidden = true;
    return;
  }

  stubPanel.hidden = true;
  toggle.hidden = false;
  toggle.textContent = state.codeOpen ? '收起代码' : '展开代码';
  codePanel.hidden = !state.codeOpen;
  if (state.codeOpen) {
    codeEl.textContent = p.code;
    if (window.hljs) {
      codeEl.className = 'language-go';
      window.hljs.highlightElement(codeEl);
    }
  }
}

function renderHints(p) {
  const ul = $('back-hints');
  const toggle = $('btn-toggle-hints');
  if (!ul || !toggle) return;
  const hints = Array.isArray(p.hints) ? p.hints : [];
  if (!hints.length) {
    ul.replaceChildren();
    const li = document.createElement('li');
    li.textContent = '暂无要点';
    ul.append(li);
    toggle.hidden = true;
    return;
  }
  toggle.hidden = false;
  toggle.textContent = state.hintsOpen ? '收起' : '展开';
  ul.hidden = !state.hintsOpen;
  if (state.hintsOpen) fillList(ul, hints);
}

function renderNotes(p) {
  const block = $('notes-block');
  const ul = $('back-notes');
  if (!block || !ul) return;
  const notes = Array.isArray(p.notes) ? p.notes : [];
  if (!notes.length) {
    block.hidden = true;
    return;
  }
  block.hidden = false;
  fillList(ul, notes);
}

function renderCard() {
  const p = currentProblem();
  const empty = $('empty');
  const deck = $('deck');
  if (!p) {
    if (empty) empty.hidden = false;
    if (deck) deck.hidden = true;
    renderProgress();
    return;
  }
  if (empty) empty.hidden = true;
  if (deck) deck.hidden = false;

  const m = getMastery(p.id);
  const mLabel = p.status === 'stub' ? '待补全' : MASTERY_LABELS[m];

  $('front-cat').textContent = p.category || '—';
  const fm = $('front-mastery');
  fm.textContent = mLabel;
  fm.dataset.level = p.status === 'stub' ? 'unknown' : m;
  $('front-index').textContent = `${state.index + 1} / ${state.deck.length}`;
  $('front-id').textContent = `#${p.id}`;
  $('front-title').textContent = p.title || '—';

  $('back-cat').textContent = p.category || '—';
  $('back-title').textContent = `#${p.id}  ${p.title || ''}`;
  const lc = $('back-lc');
  if (lc) {
    lc.href = p.url || '#';
    lc.style.display = p.url ? '' : 'none';
  }

  renderHints(p);
  renderNotes(p);
  renderCode(p);
  renderMasteryButtons(p);
  setFlipped(state.flipped);
  renderProgress();
}

function goTo(index, { resetFlip = true } = {}) {
  if (!state.deck.length) return;
  const n = state.deck.length;
  state.index = ((index % n) + n) % n;
  if (resetFlip) {
    state.flipped = false;
    state.codeOpen = false;
    state.hintsOpen = true;
  }
  // retrigger enter animation when changing cards while on front
  const card = $('flashcard');
  if (card && !state.flipped) {
    card.style.animation = 'none';
    // force reflow
    void card.offsetWidth;
    card.style.animation = '';
  }
  renderCard();
}

function next() {
  goTo(state.index + 1);
}

function prev() {
  goTo(state.index - 1);
}

function randomOne() {
  if (state.deck.length < 2) return;
  let nextIdx = state.index;
  while (nextIdx === state.index) {
    nextIdx = Math.floor(Math.random() * state.deck.length);
  }
  goTo(nextIdx);
}

function shuffleDeck() {
  const keep = currentProblem()?.id ?? null;
  rebuildDeck({ keepId: keep, shuffle: true });
  // after shuffle, jump to a fresh start for ritual feel
  if (state.deck.length) {
    state.index = 0;
    state.flipped = false;
    state.codeOpen = false;
    state.hintsOpen = true;
  }
  renderCard();
}

function bindControls() {
  $('cat-select')?.addEventListener('change', (e) => {
    state.category = e.target.value;
    state.index = 0;
    state.flipped = false;
    state.codeOpen = false;
    rebuildDeck({ shuffle: false });
    renderCard();
  });

  $('mastery-select')?.addEventListener('change', (e) => {
    state.masteryFilter = e.target.value;
    state.index = 0;
    state.flipped = false;
    state.codeOpen = false;
    rebuildDeck({ shuffle: false });
    renderCard();
  });

  $('btn-prev')?.addEventListener('click', prev);
  $('btn-next')?.addEventListener('click', next);
  $('btn-shuffle')?.addEventListener('click', shuffleDeck);
  $('btn-random')?.addEventListener('click', randomOne);

  $('btn-flip-front')?.addEventListener('click', () => {
    setFlipped(true);
  });
  $('btn-flip-back')?.addEventListener('click', () => {
    setFlipped(false);
  });

  $('btn-toggle-hints')?.addEventListener('click', () => {
    state.hintsOpen = !state.hintsOpen;
    const p = currentProblem();
    if (p) renderHints(p);
  });

  $('btn-toggle-code')?.addEventListener('click', () => {
    state.codeOpen = !state.codeOpen;
    const p = currentProblem();
    if (p) renderCode(p);
  });

  $('mastery-btns')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.m-btn');
    if (!btn) return;
    const level = btn.getAttribute('data-level');
    const p = currentProblem();
    if (!p || !level) return;
    setMastery(p.id, level);
    renderStats();
    // if filtered by mastery, deck may shrink
    const keepId = p.id;
    rebuildDeck({ keepId, shuffle: false });
    if (!state.deck.length) {
      renderCard();
      return;
    }
    // stay on same problem if still in deck
    const idx = state.deck.findIndex((x) => String(x.id) === String(keepId));
    if (idx < 0) {
      state.index = Math.min(state.index, state.deck.length - 1);
    } else {
      state.index = idx;
    }
    renderCard();
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      setFlipped(!state.flipped);
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
    }
  });
}

async function main() {
  initTheme();
  loadMastery();
  bindControls();

  const res = await fetch('./problems.json');
  if (!res.ok) throw new Error('failed to load problems.json');
  catalog = await res.json();

  fillCategorySelect();
  rebuildDeck({ shuffle: false });
  renderStats();
  renderCard();
}

main().catch((err) => {
  console.error(err);
  const title = $('front-title');
  if (title) title.textContent = '加载失败，请刷新';
});
