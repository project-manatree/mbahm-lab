// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Renderer
// Horizontal Left-to-Right 2.5D Layout:
// - Left Building (x: 1..11, y: 1..14): Partner Hospital (Main Entrance facing DOWN at y=14)
// - Wide Open Distance (x: 11..19): Horizontal Separation Between Buildings
// - Right Building (x: 19..31, y: 1..14): Retreat Centre (Main Entrance facing DOWN at y=14)
// - Front Road (x: 1..31, y: 14..18.2): Concierge Transport picks up at Left Entrance ->
//   drives Left-to-Right -> drops off at Right Entrance -> returns Right-to-Left
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 32;
  const GRID_H = 19;

  let upgradePulse = 0;
  let upgradeMode = 'future';

  const MAP = {
    // Horizontal 2.5D cabinet-isometric projection: +gx goes Left->Right, +gy goes Top->Down
    proj: { ax: 44, ay: 2, bx: -11, by: 30 },
    bounds: { x0: 0.5, y0: 0.5, x1: 31.5, y1: 18.6 },
    view: { x0: 0.5, y0: 0.5, x1: 31.5, y1: 18.6 },
    ground: [
      // BUILDING 1 (LEFT: PARTNER HOSPITAL, x: 1..11, y: 1..14)
      { x: 1, y: 1, w: 10, d: 6.5, mat: { cur: 'linoWorn', fut: 'linoBlue' } },       // Hospital Ward
      { x: 1, y: 7.5, w: 5.5, d: 6.5, mat: { cur: 'linoGrey', fut: 'linoWhite' } },   // Billing & Discharge
      { x: 6.5, y: 7.5, w: 4.5, d: 6.5, mat: { cur: 'linoWorn', fut: 'carpetTeal' } },// Main Entrance Lobby

      // BUILDING 2 (RIGHT: RETREAT CENTRE, x: 19..31, y: 1..14)
      { x: 19, y: 1, w: 6.5, d: 6.5, mat: { cur: 'linoGrey', fut: 'ceramicBlue' } },  // Doctor Check-Up Room
      { x: 19, y: 7.5, w: 6.5, d: 6.5, mat: 'oak' },                                  // Retreat Reception & Suites
      { x: 25.5, y: 1, w: 5.5, d: 6.5, mat: 'ceramicCream' },                         // Hydro Pool Deck
      { x: 26.2, y: 1.8, w: 4.1, d: 4.8, mat: 'water' },                              // Hydro Pool Water
      { x: 25.5, y: 7.5, w: 5.5, d: 6.5, mat: 'deck' },                               // Spa & Dining Bistro

      // FRONT WALKWAY & HORIZONTAL CONCIERGE TRANSPORT ROAD (y: 14..18.2, Left <-> Right)
      { x: 1, y: 14.0, w: 10, d: 0.6, mat: 'paver' },                                 // Hospital Front Entrance Apron
      { x: 19, y: 14.0, w: 12, d: 0.6, mat: 'paver' },                                // Retreat Front Entrance Apron
      { x: 1, y: 14.6, w: 30, d: 3.6, mat: 'asphalt' }                                // Horizontal Left<->Right Road
    ],
    decals: [
      // Center dashed road divider (Left <-> Right)
      { type: 'line', x1: 1.5, y1: 16.4, x2: 30.5, y2: 16.4, w: 0.09, col: 'rgba(250,204,21,0.75)', dash: [0.6, 0.4] },
      // Hospital Main Entrance Pick-Up Bay (Facing Down at x: 4.8..7.6, y: 14.7..16.1)
      { type: 'hatch', x: 4.8, y: 14.7, w: 2.8, d: 1.4, col: 'rgba(14,165,233,0.65)' },
      // Retreat Main Entrance Drop-Off Bay (Facing Down at x: 20.8..23.6, y: 14.7..16.1)
      { type: 'hatch', x: 20.8, y: 14.7, w: 2.8, d: 1.4, col: 'rgba(16,185,129,0.65)' },
      // Pool lane lines
      { type: 'line', x1: 27.6, y1: 2.0, x2: 27.6, y2: 6.4, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 29.0, y1: 2.0, x2: 29.0, y2: 6.4, w: 0.06, col: 'rgba(224,242,254,0.65)' }
    ],
    wear: [
      { x: 1, y: 1, w: 10, d: 13 },
      { x: 19, y: 7.5, w: 6.5, d: 6.5 }
    ],
    walls: [
      // BUILDING 1 (LEFT — PARTNER HOSPITAL, x: 1..11, y: 1..14)
      { x1: 1, y1: 1, x2: 11, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 14, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 11, y1: 1, x2: 11, y2: 14, kind: 'ext', col: '#e2e8f0', windows: true },
      // Building 1 Bottom Front Wall (y = 14) — MAIN ENTRANCE FACING DOWN at x = 5.2..7.4
      { x1: 1, y1: 14, x2: 11, y2: 14, kind: 'ext', col: '#e2e8f0', windows: true, open: [{ at: 5.2, w: 2.2, type: 'slide', alwaysOpen: true }] },
      // Building 1 Interior Walls
      { x1: 1, y1: 7.5, x2: 11, y2: 7.5, kind: 'int', col: '#cbd5e1', open: [{ at: 3.2, w: 1.5, type: 'door' }, { at: 7.8, w: 1.6, type: 'double' }] },
      { x1: 6.5, y1: 7.5, x2: 6.5, y2: 14, kind: 'glass', col: '#cbd5e1', open: [{ at: 10.2, w: 1.5, type: 'door' }] },

      // BUILDING 2 (RIGHT — RETREAT CENTRE, x: 19..31, y: 1..14)
      { x1: 19, y1: 1, x2: 31, y2: 1, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 19, y1: 1, x2: 19, y2: 14, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 31, y1: 1, x2: 31, y2: 14, kind: 'ext', col: '#f5f0e6', windows: true },
      // Building 2 Bottom Front Wall (y = 14) — MAIN ENTRANCE FACING DOWN at x = 21.1..23.3
      { x1: 19, y1: 14, x2: 31, y2: 14, kind: 'ext', col: '#f5f0e6', windows: true, open: [{ at: 21.1, w: 2.2, type: 'slide', alwaysOpen: true }] },
      // Building 2 Interior Walls
      { x1: 19, y1: 7.5, x2: 31, y2: 7.5, kind: 'glass', open: [{ at: 21.5, w: 1.5, type: 'door' }, { at: 27.5, w: 1.6, type: 'slide' }] },
      { x1: 25.5, y1: 1, x2: 25.5, y2: 14, kind: 'int', col: '#ede4d3', open: [{ at: 4.0, w: 1.4, type: 'door' }, { at: 10.5, w: 1.5, type: 'door' }] }
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

  function triggerUpgradePulse(mode) {
    upgradePulse = 1.0;
    upgradeMode = mode;
    PH.setCondition(mode === 'future' ? 'fut' : 'cur');
  }

  function render(simState) {
    const isFut = simState.mode === 'future';
    PH.setCondition(isFut ? 'fut' : 'cur');
    PH.begin();

    // ------------------------------- BUILDING 1 (LEFT, x: 1..11, y: 1..14): PARTNER HOSPITAL
    // Top Room: Hospital Ward (1..11, 1..7.5)
    const bedBlanket = isFut ? '#0ea5e9' : '#64748b';
    PHSprites.hospitalBed(1.5, 1.5, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 1 });
    PHSprites.privacyCurtain(1.5, 3.1, 0, 1.9, '#bae6fd');
    PHSprites.hospitalBed(1.5, 3.6, 0, { blanket: bedBlanket, alert: false, ready: isFut, seed: 2 });
    PHSprites.hospitalBed(4.8, 1.5, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 3 });
    PHSprites.hospitalBed(4.8, 3.6, 0, { blanket: bedBlanket, alert: false, ready: isFut, seed: 4 });
    PHSprites.receptionDesk(8.0, 1.8, 1, 2.4, { col: isFut ? '#10b981' : '#0284c7', clutter: !isFut });
    PHSprites.waitingBench(4.5, 6.1, 0, 4, '#3b82f6');

    // Bottom Room: Billing & Main Entrance Lobby (1..11, 7.5..14)
    PHSprites.receptionDesk(1.5, 8.2, 0, 3.0, { col: isFut ? '#10b981' : '#f59e0b', clutter: !isFut });
    PHSprites.waitingBench(1.6, 11.4, 0, 4, '#475569');
    PHSprites.waitingBench(1.6, 12.8, 0, 4, '#475569');

    if (isFut) {
      PHSprites.sofa(7.2, 8.5, 0, 2.0, '#0d9488');
      PHSprites.kiosk(9.5, 8.5, 1, { col: '#10b981' });
      PHSprites.kiosk(9.5, 10.0, 1, { col: '#0ea5e9' });
    } else {
      PHSprites.waitingBench(7.2, 9.5, 0, 3, '#64748b');
    }

    // ------------------------------- BUILDING 2 (RIGHT, x: 19..31, y: 1..14): RETREAT CENTRE
    // Top-Left Room: Doctor Check-Up Room (19..25.5, 1..7.5)
    PHSprites.officeDesk(19.8, 1.5, 0, { clutter: !isFut, screenStyle: isFut ? 'ok' : 'alert', seed: 11 });
    PHSprites.examTable(19.8, 4.2, 0, { col: isFut ? '#10b981' : '#0284c7' });
    PHSprites.privacyCurtain(19.8, 5.8, 0, 1.8, '#a7f3d0');
    PHSprites.officeDesk(22.8, 4.0, 0, { clutter: !isFut, screenStyle: 'ecg', seed: 12, visitorChair: false });

    // Bottom-Left Room: Retreat Reception & Suites (19..25.5, 7.5..14)
    PHSprites.receptionDesk(19.5, 8.2, 0, 2.6, { col: isFut ? '#10b981' : '#d97706', wood: '#78350f', clutter: !isFut });
    if (isFut) {
      PHSprites.kiosk(23.5, 8.2, 0, { col: '#10b981' });
    }
    PHSprites.luxuryBed(19.6, 10.2, 0, { duvet: isFut ? '#10b981' : '#d97706', smartHub: isFut });
    PHSprites.luxuryBed(22.6, 10.2, 0, { duvet: isFut ? '#0ea5e9' : '#b45309', smartHub: isFut });

    // Right Wing: Hydro Pool, Spa & Dining (25.5..31, 1..14)
    PHSprites.spaTable(26.2, 8.2, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(28.6, 8.2, 0, { col: '#6ee7b7' });
    PHSprites.diningTable(26.4, 11.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(28.8, 11.2, 0, { cloth: '#fef3c7' });

    // ------------------------------- CONCIERGE TRANSPORT VEHICLES ON FRONT ROAD (y: 14.6..17.6)
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

    // ------------------------------- PATIENTS, DOCTORS, NURSES, CONCIERGE & STAFF
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

    // Plain Room & Main Entrance Signs
    PHSprites.roomSign(6.0, 1.1, 'Hospital Ward', '#0ea5e9');
    PHSprites.roomSign(3.8, 7.7, isFut ? 'Fast-Track Discharge' : 'Billing & Discharge', isFut ? '#10b981' : '#f59e0b');
    PHSprites.roomSign(6.3, 13.8, 'Hospital Main Entrance ↓', '#0ea5e9');

    PHSprites.roomSign(22.2, 1.1, 'Doctor Check-Up Room', '#38bdf8');
    PHSprites.roomSign(22.2, 7.7, 'Retreat Reception & Suites', '#10b981');
    PHSprites.roomSign(28.2, 1.1, 'Hydro Pool & Dining', '#06b6d4');
    PHSprites.roomSign(22.2, 13.8, 'Retreat Main Entrance ↓', '#10b981');

    PH.overlay(simState.showActionLabels);

    if (upgradePulse > 0.01) {
      const c = PH.S.ctx;
      const center = PH.P(16, 9, 10);
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
