/* ============================================================================
 * PH-ENGINE · Shared procedural 2.5D isometric engine (Project Hospital-style)
 * Zero dependencies. All art is generated procedurally at runtime (no assets).
 *  - Camera (drag-pan, wheel/pinch zoom, fit-to-map)
 *  - Procedural material textures (linoleum, ceramic, oak, carpet, terrazzo,
 *    grass, asphalt, pavers, travertine, water, quilted fabric, upholstery…)
 *  - Baked floor layer with decals, wall ambient-occlusion and wear/scuffs
 *  - Depth-sorted walls (cutaway / walls-up), doors, glass, windows
 *  - Local-space "kit" for rotatable multi-part furniture
 *  - Detailed articulated people (outfits, hair, hijab, faces, 15+ poses)
 * ========================================================================== */
(function (global) {
  'use strict';

  const TW = 64, TH = 32, TEX = 128;
  const WALL_FULL = 74, WALL_LOW = 13, WALL_T = 0.16;
  const BAKE = 1.5;

  // ------------------------------------------------------------------ utils
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(r, g, b) { return '#' + ((1 << 24) + (Math.max(0, Math.min(255, r | 0)) << 16) + (Math.max(0, Math.min(255, g | 0)) << 8) + Math.max(0, Math.min(255, b | 0))).toString(16).slice(1); }
  const _shade = new Map();
  function shade(hex, f) {
    if (!hex || hex[0] !== '#') return hex;
    const k = hex + f; let v = _shade.get(k); if (v) return v;
    let [r, g, b] = hexToRgb(hex);
    if (f <= 1) { r *= f; g *= f; b *= f; } else { const t = f - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
    v = toHex(r, g, b); _shade.set(k, v); return v;
  }
  function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function jitter(hex, r, amt) { return shade(hex, 1 - amt + r() * amt * 2); }

  // ------------------------------------------------------------------ state
  const S = {
    canvas: null, ctx: null, dpr: 1, vpW: 800, vpH: 600,
    cam: { cx: 0, cy: 0, z: 1 }, ox: 0, oy: 0, t: 0,
    proj: { ax: TW / 2, ay: TH / 2, bx: -TW / 2, by: TH / 2 },
    map: null, cond: 'cur', bakes: {}, items: [], labels: [], wallsUp: false,
    agentsPrev: new Map(), doorOpen: new Map(), agentsNow: []
  };
  const zoomMin = 0.32, zoomMax = 2.8;

  // ------------------------------------------------------------- projection
  function P(gx, gy, gz) {
    const z = S.cam.z, pr = S.proj;
    return {
      x: S.ox + (gx * pr.ax + gy * pr.bx) * z,
      y: S.oy + (gx * pr.ay + gy * pr.by - (gz || 0)) * z
    };
  }
  function updateOrigin() {
    S.ox = S.vpW / 2 - S.cam.cx * S.cam.z;
    S.oy = S.vpH / 2 - S.cam.cy * S.cam.z;
  }
  function screenToGrid(sx, sy) {
    const z = S.cam.z, pr = S.proj;
    const wx = (sx - S.ox) / z, wy = (sy - S.oy) / z;
    const det = pr.ax * pr.by - pr.bx * pr.ay || 1;
    return {
      gx: (wx * pr.by - wy * pr.bx) / det,
      gy: (-wx * pr.ay + wy * pr.ax) / det
    };
  }

  // ------------------------------------------------------------- materials
  const MATS = {};
  function defMat(name, span, gen) { MATS[name] = { span, gen }; }
  function noiseImg(g, size, r, amt) {
    const id = g.getImageData(0, 0, size, size), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
  }
  function mottle(g, size, r, col, n, alpha) {
    for (let i = 0; i < n; i++) {
      const x = r() * size, y = r() * size, rad = 10 + r() * size * 0.35;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, rgba(col, alpha)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, size, size);
    }
  }
  function speckle(g, size, r, base, n, spread) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = shade(base, 1 - spread + r() * spread * 2);
      const s = r() < 0.85 ? 1 : 2;
      g.fillRect(r() * size, r() * size, s, s);
    }
  }
  function linoGen(base, opts = {}) {
    return (g, size, r) => {
      g.fillStyle = base; g.fillRect(0, 0, size, size);
      mottle(g, size, r, shade(base, 0.92), 6, 0.08);
      mottle(g, size, r, shade(base, 1.06), 6, 0.08);
      speckle(g, size, r, base, opts.speck || 1700, 0.09);
      if (opts.chips) speckle(g, size, r, opts.chips, 260, 0.15);
      noiseImg(g, size, r, 6);
      g.strokeStyle = 'rgba(0,0,0,0.075)'; g.lineWidth = 1.2; g.strokeRect(0.5, 0.5, size - 1, size - 1);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(1.5, size - 1.5); g.lineTo(1.5, 1.5); g.lineTo(size - 1.5, 1.5); g.stroke();
    };
  }
  function tileGen(base, grout, n) {
    return (g, size, r) => {
      const c = size / n;
      g.fillStyle = grout; g.fillRect(0, 0, size, size);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const col = jitter(base, r, 0.035);
        g.fillStyle = col; g.fillRect(i * c + 1.2, j * c + 1.2, c - 2.4, c - 2.4);
        const gr = g.createLinearGradient(i * c, j * c, i * c + c, j * c + c);
        gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)');
        g.fillStyle = gr; g.fillRect(i * c + 1.2, j * c + 1.2, c - 2.4, c - 2.4);
      }
      noiseImg(g, size, r, 5);
    };
  }
  function woodGen(base, planks, along) {
    return (g, size, r) => {
      const pw = size / planks;
      for (let p = 0; p < planks; p++) {
        let pos = -r() * size;
        while (pos < size) {
          const len = size * (0.35 + r() * 0.6);
          const col = jitter(base, r, 0.09);
          const x = along === 'y' ? p * pw : pos, y = along === 'y' ? pos : p * pw;
          const w = along === 'y' ? pw : len, h = along === 'y' ? len : pw;
          g.fillStyle = col; g.fillRect(x, y, w, h);
          g.strokeStyle = rgba(shade(base, 0.55), 0.18); g.lineWidth = 0.8;
          for (let k = 0; k < 5; k++) {
            g.beginPath();
            const off = r() * pw;
            for (let s = 0; s <= 12; s++) {
              const tt = s / 12, wv = Math.sin(tt * 6 + k * 2 + r() * 0.3) * 1.2;
              const px = along === 'y' ? x + off + wv : x + tt * w, py = along === 'y' ? y + tt * h : y + off + wv;
              if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
            }
            g.stroke();
          }
          if (r() < 0.12) { g.fillStyle = rgba(shade(base, 0.5), 0.35); g.beginPath(); g.ellipse(x + w * 0.5, y + h * 0.5, along === 'y' ? 2 : 4, along === 'y' ? 4 : 2, 0, 0, 7); g.fill(); }
          g.fillStyle = 'rgba(40,24,10,0.35)';
          if (along === 'y') g.fillRect(x, y, pw, 1.2); else g.fillRect(x, y, 1.2, pw);
          pos += len;
        }
        g.fillStyle = 'rgba(40,24,10,0.3)';
        if (along === 'y') g.fillRect(p * pw, 0, 1, size); else g.fillRect(0, p * pw, size, 1);
      }
      noiseImg(g, size, r, 7);
    };
  }
  function carpetGen(base, pat) {
    return (g, size, r) => {
      g.fillStyle = base; g.fillRect(0, 0, size, size);
      noiseImg(g, size, r, 26);
      if (pat === 'grid') {
        g.strokeStyle = rgba(shade(base, 1.25), 0.22); g.lineWidth = 2;
        for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * size / 4, 0); g.lineTo(i * size / 4, size); g.moveTo(0, i * size / 4); g.lineTo(size, i * size / 4); g.stroke(); }
      } else if (pat === 'diamond') {
        g.fillStyle = rgba(shade(base, 1.3), 0.16);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const cx = i * size / 4 + size / 8, cy = j * size / 4 + size / 8; g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 9, cy); g.lineTo(cx, cy + 9); g.lineTo(cx - 9, cy); g.fill(); }
      }
    };
  }
  defMat('linoWhite', 1, linoGen('#e3e6e8'));
  defMat('linoGrey', 1, linoGen('#c9ced3'));
  defMat('linoBlue', 1, linoGen('#c4d6e2', { chips: '#9fb8c9' }));
  defMat('linoMint', 1, linoGen('#cfe3da', { chips: '#a8c8bb' }));
  defMat('linoSand', 1, linoGen('#ddd3c1'));
  defMat('linoDark', 1, linoGen('#8f969c'));
  defMat('linoWorn', 1, linoGen('#b9b29f', { chips: '#8c846f' }));
  defMat('ceramic', 1, tileGen('#eef1f2', '#c3c9cc', 4));
  defMat('ceramicBlue', 1, tileGen('#d8e8ef', '#a9bec8', 4));
  defMat('ceramicCream', 1, tileGen('#f7f2e7', '#dfd6c3', 3));
  defMat('oak', 2, woodGen('#c39762', 8, 'x'));
  defMat('oakY', 2, woodGen('#c39762', 8, 'y'));
  defMat('walnut', 2, woodGen('#7d5537', 8, 'x'));
  defMat('deskwood', 1, woodGen('#c8a274', 6, 'x'));
  defMat('deck', 2, woodGen('#a87a50', 7, 'y'));
  defMat('carpetBlue', 1, carpetGen('#4d6a8c', 'grid'));
  defMat('carpetGrey', 1, carpetGen('#80858c', 'grid'));
  defMat('carpetWine', 1, carpetGen('#7e3b45', 'diamond'));
  defMat('carpetBeige', 1, carpetGen('#cdbb9c', 'diamond'));
  defMat('carpetTeal', 1, carpetGen('#3f7f80', 'grid'));
  defMat('terrazzo', 2, (g, size, r) => {
    g.fillStyle = '#d9d5cd'; g.fillRect(0, 0, size, size);
    const pal = ['#8f8a80', '#b9b2a6', '#f4f1eb', '#6f7a83', '#c1a585', '#a7b4ad'];
    for (let i = 0; i < 1400; i++) { g.fillStyle = pal[(r() * pal.length) | 0]; g.beginPath(); g.ellipse(r() * size, r() * size, 0.8 + r() * 2.6, 0.8 + r() * 1.8, r() * 3, 0, 7); g.fill(); }
    noiseImg(g, size, r, 6);
    g.strokeStyle = 'rgba(80,80,80,0.18)'; g.lineWidth = 1.5; g.strokeRect(0.5, 0.5, size - 1, size - 1);
  });
  defMat('marble', 2, (g, size, r) => {
    g.fillStyle = '#f1efeb'; g.fillRect(0, 0, size, size);
    mottle(g, size, r, '#d8d4cc', 10, 0.18);
    for (let v = 0; v < 7; v++) {
      g.strokeStyle = `rgba(120,115,108,${0.12 + r() * 0.2})`; g.lineWidth = 0.6 + r() * 1.3;
      let x = r() * size, y = r() * size; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 40; s++) { x += (r() - 0.3) * 12; y += (r() - 0.5) * 12; g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.strokeRect(0.5, 0.5, size / 2 - 1, size / 2 - 1); g.strokeRect(size / 2 + 0.5, size / 2 + 0.5, size / 2 - 1, size / 2 - 1);
  });
  defMat('grass', 2, (g, size, r) => {
    g.fillStyle = '#6e9a48'; g.fillRect(0, 0, size, size);
    mottle(g, size, r, '#5b8a3a', 14, 0.35); mottle(g, size, r, '#8bb05a', 10, 0.25);
    noiseImg(g, size, r, 18);
    for (let i = 0; i < 2600; i++) {
      const x = r() * size, y = r() * size, l = 2 + r() * 4;
      g.strokeStyle = ['#4f7d31', '#7fa952', '#91bb5f', '#5f8c3b', '#a3c56d'][(r() * 5) | 0];
      g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2, y - l); g.stroke();
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = r() < 0.5 ? '#f3f0d8' : '#e8d65a'; g.fillRect(r() * size, r() * size, 1.6, 1.6); }
  });
  defMat('asphalt', 2, (g, size, r) => {
    g.fillStyle = '#4b4f55'; g.fillRect(0, 0, size, size);
    noiseImg(g, size, r, 30);
    speckle(g, size, r, '#6c7177', 1600, 0.2);
    mottle(g, size, r, '#3c4045', 6, 0.25);
    if (r() < 2) { g.strokeStyle = 'rgba(25,25,25,0.35)'; g.lineWidth = 1; g.beginPath(); let x = r() * size, y = r() * size; g.moveTo(x, y); for (let i = 0; i < 9; i++) { x += (r() - 0.5) * 18; y += r() * 10; g.lineTo(x, y); } g.stroke(); }
  });
  defMat('paver', 1, (g, size, r) => {
    const n = 2, c = size / n;
    g.fillStyle = '#8e8a82'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = jitter('#c4beb2', r, 0.05); g.fillRect(i * c + 1.5, j * c + 1.5, c - 3, c - 3); }
    noiseImg(g, size, r, 14);
  });
  defMat('concrete', 2, (g, size, r) => {
    g.fillStyle = '#bdbcb7'; g.fillRect(0, 0, size, size);
    mottle(g, size, r, '#a9a8a2', 9, 0.25); noiseImg(g, size, r, 14);
    g.strokeStyle = 'rgba(60,60,60,0.25)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, size - 1.5, size - 1.5);
  });
  defMat('travertine', 2, (g, size, r) => {
    g.fillStyle = '#e5dccb'; g.fillRect(0, 0, size, size);
    let y = 0;
    while (y < size) {
      const h = size / 4; let x = -r() * 40;
      while (x < size) { const w = 30 + r() * 50; g.fillStyle = jitter('#f8f3e8', r, 0.03); g.fillRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4); x += w; }
      y += h;
    }
    for (let i = 0; i < 220; i++) { g.fillStyle = 'rgba(180,165,140,0.28)'; g.fillRect(r() * size, r() * size, 1 + r() * 2, 1); }
    noiseImg(g, size, r, 5);
  });
  defMat('rubber', 1, (g, size, r) => {
    g.fillStyle = '#3d4a57'; g.fillRect(0, 0, size, size);
    speckle(g, size, r, '#3d4a57', 900, 0.25);
    const fl = ['#2dd4bf', '#f59e0b', '#e2e8f0'];
    for (let i = 0; i < 160; i++) { g.fillStyle = fl[(r() * 3) | 0]; g.fillRect(r() * size, r() * size, 1.4, 1.4); }
  });
  defMat('quilt', 1, (g, size, r) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, size, size);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1.2;
    for (let i = -size; i < size * 2; i += 21) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + size, size); g.moveTo(i, size); g.lineTo(i + size, 0); g.stroke(); }
    noiseImg(g, size, r, 10);
  });
  defMat('fabric', 1, (g, size, r) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < size; i += 3) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(i, 0, 1.2, size); g.fillRect(0, i, size, 1.2); }
    noiseImg(g, size, r, 14);
  });
  defMat('mulch', 1, (g, size, r) => {
    g.fillStyle = '#5a3d29'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) { g.fillStyle = ['#3f2a1b', '#6e4b33', '#7a573c', '#2e1f14'][(r() * 4) | 0]; g.fillRect(r() * size, r() * size, 1 + r() * 3, 1 + r()); }
  });
  defMat('water', 2, (g, size, r) => {
    const gr = g.createLinearGradient(0, 0, size, size);
    gr.addColorStop(0, '#2fb6d6'); gr.addColorStop(1, '#1d93c0');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    g.strokeStyle = 'rgba(220,250,255,0.42)';
    for (let i = 0; i < 70; i++) {
      g.lineWidth = 0.6 + r() * 1.4; g.beginPath();
      let x = r() * size, y = r() * size; g.moveTo(x, y);
      for (let s = 0; s < 4; s++) { const nx = x + (r() - 0.5) * 34, ny = y + (r() - 0.5) * 34; g.quadraticCurveTo((x + nx) / 2 + (r() - 0.5) * 14, (y + ny) / 2 + (r() - 0.5) * 14, nx, ny); x = nx; y = ny; }
      g.stroke();
    }
  });

  const TEXC = {};
  function texCanvas(name) {
    if (TEXC[name]) return TEXC[name];
    const m = MATS[name] || MATS.linoGrey;
    const size = TEX * m.span;
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    m.gen(g, size, mulberry(hashStr(name)));
    TEXC[name] = c; return c;
  }
  const PATC = new WeakMap();
  function pattern(ctx, name) {
    let m = PATC.get(ctx); if (!m) { m = {}; PATC.set(ctx, m); }
    if (!m[name]) m[name] = ctx.createPattern(texCanvas(name), 'repeat');
    return m[name];
  }

  // ------------------------------------------------------------ primitives
  function ctx() { return S.ctx; }
  function poly(pts, fill, stroke, lw) {
    const c = S.ctx; c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 0.8; c.stroke(); }
  }
  // grid-plane affine (draw in grid units * TEX)
  function gridSpace(z, fn) {
    const c = S.ctx, k = S.cam.z * S.dpr, pr = S.proj;
    c.save();
    c.setTransform((pr.ax / TEX) * k, (pr.ay / TEX) * k, (pr.bx / TEX) * k, (pr.by / TEX) * k, S.ox * S.dpr, (S.oy - z * S.cam.z) * S.dpr);
    fn(c);
    c.restore();
  }
  function box(x, y, z, w, d, h, col, o) {
    o = o || {};
    const c = S.ctx;
    if (o.alpha != null) { c.save(); c.globalAlpha *= o.alpha; }
    const zt = z + h;
    const t0 = P(x, y, zt), t1 = P(x + w, y, zt), t2 = P(x + w, y + d, zt), t3 = P(x, y + d, zt);
    const b1 = P(x + w, y, z), b2 = P(x + w, y + d, z), b3 = P(x, y + d, z);
    if (h > 0.01) {
      poly([t3, t2, b2, b3], o.left || shade(col, 0.84));
      poly([t2, t1, b1, b2], o.right || shade(col, 0.68));
    }
    if (o.tex) {
      gridSpace(zt, g => { g.fillStyle = col; g.fillRect(x * TEX, y * TEX, w * TEX, d * TEX); g.globalAlpha = o.texAlpha || 0.55; g.globalCompositeOperation = 'multiply'; g.fillStyle = pattern(S.ctx, o.tex); g.fillRect(x * TEX, y * TEX, w * TEX, d * TEX); });
    } else {
      poly([t0, t1, t2, t3], o.top || col);
    }
    if (o.edge !== false && h > 0.5) {
      c.strokeStyle = o.edgeCol || 'rgba(255,255,255,0.22)'; c.lineWidth = Math.max(0.5, 0.7 * S.cam.z);
      c.beginPath(); c.moveTo(t3.x, t3.y); c.lineTo(t2.x, t2.y); c.lineTo(t1.x, t1.y); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.moveTo(t2.x, t2.y); c.lineTo(b2.x, b2.y); c.stroke();
    }
    if (o.alpha != null) c.restore();
  }
  function topQuad(x, y, z, w, d, col, o) {
    o = o || {};
    if (o.tex) {
      gridSpace(z, g => { g.fillStyle = col; g.fillRect(x * TEX, y * TEX, w * TEX, d * TEX); g.globalAlpha = o.texAlpha || 0.6; g.globalCompositeOperation = 'multiply'; g.fillStyle = pattern(S.ctx, o.tex); g.fillRect(x * TEX, y * TEX, w * TEX, d * TEX); });
      return;
    }
    poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], col, o.stroke, o.lw);
  }
  function vquad(p, q, z0, z1, col, o) {
    o = o || {};
    poly([P(p[0], p[1], z1), P(q[0], q[1], z1), P(q[0], q[1], z0), P(p[0], p[1], z0)], col, o.stroke, o.lw);
  }
  function cyl(x, y, z, r, h, col, o) {
    o = o || {};
    const c = S.ctx, zm = S.cam.z;
    const rx = r * TW * 0.7071 * zm, ry = r * TH * 0.7071 * zm;
    const b = P(x, y, z), t = P(x, y, z + h);
    const g = c.createLinearGradient(b.x - rx, 0, b.x + rx, 0);
    g.addColorStop(0, shade(col, 0.9)); g.addColorStop(0.35, shade(col, 1.08)); g.addColorStop(1, shade(col, 0.62));
    c.fillStyle = o.flat ? shade(col, 0.8) : g;
    c.beginPath(); c.ellipse(b.x, b.y, rx, ry, 0, 0, Math.PI); c.lineTo(t.x - rx, t.y); c.ellipse(t.x, t.y, rx, ry, 0, Math.PI, 0, true); c.closePath(); c.fill();
    c.fillStyle = o.top || shade(col, 1.06); c.beginPath(); c.ellipse(t.x, t.y, rx, ry, 0, 0, Math.PI * 2); c.fill();
  }
  function disc(x, y, z, r, col, stroke) {
    const c = S.ctx, zm = S.cam.z, p = P(x, y, z);
    c.beginPath(); c.ellipse(p.x, p.y, r * TW * 0.7071 * zm, r * TH * 0.7071 * zm, 0, 0, Math.PI * 2);
    if (col) { c.fillStyle = col; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = Math.max(0.6, zm); c.stroke(); }
  }
  function blob(x, y, z, r, col) {
    const c = S.ctx, p = P(x, y, z), R = r * TW * 0.62 * S.cam.z;
    const g = c.createRadialGradient(p.x - R * 0.35, p.y - R * 0.4, R * 0.1, p.x, p.y, R);
    g.addColorStop(0, shade(col, 1.25)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, 0.68));
    c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, R, 0, Math.PI * 2); c.fill();
  }
  function line3(x1, y1, z1, x2, y2, z2, col, w) {
    const c = S.ctx, a = P(x1, y1, z1), b = P(x2, y2, z2);
    c.strokeStyle = col; c.lineWidth = Math.max(0.5, (w || 1) * S.cam.z); c.lineCap = 'round';
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }
  function shadowRect(x, y, w, d, a) {
    poly([P(x + 0.04, y + 0.06, 0), P(x + w + 0.1, y + 0.06, 0), P(x + w + 0.1, y + d + 0.12, 0), P(x + 0.04, y + d + 0.12, 0)], `rgba(20,24,30,${a == null ? 0.16 : a})`);
  }
  // text on a vertical plane between world pts p→q at height z (baseline)
  function planeText(p, q, z, text, size, col, o) {
    o = o || {};
    let a = P(p[0], p[1], z), b = P(q[0], q[1], z);
    if (b.x < a.x) { const t = a; a = b; b = t; }
    const lenW = Math.hypot(q[0] - p[0], q[1] - p[1]) * 35.78;
    const zm = S.cam.z, dpr = S.dpr;
    const ax = (b.x - a.x) / lenW, ay = (b.y - a.y) / lenW;
    const c = S.ctx; c.save();
    c.setTransform(ax * dpr, ay * dpr, 0, zm * dpr, a.x * dpr, a.y * dpr);
    c.font = `${o.weight || 700} ${size}px ${o.font || '-apple-system, "Segoe UI", sans-serif'}`;
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(text, lenW / (zm ? 1 : 1) / 1 * (1 / 1) * (1) * (1) * (1) * (1) * (1) * (1) / 2 / (1) , 0);
    c.restore();
  }

  // ------------------------------------------------------------------- kit
  const NRM = { '+v': ['+y', '+x', '-y', '-x'], '-v': ['-y', '-x', '+y', '+x'], '+u': ['+x', '-y', '-x', '+y'], '-u': ['-x', '+y', '+x', '-y'] };
  function kit(x, y, W, D, rot) {
    rot = (((rot | 0) % 4) + 4) % 4;
    const parts = [];
    const L = (u, v) => {
      switch (rot) {
        case 0: return [x + u, y + v];
        case 1: return [x + v, y + W - u];
        case 2: return [x + W - u, y + D - v];
        default: return [x + D - v, y + u];
      }
    };
    const R = (u, v, w, d) => { const a = L(u, v), b = L(u + w, v + d); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; };
    const vis = n => { const w = NRM[n][rot]; return w === '+x' || w === '+y'; };
    const ends = (n, c, a0, a1) => (n === '+v' || n === '-v') ? [L(a0, c), L(a1, c)] : [L(c, a0), L(c, a1)];
    const planePt = (n, c, a, z) => { const p = (n === '+v' || n === '-v') ? L(a, c) : L(c, a); return P(p[0], p[1], z); };
    const now = {
      box(u, v, z, w, d, h, col, o) { const r = R(u, v, w, d); box(r[0], r[1], z, r[2], r[3], h, col, o); },
      top(u, v, z, w, d, col, o) { const r = R(u, v, w, d); topQuad(r[0], r[1], z, r[2], r[3], col, o); },
      panel(n, c, a0, a1, z0, z1, col, o) { if (!vis(n)) return; const e = ends(n, c, a0, a1); vquad(e[0], e[1], z0, z1, col, o); },
      cyl(u, v, z, r, h, col, o) { const p = L(u, v); cyl(p[0], p[1], z, r, h, col, o); },
      disc(u, v, z, r, col, st) { const p = L(u, v); disc(p[0], p[1], z, r, col, st); },
      blob(u, v, z, r, col) { const p = L(u, v); blob(p[0], p[1], z, r, col); },
      line(u1, v1, z1, u2, v2, z2, col, w) { const a = L(u1, v1), b = L(u2, v2); line3(a[0], a[1], z1, b[0], b[1], z2, col, w); },
      text(n, c, a0, a1, z, text, size, col, o) { if (!vis(n)) return; const e = ends(n, c, a0, a1); planeText(e[0], e[1], z, text, size, col, o); },
      screen(n, c, a0, a1, z0, z1, style, seed) { if (!vis(n)) return; drawScreen(n, c, a0, a1, z0, z1, style, seed, ends, planePt); },
      poly(n, c, ptsAZ, col) { if (!vis(n)) return; poly(ptsAZ.map(q => planePt(n, c, q[0], q[1])), col); }
    };
    const depthOf = (u, v) => { const p = L(u, v); return p[0] + p[1]; };
    const K = {
      W, D, rot, L, R, vis, now, planePt, parts,
      box(u, v, z, w, d, h, col, o) { push((o && o.layer) || 0, depthOf(u + w / 2, v + d / 2), () => now.box(u, v, z, w, d, h, col, o)); },
      top(u, v, z, w, d, col, o) { push(o && o.layer != null ? o.layer : 1, depthOf(u + w / 2, v + d / 2), () => now.top(u, v, z, w, d, col, o)); },
      panel(n, c, a0, a1, z0, z1, col, o) { if (!vis(n)) return; const m = (a0 + a1) / 2; push(o && o.layer != null ? o.layer : 2, (n[1] === 'v') ? depthOf(m, c) : depthOf(c, m), () => now.panel(n, c, a0, a1, z0, z1, col, o)); },
      cyl(u, v, z, r, h, col, o) { push((o && o.layer) || 0, depthOf(u, v), () => now.cyl(u, v, z, r, h, col, o)); },
      blob(u, v, z, r, col, layer) { push(layer || 3, depthOf(u, v) + z * 0.001, () => now.blob(u, v, z, r, col)); },
      line(u1, v1, z1, u2, v2, z2, col, w, layer) { push(layer || 0, depthOf((u1 + u2) / 2, (v1 + v2) / 2), () => now.line(u1, v1, z1, u2, v2, z2, col, w)); },
      part(u, v, layer, fn) { push(layer || 0, depthOf(u, v), fn); }
    };
    function push(layer, depth, fn) { parts.push({ layer, depth, fn }); }
    return K;
  }
  function runParts(parts) {
    parts.sort((a, b) => a.layer - b.layer || a.depth - b.depth);
    for (const p of parts) p.fn();
  }

  // screen content on a vertical plane
  function drawScreen(n, c, a0, a1, z0, z1, style, seed, ends, planePt) {
    const e = ends(n, c, a0, a1);
    vquad(e[0], e[1], z0, z1, '#14181f');
    const pad = Math.min(0.03, (a1 - a0) * 0.08), zp = 1.2;
    const A0 = a0 + pad, A1 = a1 - pad, Z0 = z0 + zp, Z1 = z1 - zp;
    const quad = (aa0, aa1, zz0, zz1, col) => { const ee = ends(n, c, aa0, aa1); vquad(ee[0], ee[1], zz0, zz1, col); };
    const t = S.t;
    const st = style || 'ui';
    if (st === 'off') { quad(A0, A1, Z0, Z1, '#1d232c'); return; }
    if (st === 'ecg' || st === 'ecgAlarm') {
      quad(A0, A1, Z0, Z1, '#04140d');
      const pts = [];
      const N = 26;
      for (let i = 0; i <= N; i++) {
        const tt = i / N, ph = ((tt * 3 + t * 0.02 + (seed || 0)) % 1);
        let yv = 0.5;
        if (ph > 0.42 && ph < 0.46) yv = 0.9; else if (ph >= 0.46 && ph < 0.5) yv = 0.15; else if (ph > 0.6 && ph < 0.7) yv = 0.62;
        pts.push(planePt(n, c, A0 + (A1 - A0) * tt, Z0 + (Z1 - Z0) * (0.2 + yv * 0.55)));
      }
      const cx = S.ctx; cx.strokeStyle = st === 'ecgAlarm' && (t % 30 < 15) ? '#ff5d5d' : '#4ade80'; cx.lineWidth = Math.max(0.7, S.cam.z * 0.9);
      cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y)); cx.stroke();
      return;
    }
    const bg = { ui: '#0d2b45', alert: '#3b0d0d', ok: '#062e24', wall: '#0b1c33', paper: '#e9e6dc', warm: '#3a2410', map: '#0b2237' }[st] || '#0d2b45';
    const flick = st === 'alert' && (t % 40 < 6);
    quad(A0, A1, Z0, Z1, flick ? '#5a1414' : bg);
    const r = mulberry((seed || 1) * 977);
    const hdr = { ui: '#38bdf8', alert: '#ef4444', ok: '#10b981', wall: '#22d3ee', paper: '#94a3b8', warm: '#f59e0b', map: '#38bdf8' }[st] || '#38bdf8';
    const zH = Z1 - (Z1 - Z0) * 0.16;
    quad(A0, A1, zH, Z1, hdr);
    const rows = Math.max(2, Math.min(6, Math.round((Z1 - Z0) / 3.2)));
    for (let i = 0; i < rows; i++) {
      const zz = zH - (i + 1) * (zH - Z0) / (rows + 0.6);
      const w = 0.35 + r() * 0.55;
      const blink = ((t >> 4) + i + (seed | 0)) % 9 === 0 ? 0.25 : 1;
      quad(A0 + (A1 - A0) * 0.06, A0 + (A1 - A0) * (0.06 + w * 0.88 * blink), zz - 0.7, zz + 0.5, st === 'paper' ? '#64748b' : rgba(st === 'alert' ? '#fca5a5' : '#cbe7ff', 0.75));
    }
    // glare
    const cx = S.ctx; cx.save(); cx.globalAlpha = 0.08; quad(A0, A0 + (A1 - A0) * 0.4, Z0 + (Z1 - Z0) * 0.5, Z1, '#ffffff'); cx.restore();
  }

  // ------------------------------------------------------------ floor bake
  function pick(v) { return (v && typeof v === 'object' && !Array.isArray(v) && ('cur' in v || 'fut' in v)) ? v[S.cond] : v; }
  function worldBounds(b) {
    const pr = S.proj, xs = [], ys = [];
    [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].forEach(([gx, gy]) => {
      xs.push(gx * pr.ax + gy * pr.bx);
      ys.push(gx * pr.ay + gy * pr.by);
    });
    return { minX: Math.min(...xs) - 4, maxX: Math.max(...xs) + 4, minY: Math.min(...ys) - 4, maxY: Math.max(...ys) + 4 };
  }
  function bakeFloor(cond) {
    const map = S.map, wb = worldBounds(map.bounds), pr = S.proj;
    const cw = Math.ceil((wb.maxX - wb.minX) * BAKE), ch = Math.ceil((wb.maxY - wb.minY) * BAKE);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    const k = BAKE;
    g.setTransform((pr.ax / TEX) * k, (pr.ay / TEX) * k, (pr.bx / TEX) * k, (pr.by / TEX) * k, -wb.minX * k, -wb.minY * k);
    const prev = S.cond; S.cond = cond;
    const U = TEX;
    // ground
    for (const gr of map.ground) {
      const mat = pick(gr.mat); if (!mat) continue;
      if (gr.col) { g.fillStyle = gr.col; g.fillRect(gr.x * U, gr.y * U, gr.w * U, gr.d * U); }
      g.fillStyle = pattern(g, mat);
      g.fillRect(gr.x * U, gr.y * U, gr.w * U, gr.d * U);
      if (gr.tint) { g.fillStyle = pick(gr.tint); g.fillRect(gr.x * U, gr.y * U, gr.w * U, gr.d * U); }
    }
    // decals
    for (const dc of (map.decals || [])) {
      if (dc.when && dc.when !== cond) continue;
      drawDecal(g, dc, U);
    }
    // ambient occlusion along walls
    for (const w of map.walls) {
      if (w.when && w.when !== cond) continue;
      const horiz = w.y1 === w.y2;
      const a = 0.22;
      if (horiz) {
        const x0 = Math.min(w.x1, w.x2), x1 = Math.max(w.x1, w.x2), y = w.y1;
        for (const sgn of [-1, 1]) {
          const gr = g.createLinearGradient(0, y * U, 0, (y + sgn * 0.42) * U);
          gr.addColorStop(0, `rgba(30,35,45,${a})`); gr.addColorStop(1, 'rgba(30,35,45,0)');
          g.fillStyle = gr; g.fillRect(x0 * U, Math.min(y, y + sgn * 0.42) * U, (x1 - x0) * U, 0.42 * U);
        }
      } else {
        const y0 = Math.min(w.y1, w.y2), y1 = Math.max(w.y1, w.y2), x = w.x1;
        for (const sgn of [-1, 1]) {
          const gr = g.createLinearGradient(x * U, 0, (x + sgn * 0.42) * U, 0);
          gr.addColorStop(0, `rgba(30,35,45,${a})`); gr.addColorStop(1, 'rgba(30,35,45,0)');
          g.fillStyle = gr; g.fillRect(Math.min(x, x + sgn * 0.42) * U, y0 * U, 0.42 * U, (y1 - y0) * U);
        }
      }
    }
    // wear & scuffs (current-state facility)
    if (cond === 'cur' && map.wear) {
      const r = mulberry(4242);
      for (const z of map.wear) {
        g.fillStyle = 'rgba(92,78,48,0.13)'; g.fillRect(z.x * U, z.y * U, z.w * U, z.d * U);
        const n = Math.round(z.w * z.d * 2.2);
        for (let i = 0; i < n; i++) {
          const x = (z.x + r() * z.w) * U, y = (z.y + r() * z.d) * U;
          if (r() < 0.55) { g.strokeStyle = `rgba(40,34,26,${0.12 + r() * 0.16})`; g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 30, x + (r() - 0.5) * 90, y + (r() - 0.5) * 40); g.stroke(); }
          else { const gr = g.createRadialGradient(x, y, 0, x, y, 14 + r() * 34); gr.addColorStop(0, `rgba(120,96,50,${0.12 + r() * 0.12})`); gr.addColorStop(1, 'rgba(120,96,50,0)'); g.fillStyle = gr; g.fillRect(x - 50, y - 50, 100, 100); }
        }
      }
    }
    S.cond = prev;
    return { cv, wb };
  }
  function drawDecal(g, dc, U) {
    const col = dc.col || '#ffffff';
    g.save();
    if (dc.alpha != null) g.globalAlpha = dc.alpha;
    switch (dc.type) {
      case 'rect': g.fillStyle = col; g.fillRect(dc.x * U, dc.y * U, dc.w * U, dc.d * U); break;
      case 'mat': g.fillStyle = pattern(g, dc.mat); g.fillRect(dc.x * U, dc.y * U, dc.w * U, dc.d * U);
        if (dc.border) { g.strokeStyle = dc.border; g.lineWidth = (dc.bw || 0.06) * U; g.strokeRect((dc.x + 0.06) * U, (dc.y + 0.06) * U, (dc.w - 0.12) * U, (dc.d - 0.12) * U); }
        break;
      case 'line': g.strokeStyle = col; g.lineWidth = (dc.w || 0.08) * U; if (dc.dash) g.setLineDash(dc.dash.map(v => v * U)); g.lineCap = dc.cap || 'butt';
        g.beginPath(); g.moveTo(dc.x1 * U, dc.y1 * U); g.lineTo(dc.x2 * U, dc.y2 * U); g.stroke(); break;
      case 'path': g.strokeStyle = col; g.lineWidth = (dc.w || 0.08) * U; g.lineJoin = 'round'; g.lineCap = 'round'; if (dc.dash) g.setLineDash(dc.dash.map(v => v * U));
        g.beginPath(); dc.pts.forEach((p, i) => i ? g.lineTo(p[0] * U, p[1] * U) : g.moveTo(p[0] * U, p[1] * U)); g.stroke(); break;
      case 'parking': {
        g.strokeStyle = col; g.lineWidth = 0.07 * U;
        for (let i = 0; i <= dc.n; i++) {
          g.beginPath();
          if (dc.axis === 'x') { const x = (dc.x + i * dc.size) * U; g.moveTo(x, dc.y * U); g.lineTo(x, (dc.y + dc.d) * U); }
          else { const y = (dc.y + i * dc.size) * U; g.moveTo(dc.x * U, y); g.lineTo((dc.x + dc.w) * U, y); }
          g.stroke();
        }
        break;
      }
      case 'zebra': {
        g.fillStyle = col;
        const n = Math.floor((dc.axis === 'x' ? dc.w : dc.d) / 0.5);
        for (let i = 0; i < n; i += 1) {
          if (i % 2) continue;
          if (dc.axis === 'x') g.fillRect((dc.x + i * 0.5) * U, dc.y * U, 0.32 * U, dc.d * U);
          else g.fillRect(dc.x * U, (dc.y + i * 0.5) * U, dc.w * U, 0.32 * U);
        }
        break;
      }
      case 'hatch': {
        g.beginPath(); g.rect(dc.x * U, dc.y * U, dc.w * U, dc.d * U); g.clip();
        g.strokeStyle = col; g.lineWidth = 0.12 * U;
        for (let s = -dc.d; s < dc.w + dc.d; s += 0.45) { g.beginPath(); g.moveTo((dc.x + s) * U, dc.y * U); g.lineTo((dc.x + s - dc.d) * U, (dc.y + dc.d) * U); g.stroke(); }
        g.restore(); g.save();
        g.strokeStyle = col; g.lineWidth = 0.1 * U; g.strokeRect(dc.x * U, dc.y * U, dc.w * U, dc.d * U);
        break;
      }
      case 'circle': g.fillStyle = col; g.beginPath(); g.arc(dc.x * U, dc.y * U, dc.r * U, 0, 7); g.fill();
        if (dc.stroke) { g.strokeStyle = dc.stroke; g.lineWidth = 0.04 * U; g.stroke(); } break;
      case 'text': {
        g.translate(dc.x * U, dc.y * U);
        if (dc.rot) g.rotate(dc.rot);
        g.font = `${dc.weight || 800} ${(dc.size || 0.5) * U}px -apple-system, "Segoe UI", Arial, sans-serif`;
        g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(dc.text, 0, 0);
        break;
      }
      case 'arrow': {
        g.translate(dc.x * U, dc.y * U); g.rotate(dc.rot || 0); g.fillStyle = col;
        const s = (dc.size || 0.6) * U;
        g.beginPath(); g.moveTo(s * 0.5, 0); g.lineTo(0, -s * 0.35); g.lineTo(0, -s * 0.14); g.lineTo(-s * 0.5, -s * 0.14); g.lineTo(-s * 0.5, s * 0.14); g.lineTo(0, s * 0.14); g.lineTo(0, s * 0.35); g.closePath(); g.fill();
        break;
      }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ walls
  function nearAgent(x, y, r) {
    for (const a of S.agentsNow) if (Math.abs(a.gx - x) < r && Math.abs(a.gy - y) < r) return true;
    return false;
  }
  function pushWalls() {
    const map = S.map;
    for (const w of map.walls) {
      if (w.when && w.when !== S.cond) continue;
      const horiz = w.y1 === w.y2;
      const a0 = horiz ? Math.min(w.x1, w.x2) : Math.min(w.y1, w.y2);
      const a1 = horiz ? Math.max(w.x1, w.x2) : Math.max(w.y1, w.y2);
      const fixed = horiz ? w.y1 : w.x1;
      const openings = (w.open || []).filter(o => !o.when || o.when === S.cond).slice().sort((p, q) => p.at - q.at);
      const kind = pick(w.kind) || 'int';
      const full = S.wallsUp || w.full;
      const H = full ? WALL_FULL : (kind === 'half' ? 9 : WALL_LOW);
      // solid spans
      let cur = a0;
      const spans = [];
      for (const o of openings) { if (o.at > cur) spans.push([cur, o.at, o]); cur = o.at + o.w; }
      if (cur < a1) spans.push([cur, a1, null]);
      for (const [s0, s1] of spans) {
        for (let s = s0; s < s1 - 1e-6; s += 1) {
          const e = Math.min(s1, s + 1);
          const cx = horiz ? (s + e) / 2 : fixed, cy = horiz ? fixed : (s + e) / 2;
          S.items.push({ key: cx + cy + 0.02, draw: () => drawWallSeg(w, horiz, fixed, s, e, H, kind, full) });
        }
      }
      // openings (frames, doors, glass)
      for (const o of openings) {
        const cx = horiz ? o.at + o.w / 2 : fixed, cy = horiz ? fixed : o.at + o.w / 2;
        S.items.push({ key: cx + cy + 0.03, draw: () => drawOpening(w, horiz, fixed, o, H, kind, full) });
      }
    }
  }
  function wallBoxCoords(horiz, fixed, s, e) {
    return horiz ? [s, fixed - WALL_T / 2, e - s, WALL_T] : [fixed - WALL_T / 2, s, WALL_T, e - s];
  }
  function drawWallSeg(w, horiz, fixed, s, e, H, kind, full) {
    const [bx, by, bw, bd] = wallBoxCoords(horiz, fixed, s, e);
    const paint = pick(w.col) || (kind === 'ext' ? '#d9d6cf' : '#ece9e3');
    const cap = kind === 'ext' ? '#6f747b' : '#8a8f96';
    if (kind === 'glass') {
      box(bx, by, 0, bw, bd, 4, '#9aa3ab');
      const gh = full ? WALL_FULL : 22;
      box(bx, by, 4, bw, bd, gh - 4, '#bfe3f2', { alpha: 0.32, edge: false, top: rgba('#e0f2fe', 0.6) });
      // mullion
      const c = horiz ? [[e, fixed], [e, fixed]] : [[fixed, e], [fixed, e]];
      line3(c[0][0], c[0][1], 0, c[0][0], c[0][1], gh, '#7d878f', 1.4);
      box(bx, by, gh, bw, bd, 2, '#8d969e');
      return;
    }
    if (kind === 'half') { box(bx, by, 0, bw, bd, H, paint, { top: '#b8b2a8' }); return; }
    box(bx, by, 0, bw, bd, H, paint, { top: cap, left: shade(paint, 0.9), right: shade(paint, 0.74) });
    // skirting
    if (H > 10) {
      if (horiz) vquad([s, fixed + WALL_T / 2], [e, fixed + WALL_T / 2], 0, 2.2, shade(paint, 0.62));
      else vquad([fixed + WALL_T / 2, s], [fixed + WALL_T / 2, e], 0, 2.2, shade(paint, 0.55));
    }
    // windows on full walls
    if (full && w.windows && (e - s) > 0.8) {
      const m0 = s + 0.14, m1 = e - 0.14;
      const face = horiz ? (a => [a, fixed + WALL_T / 2 + 0.005]) : (a => [fixed + WALL_T / 2 + 0.005, a]);
      vquad(face(m0 - 0.03), face(m1 + 0.03), 22, 60, '#f3f4f5');
      const gl = S.ctx.createLinearGradient(P(...face(m0), 60).x, P(...face(m0), 60).y, P(...face(m1), 24).x, P(...face(m1), 24).y);
      gl.addColorStop(0, '#d7eefa'); gl.addColorStop(0.45, '#9cc9e2'); gl.addColorStop(0.5, '#e9f6fd'); gl.addColorStop(1, '#7fb1cf');
      vquad(face(m0), face(m1), 24, 58, gl);
      const mid = (m0 + m1) / 2;
      vquad(face(mid - 0.012), face(mid + 0.012), 24, 58, '#eef0f1');
      vquad(face(m0), face(m1), 40.5, 41.5, '#eef0f1');
      vquad(face(m0 - 0.05), face(m1 + 0.05), 21, 23, '#c8ccd0');
    }
    if (full && w.decor) for (const d of w.decor) if (d.at >= s && d.at < e) drawWallDecor(horiz, fixed, d);
  }
  function drawWallDecor(horiz, fixed, d) {
    const face = horiz ? (a => [a, fixed + WALL_T / 2 + 0.01]) : (a => [fixed + WALL_T / 2 + 0.01, a]);
    const a0 = d.at, a1 = d.at + (d.w || 0.6);
    const n = horiz ? '+v' : '+u';
    if (d.t === 'poster') { vquad(face(a0), face(a1), d.z || 30, (d.z || 30) + (d.h || 18), '#fafafa'); vquad(face(a0 + 0.04), face(a1 - 0.04), (d.z || 30) + 2, (d.z || 30) + (d.h || 18) - 2, d.col || '#60a5fa'); }
    else if (d.t === 'clock') { const p = P(...face((a0 + a1) / 2), 50); const c = S.ctx, r = 4.2 * S.cam.z; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(p.x, p.y, r * 0.8, r, horiz ? -0.45 : 0.45, 0, 7); c.fill(); c.strokeStyle = '#334155'; c.lineWidth = Math.max(0.6, S.cam.z); c.stroke(); }
    else if (d.t === 'tv') { const e = [face(a0), face(a1)]; vquad(e[0], e[1], d.z || 34, (d.z || 34) + (d.h || 16), '#111'); }
    else if (d.t === 'sign') { vquad(face(a0), face(a1), d.z || 50, (d.z || 50) + 8, d.col || '#0b5394'); planeText(face(a0), face(a1), (d.z || 50) + 2, d.text || '', 6, '#ffffff'); }
  }
  function drawOpening(w, horiz, fixed, o, H, kind, full) {
    const face = (a, off) => horiz ? [a, fixed + (off || 0)] : [fixed + (off || 0), a];
    const a0 = o.at, a1 = o.at + o.w;
    const type = pick(o.type) || 'door';
    const frameH = full ? 52 : Math.max(H, 8);
    const frameCol = '#a7adb3';
    // jamb posts
    if (type !== 'gap') {
      const post = (a) => { const [bx, by, bw, bd] = wallBoxCoords(horiz, fixed, a - 0.04, a + 0.04); box(bx, by, 0, bw, bd, frameH, frameCol, { edge: false }); };
      post(a0); post(a1);
      if (full) { const [bx, by, bw, bd] = wallBoxCoords(horiz, fixed, a0, a1); box(bx, by, 52, bw, bd, WALL_FULL - 52, pick(w.col) || '#ece9e3', { top: '#8a8f96' }); }
    }
    const mid = (a0 + a1) / 2;
    const id = `${w.x1},${w.y1},${o.at}`;
    if (type === 'slide' || type === 'auto') {
      const near = nearAgent(horiz ? mid : fixed, horiz ? fixed : mid, 1.6) || o.alwaysOpen;
      let k = S.doorOpen.get(id) || 0; k += ((near ? 1 : 0) - k) * 0.08; S.doorOpen.set(id, k);
      const half = o.w / 2, slide = half * 0.92 * k;
      const gh = full ? 50 : 30;
      const pane = (p0, p1) => {
        const [bx, by, bw, bd] = wallBoxCoords(horiz, fixed, p0, p1);
        box(bx, by, 0, bw, bd, gh, '#c9ecf8', { alpha: 0.38, edge: false, top: 'rgba(200,230,245,0.5)' });
        line3(...face(p0), 0, ...face(p0), gh, '#6b7680', 1.2); line3(...face(p1), 0, ...face(p1), gh, '#6b7680', 1.2);
        line3(...face(p0), gh, ...face(p1), gh, '#6b7680', 1.2);
      };
      pane(a0 - slide, mid - slide); pane(mid + slide, a1 + slide);
      // header box with sensor
      const [bx, by, bw, bd] = wallBoxCoords(horiz, fixed, a0 - 0.1, a1 + 0.1);
      box(bx, by - (horiz ? 0.02 : 0), gh, bw, bd + 0.04, 5, '#7b8590');
      const sp = P(...face(mid, WALL_T), gh + 2.5); S.ctx.fillStyle = k > 0.5 ? '#22c55e' : '#ef4444'; S.ctx.beginPath(); S.ctx.arc(sp.x, sp.y, 1.4 * S.cam.z, 0, 7); S.ctx.fill();
      return;
    }
    if (type === 'door' || type === 'double') {
      const near = nearAgent(horiz ? mid : fixed, horiz ? fixed : mid, 1.1);
      let k = S.doorOpen.get(id); if (k == null) k = o.open != null ? o.open : 0.0; k += (((near ? 1 : 0) || (o.open || 0)) - k) * 0.12; S.doorOpen.set(id, k);
      const ang = k * Math.PI * 0.5 * (o.swing || 1);
      const leaf = (hinge, len, sign) => {
        const dirA = sign; const dh = 30;
        // door leaf rotates about hinge from along-wall to perpendicular (into +side)
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const endA = hinge + dirA * len * ca, endN = len * sa * (o.side || 1);
        const p = face(hinge, 0), q = face(endA, endN);
        const hgt = full ? 50 : Math.max(16, H + 6);
        vquad(p, q, 0, hgt, pick(o.col) || '#d4b48c');
        vquad(p, q, hgt - 0.1, hgt, '#8b6b48');
        // vision panel & handle
        const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        line3(m[0], m[1], 22, q[0], q[1], 22, '#6b7280', 1.1);
        if (hgt > 30) { const g1 = [p[0] + (q[0] - p[0]) * 0.3, p[1] + (q[1] - p[1]) * 0.3], g2 = [p[0] + (q[0] - p[0]) * 0.7, p[1] + (q[1] - p[1]) * 0.7]; vquad(g1, g2, 32, 44, 'rgba(190,225,240,0.75)'); }
      };
      if (type === 'double') { leaf(a0 + 0.04, o.w / 2 - 0.05, 1); leaf(a1 - 0.04, o.w / 2 - 0.05, -1); }
      else leaf(a0 + 0.04, o.w - 0.08, 1);
      return;
    }
    if (type === 'locked') {
      // caution tape across opening
      const c = S.ctx;
      for (let i = 0; i < 2; i++) {
        const z = 10 + i * 9;
        const p = P(...face(a0, 0.05), z), q = P(...face(a1, 0.05), z + (i ? -3 : 3));
        c.strokeStyle = '#facc15'; c.lineWidth = 2.6 * S.cam.z; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
        c.setLineDash([3 * S.cam.z, 3 * S.cam.z]); c.strokeStyle = '#111'; c.lineWidth = 2.6 * S.cam.z; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); c.setLineDash([]);
      }
    }
  }

  // ------------------------------------------------------------------ people
  const SKIN = ['#f3cfb0', '#e6b48c', '#d29b6e', '#b57a50', '#8f5a37', '#f7dcc6', '#c48a5e'];
  const HAIR = ['#1a1514', '#2c1e15', '#3d2a1d', '#5b3c26', '#1f1f22', '#7a5536'];
  const GREY = ['#bdb8b1', '#d9d6d1', '#a8a39c', '#eceae6'];
  const CASUAL_TOPS = ['#3b6ea8', '#a33b3b', '#2f7d5b', '#c9a227', '#6b4c9a', '#d97757', '#4b5563', '#e6e1d6', '#1f6f8b', '#b45383', '#7aa36b'];
  const BOTTOMS = ['#2f3b4c', '#3f4f6b', '#8a7a5f', '#2a2a2e', '#56606b', '#a39478', '#1f3a5f'];
  function look(role, seed, over) {
    const r = mulberry(seed * 7919 + 13);
    const pickA = a => a[(r() * a.length) | 0];
    const female = r() < 0.5;
    const L = { skin: pickA(SKIN), hair: pickA(HAIR), style: female ? pickA(['long', 'bun', 'ponytail', 'hijab', 'hijab', 'bob']) : pickA(['short', 'short', 'side', 'crop', 'bald']), female, glasses: r() < 0.22, shoe: '#22252b', hijab: pickA(['#0f766e', '#9d174d', '#1e3a8a', '#7c2d12', '#e9d5c0', '#334155', '#6d28d9', '#be123c']) };
    switch (role) {
      case 'doctor': Object.assign(L, { coat: '#f5f7f9', top: pickA(['#3c7fc0', '#2e8b88', '#4a5f8a']), bottom: '#3a4a63', steth: true, badge: true }); break;
      case 'nurse': Object.assign(L, { top: pickA(['#2aa7a5', '#3f86d8', '#2aa7a5', '#5b6ee0']), shoe: '#eef2f5', badge: true }); L.bottom = L.top; break;
      case 'radiographer': Object.assign(L, { top: '#7e3352', shoe: '#e5e7eb', badge: true }); L.bottom = L.top; break;
      case 'pharmacist': Object.assign(L, { coat: '#f5f7f9', top: '#3d8a5a', bottom: '#2f3b4c', badge: true }); break;
      case 'reception': case 'concierge': case 'admin': Object.assign(L, { top: '#1d2b4f', bottom: '#1d2b4f', shirt: '#f8fafc', tie: role === 'concierge' ? '#d4af37' : '#38bdf8', badge: true }); break;
      case 'janitor': Object.assign(L, { top: '#5c7a68', bottom: '#3e5246', shoe: '#1f2937', cap: false }); break;
      case 'security': Object.assign(L, { top: '#2b3442', bottom: '#1c222c', shirt: '#cbd5e1', badge: true, style: L.female ? 'hijab' : 'crop' }); break;
      case 'porter': Object.assign(L, { top: '#1e4e8c', bottom: '#1f2937' }); break;
      case 'therapist': Object.assign(L, { top: '#e6dccd', bottom: '#4a4038', badge: true }); break;
      case 'chef': Object.assign(L, { top: '#f8fafc', bottom: '#27272a', apron: '#1f2937' }); break;
      case 'lifeguard': Object.assign(L, { top: '#dc2626', bottom: '#1f2937', shoe: '#f59e0b' }); break;
      case 'resident': case 'elderly':
        Object.assign(L, { hair: pickA(GREY), top: pickA(['#c9b79c', '#8aa1b8', '#a58a9b', '#9caf88', '#d8cfc0', '#7b8ea3', '#b07d62']), bottom: pickA(['#5b5e66', '#8a7d68', '#3f4a5a', '#6b5f53']), cardigan: r() < 0.55, glasses: r() < 0.55 });
        if (L.style === 'long' || L.style === 'ponytail') L.style = 'bob';
        if (!L.female && r() < 0.4) L.style = 'bald';
        break;
      case 'gown': Object.assign(L, { gown: '#a9cbe6', bottom: L.skin, shoe: '#d6d3d1' }); break;
      case 'visitor': case 'patient': default:
        Object.assign(L, { top: pickA(CASUAL_TOPS), bottom: pickA(BOTTOMS), plaid: r() < 0.18 });
    }
    return Object.assign(L, over || {});
  }

  // draw a person in screen space (feet at sx, sy)
  function drawPerson(sx, sy, spec) {
    const c = S.ctx, s = S.cam.z * (spec.scale || 1);
    const Lk = spec.look;
    const pose = spec.pose || 'stand';
    const dir = spec.dir || 'SE';
    const back = dir === 'NE' || dir === 'NW';
    const flip = (dir === 'SW' || dir === 'NW') ? -1 : 1;
    const t = S.t + (spec.seed || 0) * 13;
    c.save();
    c.translate(sx, sy);
    // shadow (unflipped)
    if (pose !== 'swim' && !spec.noShadow) { c.fillStyle = 'rgba(15,20,28,0.28)'; c.beginPath(); c.ellipse(0, 0, 8.5 * s, 4 * s, 0, 0, Math.PI * 2); c.fill(); }
    c.scale(flip * s, s);
    const skin = Lk.skin, topC = Lk.gown || Lk.top, botC = Lk.bottom;
    const walk = (pose === 'walk' || pose === 'push' || pose === 'carry') && spec.moving;
    const ph = Math.sin(t * 0.22);
    const idleBreath = walk ? 0 : Math.sin(t * 0.075) * 0.48;
    const idleSway = walk ? 0 : Math.cos(t * 0.05) * 0.35;
    const bob = walk ? -Math.abs(Math.cos(t * 0.22)) * 1.0 : idleBreath;
    let hipY = -21, torsoTop = -37, headY = -44.5;
    let sit = pose === 'sit' || pose === 'wheelchair' || (pose === 'type' && spec.seated) || (pose === 'phone' && spec.seated);
    if (sit) { hipY = -12.5; torsoTop = -28.5; headY = -36; }
    if (pose === 'situp') { hipY = 0; torsoTop = -15; headY = -22.5; }
    if (pose === 'swim') { hipY = 6; torsoTop = -9; headY = -16; }
    c.translate(idleSway, bob);

    // ---------- wheelchair (behind body)
    if (pose === 'wheelchair') {
      c.strokeStyle = '#2b2f36'; c.lineWidth = 1.6;
      c.fillStyle = '#3b4250'; c.fillRect(-6, -14, 13, 3.2);
      c.beginPath(); c.ellipse(-2, -8, 3.4, 8.5, 0, 0, 7); c.stroke();
      c.fillStyle = '#4b5563'; c.fillRect(-7.5, -27, 3, 15);
    }
    // ---------- legs
    const shoe = Lk.shoe || '#22252b';
    const legW = 3.7;
    if (pose === 'situp' || pose === 'swim') {
      // no legs
    } else if (sit) {
      const thighC = Lk.gown ? Lk.gown : botC;
      c.fillStyle = shade(thighC, back ? 0.85 : 0.95);
      c.beginPath(); c.roundRect(-4.5, hipY - 3.5, 12, 6.2, 2.4); c.fill();
      c.fillStyle = Lk.gown ? skin : botC;
      c.fillRect(4.2, hipY + 0.5, legW, -hipY - 2);
      c.fillStyle = shade(Lk.gown ? skin : botC, 0.82);
      c.fillRect(0.4, hipY + 0.5, legW, -hipY - 2.5);
      c.fillStyle = shoe;
      c.beginPath(); c.ellipse(6.8, -1.2, 3, 1.5, 0, 0, 7); c.ellipse(2.8, -1.6, 2.8, 1.4, 0, 0, 7); c.fill();
    } else {
      let lf = 0, rf = 0, ll = 0, rl = 0;
      if (walk) { lf = ph * 3.0; rf = -ph * 3.0; ll = Math.max(0, ph) * 1.6; rl = Math.max(0, -ph) * 1.6; }
      let tap = 0;
      if (pose === 'frustrated') tap = (Math.floor(t / 7) % 2) * 1.6;
      const yoga = pose === 'yoga';
      const legCol = Lk.gown ? skin : botC;
      const drawLeg = (cx, fx, lift, col) => {
        c.fillStyle = col;
        c.beginPath(); c.moveTo(cx - legW / 2, hipY); c.lineTo(cx + legW / 2, hipY); c.lineTo(cx + fx + legW / 2 - 0.4, -2 - lift); c.lineTo(cx + fx - legW / 2 + 0.4, -2 - lift); c.closePath(); c.fill();
        c.fillStyle = shoe; c.beginPath(); c.ellipse(cx + fx + (back ? -0.6 : 0.9), -1.4 - lift, 2.7, 1.45, 0, 0, 7); c.fill();
      };
      if (yoga) { drawLeg(-2.2, -5, 0, shade(legCol, 0.85)); drawLeg(2.2, 5, 0, legCol); }
      else { drawLeg(-2.2, lf, ll, shade(legCol, 0.84)); drawLeg(2.2, rf, rl + tap, legCol); }
    }
    // ---------- torso
    const sh = 6.3;
    const torso = () => {
      c.beginPath();
      c.moveTo(-sh, torsoTop + 1.5);
      c.quadraticCurveTo(-sh - 0.8, (torsoTop + hipY) / 2, -5.2, hipY + 0.5);
      c.lineTo(5.2, hipY + 0.5);
      c.quadraticCurveTo(sh + 0.8, (torsoTop + hipY) / 2, sh, torsoTop + 1.5);
      c.quadraticCurveTo(0, torsoTop - 1.2, -sh, torsoTop + 1.5);
      c.closePath();
    };
    if (pose !== 'swim') {
      if (Lk.gown) {
        c.fillStyle = Lk.gown;
        c.beginPath(); c.moveTo(-sh, torsoTop + 1.5); c.lineTo(-7.6, sit ? hipY + 2 : -9); c.lineTo(7.6, sit ? hipY + 2 : -9); c.lineTo(sh, torsoTop + 1.5); c.quadraticCurveTo(0, torsoTop - 1.2, -sh, torsoTop + 1.5); c.fill();
        c.fillStyle = rgba('#ffffff', 0.35);
        for (let i = 0; i < 9; i++) c.fillRect(-5 + (i % 3) * 4, torsoTop + 4 + Math.floor(i / 3) * 6, 1, 1);
      } else {
        c.fillStyle = topC; torso(); c.fill();
        if (Lk.plaid) { c.save(); torso(); c.clip(); c.strokeStyle = rgba('#000000', 0.18); c.lineWidth = 1; for (let i = -8; i < 8; i += 3) { c.beginPath(); c.moveTo(i, torsoTop - 2); c.lineTo(i, hipY + 2); c.stroke(); } for (let j = torsoTop; j < hipY; j += 3) { c.beginPath(); c.moveTo(-8, j); c.lineTo(8, j); c.stroke(); } c.restore(); }
        if (Lk.cardigan) { c.fillStyle = shade(topC, 0.75); c.fillRect(-0.7, torsoTop + 2, 1.4, hipY - torsoTop - 2); }
        if (Lk.apron) { c.fillStyle = Lk.apron; c.fillRect(-4.5, torsoTop + 7, 9, hipY - torsoTop - 4 + (sit ? 0 : 6)); }
      }
      // shading (light from upper-left)
      c.save(); torso(); c.clip(); c.fillStyle = 'rgba(0,0,0,0.13)'; c.fillRect(1.5, torsoTop - 3, 9, 40); c.restore();
      // collar details
      if (!back) {
        if (Lk.shirt) { c.fillStyle = Lk.shirt; c.beginPath(); c.moveTo(-2.4, torsoTop + 0.6); c.lineTo(2.4, torsoTop + 0.6); c.lineTo(0, torsoTop + 6.5); c.fill(); if (Lk.tie) { c.fillStyle = Lk.tie; c.fillRect(-0.6, torsoTop + 2, 1.2, 6); } }
        else if (!Lk.coat && !Lk.gown) { c.fillStyle = shade(topC, 0.72); c.beginPath(); c.moveTo(-2.2, torsoTop + 0.4); c.lineTo(2.2, torsoTop + 0.4); c.lineTo(0, torsoTop + 4.2); c.fill(); }
      }
      if (Lk.coat) {
        const bot = sit ? hipY + 1 : -11.5;
        c.fillStyle = Lk.coat;
        c.beginPath(); c.moveTo(-sh - 0.4, torsoTop + 1.2); c.quadraticCurveTo(-7.8, (torsoTop + bot) / 2, -7.4, bot); c.lineTo(back ? 7.4 : -1.1, bot);
        if (!back) { c.lineTo(-1.2, torsoTop + 8); c.lineTo(-2.8, torsoTop + 0.2); c.closePath(); c.fill(); c.beginPath(); c.moveTo(sh + 0.4, torsoTop + 1.2); c.quadraticCurveTo(7.8, (torsoTop + bot) / 2, 7.4, bot); c.lineTo(1.1, bot); c.lineTo(1.2, torsoTop + 8); c.lineTo(2.8, torsoTop + 0.2); }
        else { c.quadraticCurveTo(7.8, (torsoTop + bot) / 2, sh + 0.4, torsoTop + 1.2); c.quadraticCurveTo(0, torsoTop - 1.2, -sh - 0.4, torsoTop + 1.2); }
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.09)'; c.fillRect(1.2, torsoTop, 7, bot - torsoTop);
        if (!back) {
          c.strokeStyle = 'rgba(100,116,139,0.55)'; c.lineWidth = 0.6;
          c.beginPath(); c.moveTo(-2.8, torsoTop + 0.2); c.lineTo(-1.2, torsoTop + 8); c.moveTo(2.8, torsoTop + 0.2); c.lineTo(1.2, torsoTop + 8); c.stroke();
          c.fillStyle = '#e2e8f0'; c.fillRect(-6, torsoTop + 12, 3, 3); c.fillStyle = '#2563eb'; c.fillRect(-5.4, torsoTop + 11, 0.6, 2.5);
        }
      }
      if (Lk.steth && !back) { c.strokeStyle = '#2d3138'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-2.6, torsoTop + 0.5); c.quadraticCurveTo(-3.2, torsoTop + 8, 0.3, torsoTop + 9.5); c.quadraticCurveTo(2.6, torsoTop + 8, 2.4, torsoTop + 0.5); c.stroke(); c.fillStyle = '#c0c7cf'; c.beginPath(); c.arc(0.3, torsoTop + 10, 1.1, 0, 7); c.fill(); }
      if (Lk.badge && !back) { c.fillStyle = '#f8fafc'; c.fillRect(2.6, torsoTop + 5, 2.4, 3); c.fillStyle = '#0ea5e9'; c.fillRect(2.6, torsoTop + 5, 2.4, 0.9); }
    } else {
      // swimmer upper body
      c.fillStyle = skin; c.beginPath(); c.ellipse(0, -6, 6.2, 4.4, 0, 0, 7); c.fill();
      c.fillStyle = Lk.top; c.fillRect(-5.5, -6, 11, 3.5);
    }

    // ---------- arms
    const sleeve = Lk.coat || (Lk.gown ? Lk.gown : topC);
    const shY = torsoTop + 2.4;
    const arm = (side, hx, hy, ex, ey, front) => {
      const sx0 = side * (sh - 0.6);
      c.strokeStyle = shade(sleeve, side > 0 ? 0.84 : 1); c.lineWidth = 3.3; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(sx0, shY); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      c.fillStyle = skin; c.beginPath(); c.arc(hx, hy, 1.65, 0, 7); c.fill();
    };
    let tw = Math.sin(t * 0.9);
    switch (pose) {
      case 'walk': case 'stand': case 'idle': case 'frustrated': case 'push': case 'carry': case 'tablet': case 'phone': case 'handover': case 'examine': case 'type': case 'yoga': case 'handsup': case 'sit': case 'wheelchair': case 'situp': case 'swim': default: {
        if (pose === 'swim') {
          const st = Math.sin(t * 0.16) * 6;
          arm(-1, -10, -9 + st * 0.4, -8, -8, false); arm(1, 10, -9 - st * 0.4, 8, -8, true);
        } else if (pose === 'yoga') {
          const sy = Math.sin(t * 0.08) * 2;
          arm(-1, -8.5, torsoTop - 12 + sy, -7.5, torsoTop - 5, true); arm(1, 8.5, torsoTop - 12 + sy, 7.5, torsoTop - 5, true);
        } else if (pose === 'handsup') {
          const wv = Math.sin(t * 0.3) * 2.5;
          arm(-1, -9 + wv, torsoTop - 11, -8.5, torsoTop - 4, true); arm(1, 9 - wv, torsoTop - 11, 8.5, torsoTop - 4, true);
        } else if (pose === 'type') {
          const o = (Math.floor(t / 3) % 2) ? 0.9 : -0.9;
          arm(-1, 4.5, hipY - 5 + o, -5.6, hipY - 6, true); arm(1, 8.8, hipY - 5.5 - o, 7.4, hipY - 7, true);
        } else if (pose === 'phone') {
          arm(-1, -6.4, hipY - 1, -7, hipY - 7, true);
          arm(1, 3.6, headY + 1.5, 7.8, torsoTop + 7, true);
          c.fillStyle = '#111827'; c.fillRect(3, headY - 2.4, 2, 5);
        } else if (pose === 'examine') {
          const m = Math.sin(t * 0.12) * 1.4;
          arm(-1, 7, hipY - 4 + m, 0, hipY - 6, true); arm(1, 11.5, hipY - 7 - m, 9, torsoTop + 7, true);
          c.fillStyle = '#c0c7cf'; c.beginPath(); c.arc(11.8, hipY - 7 - m, 1.3, 0, 7); c.fill();
        } else if (pose === 'handover') {
          arm(-1, -6.6, hipY - 1, -7, hipY - 7, true); arm(1, 11, torsoTop + 9, 8.5, torsoTop + 7, true);
          drawProp(spec.prop || 'paper', 11.5, torsoTop + 7.5);
        } else if (pose === 'tablet' || pose === 'carry') {
          arm(-1, 2.5, torsoTop + 11, -6, torsoTop + 9, true); arm(1, 7.5, torsoTop + 11, 7.8, torsoTop + 8, true);
          drawProp(spec.prop || (pose === 'tablet' ? 'tablet' : 'box'), 5, torsoTop + 10, spec.propCol);
        } else if (pose === 'push') {
          arm(-1, 8, hipY - 5, 1, hipY - 8, true); arm(1, 10.5, hipY - 5, 8, hipY - 8, true);
        } else if (pose === 'frustrated') {
          arm(-1, 2, torsoTop + 9, -6.5, torsoTop + 10, true); arm(1, 3.5, torsoTop + 8, 7.2, torsoTop + 10, true);
          c.fillStyle = '#111'; c.fillRect(1.2, torsoTop + 8.3, 1.6, 1.4);
        } else if (sit || pose === 'situp') {
          arm(-1, 2.5, hipY - 1.5, -6.6, hipY - 6, true); arm(1, 6.5, hipY - 1.8, 7.2, hipY - 6.5, true);
        } else {
          const sw = walk ? ph * 2.4 : 0;
          arm(-1, -6.4 - sw * 0.3, hipY - 0.5, -7 - sw * 0.5, hipY - 7.5, true);
          arm(1, 6.6 + sw * 0.3 + (walk ? sw : 0), hipY - 0.5, 7.2 + sw * 0.5, hipY - 7.5, true);
        }
      }
    }
    // ---------- neck + head
    c.fillStyle = shade(skin, 0.9); c.fillRect(-1.6, headY + 3.6, 3.2, torsoTop - headY - 2.4);
    const hx = back ? 0 : 0.5, hy = headY;
    const hairC = Lk.hair;
    if (Lk.style === 'hijab') {
      c.fillStyle = Lk.hijab;
      c.beginPath(); c.moveTo(-6.6, torsoTop + 3.5); c.quadraticCurveTo(0, torsoTop + 8, 6.6, torsoTop + 3.5); c.lineTo(5, hy + 3); c.lineTo(-5, hy + 3); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(hx, hy, 5.9, 6.3, 0, 0, 7); c.fill();
      if (!back) { c.fillStyle = skin; c.beginPath(); c.ellipse(hx + 0.9, hy + 0.6, 3.5, 4.1, 0, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(hx + 2.5, hy, 3.2, 6, 0, -1.2, 1.2); c.fill();
    } else {
      if (Lk.style === 'long' && !back) { c.fillStyle = shade(hairC, 0.85); c.beginPath(); c.roundRect(hx - 5.6, hy - 2, 11.2, 9.5, 3); c.fill(); }
      c.fillStyle = skin; c.beginPath(); c.ellipse(hx, hy, 4.8, 5.3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.ellipse(hx + 2.4, hy + 0.4, 2.4, 4.8, 0, -1.4, 1.4); c.fill();
      c.fillStyle = hairC;
      const st = Lk.style;
      if (back) {
        if (st === 'bald') { c.beginPath(); c.ellipse(hx, hy + 1.8, 4.9, 3, 0, 0, Math.PI); c.fill(); }
        else { c.beginPath(); c.ellipse(hx, hy - 0.4, 5.1, 5.6, 0, Math.PI * 0.92, Math.PI * 2.08); c.lineTo(hx + 4.6, hy + (st === 'long' ? 8 : 2.8)); c.lineTo(hx - 4.6, hy + (st === 'long' ? 8 : 2.8)); c.closePath(); c.fill(); }
        if (st === 'bun') { c.beginPath(); c.arc(hx, hy - 3, 2.6, 0, 7); c.fill(); }
        if (st === 'ponytail') { c.beginPath(); c.ellipse(hx, hy + 5, 1.8, 4, 0, 0, 7); c.fill(); }
      } else {
        if (st === 'bald') { c.beginPath(); c.ellipse(hx - 3.6, hy + 0.5, 1.6, 2.6, 0.2, 0, 7); c.fill(); }
        else {
          c.beginPath(); c.ellipse(hx, hy - 1.2, 5.15, 4.6, 0, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill();
          c.beginPath(); c.ellipse(hx - 3.4, hy + (st === 'long' || st === 'bob' ? 2.5 : 0), 1.8, st === 'long' || st === 'bob' ? 4.6 : 2.6, 0.15, 0, 7); c.fill();
          if (st === 'side') { c.beginPath(); c.ellipse(hx + 1.5, hy - 3.6, 3.6, 1.6, -0.25, 0, 7); c.fill(); }
          if (st === 'bob') { c.beginPath(); c.ellipse(hx + 3.8, hy + 2, 1.5, 3.6, -0.1, 0, 7); c.fill(); }
          if (st === 'bun') { c.beginPath(); c.arc(hx - 2, hy - 5.6, 2.4, 0, 7); c.fill(); }
          if (st === 'ponytail') { c.beginPath(); c.ellipse(hx - 5, hy + 1, 1.5, 3.8, 0.3, 0, 7); c.fill(); }
        }
      }
    }
    if (!back) {
      // face
      const ex = hx + 1.1;
      c.fillStyle = '#2a1d17';
      c.beginPath(); c.arc(ex - 1.9, hy + 0.3, 0.62, 0, 7); c.arc(ex + 1.9, hy + 0.3, 0.62, 0, 7); c.fill();
      c.strokeStyle = rgba(hairC === '#eceae6' ? '#9ca3af' : hairC, 0.85); c.lineWidth = 0.55;
      c.beginPath(); c.moveTo(ex - 2.8, hy - 1.2); c.lineTo(ex - 1.1, hy - 1.4); c.moveTo(ex + 1.1, hy - 1.4); c.lineTo(ex + 2.8, hy - 1.2); c.stroke();
      c.fillStyle = shade(skin, 0.8); c.beginPath(); c.moveTo(ex + 0.3, hy + 0.6); c.lineTo(ex + 1.1, hy + 2.3); c.lineTo(ex - 0.2, hy + 2.3); c.fill();
      c.strokeStyle = pose === 'frustrated' || pose === 'handsup' ? '#7a2e2e' : '#9b4d47'; c.lineWidth = 0.7;
      c.beginPath();
      if (pose === 'frustrated' || pose === 'handsup') { c.moveTo(ex - 1.2, hy + 3.8); c.quadraticCurveTo(ex, hy + 3.0, ex + 1.2, hy + 3.8); }
      else { c.moveTo(ex - 1.1, hy + 3.3); c.quadraticCurveTo(ex, hy + 4.0, ex + 1.1, hy + 3.3); }
      c.stroke();
      if (Lk.glasses) { c.strokeStyle = '#1f2937'; c.lineWidth = 0.55; c.beginPath(); c.arc(ex - 1.9, hy + 0.3, 1.35, 0, 7); c.moveTo(ex + 3.25, hy + 0.3); c.arc(ex + 1.9, hy + 0.3, 1.35, 0, 7); c.moveTo(ex - 0.55, hy + 0.3); c.lineTo(ex + 0.55, hy + 0.3); c.stroke(); }
    }
    // wheelchair front wheel/armrest
    if (pose === 'wheelchair') { c.strokeStyle = '#2b2f36'; c.lineWidth = 1.8; c.beginPath(); c.ellipse(1, -8.5, 3.6, 8.6, 0, 0, 7); c.stroke(); c.fillStyle = '#6b7280'; c.fillRect(-4, -18, 11, 1.6); }
    c.restore();
  }
  function drawProp(kind, x, y, col) {
    const c = S.ctx;
    switch (kind) {
      case 'clipboard': c.fillStyle = '#8b5a2b'; c.fillRect(x - 2.4, y - 3.4, 4.8, 6.4); c.fillStyle = '#f8fafc'; c.fillRect(x - 1.9, y - 2.6, 3.8, 5.2); c.fillStyle = '#9ca3af'; c.fillRect(x - 1, y - 3.8, 2, 1); break;
      case 'bag': c.fillStyle = col || '#f8fafc'; c.fillRect(x - 2.6, y - 3, 5.2, 6); c.fillStyle = '#10b981'; c.fillRect(x - 2.6, y - 1, 5.2, 1.4); break;
      case 'card': c.fillStyle = col || '#d4af37'; c.fillRect(x - 2, y - 1.3, 4, 2.6); break;
      case 'tablet': c.fillStyle = '#111827'; c.fillRect(x - 3.4, y - 2.6, 6.8, 5); c.fillStyle = col || '#38bdf8'; c.fillRect(x - 2.8, y - 2.1, 5.6, 4); break;
      case 'box': c.fillStyle = col || '#c69c6d'; c.fillRect(x - 3.5, y - 3, 7, 5.5); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(x - 3.5, y - 0.6, 7, 0.8); break;
      case 'tray': c.fillStyle = '#e5e7eb'; c.fillRect(x - 4, y - 0.8, 8, 1.6); c.fillStyle = col || '#f59e0b'; c.beginPath(); c.arc(x - 1.5, y - 2, 1.4, 0, 7); c.arc(x + 1.8, y - 2, 1.2, 0, 7); c.fill(); break;
      case 'mop': c.strokeStyle = '#a16207'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 4, y + 18); c.stroke(); c.fillStyle = '#e5e7eb'; c.fillRect(x + 1.5, y + 17, 6, 2.2); break;
      default: c.fillStyle = col || '#fde68a'; c.fillRect(x - 2, y - 2.6, 4, 5.2); c.fillStyle = '#94a3b8'; c.fillRect(x - 1.4, y - 1.4, 2.8, 0.5); c.fillRect(x - 1.4, y, 2.8, 0.5);
    }
  }
  // lying figure in grid plane (axis 'x' | 'y'; headAt -1|+1 along axis)
  function drawLying(gx, gy, z, spec) {
    const Lk = spec.look, axis = spec.axis || 'x', hd = spec.head || -1;
    const c = S.ctx;
    gridSpace(z, g => {
      const U = TEX;
      g.translate(gx * U, gy * U);
      if (axis === 'y') g.rotate(Math.PI / 2);
      if (hd > 0) g.rotate(Math.PI);
      // body along +x from head at -x
      const topC = Lk.gown || Lk.top || '#9bbbd6';
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(0.05 * U, 0.06 * U, 0.85 * U, 0.26 * U, 0, 0, 7); g.fill();
      // legs
      g.fillStyle = Lk.gown ? Lk.skin : (Lk.bottom || '#334155');
      g.beginPath(); g.roundRect(0.05 * U, -0.17 * U, 0.78 * U, 0.15 * U, 0.06 * U); g.roundRect(0.05 * U, 0.02 * U, 0.78 * U, 0.15 * U, 0.06 * U); g.fill();
      g.fillStyle = Lk.shoe || '#222'; g.fillRect(0.8 * U, -0.17 * U, 0.08 * U, 0.15 * U); g.fillRect(0.8 * U, 0.02 * U, 0.08 * U, 0.15 * U);
      // torso
      g.fillStyle = topC; g.beginPath(); g.roundRect(-0.5 * U, -0.23 * U, 0.6 * U, 0.46 * U, 0.12 * U); g.fill();
      // arms
      g.fillStyle = shade(topC, 0.9); g.beginPath(); g.roundRect(-0.45 * U, -0.3 * U, 0.48 * U, 0.09 * U, 0.04 * U); g.roundRect(-0.45 * U, 0.21 * U, 0.48 * U, 0.09 * U, 0.04 * U); g.fill();
      g.fillStyle = Lk.skin; g.beginPath(); g.arc(0.05 * U, -0.26 * U, 0.05 * U, 0, 7); g.arc(0.05 * U, 0.26 * U, 0.05 * U, 0, 7); g.fill();
      // blanket
      if (spec.blanket) { g.fillStyle = spec.blanket; g.beginPath(); g.roundRect(-0.12 * U, -0.33 * U, 1.05 * U, 0.66 * U, 0.08 * U); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-0.12 * U, -0.33 * U, 0.08 * U, 0.66 * U); }
      // head
      g.fillStyle = Lk.style === 'hijab' ? Lk.hijab : Lk.hair; g.beginPath(); g.arc(-0.66 * U, 0, 0.16 * U, 0, 7); g.fill();
      if (Lk.style !== 'hijab') { g.fillStyle = Lk.skin; g.beginPath(); g.ellipse(-0.6 * U, 0, 0.12 * U, 0.13 * U, 0, 0, 7); g.fill(); }
      else { g.fillStyle = Lk.skin; g.beginPath(); g.ellipse(-0.58 * U, 0, 0.09 * U, 0.1 * U, 0, 0, 7); g.fill(); }
    });
    // raised head shading for depth
    const hp = P(gx + (axis === 'x' ? -0.62 * -hd * -1 : 0), gy + (axis === 'y' ? -0.62 * -hd * -1 : 0), z + 3);
    void hp; void c;
  }

  const POSE = {
    WALKING: 'walk', MOPPING: 'walk', SITTING: 'sit', SITTING_WAIT: 'sit', SEATED: 'sit', LYING_ON_BED: 'lie', IN_SCANNER: 'lie', LYING: 'lie',
    TYPING_TERMINAL: 'type', HANDOVER_INTERACTION: 'handover', EXAMINING: 'examine', FRUSTRATED_WAIT: 'frustrated', PHONE_CALL: 'phone',
    IDLE: 'stand', STANDING: 'stand', SWIMMING_POOL: 'swim', YOGA_STRETCH: 'yoga', HANDS_UP_FATIGUE: 'handsup', CARRYING_AID: 'carry',
    HOLDING_TABLET_LEAK: 'tablet', PUSHING: 'push', WHEELCHAIR: 'wheelchair', SIT_UP_BED: 'situp'
  };
  function mapPose(p) {
    if (!p) return 'stand';
    if (POSE[p]) return POSE[p];
    const u = String(p).toUpperCase();
    if (u.includes('WALK')) return 'walk'; if (u.includes('WHEEL')) return 'wheelchair'; if (u.includes('SIT')) return 'sit';
    if (u.includes('LY') || u.includes('BED') || u.includes('SCAN')) return 'lie'; if (u.includes('TYP')) return 'type';
    return String(p).toLowerCase();
  }

  // person drawable: spec { id, gx, gy, z, pose, dir, role, seed, look, axis, head, blanket, label, sub, sel, bubble, bubbleType, prop }
  function person(spec) {
    S.agentsNow.push(spec);
    const pose = mapPose(spec.pose);
    // auto-facing from movement
    let dir = spec.dir;
    const prev = S.agentsPrev.get(spec.id);
    if (prev) {
      const dx = spec.gx - prev.gx, dy = spec.gy - prev.gy;
      if (Math.hypot(dx, dy) > 0.008) {
        dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'SE' : 'NW') : (dy > 0 ? 'SW' : 'NE');
        prev.dir = dir; prev.moving = 2;
      } else if (prev.moving > 0) { prev.moving--; dir = prev.dir; }
      else if (!spec.dir) dir = prev.dir;
      prev.gx = spec.gx; prev.gy = spec.gy;
    } else S.agentsPrev.set(spec.id, { gx: spec.gx, gy: spec.gy, dir: spec.dir || 'SE', moving: 0 });
    if (spec.dir && !(prev && prev.moving > 0)) dir = spec.dir;
    const Lk = spec.look || look(spec.role, spec.seed || 1);
    const z = spec.z || 0;
    const key = spec.gx + spec.gy + (spec.bias || 0) + (pose === 'lie' ? 0.35 : 0);
    S.items.push({
      key, draw: () => {
        if (pose === 'lie') drawLying(spec.gx, spec.gy, z, { look: Lk, axis: spec.axis, head: spec.head, blanket: spec.blanket });
        else { const p = P(spec.gx, spec.gy, z); drawPerson(p.x, p.y, { look: Lk, pose, dir: dir || 'SE', seed: spec.seed, prop: spec.prop, propCol: spec.propCol, seated: spec.seated, moving: prev && prev.moving > 0, noShadow: z > 0 }); }
        if (spec.sel) { const p = P(spec.gx, spec.gy, z); const c = S.ctx; c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, 13 * S.cam.z, 6.5 * S.cam.z, 0, 0, 7); c.stroke(); }
      }
    });
    const headZ = z + (pose === 'lie' ? 10 : pose === 'sit' ? 40 : pose === 'situp' ? 26 : pose === 'swim' ? 20 : 50);
    if (spec.label || spec.bubble) S.labels.push({ gx: spec.gx, gy: spec.gy, z, headZ, spec });
  }

  // ----------------------------------------------------------------- labels
  function roleName(role) {
    const map = {
      doctor: 'Doctor',
      nurse: 'Nurse',
      radiographer: 'Nurse',
      pharmacist: 'Pharmacist',
      reception: 'Staff',
      concierge: 'Concierge',
      admin: 'Staff',
      janitor: 'Staff',
      security: 'Staff',
      therapist: 'Staff',
      chef: 'Staff',
      lifeguard: 'Staff',
      resident: 'Patient',
      elderly: 'Patient',
      gown: 'Patient',
      patient: 'Patient'
    };
    return map[role] || 'Patient';
  }
  function nameplate(x, y, name, sub, role, sel) {
    const c = S.ctx, s = Math.max(0.85, Math.min(1.15, S.cam.z));
    const txt = name || roleName(role);
    const nf = `700 ${Math.round(9.5 * s)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    c.font = nf;
    const nw = c.measureText(txt).width;
    const w = nw + 15 * s, h = 13.5 * s;
    const bx = x - w / 2, by = y;
    const dot = { doctor: '#38bdf8', nurse: '#10b981', radiographer: '#10b981', pharmacist: '#4ade80', reception: '#a855f7', concierge: '#a855f7', admin: '#a855f7', janitor: '#94a3b8', security: '#94a3b8' }[role] || '#f59e0b';
    c.fillStyle = 'rgba(9,13,22,0.88)';
    c.strokeStyle = sel ? '#38bdf8' : 'rgba(148,163,184,0.45)';
    c.lineWidth = sel ? 1.5 : 0.9;
    c.beginPath(); c.roundRect(bx, by, w, h, 3.5 * s); c.fill(); c.stroke();
    c.fillStyle = dot; c.beginPath(); c.arc(bx + 6 * s, by + h / 2, 2.5 * s, 0, 7); c.fill();
    c.font = nf; c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(txt, bx + 11.5 * s, by + h / 2 + 0.5);
  }
  function bubble(x, y, text, type, prog) {
    const c = S.ctx, s = Math.max(0.85, Math.min(1.15, S.cam.z));
    c.font = `700 ${Math.round(8.5 * s)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const hasRing = typeof prog === 'number' && prog >= 0;
    const ringSpace = hasRing ? 14 * s : 0;
    const w = c.measureText(text).width + 10 * s + ringSpace, h = 15 * s;
    const pal = { fail: ['#450a0a', '#ef4444', '#fecaca'], ok: ['#052e24', '#10b981', '#a7f3d0'], warn: ['#422006', '#f59e0b', '#fde68a'] }[type] || ['#0f172a', '#0ea5e9', '#e0f2fe'];
    const bx = x - w / 2, by = y - h;
    c.fillStyle = pal[0]; c.strokeStyle = pal[1]; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(bx, by, w, h, 4 * s); c.fill(); c.stroke();
    if (hasRing) {
      const rx = bx + 8.5 * s, ry = by + h / 2, rad = 4.6 * s;
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1.8 * s;
      c.beginPath(); c.arc(rx, ry, rad, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = pal[1]; c.lineWidth = 1.9 * s;
      c.beginPath(); c.arc(rx, ry, rad, -Math.PI / 2, -Math.PI / 2 + Math.min(1, Math.max(0.05, prog)) * Math.PI * 2); c.stroke();
      c.fillStyle = pal[2]; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(text, bx + 16 * s, ry + 0.5);
    } else {
      c.fillStyle = pal[2]; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, x, by + h / 2 + 0.5);
    }
  }
  function drawLabels(showSub) {
    if (!showSub) return;
    S.labels.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    const placed = [];
    for (const L of S.labels) {
      const sp = L.spec;
      const foot = P(L.gx, L.gy, L.z);
      const shortRole = sp.label || roleName(sp.role);
      let y = foot.y + 4 * S.cam.z;
      for (const q of placed) if (Math.abs(q.x - foot.x) < 46 && Math.abs(q.y - y) < 15) y = q.y + 15;
      placed.push({ x: foot.x, y });
      nameplate(foot.x, y, shortRole, '', sp.role, sp.sel);
      if (sp.bubble && (sp.sel || sp.showBubble)) {
        const h = P(L.gx, L.gy, L.headZ + 5);
        bubble(h.x, h.y, sp.bubble, sp.bubbleType, sp.taskProg);
      }
    }
  }

  // Calibrated Role-Based Speed & Ease-In/Ease-Out Physics (with Corridor Waypoint Routing)
  function roleSpeed(role, pose, urgent) {
    if (pose === 'WHEELCHAIR') return 0.55;
    if (role === 'resident' || role === 'elderly') return 0.72;
    if (role === 'patient' || role === 'gown') return 0.90;
    if (urgent) return 1.45;
    return 1.05;
  }

  function stepAgentPhysics(ag, tx, ty, dtSec, opts) {
    opts = opts || {};
    const destPose = ag.pose;
    const crossBuilding = opts.splitX != null && ((ag.gx < opts.splitX) !== (tx < opts.splitX));
    if (opts.snap || crossBuilding || Math.hypot(tx - ag.gx, ty - ag.gy) > 15.0) {
      ag.gx = tx; ag.gy = ty; ag.vel = 0;
      if (ag.pose === 'WALKING') ag.pose = 'IDLE';
      return;
    }
    const finalDist = Math.hypot(tx - ag.gx, ty - ag.gy);
    if (finalDist <= 0.06) {
      ag.gx = tx; ag.gy = ty; ag.vel = 0;
      if (destPose === 'WALKING') ag.pose = 'IDLE';
      return;
    }

    // Orthogonal corridor waypoint routing (room -> corridor doorway -> target room doorway -> room)
    let wx = tx, wy = ty;
    const cy = opts.corridorY;
    if (cy != null) {
      const agInCorr = Math.abs(ag.gy - cy) <= 0.28;
      const dstInCorr = Math.abs(ty - cy) <= 0.28;
      const crossCorridor = (ag.gy - cy) * (ty - cy) < -0.15;
      if (agInCorr && Math.abs(ag.gx - tx) > 0.12) {
        wx = tx; wy = cy;
      } else if (!agInCorr && (crossCorridor || Math.abs(ag.gx - tx) > 1.4) && (!dstInCorr || Math.abs(ag.gx - tx) > 0.12)) {
        wx = ag.gx; wy = cy;
      }
    }

    const dx = wx - ag.gx, dy = wy - ag.gy;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.02) {
      ag.gx = wx; ag.gy = wy;
      return;
    }
    const ux = dx / dist, uy = dy / dist;
    const mult = roleSpeed(ag.role, destPose, opts.urgent);
    const baseTilesPerSec = (opts.baseSpeed || 6.8) * mult * (opts.simSpeed || 1);
    const easeOut = Math.min(1, Math.max(0.32, finalDist / 0.9));
    const targetSpeed = baseTilesPerSec * easeOut;
    ag.vel = (ag.vel || 0) + (targetSpeed - (ag.vel || 0)) * Math.min(1, dtSec * 9.0);
    const step = Math.min(dist, ag.vel * dtSec);
    ag.gx += ux * step;
    ag.gy += uy * step;
    ag.pose = destPose === 'WHEELCHAIR' ? 'WHEELCHAIR' : 'WALKING';
    ag.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'SE' : 'NW') : (dy > 0 ? 'SW' : 'NE');
  }

  function formatShiftClock(simMinutes) {
    const totalMins = Math.floor(8 * 60 + (simMinutes % (16 * 60)));
    const hh = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
    const mm = String(totalMins % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // ------------------------------------------------------------------ input
  function attachInput(onClick) {
    const cv = S.canvas;
    let drag = null, pinch = null;
    cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, cx: S.cam.cx, cy: S.cam.cy, moved: false }; cv.style.cursor = 'grabbing'; });
    window.addEventListener('mousemove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      S.cam.cx = drag.cx - dx / S.cam.z; S.cam.cy = drag.cy - dy / S.cam.z;
    });
    window.addEventListener('mouseup', e => {
      if (drag && !drag.moved && onClick) { const r = cv.getBoundingClientRect(); onClick(e.clientX - r.left, e.clientY - r.top); }
      drag = null; cv.style.cursor = 'grab';
    });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    cv.addEventListener('touchstart', e => {
      if (e.touches.length === 1) drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, cx: S.cam.cx, cy: S.cam.cy, moved: false };
      else if (e.touches.length === 2) { drag = null; pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z: S.cam.z }; }
    }, { passive: true });
    cv.addEventListener('touchmove', e => {
      if (drag && e.touches.length === 1) { const dx = e.touches[0].clientX - drag.x, dy = e.touches[0].clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; S.cam.cx = drag.cx - dx / S.cam.z; S.cam.cy = drag.cy - dy / S.cam.z; e.preventDefault(); }
      else if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); S.cam.z = Math.max(zoomMin, Math.min(zoomMax, pinch.z * d / pinch.d)); e.preventDefault(); }
    }, { passive: false });
    cv.addEventListener('touchend', e => {
      if (drag && !drag.moved && onClick && e.changedTouches[0]) { const r = cv.getBoundingClientRect(); onClick(e.changedTouches[0].clientX - r.left, e.changedTouches[0].clientY - r.top); }
      drag = null; pinch = null;
    });
    cv.style.cursor = 'grab';
  }
  function zoomAt(f, sx, sy) {
    updateOrigin();
    const before = { x: (sx - S.ox) / S.cam.z, y: (sy - S.oy) / S.cam.z };
    S.cam.z = Math.max(zoomMin, Math.min(zoomMax, S.cam.z * f));
    S.cam.cx = before.x - (sx - S.vpW / 2) / S.cam.z;
    S.cam.cy = before.y - (sy - S.vpH / 2) / S.cam.z;
  }

  // ----------------------------------------------------------------- public
  function init(canvas, map, onClick) {
    S.canvas = canvas; S.ctx = canvas.getContext('2d'); S.map = map;
    S.proj = map.proj || { ax: TW / 2, ay: TH / 2, bx: -TW / 2, by: TH / 2 };
    S.bakes = {};
    resize(); window.addEventListener('resize', resize);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas.parentElement);
    attachInput(onClick);
    fit();
  }
  function resize() {
    const vp = S.canvas.parentElement;
    S.dpr = Math.min(2, window.devicePixelRatio || 1);
    S.vpW = vp.clientWidth; S.vpH = vp.clientHeight;
    S.canvas.width = Math.round(S.vpW * S.dpr); S.canvas.height = Math.round(S.vpH * S.dpr);
    S.canvas.style.width = S.vpW + 'px'; S.canvas.style.height = S.vpH + 'px';
  }
  function fit(focus) {
    const b = focus || S.map.view || S.map.bounds;
    const wb = worldBounds(b);
    const w = wb.maxX - wb.minX, h = wb.maxY - wb.minY + 80;
    S.cam.z = Math.max(zoomMin, Math.min(1.6, Math.min(S.vpW / w, S.vpH / h) * 0.98));
    S.cam.cx = (wb.minX + wb.maxX) / 2; S.cam.cy = (wb.minY + wb.maxY) / 2 - 24;
  }
  function panTo(gx, gy, z) {
    const pr = S.proj;
    if (z) S.cam.z = Math.max(zoomMin, Math.min(zoomMax, z));
    S.cam.cx = gx * pr.ax + gy * pr.bx; S.cam.cy = gx * pr.ay + gy * pr.by - 20;
  }
  function setCondition(cond) { S.cond = cond; }
  function invalidate() { S.bakes = {}; }

  // frame lifecycle: begin → push items → end
  function begin() {
    S.t++;
    const c = S.ctx;
    c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    updateOrigin();
    const bg = c.createLinearGradient(0, 0, 0, S.vpH);
    bg.addColorStop(0, '#0b1220'); bg.addColorStop(1, '#121b2d');
    c.fillStyle = bg; c.fillRect(0, 0, S.vpW, S.vpH);
    if (!S.bakes[S.cond]) S.bakes[S.cond] = bakeFloor(S.cond);
    const bk = S.bakes[S.cond], z = S.cam.z;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(bk.cv, S.ox + bk.wb.minX * z, S.oy + bk.wb.minY * z, bk.cv.width / BAKE * z, bk.cv.height / BAKE * z);
    S.items = []; S.labels = []; S.agentsNow = [];
  }
  function item(key, fn) { S.items.push({ key, draw: fn }); }
  function furniture(x, y, W, D, rot, builder, bias) {
    const r = ((rot | 0) % 4 + 4) % 4;
    const fw = r % 2 ? D : W, fd = r % 2 ? W : D;
    S.items.push({ key: x + fw / 2 + y + fd / 2 + (bias || 0), fp: [x, y, fw, fd], draw: () => { const k = kit(x, y, W, D, r); builder(k); runParts(k.parts); } });
  }
  function end(opts) {
    opts = opts || {};
    pushWalls();
    // contact shadows for furniture
    for (const it of S.items) if (it.fp && !it.noShadow) shadowRect(it.fp[0], it.fp[1], it.fp[2], it.fp[3], 0.13);
    S.items.sort((a, b) => a.key - b.key);
    for (const it of S.items) it.draw();
  }
  function overlay(showSub) { drawLabels(showSub); }

  global.PH = {
    TW, TH, TEX, WALL_FULL, WALL_LOW,
    S, P, shade, mix, rgba, mulberry, hashStr,
    init, resize, fit, panTo, zoomAt, setCondition, invalidate, screenToGrid,
    begin, end, overlay, item, furniture, person, look, mapPose,
    box, topQuad, vquad, cyl, disc, blob, line3, poly, gridSpace, planeText, pattern, texCanvas,
    drawPerson, drawLying, nameplate, bubble, kit, runParts,
    roleSpeed, stepAgentPhysics, formatShiftClock,
    get zoom() { return S.cam.z; }, set wallsUp(v) { S.wallsUp = !!v; }, get wallsUp() { return S.wallsUp; },
    get t() { return S.t; }, get cond() { return S.cond; }
  };
})(window);
