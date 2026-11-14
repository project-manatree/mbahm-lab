// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Simulation
// - Identical Building Structure in Before & After
// - 28 Concurrent Patients + Only 1 Concierge
// - Before: Patients stuck waiting in queues across Ward, Billing, Main Entrance,
//   Retreat Reception, and Doctor Check-Up
// - After: Hospital & Retreat run smoothly and efficiently — no waiting / minimal
//   waiting, continuous active flow and brisk Concierge Transport Left <-> Right
// ============================================================================

const SimApp = (() => {
  const STAGES = [
    { id: 1, short: "Hospital Ward", current: { va: 15, nva: 45 }, future: { va: 15, nva: 2 } },
    { id: 2, short: "Billing & Discharge", current: { va: 15, nva: 45 }, future: { va: 15, nva: 0 } },
    { id: 3, short: "Concierge Transport", current: { va: 25, nva: 35 }, future: { va: 25, nva: 0 } },
    { id: 4, short: "Retreat Suite", current: { va: 15, nva: 30 }, future: { va: 15, nva: 0 } },
    { id: 5, short: "Doctor Check-Up", current: { va: 15, nva: 30 }, future: { va: 15, nva: 2 } },
    { id: 6, short: "Pool & Dining", current: { va: 20, nva: 0 }, future: { va: 30, nva: 0 } }
  ];

  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    selectedAgentId: 'res-1',
    masterClock: 0,
    conciergeCycle: 0,
    transports: [
      { id: 'tr-1', gx: 5.2, gy: 14.85, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' }
    ],
    agents: []
  };

  // 28 Patients distributed across the full Hospital-to-Retreat pathway
  const RESIDENT_PROFILES = Array.from({ length: 28 }, (_, i) => ({
    id: `res-${i + 1}`,
    roleLabel: 'Patient',
    name: `Patient #${i + 1}`,
    offset: i * 10
  }));

  // Clean clinical & operational staff — ONLY 1 Concierge
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', role: 'doctor', gx: 3.4, gy: 2.6, pose: 'EXAMINING' },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 8.2, gy: 2.6, pose: 'TYPING_TERMINAL' },
    { id: 'st-3', roleLabel: 'Staff', role: 'reception', gx: 2.6, gy: 8.9, pose: 'TYPING_TERMINAL' },
    // Single Concierge operating the Left <-> Right transport between the two downward-facing Main Entrances
    { id: 'st-4', roleLabel: 'Concierge', role: 'concierge', gx: 6.2, gy: 14.3, pose: 'HANDOVER_INTERACTION' },
    { id: 'st-5', roleLabel: 'Staff', role: 'reception', gx: 20.6, gy: 8.9, pose: 'TYPING_TERMINAL' },
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 20.8, gy: 2.6, pose: 'EXAMINING' },
    { id: 'st-7', roleLabel: 'Nurse', role: 'nurse', gx: 26.8, gy: 4.5, pose: 'EXAMINING' }
  ];

  function getTotals(mode) {
    let va = 0, nva = 0;
    STAGES.forEach(s => { va += s[mode].va; nva += s[mode].nva; });
    return { va, nva, total: va + nva };
  }

  function locateStage(elapsed, mode) {
    let cum = 0;
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i][mode];
      const stTot = s.va + s.nva;
      if (elapsed <= cum + stTot || i === STAGES.length - 1) {
        const into = Math.max(0, Math.min(stTot, elapsed - cum));
        const inWait = into > s.va && s.nva > 0;
        return {
          stageIdx: i,
          inWait,
          vaProg: s.va > 0 ? Math.min(1, into / s.va) : 1,
          waitMins: Math.max(0, Math.round(into - s.va))
        };
      }
      cum += stTot;
    }
    return { stageIdx: 5, inWait: false, vaProg: 1, waitMins: 0 };
  }

  function buildAgents() {
    simState.agents = [];
    RESIDENT_PROFILES.forEach((rp, idx) => {
      simState.agents.push({
        id: rp.id,
        idNum: idx + 1,
        roleLabel: 'Patient',
        role: 'resident',
        offset: rp.offset,
        gx: 2.3,
        gy: 2.0,
        z: 0,
        dir: 'SE',
        pose: 'LYING_ON_BED',
        bubble: null,
        bubbleType: 'ok',
        showBubble: false,
        inVehicle: false
      });
    });

    STAFF_DEFS.forEach((sd, idx) => {
      simState.agents.push({
        id: sd.id,
        idNum: 40 + idx,
        roleLabel: sd.roleLabel,
        role: sd.role,
        gx: sd.gx,
        gy: sd.gy,
        z: 0,
        dir: 'SE',
        pose: sd.pose,
        bubble: null,
        bubbleType: 'ok',
        showBubble: false,
        inVehicle: false
      });
    });
  }

  function updateTransport(tr, ph) {
    if (ph < 0.16) {
      tr.gx = 5.2;
      tr.gy = 14.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Picking Up →';
    } else if (ph < 0.50) {
      const t = (ph - 0.16) / 0.34;
      tr.gx = 5.2 + t * 15.9;
      tr.gy = 14.85;
      tr.dirX = 1;
      tr.openDoor = false;
      tr.label = 'Concierge Transport →';
    } else if (ph < 0.66) {
      tr.gx = 21.1;
      tr.gy = 14.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Dropping Off';
    } else {
      const t = (ph - 0.66) / 0.34;
      tr.gx = 21.1 - t * 15.9;
      tr.gy = 16.55;
      tr.dirX = -1;
      tr.openDoor = false;
      tr.label = '← Concierge Returning';
    }
  }

  function stepSimulation() {
    if (!simState.playing) return;
    const isFut = simState.mode === 'future';
    const totals = getTotals(simState.mode);
    const speedMul = isFut ? 1.8 : 1.0;
    simState.masterClock = (simState.masterClock + 0.14 * simState.speed) % totals.total;
    simState.conciergeCycle = (simState.conciergeCycle + 0.0042 * simState.speed * speedMul) % 1;

    const ph1 = simState.conciergeCycle;
    const tr = simState.transports[0];
    updateTransport(tr, ph1);

    // Single Concierge (`st-4`) steps out at Hospital Main Entrance (Left) and Retreat Main Entrance (Right)
    const concierge = simState.agents.find(a => a.id === 'st-4');
    if (concierge) {
      if (ph1 < 0.16) {
        concierge.inVehicle = false;
        concierge.gx = 6.3;
        concierge.gy = 14.2;
        concierge.pose = 'HANDOVER_INTERACTION';
      } else if (ph1 >= 0.50 && ph1 < 0.66) {
        concierge.inVehicle = false;
        concierge.gx = 22.2;
        concierge.gy = 14.2;
        concierge.pose = 'HANDOVER_INTERACTION';
      } else {
        concierge.inVehicle = true;
        concierge.gx = tr.gx + 1.4;
        concierge.gy = tr.gy + 0.5;
      }
    }

    // Track counts per stage so waiting queues / active slots never stack on top of each other
    const waitSlot = [0, 0, 0, 0, 0, 0];
    const actSlot = [0, 0, 0, 0, 0, 0];

    simState.agents.forEach((ag, idx) => {
      if (ag.role !== 'resident') return;
      ag.inVehicle = false;
      ag.z = 0;
      ag.showBubble = false;
      ag.bubble = null;

      const el = (simState.masterClock + ag.offset) % totals.total;
      const loc = locateStage(el, simState.mode);
      const sIdx = loc.stageIdx;

      if (sIdx === 0) {
        // Stage 1: Hospital Ward (Left Building Top Floor, x: 1..11, y: 1..7.5)
        const beds = [
          { gx: 2.3, gy: 1.9 },
          { gx: 2.3, gy: 4.0 },
          { gx: 5.6, gy: 1.9 },
          { gx: 5.6, gy: 4.0 }
        ];
        if (loc.inWait) {
          const w = waitSlot[0]++;
          ag.gx = 4.2 + (w % 6) * 0.85;
          ag.gy = 6.1 + Math.floor(w / 6) * 0.75;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting (+45m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[0]++;
          if (a < 4) {
            ag.gx = beds[a].gx;
            ag.gy = beds[a].gy;
            ag.pose = 'LYING_ON_BED';
          } else {
            // Smoothly walking down from Ward towards Billing door (x=8.2, y: 3.5 -> 7.2)
            ag.gx = 7.6 + (a % 2) * 0.9;
            ag.gy = 3.6 + loc.vaProg * 3.4;
            ag.dir = 'SW';
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 1) {
        // Stage 2: Billing & Discharge (Left Building Bottom Floor, x: 1..11, y: 7.5..14)
        if (loc.inWait) {
          const w = waitSlot[1]++;
          const row = Math.floor(w / 5);
          ag.gx = 1.7 + (w % 5) * 0.8;
          ag.gy = 11.3 + row * 1.3;
          ag.pose = row < 2 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting (+45m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[1]++;
          // Smooth active clearance & walking to Hospital Main Entrance (y: 8.8 -> 13.2)
          ag.gx = 5.4 + (a % 3) * 1.1;
          ag.gy = 8.6 + loc.vaProg * 4.2;
          ag.dir = 'SW';
          ag.pose = 'WALKING';
          if (a === 0 && isFut) { ag.bubble = 'No Waiting ✓'; ag.bubbleType = 'ok'; ag.showBubble = true; }
        }
      } else if (sIdx === 2) {
        // Stage 3: Hospital Main Entrance -> Concierge Transport Left-to-Right -> Retreat Main Entrance
        if (loc.inWait) {
          const w = waitSlot[2]++;
          ag.gx = 4.8 + (w % 5) * 0.75;
          ag.gy = 13.2 - Math.floor(w / 5) * 0.8;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting Transport (+35m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[2]++;
          if (ph1 < 0.16) {
            const t = ph1 / 0.16;
            ag.gx = 5.8 + (a % 2) * 0.6;
            ag.gy = 13.2 + t * 1.3;
            ag.dir = 'SW';
            ag.pose = 'WALKING';
          } else if (ph1 < 0.50) {
            if (a === 0) {
              ag.gx = tr.gx + 0.9;
              ag.gy = tr.gy + 0.5;
              ag.z = 5;
              ag.dir = 'SE';
              ag.pose = 'SITTING';
            } else {
              // Next cleared patient smoothly walking through Hospital Main Entrance lobby ready for pickup
              ag.gx = 6.0 + (a % 3) * 0.8;
              ag.gy = 11.2 + loc.vaProg * 2.2;
              ag.dir = 'SW';
              ag.pose = 'WALKING';
            }
          } else if (ph1 < 0.66) {
            const t = (ph1 - 0.50) / 0.16;
            ag.gx = 21.8 + (a % 2) * 0.6;
            ag.gy = 14.5 - t * 1.6;
            ag.dir = 'NE';
            ag.pose = 'WALKING';
          } else {
            ag.gx = 21.5 + (a % 3) * 0.8;
            ag.gy = 12.8 - loc.vaProg * 1.8;
            ag.dir = 'NE';
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 3) {
        // Stage 4: Retreat Reception & Suites (Right Building Bottom-Left, x: 19..25.5, y: 7.5..14)
        if (loc.inWait) {
          const w = waitSlot[3]++;
          ag.gx = 19.8 + (w % 4) * 0.85;
          ag.gy = 12.5 + Math.floor(w / 4) * 0.75;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting (+30m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[3]++;
          if (a < 2) {
            ag.gx = a === 0 ? 20.5 : 23.5;
            ag.gy = 10.6;
            ag.pose = 'LYING_ON_BED';
          } else {
            ag.gx = 21.2 + (a % 3) * 1.0;
            ag.gy = 11.8 - loc.vaProg * 3.4;
            ag.dir = 'NE';
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 4) {
        // Stage 5: Doctor Check-Up Room (Right Building Top-Left, x: 19..25.5, y: 1..7.5)
        if (loc.inWait) {
          const w = waitSlot[4]++;
          ag.gx = 20.6 + (w % 4) * 0.85;
          ag.gy = 6.3;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting (+30m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[4]++;
          if (a === 0) {
            ag.gx = 20.7;
            ag.gy = 4.5;
            ag.pose = 'LYING_ON_BED';
          } else {
            ag.gx = 22.2 + (a % 2) * 1.1;
            ag.gy = 5.5 - loc.vaProg * 2.2;
            ag.dir = 'SE';
            ag.pose = 'WALKING';
          }
        }
      } else {
        // Stage 6: Hydro Pool, Spa & Dining (Right Building Right Wing, x: 25.5..31, y: 1..14)
        const a = actSlot[5]++;
        const spots = [
          { gx: 27.3, gy: 3.0, pose: 'SWIMMING_POOL' },
          { gx: 28.9, gy: 4.5, pose: 'SWIMMING_POOL' },
          { gx: 27.5, gy: 5.5, pose: 'SWIMMING_POOL' },
          { gx: 27.0, gy: 8.6, pose: 'LYING_ON_BED' },
          { gx: 29.4, gy: 8.6, pose: 'LYING_ON_BED' },
          { gx: 26.8, gy: 11.6, pose: 'SITTING' },
          { gx: 29.2, gy: 11.6, pose: 'SITTING' },
          { gx: 27.8, gy: 12.8, pose: 'SITTING' }
        ];
        const sp = spots[a % spots.length];
        ag.gx = sp.gx + Math.floor(a / spots.length) * 0.45;
        ag.gy = sp.gy;
        ag.pose = sp.pose;
      }
    });
  }

  function handleWorldClick(mx, my) {
    for (const ag of simState.agents) {
      if (ag.inVehicle) continue;
      const p = IsoRenderer.toIso(ag.gx, ag.gy, 14);
      if (Math.hypot(mx - p.x, my - p.y) < 22) {
        simState.selectedAgentId = ag.id;
        return;
      }
    }
  }

  function setMode(mode) {
    simState.mode = mode;
    const bCur = document.getElementById('btn-mode-current');
    const bFut = document.getElementById('btn-mode-future');
    if (bCur) bCur.className = 'mode-btn ' + (mode === 'current' ? 'active-current' : '');
    if (bFut) bFut.className = 'mode-btn ' + (mode === 'future' ? 'active-future' : '');
  }

  function loop() {
    stepSimulation();
    IsoRenderer.render(simState);
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    buildAgents();
    IsoRenderer.init('iso-canvas', handleWorldClick);
    requestAnimationFrame(loop);
  });

  return {
    setMode
  };
})();
