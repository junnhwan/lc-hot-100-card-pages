const MASTER_KEY = 'lc-hot100-mastery'; // for later tasks
const THEME_KEY = 'lc-hot100-theme';

/** @type {{ selectedCategory: string | null, searchQuery: string }} */
const state = {
  selectedCategory: null, // null = all
  searchQuery: '',
};

/** @type {{ categories: Array<{name:string,count:number,order:number}>, problems: Array<object> } | null} */
let catalog = null;

function $(id) {
  return document.getElementById(id);
}

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
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

  return list;
}

function setCategory(name) {
  state.selectedCategory = name;
  render(catalog);
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
    empty.textContent = state.searchQuery.trim()
      ? '没有匹配的题目'
      : '该分类暂无题目';
    main.appendChild(empty);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'problem-list';

  for (const p of problems) {
    const li = document.createElement('li');
    li.className = 'problem-row';
    li.dataset.id = String(p.id);

    const idEl = document.createElement('span');
    idEl.className = 'problem-id';
    idEl.textContent = p.id;

    const titleEl = document.createElement('span');
    titleEl.className = 'problem-title';
    titleEl.textContent = p.title;

    const catEl = document.createElement('span');
    catEl.className = 'problem-cat';
    catEl.textContent = p.category;

    li.append(idEl, titleEl, catEl);
    ul.appendChild(li);
  }

  main.appendChild(ul);
}

function renderStats() {
  const stats = $('stats');
  if (!stats || !catalog) return;
  const shown = filteredProblems().length;
  const total = catalog.problems.length;
  stats.textContent =
    shown === total ? `${total} 题` : `${shown} / ${total} 题`;
}

/**
 * @param {{ categories: Array, problems: Array }} cat
 */
function render(cat) {
  catalog = cat;
  renderCategories();
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
      renderProblemList();
      renderStats();
    }, 120);
  });
}

async function main() {
  initTheme();
  bindSearch();

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
