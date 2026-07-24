/**
 * Shared Lucide icon layer for study + list surfaces.
 * Uses lucide ESM CDN; ships real SVG into chrome slots.
 */

const LUCIDE_ESM = 'https://cdn.jsdelivr.net/npm/lucide@0.469.0/+esm';

/** Canonical icon names used across the product chrome. */
export const ICON = Object.freeze({
  sun: 'sun',
  moon: 'moon',
  search: 'search',
  library: 'library',
  layers: 'layers',
  x: 'x',
  chevronLeft: 'chevron-left',
  chevronRight: 'chevron-right',
  shuffle: 'shuffle',
  dices: 'dices',
  filter: 'filter',
  copy: 'copy',
  check: 'check',
  externalLink: 'external-link',
  eye: 'eye',
  rotateCcw: 'rotate-ccw',
  sparkles: 'sparkles',
  bookOpen: 'book-open',
  list: 'list',
});

/** Theme toggle: light theme shows sun, dark shows moon. */
export function themeIconName(theme) {
  return theme === 'light' ? ICON.sun : ICON.moon;
}

/** kebab-case → PascalCase for lucide icon registry keys */
export function toPascalCase(name) {
  return String(name)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

let lucideMod = null;
let loadPromise = null;

/**
 * Load lucide ESM once.
 * @returns {Promise<{ createIcons?: Function, icons: Record<string, unknown>, createElement: Function }>}
 */
export function loadLucide() {
  if (lucideMod) return Promise.resolve(lucideMod);
  if (!loadPromise) {
    loadPromise = import(LUCIDE_ESM)
      .then((mod) => {
        lucideMod = mod;
        return mod;
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }
  return loadPromise;
}

/**
 * Paint a single element that has data-lucide.
 * @param {Element} el
 * @param {{ icons: Record<string, unknown>, createElement: Function }} mod
 */
function paintIconElement(el, mod) {
  const name = el.getAttribute('data-lucide');
  if (!name) return false;
  const key = toPascalCase(name);
  const iconNode = mod.icons?.[key];
  if (!iconNode || typeof mod.createElement !== 'function') return false;
  try {
    const svg = mod.createElement(iconNode);
    if (!svg) return false;
    if (svg instanceof Element) {
      svg.classList.add('lucide-icon');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('stroke-width', '1.75');
      el.replaceChildren(svg);
      return true;
    }
    // Some builds return markup string
    if (typeof svg === 'string') {
      el.innerHTML = svg;
      const child = el.firstElementChild;
      if (child) {
        child.classList.add('lucide-icon');
        child.setAttribute('aria-hidden', 'true');
      }
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Collect all [data-lucide] under a root.
 * @param {ParentNode} root
 * @returns {Element[]}
 */
function collectIconHosts(root) {
  /** @type {Element[]} */
  const list = [];
  if (root instanceof Element && root.hasAttribute?.('data-lucide')) {
    list.push(root);
  }
  const scope = root instanceof Document ? root : root;
  const found = scope.querySelectorAll?.('[data-lucide]');
  if (found) list.push(...found);
  return list;
}

/**
 * Mount / refresh all `[data-lucide]` icons under root.
 * @param {ParentNode} [root=document]
 */
export async function mountIcons(root = document) {
  const mod = await loadLucide();

  // Prefer official createIcons when available (document-wide scan)
  if (typeof mod.createIcons === 'function' && mod.icons) {
    try {
      mod.createIcons({
        icons: mod.icons,
        attrs: {
          class: 'lucide-icon',
          'stroke-width': '1.75',
          'aria-hidden': 'true',
        },
        nameAttr: 'data-lucide',
      });
    } catch {
      /* fall through to manual paint */
    }
  }

  // Always paint under the provided root so dynamic slots are covered
  for (const el of collectIconHosts(root)) {
    paintIconElement(el, mod);
  }
}

/**
 * Set icon on an element (replaces children with Lucide SVG).
 * @param {Element | null} el
 * @param {string} name kebab-case lucide name
 */
export async function setIcon(el, name) {
  if (!el) return;
  el.setAttribute('data-lucide', name);
  const mod = await loadLucide();
  paintIconElement(el, mod);
}

/**
 * Ensure a button/slot shows a Lucide icon for the current theme.
 * @param {Element | null} el host with optional .theme-icon child or self
 * @param {'light' | 'dark'} theme
 */
export async function applyThemeIcon(el, theme) {
  if (!el) return;
  const slot =
    el.querySelector?.('.theme-icon, [data-lucide], .icon-slot') || el;
  await setIcon(slot, themeIconName(theme));
}

/**
 * Create a span that holds a Lucide icon (for dynamic HTML strings).
 * @param {string} name
 * @param {string} [className='icon-slot']
 */
export function iconAttr(name, className = 'icon-slot') {
  return `<span class="${className}" data-lucide="${name}" aria-hidden="true"></span>`;
}
