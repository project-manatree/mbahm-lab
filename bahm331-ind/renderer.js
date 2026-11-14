// ============================================================================
// BAHM331-IND: Luxury Geriatric Retreat 28x22 Isometric Renderer
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

  function zoomCam(f) {
    zoom = Math.max(0.5, Math.min(1.9, zoom * f));
  }

  function resetCam() {
    camX = 0;
    camY = 55;
    zoom = 0.95;
  }

  function panToGrid(gx, gy, targetZoom = 1.25) {
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
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
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
    ctx.ellipse(base.x, base.y, 9 * zoom, 4.5 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    drawIsoBox(gx + 0.38, gy + 0.38, 0.24, 0.24, 10, '#78350f', '#451a03', '#5c2408');
    const c1 = toIso(gx + 0.5, gy + 0.5, 16);
    const c2 = toIso(gx + 0.5, gy + 0.5, 22);
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.arc(c1.x, c1.y, 9.5 * zoom, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(c2.x, c2.y, 6.5 * zoom, 0, Math.PI * 2); ctx.fill();
  }

  function drawSignalBeamWithPacket(from, to, color, packetLabel) {
    const p0 = toIso(from.gx, from.gy, 14);
    const p1 = toIso(to.gx, to.gy, 14);
    const s = zoom;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2 * s;
    ctx.setLineDash([6 * s, 5 * s]);
    ctx.lineDashOffset = -(frameTick * 1.6);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.restore();

    const t = (frameTick % 45) / 45;
    const px = p0.x + (p1.x - p0.x) * t;
    const py = p0.y + (p1.y - p0.y) * t;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    if (packetLabel) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${Math.round(7.5 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(packetLabel, px, py - 7 * s);
    }
  }

  function drawAgent(agent, showLabels, isSelected, mode) {
    const { gx, gy, role, pose, actionLabel, bubble, bubbleType, glowingWrist } = agent;
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

    let coat = '#f59e0b', pants = '#334155';
    if (role === 'doctor') { coat = '#f8fafc'; pants = '#1e293b'; }
    else if (role === 'nurse') { coat = '#06b6d4'; pants = '#0f172a'; }
    else if (role === 'concierge') { coat = '#1e3a8a'; pants = '#0f172a'; }

    if (pose === 'SWIMMING_POOL') {
      const swimBob = Math.sin(frameTick * 0.18 + agent.idNum) * 2.5;
      const p = toIso(gx, gy, 2 + swimBob);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 4 * s, 10 * s, 4.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      const armOsc = Math.sin(frameTick * 0.2 + agent.idNum) * 7 * s;
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(p.x - 8 * s, p.y - 5 * s);
      ctx.lineTo(p.x + 8 * s, p.y - 5 * s + armOsc * 0.4);
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 9.5 * s, 4.8 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === 'LYING_ON_BED') {
      const bp = toIso(gx, gy, 10);
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.roundRect(bp.x - 12 * s, bp.y - 4.5 * s, 20 * s, 8 * s, 3 * s);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(bp.x - 14 * s, bp.y - 0.5 * s, 4.6 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === 'SITTING') {
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
    } else {
      const isWalk = pose === 'WALKING' || pose === 'CARRYING_AID';
      const stride = isWalk ? Math.sin(frameTick * 0.25 + agent.idNum) * 3.5 * s : 0;
      const pos = toIso(gx, gy, 0);

      ctx.fillStyle = pants;
      ctx.fillRect(pos.x - 3.2 * s, pos.y - 8.5 * s + stride * 0.3, 2.6 * s, 8.5 * s);
      ctx.fillRect(pos.x + 0.7 * s, pos.y - 8.5 * s - stride * 0.3, 2.6 * s, 8.5 * s);

      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.roundRect(pos.x - 5.2 * s, pos.y - 20 * s, 10.4 * s, 12 * s, 2.8 * s);
      ctx.fill();

      ctx.strokeStyle = coat;
      ctx.lineWidth = 2.3 * s;
      ctx.beginPath();
      if (pose === 'YOGA_STRETCH') {
        const sy = Math.sin(frameTick * 0.16 + agent.idNum) * 5 * s;
        ctx.moveTo(pos.x - 4.5 * s, pos.y - 17 * s);
        ctx.lineTo(pos.x - 10 * s, pos.y - 25 * s + sy);
        ctx.moveTo(pos.x + 4.5 * s, pos.y - 17 * s);
        ctx.lineTo(pos.x + 10 * s, pos.y - 25 * s + sy);
      } else if (pose === 'HANDS_UP_FATIGUE') {
        const wv = Math.sin(frameTick * 0.35) * 3 * s;
        ctx.moveTo(pos.x - 4.5 * s, pos.y - 18 * s);
        ctx.lineTo(pos.x - 9.5 * s, pos.y - 29 * s + wv);
        ctx.moveTo(pos.x + 4.5 * s, pos.y - 18 * s);
        ctx.lineTo(pos.x + 9.5 * s, pos.y - 29 * s - wv);
      } else if (pose === 'TYPING_TERMINAL') {
        const osc = (frameTick % 8 < 4) ? -1.8 * s : 1.8 * s;
        ctx.moveTo(pos.x - 4 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x - 8 * s, pos.y - 12 * s + osc);
        ctx.moveTo(pos.x + 4 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x + 8 * s, pos.y - 12 * s - osc);
      } else if (pose === 'CARRYING_AID') {
        ctx.moveTo(pos.x - 4.5 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x - 10 * s, pos.y - 14 * s);
      } else {
        ctx.moveTo(pos.x + 4.5 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x + 8.5 * s, pos.y - 13 * s);
      }
      ctx.stroke();

      if (pose === 'CARRYING_AID') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.4 * s;
        ctx.beginPath();
        ctx.arc(pos.x - 11 * s, pos.y - 14 * s, 4 * s, 0, Math.PI * 2);
        ctx.stroke();
      } else if (pose === 'HOLDING_TABLET_LEAK') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(pos.x + 6.5 * s, pos.y - 16 * s, 5.5 * s, 7.5 * s);
      }

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 24.5 * s, 4.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    if (glowingWrist) {
      const wPos = toIso(gx, gy, 11);
      const pulse = (frameTick % 30) * 0.85 * s;
      ctx.strokeStyle = mode === 'unfiltered' ? 'rgba(239,68,68,0.85)' : 'rgba(14,165,233,0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(wPos.x, wPos.y, 7 * s + pulse, 3.5 * s + pulse * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
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
    if (type === 'fail') { bg = '#450a0a'; border = '#ef4444'; fg = '#fca5a5'; }
    else if (type === 'ok') { bg = '#064e3b'; border = '#10b981'; fg = '#6ee7b7'; }
    else if (type === 'warn') { bg = '#451a03'; border = '#f59e0b'; fg = '#fde68a'; }

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

    const isTiered = simState.mode === 'tiered';
    const ev = simState.activeEvent;

    // 1. Render 28x22 Luxury Retreat Floorplan Tiles
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#1e293b';
        if (gx < 2 || gx > 25 || gy === 0 || gy === 21) {
          fill = '#1e293b'; // Landscaped perimeter
        } else if (gy === 9 || gy === 10) {
          fill = (gx + gy) % 2 === 0 ? '#d97706' : '#b45309'; // Central Retreat Promenade
        } else if (gx >= 2 && gx < 10 && gy < 9) {
          if (gx >= 3 && gx <= 7 && gy >= 2 && gy <= 6) fill = '#0891b2'; // Hydrotherapy Pool Water
          else fill = (gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8'; // Pool Deck
        } else if (gx >= 2 && gx < 10 && gy > 10) {
          fill = (gx + gy) % 2 === 0 ? '#a7f3d0' : '#6ee7b7'; // Thermal Spa Suites
        } else if (gx >= 10 && gx < 18 && gy < 9) {
          fill = (gx + gy) % 2 === 0 ? '#b47b48' : '#9c6638'; // Yoga & Wellness Pavilion Oak
        } else if (gx >= 10 && gx < 18 && gy > 10) {
          fill = (gx + gy) % 2 === 0 ? '#78350f' : '#92400e'; // Fine-Dining Bistro & Concierge
        } else if (gx >= 18 && gy < 9) {
          fill = (gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd'; // On-Site Nurse Triage & Visiting MD Clinic
        } else {
          fill = (gx + gy) % 2 === 0 ? '#d97706' : '#b45309'; // Residential Suites 301-309
        }
        drawTile(gx, gy, fill);
      }
    }

    // Animated Hydrotherapy Pool Ripples
    const pc1 = toIso(4.5, 4.0, 1);
    const pc2 = toIso(6.5, 4.5, 1);
    const rad = (8 + (frameTick % 34) * 0.65) * zoom;
    ctx.strokeStyle = 'rgba(186,230,253,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(pc1.x, pc1.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
    ctx.ellipse(pc2.x, pc2.y, rad * 1.1, rad * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Trees & Cutaway Walls
    drawTree(0.5, 3); drawTree(0.5, 16); drawTree(26.2, 3); drawTree(26.2, 16);
    drawIsoBox(2, 1, 24, 0.14, 24, '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(2, 1, 0.14, 8, 24, '#f8fafc', '#64748b', '#94a3b8');
    drawIsoBox(2, 11, 0.14, 10, 24, '#f8fafc', '#64748b', '#94a3b8');
    drawIsoBox(10, 1, 0.14, 7.5, 20, '#e2e8f0', '#64748b', '#475569');
    drawIsoBox(18, 1, 0.14, 7.5, 20, '#e0f2fe', '#0284c7', '#0369a1');
    drawIsoBox(10, 11.5, 0.14, 9, 20, '#fef3c7', '#78350f', '#451a03');
    drawIsoBox(18, 11.5, 0.14, 9, 20, '#fef3c7', '#78350f', '#451a03');

    // 3. Detailed Furniture & Equipment
    // Zone 2: 4 Thermal Spa Massage Tables
    drawIsoBox(3.2, 12.5, 1.4, 0.75, 9, '#f8fafc', '#059669', '#047857');
    drawIsoBox(6.2, 12.5, 1.4, 0.75, 9, '#f8fafc', '#059669', '#047857');
    drawIsoBox(3.2, 16.5, 1.4, 0.75, 9, '#f8fafc', '#059669', '#047857');
    drawIsoBox(6.2, 16.5, 1.4, 0.75, 9, '#f8fafc', '#059669', '#047857');

    // Zone 3: 6 Yoga Mats in Yoga Pavilion
    for (let m = 0; m < 3; m++) {
      drawIsoBox(11.2 + m * 2.0, 2.5, 1.2, 0.65, 2, '#ec4899', '#be185d', '#9d174d');
      drawIsoBox(11.2 + m * 2.0, 5.2, 1.2, 0.65, 2, '#8b5cf6', '#6d28d9', '#5b21b6');
    }

    // Zone 4: Fine-Dining Bistro Tables & Concierge Counter
    for (let t = 0; t < 2; t++) {
      drawIsoBox(11.4 + t * 2.8, 12.8, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');
      drawIsoBox(11.4 + t * 2.8, 16.0, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');
    }
    drawIsoBox(15.2, 18.2, 1.8, 0.7, 12, '#f59e0b', '#b45309', '#78350f'); // Concierge Desk

    // Zone 5: Nurse Triage Monitor Desk & Visiting Physician Exam Room
    drawIsoBox(19.2, 2.5, 1.8, 0.75, 12, '#0ea5e9', '#0284c7', '#0369a1');
    drawIsoBox(22.5, 2.2, 1.6, 0.75, 10, '#f8fafc', '#64748b', '#475569');
    drawIsoBox(22.5, 5.2, 1.4, 0.8, 9, '#38bdf8', '#0284c7', '#0369a1');

    // Zone 6: 4 Luxury Residential King Suites (Suites 301-309)
    for (let s = 0; s < 2; s++) {
      drawIsoBox(19.5 + s * 3.2, 12.8, 1.5, 0.9, 10, '#fef3c7', '#b45309', '#78350f');
      drawIsoBox(19.5 + s * 3.2, 16.8, 1.5, 0.9, 10, '#fef3c7', '#b45309', '#78350f');
    }

    // 4. Signal Routing Beams & Flying Telemetry Packets
    const nursePos = { gx: 20.0, gy: 3.5 };
    const docPos = { gx: 23.2, gy: 3.2 };
    if (!isTiered) {
      drawSignalBeamWithPacket(ev.sourcePos, ev.staffPos, '#ef4444', 'PHI LEAK');
      drawSignalBeamWithPacket(ev.sourcePos, docPos, '#f59e0b', 'RAW NOISE');
    } else {
      drawSignalBeamWithPacket(ev.sourcePos, nursePos, '#0ea5e9', 'TELEMETRY');
      drawSignalBeamWithPacket(nursePos, ev.staffPos, '#10b981', 'WELFARE PING');
      if (ev.id !== 'EVT-04') {
        drawSignalBeamWithPacket(nursePos, docPos, '#ef4444', '5m SLA ESCALATION');
        const mdRing = toIso(docPos.gx, docPos.gy, 1);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.4 * zoom;
        ctx.beginPath();
        ctx.ellipse(mdRing.x, mdRing.y, 26 * zoom, 13 * zoom, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 5. Depth-Sort and Render all 24 Agents
    const sorted = [...simState.agents].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    sorted.forEach(ag => {
      drawAgent(ag, simState.showActionLabels, ag.id === simState.selectedAgentId, simState.mode);
    });

    // 6. Zone Signs
    drawZoneSign(5.5, 1.2, '1. Hydrotherapy Pool', '#06b6d4');
    drawZoneSign(5.5, 11.5, '2. Thermal Spa Suites', '#10b981');
    drawZoneSign(14.0, 1.2, '3. Yoga & Wellness Pavilion', '#ec4899');
    drawZoneSign(14.0, 11.5, '4. Fine-Dining Bistro & Lobby', '#f59e0b');
    drawZoneSign(22.0, 1.2, '5. Nurse Triage & MD Clinic', '#0ea5e9');
    drawZoneSign(22.0, 11.5, '6. Residential Suites 301–309', '#f59e0b');
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
