// ============================================================================
// BAHM330-A2: Meridian Specialist Hospital (MSH) 28x22 Isometric Renderer
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

  function drawHospitalBed(gx, gy, blockedAlert = false) {
    drawIsoBox(gx, gy, 1.35, 0.8, 8, '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(gx, gy, 0.22, 0.8, 16, '#0284c7', '#0369a1', '#075985');
    drawIsoBox(
      gx + 0.42,
      gy + 0.05,
      0.88,
      0.7,
      9.5,
      blockedAlert ? '#ef4444' : '#38bdf8',
      blockedAlert ? '#b91c1c' : '#0284c7',
      '#0369a1'
    );
  }

  function drawAgent(agent, showLabels, isSelected) {
    const { gx, gy, role, pose, dir, actionLabel, bubble, bubbleType, headShake } = agent;
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

    let coat = '#38bdf8', pants = '#1e293b';
    if (role === 'doctor') { coat = '#f8fafc'; pants = '#334155'; }
    else if (role === 'nurse') { coat = '#06b6d4'; pants = '#0f172a'; }
    else if (role === 'concierge') { coat = '#1e3a8a'; pants = '#0f172a'; }
    else if (role === 'patient') { coat = '#f59e0b'; pants = '#475569'; }

    if (pose === 'IN_SCANNER' || pose === 'LYING_ON_BED') {
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
      } else if (pose === 'PHONE_CALL') {
        ctx.moveTo(pos.x + 4 * s, pos.y - 16 * s);
        ctx.lineTo(pos.x + 6 * s, pos.y - 24 * s);
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

      const shakeX = headShake ? Math.sin(frameTick * 0.45) * 3 * s : 0;
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(pos.x + f.dx * 0.7 * s + shakeX, pos.y - 24.5 * s, 4.6 * s, 0, Math.PI * 2);
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

    const isCur = simState.mode === 'current';

    // 1. Render 28x22 Hospital Floor Tiles
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#1e293b';
        if (gx < 3) {
          fill = '#1e293b'; // Exterior Ambulance & Patient Drop-off Driveway
        } else if (gy === 9 || gy === 10) {
          fill = (gx + gy) % 2 === 0 ? '#bae6fd' : '#7dd3fc'; // Main Hospital Directional Corridor
        } else if (gx >= 3 && gx < 10 && gy < 9) {
          fill = (gx + gy) % 2 === 0 ? '#f8fafc' : '#e2e8f0'; // Dept 1: Main Reception & Waiting Hall
        } else if (gx >= 10 && gx < 19 && gy < 9) {
          fill = (gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd'; // Dept 2: Specialist Consultation Wing (C1)
        } else if (gx >= 19 && gy < 9) {
          fill = (gx + gy) % 2 === 0 ? '#334155' : '#1e293b'; // Dept 3: Radiology CT/MRI Suite (C2)
        } else if (gx >= 3 && gx < 13 && gy > 10) {
          fill = (gx + gy) % 2 === 0 ? '#ecfdf5' : '#d1fae5'; // Dept 4: Inpatient Ward & Discharge Lounge (C3)
        } else if (gx >= 13 && gx < 21 && gy > 10) {
          fill = (gx + gy) % 2 === 0 ? '#fef3c7' : '#fde68a'; // Dept 5: Inpatient Pharmacy & Store (C3)
        } else {
          fill = (gx + gy) % 2 === 0 ? '#ede9fe' : '#ddd6fe'; // Dept 6: Central Scheduling & HIS Hub (C5)
        }
        drawTile(gx, gy, fill);
      }
    }

    // 2. Exterior Trees, Ambulance & Cutaway Walls
    drawTree(1, 2); drawTree(1, 18);
    // Parked Ambulance at Driveway
    drawIsoBox(0.8, 8.8, 1.8, 0.95, 18, '#f8fafc', '#cbd5e1', '#94a3b8');
    drawIsoBox(0.85, 8.8, 1.7, 0.98, 9, '#ef4444', '#b91c1c', '#991b1b');

    // Outer & Partition Cutaway Walls
    drawIsoBox(3, 1, 24, 0.14, 24, '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(3, 1, 0.14, 8, 24, '#f8fafc', '#64748b', '#94a3b8');
    drawIsoBox(3, 11, 0.14, 10, 24, '#f8fafc', '#64748b', '#94a3b8');
    // Automatic Sliding Glass Main Entrance Doors at (3, 9..10)
    drawIsoBox(3, 9, 0.12, 2.0, 20, '#38bdf8', '#0ea5e9', '#0284c7', 0.45);

    // Interior Department Partitions
    drawIsoBox(10, 1, 0.14, 7.2, 20, '#e2e8f0', '#64748b', '#475569');
    drawIsoBox(19, 1, 0.14, 7.2, 20, '#e2e8f0', '#475569', '#334155');
    // Radiology Glass-Walled Control Booth Partition
    drawIsoBox(19, 5.5, 4.5, 0.12, 18, '#38bdf8', '#0ea5e9', '#0284c7', 0.42);
    drawIsoBox(13, 11.8, 0.14, 9, 20, '#e2e8f0', '#64748b', '#475569');
    drawIsoBox(21, 11.8, 0.14, 9, 20, '#e2e8f0', '#64748b', '#475569');

    // Wall Queue ETA Display Board in Waiting Hall
    const qScreen = toIso(8.5, 1.2, 21);
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = isCur ? '#ef4444' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.fillRect(qScreen.x - 42 * zoom, qScreen.y - 9 * zoom, 84 * zoom, 15 * zoom);
    ctx.strokeRect(qScreen.x - 42 * zoom, qScreen.y - 9 * zoom, 84 * zoom, 15 * zoom);
    ctx.fillStyle = isCur ? '#fca5a5' : '#6ee7b7';
    ctx.font = `bold ${Math.round(8 * zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(isCur ? 'ETA: UNKNOWN (+65m)' : 'WAVE ETA: 10:04 (14m)', qScreen.x, qScreen.y - 1 * zoom);

    // 3. Detailed Furniture & Equipment
    // Dept 1: Main Reception Desk (with Dual Monitors) & 3 Waiting Chair Rows + Water Cooler
    drawIsoBox(3.8, 2.2, 1.2, 2.4, 12, '#0ea5e9', '#0284c7', '#0369a1');
    drawIsoBox(6.0, 2.2, 3.0, 0.5, 7, '#64748b', '#334155', '#1e293b');
    drawIsoBox(6.0, 4.0, 3.0, 0.5, 7, '#64748b', '#334155', '#1e293b');
    drawIsoBox(6.0, 5.8, 3.0, 0.5, 7, '#64748b', '#334155', '#1e293b');
    drawIsoBox(3.8, 6.8, 0.45, 0.45, 15, '#38bdf8', '#0284c7', '#0369a1'); // Drink Dispenser

    // Dept 2 (C1): 3 Specialist Consultation Rooms (Exam Couches, Curtains & Desks)
    for (let c = 0; c < 3; c++) {
      const cx = 11.0 + c * 2.6;
      drawIsoBox(cx, 1.8, 1.3, 0.7, 9, '#38bdf8', '#0284c7', '#0369a1');
      drawIsoBox(cx, 4.2, 1.2, 0.65, 11, '#e2e8f0', '#64748b', '#475569');
    }

    // Dept 3 (C2): Radiology CT Scanner Gantry & Glass Control Booth Console
    drawIsoBox(21.5, 2.0, 2.4, 0.8, 9, '#94a3b8', '#475569', '#334155');
    drawIsoBox(22.4, 1.7, 0.6, 1.4, 23, '#f8fafc', '#cbd5e1', '#94a3b8'); // CT Gantry Ring
    drawIsoBox(20.2, 6.4, 2.2, 0.7, 12, '#0ea5e9', '#0284c7', '#0369a1'); // Control Booth Console
    if (!isCur) {
      // Sweeping Cyan Laser Scan Ring inside CT Gantry
      const lp = toIso(22.7, 2.3, 14);
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2.2 * zoom;
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, (10 + Math.sin(frameTick * 0.3) * 3) * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dept 4 (C3): Inpatient Ward with 6 Beds & Packed Suitcases
    for (let b = 0; b < 3; b++) {
      drawHospitalBed(4.0 + b * 2.6, 13.0, isCur && b === 1);
      drawHospitalBed(4.0 + b * 2.6, 16.8, isCur && b === 0);
    }
    drawIsoBox(6.2, 13.8, 0.4, 0.3, 6, '#f59e0b', '#b45309', '#78350f'); // Packed Suitcase

    // Dept 5 (C3): Pharmacy Dispensing Counter & Shelving Racks (Red Stockout vs Green e-Kanban)
    drawIsoBox(14.2, 12.6, 3.2, 0.65, 12, '#10b981', '#059669', '#047857');
    drawIsoBox(14.2, 16.5, 4.5, 0.55, 20, '#cbd5e1', '#64748b', '#475569');
    drawIsoBox(14.2, 18.5, 4.5, 0.55, 20, '#cbd5e1', '#64748b', '#475569');
    if (isCur) {
      const sc = frameTick % 18 < 9 ? '#ef4444' : '#7f1d1d';
      drawIsoBox(16.0, 16.45, 0.7, 0.6, 15, sc, sc, sc);
    } else {
      drawIsoBox(16.0, 16.45, 0.7, 0.6, 15, '#10b981', '#059669', '#047857');
    }

    // Dept 6 (C5): Central HIS Server Racks & Call-Centre Desks
    drawIsoBox(22.2, 13.0, 2.2, 0.7, 12, '#a855f7', '#7e22ce', '#6b21a8');
    drawIsoBox(22.5, 16.8, 0.8, 0.8, 22, '#1e293b', '#0f172a', '#334155');
    drawIsoBox(24.0, 16.8, 0.8, 0.8, 22, '#1e293b', '#0f172a', '#334155');

    // C5 Diverging SMS (10:00) vs Phone Call (11:30) Icons over Reception Desk
    const c5Anchor = toIso(4.4, 3.2, 38);
    if (isCur) {
      const sep = Math.sin(frameTick * 0.14) * 14 * zoom;
      drawStatusBubble(c5Anchor.x - 26 * zoom - sep, c5Anchor.y, '✉ SMS 10:00', 'fail');
      drawStatusBubble(c5Anchor.x + 26 * zoom + sep, c5Anchor.y, '☎ CALL 11:30', 'warn');
    } else {
      drawStatusBubble(c5Anchor.x, c5Anchor.y, '✓ SSOT SYNC: 10:00 (99.8%)', 'ok');
    }

    // 4. Depth-Sort and Render all 28 Agents
    const sorted = [...simState.agents].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    sorted.forEach(ag => {
      drawAgent(ag, simState.showActionLabels, ag.id === simState.selectedAgentId);
    });

    // 5. Department Signs
    drawZoneSign(6.5, 1.2, '1. Reception & Waiting Hall', '#0ea5e9');
    drawZoneSign(14.5, 1.2, '2. Specialist Clinic (C1)', '#38bdf8');
    drawZoneSign(23.0, 1.2, '3. Radiology CT Suite (C2)', '#f59e0b');
    drawZoneSign(8.0, 12.0, '4. Inpatient Ward (C3)', '#10b981');
    drawZoneSign(17.0, 12.0, '5. Pharmacy Store (C3)', '#f59e0b');
    drawZoneSign(24.0, 12.0, '6. HIS Scheduling Hub (C5)', '#a855f7');
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
