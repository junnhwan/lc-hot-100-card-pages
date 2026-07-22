import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeProblemNotes } from '../scripts/lib/merge-notes.mjs';

describe('mergeProblemNotes', () => {
  it('prefers MD hints over override; MD-empty notes take override notes', () => {
    const p = mergeProblemNotes(
      { code: '// x\nfunc f(){}', hintsFromMd: ['from md'], notesFromMd: [] },
      { hints: ['from override'], notes: ['n'] },
    );
    assert.deepEqual(p.hints, ['from md']);
    assert.deepEqual(p.notes, ['n']);
  });

  it('prefers MD notes over override notes', () => {
    const p = mergeProblemNotes(
      { code: null, hintsFromMd: [], notesFromMd: ['md note'] },
      { hints: ['oh'], notes: ['override note'] },
    );
    assert.deepEqual(p.hints, ['oh']);
    assert.deepEqual(p.notes, ['md note']);
  });

  it('extracts // comments into notes when nothing else', () => {
    const p = mergeProblemNotes(
      {
        code: 'func f(){\n  // 先查后写\n  return nil\n}',
        hintsFromMd: [],
        notesFromMd: [],
      },
      undefined,
    );
    assert.deepEqual(p.hints, []);
    assert.ok(p.notes.some((n) => n.includes('先查后写')));
  });

  it('strips // prefix and keeps multiple non-empty comment lines', () => {
    const p = mergeProblemNotes(
      {
        code: '// line one\nfunc f() {\n//line two\n  x++\n}',
        hintsFromMd: [],
        notesFromMd: [],
      },
      {},
    );
    assert.deepEqual(p.hints, []);
    assert.deepEqual(p.notes, ['line one', 'line two']);
  });

  it('ignores empty // lines in heuristic', () => {
    const p = mergeProblemNotes(
      {
        code: 'func f(){\n  //\n  //   \n  // keep me\n}',
        hintsFromMd: [],
        notesFromMd: [],
      },
      undefined,
    );
    assert.deepEqual(p.notes, ['keep me']);
  });

  it('null code yields empty arrays when MD and override empty', () => {
    const p = mergeProblemNotes(
      { code: null, hintsFromMd: [], notesFromMd: [] },
      undefined,
    );
    assert.deepEqual(p.hints, []);
    assert.deepEqual(p.notes, []);
  });

  it('missing code yields empty arrays from heuristic', () => {
    const p = mergeProblemNotes(
      { hintsFromMd: [], notesFromMd: [] },
      {},
    );
    assert.deepEqual(p.hints, []);
    assert.deepEqual(p.notes, []);
  });

  it('does not use heuristic for hints when notes come from override', () => {
    const p = mergeProblemNotes(
      {
        code: '// comment only\nfunc f(){}',
        hintsFromMd: [],
        notesFromMd: [],
      },
      { notes: ['override note'] },
    );
    assert.deepEqual(p.hints, []);
    assert.deepEqual(p.notes, ['override note']);
  });

  it('empty override arrays are treated as empty', () => {
    const p = mergeProblemNotes(
      {
        code: '// from code\nfunc f(){}',
        hintsFromMd: [],
        notesFromMd: [],
      },
      { hints: [], notes: [] },
    );
    assert.deepEqual(p.hints, []);
    assert.deepEqual(p.notes, ['from code']);
  });
});
