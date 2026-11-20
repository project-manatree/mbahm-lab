// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer
// 100% Identical Building Structure in Both Modes:
// - Left Building (x: 1..15, y: 1..16): Multi-Wing Partner Specialist Hospital
//   (Inpatient Ward A, Step-Down Ward B, Central Corridor, Discharge Pharmacy,
//   Billing & Clearance Hall, Departure Lobby, Main Entrance facing DOWN at y=16)
// - Middle Garden Park & Perimeter Walk (x: 15..19.6): Continuous Walking Loop & Fountain
// - Right Building (x: 19.6..33.6, y: 2.6..16): Luxury Retreat (Hotel Lobby, Doctor Room,
//   3 Recovery Suites, Recreation & Games Club Room, Yoga Studio)
// - East Pool (y: 2.2..7.6) & Outdoor Garden Bistro Restaurant (y: 8.4..15.6) on East Lawn
// - Front Two-Lane Road (x: 1..38.8, y: 16..20.4): Concierge Transport Left <-> Right
// ============================================================================

const IsoRenderer = (() => {
  const GRID_W = 40;
  const GRID_H = 21;

  const MAP = {
    proj: { ax: 40, ay: 2, bx: -10, by: 28 },
    bounds: { x0: 0.5, y0: 0.3, x1: 39.0, y1: 20.6 },
    view: { x0: 0.5, y0: 0.3, x1: 39.0, y1: 20.6 },
    ground: [
      // ---------------- BUILDING 1 (LEFT: PARTNER HOSPITAL, x: 1..15, y: 1..16) — 100% IDENTICAL IN BOTH MODES
      { x: 1, y: 1, w: 7, d: 5.5, mat: 'linoBlue' },             // Rear-Left: Ward A (Acute Inpatient)
      { x: 8, y: 1, w: 7, d: 5.5, mat: 'linoMint' },             // Rear-Right: Discharge Ward B (Gate 1 / Track A)
      { x: 1, y: 6.5, w: 14, d: 2.0, mat: 'terrazzo' },          // Hospital Central Corridor
      { x: 1, y: 8.5, w: 4.8, d: 7.5, mat: 'ceramic' },          // Front-Left: Discharge Pharmacy (Gate 2 / Track B)
      { x: 5.8, y: 8.5, w: 9.2, d: 7.5, mat: 'linoWhite' },      // Front-Center & Right: Main Entrance Waiting Room, Billing & Boarding Gate
      { x: 6.1, y: 11.4, w: 4.5, d: 3.9, mat: 'carpetBlue' },    // Main Waiting Room Seating Carpet Inlay
      { x: 10.8, y: 8.8, w: 4.0, d: 6.8, mat: 'carpetTeal' },    // Departure & Pre-Boarding Waiting Zone

      // ---------------- RIGHT SITE: UNDEVELOPED LOT (Current) -> GARDEN PARK, RESORT & EAST POOL (Target)
      { x: 15.0, y: 0.6, w: 23.8, d: 16.0, mat: 'grass' },       // Undeveloped Grass (Cur) / Landscaped Resort Lawn (Fut)

      // Continuous Perimeter Walking Park Loop & Central Garden Fountain Plaza (Target Only)
      { x: 15.3, y: 1.1, w: 0.9, d: 14.9, mat: { cur: null, fut: 'paver' } },       // West Walking Park Path (Full Loop)
      { x: 15.3, y: 1.1, w: 19.4, d: 0.95, mat: { cur: null, fut: 'paver' } },      // North Walking Park Path (Full Loop)
      { x: 33.8, y: 1.1, w: 0.9, d: 14.9, mat: { cur: null, fut: 'paver' } },       // East Park Terrace Walk (Full Loop)
      // East Swimming Pool Deck (y: 2.2..7.6) & Outdoor Al-Fresco Garden Bistro Terrace (y: 8.4..15.6)
      { x: 34.8, y: 2.2, w: 3.6, d: 5.4, mat: { cur: null, fut: 'travertine' } },   // East Resort Pool Sun Terrace
      { x: 35.15, y: 2.7, w: 1.75, d: 4.15, mat: { cur: null, fut: 'water' } },     // Outdoor Resort Swimming Pool
      { x: 33.6, y: 7.1, w: 1.25, d: 1.5, mat: { cur: null, fut: 'travertine' } },  // Promenade -> East Pool & Garden Bistro Bridge
      { x: 34.8, y: 8.4, w: 3.7, d: 7.2, mat: { cur: null, fut: 'travertine' } },   // Outdoor Garden Bistro Travertine Terrace
      { x: 35.05, y: 8.75, w: 3.2, d: 6.5, mat: { cur: null, fut: 'oak' } },         // Outdoor Garden Bistro Warm Honey-Oak Culinary Deck

      // BUILDING 2 (FIVE-STAR LUXURY RETREAT: LUMINOUS WHITE MARBLE, TRAVERTINE, BRUSHED GOLD & ROYAL SAPPHIRE — ZERO MUDDY BROWN)
      { x: 19.6, y: 2.6, w: 3.5, d: 4.2, mat: { cur: null, fut: 'ceramicCream' } }, // Visiting Doctor & ISBAR Clinical Salon (Ivory Porcelain)
      { x: 23.1, y: 2.6, w: 10.5, d: 4.2, mat: { cur: null, fut: 'travertine' } },  // 3 Private Recovery Suites 301, 302 & 303 (Roman Travertine Stone)
      { x: 19.6, y: 6.8, w: 14.0, d: 2.0, mat: { cur: null, fut: 'marble' } },      // Resort Central White Calacatta Marble Promenade
      { x: 19.6, y: 8.8, w: 5.0, d: 7.2, mat: { cur: null, fut: 'travertine' } },   // Main Entrance 5-Star Subtle Travertine & Pearl Hotel Lobby
      { x: 24.6, y: 8.8, w: 4.6, d: 7.2, mat: { cur: null, fut: 'plainLounge' } }, // Recreation & Games Club Room (Seamless Plain Matte Floor — Zero Tiles)
      { x: 29.2, y: 8.8, w: 4.4, d: 7.2, mat: { cur: null, fut: 'oak' } },          // Yoga, Wellness & Movement Studio (Warm Studio Hardwood)

      // ---------------- FRONT WALKWAY & CONCIERGE TRANSPORT ROAD (y: 16..20.4)
      { x: 1, y: 16.0, w: 14, d: 0.6, mat: 'paver' },            // Hospital Front Entrance Apron
      { x: 15.3, y: 16.0, w: 23.2, d: 0.6, mat: { cur: 'grass', fut: 'paver' } }, // Continuous South Promenade & Resort Apron
      { x: 1, y: 16.6, w: 37.8, d: 3.8, mat: 'asphalt' }           // Horizontal Left<->Right Road
    ],
    decals: [
      // Hospital corridor wayfinding line
      { type: 'line', x1: 1.5, y1: 7.5, x2: 14.5, y2: 7.5, w: 0.10, col: '#0ea5e9' },
      // Resort marble promenade brushed-gold accent inlay
      { type: 'line', x1: 20.0, y1: 7.8, x2: 33.2, y2: 7.8, w: 0.10, col: '#d4af37', when: 'fut' },
      // Road center divider (Left <-> Right)
      { type: 'line', x1: 1.5, y1: 18.5, x2: 38.2, y2: 18.5, w: 0.09, col: 'rgba(250,204,21,0.75)', dash: [0.6, 0.4] },
      // Hospital Main Entrance Pick-Up Bay (Facing Down at x: 11.2..14.2, y: 16.7..18.2)
      { type: 'hatch', x: 11.2, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(14,165,233,0.65)' },
      // Luxury Resort VIP Drop-Off Bay (Facing Down at x: 20.1..23.1, y: 16.7..18.2, aligned with Lobby Main Entrance x=20.6..22.6)
      { type: 'hatch', x: 20.1, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(212,175,55,0.72)', when: 'fut' }
    ],
    walls: [
      // BUILDING 1 (LEFT — PARTNER HOSPITAL, x: 1..15, y: 1..16)
      { x1: 1, y1: 1, x2: 15, y2: 1, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 1, y1: 1, x2: 1, y2: 16, kind: 'ext', col: '#e2e8f0', windows: true },
      { x1: 15, y1: 1, x2: 15, y2: 16, kind: 'ext', col: '#e2e8f0', windows: true },
      // Building 1 Bottom Front Wall (y = 16) — Main Entrance opens directly into Waiting Room (x = 7.4..9.8) & Boarding Bay (x = 11.6..14.0)
      {
        x1: 1, y1: 16, x2: 15, y2: 16, kind: 'ext', col: '#e2e8f0', windows: true,
        open: [
          { at: 7.4, w: 2.4, type: 'slide', alwaysOpen: true },
          { at: 11.6, w: 2.4, type: 'slide', alwaysOpen: true }
        ]
      },
      // Building 1 Interior Walls
      { x1: 8, y1: 1, x2: 8, y2: 6.5, kind: 'int', col: '#cbd5e1', open: [{ at: 3.2, w: 1.3, type: 'door' }] },
      { x1: 1, y1: 6.5, x2: 15, y2: 6.5, kind: 'int', col: '#cbd5e1', open: [{ at: 4.0, w: 1.5, type: 'double' }, { at: 11.0, w: 1.5, type: 'double' }] },
      { x1: 1, y1: 8.5, x2: 15, y2: 8.5, kind: 'int', col: '#cbd5e1', open: [{ at: 2.8, w: 1.4, type: 'door' }, { at: 8.2, w: 1.8, type: 'slide', alwaysOpen: true }, { at: 12.1, w: 1.7, type: 'slide', alwaysOpen: true }] },
      { x1: 5.8, y1: 8.5, x2: 5.8, y2: 16, kind: 'glass', col: '#cbd5e1', open: [{ at: 11.5, w: 1.6, type: 'slide', alwaysOpen: true }] },
      { x1: 10.8, y1: 8.5, x2: 10.8, y2: 16, kind: 'glass', col: '#cbd5e1', open: [{ at: 11.0, w: 3.0, type: 'slide', alwaysOpen: true }] },

      // BUILDING 2 (RIGHT — FIVE-STAR LUXURY RETREAT: HOTEL LOBBY + DOCTOR ROOM + 3 RECOVERY SUITES 301–303 + CINEMA/LIBRARY LOUNGE + YOGA STUDIO)
      { when: 'fut', x1: 19.6, y1: 2.6, x2: 33.6, y2: 2.6, kind: 'ext', col: '#faf8f5', windows: true },
      { when: 'fut', x1: 19.6, y1: 2.6, x2: 19.6, y2: 16, kind: 'ext', col: '#faf8f5', windows: true, open: [{ at: 7.1, w: 1.5, type: 'slide', alwaysOpen: true }] },
      { when: 'fut', x1: 33.6, y1: 2.6, x2: 33.6, y2: 16, kind: 'ext', col: '#faf8f5', windows: true, open: [{ at: 7.1, w: 1.5, type: 'slide', alwaysOpen: true }] },
      // Building 2 Bottom Front Wall (y = 16) — Main Entrance opens directly into Clear Lobby Walk Axis (x = 20.6..22.6)
      { when: 'fut', x1: 19.6, y1: 16, x2: 33.6, y2: 16, kind: 'ext', col: '#faf8f5', windows: true, open: [{ at: 20.6, w: 2.0, type: 'slide', alwaysOpen: true }] },
      // Top Wing Dividers: Visiting Doctor Room (19.6..23.1) | Suite 301 (23.1..26.6) | Suite 302 (26.6..30.1) | Suite 303 (30.1..33.6)
      { when: 'fut', x1: 23.1, y1: 2.6, x2: 23.1, y2: 6.8, kind: 'int', col: '#e2e8f0' },
      { when: 'fut', x1: 26.6, y1: 2.6, x2: 26.6, y2: 6.8, kind: 'int', col: '#e2e8f0' },
      { when: 'fut', x1: 30.1, y1: 2.6, x2: 30.1, y2: 6.8, kind: 'int', col: '#e2e8f0' },
      // Resort Central Promenade Walls (Corridor y: 6.8..8.8) — Doors to Doctor Room, Suites 301–303, Hotel Lobby, Cinema/Library Lounge & Yoga Studio
      {
        when: 'fut', x1: 19.6, y1: 6.8, x2: 33.6, y2: 6.8, kind: 'glass', col: '#f8fafc',
        open: [
          { at: 20.8, w: 1.1, type: 'door' },
          { at: 24.4, w: 1.0, type: 'door' },
          { at: 27.9, w: 1.0, type: 'door' },
          { at: 31.4, w: 1.0, type: 'door' }
        ]
      },
      {
        when: 'fut', x1: 19.6, y1: 8.8, x2: 33.6, y2: 8.8, kind: 'glass', col: '#f8fafc',
        open: [
          { at: 20.6, w: 2.0, type: 'slide', alwaysOpen: true },
          { at: 26.1, w: 1.6, type: 'slide', alwaysOpen: true },
          { at: 30.6, w: 1.6, type: 'slide', alwaysOpen: true }
        ]
      },
      // Bottom Wing Dividers: 5-Star Hotel Lobby (19.6..24.6) | Cinema, Library & Social Lounge (24.6..29.2) | Yoga & Movement Studio (29.2..33.6)
      { when: 'fut', x1: 24.6, y1: 8.8, x2: 24.6, y2: 16, kind: 'int', col: '#e2e8f0' },
      { when: 'fut', x1: 29.2, y1: 8.8, x2: 29.2, y2: 16, kind: 'glass', col: '#cbd5e1' }
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

  // Current Mode: Detailed Isometric Emergency Ambulance (Box Body, Red/Orange Stripe, Flashing Red/Blue Lightbar, Rear Double Doors)
  function drawEmergencyAmbulance(gx, gy, opts = {}) {
    const dirX = opts.dirX || 1;
    const openDoor = !!opts.openDoor;
    const rampProg = opts.rampProg != null ? opts.rampProg : (openDoor ? 1 : 0);
    const blinker = !!opts.blinker;
    const braking = !!opts.braking;
    const label = opts.label || 'Ambulance → Hospital ED';
    const len = 2.62;
    const wid = 1.18;

    PH.item(gx + gy + 1.65, () => {
      const bounce = (openDoor || rampProg > 0.04) ? 0 : Math.sin(PH.t * 0.18) * 0.18;
      const c = PH.S.ctx;
      const z = PH.zoom;
      const flashA = Math.floor(PH.t / 10) % 2 === 0;
      const rearX = dirX > 0 ? gx : gx + len;

      // Subtle tailpipe exhaust puffs while driving (Current-state diesel ambulance)
      if (!openDoor && rampProg < 0.05) {
        c.save();
        for (let i = 0; i < 3; i++) {
          const ep = ((PH.t / 46) + i * 0.33) % 1;
          const ex = PH.P(rearX - dirX * (0.14 + ep * 0.65), gy + 0.25 + ep * 0.08, 2.2 + ep * 3.8);
          c.fillStyle = `rgba(148, 163, 184, ${(0.34 * (1 - ep)).toFixed(2)})`;
          c.beginPath(); c.arc(ex.x, ex.y, (1.8 + ep * 3.2) * z, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }

      // Ground drop shadow
      const sp = PH.P(gx + len / 2, gy + wid / 2, 0);
      c.fillStyle = 'rgba(9,13,22,0.48)';
      c.beginPath();
      c.ellipse(sp.x, sp.y, 32 * z, 15.5 * z, 0.38, 0, Math.PI * 2);
      c.fill();

      // Headlight beam ahead of ambulance cab
      const frontX = dirX > 0 ? gx + len : gx;
      const beamX = dirX > 0 ? gx + len + 1.7 : gx - 1.7;
      const h0 = PH.P(frontX, gy + wid / 2, 3.4);
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

      // Rear Double Doors (Framed shut when moving; smoothly extending ramp & doors at ED bay)
      const boxLen = len - 0.72;
      const boxX = dirX > 0 ? gx : gx + 0.72;
      const cabX = dirX > 0 ? gx + boxLen : gx;

      if (rampProg > 0.04) {
        const rLen = 0.74 * rampProg;
        const rampX0 = dirX > 0 ? gx - 0.04 - rLen : gx + len + 0.04;
        PH.topQuad(rampX0, gy + 0.18, 0.25, rLen, 0.80, '#cbd5e1', { stroke: '#ef4444' });
        const dOff = 0.20 * rampProg;
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy - dOff, 4.0, 0.12, 0.50, 12.6, '#ffffff');
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy + wid - 0.50 + dOff, 4.0, 0.12, 0.50, 12.6, '#f8fafc');
        PH.box(rearX - (dirX > 0 ? 0.14 : 0), gy - dOff + 0.02, 6.2, 0.10, 0.46, 2.2, '#dc2626');
        PH.box(rearX - (dirX > 0 ? 0.14 : 0), gy + wid - 0.48 + dOff, 6.2, 0.10, 0.46, 2.2, '#dc2626');
      }

      // Chassis skirt & bumpers
      PH.box(gx, gy, 2.0 + bounce, len, wid, 2.2, '#1e293b');
      // Square White Box-Ambulance Patient Module + Raised HVAC Roof Pod
      PH.box(boxX, gy, 4.2 + bounce, boxLen, wid, 13.6, '#ffffff');
      PH.box(boxX + 0.35, gy + 0.18, 17.8 + bounce, boxLen - 0.7, wid - 0.36, 1.4, '#e2e8f0');
      // Forward Step-Down Cab & Sloped Nose Hood
      PH.box(cabX, gy + 0.04, 4.2 + bounce, 0.72, wid - 0.08, 7.6, '#f8fafc');
      PH.box(cabX + (dirX > 0 ? 0.02 : 0.26), gy + 0.06, 9.6 + bounce, 0.44, wid - 0.12, 5.2, '#ffffff');

      // High-Visibility Red & Safety-Orange Dual Wraparound Stripe
      PH.box(boxX - 0.01, gy - 0.01, 6.0 + bounce, boxLen + 0.02, wid + 0.02, 2.2, '#dc2626');
      PH.box(boxX - 0.01, gy - 0.01, 8.2 + bounce, boxLen + 0.02, wid + 0.02, 0.95, '#f97316');
      PH.box(cabX, gy + 0.03, 6.0 + bounce, 0.72, wid - 0.06, 1.4, '#dc2626');

      // Visible Vertical Rear Double-Door Frame & Chrome Handles when closed
      const rdFaceX = dirX > 0 ? rearX - 0.02 : rearX + 0.01;
      if (!openDoor) {
        PH.line3(rdFaceX, gy + wid * 0.5, 4.4 + bounce, rdFaceX, gy + wid * 0.5, 16.8 + bounce, '#475569', 2.0);
        PH.box(rdFaceX - 0.02, gy + 0.12, 4.4 + bounce, 0.05, 0.24, 12.0, '#f97316');
        PH.box(rdFaceX - 0.02, gy + wid - 0.36, 4.4 + bounce, 0.05, 0.24, 12.0, '#f97316');
      }

      // Alternating Red & Blue Emergency Roof Lightbar Flashes (Cab Brow + Dual Rear Strobe Pods)
      const lbX = dirX > 0 ? cabX + 0.04 : cabX + 0.40;
      PH.box(lbX, gy + 0.18, 15.0 + bounce, 0.26, wid - 0.36, 2.0, '#334155');
      PH.box(lbX, gy + 0.20, 15.3 + bounce, 0.26, 0.34, 1.9, flashA ? '#ef4444' : '#7f1d1d');
      PH.box(lbX, gy + wid - 0.54, 15.3 + bounce, 0.26, 0.34, 1.9, flashA ? '#1e3a8a' : '#3b82f6');
      // Crisp alternating LED flash core, wide halo & road cast
      const glowA = PH.P(lbX + 0.13, gy + 0.36, 16.5 + bounce);
      const glowB = PH.P(lbX + 0.13, gy + wid - 0.36, 16.5 + bounce);
      const gp = flashA ? glowA : glowB;
      const roadCast = PH.P(gx + len / 2, gy + wid / 2, 0.2);
      c.save();
      c.fillStyle = flashA ? 'rgba(239,68,68,0.16)' : 'rgba(59,130,246,0.16)';
      c.beginPath(); c.ellipse(roadCast.x, roadCast.y, 44 * z, 21 * z, 0.38, 0, Math.PI * 2); c.fill();
      c.fillStyle = flashA ? 'rgba(239,68,68,0.44)' : 'rgba(59,130,246,0.44)';
      c.beginPath(); c.arc(gp.x, gp.y, 13 * z, 0, Math.PI * 2); c.fill();
      c.fillStyle = flashA ? '#fca5a5' : '#93c5fd';
      c.beginPath(); c.arc(gp.x, gp.y, 4.2 * z, 0, Math.PI * 2); c.fill();
      c.restore();

      // Opposite-phase Rear Roof Corner Strobe Pods
      const rearPodX = boxX + (dirX > 0 ? 0.12 : boxLen - 0.34);
      PH.box(rearPodX, gy + 0.20, 17.8 + bounce, 0.22, 0.24, 1.4, flashA ? '#3b82f6' : '#7f1d1d');
      PH.box(rearPodX, gy + wid - 0.44, 17.8 + bounce, 0.22, 0.24, 1.4, flashA ? '#1e3a8a' : '#ef4444');

      // Sloped Cab Windshield & Side Cab Window
      const wBotX = dirX > 0 ? cabX + 0.54 : cabX + 0.18;
      const wTopX = dirX > 0 ? cabX + 0.26 : cabX + 0.46;
      PH.poly([
        PH.P(wBotX, gy + 0.10, 9.8 + bounce),
        PH.P(wBotX, gy + wid - 0.10, 9.8 + bounce),
        PH.P(wTopX, gy + wid - 0.10, 14.5 + bounce),
        PH.P(wTopX, gy + 0.10, 14.5 + bounce)
      ], '#38bdf8', '#0284c7', 1.2);
      // Cab side window
      PH.box(cabX + (dirX > 0 ? 0.08 : 0.32), gy + 0.02, 10.2 + bounce, 0.32, wid - 0.04, 3.6, '#1e293b', { alpha: 0.78 });

      // Front Bumper Grille + Headlights + Rear Brake & Turn-Signal Blinker
      const noseX = dirX > 0 ? gx + len + 0.01 : gx - 0.01;
      for (const hy of [gy + 0.20, gy + wid - 0.24]) {
        const hp = PH.P(noseX, hy, 5.2 + bounce);
        c.fillStyle = '#fef08a';
        c.beginPath(); c.arc(hp.x, hp.y, 2.8 * z, 0, Math.PI * 2); c.fill();
      }
      PH.line3(noseX, gy + 0.32, 5.2 + bounce, noseX, gy + wid - 0.32, 5.2 + bounce, '#94a3b8', 2.2);
      if (braking || rampProg > 0.04) {
        const tailX = dirX > 0 ? gx - 0.01 : gx + len + 0.01;
        for (const ty of [gy + 0.16, gy + wid - 0.16]) {
          const tpR = PH.P(tailX, ty, 5.0 + bounce);
          c.fillStyle = 'rgba(239,68,68,0.45)';
          c.beginPath(); c.arc(tpR.x, tpR.y, 4.2 * z, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#ef4444';
          c.beginPath(); c.arc(tpR.x, tpR.y, 2.1 * z, 0, Math.PI * 2); c.fill();
        }
      }
      if (blinker && Math.floor(PH.t / 12) % 2 === 0) {
        const bp = PH.P(noseX, gy + wid - 0.12, 4.4 + bounce);
        c.fillStyle = '#f59e0b';
        c.beginPath(); c.arc(bp.x, bp.y, 2.8 * z, 0, Math.PI * 2); c.fill();
      }

      // Bold Red Medical Cross on Near Side Box Panel
      const mx = boxX + boxLen * 0.52;
      const my = gy + wid + 0.03;
      const mz = 12.6 + bounce;
      PH.poly([
        PH.P(mx - 0.30, my, mz - 3.8),
        PH.P(mx + 0.30, my, mz - 3.8),
        PH.P(mx + 0.30, my, mz + 3.8),
        PH.P(mx - 0.30, my, mz + 3.8)
      ], '#ffffff', '#dc2626', 1.2);
      PH.poly([
        PH.P(mx - 0.08, my, mz - 2.8),
        PH.P(mx + 0.08, my, mz - 2.8),
        PH.P(mx + 0.08, my, mz + 2.8),
        PH.P(mx - 0.08, my, mz + 2.8)
      ], '#dc2626');
      PH.poly([
        PH.P(mx - 0.22, my, mz - 0.95),
        PH.P(mx + 0.22, my, mz - 0.95),
        PH.P(mx + 0.22, my, mz + 0.95),
        PH.P(mx - 0.22, my, mz + 0.95)
      ], '#dc2626');

      // Detailed Steel Wheels with Rotating Spokes & Red Center Hubcap
      const wheelRot = gx * 2.2;
      for (const wx of [gx + 0.54, gx + len - 0.46]) {
        const wp = PH.P(wx, gy + wid, 2.5);
        c.fillStyle = '#090d16';
        c.beginPath(); c.arc(wp.x, wp.y, 5.6 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#cbd5e1';
        c.beginPath(); c.arc(wp.x, wp.y, 3.0 * z, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#64748b';
        c.lineWidth = Math.max(0.8, 0.9 * z);
        for (let k = 0; k < 2; k++) {
          const ang = wheelRot + k * Math.PI * 0.5;
          c.beginPath();
          c.moveTo(wp.x + Math.cos(ang) * 2.5 * z, wp.y + Math.sin(ang) * 2.5 * z);
          c.lineTo(wp.x - Math.cos(ang) * 2.5 * z, wp.y - Math.sin(ang) * 2.5 * z);
          c.stroke();
        }
        c.fillStyle = '#dc2626';
        c.beginPath(); c.arc(wp.x, wp.y, 1.3 * z, 0, Math.PI * 2); c.fill();
      }

      // Floating EMS dispatch badge
      const tp = PH.P(gx + len / 2, gy + wid / 2, 27 + bounce);
      PH.bubble(tp.x, tp.y, label, 'fail');
    });
  }

  // Target Mode: Upgraded Pearl-White & Champagne-Gold Luxury Executive Concierge Van
  // Panoramic tinted windows, chrome grille, warm LED headlights, discreet wellness crest & automated side/rear wheelchair ramp
  function drawLuxuryConciergeVan(gx, gy, opts = {}) {
    const dirX = opts.dirX || 1;
    const openDoor = !!opts.openDoor;
    const rampProg = opts.rampProg != null ? opts.rampProg : (openDoor ? 1 : 0);
    const blinker = !!opts.blinker;
    const braking = !!opts.braking;
    const label = opts.label || 'Executive Concierge Shuttle';
    const len = 2.70;
    const wid = 1.18;

    PH.item(gx + gy + 1.65, () => {
      const bounce = (openDoor || rampProg > 0.04) ? 0 : Math.sin(PH.t * 0.16) * 0.16;
      const c = PH.S.ctx;
      const z = PH.zoom;

      // Ground drop shadow
      const sp = PH.P(gx + len / 2, gy + wid / 2, 0);
      c.fillStyle = 'rgba(9,13,22,0.46)';
      c.beginPath();
      c.ellipse(sp.x, sp.y, 33 * z, 15.5 * z, 0.38, 0, Math.PI * 2);
      c.fill();

      // Warm Golden-White LED Headlight Twin-Beam Projection
      const frontX = dirX > 0 ? gx + len : gx;
      const beamX = dirX > 0 ? gx + len + 2.3 : gx - 2.3;
      const h0 = PH.P(frontX, gy + wid / 2, 3.6);
      const bT = PH.P(beamX, gy - 0.05, 0.2);
      const bB = PH.P(beamX, gy + wid + 0.05, 0.2);
      const bMid = PH.P(beamX, gy + wid / 2, 0.2);
      c.save();
      const grad = c.createLinearGradient(h0.x, h0.y, bMid.x, bMid.y);
      grad.addColorStop(0, 'rgba(254, 249, 195, 0.42)');
      grad.addColorStop(0.55, 'rgba(253, 224, 71, 0.22)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(h0.x, h0.y);
      c.lineTo(bT.x, bT.y);
      c.lineTo(bB.x, bB.y);
      c.closePath();
      c.fill();
      c.restore();

      const rearX = dirX > 0 ? gx : gx + len;
      const cabinX = dirX > 0 ? gx : gx + 0.60;
      const cabX = dirX > 0 ? gx + len - 0.60 : gx;

      // Smoothly Unfolding Hydraulic Boarding Ramps & Chasing Guidance LEDs at Entrance Bays
      if (rampProg > 0.04) {
        const ledPulse = 0.60 + 0.40 * Math.sin(PH.t * 0.12);
        const rLen = 1.02 * rampProg;
        const rampX0 = dirX > 0 ? gx - 0.03 - rLen : gx + len + 0.05;
        PH.topQuad(rampX0, gy + 0.14, 0.35, rLen, 0.90, '#e2e8f0', { stroke: '#d4af37' });
        for (let r = 1; r <= 3; r++) {
          const rx = rampX0 + r * (rLen / 4);
          PH.line3(rx, gy + 0.18, 0.40, rx, gy + 1.00, 0.40, '#94a3b8', 1.4);
        }
        PH.box(rampX0, gy + 0.10, 0.40, rLen, 0.08, 1.8 * rampProg, '#d4af37');
        PH.box(rampX0, gy + 1.00, 0.40, rLen, 0.08, 1.8 * rampProg, '#d4af37');
        const dOff = 0.18 * rampProg;
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy - dOff, 3.2, 0.12, 0.45, 12.2, '#fdfcf8');
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy + wid - 0.45 + dOff, 3.2, 0.12, 0.45, 12.2, '#c9a227');
        // Prominent Curb-Side Fold-Out Entrance Bridge toward Sidewalk Bay (y < gy)
        const bDep = 0.85 * rampProg;
        PH.topQuad(gx + 0.58, gy - bDep, 0.40, 1.20, bDep, '#f8fafc', { stroke: '#10b981' });
        for (let s = 1; s <= 3; s++) {
          const sy = gy - s * (bDep / 4);
          PH.line3(gx + 0.64, sy, 0.45, gx + 1.72, sy, 0.45, '#cbd5e1', 1.5);
        }
        PH.box(gx + 0.56, gy - bDep, 0.45, 0.09, bDep, 1.8 * rampProg, '#d4af37');
        PH.box(gx + 1.70, gy - bDep, 0.45, 0.09, bDep, 1.8 * rampProg, '#d4af37');
        const ledA = PH.P(rampX0 + 0.08, gy + 0.59, 0.7);
        const ledB = PH.P(gx + 1.18, gy - bDep + 0.07, 0.7);
        c.save();
        c.fillStyle = `rgba(16, 185, 129, ${ledPulse.toFixed(2)})`;
        c.beginPath(); c.arc(ledA.x, ledA.y, 3.6 * z, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(ledB.x, ledB.y, 3.6 * z, 0, Math.PI * 2); c.fill();
        if (rampProg > 0.7) {
          const activeDot = Math.floor(PH.t / 10) % 3;
          for (let g = 0; g < 3; g++) {
            const dp = PH.P(gx + 0.74 + g * 0.44, gy - bDep * 0.5, 0.55);
            c.fillStyle = g === activeDot ? '#34d399' : 'rgba(16, 185, 129, 0.35)';
            c.beginPath(); c.arc(dp.x, dp.y, (g === activeDot ? 2.4 : 1.6) * z, 0, Math.PI * 2); c.fill();
          }
        }
        c.restore();
      }

      // Gloss Charcoal-Graphite Rocker Skirt
      PH.box(gx, gy, 2.0 + bounce, len, wid, 2.1, '#1f2937');
      // Champagne-Gold Lower Two-Tone Executive Cladding
      PH.box(cabinX, gy, 4.1 + bounce, len - 0.60, wid, 4.2, '#c9a227');
      PH.box(cabX, gy + 0.02, 4.1 + bounce, 0.60, wid - 0.04, 3.4, '#c9a227');
      // Pearl-White Upper Coachwork & Aerodynamic Roofline
      PH.box(cabinX, gy, 8.3 + bounce, len - 0.60, wid, 8.6, '#fdfcf8');
      PH.box(cabX, gy + 0.04, 7.5 + bounce, 0.60, wid - 0.08, 2.8, '#faf8f2');
      // Sleek Champagne-Gold Pin-Stripe & Flush Panoramic Skylight Roof
      PH.box(gx + 0.02, gy - 0.01, 7.6 + bounce, len - 0.04, wid + 0.02, 0.85, '#e5c158');
      PH.box(cabinX + 0.22, gy + 0.16, 16.9 + bounce, len - 1.05, wid - 0.32, 0.8, '#0f172a');
      PH.box(cabinX + 0.16, gy + 0.12, 16.8 + bounce, len - 0.92, wid - 0.24, 0.4, '#d4af37');

      // Continuous Flush Panoramic Tinted Privacy Cabin Windows
      PH.box(cabinX + 0.22, gy - 0.01, 9.6 + bounce, len - 1.02, wid + 0.02, 4.8, '#0f172a', { alpha: 0.86 });
      // Subtle specular window reflection ribbon
      PH.box(cabinX + 0.32, gy - 0.015, 13.4 + bounce, len - 1.24, wid + 0.03, 0.65, '#38bdf8', { alpha: 0.35 });

      // Sloped Panoramic Executive Windshield
      const wBotX = dirX > 0 ? cabX + 0.14 : cabX + 0.46;
      const wTopX = dirX > 0 ? cabinX + len - 0.60 : cabinX;
      PH.poly([
        PH.P(wBotX, gy + 0.08, 9.9 + bounce),
        PH.P(wBotX, gy + wid - 0.08, 9.9 + bounce),
        PH.P(wTopX, gy + wid - 0.08, 16.2 + bounce),
        PH.P(wTopX, gy + 0.08, 16.2 + bounce)
      ], '#1e293b', '#94a3b8', 1.2);
      PH.poly([
        PH.P(wBotX, gy + 0.18, 10.6 + bounce),
        PH.P(wBotX, gy + 0.44, 10.6 + bounce),
        PH.P(wTopX, gy + 0.44, 15.5 + bounce),
        PH.P(wTopX, gy + 0.18, 15.5 + bounce)
      ], 'rgba(255,255,255,0.38)');

      // Signature Horizontal Chrome Front Grille & Warm LED Headlights
      const noseX = dirX > 0 ? gx + len + 0.01 : gx - 0.01;
      for (const gz of [4.8, 5.8, 6.8]) {
        PH.line3(noseX, gy + 0.30, gz + bounce, noseX, gy + wid - 0.30, gz + bounce, '#e2e8f0', 1.8);
      }
      for (const hy of [gy + 0.18, gy + wid - 0.22]) {
        const hp = PH.P(noseX, hy, 5.4 + bounce);
        c.save();
        c.fillStyle = 'rgba(253, 224, 71, 0.36)';
        c.beginPath(); c.arc(hp.x, hp.y, 6.0 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fefce8';
        c.beginPath(); c.arc(hp.x, hp.y, 3.1 * z, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fde047'; c.lineWidth = 1.2; c.stroke();
        c.restore();
      }
      if (braking || rampProg > 0.04) {
        const tailX = dirX > 0 ? gx - 0.01 : gx + len + 0.01;
        for (const ty of [gy + 0.16, gy + wid - 0.16]) {
          const tpR = PH.P(tailX, ty, 5.2 + bounce);
          c.fillStyle = 'rgba(239,68,68,0.45)';
          c.beginPath(); c.arc(tpR.x, tpR.y, 4.2 * z, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#ef4444';
          c.beginPath(); c.arc(tpR.x, tpR.y, 2.1 * z, 0, Math.PI * 2); c.fill();
        }
      }
      if (blinker && Math.floor(PH.t / 12) % 2 === 0) {
        const bp = PH.P(noseX, gy + wid - 0.12, 4.6 + bounce);
        c.fillStyle = '#f59e0b';
        c.beginPath(); c.arc(bp.x, bp.y, 2.8 * z, 0, Math.PI * 2); c.fill();
      }

      // Discreet Champagne-Gold & Pearl Wellness Crest on Sliding VIP Door
      const mx = cabinX + (len - 0.60) * 0.50;
      const my = gy + wid + 0.03;
      const mz = 7.4 + bounce;
      const cp = PH.P(mx, my, mz);
      c.fillStyle = '#fdfcf8';
      c.strokeStyle = '#d4af37';
      c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(cp.x, cp.y, 5.2 * z, 4.0 * z, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#10b981';
      c.beginPath(); c.arc(cp.x - 1.2 * z, cp.y, 1.4 * z, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9a227';
      c.beginPath(); c.arc(cp.x + 1.4 * z, cp.y, 1.4 * z, 0, Math.PI * 2); c.fill();

      // Luxury Multi-Spoke Turbine Alloy Wheels with Rolling Spokes & Gold Center Caps
      const wheelRot = gx * 2.2;
      for (const wx of [gx + 0.56, gx + len - 0.56]) {
        const wp = PH.P(wx, gy + wid, 2.5);
        c.fillStyle = '#090d16';
        c.beginPath(); c.arc(wp.x, wp.y, 5.6 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#f1f5f9';
        c.beginPath(); c.arc(wp.x, wp.y, 3.2 * z, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#94a3b8';
        c.lineWidth = Math.max(0.8, 0.85 * z);
        for (let k = 0; k < 3; k++) {
          const ang = wheelRot + (k * Math.PI) / 3;
          c.beginPath();
          c.moveTo(wp.x + Math.cos(ang) * 2.7 * z, wp.y + Math.sin(ang) * 2.7 * z);
          c.lineTo(wp.x - Math.cos(ang) * 2.7 * z, wp.y - Math.sin(ang) * 2.7 * z);
          c.stroke();
        }
        c.fillStyle = '#d4af37';
        c.beginPath(); c.arc(wp.x, wp.y, 1.3 * z, 0, Math.PI * 2); c.fill();
      }

      // Floating VIP concierge status badge
      const tp = PH.P(gx + len / 2, gy + wid / 2, 26 + bounce);
      PH.bubble(tp.x, tp.y, label, 'ok');
    });
  }

  // ---------------- LUXURY WELLNESS RESORT & PARK PROP HELPERS ----------------
  function drawTowelStation(gx, gy) {
    PH.furniture(gx, gy, 1.1, 0.55, 0, k => {
      // Warm walnut towel cabinet & brass candle warmers
      k.box(0.05, 0.05, 0, 1.0, 0.45, 11.5, '#b48a5a', { tex: 'deskwood', texAlpha: 0.45 });
      k.box(0.02, 0.02, 11.5, 1.06, 0.50, 1.2, '#f8fafc');
      // Stacks of rolled plush white & aqua spa towels
      for (const tx of [0.22, 0.45, 0.68]) {
        k.cyl(tx, 0.25, 12.7, 0.08, 2.0, '#ffffff');
      }
      // Aromatherapy stone bowl
      k.cyl(0.88, 0.25, 12.7, 0.09, 1.5, '#14b8a6');
    });
  }

  function drawThermalLounger(gx, gy, cushionCol = '#f8fafc') {
    PH.furniture(gx, gy, 1.65, 0.72, 0, k => {
      k.box(0.08, 0.08, 0, 1.48, 0.56, 3.8, '#c89b6e', { tex: 'deskwood', texAlpha: 0.45 });
      k.box(0.06, 0.06, 3.8, 1.52, 0.60, 2.4, cushionCol, { tex: 'fabric', texAlpha: 0.3 });
      // Angled spa backrest + head bolster
      k.box(0.06, 0.06, 6.2, 0.45, 0.60, 2.8, cushionCol);
      k.cyl(0.24, 0.36, 9.0, 0.08, 0.42, '#5eead4');
    });
  }

  function drawPoolLounger(gx, gy, cushionCol = '#f8fafc') {
    PH.furniture(gx, gy, 0.72, 1.48, 0, k => {
      // Brushed champagne-gold & pearl resort sun-lounger frame
      k.box(0.06, 0.06, 0, 0.60, 1.36, 3.0, '#d4af37');
      // Plush waterproof ivory cushion + reclined backrest + royal sapphire head pillow
      k.box(0.04, 0.04, 3.0, 0.64, 1.40, 1.9, cushionCol, { tex: 'fabric', texAlpha: 0.25 });
      k.box(0.04, 0.04, 4.9, 0.64, 0.44, 2.5, cushionCol);
      k.cyl(0.36, 0.24, 7.4, 0.08, 0.44, '#1e3a8a');
    });
  }

  function drawPoolUmbrella(cx, cy, colA = '#f97316', colB = '#f97316') {
    PH.item(cx + cy, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      // Round white marble & gold poolside drink table + glass
      PH.cyl(cx, cy, 0, 0.06, 4.2, '#d4af37');
      PH.disc(cx, cy, 4.3, 0.28, '#faf8f5', '#d4af37');
      PH.cyl(cx + 0.08, cy - 0.06, 4.4, 0.045, 1.4, '#38bdf8');
      // Soft ground shadow beneath parasol
      const sp = PH.P(cx - 0.12, cy + 0.12, 0.25);
      c.save();
      c.fillStyle = 'rgba(15, 23, 42, 0.22)';
      c.beginPath();
      c.ellipse(sp.x, sp.y, 20 * z, 11 * z, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      // Umbrella center pole
      PH.cyl(cx, cy, 4.4, 0.04, 15.6, '#e2e8f0');
    });
    // Elevated umbrella canopy drawn cleanly above both loungers
    PH.item(cx + cy + 2.2, () => {
      const apex = PH.P(cx, cy, 24.0);
      const r = 0.72;
      const rimZ = 18.8;
      const segs = 8;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const p0 = PH.P(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, rimZ);
        const p1 = PH.P(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, rimZ);
        PH.poly([apex, p0, p1], i % 2 === 0 ? colA : colB, 'rgba(15,23,42,0.22)', 0.9);
      }
      PH.disc(cx, cy, 24.2, 0.08, '#d4af37');
    });
  }

  function drawSwimmingPool(x, y, w, d) {
    PH.item(0.32, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      const rim = 0.14;
      // Crisp stone coping tiles framing the pool perimeter
      PH.topQuad(x - rim, y - rim, 0.25, w + rim * 2, rim, '#f8fafc', { stroke: '#cbd5e1' });
      PH.topQuad(x - rim, y + d, 0.25, w + rim * 2, rim, '#f8fafc', { stroke: '#cbd5e1' });
      PH.topQuad(x - rim, y, 0.25, rim, d, '#f1f5f9', { stroke: '#cbd5e1' });
      PH.topQuad(x + w, y, 0.25, rim, d, '#f1f5f9', { stroke: '#cbd5e1' });
      // Mosaic turquoise-blue inner waterline & recessed wall depth shadows
      PH.topQuad(x, y, 0.16, w, 0.16, '#0369a1');
      PH.topQuad(x, y, 0.16, 0.16, d, '#0369a1');
      PH.topQuad(x + 0.16, y + 0.16, 0.16, w - 0.16, 0.08, '#38bdf8');
      PH.topQuad(x + 0.16, y + 0.16, 0.16, 0.08, d - 0.16, '#38bdf8');
      // North shallow Baja tanning shelf
      PH.topQuad(x + 0.18, y + 0.18, 0.19, w - 0.32, 0.52, 'rgba(186,230,253,0.45)', { stroke: 'rgba(255,255,255,0.4)' });
      // South submerged entry steps
      PH.topQuad(x + 0.18, y + d - 0.58, 0.18, w - 0.36, 0.22, 'rgba(224,242,254,0.48)');
      PH.topQuad(x + 0.18, y + d - 0.32, 0.20, w - 0.36, 0.24, 'rgba(240,249,255,0.65)');
      // Gentle animated pool shimmer ripples, drifting caustics, sun glints & bobbing coral swim ring
      c.save();
      for (let i = 0; i < 3; i++) {
        const cxC = x + w * (0.36 + 0.24 * Math.sin(PH.t * 0.018 + i * 2.1));
        const cyC = y + d * (0.28 + i * 0.22 + 0.06 * Math.cos(PH.t * 0.022 + i));
        const cpC = PH.P(cxC, cyC, 0.19);
        c.fillStyle = `rgba(186, 230, 253, ${(0.16 + 0.08 * Math.sin(PH.t * 0.04 + i)).toFixed(2)})`;
        c.beginPath();
        c.ellipse(cpC.x, cpC.y, 9.5 * z, 4.2 * z, 0.25, 0, Math.PI * 2);
        c.fill();
      }
      for (let i = 0; i < 3; i++) {
        const rp = ((PH.t / 135) + i * 0.33) % 1;
        const rcx = x + w * (0.42 + (i % 2) * 0.16);
        const rcy = y + d * (0.30 + i * 0.21);
        const p = PH.P(rcx, rcy, 0.22);
        c.strokeStyle = `rgba(224,242,254,${(0.55 * (1 - rp)).toFixed(2)})`;
        c.lineWidth = 1.15;
        c.beginPath();
        c.ellipse(p.x, p.y, (3 + rp * 11) * z, (1.6 + rp * 6.0) * z, 0, 0, Math.PI * 2);
        c.stroke();
      }
      for (let g = 0; g < 2; g++) {
        const ga = Math.max(0, Math.sin(PH.t * 0.075 + g * 2.7));
        if (ga > 0.35) {
          const gp = PH.P(x + w * (0.28 + g * 0.42), y + d * (0.34 + g * 0.30), 0.25);
          c.fillStyle = `rgba(255, 255, 255, ${(ga * 0.8).toFixed(2)})`;
          c.beginPath(); c.arc(gp.x, gp.y, 1.8 * z, 0, Math.PI * 2); c.fill();
        }
      }
      const floatX = x + w * 0.45 + Math.sin(PH.t * 0.035) * 0.10;
      const floatY = y + d * 0.48 + Math.cos(PH.t * 0.028) * 0.14;
      const frp = (PH.t / 110) % 1;
      const fp = PH.P(floatX, floatY, 0.35);
      c.strokeStyle = `rgba(224, 242, 254, ${(0.55 * (1 - frp)).toFixed(2)})`;
      c.lineWidth = 1.0 * z;
      c.beginPath();
      c.ellipse(fp.x, fp.y, (5.5 + frp * 8.5) * z, (3.0 + frp * 4.5) * z, 0.15, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = '#fb7185';
      c.lineWidth = 3.2 * z;
      c.beginPath();
      c.ellipse(fp.x, fp.y, 5.2 * z, 2.8 * z, 0.15, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    });
    // Stainless chrome pool ladder rails at south-east shallow corner
    PH.item(x + w + y + d - 0.6, () => {
      const lx = x + w - 0.04;
      const ly1 = y + d - 0.78;
      const ly2 = y + d - 0.46;
      PH.line3(lx, ly1, 0.2, lx, ly1, 5.2, '#e2e8f0', 1.8);
      PH.line3(lx + 0.22, ly1, 0.2, lx + 0.22, ly1, 3.6, '#cbd5e1', 1.8);
      PH.line3(lx, ly1, 5.2, lx + 0.22, ly1, 3.6, '#f8fafc', 1.8);
      PH.line3(lx, ly2, 0.2, lx, ly2, 5.2, '#e2e8f0', 1.8);
      PH.line3(lx + 0.22, ly2, 0.2, lx + 0.22, ly2, 3.6, '#cbd5e1', 1.8);
      PH.line3(lx, ly2, 5.2, lx + 0.22, ly2, 3.6, '#f8fafc', 1.8);
    });
  }

  function drawYogaMat(gx, gy, col = '#fef08a') {
    PH.furniture(gx, gy, 1.35, 0.62, 0, k => {
      k.top(0.04, 0.04, 0.15, 1.26, 0.54, col, { stroke: '#d4af37', lw: 1.1 });
      k.cyl(0.18, 0.31, 0.2, 0.07, 0.44, '#ffffff');
    }, -0.8);
  }

  function drawRoundBistroTable(cx, cy) {
    PH.item(cx + cy + 0.5, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      // 4 Warm Honey-Oak & Appetizing Terracotta-Velvet Fine-Dining Bistro Chairs around Round Table
      const offsets = [[-0.68, 0], [0.68, 0], [0, -0.68], [0, 0.68]];
      offsets.forEach(([ox, oy]) => {
        const chx = cx + ox - 0.17;
        const chy = cy + oy - 0.17;
        PH.box(chx, chy, 0, 0.34, 0.34, 5.2, '#b47842', { tex: 'deskwood', texAlpha: 0.4 });
        PH.box(chx + 0.03, chy + 0.03, 5.2, 0.28, 0.28, 1.2, '#c2410c');
        // Warm honey-oak & brass chair backrest
        const bx = ox < 0 ? chx : ox > 0 ? chx + 0.26 : chx + 0.02;
        const by = oy < 0 ? chy : oy > 0 ? chy + 0.26 : chy + 0.02;
        const bw = Math.abs(ox) > 0 ? 0.08 : 0.30;
        const bd = Math.abs(oy) > 0 ? 0.08 : 0.30;
        PH.box(bx, by, 6.4, bw, bd, 4.8, '#b47842');
      });
      // Brushed-Brass & Warm Bronze Pedestal
      PH.cyl(cx, cy, 0, 0.24, 1.2, '#d4af37');
      PH.cyl(cx, cy, 1.2, 0.08, 8.6, '#784e32');
      // Warm Champagne-Cream Linen Tablecloth & Golden Rim Tabletop (appetizing, never hospital white)
      PH.cyl(cx, cy, 8.4, 0.52, 2.2, '#fffbeb');
      PH.disc(cx, cy, 10.65, 0.54, '#fef3c7', '#d4af37');
      // Sizzling Gourmet Entrées, Ruby Wine Goblets & Warm Amber Table Lantern
      for (const [px, py, mealCol] of [[-0.24, 0, '#ea580c'], [0.24, 0, '#d97706'], [0, -0.24, '#dc2626'], [0, 0.24, '#eab308']]) {
        PH.disc(cx + px, cy + py, 10.8, 0.11, '#fffbeb', '#d4af37');
        PH.disc(cx + px, cy + py, 10.95, 0.065, mealCol);
      }
      PH.cyl(cx + 0.14, cy + 0.14, 10.8, 0.035, 1.5, '#be123c');
      PH.cyl(cx - 0.14, cy - 0.14, 10.8, 0.035, 1.5, '#be123c');
      PH.cyl(cx, cy, 10.8, 0.055, 2.4, '#f59e0b');
      const fl = PH.P(cx, cy, 13.6);
      const flPulse = Math.sin(PH.t * 0.22 + cx);
      c.fillStyle = `rgba(251, 146, 60, ${(0.72 + flPulse * 0.13).toFixed(2)})`;
      c.beginPath(); c.arc(fl.x, fl.y, (2.5 + flPulse * 0.55) * z, 0, Math.PI * 2); c.fill();
      for (const [si, sx] of [[-0.18, 0], [0.18, 0.5]]) {
        const spSt = ((PH.t / 120) + sx) % 1;
        const stP = PH.P(cx + si + Math.sin(spSt * 4 + cx) * 0.03, cy, 11.4 + spSt * 6.5);
        c.fillStyle = `rgba(255, 251, 235, ${(0.38 * (1 - spSt)).toFixed(2)})`;
        c.beginPath(); c.arc(stP.x, stP.y, (1.4 + spSt * 1.8) * z, 0, Math.PI * 2); c.fill();
      }
    });
  }

  function drawCoffeeTableAndSet(cx, cy) {
    PH.furniture(cx - 0.55, cy - 0.38, 1.1, 0.76, 0, k => {
      // Muted champagne-brass frame with soft alabaster marble tabletop
      k.box(0.08, 0.08, 0, 0.94, 0.60, 4.8, '#c9a96e');
      k.box(0.04, 0.04, 4.8, 1.02, 0.68, 1.0, '#faf8f5');
      // Subtle porcelain tea service + white orchid centerpiece
      k.cyl(0.50, 0.38, 5.8, 0.10, 2.2, '#e2e8f0');
      k.blob(0.50, 0.38, 9.2, 0.16, '#f8fafc', 3);
      k.cyl(0.24, 0.38, 5.8, 0.07, 2.6, '#c9a96e');
      k.cyl(0.78, 0.38, 5.8, 0.10, 0.6, '#cbd5e1');
    });
  }

  function drawEspressoBar(gx, gy) {
    PH.furniture(gx, gy, 1.1, 2.2, 0, k => {
      // Subtle alabaster marble & muted champagne-brass bar counter
      k.box(0.08, 0.05, 0, 0.62, 2.1, 11.2, '#f8fafc');
      k.box(0.06, 0.04, 0, 0.66, 2.12, 1.2, '#c9a96e');
      k.box(0.04, 0.02, 11.2, 0.70, 2.16, 1.4, '#ffffff');
      // Brushed steel espresso machine + glass display
      k.box(0.14, 0.25, 12.6, 0.38, 0.52, 4.6, '#cbd5e1');
      k.box(0.14, 1.15, 12.6, 0.38, 0.58, 4.2, '#e2e8f0', { alpha: 0.7 });
      // Two muted slate-blue & brass barstools in front of bar
      k.cyl(0.92, 0.62, 0, 0.16, 8.2, '#475569');
      k.cyl(0.92, 1.52, 0, 0.16, 8.2, '#475569');
    });
  }

  function drawGardenFountain(cx, cy) {
    PH.item(cx + cy + 0.4, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      // Outer carved natural grey-limestone / granite fountain basin rim (sits directly on park grass)
      PH.cyl(cx, cy, 0, 0.94, 2.5, '#94a3b8');
      PH.disc(cx, cy, 2.55, 0.96, '#cbd5e1', '#64748b');
      // Crystal water lower pool
      PH.disc(cx, cy, 2.65, 0.78, '#38bdf8', '#0284c7');
      // Central sculpted natural stone pedestal & upper carved stone bowl
      PH.cyl(cx, cy, 2.65, 0.24, 3.4, '#94a3b8');
      PH.cyl(cx, cy, 6.0, 0.44, 1.0, '#cbd5e1');
      PH.disc(cx, cy, 7.05, 0.45, '#38bdf8', '#64748b');

      // Little Carved-Stone Cupid / Cherub Statue standing atop the upper fountain bowl
      PH.cyl(cx, cy, 7.05, 0.14, 1.0, '#94a3b8');       // Statue stone plinth
      PH.cyl(cx, cy, 8.05, 0.11, 2.6, '#cbd5e1');       // Cherub torso
      PH.disc(cx, cy, 11.4, 0.11, '#e2e8f0', '#64748b'); // Cherub head
      // Delicate carved-stone Cupid wings (left & right)
      const wBaseL = PH.P(cx - 0.06, cy - 0.06, 9.6);
      const wTipL = PH.P(cx - 0.34, cy - 0.22, 11.8);
      const wLowL = PH.P(cx - 0.24, cy - 0.14, 8.6);
      PH.poly([wBaseL, wTipL, wLowL], '#f1f5f9', '#64748b', 0.8);
      const wBaseR = PH.P(cx + 0.06, cy + 0.06, 9.6);
      const wTipR = PH.P(cx + 0.34, cy + 0.22, 11.8);
      const wLowR = PH.P(cx + 0.24, cy + 0.14, 8.6);
      PH.poly([wBaseR, wTipR, wLowR], '#f1f5f9', '#64748b', 0.8);
      // Little stone pitcher/urn held by Cupid
      PH.cyl(cx + 0.14, cy - 0.04, 9.4, 0.075, 1.4, '#94a3b8');

      // Animated concentric water ripples & sparkling fountain water jets
      c.save();
      for (let i = 0; i < 2; i++) {
        const rp = ((PH.t / 90) + i * 0.5) % 1;
        const p = PH.P(cx, cy, 2.75);
        c.strokeStyle = `rgba(224, 242, 254, ${(0.7 * (1 - rp)).toFixed(2)})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(p.x, p.y, (4 + rp * 18) * z, (2.2 + rp * 9.5) * z, 0, 0, Math.PI * 2);
        c.stroke();
      }
      // Sparkling water arcs cascading from Cupid's urn + animated water droplets, splash rings & sparkles
      const topP = PH.P(cx + 0.14, cy - 0.04, 10.6);
      const arcs = [[0.34, -0.14], [0.28, 0.24], [-0.26, 0.18], [-0.24, -0.18]];
      for (let ai = 0; ai < arcs.length; ai++) {
        const [dx, dy] = arcs[ai];
        const midP = PH.P(cx + dx * 0.55, cy + dy * 0.55, 11.4 + Math.sin(PH.t * 0.08 + ai) * 0.4);
        const endP = PH.P(cx + dx, cy + dy, 3.0);
        c.strokeStyle = 'rgba(186, 230, 253, 0.88)';
        c.lineWidth = 1.4 * z;
        c.beginPath();
        c.moveTo(topP.x, topP.y);
        c.quadraticCurveTo(midP.x, midP.y, endP.x, endP.y);
        c.stroke();
        // Traveling sparkling water-droplet beads along the quadratic arc
        for (let k = 0; k < 2; k++) {
          const u = ((PH.t / 42) + k * 0.5 + ai * 0.25) % 1;
          const omt = 1 - u;
          const bx = omt * omt * topP.x + 2 * omt * u * midP.x + u * u * endP.x;
          const by = omt * omt * topP.y + 2 * omt * u * midP.y + u * u * endP.y;
          c.fillStyle = 'rgba(240, 249, 255, 0.92)';
          c.beginPath(); c.arc(bx, by, 1.55 * z, 0, Math.PI * 2); c.fill();
        }
        // Expanding white splash ring at landing point
        const spR = ((PH.t / 55) + ai * 0.25) % 1;
        const splP = PH.P(cx + dx, cy + dy, 2.85);
        c.strokeStyle = `rgba(255, 255, 255, ${(0.62 * (1 - spR)).toFixed(2)})`;
        c.lineWidth = 0.95 * z;
        c.beginPath(); c.ellipse(splP.x, splP.y, (1.5 + spR * 4.8) * z, (0.8 + spR * 2.5) * z, 0, 0, Math.PI * 2); c.stroke();
      }
      for (const [sa, sd] of [[0.42, 0.35], [-0.46, -0.32]]) {
        const tw = Math.max(0, Math.sin(PH.t * 0.09 + sa * 8));
        if (tw > 0.4) {
          const stp = PH.P(cx + sa, cy + sd, 2.75);
          c.fillStyle = `rgba(255, 255, 255, ${(tw * 0.85).toFixed(2)})`;
          c.beginPath(); c.arc(stp.x, stp.y, 1.6 * z, 0, Math.PI * 2); c.fill();
        }
      }
      c.restore();
    });
  }

  function drawParkButterflies() {
    const specs = [
      { cx: 17.90, cy: 7.85, rx: 0.55, ry: 0.42, sp: 0.026, col: '#fde047', ph: 0.2 },
      { cx: 17.90, cy: 3.60, rx: 0.48, ry: 0.36, sp: 0.031, col: '#ffffff', ph: 2.1 },
      { cx: 17.90, cy: 13.60, rx: 0.50, ry: 0.38, sp: 0.028, col: '#fb923c', ph: 4.3 }
    ];
    specs.forEach((b, i) => {
      const gx = b.cx + Math.sin(PH.t * b.sp + b.ph) * b.rx;
      const gy = b.cy + Math.sin(PH.t * b.sp * 2 + b.ph) * b.ry;
      const gz = 7.5 + Math.sin(PH.t * 0.14 + i) * 2.4;
      PH.item(gx + gy + 0.65, () => {
        const c = PH.S.ctx;
        const z = PH.zoom;
        const bp = PH.P(gx, gy, gz);
        const wing = (1.1 + Math.abs(Math.sin(PH.t * 0.45 + i * 2.0)) * 2.3) * z;
        c.save();
        c.translate(bp.x, bp.y);
        c.fillStyle = b.col;
        c.beginPath(); c.ellipse(-wing * 0.55, -0.4 * z, wing * 0.55, 1.5 * z, -0.35, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(wing * 0.55, -0.4 * z, wing * 0.55, 1.5 * z, 0.35, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#334155';
        c.fillRect(-0.5 * z, -1.3 * z, 1.0 * z, 2.6 * z);
        c.restore();
      });
    });
  }

  function drawBbqStove(gx, gy) {
    PH.furniture(gx, gy, 1.15, 0.70, 0, k => {
      // Brick/stone BBQ base hearth & prep shelf
      k.box(0.05, 0.05, 0, 1.05, 0.60, 7.2, '#b45309', { tex: 'paver', texAlpha: 0.35 });
      k.box(0.02, 0.02, 7.2, 1.11, 0.66, 1.1, '#475569');
      // Grill firebox, glowing charcoal embers & stainless grill grate
      k.box(0.08, 0.08, 8.3, 0.56, 0.50, 1.8, '#1e293b');
      k.box(0.12, 0.12, 9.5, 0.48, 0.42, 0.7, '#f97316');
      k.box(0.10, 0.10, 10.2, 0.52, 0.46, 0.35, '#cbd5e1');
      // Open stainless hood + chimney stack
      k.box(0.08, 0.06, 10.3, 0.56, 0.08, 5.2, '#94a3b8');
      k.cyl(0.20, 0.14, 15.5, 0.05, 2.2, '#475569');
      // Side timber prep board & serving platter
      k.box(0.70, 0.10, 8.3, 0.36, 0.44, 0.7, '#d4a373');
      k.part(0.88, 0.32, 1, () => k.now.disc(0.88, 0.32, 9.1, 0.12, '#f8fafc', '#cbd5e1'));
    });
    // Soft rising BBQ smoke wisps
    PH.item(gx + gy + 0.85, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      c.save();
      for (let i = 0; i < 3; i++) {
        const sp = ((PH.t / 110) + i * 0.33) % 1;
        const px = gx + 0.32 + Math.sin(sp * 5 + i) * 0.07;
        const py = gy + 0.25 - sp * 0.12;
        const p = PH.P(px, py, 14.5 + sp * 14);
        c.fillStyle = `rgba(226, 232, 240, ${(0.45 * (1 - sp)).toFixed(2)})`;
        c.beginPath();
        c.arc(p.x, p.y, (2.2 + sp * 3.8) * z, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    });
  }

  function drawParkPicnicTable(gx, gy) {
    PH.furniture(gx, gy, 1.50, 1.32, 0, k => {
      // Dark steel legs + North & South attached timber benches
      k.box(0.24, 0.14, 0, 0.10, 1.04, 4.8, '#334155');
      k.box(1.16, 0.14, 0, 0.10, 1.04, 4.8, '#334155');
      k.box(0.06, 0.06, 4.8, 1.38, 0.28, 1.1, '#b47842', { tex: 'deskwood', texAlpha: 0.45 });
      k.box(0.06, 0.98, 4.8, 1.38, 0.28, 1.1, '#b47842', { tex: 'deskwood', texAlpha: 0.45 });
      // Cedar picnic tabletop + plates & pitcher
      k.box(0.26, 0.44, 4.8, 0.08, 0.44, 4.2, '#334155');
      k.box(1.16, 0.44, 4.8, 0.08, 0.44, 4.2, '#334155');
      k.box(0.04, 0.40, 9.0, 1.42, 0.52, 1.1, '#c89b6e', { tex: 'deskwood', texAlpha: 0.45 });
      k.part(0.45, 0.66, 1, () => k.now.disc(0.45, 0.66, 10.2, 0.11, '#f8fafc', '#cbd5e1'));
      k.part(0.98, 0.66, 1, () => k.now.disc(0.98, 0.66, 10.2, 0.11, '#f8fafc', '#cbd5e1'));
      k.cyl(0.72, 0.66, 10.1, 0.06, 1.8, '#f59e0b', { layer: 1 });
    });
  }

  function drawParkBench(gx, gy, alongY = false) {
    PH.furniture(gx, gy, alongY ? 0.34 : 1.45, alongY ? 1.45 : 0.34, alongY ? 1 : 0, k => {
      // 100% symmetric slim resort teak & cast-iron park bench (exact identical dimensions & ratio for North and South)
      k.box(0.10, 0.06, 0, 0.10, 0.22, 4.2, '#334155');
      k.box(1.25, 0.06, 0, 0.10, 0.22, 4.2, '#334155');
      k.box(0.18, 0.14, 1.5, 1.09, 0.06, 0.6, '#475569');
      // Twin slim teak seat slats + flush cast-iron end caps
      k.box(0.06, 0.05, 4.2, 1.33, 0.11, 1.2, '#b47842', { tex: 'deskwood', texAlpha: 0.45 });
      k.box(0.06, 0.18, 4.2, 1.33, 0.11, 1.2, '#b47842', { tex: 'deskwood', texAlpha: 0.45 });
      k.box(0.02, 0.05, 4.2, 0.04, 0.24, 1.3, '#334155');
      k.box(1.39, 0.05, 4.2, 0.04, 0.24, 1.3, '#334155');
    });
  }

  function drawHedge(gx, gy, w = 1.6, d = 0.48, flowering = true) {
    PH.furniture(gx, gy, w, d, 0, k => {
      k.box(0.04, 0.04, 0, w - 0.08, d - 0.08, 5.5, '#15803d');
      k.box(0.06, 0.06, 5.5, w - 0.12, d - 0.12, 1.8, '#22c55e');
      if (flowering) {
        const steps = Math.max(2, Math.floor(w * 2));
        for (let i = 0; i < steps; i++) {
          const fx = 0.22 + (i / Math.max(1, steps - 1)) * (w - 0.44);
          k.cyl(fx, d * 0.5, 7.3, 0.08, 0.45, i % 2 === 0 ? '#f472b6' : '#fef08a');
        }
      }
    });
  }

  function drawCobblestonePath(x, y, w, d) {
    // Renders individual rounded natural cobblestones along garden footpaths
    PH.item(0.25, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      const cols = Math.max(2, Math.floor(w / 0.46));
      const rows = Math.max(2, Math.floor(d / 0.46));
      const palette = ['#cbd5e1', '#e2d9c8', '#94a3b8', '#d6cfc2'];
      for (let r = 0; r < rows; r++) {
        for (let colI = 0; colI < cols; colI++) {
          const stagger = (r % 2) * 0.11;
          const sx = x + 0.18 + (colI / cols) * (w - 0.24) + stagger * 0.5;
          const sy = y + 0.18 + (r / rows) * (d - 0.24);
          if (sx > x + w - 0.14 || sy > y + d - 0.14) continue;
          const sp = PH.P(sx, sy, 0.12);
          c.fillStyle = palette[(r * 7 + colI * 3) % palette.length];
          c.strokeStyle = 'rgba(71,85,105,0.45)';
          c.lineWidth = 0.8;
          c.beginPath();
          c.ellipse(sp.x, sp.y, 4.6 * z, 2.6 * z, 0.18, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      }
    });
  }

  function drawTreeWithFlowerbed(x, y, scale = 1.0, variant = 0) {
    // Rich stone-bordered circular flowerbed with vibrant blooms beneath each park tree
    PH.item(x + y + 0.18, () => {
      PH.cyl(x, y, 0, 0.82 * scale, 1.4, '#d6cfc2');
      PH.disc(x, y, 1.45, 0.72 * scale, '#5a3d29', '#15803d');
      const bloomCols = ['#f472b6', '#facc15', '#fb7185', '#c084fc', '#f97316', '#f472b6'];
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + (variant * 0.4);
        const bx = x + Math.cos(ang) * 0.48 * scale;
        const by = y + Math.sin(ang) * 0.48 * scale;
        PH.disc(bx, by, 1.65, 0.16 * scale, '#16a34a');
        PH.disc(bx, by, 1.85, 0.11 * scale, bloomCols[i]);
      }
    });
    PHSprites.tree(x, y, scale, variant);
  }

  function drawIndoorPalm(gx, gy) {
    PH.furniture(gx, gy, 0.7, 0.7, 0, k => {
      // Ceramic ivory pot + soil
      k.cyl(0.35, 0.35, 0, 0.24, 5.2, '#f8fafc');
      k.cyl(0.35, 0.35, 5.0, 0.26, 1.2, '#d4a373');
      // Layered tropical palm foliage cluster
      k.cyl(0.35, 0.35, 5.8, 0.04, 12.0, '#15803d');
      k.blob(0.18, 0.22, 16.5, 0.26, '#16a34a', 2);
      k.blob(0.52, 0.24, 17.5, 0.25, '#22c55e', 3);
      k.blob(0.35, 0.52, 16.8, 0.24, '#15803d', 2);
      k.blob(0.35, 0.34, 21.0, 0.28, '#4ade80', 4);
    });
  }

  function drawWallEventScreen(gx, gy) {
    PH.furniture(gx, gy, 1.9, 0.22, 0, k => {
      // Sleek matte black flat-screen mount on upper lounge partition
      k.box(0.05, 0.04, 11.0, 1.80, 0.10, 9.5, '#0f172a');
      k.box(0.11, 0.13, 11.6, 1.68, 0.03, 8.2, '#042f2e');
      // Crisp bright schedule banner bars on screen
      k.box(0.18, 0.14, 17.2, 1.54, 0.03, 1.5, '#10b981');
      k.box(0.18, 0.14, 14.8, 1.15, 0.03, 1.2, '#38bdf8');
      k.box(0.18, 0.14, 12.6, 1.38, 0.03, 1.2, '#f59e0b');
    });
  }

  function drawBlockedQueueRings(gx, gy) {
    PH.item(gx + gy - 0.5, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      const cp = PH.P(gx, gy, 0.3);
      c.save();
      for (const off of [0, 0.5]) {
        const p = ((PH.t / 108) + off) % 1;
        c.strokeStyle = `rgba(239, 68, 68, ${(0.58 * (1 - p)).toFixed(2)})`;
        c.lineWidth = 1.6;
        c.beginPath();
        c.ellipse(cp.x, cp.y, (10 + p * 26) * z, (5 + p * 13) * z, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    });
  }

  // Freestanding front-facing status display board (screen faces +y toward camera)
  function statusBoard(x, y, w, style, seed) {
    PH.furniture(x, y, w, 0.30, 0, k => {
      k.box(w / 2 - 0.24, 0.04, 0, 0.48, 0.22, 1.0, '#334155');
      k.box(w / 2 - 0.05, 0.09, 1.0, 0.10, 0.10, 11.2, '#64748b');
      k.box(0.02, 0.08, 12.0, w - 0.04, 0.12, 11.2, '#0f172a');
      k.part(w / 2, 0.22, 3, () => k.now.screen('+v', 0.2, 0.08, w - 0.08, 12.6, 22.6, style, seed));
    });
  }

  // 1. Ward A & B: Rolling Bedside Vitals Monitor (EWS < 3 check), Chrome IV Infusion Stand & Overbed Table
  function drawBedsideVitalsAndIV(x, y, seed) {
    PH.furniture(x, y, 0.46, 0.46, 0, k => {
      k.cyl(0.23, 0.23, 0, 0.15, 0.8, '#475569');
      k.cyl(0.16, 0.18, 0.8, 0.03, 18.0, '#cbd5e1');
      k.box(0.08, 0.10, 8.2, 0.17, 0.15, 3.0, '#0284c7');
      k.box(0.10, 0.25, 8.7, 0.12, 0.03, 2.0, '#38bdf8');
      k.box(0.06, 0.12, 16.0, 0.10, 0.08, 2.3, '#bae6fd', { alpha: 0.78 });
      k.box(0.20, 0.12, 16.0, 0.10, 0.08, 2.3, '#fde68a', { alpha: 0.78 });
      k.box(0.22, 0.18, 11.0, 0.22, 0.13, 4.0, '#0f172a');
      k.part(0.33, 0.32, 3, () => {
        k.now.screen('+v', 0.32, 0.23, 0.42, 11.4, 14.6, 'ecg', seed || 1);
      });
    });
  }

  // Hospital Bedside Locker & Medical Gas (O2 / Vacuum) Headwall Unit
  function drawHospitalBedsideLocker(x, y) {
    PH.furniture(x, y, 0.44, 0.44, 0, k => {
      k.box(0.04, 0.04, 0, 0.36, 0.36, 8.2, '#e2e8f0');
      k.box(0.02, 0.02, 8.2, 0.40, 0.40, 0.9, '#38bdf8');
      // Water carafe & cup on bedside locker
      k.cyl(0.22, 0.22, 9.1, 0.07, 2.0, '#bae6fd');
    });
  }

  // 2. Ward A/B: Red Emergency Crash Cart, Defibrillator, O2 Cylinder, Scrub Sink, Nursing Medication Trolley & COW Cart
  function drawWardClinicalEquipment() {
    // Red 5-drawer Crash Cart at Ward A/B Nurse Bay (x = 6.7, y = 5.1)
    PH.furniture(6.7, 5.1, 0.84, 0.56, 0, k => {
      k.box(0.04, 0.04, 0, 0.76, 0.48, 1.2, '#1e293b');
      k.box(0.06, 0.06, 1.2, 0.72, 0.44, 10.2, '#dc2626');
      for (let d = 0; d < 4; d++) {
        k.box(0.12, 0.50, 2.1 + d * 2.2, 0.60, 0.03, 1.4, '#fca5a5');
      }
      k.box(0.04, 0.04, 11.4, 0.76, 0.48, 0.8, '#e2e8f0');
      k.box(0.10, 0.10, 12.2, 0.34, 0.28, 4.2, '#1e293b');
      k.box(0.14, 0.38, 12.8, 0.26, 0.03, 2.8, '#4ade80');
      k.cyl(0.60, 0.22, 12.2, 0.08, 3.2, '#bae6fd');
      k.cyl(0.78, 0.26, 2.0, 0.07, 11.0, '#15803d');
    });
    // Clinical Hand-Wash Scrub Basin & Sanitizer in Ward A (x = 6.9, y = 1.2)
    PH.furniture(6.9, 1.2, 0.58, 0.52, 0, k => {
      k.box(0.08, 0.06, 0, 0.42, 0.38, 8.2, '#e2e8f0');
      k.box(0.04, 0.04, 8.2, 0.50, 0.44, 1.6, '#ffffff');
      k.box(0.12, 0.10, 9.8, 0.34, 0.28, 0.4, '#bae6fd');
      k.cyl(0.28, 0.08, 9.8, 0.03, 2.4, '#94a3b8');
      k.box(0.44, 0.06, 12.2, 0.10, 0.08, 2.2, '#0ea5e9');
    });
    // Stainless 2-Tier Nursing Medication & Dressing Trolley + Blue Soiled-Linen Hamper in Ward B (x = 11.2, y = 3.35)
    PH.furniture(11.2, 3.35, 1.15, 0.56, 0, k => {
      // Stainless frame & 2 shelves with medicine cassettes & kidney dish
      k.box(0.04, 0.06, 0, 0.68, 0.44, 1.0, '#64748b');
      k.box(0.06, 0.08, 4.5, 0.64, 0.40, 0.8, '#cbd5e1');
      k.box(0.04, 0.06, 9.2, 0.68, 0.44, 0.9, '#e2e8f0');
      k.box(0.10, 0.12, 10.1, 0.24, 0.26, 2.0, '#38bdf8');
      k.box(0.40, 0.14, 10.1, 0.22, 0.22, 1.4, '#f8fafc');
      // Rolling blue clinical linen hamper bag beside trolley
      k.cyl(0.92, 0.28, 0, 0.18, 1.0, '#475569');
      k.cyl(0.92, 0.28, 1.0, 0.16, 8.8, '#0284c7');
      k.cyl(0.92, 0.28, 9.8, 0.17, 0.8, '#e2e8f0');
    });
    // Mobile Computer-on-Wheels (COW) Track A e-Sign & EWS < 3 Verification Cart in Ward B (x = 12.5, y = 4.7)
    PH.furniture(12.5, 4.7, 0.62, 0.56, 0, k => {
      k.cyl(0.31, 0.28, 0, 0.20, 0.9, '#475569');
      k.cyl(0.31, 0.28, 0.9, 0.04, 9.4, '#cbd5e1');
      k.box(0.06, 0.08, 10.3, 0.50, 0.40, 1.0, '#e2e8f0');
      k.box(0.12, 0.14, 11.3, 0.38, 0.10, 4.6, '#0f172a');
      k.part(0.31, 0.25, 3, () => {
        k.now.screen('+v', 0.25, 0.15, 0.47, 11.7, 15.5, 'ui', 77);
      });
    });
  }

  // 3. Gate 2 / Track B Discharge Pharmacy: Cold-Chain Fridge, Laminar Hood & TTO Unit-Dose Blister Sealer
  function drawHospitalPharmacyEquipment() {
    // Glass-door Cold-Chain Biologics Fridge (2°C–8°C) inside West Dispensary (x = 1.25, y = 12.6)
    PH.furniture(1.25, 12.6, 1.15, 0.68, 0, k => {
      k.box(0.04, 0.04, 0, 1.07, 0.60, 21.0, '#f8fafc');
      k.box(0.02, 0.02, 21.0, 1.11, 0.64, 1.8, '#0284c7');
      k.box(0.10, 0.60, 2.0, 0.95, 0.06, 17.8, '#bae6fd', { alpha: 0.65 });
      for (let s = 0; s < 3; s++) {
        k.box(0.14, 0.14, 4.2 + s * 5.0, 0.87, 0.40, 1.7, '#38bdf8');
      }
    });
    // Stainless TTO Medication Unit-Dose Blister Sealer, Pill Counter & Barcode Verification Workbench (x = 1.25, y = 14.2)
    PH.furniture(1.25, 14.2, 1.35, 1.15, 0, k => {
      k.box(0.06, 0.06, 0, 1.23, 1.03, 10.0, '#cbd5e1');
      k.box(0.02, 0.02, 10.0, 1.31, 1.11, 1.2, '#f8fafc');
      // Acrylic laminar-flow compounding hood + automated pill counter + thermal Rx label printer & sealed TTO totes
      k.box(0.10, 0.12, 11.2, 0.56, 0.48, 7.2, '#bae6fd', { alpha: 0.48 });
      k.box(0.08, 0.10, 18.4, 0.60, 0.52, 1.2, '#0284c7');
      k.box(0.74, 0.14, 11.2, 0.26, 0.28, 3.0, '#1e293b');
      k.box(0.74, 0.56, 11.2, 0.42, 0.38, 2.4, '#10b981');
      k.box(0.16, 0.68, 11.2, 0.44, 0.32, 2.2, '#0ea5e9');
    });
    statusBoard(3.8, 8.85, 1.5, 'ui', 41);
  }

  // 4. Gate 3 / Track C Billing & GL Hall: GL Server Rack, Laser Printer, Medical Coding Files & Queue Ticket Kiosk
  function drawBillingGlEquipment() {
    statusBoard(6.1, 8.85, 1.5, 'ui', 42);
    PH.furniture(8.75, 9.0, 1.85, 0.85, 0, k => {
      // Multi-function laser printer/copier + insurance GL server tower + steel medical billing cabinet
      k.box(0.04, 0.06, 0, 0.82, 0.72, 10.2, '#94a3b8');
      k.box(0.10, 0.12, 10.2, 0.48, 0.52, 4.6, '#e2e8f0');
      k.box(0.14, 0.18, 14.8, 0.40, 0.40, 1.0, '#0284c7');
      k.box(0.96, 0.06, 0, 0.82, 0.72, 19.5, '#1e293b');
      k.box(0.94, 0.04, 19.5, 0.86, 0.76, 1.4, '#0ea5e9');
      for (let b = 0; b < 4; b++) {
        k.box(1.04, 0.78, 3.2 + b * 4.0, 0.64, 0.04, 1.2, b % 2 === 0 ? '#38bdf8' : '#10b981');
      }
    });
  }

  // 5. Departure Lobby: Hard-Stop ISBAR Boarding Gate, Automated Vitals Check Pod, Wall AED & Escort Wheelchairs
  function drawDepartureBoardingGate() {
    statusBoard(13.1, 14.1, 1.5, 'ui', 43);
    // Pre-Departure Vitals & EWS Verification Stand (Stadiometer, BP Cuff & SpO2 Oximeter) at x = 13.5, y = 13.1
    PH.furniture(13.55, 13.0, 0.85, 0.65, 0, k => {
      k.box(0.06, 0.06, 0, 0.36, 0.38, 1.2, '#334155');
      k.cyl(0.24, 0.10, 1.2, 0.03, 17.5, '#cbd5e1');
      k.box(0.46, 0.10, 0, 0.34, 0.42, 9.6, '#e2e8f0');
      k.box(0.44, 0.08, 9.6, 0.38, 0.46, 1.0, '#10b981');
      k.cyl(0.62, 0.28, 10.6, 0.10, 2.0, '#0284c7');
    });
    // Escort Wheelchairs parked inside Departure Lobby
    for (let i = 0; i < 2; i++) {
      PH.furniture(11.0 + i * 0.78, 14.8, 0.70, 0.70, 0, k => {
        k.cyl(0.12, 0.35, 0, 0.06, 4.0, '#1e293b');
        k.cyl(0.58, 0.35, 0, 0.06, 4.0, '#1e293b');
        k.box(0.14, 0.14, 3.8, 0.42, 0.40, 1.2, '#0284c7');
        k.box(0.14, 0.12, 5.0, 0.42, 0.08, 6.0, '#0369a1');
      });
    }
  }

  // ---------------------------------------------------------------------------
  // FIVE-STAR HIGH-END LUXURY WELLNESS RETREAT FURNISHINGS (BUILDING 2)
  // ---------------------------------------------------------------------------

  // 6. Retreat Top-Left (x: 19.6..23.1, y: 2.6..6.8): Private VIP Doctor & ISBAR Clinical Salon
  function drawLuxuryExecutiveSalon() {
    // White Calacatta Marble & Brushed-Gold Executive Doctor Desk (x = 19.8, y = 2.95)
    PH.furniture(19.8, 2.95, 1.50, 0.90, 0, k => {
      k.box(0.06, 0.10, 0, 0.34, 0.70, 1.2, '#d4af37');
      k.box(1.10, 0.10, 0, 0.34, 0.70, 1.2, '#d4af37');
      k.box(0.08, 0.12, 1.2, 0.30, 0.66, 9.4, '#f8fafc');
      k.box(1.12, 0.12, 1.2, 0.30, 0.66, 9.4, '#f8fafc');
      k.box(0.08, 0.70, 1.8, 1.34, 0.08, 8.8, '#f1f5f9');
      k.box(0.02, 0.04, 10.6, 1.46, 0.80, 1.4, '#ffffff');
      k.top(0.38, 0.16, 12.1, 0.74, 0.44, '#1e3a8a', { stroke: '#d4af37' });
      k.box(0.54, 0.54, 12.0, 0.44, 0.07, 6.0, '#d4af37');
      k.part(0.76, 0.50, 3, () => {
        k.now.screen('-v', 0.53, 0.57, 0.95, 12.4, 17.6, 'ok', 11);
      });
      k.cyl(0.22, 0.48, 12.0, 0.07, 3.6, '#d4af37');
      k.box(0.14, 0.38, 15.4, 0.18, 0.18, 1.3, '#fef08a');
      k.box(0.54, -0.32, 5.2, 0.42, 0.38, 1.8, '#1e3a8a');
      k.box(0.54, -0.36, 7.0, 0.42, 0.10, 8.4, '#1e40af');
    });

    // Plush Pearl-Ivory Leather & Brushed-Gold Examination Daybed Lounger (x = 19.8, y = 4.95)
    PH.furniture(19.8, 4.95, 1.85, 0.98, 0, k => {
      k.box(0.04, 0.06, 0, 1.77, 0.86, 3.2, '#f1f5f9');
      k.box(0.02, 0.04, 3.2, 1.81, 0.90, 0.8, '#d4af37');
      k.box(0.08, 0.10, 4.0, 1.69, 0.78, 3.4, '#ffffff', { tex: 'quilt', texAlpha: 0.3 });
      k.box(0.12, 0.14, 7.4, 0.32, 0.70, 3.0, '#f8fafc');
      k.box(0.38, 0.20, 7.4, 0.20, 0.54, 2.2, '#d4af37');
      k.box(1.28, 0.12, 7.4, 0.44, 0.74, 0.6, '#1e3a8a');
    });

    // Italian White Calacatta Marble & Brushed-Gold Medical Vanity Credenza with Orchid (x = 21.8, y = 3.2)
    PH.furniture(21.8, 3.2, 0.78, 1.45, 0, k => {
      k.box(0.06, 0.06, 0, 0.66, 1.33, 9.2, '#f8fafc');
      k.box(0.02, 0.02, 9.2, 0.74, 1.41, 1.2, '#ffffff');
      k.box(0.04, 0.04, 8.6, 0.70, 1.37, 0.6, '#d4af37');
      k.cyl(0.38, 0.38, 10.4, 0.11, 3.4, '#1e3a8a');
      k.blob(0.38, 0.38, 15.0, 0.20, '#f472b6', 3);
      k.cyl(0.40, 1.00, 10.4, 0.09, 2.4, '#d4af37');
    });
  }

  // 7. Five-Star Pearl-Ivory & Brushed-Gold King Recovery Suite Bed
  function drawCompactLuxuryBed(x, y, duvetCol, runnerCol, seed) {
    PH.furniture(x, y, 1.88, 1.32, 0, k => {
      // Woven pearl-ivory & gold silk bedside area rug
      k.top(-0.04, -0.06, 0.10, 1.96, 1.44, '#ffffff', { stroke: '#d4af37', lw: 1.1 });
      // Pearl-ivory lacquer & brushed-gold bed platform frame
      k.box(0.06, 0.10, 0, 1.72, 1.12, 1.2, '#d4af37');
      k.box(0.08, 0.12, 1.2, 1.68, 1.08, 4.0, '#f8fafc');
      // Tufted pearl-white velvet headboard with brushed champagne-gold crown
      k.box(0.04, 0.06, 0, 0.14, 1.20, 19.5, '#e2e8f0');
      k.box(0.15, 0.14, 5.2, 0.06, 1.04, 12.2, '#ffffff', { tex: 'quilt', texAlpha: 0.35 });
      k.box(0.03, 0.05, 19.5, 0.16, 1.22, 1.2, '#d4af37');
      // Orthopaedic mattress, silk quilted duvet & runner
      k.box(0.18, 0.14, 5.2, 1.54, 1.04, 4.4, '#ffffff', { tex: 'fabric', texAlpha: 0.25 });
      k.box(0.56, 0.13, 5.7, 1.16, 1.06, 4.4, duvetCol, { tex: 'quilt', texAlpha: 0.35 });
      k.box(1.36, 0.12, 5.9, 0.32, 1.08, 4.5, runnerCol, { tex: 'fabric', texAlpha: 0.45 });
      // 2 Hotel pillows + 2 gold accent pillows
      k.box(0.22, 0.18, 9.6, 0.26, 0.38, 2.4, '#ffffff');
      k.box(0.22, 0.72, 9.6, 0.26, 0.38, 2.4, '#ffffff');
      k.box(0.36, 0.22, 9.9, 0.18, 0.32, 2.0, '#fde68a');
      k.box(0.36, 0.76, 9.9, 0.18, 0.32, 2.0, '#fde68a');
      // White marble & brushed-gold nightstand with crystal bedside lamp
      k.box(0.10, 1.26, 0, 0.36, 0.32, 8.6, '#f8fafc');
      k.box(0.08, 1.24, 8.6, 0.40, 0.36, 1.0, '#d4af37');
      k.cyl(0.26, 1.40, 9.6, 0.05, 2.4, '#d4af37');
      k.cyl(0.26, 1.40, 11.8, 0.11, 2.8, '#fef3c7');
      // Discreet bedside ISBAR & biometric monitor on stand
      k.cyl(0.38, -0.18, 0, 0.10, 1.0, '#64748b');
      k.cyl(0.38, -0.18, 1.0, 0.03, 12.0, '#cbd5e1');
      k.box(0.24, -0.28, 13.0, 0.30, 0.18, 5.4, '#0f172a');
      k.part(0.38, -0.09, 3, () => {
        k.now.screen('+v', -0.09, 0.26, 0.52, 13.5, 18.0, 'ecg', seed || 7);
      });
    });
  }

  // North Private Luxury Recovery Suites 301, 302, 303 (x: 23.1..33.6, y: 2.6..6.8, each 3.5 x 4.2)
  function drawNorthRecoverySuite(sx, duvetCol, runnerCol, chairCol, seed) {
    drawCompactLuxuryBed(sx + 0.36, 3.05, duvetCol, runnerCol, seed);
    // Private velvet lounge armchair for family visitors (left of suite entry door)
    PHSprites.armchair(sx + 0.26, 5.48, 0, { col: chairCol });
    // Custom pearl-ivory & brushed-gold suite wardrobe along right wall
    PHSprites.wardrobe(sx + 2.22, 3.05, 0, { wood: '#e2e8f0' });
    // Italian white marble & gold vanity credenza with fresh orchid (right of suite entry door)
    PH.furniture(sx + 2.48, 5.15, 0.82, 0.56, 0, k => {
      k.box(0.04, 0.04, 0, 0.74, 0.48, 8.6, '#f8fafc');
      k.box(0.02, 0.02, 8.6, 0.78, 0.52, 0.9, '#d4af37');
      k.cyl(0.38, 0.26, 9.5, 0.08, 2.2, '#1e3a8a');
      k.blob(0.38, 0.26, 12.6, 0.14, '#f472b6', 3);
      k.cyl(0.58, 0.28, 9.5, 0.06, 1.8, '#d4af37');
    });
  }

  // Retreat Bottom-Middle (x: 24.6..29.2, y: 8.8..16.0, 4.6 x 7.2): Recreation & Games Club Room
  // Features on Plain Matte Floor (Zero Tiles): 2 SEGA Arcade Machines, Drink/Snack Vending Machine,
  // Championship Pool Table (with Clear 3D Balls & Pool Sticks), Dartboard & Cozy Cinema Corner
  function drawRecreationGamesClubRoom() {
    // 1. Two Upright Retro SEGA Arcade Cabinets along North-Left Wall (facing +y, left of x=26.1..27.7 entrance)
    const drawSegaCabinet = (gx, gy, trimCol, marqueeCol, screenAccent, seed = 0) => {
      PH.furniture(gx, gy, 0.58, 0.72, 0, k => {
        const blink = Math.sin(PH.t * 0.12 + seed * 2.0) > 0;
        const joyDx = Math.sin(PH.t * 0.24 + seed * 1.7) * 0.025;
        const joyDy = Math.cos(PH.t * 0.20 + seed * 1.3) * 0.020;
        // Tall dark arcade body & glowing side-art trim strips
        k.box(0.02, 0.02, 0, 0.54, 0.56, 21.5, '#18181b');
        k.box(0.0, 0.04, 0.5, 0.05, 0.52, 20.5, trimCol);
        k.box(0.53, 0.04, 0.5, 0.05, 0.52, 20.5, trimCol);
        // Protruding backlit SEGA-style marquee header box at top (+v front banner facing camera)
        k.box(0.02, 0.06, 18.8, 0.54, 0.66, 3.0, '#0f172a');
        k.panel('+v', 0.725, 0.05, 0.53, 19.0, 21.6, marqueeCol, { layer: 2 });
        k.panel('+v', 0.73, 0.12, 0.46, 19.7, 20.9, blink ? '#ffffff' : '#fef08a', { layer: 3 });
        // Recessed CRT arcade monitor screen with live moving pixel sprites on +v
        k.panel('+v', 0.585, 0.06, 0.52, 11.4, 18.2, '#090d16', { layer: 2 });
        k.panel('+v', 0.59, 0.10, 0.48, 12.0, 17.6, '#0f172a', { layer: 3 });
        k.panel('+v', 0.595, 0.11, 0.47, 12.1, 13.6, '#16a34a', { layer: 4 });
        const playerX = 0.13 + (0.5 + 0.5 * Math.sin(PH.t * 0.11 + seed * 2.1)) * 0.24;
        const targetX = 0.13 + (0.5 + 0.5 * Math.cos(PH.t * 0.085 + seed)) * 0.24;
        const targetZ = 14.5 + Math.sin(PH.t * 0.16 + seed) * 1.1;
        k.panel('+v', 0.596, playerX, playerX + 0.09, 13.6, 15.0, screenAccent, { layer: 4 });
        k.panel('+v', 0.596, targetX, targetX + 0.07, targetZ, targetZ + 0.9, '#facc15', { layer: 4 });
        k.panel('+v', 0.595, 0.12, 0.12 + (blink ? 0.34 : 0.26), 16.7, 17.4, '#38bdf8', { layer: 4 });
        // Protruding arcade control deck with animated 3D ball-top joysticks & colorful push buttons
        k.box(0.02, 0.52, 8.6, 0.54, 0.30, 1.8, '#27272a');
        k.box(0.04, 0.54, 10.4, 0.50, 0.26, 0.3, trimCol);
        k.cyl(0.16, 0.68, 10.7, 0.018, 1.5, '#090d16');
        k.blob(0.16 + joyDx, 0.68 + joyDy, 12.4, 0.045, '#ef4444', 4);
        k.cyl(0.32, 0.68, 10.7, 0.018, 1.5, '#090d16');
        k.blob(0.32 - joyDx, 0.68 - joyDy, 12.4, 0.045, '#facc15', 4);
        k.cyl(0.24, 0.72, 10.7, 0.028, blink ? 0.55 : 0.35, '#22c55e');
        k.cyl(0.42, 0.70, 10.7, 0.028, blink ? 0.35 : 0.55, '#ef4444');
        k.cyl(0.48, 0.73, 10.7, 0.028, 0.5, '#f59e0b');
        // Lower front coin-slot panel on +v
        k.panel('+v', 0.585, 0.14, 0.44, 2.2, 7.2, '#27272a', { layer: 2 });
        k.panel('+v', 0.59, 0.20, 0.26, 4.4, 6.2, '#f97316', { layer: 3 });
        k.panel('+v', 0.59, 0.32, 0.38, 4.4, 6.2, '#f97316', { layer: 3 });
      });
    };
    drawSegaCabinet(24.76, 8.95, '#dc2626', '#facc15', '#ef4444', 0);
    drawSegaCabinet(25.42, 8.95, '#ea580c', '#dc2626', '#38bdf8', 1);

    // 2. Illuminated Snack & Cold-Drink Vending Machine along North-Right Wall (facing +y, right of entrance)
    PH.furniture(27.92, 8.95, 1.06, 0.72, 0, k => {
      const ledBlink = Math.floor(PH.t / 28) % 2 === 0;
      const shZ = 6.6 + ((PH.t * 0.09) % 13.0);
      // Classic crimson-ruby vending cabinet & top brushed trim
      k.box(0.02, 0.02, 0, 1.02, 0.66, 22.2, '#991b1b');
      k.box(0.0, 0.0, 22.2, 1.06, 0.70, 0.8, '#e2e8f0');
      k.box(0.04, 0.64, 0.8, 0.98, 0.06, 21.4, '#18181b');
      // Stocked backlit glass display front (+v) with 4 shelves of colorful drinks & snacks + gliding light shimmer
      k.panel('+v', 0.705, 0.07, 0.72, 6.2, 20.8, '#f8fafc', { layer: 2 });
      const shelfColors = [
        ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8'],
        ['#eab308', '#a855f7', '#ec4899', '#ef4444', '#22c55e'],
        ['#38bdf8', '#22c55e', '#f97316', '#facc15', '#dc2626'],
        ['#fb923c', '#ef4444', '#a855f7', '#38bdf8', '#16a34a']
      ];
      [17.6, 14.3, 11.0, 7.7].forEach((sz, rIdx) => {
        k.panel('+v', 0.71, 0.09, 0.70, sz - 0.5, sz, '#334155', { layer: 3 });
        shelfColors[rIdx].forEach((pCol, cIdx) => {
          const px0 = 0.11 + cIdx * 0.118;
          k.panel('+v', 0.712, px0, px0 + 0.085, sz + 0.1, sz + 2.3, pCol, { layer: 4 });
        });
      });
      k.panel('+v', 0.716, 0.09, 0.70, shZ, Math.min(20.6, shZ + 1.1), 'rgba(255,255,255,0.28)', { layer: 5 });
      // Right-side digital selection keypad, blinking LED readout & coin acceptor
      k.panel('+v', 0.705, 0.76, 0.98, 7.5, 19.2, '#27272a', { layer: 2 });
      k.panel('+v', 0.71, 0.79, 0.95, 16.4, 18.4, ledBlink ? '#10b981' : '#34d399', { layer: 3 });
      k.panel('+v', 0.71, 0.79, 0.95, 11.8, 15.6, '#cbd5e1', { layer: 3 });
      k.panel('+v', 0.71, 0.83, 0.91, 9.0, 10.6, ledBlink ? '#f59e0b' : '#fbbf24', { layer: 3 });
      // Bottom pickup dispense flap chute
      k.panel('+v', 0.705, 0.09, 0.72, 1.4, 4.8, '#090d16', { layer: 2 });
      k.panel('+v', 0.71, 0.13, 0.68, 3.6, 4.4, '#cbd5e1', { layer: 3 });
    });

    // 3. West-Wall Walnut & Brass Pool Cue Stick Rack (x = 24.68, y = 10.35)
    PH.furniture(24.68, 10.35, 0.24, 1.50, 0, k => {
      k.box(0.02, 0.04, 2.0, 0.14, 1.42, 17.5, '#3b1f0e');
      k.box(0.0, 0.02, 19.2, 0.18, 1.46, 0.8, '#d4af37');
      for (const cy of [0.22, 0.44, 0.66, 0.88, 1.10, 1.32]) {
        k.cyl(0.12, cy, 2.6, 0.024, 6.2, '#3b1f0e');
        k.cyl(0.12, cy, 8.8, 0.020, 9.6, '#fde68a');
        k.cyl(0.12, cy, 18.4, 0.020, 0.7, '#38bdf8');
      }
    });

    // 4. Championship Pool / Billiards Table with Animated Cue Strike & Rolling 3D Balls (x = 24.98, y = 10.35, w = 2.55, d = 1.40)
    PH.furniture(24.98, 10.35, 2.55, 1.40, 0, k => {
      const cyc = (PH.t % 270) / 270;
      let cuePull = 0;
      if (cyc < 0.28) cuePull = Math.sin((cyc / 0.28) * Math.PI * 0.5) * 0.24;
      else if (cyc < 0.38) {
        const s = (cyc - 0.28) / 0.10;
        cuePull = 0.24 * (1 - s) - 0.06 * s;
      }
      const ballT = (cyc >= 0.38 && cyc <= 0.68) ? Math.sin(((cyc - 0.38) / 0.30) * Math.PI) : 0;

      // 4 carved walnut pedestal legs with brushed-brass feet (sits directly on clean plain floor)
      for (const [lx, ly] of [[0.14, 0.14], [2.15, 0.14], [0.14, 1.00], [2.15, 1.00]]) {
        k.box(lx, ly, 0, 0.26, 0.26, 1.3, '#d4af37');
        k.box(lx + 0.02, ly + 0.02, 1.3, 0.22, 0.22, 6.0, '#3b1f0e');
      }
      // Mahogany & dark walnut apron body with brushed-brass corner brackets
      k.box(0.06, 0.06, 7.2, 2.43, 1.28, 2.4, '#3b1f0e');
      k.box(0.02, 0.02, 9.6, 2.51, 1.36, 1.4, '#5c3317');
      // Classic Tournament Emerald Baize Felt surface + crisp white break line
      k.top(0.16, 0.16, 11.05, 2.23, 1.08, '#166534', { stroke: '#d4af37', lw: 1.2 });
      k.top(0.22, 0.22, 11.10, 2.11, 0.96, '#15803d');
      k.top(0.76, 0.22, 11.12, 0.03, 0.96, 'rgba(255,255,255,0.65)');
      // 6 brass & leather billiard pockets (4 corners + 2 side pockets)
      for (const [px, py] of [[0.14, 0.14], [1.275, 0.12], [2.41, 0.14], [0.14, 1.26], [1.275, 1.28], [2.41, 1.26]]) {
        k.cyl(px, py, 10.6, 0.105, 0.65, '#d4af37');
        k.cyl(px, py, 10.9, 0.078, 0.45, '#090d16');
      }
      // 12 Glossy 3D Billiard Balls (animated white cue ball + nudged red ball + racked triangle)
      const balls = [
        [0.66 + ballT * 0.80, 0.70, '#ffffff'],
        [1.62, 0.70, '#facc15'],
        [1.74, 0.61, '#ef4444'], [1.74, 0.79, '#2563eb'],
        [1.86, 0.52, '#f97316'], [1.86, 0.70, '#111827'], [1.86, 0.88, '#9333ea'],
        [1.98, 0.44, '#be123c'], [1.98, 0.61, '#eab308'], [1.98, 0.79, '#0d9488'], [1.98, 0.96, '#dc2626'],
        [1.12 + ballT * 0.16, 0.36, '#ef4444'], [1.26, 1.04, '#facc15']
      ];
      for (const [bx, by, bcol] of balls) {
        k.blob(bx, by, 11.65, 0.082, bcol, 3);
      }
      if (cyc >= 0.36 && cyc <= 0.44) {
        k.blob(0.66, 0.70, 11.9, 0.06, '#e0f2fe', 4);
      }
      // Chalk cubes resting on corner wooden rails
      k.box(0.24, 0.06, 11.05, 0.08, 0.08, 0.55, '#38bdf8');
      k.box(2.26, 1.28, 11.05, 0.08, 0.08, 0.55, '#38bdf8');
      // 2 Prominent Two-Tone Pool Sticks (Cues): Cue 1 animates pull-back & forward shot along its axis
      const cuX = -0.54 * cuePull;
      const cuY = 0.66 * cuePull;
      const cuZ = 0.37 * cuePull;
      k.line(0.04 + cuX, 1.44 + cuY, 12.10 + cuZ, 0.30 + cuX, 1.12 + cuY, 11.95 + cuZ, '#3b1f0e', 3.8, 4);
      k.line(0.30 + cuX, 1.12 + cuY, 11.95 + cuZ, 0.55 + cuX, 0.82 + cuY, 11.75 + cuZ, '#fde68a', 2.6, 4);
      k.line(0.55 + cuX, 0.82 + cuY, 11.75 + cuZ, 0.58 + cuX, 0.78 + cuY, 11.73 + cuZ, '#38bdf8', 2.6, 4);
      // Cue 2 (resting diagonally along far-right rail)
      k.line(2.44, 0.14, 11.80, 1.90, 0.20, 11.75, '#3b1f0e', 3.6, 4);
      k.line(1.90, 0.20, 11.75, 1.22, 0.28, 11.70, '#fde68a', 2.5, 4);
      k.line(1.22, 0.28, 11.70, 1.18, 0.285, 11.70, '#38bdf8', 2.5, 4);
    });

    // 5. East-Wall Tournament Dartboard & High-Top Club Chalk/Drinks Pedestal (x = 28.0..29.1, y = 10.3..12.2)
    PH.furniture(28.92, 10.35, 0.20, 0.95, 0, k => {
      k.box(0.02, 0.04, 10.0, 0.12, 0.86, 11.5, '#18181b');
      k.cyl(0.05, 0.47, 15.6, 0.32, 0.4, '#faf8f5');
      k.cyl(0.03, 0.47, 15.6, 0.20, 0.5, '#dc2626');
      k.cyl(0.01, 0.47, 15.6, 0.08, 0.6, '#16a34a');
    });
    PH.furniture(28.12, 11.42, 0.58, 0.58, 0, k => {
      k.cyl(0.29, 0.29, 0, 0.20, 1.0, '#d4af37');
      k.cyl(0.29, 0.29, 1.0, 0.05, 8.0, '#18181b');
      k.cyl(0.29, 0.29, 9.0, 0.28, 0.9, '#3b1f0e');
      k.part(0.29, 0.29, 1, () => k.now.disc(0.29, 0.29, 9.95, 0.27, '#5c3317', '#d4af37'));
      k.cyl(0.22, 0.24, 10.0, 0.045, 1.3, '#f59e0b');
      k.cyl(0.36, 0.33, 10.0, 0.045, 1.3, '#ef4444');
    });

    // 6. Cozy Private Cinema Corner (x: 25.45..28.90, y: 12.85..15.60)
    // Solid matte dark charcoal cinema zone mat (zero pattern/tiles)
    PH.furniture(25.45, 12.85, 3.45, 2.75, 0, k => {
      k.top(0, 0, 0.10, 3.45, 2.75, '#27272a', { stroke: '#d4af37', lw: 1.2 });
    }, -0.9);

    // Wide 16:9 Illuminated Live Movie Screen, Theater Curtains, Soundbar & Tower Speakers (facing +y)
    PH.furniture(25.65, 12.95, 2.95, 0.45, 0, k => {
      const sunShift = Math.sin(PH.t * 0.03) * 0.65;
      const gliderU = 0.56 + ((PH.t * 0.004) % 1.48);
      const starBlink = Math.floor(PH.t / 24) % 2 === 0;
      // Matte black media console & brushed-gold soundbar
      k.box(0.30, 0.06, 0, 2.35, 0.34, 4.5, '#18181b');
      k.box(0.65, 0.14, 4.5, 1.65, 0.22, 1.0, '#d4af37');
      // Floor-standing left & right tower speakers
      for (const sx of [0.02, 2.69]) {
        k.box(sx, 0.06, 0, 0.24, 0.32, 14.8, '#111827');
        k.panel('+v', 0.385, sx + 0.04, sx + 0.20, 8.2, 12.6, '#c89b6e', { layer: 2 });
        k.panel('+v', 0.385, sx + 0.04, sx + 0.20, 2.8, 7.0, '#c89b6e', { layer: 2 });
      }
      // Cinema screen frame + velvet curtains + live animated movie scene on +v
      k.box(0.30, 0.08, 6.0, 2.35, 0.30, 11.6, '#090d16');
      k.panel('+v', 0.385, 0.32, 0.50, 6.2, 17.4, '#991b1b', { layer: 2 });
      k.panel('+v', 0.385, 2.45, 2.63, 6.2, 17.4, '#991b1b', { layer: 2 });
      k.panel('+v', 0.385, 0.50, 2.45, 6.5, 17.1, '#1e1b4b', { layer: 2 });
      k.panel('+v', 0.39, 0.52, 2.43, 10.0, 15.8, '#7c2d12', { layer: 3 });
      k.panel('+v', 0.395, 0.52, 2.43, 8.2, 12.6, '#d97706', { layer: 4 });
      k.panel('+v', 0.40, 1.18, 1.78, 11.2 + sunShift, 14.8 + sunShift, '#fbbf24', { layer: 5 });
      k.panel('+v', 0.40, 0.52, 2.43, 6.6, 8.4, '#0f172a', { layer: 5 });
      k.panel('+v', 0.402, gliderU, Math.min(2.40, gliderU + 0.32), 7.6, 9.2, '#f8fafc', { layer: 6 });
      k.panel('+v', 0.402, 0.72, 0.78, 16.0, 16.5, starBlink ? '#ffffff' : '#94a3b8', { layer: 6 });
      k.panel('+v', 0.402, 2.12, 2.18, 15.7, 16.2, starBlink ? '#94a3b8' : '#ffffff', { layer: 6 });
    });

    // Subtle pulsing warm theater floor reflection in front of the cinema screen
    PH.item(40.65, () => {
      const a = (0.07 + 0.03 * Math.sin(PH.t * 0.07)).toFixed(3);
      PH.poly([
        PH.P(26.15, 13.45, 0.14),
        PH.P(28.15, 13.45, 0.14),
        PH.P(28.55, 14.40, 0.14),
        PH.P(25.75, 14.40, 0.14)
      ], `rgba(251, 191, 36, ${a})`);
    });

    // Low Walnut Cinema Coffee Table with Red-Striped Popcorn Bucket & Soda Cups
    PH.furniture(26.35, 13.80, 1.55, 0.46, 0, k => {
      k.box(0.06, 0.06, 0, 1.43, 0.34, 3.4, '#4a2c1d', { top: '#6d442b' });
      // Popcorn bucket (crimson bucket + white stripe + yellow popcorn top)
      k.cyl(0.68, 0.23, 3.4, 0.11, 2.2, '#dc2626');
      k.cyl(0.68, 0.23, 4.1, 0.115, 0.7, '#ffffff');
      k.blob(0.68, 0.23, 5.7, 0.12, '#fef08a', 4);
      // Two soda cups with white straws
      k.cyl(0.32, 0.23, 3.4, 0.055, 1.7, '#ef4444');
      k.cyl(0.32, 0.23, 5.1, 0.015, 1.1, '#ffffff');
      k.cyl(1.18, 0.23, 3.4, 0.055, 1.7, '#f59e0b');
      k.cyl(1.18, 0.23, 5.1, 0.015, 1.1, '#ffffff');
    });

    // 3-Seat Plush Burgundy Velvet Cinema Recliner Row (facing north toward the cinema screen)
    PH.furniture(25.65, 14.55, 2.95, 0.85, 0, k => {
      // Base frame & 3 wide individual burgundy recliner cushions
      k.box(0.04, 0.06, 0, 2.87, 0.72, 3.0, '#18181b');
      for (let i = 0; i < 3; i++) {
        const sx = 0.14 + i * 0.94;
        k.box(sx, 0.06, 3.0, 0.78, 0.62, 1.6, '#881337', { tex: 'fabric', texAlpha: 0.4 });
        k.box(sx, 0.64, 4.6, 0.78, 0.18, 4.4, '#7e3b45', { tex: 'fabric', texAlpha: 0.4 });
      }
      // 4 Padded recliner armrests with brass/dark cupholder dots
      for (const ax of [0.02, 0.92, 1.86, 2.78]) {
        k.box(ax, 0.08, 3.0, 0.15, 0.70, 3.2, '#4c0519');
        k.cyl(ax + 0.075, 0.22, 6.2, 0.04, 0.3, '#d4af37');
      }
    }, -1.2);

    // 7. Bottom-Left Warm Brass Floor Lamp & Corner Tropical Palm beside Cinema Corner
    PH.furniture(24.82, 13.30, 0.45, 0.45, 0, k => {
      k.cyl(0.22, 0.22, 0, 0.15, 0.9, '#d4af37');
      k.cyl(0.22, 0.22, 0.9, 0.035, 13.0, '#d4af37');
      k.cyl(0.22, 0.22, 13.9, 0.17, 3.4, '#fef3c7');
    });
    drawIndoorPalm(24.78, 14.85);
  }

  // Retreat Bottom-Right (x: 29.2..33.6, y: 8.8..16.0, 4.4 x 7.2): Yoga, Wellness & Movement Studio
  // 4 soft-yellow yoga mats + raised wooden instructor stage at the bottom (south) wall
  function drawYogaStudio() {
    // Clean North wall corners (keeping sliding door x=30.6..32.2 open): Indoor palm + Props Shelf
    drawIndoorPalm(29.45, 9.05);
    PH.furniture(32.35, 9.05, 0.98, 0.5, 0, k => {
      k.box(0.04, 0.04, 0, 0.90, 0.42, 9.0, '#f8fafc');
      k.box(0.02, 0.02, 9.0, 0.94, 0.46, 0.8, '#d4af37');
      for (const [px, c] of [[0.18, '#fef08a'], [0.42, '#faf8f5'], [0.66, '#fde68a']]) k.cyl(px, 0.22, 9.8, 0.09, 2.6, c);
      k.cyl(0.82, 0.22, 9.8, 0.08, 3.2, '#fef08a');
    });

    // Exactly 4 Soft-Yellow Yoga Mats (2x2 grid facing the instructor stage at the bottom wall)
    const mats = [
      [29.75, 10.45, '#fef08a'], [31.70, 10.45, '#fef08a'],
      [29.75, 12.15, '#fef08a'], [31.70, 12.15, '#fef08a']
    ];
    for (const [mx, my, mc] of mats) drawYogaMat(mx, my, mc);

    // Compact Yoga Block & Bolster stack cleanly between Row 1 and Row 2
    PH.furniture(31.22, 11.45, 0.42, 0.48, 0, k => {
      k.box(0.06, 0.08, 0, 0.22, 0.14, 1.4, '#e6ccb2');
      k.box(0.06, 0.08, 1.4, 0.22, 0.14, 1.4, '#d4af37');
      k.cyl(0.22, 0.34, 0, 0.11, 1.8, '#faf8f5');
    });

    // Raised Wooden & Brushed-Gold Instructor Stage along the Bottom (South) Wall (x = 30.15, y = 14.30)
    PH.furniture(30.15, 14.30, 2.50, 1.35, 0, k => {
      // North-facing entry step riser & gold trim
      k.box(0.35, -0.22, 0, 1.80, 0.26, 1.6, '#b08253', { tex: 'deskwood', texAlpha: 0.4 });
      k.box(0.35, -0.23, 1.5, 1.80, 0.04, 0.25, '#d4af37');
      // Main raised stage deck with brushed-gold trim
      k.box(0.0, 0.04, 0, 2.50, 1.28, 3.2, '#8c6239', { top: '#d9b382', tex: 'deskwood', texAlpha: 0.45 });
      k.box(-0.02, 0.02, 3.1, 2.54, 1.32, 0.35, '#d4af37');
      // Instructor's soft-yellow mat + white head bolster centered on top of stage
      k.top(0.58, 0.36, 3.55, 1.34, 0.56, '#fef08a', { stroke: '#d4af37', lw: 1.1 });
      k.cyl(0.72, 0.64, 3.60, 0.065, 0.42, '#ffffff');
      // Pair of warm glowing spa lanterns on stage front corners
      for (const lx of [0.18, 2.32]) {
        k.cyl(lx, 0.20, 3.5, 0.09, 0.9, '#d4af37');
        k.cyl(lx, 0.20, 4.4, 0.075, 2.8, '#fde68a');
      }
    }, -1.2);

    // Golden Sound-Healing Gong (bottom-left beside stage) & Pilates Balls (bottom-right beside stage)
    PH.furniture(29.38, 14.45, 0.62, 0.95, 0, k => {
      k.cyl(0.31, 0.16, 0, 0.04, 13.0, '#d4af37');
      k.cyl(0.31, 0.78, 0, 0.04, 13.0, '#d4af37');
      k.box(0.27, 0.12, 12.8, 0.08, 0.70, 0.7, '#d4af37');
      k.box(0.29, 0.24, 4.2, 0.05, 0.46, 7.6, '#facc15');
    });
    PH.furniture(32.80, 14.60, 0.72, 0.78, 0, k => {
      k.blob(0.24, 0.24, 2.4, 0.22, '#fef08a', 3);
      k.blob(0.50, 0.50, 2.2, 0.20, '#faf8f5', 3);
    });
    // Breathing golden halos on stage lanterns + periodic sound-healing gong resonance wave
    PH.item(31.4 + 15.1, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      const glowA = (0.24 + 0.14 * Math.sin(PH.t * 0.07)).toFixed(2);
      c.save();
      for (const lx of [30.33, 32.47]) {
        const lp = PH.P(lx, 14.50, 6.2);
        c.fillStyle = `rgba(253, 224, 71, ${glowA})`;
        c.beginPath(); c.arc(lp.x, lp.y, 7.5 * z, 0, Math.PI * 2); c.fill();
      }
      const gp = (PH.t % 240) / 240;
      if (gp < 0.45) {
        const gt = gp / 0.45;
        const ringP = PH.P(29.69, 14.92, 8.0);
        c.strokeStyle = `rgba(250, 204, 21, ${(0.58 * (1 - gt)).toFixed(2)})`;
        c.lineWidth = 1.4 * z;
        c.beginPath(); c.ellipse(ringP.x, ringP.y, (5 + gt * 18) * z, (4 + gt * 14) * z, 0, 0, Math.PI * 2); c.stroke();
      }
      c.restore();
    });
  }

  // Single Compact 5-Star Concierge Welcome Podium & Digital ISBAR Tablet (zero duplicate multi-station hospital reception waste)
  function drawLuxuryConciergePodium(gx, gy) {
    PH.furniture(gx, gy, 0.95, 1.25, 0, k => {
      // Single alabaster marble & antique champagne-brass concierge podium
      k.box(0.08, 0.08, 0, 0.78, 1.08, 1.2, '#c9a96e');
      k.box(0.10, 0.10, 1.2, 0.74, 1.04, 10.6, '#faf8f5');
      k.box(0.06, 0.06, 11.8, 0.82, 1.12, 1.2, '#ffffff');
      k.box(0.80, 0.14, 3.0, 0.06, 0.96, 6.4, '#c9a96e');
      // Single sleek ISBAR Digital Check-In Tablet + brass desk lamp + guest welcome folder
      k.part(0.45, 0.48, 3, () => {
        k.now.screen('-v', 0.28, 0.34, 0.46, 13.0, 16.4, 'ok', 9);
      });
      k.cyl(0.32, 0.92, 13.0, 0.06, 2.8, '#c9a96e');
      k.cyl(0.32, 0.92, 15.8, 0.12, 2.2, '#fef3c7');
    });
  }

  // 9. Retreat Front-Left (x: 19.6..24.6, y: 8.8..16.0): Architectural Five-Star Hotel Entrance Lobby
  // Layout:
  // - West Wall (x = 19.8..20.8): Concierge Check-In Desk (y = 9.8..12.3) + Brass Bellhop Luggage Cart (y = 13.4..14.6)
  // - Center-Left Walk Axis (x = 20.8..22.2, y = 8.8..16.0): 100% Clear Straight Walkthrough from Front Doors (x=20.6..22.6) to Promenade (x=20.6..22.6)
  // - East Waiting Lounge Zone (x = 22.3..24.45, y = 9.5..15.2): Woven Silk Rug + Warm Terracotta Sofa + Marble Coffee Table + 2 Warm Apricot Armchairs
  function drawLuxuryHotelLobbyDetails() {
    // 1. East Waiting Lounge Area Rug (x = 22.32, y = 9.65, w = 2.08, d = 4.65 — completely clear of the x=20.8..22.2 walk path!)
    PH.furniture(22.32, 9.65, 2.08, 4.65, 0, k => {
      k.top(0, 0, 0.12, 2.08, 4.65, '#faf8f5', { stroke: '#c9a96e', lw: 1.2 });
      k.top(0.14, 0.16, 0.15, 1.80, 4.33, '#fed7aa', { stroke: '#e07a5f', lw: 0.9 });
      k.top(0.30, 0.34, 0.18, 1.48, 3.97, '#fff7ed', { stroke: '#c9a96e', lw: 0.8 });
    });

    // 2. Flat Flush Entrance Welcome Mat inside Main Sliding Doors (x = 20.9, y = 14.85 — zero vertical poles blocking doorway)
    PH.furniture(20.9, 14.85, 1.4, 0.95, 0, k => {
      k.top(0, 0, 0.12, 1.4, 0.95, '#e07a5f', { stroke: '#c9a96e', lw: 1.2 });
      k.top(0.10, 0.10, 0.14, 1.2, 0.75, '#f4a261', { stroke: '#faf8f5', lw: 0.8 });
    });

    // 3. Golden Brass Hotel Bellhop Luggage Cart & Leather Suitcases along West Wall (x = 19.85, y = 13.35)
    PH.furniture(19.85, 13.35, 0.78, 1.15, 0, k => {
      // 4 brass caster wheels + velvet platform base
      k.box(0.06, 0.08, 0, 0.66, 0.98, 1.4, '#c9a96e');
      k.top(0.08, 0.10, 1.45, 0.62, 0.94, '#e07a5f', { stroke: '#d4af37' });
      // Brass bellhop arch rails & top hanging crossbar
      k.cyl(0.12, 0.14, 1.4, 0.03, 12.5, '#d4af37');
      k.cyl(0.66, 0.14, 1.4, 0.03, 12.5, '#d4af37');
      k.cyl(0.12, 1.00, 1.4, 0.03, 12.5, '#d4af37');
      k.cyl(0.66, 1.00, 1.4, 0.03, 12.5, '#d4af37');
      k.box(0.10, 0.12, 13.9, 0.58, 0.90, 0.6, '#d4af37');
      // 2 luxury leather suitcases on the cart
      k.box(0.16, 0.22, 1.5, 0.44, 0.34, 4.2, '#b45309');
      k.box(0.18, 0.62, 1.5, 0.40, 0.28, 3.4, '#f5efe6');
    });

    // 4. Sculptural White Marble & Orchid Pedestal in East Corner of Lobby (x = 23.65, y = 14.65)
    PH.furniture(23.65, 14.65, 0.68, 0.68, 0, k => {
      k.box(0.08, 0.08, 0, 0.52, 0.52, 8.8, '#faf8f5');
      k.box(0.04, 0.04, 8.8, 0.60, 0.60, 0.9, '#c9a96e');
      k.cyl(0.34, 0.34, 9.7, 0.16, 3.0, '#ffffff');
      k.blob(0.34, 0.34, 14.2, 0.24, '#f4a261', 4);
      k.blob(0.34, 0.34, 15.8, 0.18, '#fef3c7', 3);
    });

    // 5. Sculptural White Marble & Muted-Brass Floral Art Pedestal in Resort Central Marble Promenade (x = 24.4, y = 7.35)
    PH.furniture(24.4, 7.35, 0.72, 0.72, 0, k => {
      k.box(0.08, 0.08, 0, 0.56, 0.56, 9.6, '#ffffff');
      k.box(0.04, 0.04, 9.6, 0.64, 0.64, 0.9, '#c9a96e');
      k.cyl(0.36, 0.36, 10.5, 0.18, 3.2, '#e2e8f0');
      k.blob(0.36, 0.36, 15.2, 0.24, '#f8fafc', 3);
      k.blob(0.36, 0.36, 16.8, 0.18, '#fef3c7', 4);
    });
  }

  // Outdoor Al-Fresco Warm Mediterranean & Copper-Grill Garden Bistro Pavilion on the East Lawn (x: 34.8..38.5, y: 8.4..15.6)
  function drawOutdoorGardenBistroPavilion() {
    // Open-air architectural warm bronze-gold & terracotta pergola columns + overhead trellis with glowing amber lanterns
    PH.furniture(34.95, 8.55, 3.4, 6.8, 0, k => {
      const posts = [[0.08, 0.08], [3.16, 0.08], [0.08, 3.32], [3.16, 3.32], [0.08, 6.56], [3.16, 6.56]];
      for (const [px, py] of posts) {
        k.box(px, py, 0, 0.16, 0.16, 1.4, '#d4af37');
        k.box(px + 0.02, py + 0.02, 1.4, 0.12, 0.12, 20.6, '#b47842', { tex: 'deskwood', texAlpha: 0.45 });
      }
      // Warm champagne-gold & honey-cedar perimeter top beams & cross rafters
      k.box(0.06, 0.06, 22.0, 3.28, 0.14, 1.1, '#d4af37');
      k.box(0.06, 6.60, 22.0, 3.28, 0.14, 1.1, '#d4af37');
      k.box(0.06, 0.06, 22.0, 0.14, 6.68, 1.1, '#b47842');
      k.box(3.20, 0.06, 22.0, 0.14, 6.68, 1.1, '#b47842');
      for (let r = 1; r <= 4; r++) {
        const ry = r * 1.34;
        k.box(0.14, ry, 22.4, 3.12, 0.08, 0.7, '#d4a373');
        // Warm glowing amber-orange & golden bistro festoon lanterns along pergola rafters
        k.cyl(1.10, ry + 0.04, 21.2, 0.075, 1.2, '#f59e0b');
        k.cyl(2.30, ry + 0.04, 21.2, 0.075, 1.2, '#fde047');
      }
    });

    // Chef's Live Wood-Fired Terracotta & Copper-Brass Culinary Grill & Tasting Bar at North end of Garden Bistro (x = 35.25, y = 8.85)
    PH.furniture(35.25, 8.85, 2.8, 0.92, 0, k => {
      // Warm terracotta-stone & brushed-gold culinary counter with champagne travertine pass top
      k.box(0.04, 0.06, 0, 2.72, 0.78, 10.6, '#b45309', { tex: 'paver', texAlpha: 0.35 });
      k.box(0.02, 0.02, 10.6, 2.76, 0.86, 1.3, '#fef3c7');
      k.box(0.04, 0.80, 2.4, 2.72, 0.06, 6.4, '#d4af37');
      // Wood-fired copper dome pizza/roast oven with glowing ember hearth + sizzling copper skillet & ruby wine decanters
      k.cyl(0.58, 0.44, 11.9, 0.28, 3.4, '#d97706');
      k.box(0.46, 0.64, 11.9, 0.24, 0.08, 1.6, '#f97316');
      k.cyl(1.30, 0.44, 11.9, 0.18, 2.2, '#d4af37');
      k.cyl(1.85, 0.44, 11.9, 0.13, 3.6, '#be123c');
      k.cyl(2.28, 0.44, 11.9, 0.14, 3.2, '#ea580c');
    });

    // Two Round White-Clothed Al-Fresco Bistro Tables with 4 Oak Chairs & Gourmet Plated Meals
    drawRoundBistroTable(36.65, 11.55);
    drawRoundBistroTable(36.65, 13.95);

    // Animated twinkling pergola lantern halos & warm wood-fired oven ember glow + aroma wisps
    PH.item(36.6 + 15.8, () => {
      const c = PH.S.ctx;
      const z = PH.zoom;
      c.save();
      for (let r = 1; r <= 4; r++) {
        const ry = 8.55 + r * 1.34 + 0.04;
        for (const [li, lx] of [[0, 36.05], [1, 37.25]]) {
          const al = (0.20 + 0.14 * Math.sin(PH.t * 0.09 + r * 1.3 + li)).toFixed(2);
          const lp = PH.P(lx, ry, 21.8);
          c.fillStyle = `rgba(253, 224, 71, ${al})`;
          c.beginPath(); c.arc(lp.x, lp.y, 7.2 * z, 0, Math.PI * 2); c.fill();
        }
      }
      const em = PH.P(35.83, 9.52, 12.8);
      c.fillStyle = `rgba(249, 115, 22, ${(0.28 + 0.16 * Math.sin(PH.t * 0.19)).toFixed(2)})`;
      c.beginPath(); c.arc(em.x, em.y, 6.2 * z, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 2; i++) {
        const ap = ((PH.t / 95) + i * 0.5) % 1;
        const apP = PH.P(35.83 + Math.sin(ap * 5 + i) * 0.05, 9.29 - ap * 0.08, 15.3 + ap * 7.5);
        c.fillStyle = `rgba(255, 251, 235, ${(0.36 * (1 - ap)).toFixed(2)})`;
        c.beginPath(); c.arc(apP.x, apP.y, (1.6 + ap * 2.2) * z, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    });
  }

  function render(simState) {
    const isFut = simState.mode === 'future';
    PH.setCondition(isFut ? 'fut' : 'cur');
    PH.begin(simState.elapsedSec);

    // ---------------- BUILDING 1 (LEFT, x: 1..15, y: 1..16): PARTNER HOSPITAL (100% SAME COLORS & STRUCTURE IN BOTH MODES)
    // 1. Ward A (x: 1..8, y: 1..6.5) — 4 Inpatient Beds + Bedside Vitals/IV + Bedside Lockers + Curtains + Crash Cart
    const bedBlanket = '#0ea5e9';
    PHSprites.hospitalBed(1.4, 1.4, 0, { blanket: bedBlanket, ready: true, seed: 1 });
    drawBedsideVitalsAndIV(3.52, 1.45, 11);
    PHSprites.privacyCurtain(1.4, 2.9, 0, 1.8, '#bae6fd');
    PHSprites.hospitalBed(1.4, 3.4, 0, { blanket: bedBlanket, ready: true, seed: 2 });
    drawBedsideVitalsAndIV(3.52, 3.45, 12);
    PHSprites.hospitalBed(4.4, 1.4, 0, { blanket: bedBlanket, ready: true, seed: 3 });
    drawBedsideVitalsAndIV(6.52, 1.85, 13);
    PHSprites.hospitalBed(4.4, 3.4, 0, { blanket: bedBlanket, ready: true, seed: 4 });
    drawHospitalBedsideLocker(6.52, 3.45);
    PHSprites.waitingBench(2.2, 5.3, 0, 4, '#3b82f6');

    // 2. Discharge Ward B (x: 8..15, y: 1..6.5) — 3 Discharge-Ready Beds + Vitals/Lockers + Medication Trolley + Nurse Desk
    PHSprites.hospitalBed(8.4, 1.4, 0, { blanket: '#38bdf8', ready: true, seed: 5 });
    drawBedsideVitalsAndIV(10.52, 1.45, 15);
    PHSprites.hospitalBed(8.4, 3.4, 0, { blanket: '#38bdf8', ready: true, seed: 6 });
    drawBedsideVitalsAndIV(10.52, 3.45, 16);
    PHSprites.hospitalBed(11.2, 1.4, 0, { blanket: '#38bdf8', ready: true, seed: 7 });
    drawHospitalBedsideLocker(13.3, 1.15);
    PHSprites.receptionDesk(13.2, 1.6, 1, 2.4, { col: '#0284c7', clutter: false });
    PHSprites.waitingBench(9.2, 5.3, 0, 4, '#0284c7');
    drawWardClinicalEquipment();

    // 3. Discharge Pharmacy (x: 1..5.8, y: 8.5..16) — West Staff Dispensary (x = 1.2..2.5) behind vertical counter
    PHSprites.pharmacyShelf(1.25, 9.2, 0, { stockout: false, rfid: true });
    PHSprites.pharmacyShelf(1.25, 11.0, 0, { stockout: false, rfid: true });
    drawHospitalPharmacyEquipment();
    PHSprites.receptionDesk(2.55, 9.6, 1, 3.0, { col: '#10b981', clutter: false });
    PHSprites.waitingBench(2.8, 14.6, 0, 4, '#475569');

    // 4. Billing & GL Clearance Hall (x: 5.8..10.8, y: 8.5..16)
    PHSprites.receptionDesk(6.1, 9.6, 0, 2.4, { col: '#0284c7', clutter: false });
    drawBillingGlEquipment();
    PHSprites.waitingBench(6.3, 11.8, 0, 4, '#475569');
    PHSprites.waitingBench(6.3, 13.2, 0, 4, '#475569');
    PHSprites.waitingBench(6.3, 14.6, 0, 4, '#475569');

    // 5. Hard-Stop ISBAR Boarding Gate & Departure Lobby (x: 10.8..15, y: 8.5..16)
    PHSprites.sofa(11.0, 9.2, 0, 1.45, '#0d9488');
    PHSprites.sofa(11.0, 11.2, 0, 1.45, '#0284c7');
    PHSprites.kiosk(13.8, 9.2, 1, { col: '#10b981' });
    PHSprites.kiosk(13.8, 10.6, 1, { col: '#0ea5e9' });
    PHSprites.vendingAndWater(13.6, 11.5, 0);
    drawDepartureBoardingGate();

    if (isFut) {
      // ---------------- BUILDING 2 (x: 19.6..33.6, y: 2.6..16): FIVE-STAR LUXURY RETREAT (HOTEL LOBBY + DOCTOR ROOM + 3 SUITES + LARGE YOGA STUDIO + GRAND INDOOR-OUTDOOR RESTAURANT)
      // 1. Visiting Doctor & ISBAR Clinical Salon (Top-Left, x: 19.6..23.1, y: 2.6..6.8)
      drawLuxuryExecutiveSalon();

      // 2. Three North Private Luxury Recovery Suites 301, 302 & 303 (x: 23.1..33.6, y: 2.6..6.8 — Pearl Ivory, Royal Sapphire, Champagne Gold & Royal Amethyst)
      drawNorthRecoverySuite(23.1, '#2563eb', '#1e3a8a', '#1e3a8a', 301);
      drawNorthRecoverySuite(26.6, '#fde68a', '#d4af37', '#eab308', 302);
      drawNorthRecoverySuite(30.1, '#7c3aed', '#4c1d95', '#6d28d9', 303);

      // 3. Main Entrance Five-Star Hotel Lobby (Front-Left, x: 19.6..24.6, y: 8.8..16)
      // West: Single Compact Concierge Welcome Podium (Zero Duplicate Reception Waste!) + Bellhop Cart | Center: Clear Walkthrough | East: Lounge Seating
      drawLuxuryHotelLobbyDetails();
      drawLuxuryConciergePodium(19.85, 10.35);
      PHSprites.sofa(22.48, 9.95, 0, 1.72, '#e07a5f');
      drawCoffeeTableAndSet(23.35, 11.75);
      PHSprites.armchair(22.46, 12.85, 0, { col: '#f4a261' });
      PHSprites.armchair(23.46, 12.85, 0, { col: '#f4a261' });
      drawIndoorPalm(19.85, 14.95);

      // 4. Recreation & Games Club Room (x: 24.6..29.2) + Yoga, Wellness & Movement Studio (x: 29.2..33.6, beside East Pool)
      drawRecreationGamesClubRoom();
      drawYogaStudio();

      // ---------------- MIDDLE RELAXATION & WALKING FOUNTAIN PARK (x: 16.2..19.6, exact centerline x = 17.90)
      // 1. North Shade Tree (x = 17.90) with Park Bench centered slightly lower on its inner (south) side facing the Central Fountain
      drawTreeWithFlowerbed(17.90, 3.15, 1.18, 1);
      drawParkBench(17.18, 4.75, false);

      // 2. Central Carved-Stone Cupid Fountain aligned straight with the Building 2 Side Exit Door (y = 7.85) on natural park grass
      drawGardenFountain(17.90, 7.85);

      // 3. South Shade Tree (x = 17.90) with 100%-identical size Park Bench aligned at gx = 17.18 (exact center x = 17.90)
      drawParkBench(17.18, 12.35, false);
      drawTreeWithFlowerbed(17.90, 14.35, 1.18, 0);
      drawParkButterflies();

      // Continuous Full Perimeter Walking Park Loop around Building B
      drawCobblestonePath(15.3, 1.15, 0.9, 14.85);
      drawCobblestonePath(16.2, 1.1, 17.6, 0.95);
      drawCobblestonePath(33.8, 1.15, 0.9, 14.85);

      // 3. East Swimming Pool Terrace directly beside Wellness & Movement Class (y: 2.2..7.6)
      drawSwimmingPool(35.15, 2.7, 1.75, 4.15);
      drawPoolLounger(37.15, 2.80, '#ffffff');
      drawPoolUmbrella(37.55, 4.72, '#f97316', '#f97316');
      drawPoolLounger(37.15, 5.20, '#ffffff');
      drawHedge(34.9, 7.7, 3.4, 0.35, true);

      // 4. Outdoor Al-Fresco Garden Bistro Pavilion on the East Lawn (x: 34.8..38.5, y: 8.4..15.6)
      drawOutdoorGardenBistroPavilion();
      drawHedge(34.9, 15.65, 3.5, 0.35, true);

      drawHedge(20.2, 2.25, 13.0, 0.35, true);

      // Flowering Trees & Park Seating along North Walk & East Lawn Corners
      drawTreeWithFlowerbed(23.8, 1.1, 0.72, 1);
      drawTreeWithFlowerbed(29.0, 1.1, 0.72, 0);
      drawTreeWithFlowerbed(37.8, 1.45, 0.80, 1);
      drawTreeWithFlowerbed(38.1, 8.1, 0.74, 0);
      drawTreeWithFlowerbed(38.1, 15.5, 0.76, 1);

      // Wooden Park Benches along North Walk
      drawParkBench(20.8, 1.12, false);
      drawParkBench(31.2, 1.12, false);

      PHSprites.streetLamp(15.3, 15.6);
      PHSprites.streetLamp(16.4, 5.6);
      PHSprites.streetLamp(16.4, 13.4);
      PHSprites.streetLamp(34.0, 2.2);
      PHSprites.streetLamp(34.0, 15.6);
    } else {
      // Current mode: spare trees around undeveloped grassy plot edge
      PHSprites.tree(36.8, 3.0, 0.9, 0);
      PHSprites.tree(37.4, 11.5, 0.95, 0);
    }

    // ---------------- VEHICLE SPRITES ON FRONT ROAD (y: 16.8..19.2)
    if (simState.transports) {
      simState.transports.forEach(tr => {
        if (!tr.active) return;
        if (isFut) {
          drawLuxuryConciergeVan(tr.gx, tr.gy, {
            dirX: tr.dirX,
            openDoor: tr.openDoor,
            rampProg: tr.rampProg,
            blinker: tr.blinker,
            braking: tr.braking,
            label: tr.label
          });
        } else {
          drawEmergencyAmbulance(tr.gx, tr.gy, {
            dirX: tr.dirX,
            openDoor: tr.openDoor,
            rampProg: tr.rampProg,
            blinker: tr.blinker,
            braking: tr.braking,
            label: tr.label
          });
        }
      });
    }

    // ---------------- PATIENTS, RESIDENTS, DOCTORS, NURSES, CHEFS, THERAPISTS & CONCIERGE
    simState.agents.forEach(ag => {
      if (ag.inVehicle) return;
      const isSel = ag.id === simState.selectedAgentId;
      let role = ag.role;
      if (role === 'cleaner') role = 'janitor';
      const isPatientRole = role === 'resident' || role === 'elderly' || role === 'gown' || role === 'patient';
      const lieOnSpa = ag.pose === 'LYING_ON_BED' && ag.gx > 18;
      PH.person({
        id: ag.id,
        gx: ag.gx,
        gy: ag.gy,
        z: ag.pose === 'LYING_ON_BED' ? (lieOnSpa ? 10.2 : 9.5) : (ag.z || 0),
        pose: ag.pose,
        dir: ag.dir,
        role,
        seed: ag.idNum || 1,
        axis: 'x',
        head: -1,
        blanket: ag.pose === 'LYING_ON_BED' ? (ag.gx < 18 ? bedBlanket : '#ffffff') : null,
        label: isPatientRole ? '' : (ag.roleLabel || ''),
        forceLabel: false,
        sel: isSel,
        showBubble: !!ag.showBubble,
        bubble: ag.bubble,
        bubbleType: ag.bubbleType === 'wait' ? 'fail' : ag.bubbleType,
        bubbleAlpha: ag.bubbleAlpha,
        bubbleOffsetY: ag.pose === 'LYING_ON_BED' ? 12 : 24,
        taskProg: ag.taskProg,
        prop: ag.pose === 'MOPPING' ? 'mop' : ag.pose === 'HANDOVER_INTERACTION' ? 'clipboard' : undefined
      });
    });

    PH.end();

    // Render character name tags & moving action/vehicle bubbles
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
