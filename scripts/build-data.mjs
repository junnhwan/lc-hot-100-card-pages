import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHot100Markdown } from './lib/parse-md.mjs';
import { mergeProblemNotes } from './lib/merge-notes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(root, 'content/LC Hot 100.md'), 'utf8');
const override = JSON.parse(
  fs.readFileSync(path.join(root, 'data/notes-override.json'), 'utf8'),
);
const { categories, problems: raw } = parseHot100Markdown(md);
const problems = raw.map((p) => {
  const { hints, notes } = mergeProblemNotes(p, override[p.id]);
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    url: p.url,
    category: p.category,
    categoryOrder: p.categoryOrder,
    code: p.code,
    status: p.status,
    hints,
    notes,
  };
});
const catalog = {
  generatedAt: new Date().toISOString(),
  categories: categories.map((c) => ({
    ...c,
    count: problems.filter((p) => p.category === c.name).length,
  })),
  problems,
};
if (problems.length === 0) {
  console.error('No problems parsed — aborting');
  process.exit(1);
}
const out = path.join(root, 'public/problems.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Wrote ${problems.length} problems → ${out}`);
