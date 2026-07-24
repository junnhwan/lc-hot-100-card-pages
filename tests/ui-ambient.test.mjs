/**
 * Drive the shipped ambient installer in a minimal DOM-like harness.
 * Proves installAmbient is callable and returns a destroyable handle.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/**
 * Minimal DOM stub so installAmbient can run without a browser.
 * Not a reimplementation of ambient logic — only host APIs it needs.
 */
function installDomStub() {
  const bodyChildren = [];
  const canvasState = { width: 0, height: 0 };

  const ctx = {
    setTransform() {},
    clearRect() {},
    createRadialGradient() {
      return { addColorStop() {} };
    },
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    arc() {},
    fill() {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };

  class FakeCanvas {
    constructor() {
      this.className = '';
      this.style = {};
      this._attrs = {};
    }
    setAttribute(k, v) {
      this._attrs[k] = v;
    }
    getAttribute(k) {
      return this._attrs[k];
    }
    getContext() {
      return ctx;
    }
    get width() {
      return canvasState.width;
    }
    set width(v) {
      canvasState.width = v;
    }
    get height() {
      return canvasState.height;
    }
    set height(v) {
      canvasState.height = v;
    }
    remove() {
      const i = bodyChildren.indexOf(this);
      if (i >= 0) bodyChildren.splice(i, 1);
    }
  }

  class FakeDiv {
    constructor() {
      this.className = '';
      this._attrs = {};
    }
    setAttribute(k, v) {
      this._attrs[k] = v;
    }
    remove() {
      const i = bodyChildren.indexOf(this);
      if (i >= 0) bodyChildren.splice(i, 1);
    }
  }

  const documentElement = {
    getAttribute(name) {
      if (name === 'data-theme') return 'dark';
      return null;
    },
  };

  const body = {
    prepend(node) {
      bodyChildren.unshift(node);
    },
  };

  globalThis.document = {
    documentElement,
    body,
    hidden: false,
    querySelector(sel) {
      if (sel === 'canvas.ambient-canvas') {
        return bodyChildren.find((n) => n.className === 'ambient-canvas') || null;
      }
      if (sel === '.ambient-grain') {
        return bodyChildren.find((n) => n.className === 'ambient-grain') || null;
      }
      return null;
    },
    createElement(tag) {
      if (tag === 'canvas') return new FakeCanvas();
      return new FakeDiv();
    },
    addEventListener() {},
    removeEventListener() {},
  };

  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
  };

  globalThis.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  globalThis.performance = { now: () => Date.now() };
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

  return {
    bodyChildren,
    teardown() {
      delete globalThis.document;
      delete globalThis.window;
      delete globalThis.matchMedia;
      delete globalThis.performance;
      delete globalThis.requestAnimationFrame;
      delete globalThis.cancelAnimationFrame;
    },
  };
}

describe('ui-ambient installAmbient (shipped entry)', () => {
  /** @type {{ bodyChildren: any[], teardown: () => void } | null} */
  let harness = null;

  before(() => {
    harness = installDomStub();
  });

  after(() => {
    harness?.teardown();
  });

  it('installs canvas + grain and exposes destroy/isRunning', async () => {
    const url = pathToFileURL(join(root, 'public/ui-ambient.js')).href;
    const mod = await import(url);
    const handle = mod.installAmbient({ density: 0.5, intensity: 0.5 });
    assert.ok(handle);
    assert.equal(typeof handle.destroy, 'function');
    assert.equal(typeof handle.isRunning, 'function');
    assert.ok(handle.canvas, 'canvas should be created');
    assert.equal(handle.canvas.className, 'ambient-canvas');
    assert.ok(
      harness.bodyChildren.some((n) => n.className === 'ambient-canvas'),
      'canvas prepended to body'
    );
    assert.ok(
      harness.bodyChildren.some((n) => n.className === 'ambient-grain'),
      'grain overlay prepended'
    );
    // allow one frame to schedule
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(handle.isRunning(), true);
    handle.destroy();
    assert.equal(
      harness.bodyChildren.some((n) => n.className === 'ambient-canvas'),
      false
    );
  });

  it('source defines installAmbient export', () => {
    const src = readFileSync(join(root, 'public/ui-ambient.js'), 'utf8');
    assert.match(src, /export function installAmbient/);
    assert.match(src, /requestAnimationFrame/);
    assert.match(src, /prefers-reduced-motion/);
  });
});
