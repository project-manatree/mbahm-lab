// ============================================================================
// BAHM330-A2: Meridian Specialist Hospital (MSH) 28x22 Project Hospital Renderer
// Focused 100% on Hospital Clinical Departments, Medical Equipment, Doctors,
// Nurses, Radiographers, Pharmacists, and Patients (Zero Exterior Distractions)
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 28;
  const GRID_H = 22;

  let upgradePulse = 0;
  let upgradeMode = 'future';

  const MAP = {
    bounds: { x0: 2.5, y0: 0.5, x1: 27.5, y1: 20.5 },
    view: { x0: 2.5, y0: 0.5, x1: 27.5, y1: 20.5 },
    ground: [
      // Clean structural hospital slab
      { x: 2.5, y: 0.5, w: 25, d: 20, mat: 'concrete' },
      // Main Hospital Central Corridor (x: 3..27, y: 9..11)
      { x: 3, y: 9, w: 24, d: 2.2, mat: { cur: 'linoWorn', fut: 'terrazzo' } },
      // 1. Main Triage, Registration & Waiting Hall (x: 3..10, y: 1..9)
      { x: 3, y: 1, w: 7, d: 8, mat: { cur: 'linoWorn', fut: 'linoBlue' } },
      { x: 5.0, y: 1.6, w: 4.5, d: 6.5, mat: { cur: 'linoGrey', fut: 'carpetBlue' } },
      // 2. C1: 4-Room Specialist Consultation Pod (x: 10..19, y: 1..9)
      { x: 10, y: 1, w: 4.5, d: 8, mat: 'linoMint' },
      { x: 14.5, y: 1, w: 4.5, d: 8, mat: { cur: 'linoWorn', fut: 'linoMint' } },
      // 3. C2: Dual-Suite Diagnostic Imaging Wing — CT + 3T MRI (x: 19..27, y: 1..9)
      { x: 19, y: 1, w: 4.2, d: 8, mat: 'ceramicBlue' },
      { x: 23.2, y: 1, w: 3.8, d: 8, mat: { cur: 'linoDark', fut: 'ceramicBlue' } },
      // 4. C3a: Inpatient Ward 4B & Dedicated Discharge Lounge (x: 3..13, y: 11..20)
      { x: 3, y: 11, w: 7, d: 9, mat: { cur: 'linoWorn', fut: 'linoBlue' } },
      { x: 10, y: 11, w: 3, d: 9, mat: { cur: 'linoWorn', fut: 'oak' } },
      // 5. C3b: Robotic Pharmacy & RFID Smart Inventory (x: 13..21, y: 11..20)
      { x: 13, y: 11, w: 8, d: 9, mat: { cur: 'linoWorn', fut: 'ceramic' } },
      // 6. C5: Central HIS Single-Source-of-Truth (SSOT) Hub (x: 21..27, y: 11..20)
      { x: 21, y: 11, w: 6, d: 9, mat: { cur: 'linoGrey', fut: 'carpetTeal' } }
    ],
    decals: [
      // Hospital main corridor color-coded wayfinding lines (Project Hospital style)
      { type: 'line', x1: 3.2, y1: 9.8, x2: 26.5, y2: 9.8, w: 0.12, col: '#0ea5e9', when: 'fut' },
      { type: 'line', x1: 3.2, y1: 10.3, x2: 26.5, y2: 10.3, w: 0.12, col: '#10b981', when: 'fut' }
    ],
    wear: [
      { x: 3, y: 1, w: 24, d: 19 }
    ],
    walls: [
      // Outer Hospital Perimeter Walls with framed windows
      { x1: 3, y1: 1, x2: 27, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 3, y1: 1, x2: 3, y2: 9, kind: 'ext', col: '#e2e8f0', open: [{ at: 4.5, w: 1.8, type: 'slide' }] },
      { x1: 3, y1: 11, x2: 3, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 3, y1: 20, x2: 27, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 27, y1: 1, x2: 27, y2: 20, kind: 'ext', col: '#e2e8f0', windows: true },

      // North Wing Corridor Wall (y = 9) with doors into Reception, 4 Consult Rooms & Radiology
      {
        x1: 3, y1: 9, x2: 27, y2: 9, kind: 'int', col: '#cbd5e1',
        open: [
          { at: 6.0, w: 1.8, type: 'slide' },
          { at: 10.6, w: 1.1, type: 'door' },
          { at: 12.8, w: 1.1, type: 'door' },
          { at: 15.0, w: 1.1, type: { cur: 'locked', fut: 'door' } },
          { at: 17.2, w: 1.1, type: { cur: 'locked', fut: 'door' } },
          { at: 20.5, w: 1.5, type: 'double' },
          { at: 24.4, w: 1.4, type: { cur: 'locked', fut: 'double' } }
        ]
      },
      // Partitions between Reception and the 4 Specialist Consultation Rooms (C1)
      { x1: 10, y1: 1, x2: 10, y2: 9, kind: 'int', col: '#cbd5e1' },
      { x1: 12.2, y1: 1, x2: 12.2, y2: 9, kind: 'int', col: '#cbd5e1' },
      { x1: 14.5, y1: 1, x2: 14.5, y2: 9, kind: 'int', col: '#cbd5e1' },
      { x1: 16.7, y1: 1, x2: 16.7, y2: 9, kind: 'int', col: '#cbd5e1' },
      { x1: 19, y1: 1, x2: 19, y2: 9, kind: 'int', col: '#cbd5e1' },
      // Partition between CT Suite and 3T MRI Suite + Lead-Glass Control Booth (C2)
      { x1: 23.2, y1: 1, x2: 23.2, y2: 9, kind: 'glass', col: '#94a3b8' },
      { x1: 19, y1: 5.8, x2: 27, y2: 5.8, kind: 'glass', open: [{ at: 21.0, w: 1.2, type: 'door' }, { at: 24.6, w: 1.2, type: 'door' }] },

      // South Wing Corridor Wall (y = 11) with doors into Ward 4B, Discharge Lounge, Pharmacy & HIS Hub
      {
        x1: 3, y1: 11, x2: 27, y2: 11, kind: 'int', col: '#cbd5e1',
        open: [
          { at: 5.8, w: 1.6, type: 'double' },
          { at: 10.8, w: 1.4, type: { cur: 'locked', fut: 'slide' } },
          { at: 15.8, w: 1.8, type: 'slide' },
          { at: 23.2, w: 1.5, type: 'slide' }
        ]
      },
      { x1: 10, y1: 11, x2: 10, y2: 20, kind: 'glass', open: [{ at: 15.0, w: 1.4, type: 'door' }] },
      { x1: 13, y1: 11, x2: 13, y2: 20, kind: 'int', col: '#cbd5e1' },
      { x1: 21, y1: 11, x2: 21, y2: 20, kind: 'glass', open: [{ at: 15.0, w: 1.4, type: 'door' }] }
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
    const isCur = simState.mode === 'current';
    const isFut = !isCur;
    PH.setCondition(isFut ? 'fut' : 'cur');
    PH.begin();

    // ------------------------ 1. DEPT 1: RECEPTION & WAITING HALL (3..10, 1..9)
    PHSprites.receptionDesk(3.4, 1.8, 1, 3.0, { col: isFut ? '#10b981' : '#0284c7', clutter: isCur });
    PHSprites.waitingBench(5.3, 2.2, 0, 6, '#0284c7');
    PHSprites.waitingBench(5.3, 4.0, 0, 6, '#0284c7');
    PHSprites.waitingBench(5.3, 5.8, 0, 6, '#0284c7');
    PHSprites.vendingAndWater(3.4, 6.8, 0);
    if (isFut) {
      PHSprites.kiosk(3.5, 5.0, 1, { col: '#10b981' });
      PHSprites.kiosk(3.5, 5.9, 1, { col: '#0ea5e9' });
    }

    // ------------------------ 2. DEPT 2 (C1): 4 SPECIALIST CONSULTATION ROOMS (10..19, 1..9)
    const roomXs = [10.2, 12.4, 14.7, 16.9];
    roomXs.forEach((rx, idx) => {
      const unlocked = isFut || idx < 2;
      PHSprites.examTable(rx + 0.1, 1.5, 0, { col: unlocked ? '#10b981' : '#64748b' });
      PHSprites.privacyCurtain(rx + 0.1, 3.0, 0, 1.7, '#bae6fd');
      PHSprites.officeDesk(rx + 0.1, 4.4, 0, {
        clutter: isCur,
        screenStyle: unlocked ? 'ok' : 'off',
        seed: 20 + idx,
        visitorChair: true
      });
    });

    // ------------------------ 3. DEPT 3 (C2): DUAL CT + 3T MRI IMAGING WING (19..27, 1..9)
    PHSprites.ctScanner(19.6, 1.5, 0, { active: isFut });
    if (isFut) {
      PHSprites.mriScanner(23.6, 1.4, 0, { active: true });
    } else {
      PHSprites.examTable(24.0, 2.2, 0, { col: '#475569' });
    }
    // Radiographer Lead-Glass Control Booth Consoles
    PHSprites.officeDesk(19.6, 6.4, 0, { clutter: isCur, screenStyle: isFut ? 'ok' : 'alert', seed: 31, visitorChair: false });
    if (isFut) {
      PHSprites.officeDesk(23.8, 6.4, 0, { clutter: false, screenStyle: 'ecg', seed: 32, visitorChair: false });
    }

    // ------------------------ 4. DEPT 4 (C3a): WARD 4B & DISCHARGE LOUNGE (3..13, 11..20)
    const wardBlanket = isFut ? '#10b981' : '#ef4444';
    PHSprites.hospitalBed(3.5, 12.2, 0, { blanket: wardBlanket, alert: isCur, ready: isFut, seed: 41 });
    PHSprites.hospitalBed(6.4, 12.2, 0, { blanket: wardBlanket, alert: isCur, ready: isFut, seed: 42 });
    PHSprites.privacyCurtain(3.5, 14.5, 0, 5.2, '#bae6fd');
    PHSprites.hospitalBed(3.5, 16.0, 0, { blanket: wardBlanket, alert: isCur, ready: isFut, seed: 43 });
    PHSprites.hospitalBed(6.4, 16.0, 0, { blanket: wardBlanket, alert: isCur, ready: isFut, seed: 44 });

    if (isFut) {
      PHSprites.sofa(10.5, 12.4, 1, 2.2, '#10b981');
      PHSprites.sofa(10.5, 15.6, 1, 2.2, '#0ea5e9');
    } else {
      PHSprites.waitingBench(10.4, 14.5, 1, 3, '#64748b');
    }

    // ------------------------ 5. DEPT 5 (C3b): ROBOTIC PHARMACY & RFID RACKS (13..21, 11..20)
    PHSprites.receptionDesk(13.6, 12.0, 0, 3.4, { col: isFut ? '#10b981' : '#ef4444', clutter: isCur });
    PHSprites.pharmacyShelf(13.6, 15.2, 0, { stockout: isCur, rfid: isFut });
    PHSprites.pharmacyShelf(13.6, 17.2, 0, { stockout: isCur, rfid: isFut });
    if (isFut) {
      PHSprites.roboticDispenser(17.8, 13.8, 0);
      PHSprites.pharmacyShelf(17.8, 17.2, 0, { stockout: false, rfid: true });
    } else {
      PHSprites.pharmacyShelf(17.8, 15.2, 0, { stockout: true, rfid: false });
    }

    // ------------------------ 6. DEPT 6 (C5): CENTRAL HIS SSOT COMMAND HUB (21..27, 11..20)
    PHSprites.officeDesk(22.0, 12.6, 0, { clutter: isCur, screenStyle: isFut ? 'ok' : 'alert', seed: 51 });
    PHSprites.officeDesk(24.4, 12.6, 0, { clutter: isCur, screenStyle: isFut ? 'ui' : 'alert', seed: 52 });
    PHSprites.pharmacyShelf(22.0, 16.8, 0, { stockout: false, rfid: isFut });
    PHSprites.pharmacyShelf(24.4, 16.8, 0, { stockout: false, rfid: isFut });

    // ------------------------ 7. BOTTLENECK HALOS vs SSOT SYNC CONDUITS
    if (isCur) {
      PHSprites.floorHalo(7.2, 4.5, 30, 15, '#ef4444', 'C1: 14+ CROWDED (68m WAIT · NO ETA)');
      PHSprites.floorHalo(20.8, 7.2, 22, 11, '#ef4444', 'C2: 40% REJECTED AT SINGLE X-RAY');
      PHSprites.floorHalo(6.2, 14.8, 28, 14, '#ef4444', 'C3: 4 BEDS BLOCKED (+92m DELAY)');
      PHSprites.floorHalo(15.5, 15.5, 24, 12, '#ef4444', 'C3: STOCKOUT & LANDLINE LOOP');
      PHSprites.floorHalo(4.5, 3.0, 20, 10, '#f59e0b', 'C5: SMS (10:00) != PHONE (11:30)');
    } else {
      PHSprites.signalBeam(23.5, 13.5, 4.5, 2.8, '#0ea5e9', 'SSOT 99.9% RECEPTION SYNC');
      PHSprites.signalBeam(23.5, 13.5, 14.5, 4.5, '#10b981', '4-POD WAVE SCHEDULE');
      PHSprites.signalBeam(23.5, 13.5, 21.5, 6.5, '#38bdf8', 'CPOE IMAGING HARD-STOP');
      PHSprites.signalBeam(18.5, 14.5, 11.2, 14.5, '#10b981', '18m ROBOTIC PNEUMATIC POD');
    }

    // ------------------------ 8. 30 ARTICULATED DOCTORS, NURSES, STAFF & PATIENTS
    simState.agents.forEach(ag => {
      const isSel = ag.id === simState.selectedAgentId;
      let role = ag.role;
      if (ag.id.includes('rad')) role = ag.role === 'patient' ? 'gown' : 'radiographer';
      else if (ag.id === 'st-pharm-1') role = 'pharmacist';
      else if (ag.id.startsWith('pat-ward') && isCur) role = 'gown';

      const inBed = ag.pose === 'LYING_ON_BED' || ag.pose === 'IN_SCANNER';
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: inBed ? 9.0 : 0,
        pose: ag.pose,
        dir: ag.dir,
        role,
        seed: ag.idNum || 1,
        axis: ag.pose === 'IN_SCANNER' ? 'y' : 'x',
        head: -1,
        blanket: ag.pose === 'LYING_ON_BED' ? '#38bdf8' : null,
        label: ag.shortName || ag.name,
        sub: ag.actionLabel,
        forceLabel: ag.role === 'patient' || isSel,
        sel: isSel,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType
      });
    });

    PH.end();

    // Department Header Signs
    PHSprites.roomSign(6.5, 1.2, isFut ? '1. Biometric Kiosks & Triage' : '1. Crowded Waiting Hall (68m)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(14.5, 1.2, isFut ? '2. 4-Room Specialist Pod (12m)' : '2. 2-Room Clinic (Rooms 3–4 Locked)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(23.0, 1.2, isFut ? '3. Dual High-Speed CT + 3T MRI' : '3. Single X-Ray (40% Rejected)', isFut ? '#0ea5e9' : '#ef4444');
    PHSprites.roomSign(7.5, 11.2, isFut ? '4. Ward 4B & Discharge Lounge' : '4. Ward 4B (4 Beds Blocked +92m)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(17.0, 11.2, isFut ? '5. Robotic Pharmacy + RFID (18m)' : '5. Manual Pharmacy (STOCKOUT)', isFut ? '#10b981' : '#ef4444');
    PHSprites.roomSign(24.0, 11.2, isFut ? '6. Central SSOT HIS Hub (99.9%)' : '6. Siloed IT & Call Sheets (68%)', isFut ? '#0ea5e9' : '#f59e0b');

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
