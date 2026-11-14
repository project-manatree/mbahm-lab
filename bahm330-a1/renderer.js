// ============================================================================
// BAHM330-A1: 28x22 Realistic Project Hospital & Luxury Retreat Isometric Engine
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
    zoom = Math.max(0.55, Math.min(2.0, zoom * factor));
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

  // Realistic Cutaway Room Enclosure with Tall Back Walls, Framed Windows & Low Front Cutaway Walls + Doorway
  function drawRealisticRoom(gx, gy, w, d, wallTop, wallLeft, wallRight, doorSide = 'S', roomTitle = '') {
    const t = 0.16;
    const backH = 22;
    const frontH = 5; // Cutaway front wall so room interior is 100% visible like Project Hospital

    // North-West Back Wall (along gy)
    drawIsoBox(gx, gy, w, t, backH, wallTop, wallLeft, wallRight);
    // Framed glass windows on North back wall
    for (let wx = gx + 0.8; wx < gx + w - 1.0; wx += 2.2) {
      drawIsoBox(wx, gy - 0.02, 1.1, t + 0.04, 9, '#bae6fd', '#38bdf8', '#0284c7', 0.55);
    }

    // South-West Back Wall (along gx)
    drawIsoBox(gx, gy, t, d, backH, wallTop, wallLeft, wallRight);

    // East Partition Wall (cutaway height with doorway gap if doorSide === 'E')
    if (doorSide === 'E') {
      const mid = d * 0.45;
      drawIsoBox(gx + w - t, gy, t, mid - 0.6, frontH + 4, wallTop, wallLeft, wallRight);
      drawIsoBox(gx + w - t, gy + mid + 0.8, t, d - mid - 0.8, frontH + 4, wallTop, wallLeft, wallRight);
      // Doorway threshold mat
      drawTile(Math.floor(gx + w - 1), Math.floor(gy + mid), 'rgba(56,189,248,0.28)', null);
    } else {
      drawIsoBox(gx + w - t, gy, t, d, frontH + 3, wallTop, wallLeft, wallRight);
    }

    // South Partition Wall (cutaway height with doorway gap if doorSide === 'S')
    if (doorSide === 'S') {
      const mid = w * 0.45;
      drawIsoBox(gx, gy + d - t, mid - 0.6, t, frontH, wallTop, wallLeft, wallRight);
      drawIsoBox(gx + mid + 0.8, gy + d - t, w - mid - 0.8, t, frontH, wallTop, wallLeft, wallRight);
    } else {
      drawIsoBox(gx, gy + d - t, w, t, frontH, wallTop, wallLeft, wallRight);
    }

    // Clean Floor-Anchored Room Plaque
    if (roomTitle) {
      const rp = toIso(gx + w * 0.5, gy + 0.65, 24);
      ctx.font = `700 ${Math.max(9, Math.round(9.5 * zoom))}px -apple-system, BlinkMacSystemFont, sans-serif`;
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
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, 10 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();
    drawIsoBox(gx + 0.38, gy + 0.38, 0.24, 0.24, 10, '#78350f', '#451a03', '#5c2408');
    const canopy1 = toIso(gx + 0.5, gy + 0.5, 16);
    const canopy2 = toIso(gx + 0.5, gy + 0.5, 23);
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.arc(canopy1.x, canopy1.y, 10 * zoom, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(canopy2.x, canopy2.y, 7 * zoom, 0, Math.PI * 2); ctx.fill();
  }

  function drawIndoorPlant(gx, gy) {
    drawIsoBox(gx, gy, 0.38, 0.38, 6.5, '#f8fafc', '#94a3b8', '#64748b');
    const p = toIso(gx + 0.19, gy + 0.19, 10.5);
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(p.x, p.y, 5.5 * zoom, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath(); ctx.arc(p.x - 1.5 * zoom, p.y - 2 * zoom, 3.4 * zoom, 0, Math.PI * 2); ctx.fill();
  }

  function drawFloorHalo(gx, gy, rx, ry, col, label) {
    const p = toIso(gx, gy, 1);
    const pulse = 1 + Math.sin(frameTick * 0.14) * 0.1;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * zoom * pulse, ry * zoom * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.6 * zoom;
    ctx.stroke();
    if (label) {
      ctx.font = `bold ${Math.max(8, Math.round(8 * zoom))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y + (ry + 7) * zoom);
    }
    ctx.restore();
  }

  function drawHospitalBedDetailed(gx, gy, luxury = false, glowingReady = false) {
    if (glowingReady) {
      drawFloorHalo(gx + 0.7, gy + 0.4, 19, 9.5, '#10b981', null);
    }
    // Bed frame & mattress
    drawIsoBox(gx, gy, 1.45, 0.85, 7.5, luxury ? '#fef3c7' : '#f8fafc', '#94a3b8', '#64748b');
    // Headboard
    drawIsoBox(gx, gy, 0.2, 0.85, 16, luxury ? '#78350f' : '#0284c7', '#451a03', '#0369a1');
    // Pillow
    drawIsoBox(gx + 0.22, gy + 0.15, 0.28, 0.55, 9, '#ffffff', '#e2e8f0', '#cbd5e1');
    // Duvet / Blanket
    drawIsoBox(
      gx + 0.52,
      gy + 0.05,
      0.88,
      0.75,
      9.2,
      glowingReady ? '#10b981' : (luxury ? '#d97706' : '#38bdf8'),
      glowingReady ? '#059669' : '#b45309',
      '#0284c7'
    );
    // Bedside Nightstand / Medical Telemetry Tower
    drawIsoBox(gx + 0.05, gy - 0.38, 0.38, 0.32, 11, luxury ? '#b45309' : '#e2e8f0', '#64748b', '#475569');
    if (!luxury) {
      // Wall/Bedside Vitals Monitor + IV Stand
      const scr = toIso(gx + 0.22, gy - 0.2, 15);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(scr.x - 5 * zoom, scr.y - 4 * zoom, 10 * zoom, 7 * zoom);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(scr.x - 4 * zoom, scr.y - 2 * zoom, 8 * zoom, 2 * zoom);
    } else {
      // Warm bedside lamp in Luxury Retreat Suite
      const lmp = toIso(gx + 0.22, gy - 0.2, 14);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(lmp.x, lmp.y, 3.8 * zoom, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawReceptionDeskDetailed(gx, gy, w, d, isFuture) {
    drawIsoBox(gx, gy, w, d, 11.5, isFuture ? '#f8fafc' : '#cbd5e1', '#475569', '#334155');
    // Front accent strip
    drawIsoBox(gx, gy + d - 0.08, w, 0.08, 9, isFuture ? '#10b981' : '#0ea5e9', '#059669', '#0284c7');
    if (!isFuture) {
      // Messy paper stacks
      drawIsoBox(gx + 0.2, gy + 0.15, 0.35, 0.28, 15, '#fef08a', '#ca8a04', '#a16207');
      drawIsoBox(gx + 0.65, gy + 0.18, 0.32, 0.25, 14, '#fca5a5', '#dc2626', '#991b1b');
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

  // Animated Moving Vehicle (Ambulance / Luxury VIP Concierge Van / Shuttle Car)
  function drawMovingVehicle(van, isVipFuture, labelText) {
    const { gx, gy, dirY = 1, doorsOpen, rampExtended, brakeLights, isMoving } = van;
    const sh = toIso(gx + 0.8, gy + 0.8, 0);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, 32 * zoom, 16 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight beams when moving along the road
    if (isMoving) {
      const beamOrigin = toIso(gx + 0.7, dirY > 0 ? gy + 2.1 : gy - 0.2, 2);
      const beamFar = toIso(gx + 0.7, dirY > 0 ? gy + 4.4 : gy - 2.5, 0);
      ctx.save();
      const grad = ctx.createLinearGradient(beamOrigin.x, beamOrigin.y, beamFar.x, beamFar.y);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(beamOrigin.x - 6 * zoom, beamOrigin.y);
      ctx.lineTo(beamFar.x - 22 * zoom, beamFar.y);
      ctx.lineTo(beamFar.x + 22 * zoom, beamFar.y);
      ctx.lineTo(beamOrigin.x + 6 * zoom, beamOrigin.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Hydraulic wheelchair ramp when parked at boarding bay
    if (rampExtended) {
      drawIsoBox(gx - 0.85, gy + 0.3, 0.85, 0.9, 2.5, isVipFuture ? '#38bdf8' : '#94a3b8', '#0284c7', '#334155');
      const rp = toIso(gx - 0.45, gy + 0.75, 5);
      ctx.fillStyle = isVipFuture ? '#6ee7b7' : '#fcd34d';
      ctx.font = `bold ${Math.max(8, Math.round(7.8 * zoom))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(isVipFuture ? '◀ HYDRAULIC LIFT' : '◀ BOARDING RAMP', rp.x, rp.y);
    }

    // Vehicle lower chassis + wheels
    const bounce = isMoving ? Math.sin(frameTick * 0.45) * 0.8 : 0;
    const w1 = toIso(gx + 0.2, gy + 0.35, 3);
    const w2 = toIso(gx + 0.2, gy + 1.45, 3);
    const w3 = toIso(gx + 1.3, gy + 0.35, 3);
    const w4 = toIso(gx + 1.3, gy + 1.45, 3);
    [w1, w2, w3, w4].forEach(w => {
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 4.5 * zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 2 * zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    // Main Van Body (oriented along road gy)
    drawIsoBox(gx, gy, 1.45, 1.95, 17 + bounce, '#f8fafc', '#e2e8f0', '#cbd5e1');
    // Medical / VIP Livery Stripe
    drawIsoBox(
      gx - 0.02,
      gy + 0.02,
      1.49,
      1.91,
      9 + bounce,
      isVipFuture ? '#0ea5e9' : '#dc2626',
      isVipFuture ? '#0284c7' : '#b91c1c',
      isVipFuture ? '#0369a1' : '#991b1b'
    );
    // Tinted Cabin Windshield & Side Windows
    drawIsoBox(gx + 0.12, gy + 0.18, 1.2, 1.55, 21 + bounce, '#1e293b', '#0f172a', '#334155');

    // Roof Medical Cross & Emergency Beacon Bar
    const beacon = toIso(gx + 0.72, gy + 0.95, 24 + bounce);
    ctx.fillStyle = isVipFuture
      ? (frameTick % 14 < 7 ? '#10b981' : '#38bdf8')
      : (frameTick % 14 < 7 ? '#ef4444' : '#f59e0b');
    ctx.beginPath();
    ctx.arc(beacon.x - 4 * zoom, beacon.y, 4 * zoom, 0, Math.PI * 2);
    ctx.arc(beacon.x + 4 * zoom, beacon.y, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();

    if (brakeLights) {
      const b1 = toIso(gx + 0.2, gy + 0.05, 8);
      const b2 = toIso(gx + 1.2, gy + 0.05, 8);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(b1.x, b1.y, 3.8 * zoom, 0, Math.PI * 2);
      ctx.arc(b2.x, b2.y, 3.8 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    if (labelText) {
      const lp = toIso(gx + 0.72, gy + 0.95, 32 + bounce);
      ctx.font = `bold ${Math.max(8.5, Math.round(8.5 * zoom))}px ui-monospace, monospace`;
      const tw = ctx.measureText(labelText).width + 10;
      ctx.fillStyle = 'rgba(9,13,22,0.9)';
      ctx.strokeStyle = isVipFuture ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(lp.x - tw / 2, lp.y - 8, tw, 15, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isVipFuture ? '#6ee7b7' : '#fde68a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, lp.x, lp.y - 0.5);
    }
  }

  // Clean, High-Contrast, Always-Readable Patient & Staff Nameplates
  function drawCleanNameplate(x, y, agent, isSelected, showDetails) {
    // Extract short, ultra-readable name (e.g. "Tan Sri Lim #G-101" or "Dr. Ariff")
    const shortName = agent.shortName || agent.name.replace(/\s*\(.*?\)/g, '');
    const statusText = agent.bubble || agent.actionLabel || '';

    let roleDot = '#f59e0b'; // Patient/Resident gold
    let borderCol = isSelected ? '#38bdf8' : 'rgba(245, 158, 11, 0.75)';
    if (agent.role === 'doctor') { roleDot = '#38bdf8'; borderCol = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.65)'; }
    else if (agent.role === 'nurse') { roleDot = '#10b981'; borderCol = isSelected ? '#38bdf8' : 'rgba(16, 185, 129, 0.65)'; }
    else if (agent.role === 'concierge') { roleDot = '#a855f7'; borderCol = isSelected ? '#38bdf8' : 'rgba(168, 85, 247, 0.65)'; }
    else if (agent.role === 'cleaner') { roleDot = '#94a3b8'; borderCol = 'rgba(148, 163, 184, 0.5)'; }

    const isPatient = agent.role === 'resident' || agent.role === 'patient';
    // Always show patient names clearly; show staff names when showDetails is active or selected
    if (!isPatient && !showDetails && !isSelected) return;

    const fontSize = Math.max(10, Math.round((isPatient ? 10.5 : 9.2) * Math.min(1.25, Math.max(0.88, zoom))));
    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const nameW = ctx.measureText(shortName).width;

    const subFontSize = Math.max(8.5, fontSize - 1.5);
    let subW = 0;
    if (showDetails && statusText && isPatient) {
      ctx.font = `600 ${subFontSize}px ui-monospace, monospace`;
      subW = ctx.measureText(statusText).width;
    }

    const boxW = Math.max(nameW + 18, subW + 14);
    const boxH = (showDetails && statusText && isPatient) ? (fontSize + subFontSize + 10) : (fontSize + 8);
    const bx = x - boxW / 2;
    const by = y - boxH;

    // Crisp Dark Glass Pill
    ctx.fillStyle = isSelected ? 'rgba(8, 47, 73, 0.96)' : 'rgba(9, 13, 22, 0.92)';
    ctx.strokeStyle = agent.bubbleType === 'wait' || agent.bubbleType === 'fail' ? '#ef4444' : borderCol;
    ctx.lineWidth = isSelected ? 2.0 : 1.3;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 5);
    ctx.fill();
    ctx.stroke();

    // Role Color Indicator Dot
    ctx.fillStyle = roleDot;
    ctx.beginPath();
    ctx.arc(bx + 7, by + fontSize * 0.5 + 3.5, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Line 1: Crisp White Patient/Staff Name
    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(shortName, bx + 13, by + fontSize * 0.5 + 3.5);

    // Line 2: Status / Action Badge for Patients
    if (showDetails && statusText && isPatient) {
      ctx.font = `600 ${subFontSize}px ui-monospace, monospace`;
      ctx.fillStyle = (agent.bubbleType === 'wait' || agent.bubbleType === 'fail') ? '#fca5a5' : '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, x, by + fontSize + subFontSize * 0.5 + 5);
    }
  }

  function drawAgent(agent, showLabels, isSelected) {
    const { gx, gy, role, pose, dir } = agent;
    const s = zoom;
    const base = toIso(gx, gy, 0);

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, 14 * s, 7 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.38)';
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
      ctx.arc(bp.x - 14 * s, bp.y - 0.5 * s, 4.8 * s, 0, Math.PI * 2);
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
      ctx.arc(seat.x, seat.y - 20.5 * s, 4.8 * s, 0, Math.PI * 2);
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
      ctx.arc(pos.x + f.dx * 0.7 * s, pos.y - 24.5 * s, 4.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Clean, High-Contrast Floating Nameplate above character head
    const headTop = toIso(gx, gy, 32);
    drawCleanNameplate(headTop.x, headTop.y, agent, isSelected, showLabels);
  }

  function render(simState) {
    if (!ctx) return;
    frameTick++;
    const vpW = canvas.width / window.devicePixelRatio;
    const vpH = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, vpW, vpH);

    const isFuture = simState.mode === 'future';

    // 1. Render 28x22 Floor Grid (Hospital Wing on Left, Multi-Lane Roadway in Middle, Luxury Retreat on Right)
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#0f172a';
        if (gx === 0 || gx === 27 || gy === 0 || gy === 21) {
          fill = '#1e293b'; // Landscaped perimeter sidewalk
        } else if (gx >= 11 && gx <= 15) {
          fill = '#1e293b'; // Multi-lane Asphalt Avenue & Covered Transfer Bays
        } else if (gx < 11) {
          // Partner Hospital Flooring
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
              ? ((gx + gy) % 2 === 0 ? '#ecfdf5' : '#d1fae5')
              : ((gx + gy) % 2 === 0 ? '#cbd5e1' : '#94a3b8');
          }
        } else {
          // Luxury Geriatric Retreat Flooring
          if (gy === 9 || gy === 10) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#f59e0b' : '#d97706')
              : ((gx + gy) % 2 === 0 ? '#92400e' : '#78350f');
          } else if (gx <= 21 && gy < 9) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd')
              : ((gx + gy) % 2 === 0 ? '#94a3b8' : '#64748b');
          } else if (gx <= 21 && gy > 10) {
            fill = isFuture
              ? ((gx + gy) % 2 === 0 ? '#d97706' : '#b45309')
              : ((gx + gy) % 2 === 0 ? '#78350f' : '#5c2408');
          } else {
            if (gx >= 23 && gx <= 25 && gy >= 2 && gy <= 7) {
              fill = isFuture ? '#06b6d4' : '#0e7490'; // Hydrotherapy Lap Pool
            } else {
              fill = isFuture
                ? ((gx + gy) % 2 === 0 ? '#b47b48' : '#9c6638')
                : ((gx + gy) % 2 === 0 ? '#78350f' : '#5c2408');
            }
          }
        }
        drawTile(gx, gy, fill);

        // Roadway dashed yellow dividing line + crosswalks
        if (gx === 13 && gy % 2 === 1) {
          const r0 = toIso(13.3, gy + 0.15);
          const r1 = toIso(13.3, gy + 0.85);
          ctx.strokeStyle = isFuture ? '#10b981' : '#f59e0b';
          ctx.lineWidth = 2.0 * zoom;
          ctx.beginPath();
          ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y);
          ctx.stroke();
        }
        if ((gy === 9 || gy === 10) && gx >= 11 && gx <= 15) {
          // Pedestrian / Wheelchair Crosswalk stripes connecting Hospital & Retreat
          const cw0 = toIso(gx + 0.2, gy + 0.5);
          const cw1 = toIso(gx + 0.8, gy + 0.5);
          ctx.strokeStyle = 'rgba(248,250,252,0.5)';
          ctx.lineWidth = 3 * zoom;
          ctx.beginPath();
          ctx.moveTo(cw0.x, cw0.y); ctx.lineTo(cw1.x, cw1.y);
          ctx.stroke();
        }
      }
    }

    // 2. Red Congestion Halos (Before) vs Glowing Emerald-Cyan Flow Paths (After)
    if (!isFuture) {
      drawFloorHalo(4.5, 7.2, 24, 11, '#ef4444', 'WARD HANDOVER BACKLOG (+45m)');
      drawFloorHalo(5.8, 14.2, 28, 13, '#ef4444', 'PAPER GL QUEUE (+45m)');
      drawFloorHalo(17.8, 14.5, 24, 11, '#ef4444', 'UNREADY SUITE WAIT (+30m)');
    }

    // 3. REALISTIC CUTAWAY ROOMS WITH WALLS, WINDOWS, DOORWAYS & FURNITURE
    // ROOM S1: Acute Partner Hospital Inpatient Ward (gx=1..10, gy=1..8.5)
    drawRealisticRoom(1, 1, 9.8, 7.8, '#f8fafc', '#94a3b8', '#64748b', 'S',
      isFuture ? 'S1: Acute Ward + HL7 Pre-Alert (5m)' : 'S1: Acute Partner Ward (+45m Delay)');
    // Interior Sub-Rooms for Ward Beds 1-6 + Nurse Station
    for (let b = 0; b < 3; b++) {
      drawHospitalBedDetailed(1.8 + b * 2.4, 2.0, false, false);
      drawHospitalBedDetailed(1.8 + b * 2.4, 5.2, false, false);
      // Privacy partition curtains between ward beds
      drawIsoBox(1.55 + (b + 1) * 2.4, 1.6, 0.08, 2.2, 13, '#bae6fd', '#38bdf8', '#0284c7', 0.5);
    }
    drawReceptionDeskDetailed(8.2, 2.4, 1.8, 0.85, isFuture);

    // ROOM S2: Billing & Insurance Hall (Before) vs Digital Fast-Track Discharge Lounge (After)
    drawRealisticRoom(1, 11, 9.8, 9.2, '#f8fafc', '#94a3b8', '#64748b', 'E',
      isFuture ? 'S2: Fast-Track Discharge & e-GL Lounge (0m)' : 'S2: Paper Billing & GL Hall (+45m Wait)');
    drawReceptionDeskDetailed(1.8, 12.2, 2.2, 0.85, isFuture);
    if (!isFuture) {
      // Single cramped waiting bench
      drawIsoBox(5.2, 14.0, 2.6, 0.55, 7, '#475569', '#334155', '#1e293b');
    } else {
      // Plush Lounge Sofas + Self-Service Insurance e-Clearance Kiosks + Greenery
      drawIsoBox(4.8, 12.5, 2.8, 0.65, 8.5, '#10b981', '#059669', '#047857');
      drawIsoBox(4.8, 15.0, 2.8, 0.65, 8.5, '#0ea5e9', '#0284c7', '#0369a1');
      drawIsoBox(8.4, 12.5, 0.5, 0.5, 16, '#0ea5e9', '#0284c7', '#0369a1');
      drawIsoBox(8.4, 15.0, 0.5, 0.5, 16, '#10b981', '#059669', '#047857');
      drawIndoorPlant(2.0, 18.2);
      drawIndoorPlant(8.8, 18.2);
    }

    // ROOM S5: Visiting Physician Clinic (gx=16..21.8, gy=1..8.5)
    drawRealisticRoom(16, 1, 5.8, 7.8, '#e0f2fe', '#0284c7', '#0369a1', 'S',
      isFuture ? 'S5: On-Site MD Telemetry Suite (5m)' : 'S5: Distant Visiting MD Office (+30m)');
    drawHospitalBedDetailed(16.8, 2.2, false, false);
    drawReceptionDeskDetailed(19.4, 2.4, 1.6, 0.8, isFuture);
    if (isFuture) {
      drawHospitalBedDetailed(16.8, 5.2, false, false);
      drawIsoBox(19.6, 5.4, 0.6, 0.6, 15, '#10b981', '#059669', '#047857'); // Mobile ECG Telemetry Cart
      drawIndoorPlant(16.5, 7.2);
    }

    // ROOM S4: Luxury Retreat Lobby & King Suites 301-303 (gx=16..21.8, gy=11..20.2)
    drawRealisticRoom(16, 11, 5.8, 9.2, '#fef3c7', '#b45309', '#78350f', 'E',
      isFuture ? 'S4: Biometric Pod & Ready King Suites' : 'S4: Manual Ledger & Unclean Suites (+30m)');
    drawReceptionDeskDetailed(16.6, 11.8, 1.8, 0.8, isFuture);
    // Interior partition dividing Lobby from King Suites 301 & 302
    drawIsoBox(16.2, 13.8, 5.4, 0.1, 8, '#fde68a', '#b45309', '#78350f');
    drawHospitalBedDetailed(18.2, 14.5, true, isFuture);
    drawHospitalBedDetailed(18.2, 17.5, true, isFuture);
    if (!isFuture) {
      // Housekeeping Mop Carts blocking suites
      drawIsoBox(17.2, 15.2, 0.48, 0.48, 9, '#facc15', '#ca8a04', '#854d0e');
      drawIsoBox(17.2, 18.0, 0.48, 0.48, 9, '#facc15', '#ca8a04', '#854d0e');
    } else {
      drawIsoBox(16.8, 13.0, 0.5, 0.5, 16, '#10b981', '#059669', '#047857'); // Smart Biometric Pod
    }

    // ROOM S6: Hydrotherapy Pool Pavilion, Thermal Spa & Fine-Dining Bistro (gx=22.2..26.6, gy=1..20.2)
    drawRealisticRoom(22.2, 1, 4.4, 7.8, '#bae6fd', '#0891b2', '#06b6d4', 'S', 'S6A: Hydrotherapy Lap Pool');
    // Pool water ripples & stainless steel ladder
    const poolCenter = toIso(24.4, 4.8, 1);
    const rad = (9 + (frameTick % 36) * 0.65) * zoom;
    ctx.strokeStyle = 'rgba(186,230,253,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(poolCenter.x, poolCenter.y, rad * 1.3, rad * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();

    drawRealisticRoom(22.2, 11, 4.4, 9.2, '#fef3c7', '#b45309', '#78350f', 'S', 'S6B: Spa & Fine-Dining Bistro');
    drawIsoBox(22.8, 12.0, 1.4, 0.75, 9, '#a7f3d0', '#059669', '#047857');
    drawIsoBox(22.8, 14.0, 1.4, 0.75, 9, '#a7f3d0', '#059669', '#047857');
    drawIsoBox(23.0, 16.8, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');
    drawIsoBox(24.8, 16.8, 1.1, 1.1, 10, '#fde68a', '#b45309', '#78350f');

    // Exterior Roadside Trees
    drawTree(10.8, 1.5); drawTree(15.2, 1.5);
    drawTree(10.8, 19.2); drawTree(15.2, 19.2);

    // 4. Continuously Moving Vehicles on the Avenue (S3)
    drawMovingVehicle(simState.van, isFuture, isFuture ? 'VIP CONCIERGE VAN #1' : 'AMBULANCE #1 (TRANSIT)');
    if (simState.van2) {
      drawMovingVehicle(simState.van2, isFuture, isFuture ? 'VIP CONCIERGE VAN #2' : 'SHUTTLE CAR #2');
    }

    // 5. Depth-Sort and Render all 24 Agents with Clean Readable Nameplates
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
