// ============================================================================
// BAHM330-A1: 28x22 Project Hospital Isometric Renderer Engine
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

  function drawHospitalBedFull(gx, gy, luxury = false) {
    // Adjustable headrest + mattress + IV pole + vitals monitor
    drawIsoBox(gx, gy, 1.4, 0.8, 8, luxury ? '#fef3c7' : '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(gx, gy, 0.22, 0.8, 16, luxury ? '#78350f' : '#0284c7', '#451a03', '#0369a1');
    drawIsoBox(gx + 0.45, gy + 0.05, 0.9, 0.7, 9.5, luxury ? '#d97706' : '#38bdf8', '#b45309', '#0284c7');
    if (!luxury) {
      // IV pole + Vital sign tower beside bed
      drawIsoBox(gx + 0.1, gy - 0.25, 0.25, 0.25, 18, '#e2e8f0', '#64748b', '#475569');
      const scr = toIso(gx + 0.22, gy - 0.12, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(scr.x - 3 * zoom, scr.y - 3 * zoom, 6 * zoom, 4 * zoom);
    }
  }

  function drawReceptionDeskDual(gx, gy, w, d, active) {
    drawIsoBox(gx, gy, w, d, 12, '#e2e8f0', '#475569', '#334155');
    // Dual monitors on desk
    for (let m = 0; m < 2; m++) {
      const mp = toIso(gx + 0.4 + m * 0.7, gy + d * 0.5, 16);
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = active ? '#10b981' : '#0ea5e9';
      ctx.lineWidth = 1.2;
      ctx.fillRect(mp.x - 7 * zoom, mp.y - 6 * zoom, 14 * zoom, 9 * zoom);
      ctx.strokeRect(mp.x - 7 * zoom, mp.y - 6 * zoom, 14 * zoom, 9 * zoom);
      ctx.fillStyle = active && frameTick % 8 < 4 ? '#10b981' : '#38bdf8';
      ctx.fillRect(mp.x - 5 * zoom, mp.y - 4 * zoom, 9 * zoom, 2 * zoom);
    }
  }

  function drawConciergeVan(van) {
    const { gx, gy, doorsOpen, rampExtended, brakeLights } = van;
    const sh = toIso(gx + 1.0, gy + 0.6, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, 38 * zoom, 17 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    if (rampExtended) {
      drawIsoBox(gx - 0.9, gy + 0.15, 0.9, 0.7, 2.5, '#94a3b8', '#475569', '#334155');
      const rp = toIso(gx - 0.45, gy + 0.5, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.round(7.5 * zoom)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('LIFT EXTENDED', rp.x, rp.y);
    }

    drawIsoBox(gx, gy, 2.0, 1.05, 19, '#f8fafc', '#cbd5e1', '#94a3b8');
    drawIsoBox(gx + 0.05, gy - 0.02, 1.9, 1.09, 10, '#0ea5e9', '#0284c7', '#0369a1');
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
    ctx.fillStyle = frameTick % 18 < 9 ? '#0ea5e9' : '#10b981';
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, 4.2 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAgent(agent, showLabels, isSelected) {
    const { gx, gy, role, pose, dir, actionLabel, bubble, bubbleType } = agent;
    const s = zoom;
    const base = toIso(gx, gy, 0);

    // Selection highlight ring
    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, 13 * s, 6.5 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
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

      // 8-Directional facing offset for head/shoulders
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

      // Arms
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
    ctx.fillStyle = 'rgba(9,13,22,0.86)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
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

    // 1. Render 28x22 Floor Grid
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#0f172a';
        if (gx === 0 || gx === 27 || gy === 0 || gy === 21) {
          fill = '#1e293b'; // Exterior concrete perimeter
        } else if (gx >= 11 && gx <= 15) {
          fill = '#1e293b'; // S3 Multi-lane Asphalt Roadway
        } else if (gx < 11) {
          // Left Campus: Partner Hospital
          if (gy === 9 || gy === 10) {
            fill = (gx + gy) % 2 === 0 ? '#bae6fd' : '#7dd3fc'; // Directional hospital corridor stripe
          } else if (gy < 9) {
            fill = (gx + gy) % 2 === 0 ? '#f1f5f9' : '#e2e8f0'; // S1 Acute Ward
          } else {
            fill = (gx + gy) % 2 === 0 ? '#e2e8f0' : '#cbd5e1'; // S2 Billing & Waiting Hall
          }
        } else {
          // Right Campus: Luxury Geriatric Retreat
          if (gy === 9 || gy === 10) {
            fill = (gx + gy) % 2 === 0 ? '#d97706' : '#b45309'; // Retreat Grand Promenade
          } else if (gx <= 21 && gy < 9) {
            fill = (gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd'; // S5 Visiting Physician Clinic
          } else if (gx <= 21 && gy > 10) {
            fill = (gx + gy) % 2 === 0 ? '#b47b48' : '#a16207'; // S4 Luxury King Suites Oak
          } else {
            // S6 Hydrotherapy Pool, Spa & Dining Terrace
            if (gx >= 23 && gx <= 25 && gy >= 2 && gy <= 7) {
              fill = '#0891b2'; // Hydrotherapy Pool Water
            } else {
              fill = (gx + gy) % 2 === 0 ? '#9c6638' : '#854d0e';
            }
          }
        }
        drawTile(gx, gy, fill);

        // Roadway dashed yellow dividing line
        if (gx === 13 && gy % 2 === 1) {
          const r0 = toIso(13.2, gy + 0.15);
          const r1 = toIso(13.2, gy + 0.85);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.8 * zoom;
          ctx.beginPath();
          ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y);
          ctx.stroke();
        }
      }
    }

    // Hydrotherapy Pool Ripples
    const poolCenter = toIso(24.5, 4.8, 1);
    const rad = (9 + (frameTick % 36) * 0.65) * zoom;
    ctx.strokeStyle = 'rgba(186,230,253,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(poolCenter.x, poolCenter.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Exterior Trees & Cutaway Architectural Walls
    drawTree(11, 2); drawTree(11, 7); drawTree(15, 2); drawTree(15, 7);
    drawTree(11, 18); drawTree(15, 18);

    // Hospital Outer & Partition Walls
    drawIsoBox(1, 1, 10, 0.14, 24, '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(1, 1, 0.14, 19, 24, '#f8fafc', '#64748b', '#94a3b8');
    drawIsoBox(1, 9, 4, 0.14, 18, '#e2e8f0', '#64748b', '#475569');
    drawIsoBox(7, 9, 4, 0.14, 18, '#e2e8f0', '#64748b', '#475569');
    // Automatic Sliding Glass Doors at Hospital Departure (10.8, 13..15)
    drawIsoBox(10.8, 12, 0.12, 2.2, 20, '#38bdf8', '#0ea5e9', '#0284c7', 0.45);

    // Retreat Outer & Partition Walls
    drawIsoBox(16, 1, 11, 0.14, 24, '#fef3c7', '#78350f', '#451a03');
    drawIsoBox(16, 1, 0.14, 8, 22, '#e0f2fe', '#0284c7', '#0369a1');
    drawIsoBox(16, 16, 0.14, 5, 22, '#fef3c7', '#78350f', '#451a03');
    drawIsoBox(22, 1, 0.14, 7, 18, '#bae6fd', '#0891b2', '#06b6d4', 0.45);

    // 3. Detailed Furniture & Clinical Equipment
    // S1: 6 Acute Hospital Ward Beds + Nurse Station
    for (let b = 0; b < 3; b++) {
      drawHospitalBedFull(2.0 + b * 2.5, 2.0, false);
      drawHospitalBedFull(2.0 + b * 2.5, 5.2, false);
    }
    drawReceptionDeskDual(8.2, 2.5, 1.8, 0.8, true);

    // S2: Billing Counter + 2 Waiting Chair Rows + Drink Dispenser + Wall Queue TV
    drawReceptionDeskDual(2.0, 12.2, 2.2, 0.8, true);
    drawIsoBox(5.2, 13.0, 2.8, 0.5, 7, '#64748b', '#334155', '#1e293b');
    drawIsoBox(5.2, 15.0, 2.8, 0.5, 7, '#64748b', '#334155', '#1e293b');
    drawIsoBox(2.0, 17.5, 0.45, 0.45, 15, '#38bdf8', '#0284c7', '#0369a1'); // Water cooler

    // S4: Retreat Concierge Podium + 3 Luxury King Suites
    drawReceptionDeskDual(16.8, 12.2, 1.8, 0.8, true);
    drawHospitalBedFull(18.5, 14.5, true);
    drawHospitalBedFull(18.5, 17.5, true);
    if (simState.mode === 'current') {
      drawIsoBox(17.8, 15.8, 0.4, 0.4, 8, '#facc15', '#ca8a04', '#854d0e'); // Housekeeping Mop Bucket
    }

    // S5: Visiting Physician Clinic Exam Couches & Vitals Towers
    drawHospitalBedFull(17.2, 2.2, false);
    drawHospitalBedFull(17.2, 5.2, false);
    drawReceptionDeskDual(19.6, 2.5, 1.6, 0.8, true);

    // S6: Spa Massage Beds & Fine-Dining Bistro Tables
    drawIsoBox(23.0, 11.5, 1.4, 0.75, 9, '#a7f3d0', '#059669', '#047857');
    drawIsoBox(23.0, 13.5, 1.4, 0.75, 9, '#a7f3d0', '#059669', '#047857');
    drawIsoBox(23.2, 16.5, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');
    drawIsoBox(25.0, 16.5, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');

    // 4. Concierge Van
    drawConciergeVan(simState.van);

    // 5. Depth-Sort and Render all 24 Agents
    const sorted = [...simState.agents].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    sorted.forEach(ag => {
      drawAgent(ag, simState.showActionLabels, ag.id === simState.selectedAgentId);
    });

    // 6. Zone Signs
    drawZoneSign(5.0, 1.2, 'S1: Acute Hospital Ward (6 Beds)', '#0ea5e9');
    drawZoneSign(5.0, 11.5, 'S2: Billing & Insurance Hall', '#f59e0b');
    drawZoneSign(13.2, 4.0, 'S3: Concierge Medical Transit', '#38bdf8');
    drawZoneSign(18.8, 11.5, 'S4: Retreat Lobby & King Suites', '#10b981');
    drawZoneSign(18.8, 1.2, 'S5: Visiting Physician Clinic', '#0ea5e9');
    drawZoneSign(24.5, 1.2, 'S6: Hydro Pool, Spa & Dining', '#06b6d4');
  }

  return {
    init,
    render,
    toIso,
    zoomCam,
    resetCam,
    panToGrid,
    GRID_W,
    GRID_H
  };
})();
