// ============================================================================
// BAHM330-A2: Meridian Specialist Hospital (MSH) 28x22 Isometric Renderer
// Clean Readable Patient Nameplates, Realistic Cutaway Rooms & Moving Vehicles
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 28;
  const GRID_H = 22;
  const TILE_W = 46;
  const TILE_H = 23;

  let canvas, ctx;
  let camX = 0;
  let camY = 50;
  let zoom = 0.98;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let frameTick = 0;
  let upgradePulse = 0;
  let upgradeMode = 'future';

  // Continuously moving driveway vehicles (Ambulance + Patient Drop-Off Car)
  let drivewayVehicles = [
    { gx: 0.7, gy: 2.0, dirY: 1, type: 'ambulance', label: 'MSH AMBULANCE #1' },
    { gx: 1.5, gy: 18.0, dirY: -1, type: 'car', label: 'PATIENT DROP-OFF' }
  ];

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
    zoom = Math.max(0.55, Math.min(2.0, zoom * f));
  }

  function resetCam() {
    camX = 0;
    camY = 50;
    zoom = 0.98;
  }

  function panToGrid(gx, gy, targetZoom = 1.25) {
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
    const originX = vpW * 0.44 + camX;
    const originY = vpH * 0.07 + camY;
    return {
      x: originX + (gx - gy) * (TILE_W * 0.5) * zoom,
      y: originY + (gx + gy) * (TILE_H * 0.5) * zoom - gz * zoom
    };
  }

  function drawTile(gx, gy, fill, stroke = 'rgba(15,23,42,0.18)') {
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

  function drawRealisticRoom(gx, gy, w, d, wallTop, wallLeft, wallRight, doorSide = 'S', roomTitle = '') {
    const t = 0.16;
    const backH = 22;
    const frontH = 5;

    drawIsoBox(gx, gy, w, t, backH, wallTop, wallLeft, wallRight);
    for (let wx = gx + 0.8; wx < gx + w - 1.0; wx += 2.2) {
      drawIsoBox(wx, gy - 0.02, 1.1, t + 0.04, 9, '#bae6fd', '#38bdf8', '#0284c7', 0.55);
    }
    drawIsoBox(gx, gy, t, d, backH, wallTop, wallLeft, wallRight);
    drawIsoBox(gx + w - t, gy, t, d, frontH + 3, wallTop, wallLeft, wallRight);

    if (doorSide === 'S') {
      const mid = w * 0.45;
      drawIsoBox(gx, gy + d - t, mid - 0.6, t, frontH, wallTop, wallLeft, wallRight);
      drawIsoBox(gx + mid + 0.8, gy + d - t, w - mid - 0.8, t, frontH, wallTop, wallLeft, wallRight);
    } else if (doorSide === 'N') {
      drawIsoBox(gx, gy + d - t, w, t, frontH, wallTop, wallLeft, wallRight);
    }

    if (roomTitle) {
      const rp = toIso(gx + w * 0.5, gy + 0.55, 24);
      ctx.font = `700 ${Math.max(9, Math.round(9.2 * zoom))}px -apple-system, BlinkMacSystemFont, sans-serif`;
      const tw = ctx.measureText(roomTitle).width + 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(rp.x - tw / 2, rp.y - 9, tw, 17, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomTitle, rp.x, rp.y - 0.5);
    }
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

  function drawIndoorPlant(gx, gy) {
    drawIsoBox(gx, gy, 0.36, 0.36, 6, '#e2e8f0', '#94a3b8', '#64748b');
    const p = toIso(gx + 0.18, gy + 0.18, 10);
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(p.x, p.y, 5.2 * zoom, 0, Math.PI * 2); ctx.fill();
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
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 1.6 * zoom;
    ctx.stroke();
    if (label) {
      ctx.font = `bold ${Math.max(8, Math.round(7.6 * zoom))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y + (ry + 6) * zoom);
    }
    ctx.restore();
  }

  function drawHospitalBed(gx, gy, blockedAlert = false, freeReady = false) {
    drawIsoBox(gx, gy, 1.38, 0.82, 8, '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(gx, gy, 0.22, 0.82, 16, '#0284c7', '#0369a1', '#075985');
    drawIsoBox(gx + 0.22, gy + 0.15, 0.26, 0.52, 9.2, '#ffffff', '#e2e8f0', '#cbd5e1');
    drawIsoBox(
      gx + 0.48,
      gy + 0.05,
      0.85,
      0.72,
      9.5,
      blockedAlert ? '#ef4444' : (freeReady ? '#10b981' : '#38bdf8'),
      blockedAlert ? '#b91c1c' : (freeReady ? '#059669' : '#0284c7'),
      '#0369a1'
    );
    drawIsoBox(gx + 0.05, gy - 0.35, 0.35, 0.3, 11, '#e2e8f0', '#64748b', '#475569');
    if (blockedAlert && frameTick % 20 < 12) {
      const p = toIso(gx + 0.7, gy + 0.4, 22);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDrivewayVehicle(v) {
    const { gx, gy, dirY, type, label } = v;
    const sh = toIso(gx + 0.6, gy + 0.8, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, 26 * zoom, 13 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight beam
    const b0 = toIso(gx + 0.5, dirY > 0 ? gy + 1.8 : gy - 0.1, 2);
    const b1 = toIso(gx + 0.5, dirY > 0 ? gy + 3.6 : gy - 1.9, 0);
    ctx.save();
    const grad = ctx.createLinearGradient(b0.x, b0.y, b1.x, b1.y);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.48)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(b0.x - 5 * zoom, b0.y);
    ctx.lineTo(b1.x - 16 * zoom, b1.y);
    ctx.lineTo(b1.x + 16 * zoom, b1.y);
    ctx.lineTo(b0.x + 5 * zoom, b0.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const bounce = Math.sin(frameTick * 0.4) * 0.6;
    if (type === 'ambulance') {
      drawIsoBox(gx, gy, 1.15, 1.75, 16 + bounce, '#f8fafc', '#e2e8f0', '#cbd5e1');
      drawIsoBox(gx - 0.02, gy + 0.04, 1.19, 1.67, 8 + bounce, '#ef4444', '#b91c1c', '#991b1b');
      drawIsoBox(gx + 0.1, gy + 0.2, 0.95, 1.35, 19 + bounce, '#1e293b', '#0f172a', '#334155');
      const bc = toIso(gx + 0.55, gy + 0.85, 22 + bounce);
      ctx.fillStyle = frameTick % 12 < 6 ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(bc.x, bc.y, 4 * zoom, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawIsoBox(gx, gy, 1.05, 1.55, 11 + bounce, '#38bdf8', '#0284c7', '#0369a1');
      drawIsoBox(gx + 0.1, gy + 0.25, 0.85, 1.0, 15 + bounce, '#1e293b', '#0f172a', '#334155');
    }

    const lp = toIso(gx + 0.55, gy + 0.8, 27 + bounce);
    ctx.font = `bold ${Math.max(8, Math.round(7.8 * zoom))}px monospace`;
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText(label, lp.x, lp.y);
  }

  function drawConduitLine(fromGx, fromGy, toGx, toGy, col, label) {
    const p0 = toIso(fromGx, fromGy, 12);
    const p1 = toIso(toGx, toGy, 12);
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.4 * zoom;
    ctx.setLineDash([6 * zoom, 4 * zoom]);
    ctx.lineDashOffset = -(frameTick * 1.8);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.restore();

    const t = (frameTick % 40) / 40;
    const px = p0.x + (p1.x - p0.x) * t;
    const py = p0.y + (p1.y - p0.y) * t;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, 3.8 * zoom, 0, Math.PI * 2);
    ctx.fill();
    if (label) {
      ctx.font = `bold ${Math.round(7.2 * zoom)}px monospace`;
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText(label, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5 - 6 * zoom);
    }
  }

  // Clean, High-Contrast, Always-Readable Patient & Staff Nameplates
  function drawCleanNameplate(x, y, agent, isSelected, showDetails) {
    const shortName = agent.shortName || agent.name.replace(/\s*\(.*?\)/g, '');
    const statusText = agent.bubble || '';

    let roleDot = '#f59e0b';
    let borderCol = isSelected ? '#38bdf8' : 'rgba(245, 158, 11, 0.75)';
    if (agent.role === 'doctor') { roleDot = '#38bdf8'; borderCol = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.65)'; }
    else if (agent.role === 'nurse') { roleDot = '#10b981'; borderCol = isSelected ? '#38bdf8' : 'rgba(16, 185, 129, 0.65)'; }
    else if (agent.role === 'concierge') { roleDot = '#a855f7'; borderCol = isSelected ? '#38bdf8' : 'rgba(168, 85, 247, 0.65)'; }

    const isPatient = agent.role === 'patient';
    if (!isPatient && !showDetails && !isSelected) return;

    const fontSize = Math.max(9.8, Math.round((isPatient ? 10.2 : 9.0) * Math.min(1.25, Math.max(0.88, zoom))));
    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const nameW = ctx.measureText(shortName).width;

    const subFontSize = Math.max(8.2, fontSize - 1.5);
    let subW = 0;
    if (showDetails && statusText) {
      ctx.font = `600 ${subFontSize}px ui-monospace, monospace`;
      subW = ctx.measureText(statusText).width;
    }

    const boxW = Math.max(nameW + 18, subW + 14);
    const boxH = (showDetails && statusText) ? (fontSize + subFontSize + 9) : (fontSize + 8);
    const bx = x - boxW / 2;
    const by = y - boxH;

    ctx.fillStyle = isSelected ? 'rgba(8, 47, 73, 0.96)' : 'rgba(9, 13, 22, 0.92)';
    ctx.strokeStyle = agent.bubbleType === 'fail' ? '#ef4444' : borderCol;
    ctx.lineWidth = isSelected ? 2.0 : 1.25;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = roleDot;
    ctx.beginPath();
    ctx.arc(bx + 7, by + fontSize * 0.5 + 3.5, 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(shortName, bx + 13, by + fontSize * 0.5 + 3.5);

    if (showDetails && statusText) {
      ctx.font = `600 ${subFontSize}px ui-monospace, monospace`;
      ctx.fillStyle = agent.bubbleType === 'fail' ? '#fca5a5' : '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, x, by + fontSize + subFontSize * 0.5 + 4.5);
    }
  }

  function drawAgent(agent, showLabels, isSelected) {
    const { gx, gy, role, pose, dir, headShake } = agent;
    const s = zoom;
    const base = toIso(gx, gy, 0);

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, 14 * s, 7 * s, 0, 0, Math.PI * 2);
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
      ctx.arc(seat.x, seat.y - 20.5 * s, 4.6 * s, 0, Math.PI * 2);
      ctx.fill();
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

    const headTop = toIso(gx, gy, 32);
    drawCleanNameplate(headTop.x, headTop.y, agent, isSelected, showLabels);
  }

  function drawStatusBubble(x, y, text, type) {
    const s = zoom;
    ctx.font = `bold ${Math.max(8.5, Math.round(8.5 * s))}px ui-monospace, monospace`;
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

  function render(simState) {
    if (!ctx) return;
    frameTick++;
    const vpW = canvas.width / window.devicePixelRatio;
    const vpH = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, vpW, vpH);

    const isCur = simState.mode === 'current';

    // Update moving vehicles on the Hospital Driveway (gx = 0..2.8)
    drivewayVehicles[0].gy += 0.08;
    if (drivewayVehicles[0].gy > 19.5) drivewayVehicles[0].gy = 0.5;
    drivewayVehicles[1].gy -= 0.095;
    if (drivewayVehicles[1].gy < 0.5) drivewayVehicles[1].gy = 19.5;

    // 1. Render 28x22 Hospital Floor Tiles
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#1e293b';
        if (gx < 3) {
          fill = '#1e293b'; // Paved Hospital Driveway
        } else if (gy === 9 || gy === 10) {
          fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#94a3b8' : '#64748b')
            : ((gx + gy) % 2 === 0 ? '#38bdf8' : '#0ea5e9');
        } else if (gx >= 3 && gx < 10 && gy < 9) {
          fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8')
            : ((gx + gy) % 2 === 0 ? '#f8fafc' : '#e0f2fe');
        } else if (gx >= 10 && gx < 19 && gy < 9) {
          if (isCur && gx >= 14.5) fill = '#1e293b';
          else fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8')
            : ((gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd');
        } else if (gx >= 19 && gy < 9) {
          fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#1e293b' : '#0f172a')
            : ((gx + gy) % 2 === 0 ? '#334155' : '#1e293b');
        } else if (gx >= 3 && gx < 13 && gy > 10) {
          fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8')
            : ((gx + gy) % 2 === 0 ? '#ecfdf5' : '#d1fae5');
        } else if (gx >= 13 && gx < 21 && gy > 10) {
          fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#fde68a' : '#f59e0b')
            : ((gx + gy) % 2 === 0 ? '#ecfdf5' : '#a7f3d0');
        } else {
          fill = isCur
            ? ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8')
            : ((gx + gy) % 2 === 0 ? '#ede9fe' : '#ddd6fe');
        }
        drawTile(gx, gy, fill);

        // Driveway dashed road line
        if (gx === 1 && gy % 2 === 0) {
          const r0 = toIso(1.35, gy + 0.15);
          const r1 = toIso(1.35, gy + 0.85);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.6 * zoom;
          ctx.beginPath();
          ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y);
          ctx.stroke();
        }
      }
    }

    // 2. Red Congestion Halos (Before) vs Glowing Smart Sync Conduits (After)
    if (isCur) {
      drawFloorHalo(7.2, 4.5, 30, 15, '#ef4444', 'C1: 14+ CROWDED (68m WAIT · NO ETA)');
      drawFloorHalo(20.8, 7.2, 22, 11, '#ef4444', 'C2: 40% REJECTED AT SINGLE X-RAY');
      drawFloorHalo(7.5, 15.0, 30, 15, '#ef4444', 'C3: 4 BEDS BLOCKED (+92m DELAY)');
      drawFloorHalo(16.2, 16.0, 24, 11, '#ef4444', 'C3: STOCKOUT & LANDLINE LOOP');
    } else {
      drawConduitLine(23.2, 14.0, 4.5, 3.2, '#0ea5e9', 'SSOT 99.9% SYNC');
      drawConduitLine(23.2, 14.0, 14.5, 3.5, '#10b981', 'WAVE ETA FEED');
      drawConduitLine(15.5, 13.0, 11.2, 17.5, '#10b981', 'PNEUMATIC RX POD (18m)');
    }

    // 3. REALISTIC CUTAWAY HOSPITAL ROOMS WITH WALLS, WINDOWS, DOORWAYS & EQUIPMENT
    // ROOM 1: Reception & Waiting Hall (gx=3..9.8, gy=1..8.5)
    drawRealisticRoom(3, 1, 6.8, 7.6, '#f8fafc', '#94a3b8', '#64748b', 'S',
      isCur ? '1. Cramped Waiting Hall (68m · ETA Unknown)' : '1. Smart Biometric Lounge (12m Wave ETA)');
    drawIsoBox(3.6, 2.2, 1.2, 2.4, 12, isCur ? '#cbd5e1' : '#0ea5e9', '#0284c7', '#0369a1');
    if (isCur) {
      drawIsoBox(6.2, 3.8, 2.6, 0.5, 7, '#475569', '#334155', '#1e293b');
    } else {
      drawIsoBox(6.0, 2.2, 3.0, 0.55, 7, '#0ea5e9', '#0284c7', '#0369a1');
      drawIsoBox(6.0, 4.2, 3.0, 0.55, 7, '#10b981', '#059669', '#047857');
      drawIsoBox(6.0, 6.2, 3.0, 0.55, 7, '#0ea5e9', '#0284c7', '#0369a1');
      drawIsoBox(4.0, 5.8, 0.45, 0.45, 16, '#10b981', '#059669', '#047857');
      drawIsoBox(4.8, 5.8, 0.45, 0.45, 16, '#10b981', '#059669', '#047857');
      drawIndoorPlant(3.6, 7.2);
    }

    // ROOM 2 (C1): 4 Individual Cutaway Specialist Consultation Rooms (gx=10..18.8, gy=1..8.5)
    drawRealisticRoom(10, 1, 8.8, 7.6, '#e2e8f0', '#64748b', '#475569', 'S',
      isCur ? '2. C1: 2 Slow Consult Rooms (Rooms 3–4 Locked)' : '2. C1: Expanded 4-Room Specialist Pod (12m)');
    const activeRooms = isCur ? 2 : 4;
    for (let c = 0; c < 4; c++) {
      const cx = 10.4 + c * 2.05;
      // Individual consultation room partition wall
      if (c > 0) drawIsoBox(cx - 0.15, 1.2, 0.1, 6.5, 14, '#cbd5e1', '#64748b', '#475569');
      if (c < activeRooms) {
        drawIsoBox(cx + 0.15, 1.8, 1.2, 0.7, 9, isCur ? '#f59e0b' : '#10b981', '#0284c7', '#0369a1'); // Exam Couch
        drawIsoBox(cx + 0.15, 4.2, 1.1, 0.65, 11, '#f8fafc', '#64748b', '#475569'); // Doctor Desk
      } else {
        const lk = toIso(cx + 0.8, 4.0, 10);
        ctx.fillStyle = '#fca5a5';
        ctx.font = `bold ${Math.round(7.5 * zoom)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('LOCKED', lk.x, lk.y);
      }
    }

    // ROOM 3 (C2): Radiology Imaging Wing & Glass Control Booth (gx=19..26.6, gy=1..8.5)
    drawRealisticRoom(19, 1, 7.6, 7.6, '#e2e8f0', '#475569', '#334155', 'S',
      isCur ? '3. C2: Single X-Ray Room (40% Rejected)' : '3. C2: Dual 3T MRI + High-Speed CT (99.2%)');
    // Glass partition separating Scanner Suite from Radiographer Control Booth
    drawIsoBox(19.2, 5.4, 7.2, 0.12, 16, '#38bdf8', '#0ea5e9', '#0284c7', 0.45);
    drawIsoBox(20.0, 2.0, 2.2, 0.8, 9, '#94a3b8', '#475569', '#334155');
    drawIsoBox(20.8, 1.7, 0.55, 1.35, 22, isCur ? '#cbd5e1' : '#f8fafc', '#94a3b8', '#64748b');
    drawIsoBox(20.0, 6.2, 2.4, 0.7, 12, '#0ea5e9', '#0284c7', '#0369a1');
    if (!isCur) {
      drawIsoBox(23.6, 2.0, 2.2, 0.8, 9, '#38bdf8', '#0284c7', '#0369a1');
      drawIsoBox(24.4, 1.7, 0.65, 1.4, 23, '#e0f2fe', '#38bdf8', '#0284c7');
      const lp1 = toIso(21.1, 2.3, 14);
      const lp2 = toIso(24.7, 2.3, 14);
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2.2 * zoom;
      ctx.beginPath(); ctx.arc(lp1.x, lp1.y, (9 + Math.sin(frameTick * 0.3) * 3) * zoom, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#10b981';
      ctx.beginPath(); ctx.arc(lp2.x, lp2.y, (9 + Math.cos(frameTick * 0.3) * 3) * zoom, 0, Math.PI * 2); ctx.stroke();
    }

    // ROOM 4 (C3): Inpatient Ward & Discharge Lounge (gx=3..12.8, gy=11..20.2)
    drawRealisticRoom(3, 11, 9.8, 9.2, '#f8fafc', '#94a3b8', '#64748b', 'N',
      isCur ? '4. C3: Inpatient Ward (4 Beds Blocked · +92m)' : '4. C3: Inpatient Ward + Discharge Lounge (18m)');
    for (let b = 0; b < 3; b++) {
      drawHospitalBed(3.8 + b * 2.5, 13.0, isCur, !isCur);
      drawHospitalBed(3.8 + b * 2.5, 16.8, isCur && b === 0, !isCur);
    }
    if (!isCur) {
      drawIsoBox(10.8, 13.2, 1.4, 2.2, 9, '#10b981', '#059669', '#047857');
      drawIsoBox(10.8, 16.5, 0.8, 0.8, 18, '#38bdf8', '#0284c7', '#0369a1');
    }

    // ROOM 5 (C3): Automated Pharmacy & RFID Inventory Store (gx=13..20.8, gy=11..20.2)
    drawRealisticRoom(13, 11, 7.8, 9.2, '#f8fafc', '#94a3b8', '#64748b', 'N',
      isCur ? '5. C3: Manual Pharmacy (Stockouts & Phone Loop)' : '5. C3: Robotic Pharmacy + RFID Racks (18m)');
    drawIsoBox(14.0, 12.4, 3.2, 0.65, 12, isCur ? '#f59e0b' : '#10b981', '#059669', '#047857');
    drawIsoBox(14.0, 16.5, 4.5, 0.55, 20, '#cbd5e1', '#64748b', '#475569');
    drawIsoBox(14.0, 18.5, 4.5, 0.55, 20, '#cbd5e1', '#64748b', '#475569');
    if (isCur) {
      const sc = frameTick % 18 < 9 ? '#ef4444' : '#7f1d1d';
      drawIsoBox(15.5, 16.45, 0.8, 0.6, 15, sc, sc, sc);
      drawIsoBox(17.2, 18.45, 0.8, 0.6, 15, sc, sc, sc);
    } else {
      const rSlide = Math.sin(frameTick * 0.12) * 1.4;
      drawIsoBox(16.0 + rSlide, 14.8, 0.8, 0.8, 18, '#0ea5e9', '#0284c7', '#0369a1');
      drawIsoBox(15.5, 16.45, 0.8, 0.6, 15, '#10b981', '#059669', '#047857');
      drawIsoBox(17.2, 18.45, 0.8, 0.6, 15, '#10b981', '#059669', '#047857');
    }

    // ROOM 6 (C5): Central HIS Server & SSOT Command Hub (gx=21..26.6, gy=11..20.2)
    drawRealisticRoom(21, 11, 5.6, 9.2, '#e2e8f0', '#64748b', '#475569', 'N',
      isCur ? '6. C5: Disconnected Schedule (68% Sync)' : '6. C5: Central SSOT Command Hub (99.9%)');
    drawIsoBox(22.0, 13.0, 2.2, 0.7, 12, '#a855f7', '#7e22ce', '#6b21a8');
    drawIsoBox(22.2, 16.8, 0.8, 0.8, 22, '#1e293b', '#0f172a', '#334155');
    drawIsoBox(23.8, 16.8, 0.8, 0.8, 22, '#1e293b', '#0f172a', '#334155');
    if (!isCur) {
      drawIsoBox(25.2, 16.8, 0.8, 0.8, 22, '#0ea5e9', '#0284c7', '#0369a1');
    }

    // C5 Clashing SMS != Phone Red Sparks (Before) vs SSOT Cyan Sync (After)
    const c5Anchor = toIso(4.4, 3.2, 38);
    if (isCur) {
      const sep = Math.sin(frameTick * 0.16) * 14 * zoom;
      drawStatusBubble(c5Anchor.x - 28 * zoom - sep, c5Anchor.y, '⚡ SMS 10:00 !=', 'fail');
      drawStatusBubble(c5Anchor.x + 28 * zoom + sep, c5Anchor.y, '☎ PHONE 11:30', 'warn');
    } else {
      drawStatusBubble(c5Anchor.x, c5Anchor.y, '✓ SSOT SYNC: 99.9% ACCURACY', 'ok');
    }

    // 4. Continuously Moving Vehicles on Front Driveway
    drivewayVehicles.forEach(v => drawDrivewayVehicle(v));

    // 5. Depth-Sort and Render all Agents with Clean Readable Nameplates
    const sorted = [...simState.agents].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    sorted.forEach(ag => {
      drawAgent(ag, simState.showActionLabels, ag.id === simState.selectedAgentId);
    });

    // 6. Facility Upgrade Transformation Shockwave Overlay
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

      ctx.font = `bold ${Math.round(13.5 * zoom)}px ui-monospace, monospace`;
      ctx.fillStyle = upgradeMode === 'future' ? '#6ee7b7' : '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(
        upgradeMode === 'future'
          ? '⚡ SMART HOSPITAL WING UNLOCKED: 4-ROOM POD · DUAL 3T MRI+CT · ROBOTIC RX (18m)'
          : '⚠ REVERTED TO BROKEN HOSPITAL WING: 68m WAIT · 40% REJECT · 92m RX DELAY',
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
