/**
 * Parse LC Hot 100 Markdown into structured categories and problems.
 *
 * @param {string} md
 * @returns {{
 *   categories: { name: string, count: number, order: number }[],
 *   problems: Array<{
 *     id: string, title: string, slug: string, url: string,
 *     category: string, categoryOrder: number,
 *     code: string|null, status: 'ready'|'stub',
 *     hintsFromMd: string[], notesFromMd: string[]
 *   }>
 * }}
 */
export function parseHot100Markdown(md) {
  const PROBLEM_RE = /\[(\d+)\\?\.\s*([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const HEADER_RE = /^###\s+(.+)$/gm;

  /** @type {{ name: string, count: number, order: number }[]} */
  const categories = [];
  /** @type {Map<string, object>} */
  const problemsById = new Map();

  // Collect ### headers with indices
  const headers = [];
  let hm;
  while ((hm = HEADER_RE.exec(md)) !== null) {
    const raw = hm[1].trim();
    const name = raw.replace(/\s+\d+\s*$/, '').trim();
    headers.push({
      index: hm.index,
      end: hm.index + hm[0].length,
      raw,
      name,
      skip: name.toLowerCase() === 'template',
    });
  }

  // Assign order to non-template categories by first appearance
  /** @type {Map<string, number>} */
  const categoryOrderMap = new Map();
  let orderCounter = 0;
  for (const h of headers) {
    if (h.skip) continue;
    if (!categoryOrderMap.has(h.name)) {
      categoryOrderMap.set(h.name, orderCounter++);
    }
  }

  // For each header section, find problems
  for (let hi = 0; hi < headers.length; hi++) {
    const header = headers[hi];
    if (header.skip) continue;

    const sectionStart = header.end;
    const sectionEnd = hi + 1 < headers.length ? headers[hi + 1].index : md.length;
    const section = md.slice(sectionStart, sectionEnd);

    // Absolute offset for matches in section
    const base = sectionStart;

    const problemMatches = [];
    let pm;
    const localProblemRe = new RegExp(PROBLEM_RE.source, 'g');
    while ((pm = localProblemRe.exec(section)) !== null) {
      problemMatches.push({
        index: base + pm.index,
        end: base + pm.index + pm[0].length,
        id: pm[1],
        title: pm[2].trim(),
        url: pm[3],
      });
    }

    const categoryOrder = categoryOrderMap.get(header.name);
    if (categoryOrder === undefined) continue;

    for (let pi = 0; pi < problemMatches.length; pi++) {
      const p = problemMatches[pi];
      const bodyStart = p.end;
      // Body ends at next problem link in this section, or end of section (next ###)
      const bodyEnd =
        pi + 1 < problemMatches.length
          ? problemMatches[pi + 1].index
          : sectionEnd;
      const body = md.slice(bodyStart, bodyEnd);

      const { code, status } = extractCode(body);
      const { hintsFromMd, notesFromMd } = extractHintsNotes(body);
      const slug = slugFromUrl(p.url);

      const problem = {
        id: p.id,
        title: p.title,
        slug,
        url: p.url,
        category: header.name,
        categoryOrder,
        code,
        status,
        hintsFromMd,
        notesFromMd,
      };

      if (problemsById.has(p.id)) {
        console.warn(`Duplicate problem id ${p.id}; later entry overwrites earlier`);
      }
      problemsById.set(p.id, problem);
    }
  }

  // Build category counts from final problems (after overwrite)
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const p of problemsById.values()) {
    counts.set(p.category, (counts.get(p.category) || 0) + 1);
  }

  for (const [name, order] of categoryOrderMap) {
    categories.push({
      name,
      count: counts.get(name) || 0,
      order,
    });
  }
  categories.sort((a, b) => a.order - b.order);

  // Stable order: by categoryOrder then appearance (Map insertion = last write order;
  // re-sort by categoryOrder then numeric id for determinism within category)
  const problems = [...problemsById.values()].sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
    return Number(a.id) - Number(b.id);
  });

  return { categories, problems };
}

/**
 * @param {string} url
 */
function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // .../problems/<slug>/ or .../problems/<slug>
    const idx = parts.indexOf('problems');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return parts[parts.length - 1] || '';
  } catch {
    const m = url.match(/\/problems\/([^/]+)/);
    return m ? m[1] : '';
  }
}

/**
 * Prefer last non-empty fence whose body contains `func`; else last non-empty fence.
 * Stub if no fence, empty, or no `func`.
 * @param {string} body
 */
function extractCode(body) {
  const fenceRe = /```[^\n]*\n([\s\S]*?)```/g;
  /** @type {string[]} */
  const fences = [];
  let m;
  while ((m = fenceRe.exec(body)) !== null) {
    fences.push(m[1]);
  }

  if (fences.length === 0) {
    return { code: null, status: 'stub' };
  }

  const nonEmpty = fences.filter((f) => f.trim().length > 0);
  if (nonEmpty.length === 0) {
    return { code: null, status: 'stub' };
  }

  let chosen = null;
  for (let i = nonEmpty.length - 1; i >= 0; i--) {
    if (nonEmpty[i].includes('func')) {
      chosen = nonEmpty[i];
      break;
    }
  }
  if (chosen === null) {
    chosen = nonEmpty[nonEmpty.length - 1];
  }

  const trimmed = chosen.trim();
  if (!trimmed || !trimmed.includes('func')) {
    return { code: null, status: 'stub' };
  }

  // Preserve original body (trim trailing whitespace only for cleanliness)
  return { code: chosen.replace(/\s+$/, '').replace(/^\n/, ''), status: 'ready' };
}

/**
 * Parse `> **hints**` / `> **notes**` blockquote sections.
 * @param {string} body
 */
function extractHintsNotes(body) {
  /** @type {string[]} */
  const hintsFromMd = [];
  /** @type {string[]} */
  const notesFromMd = [];

  const lines = body.split(/\r?\n/);
  /** @type {'hints' | 'notes' | null} */
  let mode = null;

  for (const line of lines) {
    // Stop at fence
    if (line.trimStart().startsWith('```')) {
      mode = null;
      continue;
    }

    const bq = line.match(/^>\s?(.*)$/);
    if (!bq) {
      // blank or non-blockquote ends current mode only if we leave quote block
      if (line.trim() === '') {
        // blank line may separate quote blocks; keep mode until non-quote content
        continue;
      }
      mode = null;
      continue;
    }

    const content = bq[1];
    const headerMatch = content.match(/^\*\*(hints|notes)\*\*\s*$/i);
    if (headerMatch) {
      mode = headerMatch[1].toLowerCase() === 'hints' ? 'hints' : 'notes';
      continue;
    }

    if (mode) {
      const bullet = content.match(/^-\s+(.+)$/);
      if (bullet) {
        const item = bullet[1].trim();
        if (mode === 'hints') hintsFromMd.push(item);
        else notesFromMd.push(item);
      }
    }
  }

  return { hintsFromMd, notesFromMd };
}
