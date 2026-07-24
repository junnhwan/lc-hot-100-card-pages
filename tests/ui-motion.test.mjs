/**
 * Unit tests for shipped motion helpers.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const { MOTION, motionMs, prefersReducedMotion } = await import(
  pathToFileURL(join(root, 'public/ui-motion.js')).href
);

describe('ui-motion shipped helpers', () => {
  it('MOTION exposes spring/physics-feel vocabulary', () => {
    assert.ok(MOTION.faceLeaveMs > 0);
    assert.ok(MOTION.faceEnterMs > 0);
    assert.ok(MOTION.themeWashMs > 0);
    assert.ok(MOTION.expandMs > 0);
    assert.match(MOTION.spring, /cubic-bezier/);
    assert.match(MOTION.outExpo, /cubic-bezier/);
    assert.match(MOTION.soft, /cubic-bezier/);
  });

  it('prefersReducedMotion returns boolean in Node (no matchMedia → false)', () => {
    assert.equal(typeof prefersReducedMotion(), 'boolean');
  });

  it('motionMs returns positive duration when reduced motion is off', () => {
    const ms = motionMs(MOTION.faceLeaveMs);
    assert.ok(ms === 1 || ms === MOTION.faceLeaveMs);
    assert.ok(ms > 0);
  });
});
