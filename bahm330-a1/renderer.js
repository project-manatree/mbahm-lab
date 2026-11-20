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

      // Continuous Perimeter Walking Park Loop & Front BBQ Park Patio (Target Only)
      { x: 15.3, y: 1.1, w: 0.9, d: 14.9, mat: { cur: null, fut: 'paver' } },       // West Walking Park Path (Full Loop)
      { x: 15.3, y: 1.1, w: 19.4, d: 0.95, mat: { cur: null, fut: 'paver' } },      // North Walking Park Path (Full Loop)
      { x: 33.8, y: 1.1, w: 0.9, d: 14.9, mat: { cur: null, fut: 'paver' } },       // East Park Terrace Walk (Full Loop)
      { x: 16.2, y: 7.2, w: 3.4, d: 1.3, mat: { cur: null, fut: 'paver' } },        // Park & Resort Side-Door Link
      { x: 16.55, y: 9.2, w: 2.65, d: 3.9, mat: { cur: null, fut: 'travertine' } }, // Front Park BBQ & Picnic Rest Patio
      { x: 16.2, y: 10.6, w: 0.4, d: 1.2, mat: { cur: null, fut: 'paver' } },       // BBQ Patio Walkway Link
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
      { x: 24.6, y: 8.8, w: 4.6, d: 7.2, mat: { cur: null, fut: 'ceramicCream' } }, // Recreation & Games Club Room (Ivory Porcelain + Royal Sapphire)
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
      // Luxury Resort VIP Drop-Off Bay (Facing Down at x: 20.4..23.4, y: 16.7..18.2)
      { type: 'hatch', x: 20.4, y: 16.7, w: 3.0, d: 1.5, col: 'rgba(212,175,55,0.72)', when: 'fut' }
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
      // Building 2 Bottom Front Wall (y = 16) — Main Entrance opens directly into 5-Star Hotel Lobby (x = 21.0..23.4)
      { when: 'fut', x1: 19.6, y1: 16, x2: 33.6, y2: 16, kind: 'ext', col: '#faf8f5', windows: true, open: [{ at: 21.0, w: 2.4, type: 'slide', alwaysOpen: true }] },
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
          { at: 21.2, w: 2.0, type: 'slide', alwaysOpen: true },
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
    const label = opts.label || 'Ambulance → Hospital ED';
    const len = 2.62;
    const wid = 1.18;

    PH.item(gx + gy + 1.65, () => {
      const bounce = openDoor ? 0 : Math.sin(PH.t * 0.18) * 0.18;
      const c = PH.S.ctx;
      const z = PH.zoom;
      const flashA = Math.floor(PH.t / 10) % 2 === 0;

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

      // Rear Double Doors (Framed shut when moving; swung open with ED gurney bay at entrance)
      const rearX = dirX > 0 ? gx : gx + len;
      const boxLen = len - 0.72;
      const boxX = dirX > 0 ? gx : gx + 0.72;
      const cabX = dirX > 0 ? gx + boxLen : gx;

      if (openDoor) {
        const rampX0 = dirX > 0 ? gx - 0.78 : gx + len + 0.04;
        PH.topQuad(rampX0, gy + 0.18, 0.25, 0.74, 0.80, '#cbd5e1', { stroke: '#ef4444' });
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy - 0.20, 4.0, 0.12, 0.50, 12.6, '#ffffff');
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy + wid - 0.30, 4.0, 0.12, 0.50, 12.6, '#f8fafc');
        PH.box(rearX - (dirX > 0 ? 0.14 : 0), gy - 0.18, 6.2, 0.10, 0.46, 2.2, '#dc2626');
        PH.box(rearX - (dirX > 0 ? 0.14 : 0), gy + wid - 0.28, 6.2, 0.10, 0.46, 2.2, '#dc2626');
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

      // Front Bumper Grille + Headlights
      const noseX = dirX > 0 ? gx + len + 0.01 : gx - 0.01;
      for (const hy of [gy + 0.20, gy + wid - 0.24]) {
        const hp = PH.P(noseX, hy, 5.2 + bounce);
        c.fillStyle = '#fef08a';
        c.beginPath(); c.arc(hp.x, hp.y, 2.8 * z, 0, Math.PI * 2); c.fill();
      }
      PH.line3(noseX, gy + 0.32, 5.2 + bounce, noseX, gy + wid - 0.32, 5.2 + bounce, '#94a3b8', 2.2);

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
    const label = opts.label || 'Executive Concierge Shuttle';
    const len = 2.70;
    const wid = 1.18;

    PH.item(gx + gy + 1.65, () => {
      const bounce = openDoor ? 0 : Math.sin(PH.t * 0.16) * 0.16;
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

      // Visible Fold-Out Hydraulic Boarding Ramps when parked at Hospital / Retreat Entrance Bays
      if (openDoor) {
        const ledPulse = 0.60 + 0.40 * Math.sin(PH.t * 0.12);
        // Rear Fold-Out Non-Slip Aluminium Wheelchair Ramp
        const rampX0 = dirX > 0 ? gx - 1.05 : gx + len + 0.05;
        PH.topQuad(rampX0, gy + 0.14, 0.35, 1.02, 0.90, '#e2e8f0', { stroke: '#d4af37' });
        for (let r = 1; r <= 3; r++) {
          const rx = rampX0 + r * 0.25;
          PH.line3(rx, gy + 0.18, 0.40, rx, gy + 1.00, 0.40, '#94a3b8', 1.4);
        }
        PH.box(rampX0, gy + 0.10, 0.40, 1.02, 0.08, 1.8, '#d4af37');
        PH.box(rampX0, gy + 1.00, 0.40, 1.02, 0.08, 1.8, '#d4af37');
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy - 0.18, 3.2, 0.12, 0.45, 12.2, '#fdfcf8');
        PH.box(rearX - (dirX > 0 ? 0.12 : 0), gy + wid - 0.27, 3.2, 0.12, 0.45, 12.2, '#c9a227');
        // Prominent Curb-Side Fold-Out Entrance Bridge toward Sidewalk Bay (y < gy)
        PH.topQuad(gx + 0.58, gy - 0.85, 0.40, 1.20, 0.85, '#f8fafc', { stroke: '#10b981' });
        for (let s = 1; s <= 3; s++) {
          const sy = gy - s * 0.21;
          PH.line3(gx + 0.64, sy, 0.45, gx + 1.72, sy, 0.45, '#cbd5e1', 1.5);
        }
        PH.box(gx + 0.56, gy - 0.85, 0.45, 0.09, 0.85, 1.8, '#d4af37');
        PH.box(gx + 1.70, gy - 0.85, 0.09, 0.85, 1.8, '#d4af37');
        const ledA = PH.P(rampX0 + 0.08, gy + 0.59, 0.7);
        const ledB = PH.P(gx + 1.18, gy - 0.78, 0.7);
        c.save();
        c.fillStyle = `rgba(16, 185, 129, ${ledPulse.toFixed(2)})`;
        c.beginPath(); c.arc(ledA.x, ledA.y, 3.6 * z, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(ledB.x, ledB.y, 3.6 * z, 0, Math.PI * 2); c.fill();
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

  function drawPoolUmbrella(cx, cy, colA = '#1e3a8a', colB = '#fefce8') {
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
      // Gentle animated pool shimmer ripples & floating swim ring
      c.save();
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
      const floatX = x + w * 0.45 + Math.sin(PH.t * 0.035) * 0.10;
      const floatY = y + d * 0.48 + Math.cos(PH.t * 0.028) * 0.14;
      const fp = PH.P(floatX, floatY, 0.35);
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

  function drawYogaMat(gx, gy, col = '#2563eb') {
    PH.furniture(gx, gy, 1.35, 0.62, 0, k => {
      k.top(0.04, 0.04, 0.15, 1.26, 0.54, col, { stroke: '#d4af37' });
      k.cyl(0.18, 0.31, 0.2, 0.07, 0.44, '#ffffff');
    });
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
      c.fillStyle = 'rgba(251, 146, 60, 0.75)';
      c.beginPath(); c.arc(fl.x, fl.y, 2.8 * z, 0, Math.PI * 2); c.fill();
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
    PH.furniture(gx, gy, alongY ? 0.55 : 1.45, alongY ? 1.45 : 0.55, alongY ? 1 : 0, k => {
      // Cast-iron legs + slatted warm teak park bench
      k.box(0.08, 0.08, 0, 0.10, 0.40, 4.4, '#334155');
      k.box(1.26, 0.08, 0, 0.10, 0.40, 4.4, '#334155');
      k.box(0.05, 0.08, 4.4, 1.34, 0.38, 1.2, '#b47842', { tex: 'deskwood', texAlpha: 0.45 });
      k.box(0.05, 0.06, 5.6, 1.34, 0.08, 4.8, '#9a6332');
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
  // (Gloss Ebony, White Marble, Brushed Gold & Royal Sapphire-Blue Tournament Felt — zero brown, zero green)
  function drawRecreationGamesClubRoom() {
    // 1. Wall-Mounted Ebony & Brushed-Gold Billiard Cue Rack on West Wall (x = 24.72, y = 9.55)
    PH.furniture(24.72, 9.55, 0.28, 1.55, 0, k => {
      k.box(0.02, 0.04, 2.0, 0.16, 1.46, 17.5, '#0f172a');
      k.box(0.0, 0.02, 19.5, 0.20, 1.50, 0.9, '#d4af37');
      for (const cy of [0.22, 0.44, 0.66, 0.88, 1.10, 1.32]) {
        k.cyl(0.14, cy, 3.0, 0.025, 15.6, '#f8fafc');
      }
    });

    // 2. Championship Royal-Sapphire Blue Felt, Gloss-Ebony & Brushed-Gold Billiards / Pool Table (x = 25.15, y = 9.55, w = 2.25, d = 1.38)
    PH.furniture(25.15, 9.55, 2.25, 1.38, 0, k => {
      // Woven pearl-white & gold silk club carpet beneath billiards table
      k.top(-0.18, -0.18, 0.10, 2.61, 1.74, '#ffffff', { stroke: '#d4af37', lw: 1.4 });
      k.top(-0.08, -0.08, 0.13, 2.41, 1.54, '#f1f5f9', { stroke: '#94a3b8', lw: 0.9 });
      // 4 gloss-ebony pedestal legs with brushed-gold feet
      for (const [lx, ly] of [[0.14, 0.14], [1.85, 0.14], [0.14, 0.98], [1.85, 0.98]]) {
        k.box(lx, ly, 0, 0.26, 0.26, 1.4, '#d4af37');
        k.box(lx + 0.02, ly + 0.02, 1.4, 0.22, 0.22, 6.2, '#0f172a');
      }
      // Gloss-ebony & brushed-gold slate cabinet
      k.box(0.06, 0.06, 7.2, 2.13, 1.26, 2.4, '#0f172a');
      k.box(0.02, 0.02, 9.6, 2.21, 1.34, 1.4, '#1e293b');
      // Vivid Royal-Sapphire Blue tournament felt playing surface (Five-Star Penthouse Club style)
      k.top(0.16, 0.16, 11.05, 1.93, 1.06, '#1e3a8a', { stroke: '#d4af37', lw: 1.2 });
      k.top(0.22, 0.22, 11.10, 1.81, 0.94, '#2563eb');
      // 6 brushed-gold & onyx billiard pockets (4 corners + 2 side pockets)
      for (const [px, py] of [[0.14, 0.14], [1.12, 0.12], [2.10, 0.14], [0.14, 1.24], [1.12, 1.26], [2.10, 1.24]]) {
        k.cyl(px, py, 10.6, 0.09, 0.6, '#d4af37');
        k.cyl(px, py, 10.9, 0.065, 0.4, '#0f172a');
      }
      // Racked colorful billiard balls + white cue ball + 2 cues
      const balls = [
        [0.62, 0.69, '#ffffff'],
        [1.42, 0.69, '#facc15'],
        [1.54, 0.61, '#ef4444'], [1.54, 0.77, '#f97316'],
        [1.66, 0.53, '#fde047'], [1.66, 0.69, '#0f172a'], [1.66, 0.85, '#f472b6']
      ];
      for (const [bx, by, bcol] of balls) {
        k.cyl(bx, by, 11.15, 0.048, 0.75, bcol);
      }
      k.box(0.32, 0.35, 11.2, 0.95, 0.03, 0.3, '#f8fafc');
      k.box(0.85, 0.98, 11.2, 0.95, 0.03, 0.3, '#fde68a');
    });

    // 3. Concert Ebony & Brushed-Gold Baby Grand Piano + Pearl-White Leather Piano Bench (x = 25.05, y = 12.95)
    PH.furniture(25.05, 12.95, 1.85, 1.75, 0, k => {
      for (const [lx, ly] of [[0.18, 0.18], [1.48, 0.22], [0.24, 1.38]]) {
        k.cyl(lx, ly, 0, 0.06, 1.2, '#d4af37');
        k.cyl(lx, ly, 1.2, 0.07, 6.8, '#0f172a');
      }
      k.box(0.28, 0.78, 0, 0.12, 0.28, 7.6, '#d4af37');
      k.box(0.12, 0.12, 8.0, 1.12, 1.48, 3.6, '#0f172a');
      k.box(1.12, 0.16, 8.0, 0.56, 1.06, 3.6, '#0f172a');
      k.top(0.20, 0.20, 11.7, 1.40, 1.28, '#d4af37', { stroke: '#eab308' });
      k.box(0.18, 0.16, 14.8, 1.42, 1.26, 0.5, '#1e293b');
      k.cyl(1.42, 1.28, 11.7, 0.025, 3.4, '#d4af37');
      k.box(0.02, 0.22, 9.2, 0.22, 1.24, 1.4, '#f8fafc');
      k.box(0.08, 0.26, 10.6, 0.12, 1.16, 0.4, '#1e293b');
      k.box(0.22, 0.56, 11.7, 0.08, 0.52, 2.8, '#f8fafc');
      // Pearl-white & gold tufted piano bench
      k.box(0.32, 1.56, 0, 0.74, 0.34, 5.4, '#d4af37');
      k.box(0.30, 1.54, 5.4, 0.78, 0.38, 1.2, '#ffffff');
    });

    // 4. VIP White-Marble & Brushed-Gold Mahjong Table with Royal-Sapphire Velvet Surface & Pearl Club Chairs (x = 27.65, y = 9.75)
    PH.furniture(27.65, 9.75, 1.22, 1.22, 0, k => {
      // 2 pearl-white & royal-sapphire velvet club chairs (North & South of Mahjong table)
      k.box(0.38, -0.26, 0, 0.46, 0.36, 5.2, '#f8fafc');
      k.box(0.38, -0.28, 5.2, 0.46, 0.10, 5.4, '#1e3a8a');
      k.box(0.38, 1.12, 0, 0.46, 0.36, 5.2, '#f8fafc');
      k.box(0.38, 1.38, 5.2, 0.46, 0.10, 5.4, '#1e3a8a');
      // Square white Calacatta marble & gold mahjong table with royal sapphire surface
      k.cyl(0.61, 0.61, 0, 0.26, 1.0, '#d4af37');
      k.cyl(0.61, 0.61, 1.0, 0.10, 7.6, '#e2e8f0');
      k.box(0.08, 0.08, 8.6, 1.06, 1.06, 1.6, '#ffffff');
      k.top(0.16, 0.16, 10.25, 0.90, 0.90, '#1e3a8a', { stroke: '#d4af37', lw: 1.1 });
      // 4 miniature ivory & gold mahjong tile walls in a square
      k.box(0.30, 0.26, 10.3, 0.62, 0.06, 0.7, '#ffffff');
      k.box(0.30, 0.90, 10.3, 0.62, 0.06, 0.7, '#ffffff');
      k.box(0.26, 0.32, 10.3, 0.06, 0.56, 0.7, '#ffffff');
      k.box(0.90, 0.32, 10.3, 0.06, 0.56, 0.7, '#ffffff');
    });

    // 5. White Calacatta Marble & Brushed-Gold Royal Chess Table with Sapphire Velvet Club Chairs (x = 27.65, y = 12.95)
    PH.furniture(27.65, 12.95, 1.22, 1.22, 0, k => {
      // 2 pearl-white & champagne-gold velvet club chairs
      k.box(0.38, -0.26, 0, 0.46, 0.36, 5.2, '#f8fafc');
      k.box(0.38, -0.28, 5.2, 0.46, 0.10, 5.4, '#d4af37');
      k.box(0.38, 1.12, 0, 0.46, 0.36, 5.2, '#f8fafc');
      k.box(0.38, 1.38, 5.2, 0.46, 0.10, 5.4, '#d4af37');
      // White marble & gold pedestal table with crystal/ebony chessboard inlay
      k.cyl(0.61, 0.61, 0, 0.26, 1.0, '#d4af37');
      k.cyl(0.61, 0.61, 1.0, 0.10, 7.6, '#e2e8f0');
      k.box(0.10, 0.10, 8.6, 1.02, 1.02, 1.6, '#ffffff');
      k.top(0.22, 0.22, 10.25, 0.78, 0.78, '#f8fafc', { stroke: '#d4af37', lw: 1.1 });
      k.top(0.32, 0.32, 10.30, 0.28, 0.28, '#1e293b');
      k.top(0.60, 0.60, 10.30, 0.28, 0.28, '#1e293b');
      // Gold & crystal chess pieces
      for (const px of [0.38, 0.52, 0.66, 0.80]) {
        k.cyl(px, 0.38, 10.35, 0.035, 1.1, '#d4af37');
        k.cyl(px, 0.82, 10.35, 0.035, 1.1, '#38bdf8');
      }
    });
  }

  // Retreat Bottom-Right (x: 29.2..33.6, y: 8.8..16.0, 4.4 x 7.2): Yoga, Wellness & Movement Studio (beside East Pool & Terrace)
  function drawYogaStudio() {
    // Floor-to-ceiling crystal mirror wall & brushed-gold ballet/stretch barre along the south wall
    PH.furniture(29.45, 15.62, 3.9, 0.3, 0, k => {
      k.box(0.0, 0.18, 0, 3.9, 0.08, 24.0, '#e0f2fe', { alpha: 0.75 });
      k.box(0.0, 0.16, 0, 3.9, 0.12, 0.8, '#d4af37');
      k.box(0.0, 0.02, 10.2, 3.9, 0.08, 0.8, '#d4af37');
      for (const px of [0.2, 1.4, 2.6, 3.7]) k.box(px, 0.04, 0, 0.06, 0.12, 10.2, '#d4af37');
    });
    // White marble instructor platform with sound-healing golden gong (front of class)
    PH.furniture(29.45, 9.05, 0.95, 1.35, 0, k => {
      k.box(0.06, 0.08, 0, 0.84, 1.20, 1.6, '#ffffff');
      k.cyl(0.42, 0.22, 1.6, 0.04, 15.0, '#d4af37');
      k.cyl(0.42, 1.08, 1.6, 0.04, 15.0, '#d4af37');
      k.box(0.38, 0.18, 16.4, 0.10, 0.96, 0.8, '#d4af37');
      k.box(0.40, 0.38, 5.4, 0.06, 0.54, 9.4, '#facc15');
    });
    // 6 Yoga mats in Royal Sapphire, Champagne Gold & Amethyst Silk (zero green, zero brown)
    const mats = [
      [29.85, 10.9, '#2563eb'], [31.75, 10.9, '#eab308'],
      [29.85, 12.4, '#7c3aed'], [31.75, 12.4, '#2563eb'],
      [29.85, 13.9, '#eab308'], [31.75, 13.9, '#7c3aed']
    ];
    for (const [mx, my, mc] of mats) drawYogaMat(mx, my, mc);
    // White marble & gold props shelf
    PH.furniture(32.35, 9.05, 0.98, 0.5, 0, k => {
      k.box(0.04, 0.04, 0, 0.90, 0.42, 9.0, '#f8fafc');
      k.box(0.02, 0.02, 9.0, 0.94, 0.46, 0.8, '#d4af37');
      for (const [px, c] of [[0.18, '#2563eb'], [0.42, '#eab308'], [0.66, '#7c3aed']]) k.cyl(px, 0.22, 9.8, 0.09, 2.6, c);
      k.cyl(0.82, 0.22, 9.8, 0.07, 2.8, '#38bdf8');
    });
  }

  // 9. Retreat Front-Left (x: 19.6..24.6, y: 8.8..16.0): Subtle, Understated Five-Star Hotel Entrance Lobby, Concierge & Lounge
  function drawLuxuryHotelLobbyDetails() {
    // Subtle Woven Pearl-Alabaster, Soft Dove-Slate & Muted Champagne-Brass Silk Area Rug (x = 21.35, y = 10.05)
    PH.furniture(21.35, 10.05, 2.85, 4.25, 0, k => {
      k.top(0, 0, 0.12, 2.85, 4.25, '#faf8f5', { stroke: '#c9a96e', lw: 1.2 });
      k.top(0.18, 0.18, 0.15, 2.49, 3.89, '#cbd5e1', { stroke: '#e2e8f0', lw: 0.9 });
      k.top(0.42, 0.42, 0.18, 2.01, 3.41, '#f8fafc', { stroke: '#c9a96e', lw: 0.9 });
    });

    // Understated Deep-Slate & Muted-Brass Welcome Carpet Runner + Stanchion Posts inside Hotel Main Entrance (x = 21.3, y = 14.7)
    PH.furniture(21.3, 14.7, 1.8, 1.25, 0, k => {
      k.top(0.15, 0.02, 0.14, 1.50, 1.20, '#334155', { stroke: '#c9a96e', lw: 1.2 });
      k.cyl(0.08, 0.15, 0, 0.07, 8.5, '#c9a96e');
      k.cyl(1.72, 0.15, 0, 0.07, 8.5, '#c9a96e');
      k.cyl(0.08, 1.10, 0, 0.07, 8.5, '#c9a96e');
      k.cyl(1.72, 1.10, 0, 0.07, 8.5, '#c9a96e');
    });

    // Subtle Alabaster Marble & White-Orchid Welcome Pedestal inside Main Entrance Foyer (x = 23.55, y = 14.45)
    PH.furniture(23.55, 14.45, 0.72, 0.72, 0, k => {
      k.cyl(0.36, 0.36, 0, 0.26, 1.0, '#c9a96e');
      k.cyl(0.36, 0.36, 1.0, 0.21, 8.4, '#f8fafc');
      k.cyl(0.36, 0.36, 9.4, 0.26, 0.9, '#c9a96e');
      k.cyl(0.36, 0.36, 10.3, 0.16, 3.0, '#e2e8f0');
      k.blob(0.36, 0.36, 14.8, 0.24, '#ffffff', 4);
      k.blob(0.36, 0.36, 16.4, 0.18, '#fef3c7', 3);
    });

    // Sculptural White Marble & Muted-Brass Floral Art Pedestal in Resort Central Marble Promenade (x = 24.4, y = 7.35)
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

      // 3. Main Entrance Five-Star Hotel Lobby, Concierge & Espresso Lounge (Front-Left, x: 19.6..24.6, y: 8.8..16 — Subtle Pearl-Alabaster, Muted Slate-Blue & Antique Champagne-Brass)
      drawLuxuryHotelLobbyDetails();
      PHSprites.receptionDesk(19.85, 9.4, 1, 2.2, { col: '#c9a96e', wood: '#f8fafc', clutter: false });
      drawWallEventScreen(21.8, 8.92);
      drawEspressoBar(19.85, 12.6);
      PHSprites.sofa(21.65, 10.3, 0, 1.8, '#f8fafc');
      drawCoffeeTableAndSet(22.55, 12.2);
      PHSprites.sofa(21.65, 13.4, 0, 1.8, '#475569');
      PHSprites.armchair(23.55, 11.4, 0, { col: '#64748b' });
      drawIndoorPalm(23.75, 9.2);
      drawIndoorPalm(19.85, 15.1);

      // 4. Recreation & Games Club Room (x: 24.6..29.2) + Yoga, Wellness & Movement Studio (x: 29.2..33.6, beside East Pool)
      drawRecreationGamesClubRoom();
      drawYogaStudio();

      // ---------------- MIDDLE REST & BBQ PARK (x: 15..19.6), EAST POOL (y: 2.2..7.6) & EAST GARDEN BISTRO PAVILION (y: 8.4..15.6)
      // 1. Back Shade Park Rest Lawn (y: 2.2..7.0) — Big Shade Tree & Rest Benches (No Fountain)
      drawTreeWithFlowerbed(17.9, 4.2, 1.25, 1);
      drawParkBench(17.15, 2.35, false);
      drawParkBench(17.15, 5.95, false);

      // 2. Front Big BBQ & Picnic Rest Area (y: 8.6..15.8) — BBQ Stove, Picnic Table, Seat & Big Front Tree
      drawBbqStove(18.0, 9.45);
      drawParkBench(16.62, 9.55, true);
      drawParkPicnicTable(17.25, 11.20);
      drawTreeWithFlowerbed(17.9, 14.45, 1.25, 0);

      // Continuous Full Perimeter Walking Park Loop around Building B
      drawCobblestonePath(15.3, 1.15, 0.9, 14.85);
      drawCobblestonePath(16.2, 1.1, 17.6, 0.95);
      drawCobblestonePath(33.8, 1.15, 0.9, 14.85);
      drawCobblestonePath(16.2, 7.25, 3.3, 1.2);

      // 3. East Swimming Pool Terrace directly beside Wellness & Movement Class (y: 2.2..7.6)
      drawSwimmingPool(35.15, 2.7, 1.75, 4.15);
      drawPoolLounger(37.15, 2.80, '#ffffff');
      drawPoolUmbrella(37.55, 4.72, '#1e3a8a', '#fefce8');
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
            label: tr.label
          });
        } else {
          drawEmergencyAmbulance(tr.gx, tr.gy, {
            dirX: tr.dirX,
            openDoor: tr.openDoor,
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
