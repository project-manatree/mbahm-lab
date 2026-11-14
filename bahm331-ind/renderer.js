// ============================================================================
// BAHM331-IND: Luxury Geriatric Retreat 28x22 Project Hospital Renderer
// Powered by PH Engine & PHSprites — Procedural Textiles, Cutaway/Full Walls,
// Hydrotherapy Pool, Thermal Spa, Yoga Studio, Bistro, Nurse Command & Suites
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 28;
  const GRID_H = 22;

  let upgradePulse = 0;
  let upgradeMode = 'tiered';

  const MAP = {
    bounds: { x0: -2, y0: -2, x1: 30, y1: 24 },
    view: { x0: -1, y0: -1, x1: 29, y1: 23 },
    ground: [
      // Surrounding landscaped resort gardens
      { x: -2, y: -2, w: 32, d: 26, mat: 'grass' },
      // Travertine perimeter terrace
      { x: 1.8, y: 0, w: 25.2, d: 21.5, mat: 'travertine' },
      // West Resort Arrival Asphalt Driveway (x: -0.8..1.8)
      { x: -0.8, y: -2, w: 2.6, d: 26, mat: 'asphalt' },
      // Central Marble Promenade (x: 2..26, y: 9..11)
      { x: 2, y: 9, w: 24, d: 2.2, mat: 'marble' },
      // Zone 1: Heated Hydrotherapy Lap Pool & Ceramic Deck (x: 2..10, y: 1..9)
      { x: 2, y: 1, w: 8, d: 8, mat: 'ceramicCream' },
      { x: 3.0, y: 2.0, w: 5.2, d: 5.2, mat: 'water' },
      // Zone 2: Thermal Spa Suites & Physio Recovery Wing (x: 2..10, y: 11..20)
      { x: 2, y: 11, w: 8, d: 9, mat: { cur: 'linoWorn', fut: 'linoMint' } },
      // Zone 3: Biometric Yoga Pavilion (x: 10..18, y: 1..9)
      { x: 10, y: 1, w: 8, d: 8, mat: 'oak' },
      // Zone 4: Nutritional Smart-Bistro (x: 10..18, y: 11..20)
      { x: 10, y: 11, w: 8, d: 9, mat: 'deck' },
      // Zone 5: 24/7 Smart Nurse Command & Tele-Physician Clinic (x: 18..26, y: 1..9)
      { x: 18, y: 1, w: 8, d: 8, mat: { cur: 'linoGrey', fut: 'linoBlue' } },
      // Zone 6: 4 Luxury Residential King Suites 301-309 (x: 18..26, y: 11..20)
      { x: 18, y: 11, w: 8, d: 9, mat: 'oak' }
    ],
    decals: [
      // West Driveway road lines & crosswalk
      { type: 'line', x1: 0.5, y1: -2, x2: 0.5, y2: 24, w: 0.08, col: '#facc15', dash: [0.7, 0.5] },
      { type: 'zebra', x: -0.6, y: 9.2, w: 2.4, d: 1.8, axis: 'x', col: 'rgba(248,250,252,0.88)' },
      // Hydrotherapy pool coping border & underwater lane lines
      { type: 'line', x1: 4.7, y1: 2.2, x2: 4.7, y2: 7.0, w: 0.07, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 6.5, y1: 2.2, x2: 6.5, y2: 7.0, w: 0.07, col: 'rgba(224,242,254,0.65)' },
      // Promenade smart medical cart guide stripe
      { type: 'line', x1: 2.5, y1: 10.0, x2: 25.5, y2: 10.0, w: 0.12, col: '#10b981', when: 'fut' }
    ],
    wear: [
      { x: 2, y: 11, w: 8, d: 9 },
      { x: 18, y: 1, w: 8, d: 8 }
    ],
    walls: [
      // Outer Resort Perimeter Walls with framed windows
      { x1: 2, y1: 1, x2: 26, y2: 1, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 2, y1: 1, x2: 2, y2: 9, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 2, y1: 11, x2: 2, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 2, y1: 20, x2: 26, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 26, y1: 1, x2: 26, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },

      // North Promenade Wall (y = 9) with sliding glass & wood doors
      {
        x1: 2, y1: 9, x2: 26, y2: 9, kind: 'glass',
        open: [
          { at: 5.5, w: 1.8, type: 'slide' },
          { at: 13.5, w: 1.8, type: 'slide' },
          { at: 21.0, w: 1.6, type: 'double' }
        ]
      },
      { x1: 10, y1: 1, x2: 10, y2: 9, kind: 'glass' },
      { x1: 18, y1: 1, x2: 18, y2: 9, kind: 'int', col: '#e2e8f0' },
      // Partition inside Zone 5 between 24/7 Nurse Command and Tele-Physician Consult Suite
      { x1: 21.8, y1: 1, x2: 21.8, y2: 9, kind: 'glass', open: [{ at: 4.5, w: 1.2, type: 'door' }] },

      // South Promenade Wall (y = 11) with doors into Thermal Spa, Smart-Bistro & Residential Suites
      {
        x1: 2, y1: 11, x2: 26, y2: 11, kind: 'int', col: '#ede4d3',
        open: [
          { at: 5.5, w: 1.6, type: 'slide' },
          { at: 13.5, w: 1.8, type: 'slide' },
          { at: 19.6, w: 1.2, type: 'door' },
          { at: 23.4, w: 1.2, type: 'door' }
        ]
      },
      { x1: 10, y1: 11, x2: 10, y2: 20, kind: 'int', col: '#ede4d3' },
      { x1: 18, y1: 11, x2: 18, y2: 20, kind: 'int', col: '#ede4d3' },
      // Interior partitions for the 4 Luxury Residential King Suites (Suites 301-309)
      { x1: 22, y1: 11, x2: 22, y2: 20, kind: 'int', col: '#ede4d3', open: [{ at: 13.5, w: 1.1, type: 'door' }, { at: 17.5, w: 1.1, type: 'door' }] },
      { x1: 18, y1: 15.6, x2: 26, y2: 15.6, kind: 'int', col: '#ede4d3', open: [{ at: 19.6, w: 1.1, type: 'door' }, { at: 23.4, w: 1.1, type: 'door' }] }
    ]
  };

  function init(canvasId, onClickWorld) {
    const canvas = document.getElementById(canvasId);
    PH.init(canvas, MAP, onClickWorld);
    injectWallToggleButton();
  }

  function injectWallToggleButton() {
    const ctrl = document.querySelector('.hud-controls');
    if (ctrl && !document.getElementById('btn-walls')) {
      const btn = document.createElement('button');
      btn.id = 'btn-walls';
      btn.className = 'btn';
      btn.textContent = '🧱 Walls: Cutaway';
      btn.onclick = () => {
        PH.wallsUp = !PH.wallsUp;
        btn.textContent = PH.wallsUp ? '🧱 Walls: Full Height' : '🧱 Walls: Cutaway';
        btn.classList.toggle('active', PH.wallsUp);
      };
      ctrl.insertBefore(btn, ctrl.children[1]);
    }
  }

  function toIso(gx, gy, gz = 0) {
    return PH.P(gx, gy, gz);
  }

  function zoomCam(f) {
    PH.zoomAt(f, PH.S.vpW / 2, PH.S.vpH / 2);
  }

  function resetCam() {
    PH.fit();
  }

  function panToGrid(gx, gy, targetZoom = 1.25) {
    PH.panTo(gx, gy, targetZoom);
  }

  function triggerUpgradePulse(mode) {
    upgradePulse = 1.0;
    upgradeMode = mode;
    PH.setCondition(mode === 'tiered' ? 'fut' : 'cur');
  }

  function drawYogaMat(x, y, col) {
    PH.furniture(x, y, 1.35, 0.72, 0, k => {
      k.box(0.02, 0.02, 0.2, 1.3, 0.68, 0.8, col, { tex: 'fabric', texAlpha: 0.45 });
      k.cyl(0.18, 0.2, 1.0, 0.08, 1.6, '#ffffff');
      k.cyl(1.15, 0.55, 1.0, 0.05, 2.2, '#38bdf8');
    });
  }

  function drawAILifeguardArch(gx, gy) {
    PH.item(gx + gy + 0.8, () => {
      PH.box(gx, gy, 0, 0.22, 0.22, 26, '#0ea5e9');
      PH.box(gx, gy + 4.8, 0, 0.22, 0.22, 26, '#0ea5e9');
      PH.box(gx, gy, 25, 0.24, 5.0, 2.5, '#e0f2fe');
      const sp = PH.P(gx + 0.12, gy + 2.5, 27.5);
      const c = PH.S.ctx;
      c.fillStyle = (PH.t % 20 < 10) ? '#10b981' : '#38bdf8';
      c.beginPath();
      c.arc(sp.x, sp.y, 4.2 * PH.zoom, 0, Math.PI * 2);
      c.fill();
    });
  }

  function drawRapidMedicalCart(gx, gy) {
    PH.item(gx + gy + 0.9, () => {
      PH.box(gx, gy, 1.5, 1.15, 0.68, 9.5, '#f8fafc');
      PH.box(gx - 0.02, gy + 0.05, 5.5, 1.19, 0.58, 2.2, '#ef4444');
      PH.cyl(gx + 0.22, gy + 0.1, 0, 0.1, 2.0, '#111827');
      PH.cyl(gx + 0.92, gy + 0.1, 0, 0.1, 2.0, '#111827');
      const bp = PH.P(gx + 0.58, gy + 0.34, 15);
      PH.bubble(bp.x, bp.y, '<3m RAPID CART', 'ok');
    });
  }

  function render(simState) {
    const isTiered = simState.mode === 'tiered';
    const ev = simState.activeEvent;
    PH.setCondition(isTiered ? 'fut' : 'cur');
    PH.begin();

    // ------------------------ 1. EXTERIOR TREES, LAMPS & MOVING CARS
    PHSprites.tree(-1.4, 2.5, 1.1, 0);
    PHSprites.tree(-1.4, 16.0, 1.15, 1);
    PHSprites.tree(27.5, 2.5, 1.15, 1);
    PHSprites.tree(27.5, 10.5, 1.2, 0);
    PHSprites.tree(27.5, 18.0, 1.1, 1);
    PHSprites.streetLamp(1.9, 3.5);
    PHSprites.streetLamp(1.9, 16.5);
    PHSprites.parkedCar(27.2, 6.0, 3, '#0f172a');
    PHSprites.parkedCar(27.2, 14.2, 3, '#d97706');

    const shuttleY = ((PH.t * 0.055) % 19) + 0.5;
    const ambY = 19.5 - ((PH.t * 0.045) % 19);
    PHSprites.movingVehicle(-0.2, shuttleY, {
      type: 'vip',
      dir: 1,
      openDoor: false,
      label: 'VIP Retreat Shuttle'
    });
    PHSprites.movingVehicle(-0.2, ambY, {
      type: 'ambulance',
      dir: -1,
      openDoor: false,
      label: isTiered ? 'ALS Standby Unit' : 'Emergency Transfer'
    });

    // ------------------------ 2. ZONE 1: HYDROTHERAPY POOL (2..10, 1..9)
    // Animated water ripples inside pool basin
    PH.item(4.5 + 4.0, () => {
      const p1 = PH.P(4.5, 4.0, 0.4);
      const p2 = PH.P(6.5, 4.5, 0.4);
      const rad = (8 + (PH.t % 36) * 0.65) * PH.zoom;
      const c = PH.S.ctx;
      c.strokeStyle = 'rgba(224,242,254,0.65)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(p1.x, p1.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
      c.ellipse(p2.x, p2.y, rad * 1.1, rad * 0.55, 0, 0, Math.PI * 2);
      c.stroke();
    });
    PHSprites.planter(2.3, 1.3, 0.65, 0.65);
    PHSprites.planter(8.8, 1.3, 0.65, 0.65);
    if (isTiered) {
      drawAILifeguardArch(4.2, 2.0);
      drawAILifeguardArch(6.8, 2.0);
      const cartOffset = Math.sin(PH.t * 0.07) * 2.4;
      drawRapidMedicalCart(17.5 + cartOffset, 9.4);
    }

    // ------------------------ 3. ZONE 2: THERMAL SPA & PHYSIO WING (2..10, 11..20)
    PHSprites.spaTable(3.0, 12.2, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(6.0, 12.2, 0, { col: '#6ee7b7' });
    PHSprites.privacyCurtain(2.8, 14.8, 0, 5.2, '#a7f3d0');
    PHSprites.spaTable(3.0, 16.2, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(6.0, 16.2, 0, { col: '#6ee7b7' });
    if (isTiered) {
      PHSprites.kiosk(8.6, 12.2, 1, { col: '#10b981' });
    }

    // ------------------------ 4. ZONE 3: BIOMETRIC YOGA PAVILION (10..18, 1..9)
    for (let m = 0; m < 3; m++) {
      drawYogaMat(11.1 + m * 2.0, 2.4, '#ec4899');
      drawYogaMat(11.1 + m * 2.0, 5.1, '#8b5cf6');
    }
    PHSprites.planter(16.8, 7.5, 0.7, 0.7);
    if (isTiered) {
      PHSprites.kiosk(16.6, 2.0, 1, { col: '#0ea5e9' });
    }

    // ------------------------ 5. ZONE 4: NUTRITIONAL SMART-BISTRO (10..18, 11..20)
    PHSprites.diningTable(11.2, 12.4, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(14.2, 12.4, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(11.2, 15.4, 0, { cloth: '#fde68a' });
    PHSprites.diningTable(14.2, 15.4, 0, { cloth: '#fde68a' });
    PHSprites.receptionDesk(11.2, 18.0, 0, 3.6, { col: isTiered ? '#10b981' : '#f59e0b', wood: '#78350f', clutter: !isTiered });
    if (isTiered) {
      PHSprites.kiosk(15.6, 18.0, 0, { col: '#10b981' });
    }

    // ------------------------ 6. ZONE 5: 24/7 NURSE COMMAND & TELE-MD (18..26, 1..9)
    PHSprites.receptionDesk(18.6, 2.0, 0, 2.6, { col: isTiered ? '#10b981' : '#0ea5e9', clutter: !isTiered });
    PHSprites.officeDesk(22.4, 2.0, 0, { clutter: !isTiered, screenStyle: isTiered ? 'ok' : 'alert', seed: 61 });
    PHSprites.hospitalBed(22.4, 5.2, 0, { blanket: '#0ea5e9', alert: !isTiered, ready: isTiered, seed: 62 });

    // ------------------------ 7. ZONE 6: 4 LUXURY KING SUITES 301-309 (18..26, 11..20)
    PHSprites.luxuryBed(18.8, 12.2, 0, { duvet: '#f59e0b', smartHub: isTiered });
    PHSprites.luxuryBed(22.6, 12.2, 0, { duvet: '#10b981', smartHub: isTiered });
    PHSprites.luxuryBed(18.8, 16.4, 0, { duvet: '#0ea5e9', smartHub: isTiered });
    PHSprites.luxuryBed(22.6, 16.4, 0, { duvet: '#a855f7', smartHub: isTiered });

    // ------------------------ 8. RISK HALOS vs ENCRYPTED RBAC & TELEMETRY BEAMS
    const nursePos = { gx: 20.0, gy: 3.5 };
    const docPos = { gx: 23.2, gy: 3.2 };
    if (!isTiered) {
      PHSprites.floorHalo(ev.sourcePos.gx, ev.sourcePos.gy, 26, 13, '#ef4444', 'UNFILTERED BROADCAST · BLIND SPOT');
      PHSprites.floorHalo(ev.staffPos.gx, ev.staffPos.gy, 28, 14, '#ef4444', '14 PHI BREACHES ON TABLET');
      PHSprites.floorHalo(23.2, 3.2, 26, 13, '#f59e0b', '68% MD ALERT FATIGUE (50% SLA)');
      PHSprites.signalBeam(ev.sourcePos.gx, ev.sourcePos.gy, ev.staffPos.gx, ev.staffPos.gy, '#ef4444', 'RAW PHI LEAK (14x)');
      PHSprites.signalBeam(ev.sourcePos.gx, ev.sourcePos.gy, docPos.gx, docPos.gy, '#f59e0b', '68% NOISE FATIGUE');
    } else {
      PHSprites.signalBeam(ev.sourcePos.gx, ev.sourcePos.gy, nursePos.gx, nursePos.gy, '#0ea5e9', 'AI TELEMETRY');
      PHSprites.signalBeam(nursePos.gx, nursePos.gy, ev.staffPos.gx, ev.staffPos.gy, '#10b981', 'RBAC SHIELD (0 PHI)');
      if (ev.id !== 'EVT-04') {
        PHSprites.signalBeam(nursePos.gx, nursePos.gy, docPos.gx, docPos.gy, '#10b981', '<3m SLA CART DISPATCH');
      }
    }

    // ------------------------ 9. 24 ARTICULATED RESORT RESIDENTS & STAFF
    simState.agents.forEach(ag => {
      const isSel = ag.id === simState.selectedAgentId;
      let role = ag.role;
      if (ag.id === 'C-01') role = 'lifeguard';
      else if (ag.id === 'C-02') role = 'therapist';
      else if (ag.id === 'C-04') role = 'chef';

      const inBed = ag.pose === 'LYING_ON_BED';
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: inBed ? 9.5 : 0,
        pose: ag.pose,
        dir: 'SE',
        role,
        seed: ag.idNum || 1,
        axis: 'x',
        head: -1,
        blanket: inBed ? '#f59e0b' : null,
        label: ag.shortName || ag.name,
        sub: ag.actionLabel,
        forceLabel: ag.role === 'resident' || isSel || ag.glowingWrist,
        sel: isSel,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType,
        prop: ag.pose === 'HOLDING_TABLET_LEAK' ? 'tablet' : ag.pose === 'CARRYING_AID' ? 'bag' : undefined,
        propCol: ag.pose === 'HOLDING_TABLET_LEAK' ? '#ef4444' : '#10b981'
      });
    });

    PH.end();

    // Zone Architectural Signs
    PHSprites.roomSign(6.0, 1.2, isTiered ? '1. AI Lifeguard Hydro Pool' : '1. Basic Pool (Blind Spots)', isTiered ? '#06b6d4' : '#ef4444');
    PHSprites.roomSign(6.0, 11.2, isTiered ? '2. Thermal Spa & Physio Wing' : '2. Basic Spa (14 PHI Leaks)', isTiered ? '#10b981' : '#ef4444');
    PHSprites.roomSign(14.0, 1.2, isTiered ? '3. Biometric Yoga Pavilion' : '3. Yoga Studio (Motion Noise)', isTiered ? '#ec4899' : '#f59e0b');
    PHSprites.roomSign(14.0, 11.2, isTiered ? '4. Nutritional Smart-Bistro' : '4. Bistro (Raw Med Leaks)', isTiered ? '#10b981' : '#ef4444');
    PHSprites.roomSign(22.0, 1.2, isTiered ? '5. 24/7 Nurse Command & Tele-MD' : '5. Overwhelmed Single MD (68%)', isTiered ? '#0ea5e9' : '#ef4444');
    PHSprites.roomSign(22.0, 11.2, '6. Luxury King Suites 301–309', '#f59e0b');

    PH.overlay(simState.showActionLabels);

    if (upgradePulse > 0.01) {
      const c = PH.S.ctx;
      const center = PH.P(14, 11, 10);
      const maxR = Math.max(PH.S.vpW, PH.S.vpH) * 0.9;
      const curR = (1 - upgradePulse) * maxR;
      c.save();
      c.strokeStyle = upgradeMode === 'tiered' ? '#10b981' : '#ef4444';
      c.lineWidth = 6 * upgradePulse;
      c.globalAlpha = upgradePulse;
      c.beginPath();
      c.ellipse(center.x, center.y, curR, curR * 0.55, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
      upgradePulse *= 0.92;
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
