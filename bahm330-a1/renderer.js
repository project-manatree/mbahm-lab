// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Renderer
// Building 1 (Left, x: 1..10): Partner Hospital
// Open Distance Gap (x: 10..20): Concierge Transport Road (Pick-Up Left -> Drop-Off Right & Return)
// Building 2 (Right, x: 20..32): Retreat Centre
// Zero random traffic/parked cars, zero exterior trees, short role labels, plain room titles
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 33;
  const GRID_H = 22;

  let upgradePulse = 0;
  let upgradeMode = 'future';

  // Two distinct buildings separated by a wide 10-tile transit distance (x: 10..20)
  const MAP = {
    bounds: { x0: 0.5, y0: 0.5, x1: 32.5, y1: 20.5 },
    view: { x0: 0.5, y0: 0.5, x1: 32.5, y1: 20.5 },
    ground: [
      // BUILDING 1 (Left: Partner Hospital, x: 1..10, y: 1..20)
      { x: 1, y: 1, w: 9, d: 8, mat: { cur: 'linoWorn', fut: 'linoBlue' } },       // Hospital Ward
      { x: 1, y: 9, w: 9, d: 2.2, mat: { cur: 'linoWorn', fut: 'terrazzo' } },     // Hospital Corridor
      { x: 1, y: 11, w: 5, d: 9, mat: { cur: 'linoGrey', fut: 'linoWhite' } },     // Billing Office
      { x: 6, y: 11, w: 4, d: 9, mat: { cur: 'linoWorn', fut: 'carpetTeal' } },    // Discharge Lounge

      // CONCIERGE TRANSPORT ROAD across the 10-tile distance between buildings (x: 10..20)
      { x: 10, y: 7.8, w: 10, d: 4.4, mat: 'asphalt' },
      { x: 10, y: 7.3, w: 10, d: 0.5, mat: 'paver' },
      { x: 10, y: 12.2, w: 10, d: 0.5, mat: 'paver' },

      // BUILDING 2 (Right: Luxury Retreat Centre, x: 20..32, y: 1..20)
      { x: 20, y: 9, w: 12, d: 2.2, mat: 'marble' },                               // Retreat Main Hallway
      { x: 20, y: 1, w: 6.5, d: 8, mat: { cur: 'linoGrey', fut: 'ceramicBlue' } }, // Doctor Check-Up Room
      { x: 26.5, y: 1, w: 5.5, d: 8, mat: 'ceramicCream' },                        // Hydro Pool Deck
      { x: 27.2, y: 2.0, w: 4.1, d: 5.8, mat: 'water' },                           // Hydro Pool Water
      { x: 20, y: 11, w: 6.5, d: 9, mat: 'oak' },                                  // Retreat Reception & Suites
      { x: 26.5, y: 11, w: 5.5, d: 9, mat: 'deck' }                                // Spa & Dining Bistro
    ],
    decals: [
      // Center divider line on the Concierge Transport Road (x: 10..20)
      { type: 'line', x1: 10.2, y1: 10.0, x2: 19.8, y2: 10.0, w: 0.10, col: 'rgba(250,204,21,0.75)', dash: [0.5, 0.35] },
      // Hospital Pick-Up Bay markings (Left, outside Hospital Exit x = 10)
      { type: 'box', x: 10.3, y: 8.1, w: 2.5, d: 1.6, col: 'rgba(14,165,233,0.75)', fill: 'rgba(14,165,233,0.12)', hatch: true },
      // Retreat Drop-Off Bay markings (Right, outside Retreat Entrance x = 20)
      { type: 'box', x: 17.2, y: 8.1, w: 2.5, d: 1.6, col: 'rgba(16,185,129,0.75)', fill: 'rgba(16,185,129,0.12)', hatch: true },
      // Pool lane lines
      { type: 'line', x1: 28.6, y1: 2.2, x2: 28.6, y2: 7.6, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 30.0, y1: 2.2, x2: 30.0, y2: 7.6, w: 0.06, col: 'rgba(224,242,254,0.65)' }
    ],
    wear: [
      { x: 1, y: 1, w: 9, d: 19 },
      { x: 20, y: 11, w: 6.5, d: 9 }
    ],
    walls: [
      // BUILDING 1 (LEFT — PARTNER HOSPITAL, x: 1..10)
      { x1: 1, y1: 1, x2: 10, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 20, x2: 10, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      // Building 1 Right Exterior Wall (x = 10) with Pick-Up Exit Door at y = 8.8..10.8
      { x1: 10, y1: 1, x2: 10, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true, open: [{ at: 8.8, w: 2.0, type: 'slide' }] },
      // Building 1 Interior Walls
      { x1: 1, y1: 9, x2: 10, y2: 9, kind: 'int', col: '#cbd5e1', open: [{ at: 4.8, w: 1.6, type: 'double' }] },
      { x1: 1, y1: 11, x2: 10, y2: 11, kind: 'int', col: '#cbd5e1', open: [{ at: 3.0, w: 1.4, type: 'door' }, { at: 7.2, w: 1.5, type: { cur: 'locked', fut: 'slide' } }] },
      { x1: 6, y1: 11, x2: 6, y2: 20, kind: 'glass', col: '#cbd5e1', open: [{ at: 14.5, w: 1.4, type: 'door' }] },

      // BUILDING 2 (RIGHT — RETREAT CENTRE, x: 20..32)
      { x1: 20, y1: 1, x2: 32, y2: 1, kind: 'ext', col: '#f5f0e6', windows: true },
      // Building 2 Left Exterior Wall (x = 20) with Drop-Off Entrance Door at y = 8.8..10.8
      { x1: 20, y1: 1, x2: 20, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true, open: [{ at: 8.8, w: 2.0, type: 'slide' }] },
      { x1: 20, y1: 20, x2: 32, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 32, y1: 1, x2: 32, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },
      // Building 2 Interior Walls
      { x1: 20, y1: 9, x2: 32, y2: 9, kind: 'glass', open: [{ at: 22.5, w: 1.5, type: 'door' }, { at: 28.5, w: 1.6, type: 'slide' }] },
      { x1: 26.5, y1: 1, x2: 26.5, y2: 9, kind: 'glass', open: [{ at: 4.5, w: 1.4, type: 'door' }] },
      { x1: 20, y1: 11, x2: 32, y2: 11, kind: 'int', col: '#ede4d3', open: [{ at: 22.0, w: 1.6, type: 'slide' }, { at: 28.5, w: 1.6, type: 'door' }] },
      { x1: 26.5, y1: 11, x2: 26.5, y2: 20, kind: 'int', col: '#ede4d3', open: [{ at: 15.0, w: 1.4, type: 'door' }] },
      { x1: 20, y1: 15.8, x2: 26.5, y2: 15.8, kind: 'int', col: '#ede4d3', open: [{ at: 22.5, w: 1.2, type: 'door' }] }
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
    PH.setCondition(mode === 'future' ? 'fut' : 'cur');
  }

  function render(simState) {
    const isFut = simState.mode === 'future';
    PH.setCondition(isFut ? 'fut' : 'cur');
    PH.begin();

    // ------------------------------- BUILDING 1 (LEFT, x: 1..10): PARTNER HOSPITAL
    // Top Room: Hospital Ward (1..10, 1..9)
    const bedBlanket = isFut ? '#0ea5e9' : '#64748b';
    PHSprites.hospitalBed(1.5, 1.6, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 1 });
    PHSprites.privacyCurtain(1.5, 3.2, 0, 2.0, '#bae6fd');
    PHSprites.hospitalBed(1.5, 3.8, 0, { blanket: bedBlanket, alert: false, ready: isFut, seed: 2 });
    PHSprites.privacyCurtain(1.5, 5.4, 0, 2.0, '#bae6fd');
    PHSprites.hospitalBed(1.5, 6.0, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 3 });
    PHSprites.hospitalBed(5.0, 1.6, 0, { blanket: bedBlanket, alert: false, ready: isFut, seed: 4 });
    PHSprites.receptionDesk(7.2, 1.8, 1, 2.6, { col: isFut ? '#10b981' : '#0284c7', clutter: !isFut });
    PHSprites.waitingBench(4.5, 7.6, 0, 4, '#3b82f6');

    // Bottom Room: Billing & Discharge (1..10, 11..20)
    PHSprites.receptionDesk(1.5, 11.8, 0, 3.4, { col: isFut ? '#10b981' : '#f59e0b', clutter: !isFut });
    PHSprites.pharmacyShelf(1.5, 15.2, 0, { stockout: !isFut, rfid: isFut });
    PHSprites.waitingBench(1.6, 17.6, 0, 5, '#475569');
    PHSprites.vendingAndWater(4.2, 18.2, 0);

    if (isFut) {
      PHSprites.sofa(6.6, 12.4, 0, 2.2, '#0d9488');
      PHSprites.sofa(6.6, 15.2, 0, 2.2, '#0284c7');
      PHSprites.kiosk(8.8, 12.2, 1, { col: '#10b981' });
      PHSprites.kiosk(8.8, 13.4, 1, { col: '#0ea5e9' });
    } else {
      PHSprites.waitingBench(6.5, 14.5, 0, 3, '#64748b');
    }

    // ------------------------------- CONCIERGE TRANSPORT VEHICLES (x: 10..20)
    if (simState.transports) {
      simState.transports.forEach(tr => {
        if (!tr.active) return;
        PHSprites.conciergeTransportX(tr.gx, tr.gy, {
          type: isFut ? 'vip' : 'shuttle',
          dirX: tr.dirX,
          openDoor: tr.openDoor,
          label: tr.label
        });
      });
    }

    // ------------------------------- BUILDING 2 (RIGHT, x: 20..32): RETREAT CENTRE
    // Top-Left Room: Doctor Check-Up Room (20..26.5, 1..9)
    PHSprites.officeDesk(21.0, 1.6, 0, { clutter: !isFut, screenStyle: isFut ? 'ok' : 'alert', seed: 11 });
    PHSprites.examTable(20.8, 4.5, 0, { col: isFut ? '#10b981' : '#0284c7' });
    PHSprites.privacyCurtain(20.8, 6.2, 0, 1.9, '#a7f3d0');
    PHSprites.officeDesk(23.8, 4.5, 0, { clutter: !isFut, screenStyle: 'ecg', seed: 12, visitorChair: false });

    // Bottom-Left Room: Retreat Reception & Suites (20..26.5, 11..20)
    PHSprites.receptionDesk(20.6, 11.5, 0, 2.8, { col: isFut ? '#10b981' : '#d97706', wood: '#78350f', clutter: !isFut });
    if (isFut) {
      PHSprites.kiosk(24.0, 11.5, 0, { col: '#10b981' });
    }
    PHSprites.luxuryBed(20.8, 13.5, 0, { duvet: isFut ? '#10b981' : '#d97706', smartHub: isFut });
    PHSprites.luxuryBed(20.8, 16.8, 0, { duvet: isFut ? '#0ea5e9' : '#b45309', smartHub: isFut });
    PHSprites.sofa(23.8, 17.2, 1, 1.8, '#b45309');

    // Right Wing: Hydro Pool, Spa & Dining (26.5..32, 1..20)
    PHSprites.spaTable(27.2, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(29.6, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.diningTable(27.4, 15.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(29.8, 15.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(28.6, 17.6, 0, { cloth: '#fde68a' });

    // ------------------------------- DOCTORS, NURSES, CONCIERGE, STAFF & PATIENTS
    simState.agents.forEach(ag => {
      if (ag.inVehicle) return; // Inside the moving Concierge Transport
      const isSel = ag.id === simState.selectedAgentId;
      let role = ag.role;
      if (role === 'cleaner') role = 'janitor';
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: ag.pose === 'LYING_ON_BED' ? 9.5 : 0,
        pose: ag.pose,
        dir: ag.dir,
        role,
        seed: ag.idNum || 1,
        axis: 'x',
        head: -1,
        blanket: ag.pose === 'LYING_ON_BED' ? (ag.gx < 15 ? bedBlanket : '#f59e0b') : null,
        label: ag.roleLabel,
        sub: '',
        forceLabel: true,
        sel: isSel,
        bubble: isSel ? ag.bubble : null,
        bubbleType: ag.bubbleType === 'wait' ? 'fail' : ag.bubbleType,
        prop: ag.pose === 'MOPPING' ? 'mop' : ag.pose === 'HANDOVER_INTERACTION' ? 'clipboard' : undefined
      });
    });

    PH.end();

    // Plain, Simple Room Signs (No cryptic S1..S6 codes)
    PHSprites.roomSign(5.5, 1.2, 'Hospital Ward', '#0ea5e9');
    PHSprites.roomSign(5.5, 11.2, isFut ? 'Fast-Track Discharge' : 'Billing & Discharge', isFut ? '#10b981' : '#f59e0b');
    PHSprites.roomSign(15.0, 7.6, 'Concierge Transport (Left ↔ Right)', '#a855f7');
    PHSprites.roomSign(23.2, 1.2, 'Doctor Check-Up Room', '#38bdf8');
    PHSprites.roomSign(23.2, 11.2, 'Retreat Reception & Suites', '#10b981');
    PHSprites.roomSign(29.2, 1.2, 'Hydro Pool & Dining', '#06b6d4');

    PH.overlay(simState.showActionLabels);

    if (upgradePulse > 0.01) {
      const c = PH.S.ctx;
      const center = PH.P(16, 11, 10);
      const maxR = Math.max(PH.S.vpW, PH.S.vpH) * 0.9;
      const curR = (1 - upgradePulse) * maxR;
      c.save();
      c.strokeStyle = upgradeMode === 'future' ? '#10b981' : '#ef4444';
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
