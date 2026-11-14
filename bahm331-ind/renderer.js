// ============================================================================
// BAHM331-IND: Luxury Geriatric Retreat 28x22 Isometric Renderer
// Realistic Cutaway Resort Rooms, Moving Vehicles & Clean Readable Nameplates
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
  let upgradeMode = 'tiered';

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

  // Realistic 4-sided cutaway room enclosure with windows, low front walls & doorway threshold
  function drawRealisticRoom(gx, gy, w, d, wallColorTop, wallColorSide, doorSide = 'south', hasWindows = true) {
    const backH = 22;
    const frontH = 5;

    // North-West back wall (along gy)
    drawIsoBox(gx, gy, w, 0.14, backH, wallColorTop, wallColorSide, '#475569');
    if (hasWindows && w >= 4) {
      for (let wx = gx + 1.1; wx < gx + w - 1.2; wx += 2.3) {
        drawIsoBox(wx, gy + 0.02, 1.3, 0.16, 14, '#bae6fd', '#38bdf8', '#0284c7', 0.55);
      }
    }

    // South-West back wall (along gx)
    drawIsoBox(gx, gy, 0.14, d, backH, wallColorTop, '#475569', wallColorSide);

    // Low cutaway South-East wall with doorway gap
    if (doorSide === 'south') {
      const mid = gy + d * 0.5;
      drawIsoBox(gx + w - 0.12, gy, 0.12, Math.max(0.4, d * 0.35), frontH, wallColorTop, wallColorSide, '#64748b');
      drawIsoBox(gx + w - 0.12, mid + 0.7, 0.12, Math.max(0.4, d * 0.35), frontH, wallColorTop, wallColorSide, '#64748b');
      drawTile(gx + w - 1, Math.floor(mid), '#38bdf8', 'rgba(56,189,248,0.45)');
    } else {
      drawIsoBox(gx + w - 0.12, gy, 0.12, d, frontH, wallColorTop, wallColorSide, '#64748b');
    }

    // Low cutaway North-East wall with doorway gap
    if (doorSide === 'east') {
      const midX = gx + w * 0.5;
      drawIsoBox(gx, gy + d - 0.12, Math.max(0.4, w * 0.35), 0.12, frontH, wallColorTop, wallColorSide, '#64748b');
      drawIsoBox(midX + 0.7, gy + d - 0.12, Math.max(0.4, w * 0.35), 0.12, frontH, wallColorTop, wallColorSide, '#64748b');
    } else {
      drawIsoBox(gx, gy + d - 0.12, w, 0.12, frontH, wallColorTop, wallColorSide, '#64748b');
    }
  }

  function drawDetailedLuxuryBed(gx, gy, blanketCol) {
    // Frame & mattress
    drawIsoBox(gx, gy, 1.65, 0.92, 6, '#f8fafc', '#cbd5e1', '#94a3b8');
    // Wood headboard
    drawIsoBox(gx, gy, 0.18, 0.92, 13, '#78350f', '#451a03', '#5c2408');
    // Plush Pillows
    drawIsoBox(gx + 0.22, gy + 0.12, 0.32, 0.3, 8, '#ffffff', '#e2e8f0', '#cbd5e1');
    drawIsoBox(gx + 0.22, gy + 0.5, 0.32, 0.3, 8, '#ffffff', '#e2e8f0', '#cbd5e1');
    // Luxury Duvet
    drawIsoBox(gx + 0.58, gy + 0.06, 1.0, 0.8, 7, blanketCol, blanketCol, '#0f172a', 0.88);
    // Warm Bedside Nightstand & Lamp
    drawIsoBox(gx, gy - 0.42, 0.38, 0.35, 8, '#b45309', '#78350f', '#451a03');
    drawIsoBox(gx + 0.08, gy - 0.34, 0.2, 0.2, 13, '#fef08a', '#f59e0b', '#d97706');
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

  // Continuously moving vehicles on the Resort West Driveway
  function drawDrivewayVehicle(gx, gy, isAmbulance, label) {
    const s = zoom;
    const bounce = Math.sin(frameTick * 0.35) * 0.6;
    const shadowPos = toIso(gx + 0.45, gy + 0.9, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(shadowPos.x, shadowPos.y, 17 * s, 8.5 * s, -0.35, 0, Math.PI * 2);
    ctx.fill();

    if (isAmbulance) {
      drawIsoBox(gx, gy, 0.85, 1.85, 13 + bounce, '#f8fafc', '#e2e8f0', '#cbd5e1');
      drawIsoBox(gx, gy + 1.3, 0.85, 0.55, 9 + bounce, '#38bdf8', '#0284c7', '#0369a1');
      drawIsoBox(gx - 0.02, gy + 0.2, 0.89, 1.1, 4 + bounce, '#ef4444', '#dc2626', '#b91c1c');
      const beacon = toIso(gx + 0.42, gy + 0.9, 15 + bounce);
      ctx.fillStyle = frameTick % 10 < 5 ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 4 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawIsoBox(gx, gy, 0.82, 1.75, 11 + bounce, '#1e293b', '#0f172a', '#334155');
      drawIsoBox(gx + 0.04, gy + 0.3, 0.74, 1.1, 13 + bounce, '#f59e0b', '#d97706', '#b45309');
    }

    // Rotating Wheels
    const w1 = toIso(gx + 0.82, gy + 0.35, 2);
    const w2 = toIso(gx + 0.82, gy + 1.4, 2);
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(w1.x, w1.y, 3.6 * s, 0, Math.PI * 2);
    ctx.arc(w2.x, w2.y, 3.6 * s, 0, Math.PI * 2);
    ctx.fill();

    // Headlight cone
    const head = toIso(gx + 0.4, gy + 1.85, 3);
    const beam = toIso(gx + 0.4, gy + 3.1, 0);
    ctx.save();
    ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(beam.x - 11 * s, beam.y);
    ctx.lineTo(beam.x + 11 * s, beam.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const top = toIso(gx + 0.4, gy + 0.9, 19);
    ctx.font = `bold ${Math.max(8, Math.round(7.5 * s))}px -apple-system, sans-serif`;
    ctx.fillStyle = isAmbulance ? '#fca5a5' : '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText(label, top.x, top.y);
  }

  function drawFloorHalo(gx, gy, rx, ry, col, label) {
    const p = toIso(gx, gy, 1);
    const pulse = 1 + Math.sin(frameTick * 0.14) * 0.12;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * zoom * pulse, ry * zoom * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 1.6 * zoom;
    ctx.stroke();
    if (label) {
      ctx.font = `bold ${Math.round(7.2 * zoom)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y + (ry + 6) * zoom);
    }
    ctx.restore();
  }

  function drawAILifeguardArch(gx, gy) {
    drawIsoBox(gx, gy, 0.22, 0.22, 26, '#38bdf8', '#0284c7', '#0369a1');
    drawIsoBox(gx, gy + 4.2, 0.22, 0.22, 26, '#38bdf8', '#0284c7', '#0369a1');
    drawIsoBox(gx, gy, 0.25, 4.4, 3, '#e0f2fe', '#38bdf8', '#0284c7');
    const sensor = toIso(gx + 0.1, gy + 2.2, 26);
    ctx.fillStyle = frameTick % 20 < 10 ? '#10b981' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(sensor.x, sensor.y, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRBACShieldDome(gx, gy) {
    const p = toIso(gx, gy, 14);
    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.lineWidth = 1.6 * zoom;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawRapidMedicalCart(gx, gy) {
    drawIsoBox(gx, gy, 1.1, 0.65, 11, '#f8fafc', '#ef4444', '#b91c1c');
    const beacon = toIso(gx + 0.55, gy + 0.32, 14);
    ctx.fillStyle = frameTick % 12 < 6 ? '#ef4444' : '#10b981';
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, 4 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${Math.round(7.5 * zoom)}px monospace`;
    ctx.fillStyle = '#6ee7b7';
    ctx.textAlign = 'center';
    ctx.fillText('<3m RAPID CART', beacon.x, beacon.y - 6 * zoom);
  }

  function drawSignalBeamWithPacket(from, to, color, packetLabel) {
    const p0 = toIso(from.gx, from.gy, 14);
    const p1 = toIso(to.gx, to.gy, 14);
    const s = zoom;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.3 * s;
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
    ctx.arc(px, py, 4.2 * s, 0, Math.PI * 2);
    ctx.fill();
    if (packetLabel) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${Math.round(7.5 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(packetLabel, px, py - 7 * s);
    }
  }

  // Clean, high-contrast nameplate pill for all 24 residents & staff
  function drawCleanNameplate(x, y, nameText, subText, role, isSelected) {
    const s = Math.max(0.85, zoom);
    ctx.save();
    const nameFont = `700 ${Math.max(10, Math.round(9.5 * s))}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const subFont = `600 ${Math.max(8, Math.round(7.8 * s))}px ui-monospace, monospace`;

    ctx.font = nameFont;
    const nameW = ctx.measureText(nameText).width;
    ctx.font = subFont;
    const subW = subText ? ctx.measureText(subText).width : 0;

    const boxW = Math.max(nameW, subW) + 18 * s;
    const boxH = subText ? 23 * s : 14 * s;
    const bx = x - boxW / 2;
    const by = y;

    let dotCol = '#f59e0b';
    if (role === 'doctor') dotCol = '#38bdf8';
    else if (role === 'nurse') dotCol = '#10b981';
    else if (role === 'concierge') dotCol = '#a855f7';

    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = isSelected ? 1.8 : 1.1;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 4 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = dotCol;
    ctx.beginPath();
    ctx.arc(bx + 6 * s, by + 7 * s, 2.8 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = nameFont;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, x + 2 * s, by + 7.5 * s);

    if (subText) {
      ctx.font = subFont;
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(subText, x, by + 17.5 * s);
    }
    ctx.restore();
  }

  function drawAgent(agent, showLabels, isSelected, mode) {
    const { gx, gy, role, pose, actionLabel, bubble, bubbleType, glowingWrist } = agent;
    const s = zoom;
    const base = toIso(gx, gy, 0);

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2 * s;
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
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.4 * s;
        ctx.beginPath();
        ctx.arc(pos.x - 11 * s, pos.y - 14 * s, 4 * s, 0, Math.PI * 2);
        ctx.stroke();
        drawRBACShieldDome(gx, gy);
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

    const displayName = agent.shortName || agent.name;
    if (showLabels || role === 'resident' || isSelected || glowingWrist) {
      drawCleanNameplate(base.x, base.y + 4 * s, displayName, showLabels ? actionLabel : '', role, isSelected);
    }

    if (bubble) {
      const top = toIso(gx, gy, 35);
      drawStatusBubble(top.x, top.y, bubble, bubbleType);
    }
  }

  function drawStatusBubble(x, y, text, type) {
    const s = Math.max(0.85, zoom);
    ctx.font = `bold ${Math.max(9, Math.round(8.8 * s))}px ui-monospace, monospace`;
    const tw = ctx.measureText(text).width;
    const bw = tw + 12 * s;
    const bh = 16 * s;

    let bg = '#0f172a', border = '#0ea5e9', fg = '#f8fafc';
    if (type === 'fail') { bg = '#450a0a'; border = '#ef4444'; fg = '#fca5a5'; }
    else if (type === 'ok') { bg = '#064e3b'; border = '#10b981'; fg = '#6ee7b7'; }
    else if (type === 'warn') { bg = '#451a03'; border = '#f59e0b'; fg = '#fde68a'; }

    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.4;
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
    const p = toIso(gx, gy, 24);
    const s = Math.max(0.85, zoom);
    ctx.font = `bold ${Math.max(10, Math.round(9.5 * s))}px -apple-system, sans-serif`;
    const w = ctx.measureText(text).width + 14 * s;
    ctx.fillStyle = 'rgba(9,13,22,0.92)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, p.y - 8.5 * s, w, 17 * s, 4);
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

    // 1. Render 28x22 Luxury Retreat Floorplan Tiles + West Arrival Driveway
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        let fill = '#1e293b';
        if (gx < 2) {
          fill = (gy % 2 === 0) ? '#1e293b' : '#0f172a';
        } else if (gx > 25 || gy === 0 || gy === 21) {
          fill = '#14532d'; // Landscaped resort gardens
        } else if (gy === 9 || gy === 10) {
          fill = isTiered
            ? ((gx + gy) % 2 === 0 ? '#f59e0b' : '#d97706')
            : ((gx + gy) % 2 === 0 ? '#92400e' : '#78350f');
        } else if (gx >= 2 && gx < 10 && gy < 9) {
          if (gx >= 3 && gx <= 8 && gy >= 2 && gy <= 6) {
            fill = isTiered ? '#06b6d4' : '#0e7490'; // Heated Hydrotherapy Lap Pool
          } else {
            fill = isTiered
              ? ((gx + gy) % 2 === 0 ? '#f1f5f9' : '#cbd5e1')
              : ((gx + gy) % 2 === 0 ? '#94a3b8' : '#64748b');
          }
        } else if (gx >= 2 && gx < 10 && gy > 10) {
          fill = isTiered
            ? ((gx + gy) % 2 === 0 ? '#a7f3d0' : '#6ee7b7') // Upgraded Thermal Spa & Physio Recovery Wing
            : ((gx + gy) % 2 === 0 ? '#64748b' : '#475569');
        } else if (gx >= 10 && gx < 18 && gy < 9) {
          fill = isTiered
            ? ((gx + gy) % 2 === 0 ? '#d97706' : '#b45309') // Biometric Yoga Pavilion
            : ((gx + gy) % 2 === 0 ? '#78350f' : '#5c2408');
        } else if (gx >= 10 && gx < 18 && gy > 10) {
          fill = isTiered
            ? ((gx + gy) % 2 === 0 ? '#b45309' : '#92400e') // Nutritional Smart-Bistro
            : ((gx + gy) % 2 === 0 ? '#5c2408' : '#451a03');
        } else if (gx >= 18 && gy < 9) {
          fill = isTiered
            ? ((gx + gy) % 2 === 0 ? '#e0f2fe' : '#bae6fd') // 24/7 Smart Nurse Command & Tele-MD Clinic
            : ((gx + gy) % 2 === 0 ? '#94a3b8' : '#64748b');
        } else {
          fill = isTiered
            ? ((gx + gy) % 2 === 0 ? '#d97706' : '#b45309')
            : ((gx + gy) % 2 === 0 ? '#78350f' : '#5c2408');
        }
        drawTile(gx, gy, fill);

        if (gx === 1 && gy % 2 === 0) {
          const r0 = toIso(1.0, gy + 0.2);
          const r1 = toIso(1.0, gy + 0.8);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.4 * zoom;
          ctx.beginPath();
          ctx.moveTo(r0.x, r0.y);
          ctx.lineTo(r1.x, r1.y);
          ctx.stroke();
        }
      }
    }

    // 2. Continuously Moving Vehicles on Resort Driveway
    const shuttleY = ((frameTick * 0.055) % 18) + 1.0;
    const ambY = 19.0 - ((frameTick * 0.045) % 18);
    drawDrivewayVehicle(0.55, shuttleY, false, 'VIP Retreat Shuttle');
    drawDrivewayVehicle(0.55, ambY, true, isTiered ? 'ALS Standby Unit' : 'Emergency Transfer');

    // 3. Red Risk Halos (Before) vs Smart Accredited Sensors & Rapid Cart (After)
    if (!isTiered) {
      drawFloorHalo(ev.sourcePos.gx, ev.sourcePos.gy, 26, 13, '#ef4444', 'UNFILTERED BROADCAST · BLIND SPOT');
      drawFloorHalo(ev.staffPos.gx, ev.staffPos.gy, 28, 14, '#ef4444', '14 PHI BREACHES ON TABLET');
      drawFloorHalo(23.2, 3.2, 26, 13, '#f59e0b', '68% MD ALERT FATIGUE (50% SLA)');
    } else {
      drawAILifeguardArch(4.2, 2.0);
      drawAILifeguardArch(6.8, 2.0);
      const cartOffset = Math.sin(frameTick * 0.08) * 2.5;
      drawRapidMedicalCart(17.5 + cartOffset, 9.2);
    }

    // Animated Hydrotherapy Pool Lane Lines & Ripples
    for (let lane = 3.8; lane <= 7.8; lane += 2.0) {
      const l0 = toIso(lane, 2.2, 0.5);
      const l1 = toIso(lane, 6.8, 0.5);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 1.2 * zoom;
      ctx.beginPath();
      ctx.moveTo(l0.x, l0.y);
      ctx.lineTo(l1.x, l1.y);
      ctx.stroke();
    }
    const pc1 = toIso(4.5, 4.0, 1);
    const pc2 = toIso(6.5, 4.5, 1);
    const rad = (8 + (frameTick % 34) * 0.65) * zoom;
    ctx.strokeStyle = 'rgba(186,230,253,0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(pc1.x, pc1.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
    ctx.ellipse(pc2.x, pc2.y, rad * 1.1, rad * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Realistic Cutaway Rooms with Windows, Doorways & Partitions
    drawTree(26.4, 2.2); drawTree(26.4, 8.0); drawTree(26.4, 14.0); drawTree(26.4, 19.0);

    // Zone 1: Heated Hydrotherapy Lap Pool Enclosure
    drawRealisticRoom(2, 1, 8, 8, '#f8fafc', '#94a3b8', 'east', true);
    // Poolside sun loungers & lifeguard station
    drawIsoBox(8.2, 2.4, 1.1, 0.55, 5, '#fef08a', '#ca8a04', '#a16207');
    drawIsoBox(8.2, 3.4, 1.1, 0.55, 5, '#fef08a', '#ca8a04', '#a16207');
    drawIsoBox(8.3, 5.5, 0.8, 0.8, 14, '#f8fafc', '#0284c7', '#0369a1');

    // Zone 2: Thermal Spa Suites & Physio Recovery Wing
    drawRealisticRoom(2, 11, 8, 10, '#ecfdf5', '#6ee7b7', 'east', true);
    // Individual Spa Booth Partitions
    drawIsoBox(2.2, 15.2, 6.2, 0.1, 14, '#d1fae5', '#10b981', '#059669', 0.75);
    // 4 Spa Massage Tables with face cradles & hot stone carts
    const spaCoords = [[3.2, 12.3], [6.2, 12.3], [3.2, 16.5], [6.2, 16.5]];
    spaCoords.forEach(([sx, sy]) => {
      drawIsoBox(sx, sy, 1.45, 0.78, 8, '#f8fafc', '#059669', '#047857');
      drawIsoBox(sx + 0.12, sy + 0.15, 0.25, 0.48, 9, '#a7f3d0', '#10b981', '#059669');
      drawIsoBox(sx, sy - 0.35, 0.35, 0.3, 9, '#334155', '#1e293b', '#0f172a');
    });
    if (isTiered) {
      // Unlocked Physio Recovery Parallel Bars & Anti-Slip Smart Sensor Towers
      drawIsoBox(4.8, 14.3, 1.4, 0.55, 11, '#38bdf8', '#0284c7', '#0369a1');
      drawIsoBox(8.2, 12.2, 0.45, 0.45, 16, '#10b981', '#059669', '#047857');
    }

    // Zone 3: Biometric Yoga Pavilion
    drawRealisticRoom(10, 1, 8, 8, '#fef3c7', '#d97706', 'east', true);
    for (let m = 0; m < 3; m++) {
      drawIsoBox(11.2 + m * 2.0, 2.5, 1.25, 0.68, 2, '#ec4899', '#be185d', '#9d174d');
      drawIsoBox(11.2 + m * 2.0, 5.2, 1.25, 0.68, 2, '#8b5cf6', '#6d28d9', '#5b21b6');
    }
    if (isTiered) {
      drawIsoBox(16.6, 2.0, 0.55, 0.55, 18, '#0ea5e9', '#0284c7', '#0369a1');
    }

    // Zone 4: Nutritional Smart-Bistro
    drawRealisticRoom(10, 11, 8, 10, '#fef3c7', '#b45309', 'east', true);
    // Bistro Kitchen Serving Bar + 4 Dining Tables with chairs
    drawIsoBox(10.4, 18.8, 4.5, 0.8, 12, '#78350f', '#451a03', '#5c2408');
    for (let t = 0; t < 2; t++) {
      const tx = 11.4 + t * 2.8;
      drawIsoBox(tx, 12.6, 1.15, 1.15, 9, '#fef3c7', '#b45309', '#78350f');
      drawIsoBox(tx + 0.3, 12.9, 0.3, 0.3, 10, '#38bdf8', '#0284c7', '#0369a1');
      drawIsoBox(tx, 15.8, 1.15, 1.15, 9, '#fef3c7', '#b45309', '#78350f');
      drawIsoBox(tx + 0.3, 16.1, 0.3, 0.3, 10, '#10b981', '#059669', '#047857');
    }
    drawIsoBox(15.4, 18.2, 1.8, 0.7, 13, isTiered ? '#10b981' : '#f59e0b', '#b45309', '#78350f');

    // Zone 5: 24/7 Smart Nurse Command & Tele-Physician Clinic
    drawRealisticRoom(18, 1, 8, 8, '#e0f2fe', '#0284c7', 'east', true);
    // Partition between Nurse Telemetry Command and Doctor Consult Room
    drawIsoBox(21.6, 1.2, 0.12, 6.2, 15, '#bae6fd', '#38bdf8', '#0284c7', 0.75);
    drawIsoBox(19.0, 2.3, 1.9, 0.85, 11, '#0ea5e9', '#0284c7', '#0369a1');
    drawIsoBox(19.4, 2.4, 0.45, 0.25, 15, '#38bdf8', '#0f172a', '#1e293b');
    drawIsoBox(22.4, 2.2, 1.65, 0.8, 10, '#f8fafc', '#64748b', '#475569');
    drawDetailedLuxuryBed(22.4, 5.2, '#38bdf8');
    if (isTiered) {
      drawIsoBox(24.6, 2.0, 0.55, 2.2, 20, '#10b981', '#059669', '#047857');
    }

    // Zone 6: 4 Luxury Residential King Suites (Suites 301-309) with interior suite partitions
    drawRealisticRoom(18, 11, 8, 10, '#fef3c7', '#d97706', 'east', true);
    drawIsoBox(21.8, 11.2, 0.12, 9.2, 15, '#fde68a', '#b45309', '#78350f', 0.8);
    drawIsoBox(18.2, 15.6, 7.4, 0.12, 15, '#fde68a', '#b45309', '#78350f', 0.8);
    drawDetailedLuxuryBed(19.2, 12.6, '#f59e0b');
    drawDetailedLuxuryBed(22.6, 12.6, '#10b981');
    drawDetailedLuxuryBed(19.2, 16.8, '#38bdf8');
    drawDetailedLuxuryBed(22.6, 16.8, '#a855f7');

    // 5. Signal Routing Beams & Flying Telemetry Packets
    const nursePos = { gx: 20.0, gy: 3.5 };
    const docPos = { gx: 23.2, gy: 3.2 };
    if (!isTiered) {
      drawSignalBeamWithPacket(ev.sourcePos, ev.staffPos, '#ef4444', 'RAW PHI LEAK (14x)');
      drawSignalBeamWithPacket(ev.sourcePos, docPos, '#f59e0b', '68% NOISE FATIGUE');
    } else {
      drawSignalBeamWithPacket(ev.sourcePos, nursePos, '#0ea5e9', 'AI TELEMETRY');
      drawSignalBeamWithPacket(nursePos, ev.staffPos, '#10b981', 'RBAC SHIELD PING');
      if (ev.id !== 'EVT-04') {
        drawSignalBeamWithPacket(nursePos, docPos, '#10b981', '<3m SLA CART DISPATCH');
        const mdRing = toIso(docPos.gx, docPos.gy, 1);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.4 * zoom;
        ctx.beginPath();
        ctx.ellipse(mdRing.x, mdRing.y, 26 * zoom, 13 * zoom, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 6. Depth-Sort and Render all 24 Agents
    const sorted = [...simState.agents].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    sorted.forEach(ag => {
      drawAgent(ag, simState.showActionLabels, ag.id === simState.selectedAgentId, simState.mode);
    });

    // 7. Zone Signs
    drawZoneSign(5.5, 1.2, isTiered ? '1. AI Lifeguard Hydro Pool' : '1. Basic Pool (Blind Spots)', isTiered ? '#06b6d4' : '#ef4444');
    drawZoneSign(5.5, 11.5, isTiered ? '2. Thermal Spa & Physio Wing' : '2. Basic Spa (PHI Leaks)', isTiered ? '#10b981' : '#ef4444');
    drawZoneSign(14.0, 1.2, isTiered ? '3. Biometric Yoga Pavilion' : '3. Yoga Area (Motion Noise)', isTiered ? '#ec4899' : '#f59e0b');
    drawZoneSign(14.0, 11.5, isTiered ? '4. Nutritional Smart-Bistro' : '4. Bistro (Raw Med Leaks)', isTiered ? '#10b981' : '#ef4444');
    drawZoneSign(22.0, 1.2, isTiered ? '5. 24/7 Nurse Command & Tele-MD' : '5. Overwhelmed Single MD (68%)', isTiered ? '#0ea5e9' : '#ef4444');
    drawZoneSign(22.0, 11.5, '6. Luxury Suites 301–309', '#f59e0b');

    // 8. Facility Upgrade Transformation Shockwave Overlay
    if (upgradePulse > 0.01) {
      const center = toIso(14, 11, 10);
      const maxR = Math.max(vpW, vpH) * 0.9;
      const curR = (1 - upgradePulse) * maxR;
      ctx.save();
      ctx.strokeStyle = upgradeMode === 'tiered' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 6 * upgradePulse;
      ctx.globalAlpha = upgradePulse;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, curR, curR * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `bold ${Math.round(13.5 * zoom)}px ui-monospace, monospace`;
      ctx.fillStyle = upgradeMode === 'tiered' ? '#6ee7b7' : '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(
        upgradeMode === 'tiered'
          ? '⚡ SMART ACCREDITED CAMPUS UNLOCKED: 0 PHI BREACHES · 6% FATIGUE · 98.5% SLA (<3m CART)'
          : '⚠ REVERTED TO UNFILTERED CAMPUS: 14 PHI BREACHES · 68% FATIGUE · 50.0% SLA',
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
