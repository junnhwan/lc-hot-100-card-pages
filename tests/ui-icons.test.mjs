/**
 * Unit tests for shipped Lucide icon helpers (real module, no reimplementation).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Import the shipped module under test
const {
  ICON,
  themeIconName,
  toPascalCase,
  iconAttr,
} = await import(pathToFileURL(join(root, 'public/ui-icons.js')).href);

describe('ui-icons shipped helpers', () => {
  it('themeIconName maps light→sun and dark→moon', () => {
    assert.equal(themeIconName('light'), ICON.sun);
    assert.equal(themeIconName('dark'), ICON.moon);
    assert.equal(themeIconName('anything-else'), ICON.moon);
    assert.equal(ICON.sun, 'sun');
    assert.equal(ICON.moon, 'moon');
  });

  it('toPascalCase converts lucide kebab names', () => {
    assert.equal(toPascalCase('chevron-left'), 'ChevronLeft');
    assert.equal(toPascalCase('external-link'), 'ExternalLink');
    assert.equal(toPascalCase('sun'), 'Sun');
    assert.equal(toPascalCase('rotate-ccw'), 'RotateCcw');
  });

  it('iconAttr emits data-lucide markup without emoji', () => {
    const html = iconAttr(ICON.search);
    assert.match(html, /data-lucide="search"/);
    assert.match(html, /aria-hidden="true"/);
    assert.doesNotMatch(html, /[☀☾◐⌕✦☰]/);
  });

  it('ICON registry covers required chrome slots', () => {
    const required = [
      'sun',
      'moon',
      'search',
      'library',
      'layers',
      'x',
      'chevronLeft',
      'chevronRight',
      'shuffle',
      'filter',
      'copy',
      'eye',
    ];
    for (const key of required) {
      assert.ok(ICON[key], `missing ICON.${key}`);
      assert.equal(typeof ICON[key], 'string');
    }
  });
});

describe('public chrome source has no icon-as-text emoji', () => {
  const files = [
    'public/index.html',
    'public/list.html',
    'public/study.js',
    'public/app.js',
    'public/study.css',
    'public/styles.css',
    'public/ui-tokens.css',
  ];

  // Pictographs / icon-as-text previously used as chrome icons
  const banned = /[☀☾◐⌕✦☰]/u;

  for (const rel of files) {
    it(`${rel} has no banned icon-as-text glyphs`, () => {
      const src = readFileSync(join(root, rel), 'utf8');
      const match = src.match(banned);
      assert.equal(match, null, `found banned glyph ${match?.[0]} in ${rel}`);
    });
  }

  it('index.html and list.html declare Lucide data-lucide slots', () => {
    const index = readFileSync(join(root, 'public/index.html'), 'utf8');
    const list = readFileSync(join(root, 'public/list.html'), 'utf8');
    assert.match(index, /data-lucide="moon"/);
    assert.match(index, /data-lucide="library"/);
    assert.match(list, /data-lucide="search"/);
    assert.match(list, /data-lucide="layers"/);
    assert.match(list, /data-lucide="moon"/);
  });

  it('pages load shared tokens + icon/ambient modules', () => {
    const index = readFileSync(join(root, 'public/index.html'), 'utf8');
    const list = readFileSync(join(root, 'public/list.html'), 'utf8');
    assert.match(index, /ui-tokens\.css/);
    assert.match(list, /ui-tokens\.css/);
    const study = readFileSync(join(root, 'public/study.js'), 'utf8');
    const app = readFileSync(join(root, 'public/app.js'), 'utf8');
    assert.match(study, /from ['"]\.\/ui-icons\.js['"]/);
    assert.match(study, /from ['"]\.\/ui-ambient\.js['"]/);
    assert.match(app, /from ['"]\.\/ui-icons\.js['"]/);
    assert.match(app, /from ['"]\.\/ui-ambient\.js['"]/);
  });
});
