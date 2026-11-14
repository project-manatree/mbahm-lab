// ============================================================================
// BAHM330-A1: Expanded Two-Building Hospital-to-Retreat Step-Down Transfer
// 100% Identical Building Structure in Both Modes:
// - Left Building (x: 1..15, y: 1..16): Multi-Wing Partner Specialist Hospital
//   (Inpatient Ward A, Step-Down Ward B, Central Corridor, Discharge Pharmacy,
//   Billing & Clearance Hall, Departure Lobby, Main Entrance facing DOWN at y=16)
// - Wide Open Distance (x: 15..23): Horizontal Separation Between Buildings
// - Right Building (x: 23..37, y: 1..16): Multi-Wing Step-Down Retreat Centre
//   (VISITING MD CLINIC, Nurse Triage Station, HYDROTHERAPY POOL,
//   Central Promenade, Retreat Reception, RECOVERY SUITE 301 with light cream
//   travertine tiles, crisp white walls & glass dividers, white king recovery
//   bed with teal duvet & pillow, bedside vital-sign monitor, wooden wardrobe,
//   armchair, en-suite bathroom door, and THERAPEUTIC DINING)
// - Front Two-Lane Road (x: 1..37, y: 16..20.4): Concierge Transport Left <-> Right
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 38;
  const GRID_H = 21;

  const MAP = {
    proj: { ax: 40, ay: 2, bx: -10, by: 28 },
    bounds: { x0: 0.5, y0: 0.5, x1: 37.5, y1: 20.6 },
    view: { x0: 0.5, y0: 0.5, x1: 37.5, y1: 20.6 },
    ground: [
      // ---------------- BUILDING 1 (LEFT: PARTNER HOSPITAL, x: 1..15, y: 1..16)
      { x: 1, y: 1, w: 7, d: 5.5, mat: 'linoBlue' },             // Ward A (Acute Inpatient)
      { x: 8, y: 1, w: 7, d: 5.5, mat: 'linoMint' },             // Ward B (Step-Down Prep)
      { x: 1, y: 6.5, w: 14, d: 2.0, mat: 'terrazzo' },          // Hospital Central Corridor
      { x: 1, y: 8.5, w: 4.8, d: 7.5, mat: 'ceramic' },          // Discharge Pharmacy
      { x: 5.8, y: 8.5, w: 5.0, d: 7.5, mat: 'linoWhite' },      // Billing & Insurance Hall
      { x: 10.8, y: 8.5, w: 4.2, d: 7.5, mat: 'carpetTeal' },    // Departure & Main Entrance Lobby

      // ---------------- BUILDING 2 (RIGHT: RETREAT CENTRE, x: 23..37, y: 1..16)
      { x: 23, y: 1, w: 5.2, d: 5.5, mat: 'ceramicBlue' },       // VISITING MD CLINIC
      { x: 28.2, y: 1, w: 4.3, d: 5.5, mat: 'linoBlue' },        // 24/7 Nurse & Vitals Station
      { x: 32.5, y: 1, w: 4.5, d: 7.5, mat: 'ceramicCream' },    // HYDROTHERAPY POOL Deck
      { x: 33.0, y: 1.7, w: 3.5, d: 5.6, mat: 'water' },         // HYDROTHERAPY POOL Water
      { x: 23, y: 6.5, w: 9.5, d: 2.0, mat: 'marble' },          // Retreat Central Promenade
      { x: 23, y: 8.5, w: 4.8, d: 7.5, mat: 'marble' },          // Retreat Reception & Main Entrance
      { x: 27.8, y: 8.5, w: 4.7, d: 7.5, mat: 'travertine' },    // RECOVERY SUITE 301 & 302 (Bright Cream Travertine)
      { x: 31.3, y: 8.5, w: 1.2, d: 7.5, mat: 'ceramic' },       // En-Suite Bathroom Zone (Crisp White Ceramic)
      { x: 32.5, y: 8.5, w: 4.5, d: 7.5, mat: 'ceramicCream' },  // THERAPEUTIC DINING & Wellness Lounge

      // ---------------- FRONT WALKWAY & CONCIERGE TRANSPORT ROAD (y: 16..20.4)
      { x: 1, y: 16.0, w: 14, d: 0.6, mat: 'paver' },            // Hospital Front Entrance Apron
      { x: 23, y: 16.0, w: 14, d: 0.6, mat: 'paver' },           // Retreat Front Entrance Apron
      { x: 1, y: 16.6, w: 36, d: 3.8, mat: 'asphalt' }           // Horizontal Left<->Right Road
    ],
    decals: [
      // Hospital corridor wayfinding line
      { type: 'line', x1: 1.5, y1: 7.5, x2: 14.5, y2: 7.5, w: 0.10, col: '#0ea5e9' },
      // Retreat promenade wayfinding line
      { type: 'line', x1: 23.5, y1: 7.5, x2: 32.2, y2: 7.5, w: 0.10, col: '#10b981' },
      // Road center divider (Left <-> Right)
      { type: 'line', x1: 1.5, y1: 18.5, x2: 36.5, y2: 18.5, w: 0.09, col: 'rgba(250,204,21,0.75)', dash: [0.6, 0.4] },
      // Hospital Main Entrance Pick-Up Bay (Facing Down at x: 11.2..14.2, y: 16.7..18.2)
      { type: 'hatch', x: 11.2, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(14,165,233,0.65)' },
      // Retreat Main Entrance Drop-Off Bay (Facing Down at x: 23.8..26.8, y: 16.7..18.2)
      { type: 'hatch', x: 23.8, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(16,185,129,0.65)' },
      // Pool lane lines
      { type: 'line', x1: 34.2, y1: 1.9, x2: 34.2, y2: 7.1, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 35.4, y1: 1.9, x2: 35.4, y2: 7.1, w: 0.06, col: 'rgba(224,242,254,0.65)' }
    ],
    walls: [
      // BUILDING 1 (LEFT — PARTNER HOSPITAL, x: 1..15, y: 1..16)
      { x1: 1, y1: 1, x2: 15, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 16, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 15, y1: 1, x2: 15, y2: 16, kind: 'ext', col: '#e2e8f0', windows: true },
      // Building 1 Bottom Front Wall (y = 16) — MAIN ENTRANCE FACING DOWN at x = 11.6..14.0
      { x1: 1, y1: 16, x2: 15, y2: 16, kind: 'ext', col: '#e2e8f0', windows: true, open: [{ at: 11.6, w: 2.4, type: 'slide', alwaysOpen: true }] },
      // Building 1 Interior Walls
      { x1: 8, y1: 1, x2: 8, y2: 6.5, kind: 'int', col: '#cbd5e1', open: [{ at: 3.2, w: 1.3, type: 'door' }] },
      { x1: 1, y1: 6.5, x2: 15, y2: 6.5, kind: 'int', col: '#cbd5e1', open: [{ at: 4.0, w: 1.5, type: 'double' }, { at: 11.0, w: 1.5, type: 'double' }] },
      { x1: 1, y1: 8.5, x2: 15, y2: 8.5, kind: 'int', col: '#cbd5e1', open: [{ at: 2.8, w: 1.4, type: 'door' }, { at: 7.6, w: 1.5, type: 'slide' }, { at: 12.0, w: 1.6, type: 'slide' }] },
      { x1: 5.8, y1: 8.5, x2: 5.8, y2: 16, kind: 'int', col: '#cbd5e1', open: [{ at: 11.5, w: 1.4, type: 'door' }] },
      { x1: 10.8, y1: 8.5, x2: 10.8, y2: 16, kind: 'glass', col: '#cbd5e1', open: [{ at: 11.5, w: 1.5, type: 'slide' }] },

      // BUILDING 2 (RIGHT — RETREAT CENTRE, x: 23..37, y: 1..16) — Crisp White Walls & Glass Dividers
      { x1: 23, y1: 1, x2: 37, y2: 1, kind: 'ext', col: '#f8fafc', windows: true },
      { x1: 23, y1: 1, x2: 23, y2: 16, kind: 'ext', col: '#f8fafc', windows: true },
      { x1: 37, y1: 1, x2: 37, y2: 16, kind: 'ext', col: '#f8fafc', windows: true },
      // Building 2 Bottom Front Wall (y = 16) — MAIN ENTRANCE FACING DOWN at x = 24.2..26.6
      { x1: 23, y1: 16, x2: 37, y2: 16, kind: 'ext', col: '#f8fafc', windows: true, open: [{ at: 24.2, w: 2.4, type: 'slide', alwaysOpen: true }] },
      // Building 2 Interior Crisp White & Glass Dividers
      { x1: 28.2, y1: 1, x2: 28.2, y2: 6.5, kind: 'glass', open: [{ at: 3.2, w: 1.3, type: 'door' }] },
      { x1: 32.5, y1: 1, x2: 32.5, y2: 16, kind: 'glass', open: [{ at: 4.5, w: 1.4, type: 'slide' }, { at: 11.5, w: 1.5, type: 'slide' }] },
      { x1: 23, y1: 6.5, x2: 32.5, y2: 6.5, kind: 'glass', open: [{ at: 25.0, w: 1.5, type: 'door' }, { at: 29.8, w: 1.5, type: 'door' }] },
      { x1: 23, y1: 8.5, x2: 37, y2: 8.5, kind: 'glass', col: '#f8fafc', open: [{ at: 24.8, w: 1.6, type: 'slide' }, { at: 29.2, w: 1.4, type: 'door' }, { at: 34.2, w: 1.5, type: 'slide' }] },
      { x1: 27.8, y1: 8.5, x2: 27.8, y2: 16, kind: 'glass', col: '#f8fafc', open: [{ at: 10.2, w: 1.3, type: 'door' }, { at: 13.8, w: 1.3, type: 'door' }] },
      // Crisp White Suite Divider (Suite 301 vs Suite 302)
      { x1: 27.8, y1: 12.2, x2: 32.5, y2: 12.2, kind: 'int', col: '#f8fafc' },
      // En-Suite Bathroom Partition & En-Suite Bathroom Doors inside Recovery Suites
      { x1: 31.3, y1: 8.5, x2: 31.3, y2: 16, kind: 'int', col: '#f8fafc', open: [{ at: 10.6, w: 0.95, type: 'door', col: '#e2e8f0' }, { at: 14.4, w: 0.95, type: 'door', col: '#e2e8f0' }] }
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

  function render(simState) {
    PH.setCondition('fut');
    PH.begin();

    // ---------------- BUILDING 1 (LEFT, x: 1..15, y: 1..16): PARTNER HOSPITAL
    // 1. Ward A (x: 1..8, y: 1..6.5) — 4 Inpatient Beds + Curtains + Nurse Station
    const bedBlanket = '#0ea5e9';
    PHSprites.hospitalBed(1.4, 1.4, 0, { blanket: bedBlanket, ready: true, seed: 1 });
    PHSprites.privacyCurtain(1.4, 2.9, 0, 1.8, '#bae6fd');
    PHSprites.hospitalBed(1.4, 3.4, 0, { blanket: bedBlanket, ready: true, seed: 2 });
    PHSprites.hospitalBed(4.4, 1.4, 0, { blanket: bedBlanket, ready: true, seed: 3 });
    PHSprites.hospitalBed(4.4, 3.4, 0, { blanket: bedBlanket, ready: true, seed: 4 });
    PHSprites.waitingBench(2.2, 5.3, 0, 4, '#3b82f6');

    // 2. Ward B (x: 8..15, y: 1..6.5) — 4 Step-Down Beds + Nurse Desk
    PHSprites.hospitalBed(8.4, 1.4, 0, { blanket: '#38bdf8', ready: true, seed: 5 });
    PHSprites.hospitalBed(8.4, 3.4, 0, { blanket: '#38bdf8', ready: true, seed: 6 });
    PHSprites.hospitalBed(11.2, 1.4, 0, { blanket: '#38bdf8', ready: true, seed: 7 });
    PHSprites.receptionDesk(13.2, 1.6, 1, 2.4, { col: '#0284c7', clutter: false });
    PHSprites.waitingBench(9.2, 5.3, 0, 4, '#0284c7');

    // 3. Discharge Pharmacy (x: 1..5.8, y: 8.5..16)
    PHSprites.receptionDesk(1.4, 9.0, 0, 2.8, { col: '#10b981', clutter: false });
    PHSprites.pharmacyShelf(1.4, 11.4, 0, { stockout: false, rfid: true });
    PHSprites.pharmacyShelf(1.4, 13.0, 0, { stockout: false, rfid: true });
    PHSprites.waitingBench(1.5, 14.6, 0, 4, '#475569');

    // 4. Billing & Insurance Hall (x: 5.8..10.8, y: 8.5..16)
    PHSprites.receptionDesk(6.2, 9.0, 0, 3.2, { col: '#0284c7', clutter: false });
    PHSprites.waitingBench(6.3, 11.8, 0, 4, '#475569');
    PHSprites.waitingBench(6.3, 13.2, 0, 4, '#475569');
    PHSprites.waitingBench(6.3, 14.6, 0, 4, '#475569');

    // 5. Departure Lobby & Main Entrance (x: 10.8..15, y: 8.5..16)
    PHSprites.sofa(11.3, 9.2, 0, 2.0, '#0d9488');
    PHSprites.sofa(11.3, 11.2, 0, 2.0, '#0284c7');
    PHSprites.kiosk(13.8, 9.2, 1, { col: '#10b981' });
    PHSprites.kiosk(13.8, 10.6, 1, { col: '#0ea5e9' });
    PHSprites.vendingAndWater(13.6, 12.5, 0);

    // ---------------- BUILDING 2 (RIGHT, x: 23..37, y: 1..16): RETREAT CENTRE
    // 1. VISITING MD CLINIC (x: 23..28.2, y: 1..6.5)
    PHSprites.officeDesk(23.5, 1.4, 0, { clutter: false, screenStyle: 'ok', seed: 11 });
    PHSprites.examTable(23.5, 3.6, 0, { col: '#10b981' });
    PHSprites.privacyCurtain(23.5, 5.0, 0, 1.8, '#a7f3d0');
    PHSprites.examTable(25.8, 3.6, 0, { col: '#0ea5e9' });

    // 2. 24/7 Nurse Triage & Vitals Station (x: 28.2..32.5, y: 1..6.5)
    PHSprites.receptionDesk(28.6, 1.5, 0, 2.6, { col: '#0ea5e9', clutter: false });
    PHSprites.officeDesk(28.8, 3.8, 0, { clutter: false, screenStyle: 'ecg', seed: 12, visitorChair: false });
    PHSprites.kiosk(31.2, 3.8, 1, { col: '#10b981' });

    // 3. Retreat Reception & Main Entrance Lobby (x: 23..27.8, y: 8.5..16)
    PHSprites.receptionDesk(23.5, 9.0, 0, 2.8, { col: '#10b981', wood: '#d4a373', clutter: false });
    PHSprites.sofa(23.6, 11.6, 0, 2.2, '#0d9488');
    PHSprites.kiosk(26.5, 9.2, 1, { col: '#10b981' });

    // 4. RECOVERY SUITE 301 & 302 (x: 27.8..32.5, y: 8.5..16)
    // Bright cream/travertine tiles, white king recovery bed with teal duvet & pillow,
    // bedside vital-sign monitor, wooden wardrobe, armchair, and en-suite bathroom door
    PHSprites.luxuryBed(28.1, 8.9, 0, { duvet: '#0d9488', smartHub: true, seed: 101 });
    PHSprites.wardrobe(28.1, 11.3, 0);
    PHSprites.armchair(30.3, 10.8, 0, { col: '#0d9488' });

    PHSprites.luxuryBed(28.1, 12.7, 0, { duvet: '#0d9488', smartHub: true, seed: 102 });
    PHSprites.wardrobe(28.1, 15.1, 0);
    PHSprites.armchair(30.3, 14.6, 0, { col: '#0d9488' });

    // 5. THERAPEUTIC DINING & Spa (x: 32.5..37, y: 8.5..16)
    PHSprites.spaTable(33.0, 9.0, 0, { col: '#5eead4' });
    PHSprites.spaTable(35.0, 9.0, 0, { col: '#5eead4' });
    PHSprites.diningTable(33.0, 12.0, 0, { cloth: '#ffffff' });
    PHSprites.diningTable(35.0, 12.0, 0, { cloth: '#ffffff' });
    PHSprites.diningTable(33.0, 14.2, 0, { cloth: '#ffffff' });
    PHSprites.diningTable(35.0, 14.2, 0, { cloth: '#ffffff' });

    // ---------------- CONCIERGE TRANSPORT VEHICLE ON FRONT ROAD (y: 16.8..19.2)
    if (simState.transports) {
      simState.transports.forEach(tr => {
        if (!tr.active) return;
        PHSprites.conciergeTransportX(tr.gx, tr.gy, {
          type: 'vip',
          dirX: tr.dirX,
          openDoor: tr.openDoor,
          label: tr.label
        });
      });
    }

    // ---------------- PATIENTS, DOCTORS, NURSES, CONCIERGE & STAFF
    simState.agents.forEach(ag => {
      if (ag.inVehicle) return;
      const isSel = ag.id === simState.selectedAgentId;
      let role = ag.role;
      if (role === 'cleaner') role = 'janitor';
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: ag.pose === 'LYING_ON_BED' ? 9.5 : (ag.z || 0),
        pose: ag.pose,
        dir: ag.dir,
        role,
        seed: ag.idNum || 1,
        axis: 'x',
        head: -1,
        blanket: ag.pose === 'LYING_ON_BED' ? (ag.gx < 18 ? bedBlanket : '#0d9488') : null,
        label: ag.roleLabel,
        sub: '',
        forceLabel: true,
        sel: isSel,
        showBubble: !!ag.showBubble,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType === 'wait' ? 'fail' : ag.bubbleType,
        taskProg: ag.taskProg,
        prop: ag.pose === 'MOPPING' ? 'mop' : ag.pose === 'HANDOVER_INTERACTION' ? 'clipboard' : undefined
      });
    });

    PH.end();

    // Clear Overhead Room Labels
    PHSprites.roomSign(4.5, 1.1, 'HOSPITAL WARD A', '#0ea5e9');
    PHSprites.roomSign(11.5, 1.1, 'STEP-DOWN WARD B', '#10b981');
    PHSprites.roomSign(3.4, 8.7, 'DISCHARGE PHARMACY', '#10b981');
    PHSprites.roomSign(8.3, 8.7, 'BILLING & CLEARANCE', '#0ea5e9');
    PHSprites.roomSign(12.8, 15.8, 'HOSPITAL MAIN ENTRANCE ↓', '#0ea5e9');

    PHSprites.roomSign(25.6, 1.1, 'VISITING MD CLINIC', '#38bdf8');
    PHSprites.roomSign(30.3, 1.1, 'NURSE TRIAGE', '#0ea5e9');
    PHSprites.roomSign(34.8, 1.1, 'HYDROTHERAPY POOL', '#06b6d4');
    PHSprites.roomSign(25.4, 8.7, 'RETREAT RECEPTION', '#10b981');
    PHSprites.roomSign(30.1, 8.7, 'RECOVERY SUITE 301', '#0d9488');
    PHSprites.roomSign(34.8, 8.7, 'THERAPEUTIC DINING', '#10b981');
    PHSprites.roomSign(25.4, 15.8, 'RETREAT MAIN ENTRANCE ↓', '#10b981');

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
