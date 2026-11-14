// ============================================================================
// BAHM331-IND: Expanded 8-Wing 24-Hour Geriatric Retreat & Clinical Campus (34x21)
// 100% Identical Building Structure in Both Modes:
// - Top Wing (y: 1..8.5):
//   1. Heated Hydrotherapy Lap Pool & Deck (x: 1..9)
//   2. Yoga & Mobility Conditioning Studio (x: 9..17)
//   3. 24/7 Central Nurse Command & Triage Station (x: 17..24.5)
//   4. Doctor Check-Up & Acute Observation Clinic (x: 24.5..33)
// - Central Resort Marble Promenade (y: 8.5..11)
// - Bottom Wing (y: 11..19):
//   5. Thermal Spa & Physiotherapy Recovery Wing (x: 1..10)
//   6. Nutritional Dining Bistro & Lounge (x: 10..19.5)
//   7. 6 Private Residential King Suites 301-306 (x: 19.5..33)
//   8. Main Retreat Entrance Facing DOWN (y = 19)
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 34;
  const GRID_H = 21;

  const MAP = {
    proj: { ax: 42, ay: 2, bx: -10, by: 28 },
    bounds: { x0: 0.5, y0: 0.5, x1: 33.5, y1: 20.2 },
    view: { x0: 0.5, y0: 0.5, x1: 33.5, y1: 20.2 },
    ground: [
      // Top Wing (y: 1..8.5)
      { x: 1, y: 1, w: 8, d: 7.5, mat: 'ceramicCream' },          // 1. Hydro Pool Deck
      { x: 2.0, y: 1.8, w: 5.8, d: 5.2, mat: 'water' },           // Hydro Pool Water
      { x: 9, y: 1, w: 8, d: 7.5, mat: 'oak' },                   // 2. Yoga & Mobility Studio
      { x: 17, y: 1, w: 7.5, d: 7.5, mat: 'linoBlue' },           // 3. 24/7 Nurse & Triage Station
      { x: 24.5, y: 1, w: 8.5, d: 7.5, mat: 'ceramicBlue' },      // 4. Doctor & Acute Observation Clinic

      // Central Resort Marble Promenade (y: 8.5..11)
      { x: 1, y: 8.5, w: 32, d: 2.5, mat: 'marble' },

      // Bottom Wing (y: 11..19)
      { x: 1, y: 11, w: 9, d: 8, mat: 'linoMint' },               // 5. Thermal Spa & Physio Wing
      { x: 10, y: 11, w: 9.5, d: 8, mat: 'deck' },                // 6. Nutritional Dining Bistro
      { x: 19.5, y: 11, w: 13.5, d: 8, mat: 'oak' },              // 7. 6 Private King Suites 301-306

      // Front Main Entrance Walkway Apron (y: 19..19.8)
      { x: 1, y: 19.0, w: 32, d: 0.8, mat: 'paver' }
    ],
    decals: [
      // Pool lane lines
      { type: 'line', x1: 3.9, y1: 2.0, x2: 3.9, y2: 6.8, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 5.8, y1: 2.0, x2: 5.8, y2: 6.8, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      // Promenade guide lines
      { type: 'line', x1: 1.5, y1: 9.7, x2: 32.5, y2: 9.7, w: 0.11, col: '#10b981' }
    ],
    walls: [
      // Outer Retreat Perimeter Walls
      { x1: 1, y1: 1, x2: 33, y2: 1, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 19, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 33, y1: 1, x2: 33, y2: 19, kind: 'ext', col: '#f5f0e6', windows: true },
      // Bottom Front Wall (y = 19) with Main Retreat Entrance Facing Straight DOWN at x = 13.5..16.2
      {
        x1: 1, y1: 19, x2: 33, y2: 19, kind: 'ext', col: '#f5f0e6', windows: true,
        open: [{ at: 13.5, w: 2.6, type: 'slide', alwaysOpen: true }]
      },

      // North Promenade Wall (y = 8.5) — All Doors Open & Identical in Both Modes
      {
        x1: 1, y1: 8.5, x2: 33, y2: 8.5, kind: 'glass',
        open: [
          { at: 4.2, w: 1.8, type: 'slide', alwaysOpen: true },
          { at: 12.2, w: 1.8, type: 'slide', alwaysOpen: true },
          { at: 19.8, w: 1.8, type: 'double' },
          { at: 27.8, w: 1.8, type: 'double' }
        ]
      },
      { x1: 9, y1: 1, x2: 9, y2: 8.5, kind: 'glass' },
      { x1: 17, y1: 1, x2: 17, y2: 8.5, kind: 'int', col: '#e2e8f0' },
      { x1: 24.5, y1: 1, x2: 24.5, y2: 8.5, kind: 'glass', open: [{ at: 4.2, w: 1.4, type: 'door' }] },

      // South Promenade Wall (y = 11) — All Doors Open & Identical in Both Modes
      {
        x1: 1, y1: 11, x2: 33, y2: 11, kind: 'int', col: '#ede4d3',
        open: [
          { at: 4.5, w: 1.8, type: 'slide', alwaysOpen: true },
          { at: 13.8, w: 2.0, type: 'slide', alwaysOpen: true },
          { at: 21.0, w: 1.3, type: 'door' },
          { at: 25.5, w: 1.3, type: 'door' },
          { at: 30.0, w: 1.3, type: 'door' }
        ]
      },
      { x1: 10, y1: 11, x2: 10, y2: 19, kind: 'int', col: '#ede4d3' },
      { x1: 19.5, y1: 11, x2: 19.5, y2: 19, kind: 'int', col: '#ede4d3' },
      // Interior partitions for the 6 Private King Suites (3 columns x 2 rows)
      { x1: 24.0, y1: 11, x2: 24.0, y2: 19, kind: 'int', col: '#ede4d3', open: [{ at: 13.0, w: 1.1, type: 'door' }, { at: 16.8, w: 1.1, type: 'door' }] },
      { x1: 28.5, y1: 11, x2: 28.5, y2: 19, kind: 'int', col: '#ede4d3', open: [{ at: 13.0, w: 1.1, type: 'door' }, { at: 16.8, w: 1.1, type: 'door' }] },
      { x1: 19.5, y1: 15.0, x2: 33, y2: 15.0, kind: 'int', col: '#ede4d3', open: [{ at: 21.2, w: 1.1, type: 'door' }, { at: 25.7, w: 1.1, type: 'door' }, { at: 30.2, w: 1.1, type: 'door' }] }
    ]
  };

  function init(canvasId, onClickWorld) {
    const canvas = document.getElementById(canvasId);
    PH.init(canvas, MAP, onClickWorld);
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

  function triggerUpgradePulse() {}

  function drawYogaMat(x, y, col) {
    PH.furniture(x, y, 1.35, 0.72, 0, k => {
      k.box(0.02, 0.02, 0.2, 1.3, 0.68, 0.8, col, { tex: 'fabric', texAlpha: 0.45 });
      k.cyl(0.18, 0.2, 1.0, 0.08, 1.6, '#ffffff');
      k.cyl(1.15, 0.55, 1.0, 0.05, 2.2, '#38bdf8');
    });
  }

  function render(simState) {
    PH.setCondition('fut');
    PH.begin();

    // ---------------- 1. HYDROTHERAPY POOL (x: 1..9, y: 1..8.5)
    PH.item(4.5 + 4.0, () => {
      const p1 = PH.P(3.8, 3.8, 0.4);
      const p2 = PH.P(5.8, 4.8, 0.4);
      const rad = (8 + (PH.t % 36) * 0.65) * PH.zoom;
      const c = PH.S.ctx;
      c.strokeStyle = 'rgba(224,242,254,0.65)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(p1.x, p1.y, rad * 1.4, rad * 0.7, 0, 0, Math.PI * 2);
      c.ellipse(p2.x, p2.y, rad * 1.1, rad * 0.55, 0, 0, Math.PI * 2);
      c.stroke();
    });

    // ---------------- 2. YOGA & MOBILITY STUDIO (x: 9..17, y: 1..8.5)
    for (let m = 0; m < 3; m++) {
      drawYogaMat(9.8 + m * 2.2, 2.0, '#ec4899');
      drawYogaMat(9.8 + m * 2.2, 4.2, '#8b5cf6');
    }
    PHSprites.kiosk(15.6, 1.8, 1, { col: '#0ea5e9' });

    // ---------------- 3. 24/7 CENTRAL NURSE & TRIAGE STATION (x: 17..24.5, y: 1..8.5)
    PHSprites.receptionDesk(17.6, 1.6, 0, 3.0, { col: '#0ea5e9', clutter: false });
    PHSprites.officeDesk(17.8, 4.4, 0, { clutter: false, screenStyle: 'ecg', seed: 61, visitorChair: false });
    PHSprites.officeDesk(20.6, 4.4, 0, { clutter: false, screenStyle: 'ok', seed: 62, visitorChair: false });
    PHSprites.pharmacyShelf(22.2, 1.6, 0, { stockout: false, rfid: true });

    // ---------------- 4. DOCTOR CHECK-UP & ACUTE OBSERVATION CLINIC (x: 24.5..33, y: 1..8.5)
    PHSprites.officeDesk(25.2, 1.5, 0, { clutter: false, screenStyle: 'ok', seed: 63 });
    PHSprites.officeDesk(28.4, 1.5, 0, { clutter: false, screenStyle: 'ecg', seed: 64 });
    PHSprites.hospitalBed(25.2, 4.2, 0, { blanket: '#0ea5e9', ready: true, seed: 65 });
    PHSprites.hospitalBed(28.0, 4.2, 0, { blanket: '#10b981', ready: true, seed: 66 });
    PHSprites.hospitalBed(30.6, 4.2, 0, { blanket: '#38bdf8', ready: true, seed: 67 });

    // ---------------- 5. THERMAL SPA & PHYSIOTHERAPY WING (x: 1..10, y: 11..19)
    PHSprites.spaTable(1.6, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(4.4, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(7.2, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.privacyCurtain(1.6, 14.2, 0, 6.8, '#a7f3d0');
    PHSprites.spaTable(1.6, 15.4, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(4.4, 15.4, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(7.2, 15.4, 0, { col: '#6ee7b7' });

    // ---------------- 6. NUTRITIONAL DINING BISTRO & LOUNGE (x: 10..19.5, y: 11..19)
    PHSprites.diningTable(10.8, 11.8, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(13.6, 11.8, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(16.4, 11.8, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(10.8, 14.6, 0, { cloth: '#fde68a' });
    PHSprites.diningTable(13.6, 14.6, 0, { cloth: '#fde68a' });
    PHSprites.diningTable(16.4, 14.6, 0, { cloth: '#fde68a' });
    PHSprites.receptionDesk(10.8, 17.0, 0, 3.2, { col: '#10b981', wood: '#78350f', clutter: false });

    // ---------------- 7. 6 PRIVATE RESIDENTIAL KING SUITES 301-306 (x: 19.5..33, y: 11..19)
    const suiteBeds = [
      [20.2, 11.6, '#f59e0b'], [24.7, 11.6, '#10b981'], [29.2, 11.6, '#0ea5e9'],
      [20.2, 15.6, '#a855f7'], [24.7, 15.6, '#ec4899'], [29.2, 15.6, '#10b981']
    ];
    suiteBeds.forEach(([bx, by, col]) => {
      PHSprites.luxuryBed(bx, by, 0, { duvet: col, smartHub: true });
    });

    // ---------------- 8. 48 ARTICULATED DOCTORS, NURSES, STAFF & PATIENTS
    simState.agents.forEach(ag => {
      const isSel = ag.id === simState.selectedAgentId;
      const inBed = ag.pose === 'LYING_ON_BED';
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: inBed ? 9.5 : 0,
        pose: ag.pose,
        dir: ag.dir || 'SE',
        role: ag.role,
        seed: ag.idNum || 1,
        axis: 'x',
        head: -1,
        blanket: inBed ? '#f59e0b' : null,
        label: ag.roleLabel || '',
        sub: '',
        forceLabel: true,
        sel: isSel,
        showBubble: !!ag.showBubble,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType,
        taskProg: ag.taskProg
      });
    });

    PH.end();

    // Plain Room Signs
    PHSprites.roomSign(5.0, 1.1, 'Hydro Pool', '#06b6d4');
    PHSprites.roomSign(13.0, 1.1, 'Yoga & Mobility Studio', '#ec4899');
    PHSprites.roomSign(20.8, 1.1, '24/7 Nurse Station', '#0ea5e9');
    PHSprites.roomSign(28.8, 1.1, 'Doctor & Acute Clinic', '#38bdf8');
    PHSprites.roomSign(5.5, 11.2, 'Thermal Spa & Physio', '#10b981');
    PHSprites.roomSign(14.8, 11.2, 'Dining Bistro', '#10b981');
    PHSprites.roomSign(26.2, 11.2, 'Retreat Suites 301–306', '#f59e0b');
    PHSprites.roomSign(14.8, 18.8, 'Main Retreat Entrance ↓', '#10b981');

    PH.overlay(simState.showActionLabels);
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
