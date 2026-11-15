// ============================================================================
// BAHM330-A2: Expanded 8-Department Specialist Hospital (34x21 Grid)
// 100% Identical Building Structure in Both Modes:
// - Top Wing (y: 1..8.5):
//   1. Reception, Triage & Main Waiting Hall (x: 1..9)
//   2. Specialist Consultation Pod — 5 Consultation Rooms (x: 9..21.5)
//   3. Diagnostic Imaging Wing — CT Suite, 3T MRI Suite & Control Booth (x: 21.5..33)
// - Central Hospital Thoroughfare Corridor (y: 8.5..11)
// - Bottom Wing (y: 11..19):
//   4. Inpatient Ward 4A & 4B — 8 Hospital Beds (x: 1..11)
//   5. Inpatient Discharge Lounge (x: 11..16)
//   6. Central Pharmacy & Robotic Dispensing Hall (x: 16..25.5)
//   7. IT & Appointment Booking Command Centre (x: 25.5..33)
//   8. Main Hospital Entrance Facing DOWN (y = 19)
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
      { x: 1, y: 1, w: 8, d: 7.5, mat: 'linoBlue' },            // 1. Reception & Waiting Hall
      { x: 3.2, y: 1.8, w: 5.2, d: 5.8, mat: 'carpetBlue' },    // Waiting seating carpet
      { x: 9, y: 1, w: 12.5, d: 7.5, mat: 'linoMint' },         // 2. Consultation Rooms 1-5
      { x: 21.5, y: 1, w: 11.5, d: 7.5, mat: 'ceramicBlue' },   // 3. CT & 3T MRI Scan Wing

      // Central Hospital Corridor (y: 8.5..11)
      { x: 1, y: 8.5, w: 32, d: 2.5, mat: 'terrazzo' },

      // Bottom Wing (y: 11..19)
      { x: 1, y: 11, w: 10, d: 8, mat: 'linoBlue' },            // 4. Inpatient Ward 4A & 4B
      { x: 11, y: 11, w: 5, d: 8, mat: 'oak' },                 // 5. Discharge Lounge & Main Entrance
      { x: 16, y: 11, w: 9.5, d: 8, mat: 'ceramic' },           // 6. Central Pharmacy
      { x: 25.5, y: 11, w: 7.5, d: 8, mat: 'carpetTeal' },      // 7. IT & Booking Command Office

      // Front Main Entrance Walkway Apron (y: 19..19.8)
      { x: 1, y: 19.0, w: 32, d: 0.8, mat: 'paver' }
    ],
    decals: [
      { type: 'line', x1: 1.5, y1: 9.5, x2: 32.5, y2: 9.5, w: 0.11, col: '#0ea5e9' },
      { type: 'line', x1: 1.5, y1: 10.1, x2: 32.5, y2: 10.1, w: 0.11, col: '#10b981' }
    ],
    walls: [
      // Outer Hospital Perimeter Walls
      { x1: 1, y1: 1, x2: 33, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 19, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 33, y1: 1, x2: 33, y2: 19, kind: 'ext', col: '#e2e8f0', windows: true },
      // Bottom Front Wall (y = 19) with Main Entrance Facing Straight DOWN at x = 12.2..14.8 & Pharmacy Exit at x = 19.5..21.8
      {
        x1: 1, y1: 19, x2: 33, y2: 19, kind: 'ext', col: '#e2e8f0', windows: true,
        open: [
          { at: 12.2, w: 2.6, type: 'slide', alwaysOpen: true },
          { at: 19.5, w: 2.2, type: 'slide', alwaysOpen: true }
        ]
      },

      // North Wing Corridor Wall (y = 8.5) — All Doors Open & Identical in Both Modes
      {
        x1: 1, y1: 8.5, x2: 33, y2: 8.5, kind: 'int', col: '#cbd5e1',
        open: [
          { at: 4.5, w: 2.0, type: 'slide', alwaysOpen: true },
          { at: 9.7, w: 1.1, type: 'door' },
          { at: 12.2, w: 1.1, type: 'door' },
          { at: 14.7, w: 1.1, type: 'door' },
          { at: 17.2, w: 1.1, type: 'door' },
          { at: 19.7, w: 1.1, type: 'door' },
          { at: 23.2, w: 1.6, type: 'double' },
          { at: 28.8, w: 1.6, type: 'double' }
        ]
      },
      // Partitions for the 5 Consultation Rooms (x: 9, 11.5, 14, 16.5, 19, 21.5)
      { x1: 9, y1: 1, x2: 9, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 11.5, y1: 1, x2: 11.5, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 14.0, y1: 1, x2: 14.0, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 16.5, y1: 1, x2: 16.5, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 19.0, y1: 1, x2: 19.0, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 21.5, y1: 1, x2: 21.5, y2: 8.5, kind: 'int', col: '#cbd5e1' },

      // Diagnostic Imaging Partitions (CT Room, 3T MRI Room, Control Booth)
      { x1: 27.2, y1: 1, x2: 27.2, y2: 8.5, kind: 'glass', col: '#94a3b8' },
      { x1: 21.5, y1: 5.5, x2: 33, y2: 5.5, kind: 'glass', open: [{ at: 23.5, w: 1.3, type: 'door' }, { at: 29.0, w: 1.3, type: 'door' }] },

      // South Wing Corridor Wall (y = 11) — All Doors Open & Identical in Both Modes
      {
        x1: 1, y1: 11, x2: 33, y2: 11, kind: 'int', col: '#cbd5e1',
        open: [
          { at: 4.8, w: 1.8, type: 'double' },
          { at: 12.5, w: 1.8, type: 'slide', alwaysOpen: true },
          { at: 19.5, w: 2.0, type: 'slide', alwaysOpen: true },
          { at: 28.0, w: 1.6, type: 'slide' }
        ]
      },
      { x1: 11, y1: 11, x2: 11, y2: 19, kind: 'glass', open: [{ at: 14.5, w: 1.5, type: 'door' }] },
      { x1: 16, y1: 11, x2: 16, y2: 19, kind: 'int', col: '#cbd5e1' },
      { x1: 25.5, y1: 11, x2: 25.5, y2: 19, kind: 'glass', open: [{ at: 14.5, w: 1.5, type: 'door' }] }
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
    const isCur = simState.mode === 'current';
    PH.setCondition(isCur ? 'cur' : 'fut');
    PH.begin();

    // ---------------- 1. C1 OUTPATIENT RECEPTION, TRIAGE & WAITING HALL (x: 1..9, y: 1..8.5)
    PHSprites.receptionDesk(1.4, 1.6, 1, 3.2, { col: '#0284c7', clutter: isCur });
    PHSprites.kiosk(1.5, 5.4, 1, { col: '#10b981' });
    PHSprites.kiosk(1.5, 6.5, 1, { col: '#0ea5e9' });
    PHSprites.waitingBench(3.6, 2.2, 0, 6, '#0284c7');
    PHSprites.waitingBench(3.6, 3.6, 0, 6, '#0284c7');
    PHSprites.waitingBench(3.6, 5.0, 0, 6, '#0284c7');
    PHSprites.waitingBench(3.6, 6.4, 0, 6, '#0284c7');
    PHSprites.vendingAndWater(7.4, 1.8, 0);

    // ---------------- 2. 5 SPECIALIST CONSULTATION ROOMS (x: 9..21.5, y: 1..8.5)
    const roomXs = [9.2, 11.7, 14.2, 16.7, 19.2];
    roomXs.forEach((rx, idx) => {
      PHSprites.examTable(rx + 0.1, 1.4, 0, { col: '#10b981' });
      PHSprites.privacyCurtain(rx + 0.1, 2.9, 0, 1.7, '#bae6fd');
      PHSprites.officeDesk(rx + 0.1, 4.3, 0, {
        clutter: isCur,
        screenStyle: isCur ? 'paper' : 'ok',
        seed: 20 + idx,
        visitorChair: true
      });
    });

    // ---------------- 3. C2 DIAGNOSTIC IMAGING WING — CT + 3T MRI + CONTROL BOOTH (x: 21.5..33, y: 1..8.5)
    PHSprites.ctScanner(22.2, 1.4, 0, { active: true });
    PHSprites.examTable(25.2, 1.8, 0, { col: '#38bdf8' });
    PHSprites.mriScanner(27.8, 1.4, 0, { active: !isCur });
    PHSprites.examTable(30.8, 1.8, 0, { col: '#10b981' });
    // Lead-Glass Control Booth Consoles (Paper Reject vs CPOE Hard-Stop)
    PHSprites.officeDesk(22.2, 6.1, 0, { clutter: isCur, screenStyle: isCur ? 'alert' : 'ok', seed: 31, visitorChair: false });
    PHSprites.officeDesk(25.0, 6.1, 0, { clutter: isCur, screenStyle: 'ecg', seed: 32, visitorChair: false });
    PHSprites.officeDesk(28.2, 6.1, 0, { clutter: isCur, screenStyle: isCur ? 'alert' : 'ok', seed: 33, visitorChair: false });

    // ---------------- 4. INPATIENT WARD 4A & 4B — 8 HOSPITAL BEDS (x: 1..11, y: 11..19)
    const wardBlanket = '#0ea5e9';
    const bedCoords = [
      [1.4, 11.6], [4.2, 11.6], [7.0, 11.6],
      [1.4, 14.2], [4.2, 14.2], [7.0, 14.2],
      [1.4, 16.8], [4.2, 16.8]
    ];
    bedCoords.forEach(([bx, by], idx) => {
      PHSprites.hospitalBed(bx, by, 0, { blanket: wardBlanket, alert: isCur && idx < 4, ready: !isCur, seed: 40 + idx });
    });
    PHSprites.receptionDesk(8.8, 15.2, 1, 2.4, { col: '#0284c7', clutter: isCur });

    // ---------------- 5. DISCHARGE LOUNGE & MAIN ENTRANCE (x: 11..16, y: 11..19)
    PHSprites.sofa(11.6, 12.0, 1, 2.2, '#10b981');
    PHSprites.sofa(11.6, 15.0, 1, 2.2, '#0ea5e9');
    PHSprites.kiosk(14.6, 12.2, 1, { col: '#10b981' });
    PHSprites.vendingAndWater(14.5, 14.2, 0);

    // ---------------- 6. C3 CENTRAL PHARMACY & e-KANBAN ROBOTIC DISPENSING (x: 16..25.5, y: 11..19)
    PHSprites.receptionDesk(16.6, 11.6, 0, 3.6, { col: '#10b981', clutter: isCur });
    PHSprites.pharmacyShelf(16.6, 14.4, 0, { stockout: isCur, rfid: !isCur });
    PHSprites.pharmacyShelf(16.6, 16.0, 0, { stockout: isCur, rfid: !isCur });
    PHSprites.pharmacyShelf(16.6, 17.6, 0, { stockout: isCur, rfid: !isCur });
    PHSprites.roboticDispenser(21.4, 12.2, 0);
    PHSprites.pharmacyShelf(21.4, 15.6, 0, { stockout: isCur, rfid: !isCur });
    PHSprites.waitingBench(21.2, 17.4, 0, 4, '#475569');

    // ---------------- 7. C5 RECEPTION APPOINTMENT & HIS BOOKING SYNC (x: 25.5..33, y: 11..19)
    PHSprites.officeDesk(26.2, 12.0, 0, { clutter: isCur, screenStyle: isCur ? 'alert' : 'ok', seed: 51 });
    PHSprites.officeDesk(29.2, 12.0, 0, { clutter: isCur, screenStyle: isCur ? 'alert' : 'ui', seed: 52 });
    PHSprites.officeDesk(26.2, 14.8, 0, { clutter: isCur, screenStyle: isCur ? 'alert' : 'ok', seed: 53 });
    PHSprites.officeDesk(29.2, 14.8, 0, { clutter: isCur, screenStyle: 'ui', seed: 54 });
    PHSprites.pharmacyShelf(26.2, 17.2, 0, { stockout: false, rfid: !isCur });
    PHSprites.pharmacyShelf(29.2, 17.2, 0, { stockout: false, rfid: !isCur });

    // ---------------- 8. 52 ARTICULATED DOCTORS, NURSES, PHARMACISTS, STAFF & PATIENTS
    simState.agents.forEach(ag => {
      const isSel = ag.id === simState.selectedAgentId;
      const inBed = ag.pose === 'LYING_ON_BED' || ag.pose === 'IN_SCANNER';
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: inBed ? 9.0 : 0,
        pose: ag.pose,
        dir: ag.dir,
        role: ag.role,
        seed: ag.idNum || 1,
        axis: ag.pose === 'IN_SCANNER' ? 'y' : 'x',
        head: -1,
        blanket: ag.pose === 'LYING_ON_BED' ? '#38bdf8' : null,
        label: ag.roleLabel || '',
        sub: '',
        forceLabel: true,
        sel: isSel,
        showBubble: !!ag.showBubble,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType,
        bubbleOffsetY: inBed ? 12 : 24,
        taskProg: ag.taskProg
      });
    });

    PH.end();

    // Complaint-Aligned Zone Signs (C1, C2, C3, C5)
    PHSprites.roomSign(5.0, 0.85, isCur ? 'C1: Outpatient Queue (68m No-ETA)' : 'C1: Wave-Scheduled ETA (12m ✓)', isCur ? '#ef4444' : '#10b981');
    PHSprites.roomSign(15.2, 0.85, 'Specialist Consultation Rooms 1–5', '#0ea5e9');
    PHSprites.roomSign(27.2, 0.85, isCur ? 'C2: Radiology (40% Walk-Backs)' : 'C2: CPOE Hard-Stop CT (99% ✓)', isCur ? '#ef4444' : '#10b981');
    PHSprites.roomSign(6.0, 10.95, 'Inpatient Ward 4A & 4B', '#0ea5e9');
    PHSprites.roomSign(13.5, 10.95, 'Discharge Lounge', '#10b981');
    PHSprites.roomSign(20.8, 10.95, isCur ? 'C3: Pharmacy (92m Stockout)' : 'C3: e-Kanban Pharmacy (18m ✓)', isCur ? '#ef4444' : '#10b981');
    PHSprites.roomSign(29.2, 10.95, isCur ? 'C5: HIS Conflict (SMS≠Phone)' : 'C5: SSOT HIS Sync (99.9% ✓)', isCur ? '#ef4444' : '#a855f7');
    PHSprites.roomSign(13.5, 18.8, 'MSH Main Entrance ↓', '#0ea5e9');

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
