// ============================================================================
// BAHM330-A2: Meridian Specialist Hospital — Realistic Hospital Floorplan (v2.1)
// - Rear Clinical Wing (y: 1..8.5, across central corridor):
//   1. Inpatient Ward 4A & 4B — 7 Hospital Beds & Nurse Station (x: 1..9)
//   2. Specialist Consultation Pod — 5 Consultation Rooms (x: 9..21.5)      — C1
//   3. Diagnostic Imaging Wing — CT, 3T MRI & Control Booth (x: 21.5..33)   — C2
// - Central Hospital Thoroughfare Corridor (y: 8.5..11)
// - Front Public & Outpatient Wing (y: 11..19, along Main Entrance y = 19):
//   4. Appointment & Booking Office — Call Centre, RIS & Clinic Lists (x: 1..9) — C5
//   5. Main Entrance Lobby, C1 Reception, Kiosks & Waiting Hall (x: 9..22)  — C1
//   6. C3 Discharge Pharmacy & Discharge Lounge Exit (x: 22..33)            — C3
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 34;
  const GRID_H = 21;

  const MAP = {
    proj: { ax: 42, ay: 2, bx: -10, by: 28 },
    bounds: { x0: 0.5, y0: 0.5, x1: 33.5, y1: 20.2 },
    view: { x0: 0.5, y0: 0.5, x1: 33.5, y1: 20.2 },
    ground: [
      // Rear Clinical Wing (y: 1..8.5) — 100% Identical Flooring in Both Modes
      { x: 1, y: 1, w: 8, d: 7.5, mat: 'linoBlue' },                 // 1. Inpatient Ward 4A & 4B
      { x: 9, y: 1, w: 12.5, d: 7.5, mat: 'linoMint' },              // 2. Consultation Rooms 1-5 (C1)
      { x: 21.5, y: 1, w: 11.5, d: 7.5, mat: 'ceramicBlue' },        // 3. Diagnostic Imaging (C2)

      // Central Hospital Corridor (y: 8.5..11)
      { x: 1, y: 8.5, w: 32, d: 2.5, mat: 'terrazzo' },

      // Front Public & Outpatient Wing (y: 11..19, along Main Entrance at y = 19)
      { x: 1, y: 11, w: 8, d: 8, mat: 'carpetTeal' },                // 4. C5 Appointment & Booking Office
      { x: 9, y: 11, w: 13, d: 8, mat: 'linoBlue' },                 // 5. Main Entrance, C1 Reception & Waiting Hall
      { x: 15.4, y: 11.8, w: 5.8, d: 6.4, mat: 'carpetBlue' },       // Outpatient waiting seating carpet
      { x: 22, y: 11, w: 11, d: 8, mat: 'ceramic' },                 // 6. C3 Discharge Pharmacy & Lounge
      { x: 29.2, y: 11.6, w: 3.4, d: 6.8, mat: 'oak' },              // Discharge lounge seating strip

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
      // Bottom Front Wall (y = 19) — Main Entrance opens directly into C1 Reception & Waiting Hall (x = 13.8..17.0)
      // and Pharmacy/Discharge Exit opens at x = 27.2..29.6
      {
        x1: 1, y1: 19, x2: 33, y2: 19, kind: 'ext', col: '#e2e8f0', windows: true,
        open: [
          { at: 13.8, w: 3.2, type: 'slide', alwaysOpen: true },
          { at: 27.2, w: 2.4, type: 'slide', alwaysOpen: true }
        ]
      },

      // North Clinical Wing Corridor Wall (y = 8.5)
      {
        x1: 1, y1: 8.5, x2: 33, y2: 8.5, kind: 'int', col: '#cbd5e1',
        open: [
          { at: 4.5, w: 2.0, type: 'double' },
          { at: 9.7, w: 1.1, type: 'door' },
          { at: 12.2, w: 1.1, type: 'door' },
          { at: 14.7, w: 1.1, type: 'door' },
          { at: 17.2, w: 1.1, type: 'door' },
          { at: 19.7, w: 1.1, type: 'door' },
          { at: 23.2, w: 1.6, type: 'double' },
          { at: 28.8, w: 1.6, type: 'double' }
        ]
      },
      // Partitions for Inpatient Ward & 5 Consultation Rooms (x: 9, 11.5, 14, 16.5, 19, 21.5)
      { x1: 9, y1: 1, x2: 9, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 11.5, y1: 1, x2: 11.5, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 14.0, y1: 1, x2: 14.0, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 16.5, y1: 1, x2: 16.5, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 19.0, y1: 1, x2: 19.0, y2: 8.5, kind: 'int', col: '#cbd5e1' },
      { x1: 21.5, y1: 1, x2: 21.5, y2: 8.5, kind: 'int', col: '#cbd5e1' },

      // Diagnostic Imaging Partitions (CT Room, 3T MRI Room, Control Booth)
      { x1: 27.2, y1: 1, x2: 27.2, y2: 8.5, kind: 'glass', col: '#94a3b8' },
      { x1: 21.5, y1: 5.5, x2: 33, y2: 5.5, kind: 'glass', open: [{ at: 23.5, w: 1.3, type: 'door' }, { at: 29.0, w: 1.3, type: 'door' }] },

      // South Public Wing Corridor Wall (y = 11) — Main Waiting Lobby opens across corridor to Consult Rooms
      {
        x1: 1, y1: 11, x2: 33, y2: 11, kind: 'int', col: '#cbd5e1',
        open: [
          { at: 4.5, w: 1.8, type: 'slide' },
          { at: 13.8, w: 3.0, type: 'slide', alwaysOpen: true },
          { at: 27.2, w: 2.4, type: 'slide', alwaysOpen: true }
        ]
      },
      { x1: 9, y1: 11, x2: 9, y2: 19, kind: 'glass', open: [{ at: 14.5, w: 1.5, type: 'door' }] },
      { x1: 22, y1: 11, x2: 22, y2: 19, kind: 'glass', open: [{ at: 14.5, w: 1.5, type: 'door' }] }
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

  // Freestanding front-facing status display (screen faces +y so it is visible to the camera)
  function statusBoard(x, y, w, style, seed) {
    PH.furniture(x, y, w, 0.32, 0, k => {
      k.box(w / 2 - 0.26, 0.04, 0, 0.52, 0.24, 1.0, '#334155');
      k.box(w / 2 - 0.06, 0.10, 1.0, 0.12, 0.10, 11.4, '#64748b');
      k.box(0.02, 0.08, 12.2, w - 0.04, 0.12, 11.6, '#0f172a');
      k.part(w / 2, 0.24, 3, () => k.now.screen('+v', 0.2, 0.08, w - 0.08, 12.8, 23.2, style, seed));
    });
  }

  // ---------------------------------------------------------------------------
  // REALISTIC HOSPITAL CLINICAL & OPERATIONAL EQUIPMENT
  // ---------------------------------------------------------------------------

  // 1. Inpatient Ward: Rolling Bedside Vitals Monitor + Chrome IV Infusion Stand
  function drawBedsideVitalsAndIV(x, y, seed) {
    PH.furniture(x, y, 0.48, 0.48, 0, k => {
      // 5-star rolling base & chrome IV pole
      k.cyl(0.24, 0.24, 0, 0.16, 0.8, '#475569');
      k.cyl(0.16, 0.18, 0.8, 0.03, 18.5, '#cbd5e1');
      // Dual volumetric IV infusion pump modules clamped to pole
      k.box(0.08, 0.10, 8.5, 0.18, 0.16, 3.2, '#0284c7');
      k.box(0.10, 0.26, 9.0, 0.12, 0.03, 2.2, '#38bdf8');
      // Hanging saline & anticoagulant IV drip bags at top of pole
      k.box(0.06, 0.12, 16.5, 0.10, 0.08, 2.4, '#bae6fd', { alpha: 0.78 });
      k.box(0.20, 0.12, 16.5, 0.10, 0.08, 2.4, '#fde68a', { alpha: 0.78 });
      // Bedside multiparameter ECG/SpO2 patient monitor on articulated arm
      k.box(0.22, 0.20, 11.2, 0.24, 0.14, 4.2, '#0f172a');
      k.part(0.34, 0.35, 3, () => {
        k.now.screen('+v', 0.35, 0.24, 0.44, 11.6, 15.0, 'ecg', seed || 1);
      });
    });
  }

  // 2. Inpatient Ward: Red Emergency Resuscitation Crash Cart + Defibrillator + O2 Cylinder
  function drawCrashCart(x, y) {
    PH.furniture(x, y, 0.86, 0.58, 0, k => {
      // Caster base & red 5-drawer steel cabinet
      k.box(0.04, 0.04, 0, 0.78, 0.50, 1.2, '#1e293b');
      k.box(0.06, 0.06, 1.2, 0.74, 0.46, 10.4, '#dc2626');
      // White drawer pulls & yellow cardiac arrest seal strip
      for (let d = 0; d < 4; d++) {
        k.box(0.12, 0.52, 2.2 + d * 2.3, 0.62, 0.03, 1.5, '#fca5a5');
      }
      // Stainless worktop rim
      k.box(0.04, 0.04, 11.6, 0.78, 0.50, 0.8, '#e2e8f0');
      // Biphasic defibrillator / AED monitor on top
      k.box(0.10, 0.10, 12.4, 0.36, 0.30, 4.4, '#1e293b');
      k.box(0.14, 0.40, 13.0, 0.28, 0.03, 3.0, '#4ade80');
      // Suction canister + green medical oxygen cylinder on side bracket
      k.cyl(0.62, 0.24, 12.4, 0.09, 3.4, '#bae6fd');
      k.cyl(0.80, 0.28, 2.0, 0.08, 11.5, '#15803d');
      k.cyl(0.80, 0.28, 13.5, 0.06, 1.6, '#cbd5e1');
    });
  }

  // 3. Consultation Rooms: Mobile Ultrasound / Diagnostic Vitals Cart + Doctor Stool + Handwash Basin
  function drawConsultEquipment(rx, seed) {
    // Mobile diagnostic ultrasound & otoscope/BP cart beside exam table
    PH.furniture(rx + 1.48, 1.35, 0.66, 0.58, 0, k => {
      k.box(0.06, 0.06, 0, 0.54, 0.46, 1.0, '#475569');
      k.cyl(0.33, 0.28, 1.0, 0.06, 9.2, '#cbd5e1');
      // Instrument tray & blood pressure cuff basket
      k.box(0.08, 0.08, 6.2, 0.50, 0.42, 1.4, '#f8fafc');
      k.box(0.06, 0.06, 10.2, 0.54, 0.46, 1.2, '#e2e8f0');
      // Articulated diagnostic screen + transducer probes
      k.box(0.12, 0.14, 11.4, 0.42, 0.10, 4.8, '#0f172a');
      k.part(0.33, 0.25, 3, () => {
        k.now.screen('+v', 0.25, 0.15, 0.51, 11.8, 15.8, 'ecg', seed);
      });
    });
    // Rolling chrome doctor exam stool
    PH.furniture(rx + 1.45, 2.25, 0.44, 0.44, 0, k => {
      k.cyl(0.22, 0.22, 0, 0.16, 0.8, '#64748b');
      k.cyl(0.22, 0.22, 0.8, 0.03, 3.8, '#cbd5e1');
      k.cyl(0.22, 0.22, 4.6, 0.18, 1.4, '#0284c7');
    });
    // Clinical hand-wash sink & wall PACS X-ray lightbox on back wall (y = 1.1)
    PH.furniture(rx + 1.55, 3.25, 0.58, 0.52, 0, k => {
      // Ceramic clinical basin & chrome gooseneck tap + blue sanitizer dispenser
      k.box(0.08, 0.06, 0, 0.42, 0.38, 8.2, '#e2e8f0');
      k.box(0.04, 0.04, 8.2, 0.50, 0.44, 1.6, '#ffffff');
      k.box(0.12, 0.10, 9.8, 0.34, 0.28, 0.4, '#bae6fd');
      k.cyl(0.28, 0.08, 9.8, 0.03, 2.4, '#94a3b8');
      k.box(0.44, 0.06, 12.2, 0.10, 0.08, 2.2, '#0ea5e9');
    });
  }

  // 4. C2 Diagnostic Imaging: Dual-Head Contrast Media Power Injector, eGFR Point-of-Care Analyzer & Lead Apron Rack
  function drawImagingEquipment() {
    // Dual-head CT contrast power injector stand (A8: contrast-safety & renal eGFR check)
    PH.furniture(24.45, 1.55, 0.58, 0.58, 0, k => {
      k.cyl(0.29, 0.29, 0, 0.20, 1.0, '#475569');
      k.cyl(0.29, 0.29, 1.0, 0.04, 11.0, '#cbd5e1');
      // Tilted dual-syringe contrast & saline injector head
      k.box(0.10, 0.14, 12.0, 0.38, 0.28, 2.6, '#0f172a');
      k.cyl(0.20, 0.28, 14.6, 0.06, 2.8, '#38bdf8');
      k.cyl(0.38, 0.28, 14.6, 0.06, 2.8, '#e2e8f0');
      // Point-of-care renal function (creatinine/eGFR) analyzer pod on pedestal
      k.box(0.12, 0.16, 7.5, 0.34, 0.26, 2.4, '#10b981');
    });
    // 3T MRI non-ferromagnetic anesthesia & physiological telemetry monitor cart
    PH.furniture(30.25, 1.55, 0.62, 0.58, 0, k => {
      k.box(0.06, 0.06, 0, 0.50, 0.46, 10.5, '#e2e8f0');
      k.box(0.04, 0.04, 10.5, 0.54, 0.50, 1.0, '#10b981');
      k.box(0.10, 0.14, 11.5, 0.42, 0.10, 4.8, '#0f172a');
      k.part(0.31, 0.25, 3, () => {
        k.now.screen('+v', 0.25, 0.13, 0.49, 11.9, 15.9, 'ecg', 39);
      });
    });
    // Radiation-shielding lead apron mobile hanger rack & thyroid collars in Control Booth
    PH.furniture(31.5, 7.1, 1.15, 0.56, 0, k => {
      k.box(0.06, 0.12, 0, 1.03, 0.32, 1.0, '#475569');
      k.cyl(0.12, 0.28, 1.0, 0.04, 15.5, '#cbd5e1');
      k.cyl(1.03, 0.28, 1.0, 0.04, 15.5, '#cbd5e1');
      k.box(0.10, 0.24, 16.2, 0.95, 0.08, 0.8, '#cbd5e1');
      // 3 Hanging lead radiation aprons
      k.box(0.18, 0.16, 4.2, 0.22, 0.24, 11.6, '#0284c7');
      k.box(0.46, 0.16, 4.2, 0.22, 0.24, 11.6, '#0d9488');
      k.box(0.74, 0.16, 4.2, 0.22, 0.24, 11.6, '#0284c7');
    });
  }

  // 5. C5 Booking Office: Appointment Server Rack & Printer Unit
  function drawBookingInfrastructure() {
    PH.furniture(7.3, 12.0, 1.25, 0.85, 0, k => {
      k.box(0.06, 0.06, 0, 1.13, 0.73, 10.5, '#94a3b8');
      k.box(0.12, 0.12, 10.5, 0.52, 0.56, 4.8, '#e2e8f0');
      k.box(0.72, 0.16, 10.5, 0.34, 0.42, 4.6, '#cbd5e1');
      k.box(0.18, 0.22, 15.3, 0.38, 0.40, 1.2, '#0284c7');
    });
    PH.furniture(7.3, 14.8, 1.25, 1.2, 0, k => {
      k.box(0.06, 0.06, 0, 1.13, 1.08, 20.0, '#0f172a');
      k.box(0.04, 0.04, 20.0, 1.17, 1.12, 1.5, '#10b981');
      for (let b = 0; b < 4; b++) {
        k.box(0.10, 1.12, 3.0 + b * 4.0, 0.95, 0.04, 1.4, b % 2 === 0 ? '#10b981' : '#0ea5e9');
      }
    });
  }

  // 6. C1 Front Lobby: Automated Vitals Triage Pod (Stadiometer, BP Cuff, Oximeter) & Patient Wheelchairs
  function drawFrontLobbyEquipment() {
    // Automated Triage Vitals Pod next to Triage Nurse (x = 11.0, y = 13.4)
    PH.furniture(11.0, 13.3, 0.92, 0.78, 0, k => {
      // Digital platform scale & vertical stadiometer height rod
      k.box(0.06, 0.06, 0, 0.42, 0.42, 1.2, '#334155');
      k.cyl(0.27, 0.10, 1.2, 0.03, 18.5, '#cbd5e1');
      k.box(0.15, 0.08, 19.2, 0.24, 0.18, 0.8, '#0ea5e9');
      // Automated blood-pressure cuff & SpO2 pulse oximeter stand
      k.box(0.54, 0.12, 0, 0.34, 0.48, 9.8, '#e2e8f0');
      k.box(0.52, 0.10, 9.8, 0.38, 0.52, 1.0, '#10b981');
      k.cyl(0.68, 0.34, 10.8, 0.11, 2.2, '#0284c7');
      k.box(0.58, 0.16, 10.8, 0.24, 0.10, 3.6, '#0f172a');
    });
    // Ready Hospital Wheelchairs parked neatly beside Main Front Entrance (x = 12.2, y = 17.2)
    for (let i = 0; i < 2; i++) {
      PH.furniture(11.9 + i * 0.82, 17.2, 0.72, 0.72, 0, k => {
        // Large rear wheels & chrome frame
        k.cyl(0.12, 0.36, 0, 0.06, 4.2, '#1e293b');
        k.cyl(0.60, 0.36, 0, 0.06, 4.2, '#1e293b');
        // Blue vinyl seat & backrest + push handles
        k.box(0.14, 0.14, 4.0, 0.44, 0.42, 1.2, '#0284c7');
        k.box(0.14, 0.12, 5.2, 0.44, 0.08, 6.2, '#0369a1');
        k.box(0.10, 0.14, 7.2, 0.06, 0.42, 0.8, '#cbd5e1');
        k.box(0.56, 0.14, 7.2, 0.06, 0.42, 0.8, '#cbd5e1');
      });
    }
  }

  // 7. C3 Discharge Pharmacy: Cold-Chain Biologics Fridge, Item X Safety Stock Vault & Packaging Bench
  function drawPharmacyEquipment() {
    // Glass-door Cold-Chain Biologics & Vaccine Refrigerator (2°C–8°C)
    PH.furniture(24.3, 16.5, 1.15, 0.72, 0, k => {
      k.box(0.04, 0.04, 0, 1.07, 0.64, 21.5, '#f8fafc');
      k.box(0.02, 0.02, 21.5, 1.11, 0.68, 2.0, '#0284c7');
      // Illuminated glass front door & cold-chain vaccine trays
      k.box(0.10, 0.64, 2.2, 0.95, 0.06, 18.2, '#bae6fd', { alpha: 0.65 });
      for (let s = 0; s < 3; s++) {
        k.box(0.14, 0.14, 4.5 + s * 5.2, 0.87, 0.44, 1.8, '#38bdf8');
      }
    });
    // Stainless Compounding, Barcode Verification & Unit-Dose Packaging Table behind counter
    PH.furniture(24.3, 18.0, 1.35, 0.68, 0, k => {
      k.box(0.06, 0.06, 0, 1.23, 0.56, 10.2, '#cbd5e1');
      k.box(0.02, 0.02, 10.2, 1.31, 0.64, 1.2, '#f8fafc');
      // Thermal Rx label printer, barcode scanner & medicine tote bins
      k.box(0.14, 0.16, 11.4, 0.30, 0.28, 2.6, '#1e293b');
      k.box(0.54, 0.14, 11.4, 0.34, 0.34, 2.4, '#10b981');
      k.box(0.94, 0.14, 11.4, 0.30, 0.34, 2.4, '#0ea5e9');
    });
  }

  function render(simState) {
    const isCur = simState.mode === 'current';
    PH.setCondition(isCur ? 'cur' : 'fut');
    PH.begin(simState.elapsedSec);

    // ---------------- 1. REAR-LEFT: INPATIENT WARD 4A & 4B — 7 BEDS & NURSE STATION (x: 1..9, y: 1..8.5)
    const wardBlanket = '#0ea5e9';
    const bedCoords = [
      [1.3, 1.4], [3.9, 1.4], [6.5, 1.4],
      [1.3, 3.8], [3.9, 3.8], [6.5, 3.8],
      [1.3, 6.2]
    ];
    bedCoords.forEach(([bx, by], idx) => {
      PHSprites.hospitalBed(bx, by, 0, { blanket: wardBlanket, ready: true, seed: 40 + idx });
      if (idx < 6) {
        drawBedsideVitalsAndIV(bx + 2.08, by + 0.08, 70 + idx);
      }
    });
    drawCrashCart(3.8, 6.3);
    PHSprites.receptionDesk(6.6, 5.5, 1, 2.2, { col: '#0284c7', clutter: false });

    // ---------------- 2. REAR-CENTER: 5 SPECIALIST CONSULTATION ROOMS (x: 9..21.5, y: 1..8.5)
    const roomXs = [9.2, 11.7, 14.2, 16.7, 19.2];
    roomXs.forEach((rx, idx) => {
      PHSprites.examTable(rx + 0.1, 1.4, 0, { col: '#10b981' });
      drawConsultEquipment(rx, 80 + idx);
      PHSprites.privacyCurtain(rx + 0.1, 2.9, 0, 1.7, '#bae6fd');
      PHSprites.officeDesk(rx + 0.1, 4.3, 0, {
        clutter: false,
        screenStyle: 'ok',
        seed: 20 + idx,
        visitorChair: true
      });
    });

    // ---------------- 3. REAR-RIGHT: C2 DIAGNOSTIC IMAGING WING — CT + 3T MRI + CONTROL BOOTH (x: 21.5..33, y: 1..8.5)
    PHSprites.ctScanner(22.2, 1.4, 0, { active: true });
    PHSprites.examTable(25.2, 1.8, 0, { col: '#38bdf8' });
    PHSprites.mriScanner(27.8, 1.4, 0, { active: true });
    PHSprites.examTable(30.8, 1.8, 0, { col: '#10b981' });
    drawImagingEquipment();
    PHSprites.officeDesk(22.2, 6.1, 0, { clutter: false, screenStyle: 'ok', seed: 31, visitorChair: false });
    PHSprites.officeDesk(25.0, 6.1, 0, { clutter: false, screenStyle: 'ecg', seed: 32, visitorChair: false });
    PHSprites.officeDesk(28.2, 6.1, 0, { clutter: false, screenStyle: 'ok', seed: 33, visitorChair: false });
    statusBoard(30.6, 6.2, 1.6, 'ui', 34);

    // ---------------- 4. FRONT-LEFT: C5 APPOINTMENT & BOOKING OFFICE (x: 1..9, y: 11..19)
    PHSprites.officeDesk(1.8, 12.2, 0, { clutter: false, screenStyle: 'ok', seed: 51, visitorChair: false });
    PHSprites.officeDesk(5.2, 12.2, 0, { clutter: false, screenStyle: 'ui', seed: 52, visitorChair: false });
    PHSprites.officeDesk(1.8, 15.0, 0, { clutter: false, screenStyle: 'ok', seed: 53, visitorChair: false });
    PHSprites.officeDesk(5.2, 15.0, 0, { clutter: false, screenStyle: 'ok', seed: 54, visitorChair: false });
    drawBookingInfrastructure();
    statusBoard(1.7, 17.3, 5.6, 'wall', 64);

    // ---------------- 5. FRONT-CENTER: MAIN ENTRANCE LOBBY, C1 RECEPTION, KIOSKS & WAITING HALL (x: 9..22, y: 11..19)
    PHSprites.receptionDesk(9.5, 11.8, 1, 3.4, { col: '#0284c7', clutter: false });
    drawFrontLobbyEquipment();
    PHSprites.kiosk(9.6, 15.8, 1, { col: '#10b981' });
    PHSprites.kiosk(9.6, 17.0, 1, { col: '#0ea5e9' });
    PHSprites.waitingBench(16.2, 12.4, 0, 6, '#0284c7');
    PHSprites.waitingBench(16.2, 13.9, 0, 6, '#0284c7');
    PHSprites.waitingBench(16.2, 15.4, 0, 6, '#0284c7');
    PHSprites.waitingBench(16.2, 16.9, 0, 6, '#0284c7');
    PHSprites.planter(11.1, 17.6, 0.75, 0.75);
    statusBoard(12.2, 11.4, 1.4, 'ui', 11);
    PHSprites.vendingAndWater(19.8, 11.4, 0);

    // ---------------- 6. FRONT-RIGHT: C3 DISCHARGE & OUTPATIENT PHARMACY + DISCHARGE LOUNGE EXIT (x: 22..33, y: 11..19)
    statusBoard(22.5, 11.4, 1.8, 'ui', 45);
    PHSprites.pharmacyShelf(22.4, 12.8, 0, { stockout: false, rfid: true });
    PHSprites.pharmacyShelf(22.4, 14.6, 0, { stockout: false, rfid: true });
    PHSprites.pharmacyShelf(22.4, 16.4, 0, { stockout: false, rfid: true });
    PHSprites.pharmacyShelf(22.4, 18.0, 0, { stockout: false, rfid: true });
    drawPharmacyEquipment();
    PHSprites.receptionDesk(24.6, 12.2, 1, 3.8, { col: '#10b981', clutter: false });
    PHSprites.sofa(29.8, 12.2, 1, 2.2, '#10b981');
    PHSprites.sofa(29.8, 15.2, 1, 2.2, '#0ea5e9');
    PHSprites.waitingBench(26.8, 17.2, 0, 4, '#0284c7');
    PHSprites.planter(31.6, 17.6, 0.75, 0.75);

    // ---------------- 8. 52 ARTICULATED DOCTORS, NURSES, PHARMACISTS, STAFF & PATIENTS
    simState.agents.forEach(ag => {
      const isSel = ag.id === simState.selectedAgentId;
      const inBed = ag.pose === 'LYING_ON_BED' || ag.pose === 'IN_SCANNER';
      const isPatientRole = ag.role === 'resident' || ag.role === 'elderly' || ag.role === 'gown' || ag.role === 'patient';
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
        label: isPatientRole ? '' : (ag.roleLabel || ''),
        forceLabel: false,
        sel: isSel,
        showBubble: !!ag.showBubble,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType,
        bubbleAlpha: ag.bubbleAlpha,
        bubbleOffsetY: inBed ? 12 : 24,
        taskProg: ag.taskProg
      });
    });

    PH.end();

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
