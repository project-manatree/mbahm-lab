// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Renderer
// Building 1 (Left): Partner Hospital | Walkway Gap | Building 2 (Right): Retreat Centre
// Concierge picks up Patient from Left Building -> Escorts to Right Building -> Returns
// Zero cars, zero exterior trees, simple short role labels, plain room titles
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 28;
  const GRID_H = 22;

  let upgradePulse = 0;
  let upgradeMode = 'future';

  // Two distinct buildings separated by a clean transfer walkway (x: 10..15)
  const MAP = {
    bounds: { x0: 0.5, y0: 0.5, x1: 27.5, y1: 20.5 },
    view: { x0: 0.5, y0: 0.5, x1: 27.5, y1: 20.5 },
    ground: [
      // Building 1 (Left: Partner Hospital, x: 1..10, y: 1..20)
      { x: 1, y: 1, w: 9, d: 8, mat: { cur: 'linoWorn', fut: 'linoBlue' } },       // Hospital Ward
      { x: 1, y: 9, w: 9, d: 2.2, mat: { cur: 'linoWorn', fut: 'terrazzo' } },     // Hospital Corridor
      { x: 1, y: 11, w: 5, d: 9, mat: { cur: 'linoGrey', fut: 'linoWhite' } },     // Billing Office
      { x: 6, y: 11, w: 4, d: 9, mat: { cur: 'linoWorn', fut: 'carpetTeal' } },    // Discharge Lounge

      // Connecting Transfer Walkway between Building 1 (x=10) and Building 2 (x=15)
      { x: 10, y: 8.2, w: 5, d: 3.8, mat: 'paver' },

      // Building 2 (Right: Luxury Retreat Centre, x: 15..27, y: 1..20)
      { x: 15, y: 9, w: 12, d: 2.2, mat: 'marble' },                               // Retreat Main Hallway
      { x: 15, y: 1, w: 6.5, d: 8, mat: { cur: 'linoGrey', fut: 'ceramicBlue' } }, // Doctor Check-Up Room
      { x: 21.5, y: 1, w: 5.5, d: 8, mat: 'ceramicCream' },                        // Hydro Pool Deck
      { x: 22.2, y: 2.0, w: 4.1, d: 5.8, mat: 'water' },                           // Hydro Pool Water
      { x: 15, y: 11, w: 6.5, d: 9, mat: 'oak' },                                  // Retreat Reception & Suites
      { x: 21.5, y: 11, w: 5.5, d: 9, mat: 'deck' }                                // Spa & Dining Bistro
    ],
    decals: [
      // Transfer Walkway directional path between Building 1 & Building 2
      { type: 'line', x1: 10.2, y1: 9.6, x2: 14.8, y2: 9.6, w: 0.12, col: '#0ea5e9', dash: [0.4, 0.3] },
      { type: 'line', x1: 10.2, y1: 10.6, x2: 14.8, y2: 10.6, w: 0.12, col: '#10b981', dash: [0.4, 0.3] },
      // Pool lane lines
      { type: 'line', x1: 23.6, y1: 2.2, x2: 23.6, y2: 7.6, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 25.0, y1: 2.2, x2: 25.0, y2: 7.6, w: 0.06, col: 'rgba(224,242,254,0.65)' }
    ],
    wear: [
      { x: 1, y: 1, w: 9, d: 19 },
      { x: 15, y: 11, w: 6.5, d: 9 }
    ],
    walls: [
      // BUILDING 1 (LEFT — PARTNER HOSPITAL, x: 1..10)
      { x1: 1, y1: 1, x2: 10, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 20, x2: 10, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      // Building 1 Right Exterior Wall (x = 10) with Exit Door at y = 9.2..11.0
      { x1: 10, y1: 1, x2: 10, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true, open: [{ at: 9.2, w: 1.8, type: 'slide' }] },
      // Building 1 Interior Walls
      { x1: 1, y1: 9, x2: 10, y2: 9, kind: 'int', col: '#cbd5e1', open: [{ at: 4.8, w: 1.6, type: 'double' }] },
      { x1: 1, y1: 11, x2: 10, y2: 11, kind: 'int', col: '#cbd5e1', open: [{ at: 3.0, w: 1.4, type: 'door' }, { at: 7.2, w: 1.5, type: { cur: 'locked', fut: 'slide' } }] },
      { x1: 6, y1: 11, x2: 6, y2: 20, kind: 'glass', col: '#cbd5e1', open: [{ at: 14.5, w: 1.4, type: 'door' }] },

      // Low glass railing along the connecting walkway bridge (x: 10..15)
      { x1: 10, y1: 8.2, x2: 15, y2: 8.2, kind: 'half', col: '#94a3b8' },
      { x1: 10, y1: 12.0, x2: 15, y2: 12.0, kind: 'half', col: '#94a3b8' },

      // BUILDING 2 (RIGHT — RETREAT CENTRE, x: 15..27)
      { x1: 15, y1: 1, x2: 27, y2: 1, kind: 'ext', col: '#f5f0e6', windows: true },
      // Building 2 Left Exterior Wall (x = 15) with Entrance Door at y = 9.2..11.0
      { x1: 15, y1: 1, x2: 15, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true, open: [{ at: 9.2, w: 1.8, type: 'slide' }] },
      { x1: 15, y1: 20, x2: 27, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 27, y1: 1, x2: 27, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },
      // Building 2 Interior Walls
      { x1: 15, y1: 9, x2: 27, y2: 9, kind: 'glass', open: [{ at: 17.5, w: 1.5, type: 'door' }, { at: 23.5, w: 1.6, type: 'slide' }] },
      { x1: 21.5, y1: 1, x2: 21.5, y2: 9, kind: 'glass', open: [{ at: 4.5, w: 1.4, type: 'door' }] },
      { x1: 15, y1: 11, x2: 27, y2: 11, kind: 'int', col: '#ede4d3', open: [{ at: 17.0, w: 1.6, type: 'slide' }, { at: 23.5, w: 1.6, type: 'door' }] },
      { x1: 21.5, y1: 11, x2: 21.5, y2: 20, kind: 'int', col: '#ede4d3', open: [{ at: 15.0, w: 1.4, type: 'door' }] },
      { x1: 15, y1: 15.8, x2: 21.5, y2: 15.8, kind: 'int', col: '#ede4d3', open: [{ at: 17.5, w: 1.2, type: 'door' }] }
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

    // ------------------------------- BUILDING 1 (LEFT): PARTNER HOSPITAL
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

    // ------------------------------- BUILDING 2 (RIGHT): RETREAT CENTRE
    // Top-Left Room: Doctor Check-Up Room (15..21.5, 1..9)
    PHSprites.officeDesk(16.0, 1.6, 0, { clutter: !isFut, screenStyle: isFut ? 'ok' : 'alert', seed: 11 });
    PHSprites.examTable(15.8, 4.5, 0, { col: isFut ? '#10b981' : '#0284c7' });
    PHSprites.privacyCurtain(15.8, 6.2, 0, 1.9, '#a7f3d0');
    PHSprites.officeDesk(18.8, 4.5, 0, { clutter: !isFut, screenStyle: 'ecg', seed: 12, visitorChair: false });

    // Bottom-Left Room: Retreat Reception & Suites (15..21.5, 11..20)
    PHSprites.receptionDesk(15.6, 11.5, 0, 2.8, { col: isFut ? '#10b981' : '#d97706', wood: '#78350f', clutter: !isFut });
    if (isFut) {
      PHSprites.kiosk(19.0, 11.5, 0, { col: '#10b981' });
    }
    PHSprites.luxuryBed(15.8, 13.5, 0, { duvet: isFut ? '#10b981' : '#d97706', smartHub: isFut });
    PHSprites.luxuryBed(15.8, 16.8, 0, { duvet: isFut ? '#0ea5e9' : '#b45309', smartHub: isFut });
    PHSprites.sofa(18.8, 17.2, 1, 1.8, '#b45309');

    // Right Wing: Hydro Pool, Spa & Dining (21.5..27, 1..20)
    PHSprites.spaTable(22.2, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(24.6, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.diningTable(22.4, 15.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(24.8, 15.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(23.6, 17.6, 0, { cloth: '#fde68a' });

    // ------------------------------- DOCTORS, NURSES, CONCIERGE, STAFF & PATIENTS
    simState.agents.forEach(ag => {
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
        blanket: ag.pose === 'LYING_ON_BED' ? (ag.gx < 12 ? bedBlanket : '#f59e0b') : null,
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

    // Plain, Simple Room Signs (No S1..S6 jargon)
    PHSprites.roomSign(5.5, 1.2, 'Hospital Ward', '#0ea5e9');
    PHSprites.roomSign(5.5, 11.2, isFut ? 'Fast-Track Discharge' : 'Billing & Discharge', isFut ? '#10b981' : '#f59e0b');
    PHSprites.roomSign(12.5, 8.4, 'Concierge Transfer Walkway', '#a855f7');
    PHSprites.roomSign(18.2, 1.2, 'Doctor Check-Up Room', '#38bdf8');
    PHSprites.roomSign(18.2, 11.2, 'Retreat Reception & Suites', '#10b981');
    PHSprites.roomSign(24.2, 1.2, 'Hydro Pool & Dining', '#06b6d4');

    PH.overlay(simState.showActionLabels);

    if (upgradePulse > 0.01) {
      const c = PH.S.ctx;
      const center = PH.P(14, 11, 10);
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
