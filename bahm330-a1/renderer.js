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
      // Current State: empty undeveloped lot (no step-down retreat exists yet)
      { x: 23, y: 1, w: 14, d: 15, mat: { cur: 'grass', fut: null } },
      // Target State: retreat village is built
      { x: 23, y: 1, w: 5.2, d: 5.5, mat: { cur: null, fut: 'ceramicBlue' } },       // VISITING MD CLINIC
      { x: 28.2, y: 1, w: 4.3, d: 5.5, mat: { cur: null, fut: 'linoBlue' } },        // Nurse Triage
      { x: 32.5, y: 1, w: 4.5, d: 7.5, mat: { cur: null, fut: 'ceramicCream' } },    // HYDROTHERAPY POOL Deck
      { x: 33.0, y: 1.7, w: 3.5, d: 5.6, mat: { cur: null, fut: 'water' } },         // HYDROTHERAPY POOL Water
      { x: 23, y: 6.5, w: 9.5, d: 2.0, mat: { cur: null, fut: 'marble' } },          // Retreat Promenade
      { x: 23, y: 8.5, w: 4.8, d: 7.5, mat: { cur: null, fut: 'marble' } },          // Retreat Reception
      { x: 27.8, y: 8.5, w: 4.7, d: 7.5, mat: { cur: null, fut: 'travertine' } },    // RECOVERY SUITE 301 & 302
      { x: 31.3, y: 8.5, w: 1.2, d: 7.5, mat: { cur: null, fut: 'ceramic' } },       // En-Suite Bathroom Zone
      { x: 32.5, y: 8.5, w: 4.5, d: 7.5, mat: { cur: null, fut: 'ceramicCream' } },  // THERAPEUTIC DINING

      // ---------------- FRONT WALKWAY & CONCIERGE TRANSPORT ROAD (y: 16..20.4)
      { x: 1, y: 16.0, w: 14, d: 0.6, mat: 'paver' },            // Hospital Front Entrance Apron
      { x: 23, y: 16.0, w: 14, d: 0.6, mat: { cur: 'grass', fut: 'paver' } }, // Retreat Front Entrance Apron
      { x: 1, y: 16.6, w: 36, d: 3.8, mat: 'asphalt' }           // Horizontal Left<->Right Road
    ],
    decals: [
      // Hospital corridor wayfinding line
      { type: 'line', x1: 1.5, y1: 7.5, x2: 14.5, y2: 7.5, w: 0.10, col: '#0ea5e9' },
      // Retreat promenade wayfinding line
      { type: 'line', x1: 23.5, y1: 7.5, x2: 32.2, y2: 7.5, w: 0.10, col: '#10b981', when: 'fut' },
      // Road center divider (Left <-> Right)
      { type: 'line', x1: 1.5, y1: 18.5, x2: 36.5, y2: 18.5, w: 0.09, col: 'rgba(250,204,21,0.75)', dash: [0.6, 0.4] },
      // Hospital Main Entrance Pick-Up Bay (Facing Down at x: 11.2..14.2, y: 16.7..18.2)
      { type: 'hatch', x: 11.2, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(14,165,233,0.65)' },
      // Retreat Main Entrance Drop-Off Bay (Facing Down at x: 23.8..26.8, y: 16.7..18.2)
      { type: 'hatch', x: 23.8, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(16,185,129,0.65)', when: 'fut' },
      // Pool lane lines
      { type: 'line', x1: 34.2, y1: 1.9, x2: 34.2, y2: 7.1, w: 0.06, col: 'rgba(224,242,254,0.65)', when: 'fut' },
      { type: 'line', x1: 35.4, y1: 1.9, x2: 35.4, y2: 7.1, w: 0.06, col: 'rgba(224,242,254,0.65)', when: 'fut' }
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
      { x1: 1, y1: 8.5, x2: 15, y2: 8.5, kind: 'int', col: '#cbd5e1', open: [{ at: 2.8, w: 1.4, type: 'door' }, { at: 8.5, w: 1.4, type: 'slide' }, { at: 12.3, w: 1.5, type: 'slide' }] },
      { x1: 5.8, y1: 8.5, x2: 5.8, y2: 16, kind: 'int', col: '#cbd5e1', open: [{ at: 11.5, w: 1.4, type: 'door' }] },
      { x1: 10.8, y1: 8.5, x2: 10.8, y2: 16, kind: 'glass', col: '#cbd5e1', open: [{ at: 11.5, w: 1.5, type: 'slide' }] },

      // BUILDING 2 (RIGHT — RETREAT CENTRE, x: 23..37, y: 1..16) — Crisp White Walls & Glass Dividers
      { when: 'fut', x1: 23, y1: 1, x2: 37, y2: 1, kind: 'ext', col: '#f8fafc', windows: true },
      { when: 'fut', x1: 23, y1: 1, x2: 23, y2: 16, kind: 'ext', col: '#f8fafc', windows: true },
      { when: 'fut', x1: 37, y1: 1, x2: 37, y2: 16, kind: 'ext', col: '#f8fafc', windows: true },
      // Building 2 Bottom Front Wall (y = 16) — MAIN ENTRANCE FACING DOWN at x = 24.2..26.6
      { when: 'fut', x1: 23, y1: 16, x2: 37, y2: 16, kind: 'ext', col: '#f8fafc', windows: true, open: [{ at: 24.2, w: 2.4, type: 'slide', alwaysOpen: true }] },
      // Building 2 Interior Crisp White & Glass Dividers
      { when: 'fut', x1: 28.2, y1: 1, x2: 28.2, y2: 6.5, kind: 'glass', open: [{ at: 3.2, w: 1.3, type: 'door' }] },
      { when: 'fut', x1: 32.5, y1: 1, x2: 32.5, y2: 16, kind: 'glass', open: [{ at: 4.5, w: 1.4, type: 'slide' }, { at: 11.5, w: 1.5, type: 'slide' }] },
      { when: 'fut', x1: 23, y1: 6.5, x2: 32.5, y2: 6.5, kind: 'glass', open: [{ at: 25.0, w: 1.5, type: 'door' }, { at: 29.8, w: 1.5, type: 'door' }] },
      { when: 'fut', x1: 23, y1: 8.5, x2: 37, y2: 8.5, kind: 'glass', col: '#f8fafc', open: [{ at: 25.3, w: 1.6, type: 'slide' }, { at: 29.8, w: 1.3, type: 'door' }, { at: 34.2, w: 1.5, type: 'slide' }] },
      { when: 'fut', x1: 27.8, y1: 8.5, x2: 27.8, y2: 16, kind: 'glass', col: '#f8fafc', open: [{ at: 10.2, w: 1.3, type: 'door' }, { at: 13.8, w: 1.3, type: 'door' }] },
      // Crisp White Suite Divider (Suite 301 vs Suite 302)
      { when: 'fut', x1: 27.8, y1: 12.2, x2: 32.5, y2: 12.2, kind: 'int', col: '#f8fafc' },
      // En-Suite Bathroom Partition & En-Suite Bathroom Doors inside Recovery Suites
      { when: 'fut', x1: 31.3, y1: 8.5, x2: 31.3, y2: 16, kind: 'int', col: '#f8fafc', open: [{ at: 10.6, w: 0.95, type: 'door', col: '#e2e8f0' }, { at: 14.4, w: 0.95, type: 'door', col: '#e2e8f0' }] }
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

  // Isometric White-and-Emerald Luxury Medical Concierge Van (Windshield, Medical Cross, Wheels, Open Rear Ramp)
  function drawLuxuryConciergeVan(gx, gy, opts = {}) {
    const dirX = opts.dirX || 1; // +1 Left->Right toward Retreat, -1 returning to Hospital
    const openDoor = !!opts.openDoor;
    const label = opts.label || 'Luxury Medical Concierge Van';
    const len = 2.55;
    const wid = 1.14;

    PH.item(gx + gy + 1.65, () => {
      const bounce = openDoor ? 0 : Math.sin(PH.t * 0.35) * 0.35;
      const c = PH.S.ctx;
      const z = PH.zoom;

      // Ground drop shadow
      const sp = PH.P(gx + len / 2, gy + wid / 2, 0);
      c.fillStyle = 'rgba(9,13,22,0.46)';
      c.beginPath();
      c.ellipse(sp.x, sp.y, 31 * z, 15 * z, 0.38, 0, Math.PI * 2);
      c.fill();

      // Headlight beam ahead of cab
      const frontX = dirX > 0 ? gx + len : gx;
      const beamX = dirX > 0 ? gx + len + 1.7 : gx - 1.7;
      const h0 = PH.P(frontX, gy + wid / 2, 3.2);
      const bT = PH.P(beamX, gy + 0.08, 0.2);
      const bB = PH.P(beamX, gy + wid - 0.08, 0.2);
      c.save();
      c.fillStyle = 'rgba(253, 224, 71, 0.22)';
      c.beginPath();
      c.moveTo(h0.x, h0.y);
      c.lineTo(bT.x, bT.y);
      c.lineTo(bB.x, bB.y);
      c.closePath();
      c.fill();
      c.restore();

      // Deployed rear hydraulic wheelchair ramp & twin open rear doors when loading/unloading
      const rearX = dirX > 0 ? gx : gx + len;
      if (openDoor) {
        const rampX0 = dirX > 0 ? gx - 0.85 : gx + len + 0.05;
        PH.topQuad(rampX0, gy + 0.16, 0.25, 0.85, 0.82, '#cbd5e1', { stroke: '#10b981' });
        PH.box(rampX0, gy + 0.12, 0.35, 0.85, 0.08, 1.4, '#10b981');
        PH.box(rampX0, gy + 0.94, 0.35, 0.85, 0.08, 1.4, '#10b981');
        // Swung-open twin rear doors
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy - 0.18, 2.8, 0.12, 0.44, 12.2, '#f8fafc');
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy + wid - 0.26, 2.8, 0.12, 0.44, 12.2, '#10b981');
        // Apron curb bridge up toward Main Entrance door
        PH.box(gx + 0.65, gy - 0.48, 0.35, 0.90, 0.48, 1.1, '#10b981');
      }

      // Main Luxury Van Lower Rocker Skirt
      PH.box(gx, gy, 2.0 + bounce, len, wid, 2.2, '#1e293b');
      // Crisp White High-Roof Cabin & Nose
      const cabinX = dirX > 0 ? gx : gx + 0.58;
      const cabX = dirX > 0 ? gx + len - 0.58 : gx;
      PH.box(cabinX, gy, 4.2 + bounce, len - 0.58, wid, 12.6, '#ffffff');
      PH.box(cabX, gy + 0.03, 4.2 + bounce, 0.58, wid - 0.06, 6.2, '#f8fafc');

      // Emerald Green Wraparound Livery Stripe & Roofline Trim
      PH.box(gx + 0.02, gy - 0.01, 6.0 + bounce, len - 0.04, wid + 0.02, 2.4, '#10b981');
      PH.box(cabinX + 0.04, gy - 0.01, 14.8 + bounce, len - 0.66, wid + 0.02, 1.8, '#059669');
      // Emerald Clinical Beacon Lightbar on roof
      PH.box(gx + 0.72, gy + 0.26, 16.8 + bounce, 1.05, 0.62, 2.0, '#10b981');
      PH.box(gx + 0.92, gy + 0.34, 17.6 + bounce, 0.65, 0.46, 1.0, '#6ee7b7');

      // Panoramic Smoked Side Cabin Windows
      PH.box(cabinX + 0.24, gy - 0.01, 9.8 + bounce, len - 1.05, wid + 0.02, 4.2, '#0284c7', { alpha: 0.68 });

      // Sloped 3D Front Windshield & Front Chrome Grille / Headlights
      const wBotX = dirX > 0 ? cabX + 0.14 : cabX + 0.44;
      const wTopX = dirX > 0 ? cabinX + len - 0.58 : cabinX;
      PH.poly([
        PH.P(wBotX, gy + 0.08, 10.3 + bounce),
        PH.P(wBotX, gy + wid - 0.08, 10.3 + bounce),
        PH.P(wTopX, gy + wid - 0.08, 15.8 + bounce),
        PH.P(wTopX, gy + 0.08, 15.8 + bounce)
      ], '#38bdf8', '#0284c7', 1.2);
      // White windshield glare highlight
      PH.poly([
        PH.P(wBotX, gy + 0.18, 10.8 + bounce),
        PH.P(wBotX, gy + 0.42, 10.8 + bounce),
        PH.P(wTopX, gy + 0.42, 15.2 + bounce),
        PH.P(wTopX, gy + 0.18, 15.2 + bounce)
      ], 'rgba(255,255,255,0.45)');

      // Headlights & Emerald Chrome Grille on front nose
      const noseX = dirX > 0 ? gx + len + 0.01 : gx - 0.01;
      for (const hy of [gy + 0.18, gy + wid - 0.22]) {
        const hp = PH.P(noseX, hy, 5.2 + bounce);
        c.fillStyle = '#fef08a';
        c.beginPath(); c.arc(hp.x, hp.y, 2.8 * z, 0, Math.PI * 2); c.fill();
      }

      // Medical Cross Emblem on near side panel (white circular/square medallion + crisp emerald/red cross)
      const mx = cabinX + (len - 0.58) * 0.52;
      const my = gy + wid + 0.03;
      const mz = 9.0 + bounce;
      PH.poly([
        PH.P(mx - 0.28, my, mz - 3.6),
        PH.P(mx + 0.28, my, mz - 3.6),
        PH.P(mx + 0.28, my, mz + 3.6),
        PH.P(mx - 0.28, my, mz + 3.6)
      ], '#ffffff', '#10b981', 1.2);
      // Cross vertical bar
      PH.poly([
        PH.P(mx - 0.07, my, mz - 2.6),
        PH.P(mx + 0.07, my, mz - 2.6),
        PH.P(mx + 0.07, my, mz + 2.6),
        PH.P(mx - 0.07, my, mz + 2.6)
      ], '#10b981');
      // Cross horizontal bar
      PH.poly([
        PH.P(mx - 0.21, my, mz - 0.9),
        PH.P(mx + 0.21, my, mz - 0.9),
        PH.P(mx + 0.21, my, mz + 0.9),
        PH.P(mx - 0.21, my, mz + 0.9)
      ], '#10b981');

      // Detailed Wheels on near axle side (gy + wid)
      for (const wx of [gx + 0.52, gx + len - 0.54]) {
        const wp = PH.P(wx, gy + wid, 2.5);
        c.fillStyle = '#090d16';
        c.beginPath(); c.arc(wp.x, wp.y, 5.5 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e2e8f0';
        c.beginPath(); c.arc(wp.x, wp.y, 2.8 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#10b981';
        c.beginPath(); c.arc(wp.x, wp.y, 1.2 * z, 0, Math.PI * 2); c.fill();
      }

      // Floating concierge status badge above van roof
      const tp = PH.P(gx + len / 2, gy + wid / 2, 26 + bounce);
      PH.bubble(tp.x, tp.y, label, 'ok');
    });
  }

  function render(simState) {
    const isFut = simState.mode === 'future';
    PH.setCondition(isFut ? 'fut' : 'cur');
    PH.begin();

    // ---------------- BUILDING 1 (LEFT, x: 1..15, y: 1..16): PARTNER HOSPITAL
    // 1. Ward A (x: 1..8, y: 1..6.5) — 4 Inpatient Beds + Curtains + Nurse Station
    const bedBlanket = isFut ? '#0ea5e9' : '#f59e0b';
    PHSprites.hospitalBed(1.4, 1.4, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 1 });
    PHSprites.privacyCurtain(1.4, 2.9, 0, 1.8, '#bae6fd');
    PHSprites.hospitalBed(1.4, 3.4, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 2 });
    PHSprites.hospitalBed(4.4, 1.4, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 3 });
    PHSprites.hospitalBed(4.4, 3.4, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 4 });
    PHSprites.waitingBench(2.2, 5.3, 0, 4, '#3b82f6');

    // 2. Ward B (x: 8..15, y: 1..6.5) — 3 Step-Down Beds + Nurse Desk
    PHSprites.hospitalBed(8.4, 1.4, 0, { blanket: '#38bdf8', alert: !isFut, ready: isFut, seed: 5 });
    PHSprites.hospitalBed(8.4, 3.4, 0, { blanket: '#38bdf8', ready: true, seed: 6 });
    PHSprites.hospitalBed(11.2, 1.4, 0, { blanket: '#38bdf8', ready: true, seed: 7 });
    PHSprites.receptionDesk(13.2, 1.6, 1, 2.4, { col: '#0284c7', clutter: !isFut });
    PHSprites.waitingBench(9.2, 5.3, 0, 4, '#0284c7');

    // 3. Discharge Pharmacy (x: 1..5.8, y: 8.5..16)
    PHSprites.receptionDesk(1.4, 9.0, 0, 2.8, { col: '#10b981', clutter: !isFut });
    PHSprites.pharmacyShelf(1.4, 11.4, 0, { stockout: false, rfid: isFut });
    PHSprites.pharmacyShelf(1.4, 13.0, 0, { stockout: false, rfid: isFut });
    PHSprites.waitingBench(1.5, 14.6, 0, 4, '#475569');

    // 4. Billing & Insurance Hall (x: 5.8..10.8, y: 8.5..16)
    PHSprites.receptionDesk(6.0, 9.0, 0, 2.4, { col: '#0284c7', clutter: !isFut });
    PHSprites.waitingBench(6.3, 11.8, 0, 4, '#475569');
    PHSprites.waitingBench(6.3, 13.2, 0, 4, '#475569');
    PHSprites.waitingBench(6.3, 14.6, 0, 4, '#475569');

    // 5. Departure Lobby & Main Entrance (x: 10.8..15, y: 8.5..16)
    PHSprites.sofa(11.0, 9.2, 0, 1.45, '#0d9488');
    PHSprites.sofa(11.0, 11.2, 0, 1.45, '#0284c7');
    PHSprites.kiosk(13.8, 9.2, 1, { col: '#10b981' });
    PHSprites.kiosk(13.8, 10.6, 1, { col: '#0ea5e9' });
    PHSprites.vendingAndWater(13.6, 12.5, 0);

    if (isFut) {
      // ---------------- BUILDING 2 (RIGHT, x: 23..37, y: 1..16): RETREAT CENTRE
      // 1. VISITING MD CLINIC (x: 23..28.2, y: 1..6.5)
      PHSprites.officeDesk(23.5, 1.4, 0, { clutter: false, screenStyle: 'ok', seed: 11 });
      PHSprites.examTable(23.5, 3.6, 0, { col: '#10b981' });
      PHSprites.privacyCurtain(23.5, 5.0, 0, 1.8, '#a7f3d0');
      PHSprites.examTable(26.2, 3.6, 0, { col: '#0ea5e9' });

      // 2. 24/7 Nurse Triage & Vitals Station (x: 28.2..32.5, y: 1..6.5)
      PHSprites.receptionDesk(28.6, 1.5, 0, 2.6, { col: '#0ea5e9', clutter: false });
      PHSprites.officeDesk(28.8, 3.8, 0, { clutter: false, screenStyle: 'ecg', seed: 12, visitorChair: false });
      PHSprites.kiosk(31.2, 3.8, 1, { col: '#10b981' });

      // 3. Retreat Reception & Main Entrance Lobby (x: 23..27.8, y: 8.5..16)
      PHSprites.receptionDesk(23.3, 9.0, 0, 2.0, { col: '#10b981', wood: '#d4a373', clutter: false });
      PHSprites.sofa(23.4, 11.6, 0, 2.0, '#0d9488');
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
    }

    // ---------------- CONCIERGE TRANSPORT VEHICLE ON FRONT ROAD (y: 16.8..19.2)
    if (simState.transports) {
      simState.transports.forEach(tr => {
        if (!tr.active) return;
        if (isFut) {
          drawLuxuryConciergeVan(tr.gx, tr.gy, {
            dirX: tr.dirX,
            openDoor: tr.openDoor,
            label: tr.label
          });
        } else {
          PHSprites.conciergeTransportX(tr.gx, tr.gy, {
            type: 'ambulance',
            dirX: tr.dirX,
            openDoor: tr.openDoor,
            label: tr.label
          });
        }
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
        bubbleOffsetY: ag.pose === 'LYING_ON_BED' ? 12 : 24,
        taskProg: ag.taskProg,
        prop: ag.pose === 'MOPPING' ? 'mop' : ag.pose === 'HANDOVER_INTERACTION' ? 'clipboard' : undefined
      });
    });

    PH.end();

    // Clear Overhead Room Labels (pinned along upper room boundaries)
    PHSprites.roomSign(4.5, 0.85, isFut ? 'ACUTE WARD A (74% OCC.)' : 'ACUTE WARD A (98% BED-BLOCK)', isFut ? '#0ea5e9' : '#ef4444');
    PHSprites.roomSign(11.5, 0.85, isFut ? 'STEP-DOWN WARD B ✓' : 'WARD B BLOCKED (275m)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(3.4, 8.35, 'DISCHARGE PHARMACY', '#10b981');
    PHSprites.roomSign(8.3, 8.35, isFut ? 'PARALLEL e-BILLING ✓' : 'MANUAL BILLING (55m)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(12.8, 15.8, 'HOSPITAL MAIN ENTRANCE ↓', '#0ea5e9');

    if (isFut) {
      PHSprites.roomSign(25.6, 0.85, 'VISITING MD CLINIC', '#38bdf8');
      PHSprites.roomSign(30.3, 0.85, 'NURSE TRIAGE', '#0ea5e9');
      PHSprites.roomSign(34.8, 0.85, 'HYDROTHERAPY POOL', '#06b6d4');
      PHSprites.roomSign(25.4, 8.35, 'RETREAT RECEPTION', '#10b981');
      PHSprites.roomSign(30.1, 8.35, 'RECOVERY SUITE 301', '#0d9488');
      PHSprites.roomSign(34.8, 8.35, 'THERAPEUTIC DINING', '#10b981');
      PHSprites.roomSign(25.4, 15.8, 'RETREAT MAIN ENTRANCE ↓', '#10b981');
    } else {
      PHSprites.roomSign(30.0, 8.35, 'UNDEVELOPED RETREAT PLOT · NO VAN', '#64748b');
    }

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
