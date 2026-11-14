// ============================================================================
// BAHM330-A1: 28x22 Project Hospital Isometric Renderer & Facility Upgrade Engine
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 28;
  const GRID_H = 22;
  const TILE_W = 44;
  const TILE_H = 22;

  let canvas, ctx;
  let camX = 0;
  let camY = 55;
  let zoom = 0.95;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let frameTick = 0;
  let upgradePulse = 0;
  let upgradeMode = 'future';

  function init(canvasId, onClickWorld) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', e => {
      dragging = true;
      dragStartX = e.clientX - camX;
      dragStartY = e.clientY - camY;
      if (onClickWorld) {
        const rect = canvas.getBoundingClientRect();
        onClickWorld(e.clientX - rect.left, e.clientY - rect.top);
      }
    });

    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      camX = e.clientX - dragStartX;
      camY = e.clientY - dragStartY;
    });

    window.addEventListener('mouseup', () => {
      dragging = false;
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      zoomCam(e.deltaY < 0 ? 1.08 : 0.92);
    }, { passive: false });
  }

  function resize() {
    if (!canvas) return;
    const vp = canvas.parentElement;
    canvas.width = vp.clientWidth * window.devicePixelRatio;
    canvas.height = vp.clientHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function zoomCam(factor) {
    zoom = Math.max(0.5, Math.min(1.9, zoom * factor));
  }

  function resetCam() {
    camX = 0;
    camY = 55;
    zoom = 0.95;
  }

  function panToGrid(gx, gy, targetZoom = 1.2) {
    zoom = targetZoom;
    const dx = (gx - gy) * (TILE_W * 0.5) * zoom;
    const dy = (gx + gy) * (TILE_H * 0.5) * zoom;
    camX = -dx + (GRID_W - GRID_H) * 6;
    camY = 210 - dy;
  }

  function triggerUpgradePulse(mode) {
    upgradePulse = 1.0;
    upgradeMode = mode;
  }

  function toIso(gx, gy, gz = 0) {
    const vpW = canvas.width / window.devicePixelRatio;
    const vpH = canvas.height / window.devicePixelRatio;
    const originX = vpW * 0.45 + camX;
    const originY = vpH * 0.08 + camY;
    return {
      x: originX + (gx - gy) * (TILE_W * 0.5) * zoom,
      y: originY + (gx + gy) * (TILE_H * 0.5) * zoom - gz * zoom
    };
  }

  function drawTile(gx, gy, fill, stroke = 'rgba(15,23,42,0.16)') {
    const p0 = toIso(gx, gy);
    const p1 = toIso(gx + 1, gy);
    const p2 = toIso(gx + 1, gy + 1);
    const p3 = toIso(gx, gy + 1);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
  }

  function drawIsoBox(gx, gy, w, d, h, topCol, leftCol, rightCol, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const p00 = toIso(gx, gy, h);
    const p10 = toIso(gx + w, gy, h);
    const p11 = toIso(gx + w, gy + d, h);
    const p01 = toIso(gx, gy + d, h);
    const b10 = toIso(gx + w, gy, 0);
    const b11 = toIso(gx + w, gy + d, 0);
    const b01 = toIso(gx, gy + d, 0);

    ctx.beginPath();
    ctx.moveTo(p01.x, p01.y); ctx.lineTo(p11.x, p11.y); ctx.lineTo(b11.x, b11.y); ctx.lineTo(b01.x, b01.y);
    ctx.closePath(); ctx.fillStyle = leftCol; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p10.x, p10.y); ctx.lineTo(p11.x, p11.y); ctx.lineTo(b11.x, b11.y); ctx.lineTo(b10.x, b10.y);
    ctx.closePath(); ctx.fillStyle = rightCol; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p00.x, p00.y); ctx.lineTo(p10.x, p10.y); ctx.lineTo(p11.x, p11.y); ctx.lineTo(p01.x, p01.y);
    ctx.closePath(); ctx.fillStyle = topCol; ctx.fill();
    ctx.restore();
  }

  function drawTree(gx, gy) {
    const base = toIso(gx + 0.5, gy + 0.5, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, 10 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    drawIsoBox(gx + 0.38, gy + 0.38, 0.24, 0.24, 10, '#78350f', '#451a03', '#5c2408');
    const canopy1 = toIso(gx + 0.5, gy + 0.5, 16);
    const canopy2 = toIso(gx + 0.5, gy + 0.5, 23);
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(canopy1.x, canopy1.y, 10 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(canopy2.x, canopy2.y, 7 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawIndoorPlant(gx, gy) {
    drawIsoBox(gx, gy, 0.36, 0.36, 6, '#e2e8f0', '#94a3b8', '#64748b');
    const p = toIso(gx + 0.18, gy + 0.18, 10);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.2 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(p.x - 1.5 * zoom, p.y - 2 * zoom, 3.2 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFloorHalo(gx, gy, rx, ry, col, label) {
    const p = toIso(gx, gy, 1);
    const pulse = 1 + Math.sin(frameTick * 0.14) * 0.12;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * zoom * pulse, ry * zoom * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 1.6 * zoom;
    ctx.stroke();
    if (label) {
      ctx.font = `bold ${Math.round(7.5 * zoom)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y + (ry + 6) * zoom);
    }
    ctx.restore();
  }

  function drawPaperClutter(gx, gy) {
    // Stacks of messy paper folders & manual clipboards on desks in Current State
    drawIsoBox(gx, gy, 0.35, 0.28, 4.5, '#fef08a', '#ca8a04', '#a16207');
    drawIsoBox(gx + 0.42, gy + 0.08, 0.32, 0.26, 3.2, '#fca5a5', '#dc2626', '#991b1b');
  }

  function drawFlickeringWarningLight(gx, gy, text) {
    const on = frameTick % 24 < 14;
    const p = toIso(gx, gy, 28);
    ctx.fillStyle = on ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5 * zoom, 0, Math.PI * 2);
    ctx.fill();
    if (on && text) {
      ctx.font = `bold ${Math.round(7 * zoom)}px monospace`;
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(text, p.x, p.y - 7 * zoom);
    }
  }

  function drawBiometricKiosk(gx, gy, label) {
    drawIsoBox(gx, gy, 0.45, 0.45, 16, '#0ea5e9', '#0284c7', '#0369a1');
    const scr = toIso(gx + 0.22, gy + 0.22, 18);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();
    if (label) {
      ctx.font = `bold ${Math.round(6.8 * zoom)}px monospace`;
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText(label, scr.x, scr.y - 7 * zoom);
    }
  }

  function drawHospitalBedFull(gx, gy, luxury = false, glowingReady = false) {
    if (glowingReady) {
      drawFloorHalo(gx + 0.7, gy + 0.4, 20, 10, '#10b981', 'FRESH LINEN & AMENITIES');
    }
    drawIsoBox(gx, gy, 1.4, 0.8, 8, luxury ? '#fef3c7' : '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(gx, gy, 0.22, 0.8, 16, luxury ? '#78350f' : '#0284c7', '#451a03', '#0369a1');
    drawIsoBox(
      gx + 0.45,
      gy + 0.05,
      0.9,
      0.7,
      9.5,
      glowingReady ? '#10b981' : (luxury ? '#d97706' : '#38bdf8'),
      glowingReady ? '#059669' : '#b45309',
      '#0284c7'
    );
    if (!luxury) {
      drawIsoBox(gx + 0.1, gy - 0.25, 0.25, 0.25, 18, '#e2e8f0', '#64748b', '#475569');
      const scr = toIso(gx + 0.22, gy - 0.12, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(scr.x - 3 * zoom, scr.y - 3 * zoom, 6 * zoom, 4 * zoom);
    }
  }

  function drawReceptionDeskDual(gx, gy, w, d, isFuture) {
    drawIsoBox(gx, gy, w, d, 12, isFuture ? '#f8fafc' : '#cbd5e1', '#475569', '#334155');
    if (!isFuture) {
      drawPaperClutter(gx + 0.2, gy + 0.15);
    }
    const count = isFuture ? 2 : 1;
    for (let m = 0; m < count; m++) {
      const mp = toIso(gx + 0.45 + m * 0.75, gy + d * 0.5, 16);
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = isFuture ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.fillRect(mp.x - 7 * zoom, mp.y - 6 * zoom, 14 * zoom, 9 * zoom);
      ctx.strokeRect(mp.x - 7 * zoom, mp.y - 6 * zoom, 14 * zoom, 9 * zoom);
      ctx.fillStyle = isFuture ? '#10b981' : '#ef4444';
      ctx.fillRect(mp.x - 5 * zoom, mp.y - 4 * zoom, 9 * zoom, 2 * zoom);
    }
  }

  function drawConciergeVan(van, isVipFuture, labelText) {
    const { gx, gy, doorsOpen, rampExtended, brakeLights } = van;
    const sh = toIso(gx + 1.0, gy + 0.6, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, 38 * zoom, 17 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    if (rampExtended) {
      drawIsoBox(gx - 0.9, gy + 0.15, 0.9, 0.7, 2.5, isVipFuture ? '#38bdf8' : '#94a3b8', '#0284c7', '#334155');
      const rp = toIso(gx - 0.45, gy + 0.5, 4);
      ctx.fillStyle = isVipFuture ? '#6ee7b7' : '#fca5a5';
      ctx.font = `bold ${Math.round(7.2 * zoom)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(isVipFuture ? 'HYDRAULIC VIP LIFT' : 'WAIT +30m STAGING', rp.x, rp.y);
    }

    drawIsoBox(gx, gy, 2.0, 1.05, 19, '#f8fafc', '#cbd5e1', '#94a3b8');
    drawIsoBox(
      gx + 0.05,
      gy - 0.02,
      1.9,
      1.09,
      10,
      isVipFuture ? '#0ea5e9' : '#dc2626',
      isVipFuture ? '#0284c7' : '#b91c1c',
      isVipFuture ? '#0369a1' : '#991b1b'
    );
    drawIsoBox(gx + 0.3, gy + 0.08, 1.3, 0.88, 25, '#1e293b', '#0f172a', '#334155');

    if (doorsOpen) {
      drawIsoBox(gx - 0.3, gy - 0.12, 0.32, 0.15, 17, '#e2e8f0', '#94a3b8', '#64748b');
      drawIsoBox(gx - 0.3, gy + 0.95, 0.32, 0.15, 17, '#e2e8f0', '#94a3b8', '#64748b');
    }

    if (brakeLights) {
      const b1 = toIso(gx, gy + 0.2, 9);
      const b2 = toIso(gx, gy + 0.85, 9);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(b1.x, b1.y, 4 * zoom, 0, Math.PI * 2);
      ctx.arc(b2.x, b2.y, 4 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    const beacon = toIso(gx + 1.0, gy + 0.5, 27);
    ctx.fillStyle = isVipFuture ? (frameTick % 18 < 9 ? '#10b981' : '#0ea5e9') : (frameTick % 18 < 9 ? '#ef4444' : '#f59e0b');
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, 4.2 * zoom, 0, Math.PI * 2);
    ctx.fill();

    if (labelText) {
      const lp = toIso(gx + 1.0, gy + 0.5, 34);
      ctx.font = `bold ${Math.round(7.5 * zoom)}px monospace`;
      ctx.fillStyle = isVipFuture ? '#6ee7b7' : '#fcd34d';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, lp.x, lp.y);
    }
  }

  function drawAgent(agent, showLabels, isSelected) {
    const { gx, gy, role, pose, dir, actionLabel, bubble, bubbleType } = agent;
    const s = zoom;
    const base = toIso(gx, gy, 0);

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, 13 * s, 6.5 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.36)';
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, 8 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    let coat = '#0ea5e9', pants = '#1e293b';
    if (role === 'doctor') { coat = '#f8fafc'; pants = '#334155'; }
    else if (role === 'nurse') { coat = '#06b6d4'; pants = '#0f172a'; }
    else if (role === 'concierge') { coat = '#1e3a8a'; pants = '#0f172a'; }
    else if (role === 'cleaner') { coat = '#10b981'; pants = '#064e3b'; }
    else if (role === 'resident') { coat = '#f59e0b'; pants = '#475569'; }

    if (pose === 'LYING_ON_BED') {
      const bp = toIso(gx, gy, 10);
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.roundRect(bp.x - 12 * s, bp.y - 4.5 * s, 20 * s, 8 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(bp.x - 14 * s, bp.y - 0.5 * s, 4.6 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === 'SITTING' || pose === 'SITTING_WAIT') {
      const seat = toIso(gx, gy, 4);
      ctx.fillStyle = pants;
      ctx.fillRect(seat.x - 3.5 * s, seat.y - 5.5 * s, 7 * s, 3.8 * s);
      ctx.fillRect(seat.x + 1.8 * s, seat.y - 5.5 * s, 2.6 * s, 6 * s);
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.roundRect(seat.x - 5 * s, seat.y - 16 * s, 10 * s, 11 * s, 2.8 * s);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 20.5 * s, 4.5 * s, 0, Math.PI * 2);
      ctx.fill();
      if (pose === 'SITTING_WAIT') {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(seat.x + 4 * s, seat.y - 12 * s);
        ctx.lineTo(seat.x + 8 * s, seat.y - 16 * s);
        ctx.stroke();
      }
    } else {
      const isWalk = pose === 'WALKING';
      const stride = isWalk ? Math.sin(frameTick * 0.26 + agent.idNum) * 3.8 * s : 0;
      const bob = isWalk ? Math.abs(Math.sin(frameTick * 0.26 + agent.idNum)) * 2.5 : 0;
      const pos = toIso(gx, gy, bob);

      const dirMap = {
        N: { dx: 0, dy: -1.5 }, NE: { dx: 1.5, dy: -1 }, E: { dx: 2, dy: 0 }, SE: { dx: 1.5, dy: 1 },
        S: { dx: 0, dy: 1.5 }, SW: { dx: -1.5, dy: 1 }, W: { dx: -2, dy: 0 }, NW: { dx: -1.5, dy: -1 }
      };
      const f = dirMap[dir || 'SE'] || { dx: 1, dy: 1 };

      ctx.fillStyle = pants;
      const tap = (pose === 'FRUSTRATED_WAIT' && frameTick % 14 < 7) ? -2 * s : 0;
      ctx.fillRect(pos.x - 3.2 * s, pos.y - 8.5 * s + stride * 0.35, 2.6 * s, 8.5 * s);
      ctx.fillRect(pos.x + 0.7 * s, pos.y - 8.5 * s - stride * 0.35 + tap, 2.6 * s, 8.5 * s);

      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.roundRect(pos.x - 5.2 * s + f.dx * 0.4 * s, pos.y - 20 * s, 10.4 * s, 12 * s, 2.8 * s);
      ctx.fill();

      ctx.strokeStyle = coat;
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      if (pose === 'TYPING_TERMINAL') {
        const osc = (frameTick % 8 < 4) ? -1.8 * s : 1.8 * s;
        ctx.moveTo(pos.x - 4 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x - 8 * s, pos.y - 12 * s + osc);
        ctx.moveTo(pos.x + 4 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x + 8 * s, pos.y - 12 * s - osc);
      } else if (pose === 'MOPPING') {
        const mopSwing = Math.sin(frameTick * 0.22) * 7 * s;
        ctx.moveTo(pos.x + 3 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x + 8 * s + mopSwing, pos.y + 1 * s);
      } else if (pose === 'EXAMINING') {
        const osc = Math.sin(frameTick * 0.2) * 3 * s;
        ctx.moveTo(pos.x + 4 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x - 7 * s, pos.y - 11 * s + osc);
      } else {
        ctx.moveTo(pos.x - 5 * s, pos.y - 17 * s);
        ctx.lineTo(pos.x - 5 * s - stride, pos.y - 10 * s);
        ctx.moveTo(pos.x + 5 * s, pos.y - 17 * s);
        ctx.lineTo(pos.x + 5 * s + stride, pos.y - 10 * s);
      }
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(pos.x + f.dx * 0.7 * s, pos.y - 24.5 * s, 4.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showLabels && actionLabel) {
      ctx.font = `600 ${Math.round(7.5 * s)}px -apple-system, sans-serif`;
      const lw = ctx.measureText(actionLabel).width + 8 * s;
      ctx.fillStyle = 'rgba(9,13,22,0.88)';
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(base.x - lw / 2, base.y + 4 * s, lw, 12 * s, 3 * s);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(actionLabel, base.x, base.y + 10 * s);
    }

    if (bubble) {
      const top = toIso(gx, gy, 35);
      drawStatusBubble(top.x, top.y, bubble, bubbleType);
    }
  }

  function drawStatusBubble(x, y, text, type) {
    const s = zoom;
    ctx.font = `bold ${Math.round(8.5 * s)}px ui-monospace, monospace`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 10 * s;
    const bh = 15 * s;

    let bg = '#0f172a', border = '#0ea5e9', fg = '#f8fafc';
    if (type === 'wait') { bg = '#450a0a'; border = '#ef4444'; fg = '#fca5a5'; }
    else if (type === 'ok') { bg = '#064e3b'; border = '#10b981'; fg = '#6ee7b7'; }

    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh, bw, bh, 4 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - bh / 2);
  }

  function drawZoneSign(gx, gy, text, accent) {
    const p = toIso(gx, gy, 2);
    ctx.font = `bold ${Math.round(9 * zoom)}px -apple-system, sans-serif`;
    const w = ctx.measureText(text).width + 10 * zoom;
    ctx.fillStyle = 'rgba(9,13,22,0.88)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, p.y - 7.5 * zoom, w, 15 * zoom, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p.x, p.y);
  }

  function render(simState) {
    if (!ctx) return;
    frameTick++;
    const vpW = canvas.width / window.devicePixelRatio;
    const vpH = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, vpW, vpH);

    const isFuture = simState.mode === 'future';

    // 1. Render 28x22 Floor Grid (Aged/Scuffed in Current vs Renovated Smart Flooring in Future)
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#0f172a';
        if (gx === 0 || gx === 27 || gy === 0 || gy === 21) {
          fill = '#1e293b';
        } else if (gx >= 11 && gx <= 15) {
          fill = isFuture ? '#0f172a' : '#1e293b'; // S3 Transit Roadway / Covered VIP Bay
        } else if (gx < 11) {
          // Left Campus: Partner Hospital
          if (gy === 9 || gy === 10) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#38bdf8' : '#0ea5e9')
              : ((gx + gy) % 2 === 0 ? '#94a3b8' : '#64748b');
          } else if (gy < 9) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#f8fafc' : '#e0f2fe')
              : ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8');
          } else {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#ecfdf5' : '#d1fae5') // Fast-Track Discharge & e-Clearance Lounge
              : ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8'); // Cramped Billing Hall
          }
        } else {
          // Right Campus: Luxury Geriatric Retreat
          if (gy === 9 || gy === 10) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#f59e0b' : '#d97706')
              : ((gx + gy) % 2 === 0 ? '#92400e' : '#78350f');
          } else if (gx <= 21 && gy < 9) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd') // Dedicated On-Site Visiting MD Telemetry Suite
              : ((gx + gy) % 2 === 0 ? '#94a3b8' : '#64748b');
          } else if (gx <= 21 && gy > 10) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#d97706' : '#b45309') // Pre-Prepared Luxury Suites
              : ((gx + gy) % 2 === 0 ? '#78350f' : '#5c2408');
          } else {
            if (gx >= 23 && gx <= 25 && gy >= 2 && gy <= 7) {
              fill = isFuture ? '#06b6d4' : '#0e7490'; // Heated Hydrotherapy Pool
            } else {
              fill = isFuture
                ? ((gx + gy) % 2 === 0 ? '#b47b48' : '#9c6638')
                : ((gx + gy) % 2 === 0 ? '#78350f' : '#5c2408');
            }
          }
        }
        drawTile(gx, gy, fill);

        // Current State floor scuff marks
        if (!isFuture && (gx * 7 + gy * 13) % 19 === 0 && gx > 1 && gx < 26 && gy > 1 && gy < 20) {
          const sc = toIso(gx + 0.5, gy + 0.5, 0.2);
          ctx.strokeStyle = 'rgba(15,23,42,0.45)';
          ctx.lineWidth = 1.2 * zoom;
          ctx.beginPath();
          ctx.moveTo(sc.x - 4 * zoom, sc.y - 2 * zoom);
          ctx.lineTo(sc.x + 4 * zoom, sc.y + 2 * zoom);
          ctx.stroke();
        }

        // Roadway dividing line
        if (gx === 13 && gy % 2 === 1) {
          const r0 = toIso(13.2, gy + 0.15);
          const r1 = toIso(13.2, gy + 0.85);
          ctx.strokeStyle = isFuture ? '#10b981' : '#f59e0b';
          ctx.lineWidth = 1.8 * zoom;
          ctx.beginPath();
          ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y);
          ctx.stroke();
        }
      }
    }

    // 2. Red Congestion Halos (Before) vs Glowing Emerald-Cyan Flow Paths (After)
    if (!isFuture) {
      drawFloorHalo(4.5, 7.2, 26, 12, '#ef4444', 'WARD HANDOVER BACKLOG (+45m)');
      drawFloorHalo(5.8, 14.2, 32, 15, '#ef4444', 'PAPER GL QUEUE (+45m)');
      drawFloorHalo(10.0, 14.5, 22, 11, '#f59e0b', 'VAN STAGING WAIT (+30m)');
      drawFloorHalo(17.8, 14.5, 25, 12, '#ef4444', 'UNREADY SUITE WAIT (+30m)');
      drawFloorHalo(18.5, 5.5, 24, 11, '#ef4444', 'DISTANT MD DELAY (+30m)');
    } else {
      // Smooth Emerald-Cyan Fast-Track Flow Path
      const flowPts = [
        toIso(4.5, 5.5, 2),
        toIso(4.5, 13.5, 2),
        toIso(11.5, 14.2, 2),
        toIso(18.5, 14.5, 2),
        toIso(18.5, 4.5, 2),
        toIso(24.0, 12.5, 2)
      ];
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.8 * zoom;
      ctx.setLineDash([7 * zoom, 5 * zoom]);
      ctx.lineDashOffset = -(frameTick * 1.6);
      ctx.beginPath();
      ctx.moveTo(flowPts[0].x, flowPts[0].y);
      for (let i = 1; i < flowPts.length; i++) ctx.lineTo(flowPts[i].x, flowPts[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // Hydrotherapy Pool Ripples
    const poolCenter = toIso(24.5, 4.8, 1);
    const rad = (9 + (frameTick % 36) * 0.65) * zoom;
    ctx.strokeStyle = 'rgba(186,230,253,0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(poolCenter.x, poolCenter.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Exterior Trees, Cutaway Walls & Indoor Greenery
    drawTree(11, 2); drawTree(11, 7); drawTree(15, 2); drawTree(15, 7);
    drawTree(11, 18); drawTree(15, 18);
    if (isFuture) {
      drawIndoorPlant(2.2, 11.2);
      drawIndoorPlant(9.5, 11.2);
      drawIndoorPlant(16.6, 11.2);
      drawIndoorPlant(21.2, 11.2);
      drawIndoorPlant(16.6, 2.0);
    }

    // Hospital Outer & Partition Walls
    drawIsoBox(1, 1, 10, 0.14, 24, '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(1, 1, 0.14, 19, 24, '#f8fafc', '#64748b', '#94a3b8');
    drawIsoBox(1, 9, 4, 0.14, 18, '#e2e8f0', '#64748b', '#475569');
    drawIsoBox(7, 9, 4, 0.14, 18, '#e2e8f0', '#64748b', '#475569');
    drawIsoBox(10.8, 12, 0.12, 2.2, 20, '#38bdf8', '#0ea5e9', '#0284c7', 0.45);

    // Retreat Outer & Partition Walls
    drawIsoBox(16, 1, 11, 0.14, 24, '#fef3c7', '#78350f', '#451a03');
    drawIsoBox(16, 1, 0.14, 8, 22, '#e0f2fe', '#0284c7', '#0369a1');
    drawIsoBox(16, 16, 0.14, 5, 22, '#fef3c7', '#78350f', '#451a03');
    drawIsoBox(22, 1, 0.14, 7, 18, '#bae6fd', '#0891b2', '#06b6d4', 0.45);

    // 4. Module-Specific Before vs. After Furniture & Architectural Unlocks
    // S1: 6 Acute Hospital Ward Beds + Nurse Station
    for (let b = 0; b < 3; b++) {
      drawHospitalBedFull(2.0 + b * 2.5, 2.0, false, false);
      drawHospitalBedFull(2.0 + b * 2.5, 5.2, false, false);
    }
    drawReceptionDeskDual(8.2, 2.5, 1.8, 0.8, isFuture);
    if (!isFuture) {
      drawFlickeringWarningLight(8.8, 2.8, 'FAX / PAPER HANDOVER');
    } else {
      drawBiometricKiosk(9.4, 6.2, 'HL7 PRE-ALERT');
    }

    // S2: Cramped Paper Billing Office (Before) vs Digital Fast-Track Discharge Lounge & e-Clearance (After)
    drawReceptionDeskDual(2.0, 12.2, 2.2, 0.8, isFuture);
    if (!isFuture) {
      // Single cramped bench overflowing with waiting patients + warning light
      drawIsoBox(5.2, 14.0, 2.6, 0.5, 7, '#475569', '#334155', '#1e293b');
      drawFlickeringWarningLight(3.0, 12.5, 'GL BACKLOG +45m');
    } else {
      // Unlocked Digital Fast-Track Discharge Lounge + 2 e-Clearance Kiosks + Plush Lounge Sofas
      drawIsoBox(4.8, 12.5, 2.8, 0.65, 8, '#10b981', '#059669', '#047857');
      drawIsoBox(4.8, 15.0, 2.8, 0.65, 8, '#0ea5e9', '#0284c7', '#0369a1');
      drawBiometricKiosk(8.4, 12.5, 'AUTO E-GL KIOSK #1');
      drawBiometricKiosk(8.4, 15.0, 'AUTO E-GL KIOSK #2');
    }

    // S3: Single Standard Ambulance (Before) vs 2 Luxury VIP Medical Concierge Vans (After)
    drawConciergeVan(simState.van, isFuture, isFuture ? 'VIP CONCIERGE VAN #1' : 'STANDARD AMBULANCE (DELAYED)');
    if (isFuture && simState.van2) {
      drawConciergeVan(simState.van2, true, 'VIP CONCIERGE VAN #2 (STAGED)');
    }

    // S4: Manual Ledger Desk & Mop Carts (Before) vs Smart Biometric Concierge Pod & Pre-Prepared Suites (After)
    drawReceptionDeskDual(16.8, 12.2, 1.8, 0.8, isFuture);
    drawHospitalBedFull(18.5, 14.5, true, isFuture);
    drawHospitalBedFull(18.5, 17.5, true, isFuture);
    if (!isFuture) {
      // Housekeeping Mop Carts & Hazard Cones blocking suites
      drawIsoBox(17.6, 15.5, 0.48, 0.48, 9, '#facc15', '#ca8a04', '#854d0e');
      drawIsoBox(17.6, 18.0, 0.48, 0.48, 9, '#facc15', '#ca8a04', '#854d0e');
      drawFlickeringWarningLight(17.8, 15.5, 'SUITE UNCLEAN +30m');
    } else {
      drawBiometricKiosk(16.8, 14.2, 'SMART BIOMETRIC POD');
      drawHospitalBedFull(20.3, 14.5, true, true); // Unlocked 3rd VIP Suite
    }

    // S5: Distant Cramped Desk (Before) vs Dedicated On-Site Visiting MD Telemetry Suite (After)
    drawHospitalBedFull(17.2, 2.2, false, false);
    drawReceptionDeskDual(19.6, 2.5, 1.6, 0.8, isFuture);
    if (!isFuture) {
      drawFlickeringWarningLight(19.8, 2.5, 'MD PAGED AD-HOC +30m');
    } else {
      drawHospitalBedFull(17.2, 5.2, false, false);
      drawBiometricKiosk(19.8, 5.5, 'MOBILE ECG TELEMETRY CART');
    }

    // S6: Spa Massage Beds & Fine-Dining Bistro Tables
    drawIsoBox(23.0, 11.5, 1.4, 0.75, 9, '#a7f3d0', '#059669', '#047857');
    drawIsoBox(23.0, 13.5, 1.4, 0.75, 9, '#a7f3d0', '#059669', '#047857');
    drawIsoBox(23.2, 16.5, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');
    drawIsoBox(25.0, 16.5, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');

    // 5. Depth-Sort and Render all Agents
    const sorted = [...simState.agents].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    sorted.forEach(ag => {
      drawAgent(ag, simState.showActionLabels, ag.id === simState.selectedAgentId);
    });

    // 6. Zone Signs
    drawZoneSign(5.0, 1.2, isFuture ? 'S1: Digital Ward Pre-Alert (5m Wait)' : 'S1: Paper Ward Handover (+45m Wait)', isFuture ? '#10b981' : '#ef4444');
    drawZoneSign(5.0, 11.5, isFuture ? 'S2: Fast-Track Discharge Lounge (0m)' : 'S2: Paper Billing Backlog (+45m)', isFuture ? '#10b981' : '#ef4444');
    drawZoneSign(13.2, 4.0, isFuture ? 'S3: 2 VIP Concierge Vans (0m Wait)' : 'S3: Single Ambulance (+30m Wait)', isFuture ? '#0ea5e9' : '#f59e0b');
    drawZoneSign(18.8, 11.5, isFuture ? 'S4: Smart Biometric Pod & Ready Suites' : 'S4: Manual Ledger & Mop Delay (+30m)', isFuture ? '#10b981' : '#ef4444');
    drawZoneSign(18.8, 1.2, isFuture ? 'S5: Dedicated On-Site MD Telemetry Suite' : 'S5: Ad-Hoc Distant MD (+30m Wait)', isFuture ? '#0ea5e9' : '#ef4444');
    drawZoneSign(24.5, 1.2, 'S6: Hydro Pool, Spa & Dining', '#06b6d4');

    // 7. Facility Upgrade Transformation Shockwave Overlay
    if (upgradePulse > 0.01) {
      const center = toIso(14, 11, 10);
      const maxR = Math.max(vpW, vpH) * 0.9;
      const curR = (1 - upgradePulse) * maxR;
      ctx.save();
      ctx.strokeStyle = upgradeMode === 'future' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 6 * upgradePulse;
      ctx.globalAlpha = upgradePulse;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, curR, curR * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `bold ${Math.round(14 * zoom)}px ui-monospace, monospace`;
      ctx.fillStyle = upgradeMode === 'future' ? '#6ee7b7' : '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(
        upgradeMode === 'future'
          ? '⚡ SMART FACILITY UPGRADE UNLOCKED: 110m CYCLE (-60% FASTER · 90.9% PCE)'
          : '⚠ REVERTED TO BROKEN FACILITY: 275m CYCLE (180m WASTED WAIT · 34.5% PCE)',
        vpW * 0.45,
        46
      );
      ctx.restore();
      upgradePulse *= 0.93;
    }
  }

  return {
    init,
    render,
    toIso,
    zoomCam,
    resetCam,
    panToGrid,
    triggerUpgradePulse,
    GRID_W,
    GRID_H
  };
})();
