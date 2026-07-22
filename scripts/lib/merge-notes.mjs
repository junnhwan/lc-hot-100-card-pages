/**
 * Merge hints/notes from MD, override, and // comment heuristic.
 *
 * Priority for each of hints and notes independently:
 * 1. MD array non-empty → use MD
 * 2. Else override field non-empty → use override
 * 3. Else heuristic: non-empty `//` lines in code (strip `//`) → notes only
 *
 * @param {{
 *   code?: string|null,
 *   hintsFromMd?: string[],
 *   notesFromMd?: string[],
 * }} problemPartial
 * @param {{ hints?: string[], notes?: string[] } | undefined | null} [overrideEntry]
 * @returns {{ hints: string[], notes: string[] }}
 */
export function mergeProblemNotes(problemPartial, overrideEntry) {
  const mdHints = problemPartial?.hintsFromMd ?? [];
  const mdNotes = problemPartial?.notesFromMd ?? [];
  const ovHints = overrideEntry?.hints ?? [];
  const ovNotes = overrideEntry?.notes ?? [];

  const hints = nonEmpty(mdHints)
    ? [...mdHints]
    : nonEmpty(ovHints)
      ? [...ovHints]
      : [];

  let notes;
  if (nonEmpty(mdNotes)) {
    notes = [...mdNotes];
  } else if (nonEmpty(ovNotes)) {
    notes = [...ovNotes];
  } else {
    notes = commentsFromCode(problemPartial?.code);
  }

  return { hints, notes };
}

/**
 * @param {unknown} arr
 */
function nonEmpty(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Non-empty `//` lines → notes (strip `//` and surrounding space).
 * @param {string|null|undefined} code
 * @returns {string[]}
 */
function commentsFromCode(code) {
  if (code == null || typeof code !== 'string' || code.length === 0) {
    return [];
  }
  /** @type {string[]} */
  const out = [];
  for (const line of code.split(/\r?\n/)) {
    const m = line.match(/^\s*\/\/\s?(.*)$/);
    if (!m) continue;
    const text = m[1].trim();
    if (text.length > 0) out.push(text);
  }
  return out;
}
