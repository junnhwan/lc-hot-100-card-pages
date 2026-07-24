/**
 * Immersive ambient field — pointer-reactive lattice + soft orbs.
 * Progressive: no-ops under prefers-reduced-motion; never blocks content.
 */

/**
 * Install ambient canvas + grain overlay on the page.
 * @param {{ density?: number, intensity?: number }} [opts]
 * @returns {{ canvas: HTMLCanvasElement | null, destroy: () => void, isRunning: () => boolean }}
 */
export function installAmbient(opts = {}) {
  const density = Number.isFinite(opts.density) ? opts.density : 1;
  const intensity = Number.isFinite(opts.intensity) ? opts.intensity : 1;

  if (typeof document === 'undefined') {
    return { canvas: null, destroy() {}, isRunning: () => false };
  }

  const reduced =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    return { canvas: null, destroy() {}, isRunning: () => false };
  }

  // Avoid double-install
  const existing = document.querySelector('canvas.ambient-canvas');
  if (existing) {
    return {
      canvas: /** @type {HTMLCanvasElement} */ (existing),
      destroy() {
        existing.remove();
        document.querySelector('.ambient-grain')?.remove();
      },
      isRunning: () => true,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const grain = document.createElement('div');
  grain.className = 'ambient-grain';
  grain.setAttribute('aria-hidden', 'true');
  document.body.prepend(grain);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return {
      canvas,
      destroy() {
        canvas.remove();
        grain.remove();
      },
      isRunning: () => false,
    };
  }

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let running = true;
  let t0 = performance.now();

  const pointer = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35 };

  /** @type {{ x: number, y: number, vx: number, vy: number, r: number, a: number }[]} */
  const particles = [];

  function themeColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (theme === 'light') {
      return {
        bg: [243, 239, 230],
        line: [37, 99, 235],
        orbA: [37, 99, 235],
        orbB: [196, 138, 26],
      };
    }
    return {
      bg: [6, 8, 12],
      line: [91, 157, 255],
      orbA: [91, 157, 255],
      orbB: [255, 179, 71],
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.floor((28 + (w * h) / 48000) * density);
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: 0.6 + Math.random() * 1.8,
        a: 0.15 + Math.random() * 0.45,
      });
    }
  }

  function onPointer(e) {
    pointer.tx = e.clientX / Math.max(1, w);
    pointer.ty = e.clientY / Math.max(1, h);
  }

  function frame(now) {
    if (!running) return;
    const colors = themeColors();
    const t = (now - t0) / 1000;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    ctx.clearRect(0, 0, w, h);

    // soft radial wash
    const gx = pointer.x * w;
    const gy = pointer.y * h;
    const g1 = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.55);
    g1.addColorStop(
      0,
      `rgba(${colors.orbA[0]},${colors.orbA[1]},${colors.orbA[2]},${0.12 * intensity})`
    );
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);

    const g2 = ctx.createRadialGradient(
      w * (0.85 - pointer.x * 0.2),
      h * (0.15 + pointer.y * 0.1),
      0,
      w * 0.85,
      h * 0.1,
      Math.max(w, h) * 0.45
    );
    g2.addColorStop(
      0,
      `rgba(${colors.orbB[0]},${colors.orbB[1]},${colors.orbB[2]},${0.07 * intensity})`
    );
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    // lattice
    const step = Math.max(48, Math.min(88, Math.floor(w / 22)));
    const offsetX = (t * 6) % step;
    const offsetY = (t * 4) % step;
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${colors.line[0]},${colors.line[1]},${colors.line[2]},${0.045 * intensity})`;

    ctx.beginPath();
    for (let x = -step + offsetX; x < w + step; x += step) {
      const warp = Math.sin(t * 0.4 + x * 0.01 + pointer.x * 2) * 6;
      ctx.moveTo(x + warp, 0);
      ctx.lineTo(x - warp * 0.5, h);
    }
    for (let y = -step + offsetY; y < h + step; y += step) {
      const warp = Math.cos(t * 0.35 + y * 0.012 + pointer.y * 2) * 5;
      ctx.moveTo(0, y + warp);
      ctx.lineTo(w, y - warp * 0.4);
    }
    ctx.stroke();

    // particles + links near pointer
    const px = pointer.x * w;
    const py = pointer.y * h;
    const linkR = 110;

    for (const p of particles) {
      p.x += p.vx + (px - p.x) * 0.00035;
      p.y += p.vy + (py - p.y) * 0.00035;
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      const dx = p.x - px;
      const dy = p.y - py;
      const dist = Math.hypot(dx, dy);
      const boost = dist < linkR ? 1 + (1 - dist / linkR) * 1.4 : 1;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${colors.line[0]},${colors.line[1]},${colors.line[2]},${p.a * boost * 0.55 * intensity})`;
      ctx.arc(p.x, p.y, p.r * boost, 0, Math.PI * 2);
      ctx.fill();
    }

    // connect nearby particles (sparse)
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 9000) continue;
        const alpha = (1 - d2 / 9000) * 0.12 * intensity;
        ctx.strokeStyle = `rgba(${colors.line[0]},${colors.line[1]},${colors.line[2]},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (running && !raf) {
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(frame);

  return {
    canvas,
    isRunning: () => running && raf !== 0,
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
      grain.remove();
    },
  };
}
