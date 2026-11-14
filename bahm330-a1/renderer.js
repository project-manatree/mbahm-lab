// ============================================================================
// BAHM330-A1: Project Hospital (2018) 2.5D Isometric Facility Renderer
// Focused 100% on Clinical & Retreat Facilities, Doctors, Nurses, Staff,
// Patients, and the Stage 3 Step-Down Transfer Ambulance / Medical Van
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 28;
  const GRID_H = 22;

  let upgradePulse = 0;
  let upgradeMode = 'future';

  // Clean architectural floorplan: Partner Hospital (Left) + S3 Transfer Bay + Retreat (Right)
  const MAP = {
    bounds: { x0: 0.5, y0: 0.5, x1: 27.5, y1: 20.5 },
    view: { x0: 0.5, y0: 0.5, x1: 27.5, y1: 20.5 },
    ground: [
      // Clean neutral architectural base slab
      { x: 0.5, y: 0.5, w: 27, d: 20, mat: 'concrete' },
      // S3: Dedicated Hospital-to-Retreat Step-Down Transfer Bay (gx: 10.2..15.8)
      { x: 10.2, y: 1, w: 5.6, d: 19, mat: 'asphalt' },
      // Partner Hospital Main Corridor (gy: 9..11)
      { x: 1, y: 9, w: 9.2, d: 2.2, mat: { cur: 'linoWorn', fut: 'terrazzo' } },
      // S1: Acute Geriatric Ward B4 (gx: 1..10, gy: 1..9)
      { x: 1, y: 1, w: 9, d: 8, mat: { cur: 'linoWorn', fut: 'linoBlue' } },
      // S2: Billing Office & Fast-Track Discharge Lounge (gx: 1..10, gy: 11..20)
      { x: 1, y: 11, w: 5, d: 9, mat: { cur: 'linoGrey', fut: 'linoWhite' } },
      { x: 6, y: 11, w: 4, d: 9, mat: { cur: 'linoWorn', fut: 'carpetTeal' } },
      // Retreat Central Promenade (gx: 16..27, gy: 9..11)
      { x: 16, y: 9, w: 11, d: 2.2, mat: 'marble' },
      // S5: On-Site Visiting MD & Telemetry Clinic (gx: 16..22, gy: 1..9)
      { x: 16, y: 1, w: 6, d: 8, mat: { cur: 'linoGrey', fut: 'ceramicBlue' } },
      // S6a: Heated Hydrotherapy Lap Pool & Deck (gx: 22..27, gy: 1..9)
      { x: 22, y: 1, w: 5, d: 8, mat: 'ceramicCream' },
      { x: 22.6, y: 2.0, w: 3.8, d: 5.8, mat: 'water' },
      // S4: Smart Biometric Concierge Lobby & Luxury Suites 201-208 (gx: 16..22, gy: 11..20)
      { x: 16, y: 11, w: 6, d: 9, mat: 'oak' },
      // S6b: Therapeutic Dining Bistro & Spa Pavilion (gx: 22..27, gy: 11..20)
      { x: 22, y: 11, w: 5, d: 9, mat: 'deck' }
    ],
    decals: [
      // S3 Transfer Bay Lane & Patient Boarding Crosswalk
      { type: 'zebra', x: 10.4, y: 9.2, w: 5.2, d: 1.8, axis: 'x', col: 'rgba(248,250,252,0.85)' },
      { type: 'hatch', x: 11.0, y: 12.4, w: 4.0, d: 3.4, col: 'rgba(250,204,21,0.50)' },
      // Hospital & Retreat corridor wayfinding lines
      { type: 'line', x1: 1.5, y1: 10.0, x2: 10.2, y2: 10.0, w: 0.14, col: '#0ea5e9', when: 'fut' },
      { type: 'line', x1: 15.8, y1: 10.0, x2: 26.5, y2: 10.0, w: 0.14, col: '#10b981', when: 'fut' },
      // Hydrotherapy pool lane lines
      { type: 'line', x1: 23.8, y1: 2.2, x2: 23.8, y2: 7.6, w: 0.06, col: 'rgba(224,242,254,0.65)' },
      { type: 'line', x1: 25.2, y1: 2.2, x2: 25.2, y2: 7.6, w: 0.06, col: 'rgba(224,242,254,0.65)' }
    ],
    wear: [
      { x: 1, y: 1, w: 9, d: 19 },
      { x: 16, y: 11, w: 6, d: 9 }
    ],
    walls: [
      // Partner Hospital Perimeter & Cutaway Room Walls
      { x1: 1, y1: 1, x2: 10, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 9, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 9, x2: 10, y2: 9, kind: 'int', col: '#cbd5e1', open: [{ at: 4.8, w: 1.6, type: 'double' }] },
      { x1: 10, y1: 1, x2: 10, y2: 9, kind: 'ext', col: '#e2e8f0', windows: true },

      // S2 Billing & Fast-Track Lounge Walls
      { x1: 1, y1: 11, x2: 10, y2: 11, kind: 'int', col: '#cbd5e1', open: [{ at: 3.0, w: 1.4, type: 'door' }, { at: 7.2, w: 1.5, type: { cur: 'locked', fut: 'slide' } }] },
      { x1: 1, y1: 11, x2: 1, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 20, x2: 10, y2: 20, kind: 'ext', col: '#e2e8f0' },
      { x1: 6, y1: 11, x2: 6, y2: 20, kind: 'glass', col: '#cbd5e1', open: [{ at: 14.5, w: 1.4, type: 'door' }] },
      { x1: 10, y1: 11, x2: 10, y2: 20, kind: 'ext', col: '#e2e8f0', open: [{ at: 13.5, w: 1.8, type: 'slide' }] },

      // Luxury Geriatric Retreat Perimeter & Interior Walls
      { x1: 16, y1: 1, x2: 27, y2: 1, kind: 'ext', col: '#f5f0e6', windows: true },
      { x1: 16, y1: 1, x2: 16, y2: 9, kind: 'ext', col: '#f5f0e6', open: [{ at: 4.5, w: 1.5, type: 'slide' }] },
      { x1: 16, y1: 9, x2: 27, y2: 9, kind: 'glass', open: [{ at: 18.2, w: 1.5, type: 'door' }, { at: 23.8, w: 1.6, type: 'slide' }] },
      { x1: 22, y1: 1, x2: 22, y2: 9, kind: 'glass', open: [{ at: 4.5, w: 1.4, type: 'door' }] },
      { x1: 27, y1: 1, x2: 27, y2: 20, kind: 'ext', col: '#f5f0e6', windows: true },

      // S4 Biometric Lobby, Luxury Suites & S6b Bistro Walls
      { x1: 16, y1: 11, x2: 27, y2: 11, kind: 'int', col: '#ede4d3', open: [{ at: 17.5, w: 1.6, type: 'slide' }, { at: 23.8, w: 1.6, type: 'door' }] },
      { x1: 16, y1: 11, x2: 16, y2: 20, kind: 'ext', col: '#f5f0e6', open: [{ at: 13.5, w: 1.8, type: 'slide' }] },
      { x1: 16, y1: 20, x2: 27, y2: 20, kind: 'ext', col: '#f5f0e6' },
      { x1: 22, y1: 11, x2: 22, y2: 20, kind: 'int', col: '#ede4d3', open: [{ at: 15.0, w: 1.4, type: 'door' }] },
      // Partition between Suite 201 & Suite 202
      { x1: 16, y1: 16, x2: 22, y2: 16, kind: 'int', col: '#ede4d3', open: [{ at: 18.0, w: 1.2, type: 'door' }] }
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

    // ------------------------------- 1. S1: PARTNER HOSPITAL ACUTE WARD B4 (1..10, 1..9)
    const bedBlanket = isFut ? '#0ea5e9' : '#64748b';
    PHSprites.hospitalBed(1.5, 1.6, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 1 });
    PHSprites.privacyCurtain(1.5, 3.2, 0, 2.0, '#bae6fd');
    PHSprites.hospitalBed(1.5, 3.8, 0, { blanket: bedBlanket, alert: false, ready: isFut, seed: 2 });
    PHSprites.privacyCurtain(1.5, 5.4, 0, 2.0, '#bae6fd');
    PHSprites.hospitalBed(1.5, 6.0, 0, { blanket: bedBlanket, alert: !isFut, ready: isFut, seed: 3 });
    PHSprites.hospitalBed(5.0, 1.6, 0, { blanket: bedBlanket, alert: false, ready: isFut, seed: 4 });

    // Ward Discharge Nurse Station & HL7/FHIR Terminal
    PHSprites.receptionDesk(7.2, 1.8, 1, 2.6, { col: isFut ? '#10b981' : '#0284c7', clutter: !isFut });
    PHSprites.waitingBench(4.5, 7.6, 0, 4, '#3b82f6');

    // ------------------------------- 2. S2: BILLING & FAST-TRACK LOUNGE (1..10, 11..20)
    PHSprites.receptionDesk(1.5, 11.8, 0, 3.4, { col: isFut ? '#10b981' : '#f59e0b', clutter: !isFut });
    PHSprites.pharmacyShelf(1.5, 15.2, 0, { stockout: !isFut, rfid: isFut });
    PHSprites.waitingBench(1.6, 17.6, 0, 5, '#475569');
    PHSprites.vendingAndWater(4.2, 18.2, 0);

    if (isFut) {
      // Unlocked Digital Fast-Track Discharge Lounge
      PHSprites.sofa(6.6, 12.4, 0, 2.2, '#0d9488');
      PHSprites.sofa(6.6, 15.2, 0, 2.2, '#0284c7');
      PHSprites.kiosk(8.8, 12.2, 1, { col: '#10b981' });
      PHSprites.kiosk(8.8, 13.4, 1, { col: '#0ea5e9' });
    } else {
      PHSprites.waitingBench(6.5, 14.5, 0, 3, '#64748b');
    }

    // ------------------------------- 3. S5: VISITING MD & TELEMETRY SUITE (16..22, 1..9)
    PHSprites.officeDesk(17.2, 1.6, 0, { clutter: !isFut, screenStyle: isFut ? 'ok' : 'alert', seed: 11 });
    PHSprites.examTable(16.8, 4.5, 0, { col: isFut ? '#10b981' : '#0284c7' });
    PHSprites.privacyCurtain(16.8, 6.2, 0, 1.9, '#a7f3d0');
    PHSprites.officeDesk(19.6, 4.5, 0, { clutter: !isFut, screenStyle: 'ecg', seed: 12, visitorChair: false });

    // ------------------------------- 4. S4: BIOMETRIC POD & KING SUITES (16..22, 11..20)
    PHSprites.receptionDesk(16.6, 11.6, 0, 2.8, { col: isFut ? '#10b981' : '#d97706', wood: '#78350f', clutter: !isFut });
    if (isFut) {
      PHSprites.kiosk(19.8, 11.6, 0, { col: '#10b981' });
    }
    PHSprites.luxuryBed(16.8, 13.8, 0, { duvet: isFut ? '#10b981' : '#d97706', smartHub: isFut });
    PHSprites.luxuryBed(16.8, 17.2, 0, { duvet: isFut ? '#0ea5e9' : '#b45309', smartHub: isFut });
    PHSprites.sofa(19.6, 17.4, 1, 1.8, '#b45309');

    // ------------------------------- 5. S6: HYDRO POOL, SPA & BISTRO (22..27, 1..20)
    PHSprites.spaTable(22.6, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.spaTable(24.8, 11.8, 0, { col: '#6ee7b7' });
    PHSprites.diningTable(22.8, 15.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(25.0, 15.2, 0, { cloth: '#fef3c7' });
    PHSprites.diningTable(23.8, 17.6, 0, { cloth: '#fde68a' });

    // ------------------------------- 6. BOTTLENECK HALOS vs SMART CONDUITS
    if (!isFut) {
      PHSprites.floorHalo(4.5, 7.5, 28, 14, '#ef4444', 'S1: +45m WARD DISCHARGE QUEUE');
      PHSprites.floorHalo(6.0, 14.2, 28, 14, '#ef4444', 'S2: +45m PAPER GL BILLING WAIT');
      PHSprites.floorHalo(9.8, 14.5, 24, 12, '#ef4444', 'S3: +30m SINGLE AMBULANCE WAIT');
      PHSprites.floorHalo(18.2, 15.5, 26, 13, '#f59e0b', 'S4: +30m SUITE CLEANING DELAY');
      PHSprites.floorHalo(18.0, 6.2, 24, 12, '#f59e0b', 'S5: +30m DISTANT MD PAGING');
    } else {
      PHSprites.signalBeam(8.2, 2.8, 17.5, 12.2, '#10b981', 'HL7/FHIR PRE-ALERT');
      PHSprites.signalBeam(8.8, 12.8, 18.2, 3.2, '#0ea5e9', 'e-GL + TELEMETRY SYNC');
    }

    // ------------------------------- 7. S3: PATIENT STEP-DOWN TRANSFER AMBULANCE (PART OF WORKFLOW)
    PHSprites.movingVehicle(12.2, simState.van.gy, {
      type: isFut ? 'vip' : 'ambulance',
      dir: 1,
      openDoor: simState.van.doorsOpen,
      label: isFut ? 'S3: Medical Concierge Transfer Van' : 'S3: Patient Transfer Ambulance'
    });

    // ------------------------------- 8. 24 ARTICULATED DOCTORS, NURSES, STAFF & PATIENTS
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
        label: ag.shortName || ag.name,
        sub: ag.actionLabel,
        forceLabel: ag.role === 'resident' || isSel,
        sel: isSel,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType === 'wait' ? 'fail' : ag.bubbleType,
        prop: ag.pose === 'MOPPING' ? 'mop' : ag.pose === 'HANDOVER_INTERACTION' ? 'clipboard' : undefined
      });
    });

    PH.end();

    // Room architectural header signs
    PHSprites.roomSign(5.0, 1.2, 'S1 · Partner Hospital Ward B4', '#0ea5e9');
    PHSprites.roomSign(5.0, 11.2, isFut ? 'S2 · Fast-Track e-GL Lounge' : 'S2 · Manual Billing Office (+45m)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(13.0, 11.8, isFut ? 'S3 · Medical Transfer Bay (0m Wait)' : 'S3 · Ambulance Transfer Bay (+30m)', isFut ? '#10b981' : '#f59e0b');
    PHSprites.roomSign(19.0, 1.2, isFut ? 'S5 · On-Site Visiting MD & Telemetry' : 'S5 · Visiting Clinic (+30m Wait)', isFut ? '#10b981' : '#f59e0b');
    PHSprites.roomSign(19.0, 11.2, isFut ? 'S4 · Biometric Pod & Luxury Suites' : 'S4 · Retreat Lobby & Suites (+30m)', isFut ? '#10b981' : '#f59e0b');
    PHSprites.roomSign(24.5, 1.2, 'S6 · Hydrotherapy Pool, Spa & Bistro', '#06b6d4');

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
