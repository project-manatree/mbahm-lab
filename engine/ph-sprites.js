/* ============================================================================
 * PH-SPRITES · Project Hospital (2018) Multi-Part Procedural Asset Library
 * Works with PH (ph-engine.js) to render detailed medical & resort furniture,
 * diagnostic scanners, textiles, landscaping, and animated vehicles.
 * ========================================================================== */
(function (global) {
  'use strict';

  const PH = global.PH;
  const { shade, rgba } = PH;

  // --------------------------------------------------- 1. CLINICAL BEDS & EXAM
  function hospitalBed(x, y, rot, opts = {}) {
    const blanket = opts.blanket || '#3b82f6';
    const alert = opts.alert;
    const ready = opts.ready;
    PH.furniture(x, y, 2.1, 1.15, rot, k => {
      // Woven under-bed floor mat
      k.top(0.05, 0.05, 0.1, 2.0, 1.05, '#cbd5e1', { stroke: 'rgba(100,116,139,0.35)' });
      // Caster wheels
      k.cyl(0.2, 0.18, 0, 0.07, 2.5, '#334155');
      k.cyl(1.88, 0.18, 0, 0.07, 2.5, '#334155');
      k.cyl(0.2, 0.96, 0, 0.07, 2.5, '#334155');
      k.cyl(1.88, 0.96, 0, 0.07, 2.5, '#334155');
      // Steel lower chassis
      k.box(0.14, 0.14, 2.5, 1.82, 0.86, 2.5, '#94a3b8');
      // Headboard & footboard (Project Hospital blue-grey ABS plastic panels)
      k.box(0.08, 0.1, 2.5, 0.12, 0.94, 15, '#e2e8f0');
      k.box(0.1, 0.18, 8, 0.09, 0.78, 7, '#60a5fa');
      k.box(1.92, 0.12, 2.5, 0.1, 0.9, 11, '#e2e8f0');
      k.box(1.93, 0.22, 6, 0.08, 0.7, 5, '#93c5fd');
      // Mattress (cream orthopaedic foam)
      k.box(0.2, 0.14, 5, 1.72, 0.86, 4.2, '#f8fafc', { tex: 'fabric', texAlpha: 0.35 });
      // Quilted hospital blanket with crisp white top sheet fold
      k.box(0.68, 0.13, 5.4, 1.22, 0.88, 4.3, blanket, { tex: 'quilt', texAlpha: 0.45 });
      k.box(0.58, 0.13, 5.5, 0.16, 0.88, 4.3, '#ffffff');
      // 2 Plump angled pillows
      k.box(0.24, 0.18, 9.2, 0.3, 0.34, 2.4, '#ffffff');
      k.box(0.24, 0.6, 9.2, 0.3, 0.34, 2.4, '#ffffff');
      // Side safety rails (chrome bars)
      k.box(0.45, 0.1, 9.5, 1.15, 0.04, 3.2, '#cbd5e1');
      k.box(0.45, 1.0, 9.5, 1.15, 0.04, 3.2, '#cbd5e1');
      // Foot-of-bed medical chart clipboard
      k.box(1.98, 0.42, 7.5, 0.08, 0.3, 4.5, alert ? '#ef4444' : ready ? '#10b981' : '#f59e0b');
      // Wall headwall gas/power strip
      k.box(0.0, 0.08, 14, 0.07, 0.98, 5, '#cbd5e1');
      k.box(0.01, 0.22, 15, 0.06, 0.12, 3, '#ef4444'); // O2 outlet
      k.box(0.01, 0.42, 15, 0.06, 0.12, 3, '#facc15'); // Vacuum
      k.box(0.01, 0.62, 15, 0.06, 0.12, 3, '#38bdf8'); // Medical air
      // Bedside locker cabinet + water pitcher
      if (opts.locker !== false) {
        k.box(0.18, -0.38, 0, 0.44, 0.36, 11, '#e2e8f0');
        k.box(0.16, -0.4, 11, 0.48, 0.4, 1.2, '#94a3b8');
        k.cyl(0.38, -0.22, 12.2, 0.07, 3.2, '#38bdf8');
      }
      // IV Pole + Saline drip bag
      if (opts.iv !== false) {
        k.cyl(0.28, 1.22, 0, 0.12, 1.2, '#64748b');
        k.cyl(0.28, 1.22, 1, 0.025, 22, '#cbd5e1');
        k.box(0.22, 1.16, 19, 0.12, 0.12, 3.8, '#7dd3fc', { alpha: 0.85 });
      }
      // Bedside multi-parameter vital-signs monitor on stand
      if (opts.monitor !== false) {
        k.cyl(0.65, -0.32, 0, 0.12, 1.2, '#475569');
        k.cyl(0.65, -0.32, 1.2, 0.03, 13, '#94a3b8');
        k.box(0.48, -0.46, 14, 0.36, 0.24, 6.5, '#1e293b');
        k.part(0.65, -0.2, 3, () => {
          k.now.screen('+v', -0.21, 0.5, 0.82, 14.6, 19.8, alert ? 'ecgAlarm' : 'ecg', opts.seed || 1);
        });
      }
    });
  }

  function luxuryBed(x, y, rot, opts = {}) {
    const duvet = opts.duvet || '#0d9488';
    const runner = opts.runner || '#115e59';
    PH.furniture(x, y, 2.2, 1.5, rot, k => {
      // Soft cream travertine-toned woven area rug under the king recovery bed
      k.top(-0.06, -0.10, 0.1, 2.32, 1.70, '#f5efe6', { stroke: '#cbd5e1' });
      // Crisp white king recovery platform frame with warm oak trim
      k.box(0.08, 0.12, 0, 1.98, 1.26, 5.2, '#f8fafc');
      k.box(0.06, 0.10, 0, 2.02, 1.30, 1.4, '#d4a373', { tex: 'deskwood', texAlpha: 0.45 });
      // Crisp white clinical-luxury headboard with soft padded panel
      k.box(0.04, 0.06, 0, 0.15, 1.38, 20, '#f8fafc');
      k.box(0.16, 0.14, 5.5, 0.07, 1.22, 12.5, '#ffffff', { tex: 'quilt', texAlpha: 0.35 });
      k.box(0.03, 0.05, 19.5, 0.17, 1.40, 1.4, '#d4a373');
      // Thick white orthopaedic pillow-top mattress
      k.box(0.20, 0.15, 5.2, 1.82, 1.20, 4.8, '#ffffff', { tex: 'fabric', texAlpha: 0.25 });
      // Teal quilted duvet + folded dark-teal runner at foot of bed
      k.box(0.64, 0.14, 5.8, 1.36, 1.22, 4.8, duvet, { tex: 'quilt', texAlpha: 0.38 });
      k.box(1.60, 0.13, 6.0, 0.36, 1.24, 4.9, runner, { tex: 'fabric', texAlpha: 0.45 });
      // Crisp white top sheet fold
      k.box(0.52, 0.14, 5.9, 0.16, 1.22, 4.8, '#ffffff');
      // 2 Crisp white recovery pillows + 2 teal accent pillows
      k.box(0.24, 0.20, 10.0, 0.30, 0.46, 2.6, '#ffffff');
      k.box(0.24, 0.82, 10.0, 0.30, 0.46, 2.6, '#ffffff');
      k.box(0.40, 0.24, 10.3, 0.22, 0.38, 2.2, '#2dd4bf');
      k.box(0.40, 0.86, 10.3, 0.22, 0.38, 2.2, '#2dd4bf');
      // White & light-oak nightstand on right side
      k.box(0.12, 1.42, 0, 0.40, 0.36, 9.0, '#f8fafc');
      k.box(0.10, 1.40, 9.0, 0.44, 0.40, 1.2, '#d4a373');
      k.cyl(0.30, 1.58, 10.2, 0.06, 2.6, '#0d9488');
      k.cyl(0.30, 1.58, 12.6, 0.12, 3.2, '#fef3c7');
      // Bedside vital-sign monitor on clinical stand (left of headboard)
      k.cyl(0.42, -0.26, 0, 0.11, 1.2, '#64748b');
      k.cyl(0.42, -0.26, 1.2, 0.03, 12.5, '#cbd5e1');
      k.box(0.26, -0.40, 13.5, 0.34, 0.22, 6.2, '#0f172a');
      k.part(0.42, -0.16, 3, () => {
        k.now.screen('+v', -0.17, 0.28, 0.58, 14.1, 19.2, 'ecg', opts.seed || 7);
      });
      // Contactless biometric wall hub above headboard
      if (opts.smartHub !== false) {
        k.box(0.02, 0.58, 21, 0.08, 0.34, 4.2, '#0ea5e9');
      }
    });
  }

  function wardrobe(x, y, rot, opts = {}) {
    const wood = opts.wood || '#d4a373';
    PH.furniture(x, y, 1.15, 0.55, rot, k => {
      // Light oak wooden wardrobe body
      k.box(0.04, 0.04, 0, 1.07, 0.47, 21.5, wood, { tex: 'deskwood', texAlpha: 0.5 });
      // Crisp white/cream double doors on front face
      k.box(0.08, 0.46, 1.5, 0.48, 0.06, 18.5, '#f8fafc');
      k.box(0.59, 0.46, 1.5, 0.48, 0.06, 18.5, '#f8fafc');
      // Brushed metal vertical door handles
      k.box(0.50, 0.51, 8.0, 0.03, 0.03, 4.5, '#64748b');
      k.box(0.62, 0.51, 8.0, 0.03, 0.03, 4.5, '#64748b');
      // Top crown cap
      k.box(0.02, 0.02, 21.5, 1.11, 0.51, 1.2, shade(wood, 0.88));
    });
  }

  function armchair(x, y, rot, opts = {}) {
    const col = opts.col || '#0d9488';
    PH.furniture(x, y, 0.86, 0.82, rot, k => {
      // Warm oak legs & base frame
      k.box(0.08, 0.08, 0, 0.70, 0.66, 2.2, '#d4a373');
      // Plush seat cushion
      k.box(0.10, 0.12, 2.2, 0.66, 0.60, 3.2, '#f8fafc', { tex: 'fabric', texAlpha: 0.35 });
      // Teal ergonomic backrest & armrests
      k.box(0.08, 0.06, 5.0, 0.70, 0.18, 7.8, col, { tex: 'fabric', texAlpha: 0.4 });
      k.box(0.06, 0.08, 4.5, 0.14, 0.64, 4.8, shade(col, 0.9));
      k.box(0.66, 0.08, 4.5, 0.14, 0.64, 4.8, shade(col, 0.9));
      // Accent lumbar pillow
      k.box(0.22, 0.22, 5.5, 0.42, 0.14, 3.2, '#fef3c7');
    });
  }

  function examTable(x, y, rot, opts = {}) {
    const col = opts.col || '#0284c7';
    PH.furniture(x, y, 1.85, 0.85, rot, k => {
      // Steel legs
      k.box(0.16, 0.14, 0, 0.1, 0.1, 8, '#cbd5e1');
      k.box(1.58, 0.14, 0, 0.1, 0.1, 8, '#cbd5e1');
      k.box(0.16, 0.6, 0, 0.1, 0.1, 8, '#cbd5e1');
      k.box(1.58, 0.6, 0, 0.1, 0.1, 8, '#cbd5e1');
      // Base drawer cabinet under couch
      k.box(0.32, 0.14, 2, 1.18, 0.56, 6, '#e2e8f0');
      // Padded vinyl cushion + raised headrest + white hygiene paper roll strip
      k.box(0.1, 0.1, 8, 1.65, 0.65, 2.8, col, { tex: 'fabric', texAlpha: 0.35 });
      k.box(0.1, 0.1, 10.5, 0.42, 0.65, 2.4, shade(col, 1.08));
      k.top(0.14, 0.26, 10.9, 1.56, 0.32, '#f8fafc');
      // Patient step-stool beside couch
      k.box(0.85, 0.82, 0, 0.42, 0.28, 3.2, '#94a3b8');
      k.top(0.87, 0.84, 3.3, 0.38, 0.24, '#1e293b');
      // Mayo stainless surgical instrument tray
      k.cyl(0.35, -0.25, 0, 0.1, 11, '#cbd5e1');
      k.box(0.15, -0.42, 11, 0.44, 0.32, 1.0, '#e2e8f0');
    });
  }

  function privacyCurtain(x, y, rot, len = 1.8, col = '#bae6fd') {
    PH.furniture(x, y, len, 0.14, rot, k => {
      // Overhead track
      k.box(0, 0.04, 23, len, 0.05, 1.2, '#cbd5e1');
      // Pleated folds
      const folds = Math.max(4, Math.round(len * 5));
      const fw = len / folds;
      for (let i = 0; i < folds; i++) {
        const shadeCol = i % 2 === 0 ? col : shade(col, 0.88);
        k.box(i * fw, i % 2 === 0 ? 0.02 : 0.05, 2, fw + 0.01, 0.06, 20.5, shadeCol, { alpha: 0.88, edge: false });
      }
    });
  }

  // ------------------------------------------------ 2. DESKS, CHAIRS & WAITING
  function officeDesk(x, y, rot, opts = {}) {
    const clutter = opts.clutter;
    PH.furniture(x, y, 1.65, 0.95, rot, k => {
      // Desk modesty panel & side pedestals
      k.box(0.08, 0.1, 0, 0.38, 0.72, 10.5, '#e2e8f0');
      k.box(1.18, 0.1, 0, 0.38, 0.72, 10.5, '#e2e8f0');
      k.box(0.08, 0.74, 2, 1.48, 0.08, 8.5, '#cbd5e1');
      // Oak desktop slab
      k.box(0.04, 0.06, 10.5, 1.56, 0.82, 1.4, '#c8a274', { tex: 'deskwood', texAlpha: 0.55 });
      // Dual clinical LCD monitors
      k.box(0.42, 0.56, 11.9, 0.42, 0.08, 6.2, '#1e293b');
      k.box(0.88, 0.56, 11.9, 0.42, 0.08, 6.2, '#1e293b');
      k.part(0.65, 0.5, 3, () => {
        k.now.screen('-v', 0.55, 0.44, 0.82, 12.3, 17.6, opts.screenStyle || 'ui', opts.seed || 2);
        k.now.screen('-v', 0.55, 0.90, 1.28, 12.3, 17.6, 'ecg', (opts.seed || 2) + 5);
      });
      // Keyboard + mouse
      k.top(0.52, 0.28, 12.0, 0.38, 0.16, '#334155');
      // Paper clutter stacks in Current State vs sleek tablet in Future State
      if (clutter) {
        k.box(0.12, 0.22, 11.9, 0.26, 0.32, 3.8, '#fef3c7');
        k.box(0.15, 0.25, 15.7, 0.24, 0.28, 2.5, '#fde68a');
        k.box(1.28, 0.2, 11.9, 0.24, 0.3, 4.2, '#f1f5f9');
      } else {
        k.box(0.14, 0.24, 11.9, 0.24, 0.18, 0.8, '#0ea5e9');
      }
      // Doctor swivel chair (behind desk at v ~ -0.2)
      k.cyl(0.78, -0.18, 0, 0.18, 1.2, '#334155');
      k.cyl(0.78, -0.18, 1.2, 0.04, 4.5, '#64748b');
      k.box(0.58, -0.36, 5.5, 0.4, 0.38, 1.8, '#1e293b', { tex: 'fabric', texAlpha: 0.4 });
      k.box(0.58, -0.4, 7.3, 0.4, 0.08, 8.5, '#1e293b');
      // Visitor chair in front of desk
      if (opts.visitorChair !== false) {
        k.box(0.6, 1.05, 0, 0.38, 0.36, 5.5, '#0284c7', { tex: 'fabric', texAlpha: 0.4 });
        k.box(0.6, 1.35, 5.5, 0.38, 0.08, 6.5, '#0369a1');
      }
    });
  }

  function receptionDesk(x, y, rot, len = 3.2, opts = {}) {
    const col = opts.col || '#0284c7';
    const wood = opts.wood || '#c8a274';
    PH.furniture(x, y, len, 1.15, rot, k => {
      // Main lower counter body
      k.box(0.05, 0.15, 0, len - 0.1, 0.78, 11.5, '#f1f5f9');
      // Accent front fascia band
      k.box(0.04, 0.88, 2.5, len - 0.08, 0.08, 6.5, col);
      // Warm wood worktop + raised transaction ledge
      k.box(0.02, 0.12, 11.5, len - 0.04, 0.84, 1.4, wood, { tex: 'deskwood', texAlpha: 0.55 });
      k.box(0.02, 0.72, 12.9, len - 0.04, 0.28, 3.2, '#f8fafc');
      // Glass privacy screen above transaction counter
      k.box(0.15, 0.82, 16.1, len - 0.3, 0.05, 5.5, '#bae6fd', { alpha: 0.42, edge: false });
      // Workstations along counter
      const nTerms = Math.max(1, Math.floor(len / 1.4));
      for (let i = 0; i < nTerms; i++) {
        const ux = 0.45 + i * ((len - 0.9) / Math.max(1, nTerms));
        k.box(ux, 0.48, 12.9, 0.42, 0.08, 5.8, '#0f172a');
        k.top(ux + 0.04, 0.24, 13.0, 0.34, 0.16, '#334155');
        if (opts.clutter) {
          k.box(ux + 0.52, 0.3, 12.9, 0.24, 0.28, 4.2, '#fde68a');
        }
      }
    });
  }

  function waitingBench(x, y, rot, seats = 4, col = '#0284c7') {
    const W = seats * 0.56 + 0.14;
    PH.furniture(x, y, W, 0.62, rot, k => {
      // Chrome support beam & legs
      k.box(0.08, 0.24, 2.5, W - 0.16, 0.12, 1.2, '#94a3b8');
      k.box(0.14, 0.12, 0, 0.08, 0.38, 3.5, '#cbd5e1');
      k.box(W - 0.22, 0.12, 0, 0.08, 0.38, 3.5, '#cbd5e1');
      for (let i = 0; i < seats; i++) {
        const sx = 0.08 + i * 0.56;
        const c = i % 2 === 0 ? col : shade(col, 0.9);
        // Seat cushion
        k.box(sx + 0.03, 0.12, 3.8, 0.48, 0.42, 1.8, c, { tex: 'fabric', texAlpha: 0.4 });
        // Contoured backrest
        k.box(sx + 0.03, 0.06, 5.6, 0.48, 0.1, 6.8, shade(c, 0.88), { tex: 'fabric', texAlpha: 0.4 });
        // Armrest divider
        k.box(sx, 0.14, 5.6, 0.04, 0.36, 2.2, '#64748b');
      }
    });
  }

  function sofa(x, y, rot, len = 1.9, col = '#0d9488') {
    PH.furniture(x, y, len, 0.88, rot, k => {
      // Base & upholstered cushions
      k.box(0.04, 0.08, 0, len - 0.08, 0.74, 4.5, shade(col, 0.78), { tex: 'fabric', texAlpha: 0.5 });
      k.box(0.16, 0.18, 4.5, len - 0.32, 0.58, 2.5, col, { tex: 'fabric', texAlpha: 0.45 });
      // Backrest & armrests
      k.box(0.04, 0.06, 4.5, len - 0.08, 0.18, 8.2, shade(col, 0.88), { tex: 'fabric', texAlpha: 0.45 });
      k.box(0.04, 0.08, 4.5, 0.16, 0.72, 5.5, shade(col, 0.84));
      k.box(len - 0.2, 0.08, 4.5, 0.16, 0.72, 5.5, shade(col, 0.84));
      // Accent throw pillows
      k.box(0.22, 0.22, 7.0, 0.24, 0.18, 3.5, '#fde68a');
      k.box(len - 0.46, 0.22, 7.0, 0.24, 0.18, 3.5, '#fde68a');
    });
  }

  function kiosk(x, y, rot, opts = {}) {
    const col = opts.col || '#10b981';
    PH.furniture(x, y, 0.62, 0.58, rot, k => {
      k.box(0.08, 0.08, 0, 0.46, 0.42, 2.0, '#334155');
      k.box(0.14, 0.14, 2.0, 0.34, 0.28, 12.5, '#e2e8f0');
      k.box(0.10, 0.10, 14.5, 0.42, 0.34, 7.5, '#0f172a');
      k.box(0.14, 0.38, 15.2, 0.34, 0.08, 5.8, col);
    });
  }

  function vendingAndWater(x, y, rot) {
    PH.furniture(x, y, 1.45, 0.72, rot, k => {
      // Snack/Drink Vending Machine
      k.box(0.06, 0.06, 0, 0.82, 0.6, 22, '#1e293b');
      k.box(0.12, 0.58, 4, 0.52, 0.1, 15, '#bae6fd', { alpha: 0.7 });
      k.box(0.68, 0.58, 9, 0.14, 0.1, 6, '#10b981');
      // Water Dispenser Cooler with blue polycarbonate bottle
      k.box(1.0, 0.12, 0, 0.36, 0.36, 13, '#f8fafc');
      k.cyl(1.18, 0.3, 13, 0.14, 6.5, '#38bdf8');
    });
  }

  // -------------------------------------- 3. RADIOLOGY CT / 3T MRI / PHARMACY
  function ctScanner(x, y, rot, opts = {}) {
    const active = opts.active;
    PH.furniture(x, y, 2.4, 2.6, rot, k => {
      // Radiation-shielded floor pad
      k.top(0.1, 0.1, 0.2, 2.2, 2.4, '#cbd5e1', { stroke: '#0ea5e9', lw: 1.2 });
      // Huge square-chamfered CT Gantry housing
      k.box(0.25, 0.2, 0, 1.9, 0.78, 25, '#f8fafc');
      k.box(0.32, 0.18, 2, 1.76, 0.82, 21, '#e2e8f0');
      // Cyan clinical accent trim on gantry
      k.box(0.24, 0.22, 10, 1.92, 0.74, 3.5, active ? '#0ea5e9' : '#64748b');
      // Circular dark bore opening + laser alignment ring
      k.cyl(1.2, 0.62, 6.5, 0.42, 6.5, '#0f172a', { flat: true, top: '#090d16' });
      k.cyl(1.2, 0.92, 9.5, 0.44, 1.2, active ? '#38bdf8' : '#ef4444');
      // Motorized patient cradle table extending out of bore
      k.box(0.92, 0.85, 0, 0.56, 1.55, 6.8, '#cbd5e1');
      k.box(0.88, 0.45, 6.8, 0.64, 1.9, 1.8, '#0284c7', { tex: 'fabric', texAlpha: 0.4 });
      // Contrast power injector stand beside gantry
      k.cyl(2.05, 1.15, 0, 0.12, 15, '#94a3b8');
      k.box(1.95, 1.05, 15, 0.22, 0.22, 4, '#38bdf8');
    });
  }

  function mriScanner(x, y, rot, opts = {}) {
    PH.furniture(x, y, 2.5, 2.8, rot, k => {
      k.top(0.1, 0.1, 0.2, 2.3, 2.6, '#dbeafe', { stroke: '#10b981', lw: 1.4 });
      // Deep cylindrical 3T superconducting magnet housing
      k.box(0.2, 0.15, 0, 2.1, 1.25, 26, '#f8fafc');
      k.box(0.28, 0.12, 2, 1.94, 1.32, 22, '#e0f2fe');
      k.box(0.18, 0.25, 11, 2.14, 1.05, 4, '#10b981');
      // Cryogen helium vent stack on top
      k.cyl(1.25, 0.65, 26, 0.18, 5, '#94a3b8');
      // Magnet bore + head coil
      k.cyl(1.25, 1.05, 7, 0.45, 8, '#090d16', { flat: true, top: '#0f172a' });
      // Sliding patient table
      k.box(0.95, 1.0, 0, 0.6, 1.65, 7.0, '#cbd5e1');
      k.box(0.9, 0.5, 7.0, 0.7, 2.1, 1.8, '#10b981', { tex: 'fabric', texAlpha: 0.4 });
    });
  }

  function pharmacyShelf(x, y, rot, opts = {}) {
    const stockout = opts.stockout;
    const rfid = opts.rfid;
    PH.furniture(x, y, 1.75, 0.55, rot, k => {
      // Steel shelving frame
      k.box(0.04, 0.04, 0, 1.67, 0.47, 21, '#cbd5e1');
      // 3 Medicine shelves with colorful pill boxes
      const colors = ['#38bdf8', '#10b981', '#a855f7', '#f59e0b', '#ec4899'];
      for (let s = 0; s < 3; s++) {
        const sz = 4 + s * 6;
        k.box(0.06, 0.06, sz, 1.63, 0.45, 1.0, '#64748b');
        for (let b = 0; b < 5; b++) {
          if (stockout && s === 1 && (b === 1 || b === 2 || b === 3)) {
            // Red flashing empty stockout slot
            k.box(0.12 + b * 0.3, 0.1, sz + 1, 0.24, 0.36, 0.6, '#ef4444');
          } else {
            k.box(0.12 + b * 0.3, 0.1, sz + 1, 0.24, 0.36, 3.8, colors[(s + b) % colors.length]);
          }
        }
      }
      if (rfid) {
        k.box(0.04, 0.02, 21, 1.67, 0.5, 2.0, '#10b981');
      }
    });
  }

  function roboticDispenser(x, y, rot) {
    PH.furniture(x, y, 2.2, 1.15, rot, k => {
      // Base & glass robotic enclosure
      k.box(0.05, 0.05, 0, 2.1, 1.05, 4, '#0f172a');
      k.box(0.08, 0.08, 4, 2.04, 0.98, 19, '#0ea5e9', { alpha: 0.28 });
      k.box(0.05, 0.05, 23, 2.1, 1.05, 2.5, '#10b981');
      // Moving cartesian robotic picker arm inside
      const armU = 0.45 + ((Math.sin(PH.t * 0.09) + 1) * 0.5) * 1.25;
      k.box(armU, 0.2, 6, 0.24, 0.7, 15, '#facc15');
      k.box(0.15, 0.48, 13, 1.9, 0.12, 1.8, '#94a3b8');
      // Output medication chute
      k.box(1.75, 0.85, 4, 0.35, 0.35, 7, '#10b981');
    });
  }

  function diningTable(x, y, rot, opts = {}) {
    const cloth = opts.cloth || '#ffffff';
    PH.furniture(x, y, 1.35, 1.35, rot, k => {
      // 4 Dining chairs around table (warm light oak + teal upholstery)
      const chairs = [[0.48, 0.02], [0.48, 0.96], [0.02, 0.48], [0.96, 0.48]];
      chairs.forEach(([cx, cy]) => {
        k.box(cx, cy, 0, 0.36, 0.36, 5.2, '#d4a373');
        k.box(cx + 0.02, cy + 0.02, 5.2, 0.32, 0.32, 1.4, '#0d9488', { tex: 'fabric', texAlpha: 0.4 });
      });
      // Center pedestal + tabletop with crisp linen tablecloth
      k.cyl(0.68, 0.68, 0, 0.12, 9.2, '#cbd5e1');
      k.box(0.22, 0.22, 9.2, 0.92, 0.92, 1.6, cloth, { tex: 'fabric', texAlpha: 0.3 });
      // Plates & centerpiece
      k.cyl(0.42, 0.68, 10.8, 0.11, 0.5, '#f8fafc');
      k.cyl(0.92, 0.68, 10.8, 0.11, 0.5, '#f8fafc');
      k.cyl(0.68, 0.42, 10.8, 0.11, 0.5, '#f8fafc');
      k.cyl(0.68, 0.92, 10.8, 0.11, 0.5, '#f8fafc');
      k.cyl(0.68, 0.68, 10.8, 0.07, 2.8, '#10b981');
    });
  }

  function spaTable(x, y, rot, opts = {}) {
    const col = opts.col || '#5eead4';
    PH.furniture(x, y, 1.75, 0.85, rot, k => {
      // Warm light oak timber frame
      k.box(0.14, 0.12, 0, 1.48, 0.6, 7.5, '#d4a373', { tex: 'deskwood', texAlpha: 0.45 });
      // Padded wellness cushion + face cradle hole
      k.box(0.08, 0.08, 7.5, 1.6, 0.68, 2.6, col, { tex: 'fabric', texAlpha: 0.35 });
      k.box(0.18, 0.22, 10.1, 0.28, 0.4, 1.2, '#ffffff');
      // Rolled white spa towels at foot
      k.cyl(1.48, 0.32, 10.2, 0.09, 2.2, '#ffffff');
      k.cyl(1.48, 0.54, 10.2, 0.09, 2.2, '#ffffff');
      // Aromatherapy side cart
      k.box(0.2, -0.36, 0, 0.38, 0.32, 9.0, '#e2e8f0');
      k.cyl(0.38, -0.2, 9.0, 0.08, 2.5, '#14b8a6');
    });
  }

  // ---------------------------------------- 4. TREES, LANDSCAPING & EXTERIOR
  function tree(x, y, scale = 1.0, variant = 0) {
    PH.item(x + y + 0.3, () => {
      // Mulch ring & ground shadow
      PH.disc(x, y, 0.1, 0.55 * scale, 'rgba(15,23,42,0.32)');
      PH.disc(x, y, 0.15, 0.38 * scale, '#5a3d29', '#78350f');
      // Trunk
      PH.cyl(x, y, 0, 0.13 * scale, 14 * scale, '#6b4226');
      // Multi-sphere shaded foliage canopy
      const c1 = variant === 1 ? '#15803d' : '#166534';
      const c2 = variant === 1 ? '#22c55e' : '#15803d';
      const c3 = variant === 1 ? '#4ade80' : '#22c55e';
      PH.blob(x - 0.18 * scale, y + 0.12 * scale, 18 * scale, 0.52 * scale, c1);
      PH.blob(x + 0.18 * scale, y - 0.12 * scale, 19 * scale, 0.5 * scale, c2);
      PH.blob(x, y, 24 * scale, 0.58 * scale, c3);
    });
  }

  function planter(x, y, w = 0.7, d = 0.7) {
    PH.furniture(x, y, w, d, 0, k => {
      k.box(0.05, 0.05, 0, w - 0.1, d - 0.1, 6.5, '#cbd5e1');
      k.top(0.09, 0.09, 6.6, w - 0.18, d - 0.18, '#5a3d29');
      k.blob(w * 0.5, d * 0.5, 10, Math.min(w, d) * 0.42, '#16a34a', 2);
      k.blob(w * 0.45, d * 0.45, 13.5, Math.min(w, d) * 0.32, '#22c55e', 3);
    });
  }

  function streetLamp(x, y) {
    PH.item(x + y + 0.1, () => {
      PH.disc(x, y, 0.1, 0.9, 'rgba(253, 224, 71, 0.10)');
      PH.cyl(x, y, 0, 0.08, 2.5, '#475569');
      PH.cyl(x, y, 2.5, 0.04, 28, '#64748b');
      PH.box(x - 0.25, y - 0.06, 30, 0.5, 0.12, 1.5, '#94a3b8');
      PH.disc(x - 0.2, y, 29.8, 0.1, '#fef08a');
      PH.disc(x + 0.2, y, 29.8, 0.1, '#fef08a');
    });
  }

  function parkedCar(x, y, rot, col = '#3b82f6') {
    PH.furniture(x, y, 1.85, 0.92, rot, k => {
      // Wheels
      k.cyl(0.35, 0.06, 0, 0.14, 3.2, '#111827');
      k.cyl(1.48, 0.06, 0, 0.14, 3.2, '#111827');
      k.cyl(0.35, 0.86, 0, 0.14, 3.2, '#111827');
      k.cyl(1.48, 0.86, 0, 0.14, 3.2, '#111827');
      // Lower body
      k.box(0.04, 0.06, 2.2, 1.76, 0.8, 5.5, col);
      // Cabin + tinted glass windows
      k.box(0.42, 0.1, 7.7, 0.98, 0.72, 5.2, '#1e293b');
      k.box(0.46, 0.12, 12.6, 0.9, 0.68, 0.8, shade(col, 1.08));
      // Headlights & Taillights
      k.box(1.76, 0.12, 4.0, 0.06, 0.18, 2.0, '#fef08a');
      k.box(1.76, 0.62, 4.0, 0.06, 0.18, 2.0, '#fef08a');
      k.box(0.02, 0.12, 4.2, 0.06, 0.2, 2.0, '#ef4444');
      k.box(0.02, 0.60, 4.2, 0.06, 0.2, 2.0, '#ef4444');
    });
  }

  // ---------------------------------------- 5. ANIMATED MOVING VEHICLES
  function movingVehicle(gx, gy, opts = {}) {
    const isVIP = opts.type === 'vip';
    const isShuttle = opts.type === 'shuttle';
    const openDoor = opts.openDoor;
    const label = opts.label || (isVIP ? 'VIP Concierge Van' : 'ALS Ambulance');
    const dir = opts.dir || 1; // +1 moving along +gy, -1 moving along -gy

    PH.item(gx + gy + 1.4, () => {
      const bounce = Math.sin(PH.t * 0.35) * 0.45;
      // Ground shadow
      const sp = PH.P(gx + 0.55, gy + 1.15, 0);
      const c = PH.S.ctx, z = PH.zoom;
      c.fillStyle = 'rgba(10,14,22,0.42)';
      c.beginPath();
      c.ellipse(sp.x, sp.y, 26 * z, 13 * z, -0.38, 0, Math.PI * 2);
      c.fill();

      // Headlight beam cone on asphalt
      const frontY = dir > 0 ? gy + 2.3 : gy;
      const beamY = dir > 0 ? gy + 4.0 : gy - 1.7;
      const h0 = PH.P(gx + 0.55, frontY, 3);
      const bL = PH.P(gx + 0.05, beamY, 0.2);
      const bR = PH.P(gx + 1.05, beamY, 0.2);
      c.save();
      c.fillStyle = 'rgba(253, 224, 71, 0.20)';
      c.beginPath();
      c.moveTo(h0.x, h0.y);
      c.lineTo(bL.x, bL.y);
      c.lineTo(bR.x, bR.y);
      c.closePath();
      c.fill();
      c.restore();

      if (isVIP || isShuttle) {
        // Metallic Executive Mercedes-Sprinter VIP Concierge Van
        const bodyCol = isVIP ? '#0f172a' : '#1e293b';
        const trimCol = isVIP ? '#10b981' : '#f59e0b';
        PH.box(gx, gy, 2.5 + bounce, 1.1, 2.25, 13.5, bodyCol);
        // Gold/Emerald beltline stripe
        PH.box(gx - 0.01, gy + 0.05, 7.5 + bounce, 1.12, 2.15, 2.2, trimCol);
        // Panoramic tinted glass windows
        PH.box(gx - 0.02, gy + 0.22, 10.2 + bounce, 1.14, 1.8, 4.8, '#38bdf8', { alpha: 0.55 });
        // Roof AC pod
        PH.box(gx + 0.2, gy + 0.45, 16 + bounce, 0.7, 1.2, 2.2, '#e2e8f0');
      } else {
        // Project Hospital Box Ambulance (White + Red/Blue Battenburg + Star of Life)
        PH.box(gx, gy, 2.5 + bounce, 1.12, 1.65, 15.5, '#f8fafc');
        // Cab nose
        const cabY = dir > 0 ? gy + 1.65 : gy - 0.6;
        PH.box(gx + 0.04, cabY, 2.5 + bounce, 1.04, 0.62, 11.0, '#f1f5f9');
        PH.box(gx + 0.02, cabY + (dir > 0 ? 0.15 : 0.05), 8.5 + bounce, 1.08, 0.42, 4.2, '#38bdf8', { alpha: 0.7 });
        // Red emergency stripe & chevrons
        PH.box(gx - 0.01, gy + 0.08, 6.8 + bounce, 1.14, 1.5, 3.0, '#ef4444');
        // Roof emergency lightbar (flashing red/blue)
        const f1 = (PH.t % 12) < 6 ? '#ef4444' : '#3b82f6';
        const f2 = (PH.t % 12) < 6 ? '#3b82f6' : '#ef4444';
        PH.box(gx + 0.18, gy + 0.25, 18 + bounce, 0.34, 0.28, 2.4, f1);
        PH.box(gx + 0.58, gy + 0.25, 18 + bounce, 0.34, 0.28, 2.4, f2);
        PH.box(gx + 0.18, gy + 1.25, 18 + bounce, 0.74, 0.24, 2.2, f1);
      }

      // 4 Rotating alloy wheels
      const wy1 = gy + 0.42, wy2 = gy + 1.75;
      for (const wy of [wy1, wy2]) {
        const wp = PH.P(gx + 1.08, wy, 2.6);
        c.fillStyle = '#090d16';
        c.beginPath(); c.arc(wp.x, wp.y, 5.2 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#cbd5e1';
        c.beginPath(); c.arc(wp.x, wp.y, 2.5 * z, 0, Math.PI * 2); c.fill();
      }

      // Deployable hydraulic wheelchair ramp when boarding
      if (openDoor) {
        PH.box(gx + 1.08, gy + 0.65, 0.5, 0.85, 0.9, 1.4, isVIP ? '#10b981' : '#f59e0b');
      }

      // Floating vehicle badge
      const tp = PH.P(gx + 0.55, gy + 1.1, 23 + bounce);
      PH.bubble(tp.x, tp.y, label, isVIP ? 'ok' : 'warn');
    });
  }

  // Horizontal X-axis Concierge Transport Vehicle (drives Left <-> Right between Hospital and Retreat)
  function conciergeTransportX(gx, gy, opts = {}) {
    const isVIP = opts.type === 'vip';
    const openDoor = opts.openDoor;
    const label = opts.label || 'Concierge Transport';
    const dirX = opts.dirX || 1; // +1 driving Left->Right (+gx), -1 returning Right->Left (-gx)

    PH.item(gx + gy + 1.6, () => {
      const bounce = openDoor ? 0 : Math.sin(PH.t * 0.35) * 0.4;
      const sp = PH.P(gx + 1.1, gy + 0.55, 0);
      const c = PH.S.ctx, z = PH.zoom;
      c.fillStyle = 'rgba(10,14,22,0.42)';
      c.beginPath();
      c.ellipse(sp.x, sp.y, 26 * z, 13 * z, 0.38, 0, Math.PI * 2);
      c.fill();

      // Headlight beam along +gx or -gx
      const frontX = dirX > 0 ? gx + 2.2 : gx;
      const beamX = dirX > 0 ? gx + 3.8 : gx - 1.6;
      const h0 = PH.P(frontX, gy + 0.54, 3);
      const bT = PH.P(beamX, gy + 0.08, 0.2);
      const bB = PH.P(beamX, gy + 1.0, 0.2);
      c.save();
      c.fillStyle = 'rgba(253, 224, 71, 0.20)';
      c.beginPath();
      c.moveTo(h0.x, h0.y);
      c.lineTo(bT.x, bT.y);
      c.lineTo(bB.x, bB.y);
      c.closePath();
      c.fill();
      c.restore();

      const bodyCol = '#f8fafc';
      const trimCol = isVIP ? '#10b981' : '#0ea5e9';
      // Main transport body along X-axis (length = 2.2, width = 1.08)
      PH.box(gx, gy, 2.5 + bounce, 2.2, 1.08, 14.0, bodyCol);
      // Side stripe
      PH.box(gx + 0.05, gy - 0.01, 7.2 + bounce, 2.1, 1.10, 2.4, trimCol);
      // Panoramic patient cabin glass
      PH.box(gx + 0.22, gy - 0.02, 10.0 + bounce, 1.76, 1.12, 4.6, '#38bdf8', { alpha: 0.6 });
      // Roof beacon / climate pod
      PH.box(gx + 0.55, gy + 0.22, 16.5 + bounce, 1.1, 0.64, 2.2, isVIP ? '#10b981' : '#38bdf8');

      // Wheels on near side (gy + 1.06)
      for (const wx of [gx + 0.45, gx + 1.75]) {
        const wp = PH.P(wx, gy + 1.06, 2.6);
        c.fillStyle = '#090d16';
        c.beginPath(); c.arc(wp.x, wp.y, 5.2 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#cbd5e1';
        c.beginPath(); c.arc(wp.x, wp.y, 2.5 * z, 0, Math.PI * 2); c.fill();
      }

      // Deployable patient boarding ramp facing UP towards the building's downward-facing Main Entrance
      if (openDoor) {
        PH.box(gx + 0.7, gy - 0.55, 0.4, 0.8, 0.6, 1.2, trimCol);
      }

      // Floating badge above the Concierge Transport
      const tp = PH.P(gx + 1.1, gy + 0.54, 24 + bounce);
      PH.bubble(tp.x, tp.y, label, isVIP ? 'ok' : 'warn');
    });
  }

  // ---------------------------------------- 6. FLOOR HALOS & CONDUIT BEAMS
  function floorHalo(gx, gy, rx, ry, col, label) {
    const p = PH.P(gx, gy, 0.5);
    const z = PH.zoom;
    const pulse = 1 + Math.sin(PH.t * 0.12) * 0.1;
    const c = PH.S.ctx;
    c.save();
    c.fillStyle = col;
    c.strokeStyle = col;
    c.globalAlpha = 0.18;
    c.beginPath();
    c.ellipse(p.x, p.y, rx * z * pulse, ry * z * pulse, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.85;
    c.lineWidth = 1.8 * z;
    c.stroke();
    if (label) {
      c.font = `800 ${Math.max(9, Math.round(8.5 * z))}px ui-monospace, Menlo, monospace`;
      const tw = c.measureText(label).width + 10 * z;
      c.fillStyle = 'rgba(9,13,22,0.88)';
      c.beginPath();
      c.roundRect(p.x - tw / 2, p.y + (ry + 2) * z, tw, 13 * z, 3 * z);
      c.fill();
      c.fillStyle = '#f8fafc';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, p.x, p.y + (ry + 8.5) * z);
    }
    c.restore();
  }

  function signalBeam(fromGx, fromGy, toGx, toGy, col, label) {
    const p0 = PH.P(fromGx, fromGy, 16);
    const p1 = PH.P(toGx, toGy, 16);
    const z = PH.zoom;
    const c = PH.S.ctx;
    c.save();
    c.strokeStyle = col;
    c.lineWidth = 2.4 * z;
    c.setLineDash([7 * z, 5 * z]);
    c.lineDashOffset = -(PH.t * 1.8);
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.lineTo(p1.x, p1.y);
    c.stroke();
    c.restore();

    const frac = (PH.t % 45) / 45;
    const px = p0.x + (p1.x - p0.x) * frac;
    const py = p0.y + (p1.y - p0.y) * frac;
    c.fillStyle = col;
    c.beginPath();
    c.arc(px, py, 4.5 * z, 0, Math.PI * 2);
    c.fill();
    if (label) {
      c.font = `800 ${Math.max(9, Math.round(8.2 * z))}px ui-monospace, Menlo, monospace`;
      const tw = c.measureText(label).width + 10 * z;
      c.fillStyle = 'rgba(9,13,22,0.9)';
      c.strokeStyle = col;
      c.lineWidth = 1.1;
      c.beginPath();
      c.roundRect(px - tw / 2, py - 20 * z, tw, 13 * z, 3 * z);
      c.fill();
      c.stroke();
      c.fillStyle = '#f8fafc';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, px, py - 13.5 * z);
    }
  }

  function roomSign(gx, gy, text, accent = '#0ea5e9') {
    const p = PH.P(gx, gy, PH.wallsUp ? 80 : 30);
    const z = Math.max(0.85, Math.min(1.2, PH.zoom));
    const c = PH.S.ctx;
    c.save();
    c.font = `700 ${Math.round(9.5 * z)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const w = c.measureText(text).width + 14 * z;
    const h = 16 * z;
    if (PH.S.roomSigns) {
      PH.S.roomSigns.push({ x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2, text });
    }
    c.fillStyle = 'rgba(9, 13, 22, 0.90)';
    c.strokeStyle = accent;
    c.lineWidth = 1.4;
    c.beginPath();
    c.roundRect(p.x - w / 2, p.y - h / 2, w, h, 4 * z);
    c.fill();
    c.stroke();
    c.fillStyle = '#f8fafc';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, p.x, p.y);
    c.restore();
  }

  global.PHSprites = {
    hospitalBed,
    luxuryBed,
    wardrobe,
    armchair,
    examTable,
    privacyCurtain,
    officeDesk,
    receptionDesk,
    waitingBench,
    sofa,
    kiosk,
    vendingAndWater,
    ctScanner,
    mriScanner,
    pharmacyShelf,
    roboticDispenser,
    diningTable,
    spaTable,
    tree,
    planter,
    streetLamp,
    parkedCar,
    movingVehicle,
    conciergeTransportX,
    floorHalo,
    signalBeam,
    roomSign
  };
})(window);
