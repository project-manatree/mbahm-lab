// ============================================================================
// BAHM330-A1: Expanded Two-Building Hospital-to-Retreat Real-Time Simulation
// - 36 Concurrent Patients + 10 Clinical/Operational Staff + 1 Concierge
// - Identical Building Structure in Both Modes
// - Current Process: Patients wait in long queues across Ward A/B, Pharmacy,
//   Billing Hall, Hospital Main Entrance, Retreat Reception, and Doctor Check-Up
// - Optimized Process: Smooth, continuous real-time flow with zero/minimal waiting
// ============================================================================

const SimApp = (() => {
  const STAGES = [
    { id: 1, short: "Ward A & B", current: { va: 14, nva: 42 }, future: { va: 14, nva: 2 } },
    { id: 2, short: "Pharmacy & Billing", current: { va: 14, nva: 46 }, future: { va: 14, nva: 0 } },
    { id: 3, short: "Concierge Transport", current: { va: 24, nva: 36 }, future: { va: 22, nva: 0 } },
    { id: 4, short: "Retreat Suites", current: { va: 14, nva: 30 }, future: { va: 14, nva: 0 } },
    { id: 5, short: "Doctor & Nurse Check", current: { va: 14, nva: 28 }, future: { va: 14, nva: 2 } },
    { id: 6, short: "Pool, Spa & Dining", current: { va: 22, nva: 0 }, future: { va: 32, nva: 0 } }
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
      { id: 'tr-1', gx: 11.6, gy: 16.85, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' }
    ],
    agents: []
  };

  // 36 Patients distributed across the full Hospital-to-Retreat pathway
  const RESIDENT_PROFILES = Array.from({ length: 36 }, (_, i) => ({
    id: `res-${i + 1}`,
    roleLabel: 'Patient',
    offset: i * 8
  }));

  // 10 Clinical/Operational Staff + ONLY 1 Concierge
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', role: 'doctor', gx: 3.1, gy: 2.3, pose: 'EXAMINING' },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 6.2, gy: 3.2, pose: 'WALKING', patrol: [{ gx: 6.2, gy: 2.0 }, { gx: 6.2, gy: 5.0 }] },
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.2, gy: 2.3, pose: 'EXAMINING' },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 13.4, gy: 2.8, pose: 'TYPING_TERMINAL' },
    { id: 'st-5', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 2.6, gy: 9.7, pose: 'TYPING_TERMINAL' },
    { id: 'st-6', roleLabel: 'Staff', role: 'reception', gx: 7.4, gy: 9.7, pose: 'TYPING_TERMINAL' },
    // Single Concierge operating the Left <-> Right transport between the two downward-facing Main Entrances
    { id: 'st-7', roleLabel: 'Concierge', role: 'concierge', gx: 12.6, gy: 16.2, pose: 'HANDOVER_INTERACTION' },
    { id: 'st-8', roleLabel: 'Staff', role: 'reception', gx: 24.6, gy: 9.7, pose: 'TYPING_TERMINAL' },
    { id: 'st-9', roleLabel: 'Doctor', role: 'doctor', gx: 24.4, gy: 2.3, pose: 'EXAMINING' },
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 29.6, gy: 2.3, pose: 'TYPING_TERMINAL' },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 33.4, gy: 4.5, pose: 'EXAMINING' }
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
          vaProg: s.va > 0 ? Math.min(1, into / s.va) : 1
        };
      }
      cum += stTot;
    }
    return { stageIdx: 5, inWait: false, vaProg: 1 };
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
        gx: 2.2,
        gy: 2.0,
        tx: 2.2,
        ty: 2.0,
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
        idNum: 50 + idx,
        roleLabel: sd.roleLabel,
        role: sd.role,
        gx: sd.gx,
        gy: sd.gy,
        z: 0,
        dir: 'SE',
        pose: sd.pose,
        patrol: sd.patrol || null,
        patrolIdx: 0,
        bubble: null,
        bubbleType: 'ok',
        showBubble: false,
        inVehicle: false
      });
    });
  }

  function updateTransport(tr, ph) {
    if (ph < 0.16) {
      // Stopped at Hospital Main Entrance (x=11.6, y=16.85)
      tr.gx = 11.6;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Picking Up →';
    } else if (ph < 0.50) {
      // Driving Left -> Right across the distance gap (x: 11.6 -> 24.2)
      const t = (ph - 0.16) / 0.34;
      tr.gx = 11.6 + t * 12.6;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = false;
      tr.label = 'Concierge Transport →';
    } else if (ph < 0.66) {
      // Stopped at Retreat Main Entrance (x=24.2, y=16.85)
      tr.gx = 24.2;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Dropping Off';
    } else {
      // Returning Right -> Left along the return lane (x: 24.2 -> 11.6, y=18.6)
      const t = (ph - 0.66) / 0.34;
      tr.gx = 24.2 - t * 12.6;
      tr.gy = 18.6;
      tr.dirX = -1;
      tr.openDoor = false;
      tr.label = '← Concierge Returning';
    }
  }

  function stepSimulation() {
    if (!simState.playing) return;
    const isFut = simState.mode === 'future';
    const totals = getTotals(simState.mode);
    const speedMul = isFut ? 1.85 : 1.0;
    simState.masterClock = (simState.masterClock + 0.13 * simState.speed) % totals.total;
    simState.conciergeCycle = (simState.conciergeCycle + 0.0044 * simState.speed * speedMul) % 1;

    const ph1 = simState.conciergeCycle;
    const tr = simState.transports[0];
    updateTransport(tr, ph1);

    // Single Concierge (`st-7`) steps out at Hospital Main Entrance (Left) and Retreat Main Entrance (Right)
    const concierge = simState.agents.find(a => a.id === 'st-7');
    if (concierge) {
      if (ph1 < 0.16) {
        concierge.inVehicle = false;
        concierge.gx = 12.7;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
      } else if (ph1 >= 0.50 && ph1 < 0.66) {
        concierge.inVehicle = false;
        concierge.gx = 25.3;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
      } else {
        concierge.inVehicle = true;
        concierge.gx = tr.gx + 1.4;
        concierge.gy = tr.gy + 0.5;
      }
    }

    const waitSlot = [0, 0, 0, 0, 0, 0];
    const actSlot = [0, 0, 0, 0, 0, 0];

    simState.agents.forEach((ag, idx) => {
      if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        const dx = target.gx - ag.gx;
        const dy = target.gy - ag.gy;
        const d = Math.hypot(dx, dy);
        if (d < 0.08) ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        else { ag.gx += (dx / d) * 0.04; ag.gy += (dy / d) * 0.04; ag.dir = dy > 0 ? 'SW' : 'NE'; }
        return;
      }
      if (ag.role !== 'resident') return;

      ag.inVehicle = false;
      ag.z = 0;
      ag.showBubble = false;
      ag.bubble = null;

      const el = (simState.masterClock + ag.offset) % totals.total;
      const loc = locateStage(el, simState.mode);
      const sIdx = loc.stageIdx;

      let tx = ag.gx, ty = ag.gy, snap = false;

      if (sIdx === 0) {
        // Stage 1: Hospital Ward A & B (x: 1..15, y: 1..6.5)
        const beds = [
          { gx: 2.2, gy: 1.8 }, { gx: 2.2, gy: 3.8 }, { gx: 5.2, gy: 1.8 }, { gx: 5.2, gy: 3.8 },
          { gx: 9.2, gy: 1.8 }, { gx: 9.2, gy: 3.8 }, { gx: 12.0, gy: 1.8 }
        ];
        if (loc.inWait) {
          const w = waitSlot[0]++;
          tx = (w < 4 ? 2.4 : 9.4) + (w % 4) * 0.85;
          ty = 5.4 + Math.floor(w / 8) * 0.65;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0 || w === 4) { ag.bubble = 'Waiting (+42m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[0]++;
          if (a < beds.length) {
            tx = beds[a].gx;
            ty = beds[a].gy;
            ag.pose = 'LYING_ON_BED';
            snap = true;
          } else {
            // Walking through Central Hospital Corridor (y = 7.4)
            tx = 3.5 + (a % 5) * 2.1;
            ty = 7.4;
            ag.dir = 'SE';
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 1) {
        // Stage 2: Discharge Pharmacy & Billing Hall (x: 1..10.8, y: 8.5..16)
        if (loc.inWait) {
          const w = waitSlot[1]++;
          if (w < 4) {
            // Waiting in Pharmacy queue
            tx = 1.7 + (w % 4) * 0.78;
            ty = 14.6;
            ag.pose = 'SITTING_WAIT';
            if (w === 0) { ag.bubble = 'Waiting Rx (+46m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
          } else {
            // Waiting in Billing Hall benches
            const bw = w - 4;
            tx = 6.5 + (bw % 4) * 0.85;
            ty = 11.8 + Math.min(2, Math.floor(bw / 4)) * 1.4;
            ag.pose = bw < 8 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
            if (bw === 0) { ag.bubble = 'Waiting Billing (+46m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
          }
        } else {
          const a = actSlot[1]++;
          // Smooth active walk through Pharmacy -> Billing -> Departure Lobby
          tx = 3.5 + loc.vaProg * 8.0;
          ty = 10.2 + (a % 3) * 1.3;
          ag.dir = 'SE';
          ag.pose = 'WALKING';
          if (a === 0 && isFut) { ag.bubble = 'No Waiting ✓'; ag.bubbleType = 'ok'; ag.showBubble = true; }
        }
      } else if (sIdx === 2) {
        // Stage 3: Departure Lobby -> Hospital Main Entrance (y=16) -> Concierge Transport -> Retreat Main Entrance (y=16)
        if (loc.inWait) {
          const w = waitSlot[2]++;
          tx = 11.3 + (w % 4) * 0.8;
          ty = 14.8 - Math.floor(w / 4) * 1.1;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting Transport (+36m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[2]++;
          if (ph1 < 0.16) {
            const t = ph1 / 0.16;
            tx = 12.2 + (a % 2) * 0.65;
            ty = 14.8 + t * 1.6;
            ag.dir = 'SW';
            ag.pose = 'WALKING';
          } else if (ph1 < 0.50) {
            if (a === 0) {
              ag.gx = tr.gx + 0.9;
              ag.gy = tr.gy + 0.5;
              ag.z = 5;
              ag.dir = 'SE';
              ag.pose = 'SITTING';
              return;
            } else {
              tx = 11.8 + (a % 3) * 0.85;
              ty = 12.0 + loc.vaProg * 2.8;
              ag.dir = 'SW';
              ag.pose = 'WALKING';
            }
          } else if (ph1 < 0.66) {
            const t = (ph1 - 0.50) / 0.16;
            tx = 24.8 + (a % 2) * 0.65;
            ty = 16.4 - t * 1.8;
            ag.dir = 'NE';
            ag.pose = 'WALKING';
          } else {
            tx = 24.5 + (a % 3) * 0.85;
            ty = 14.2 - loc.vaProg * 2.4;
            ag.dir = 'NE';
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 3) {
        // Stage 4: Retreat Reception & Private Recovery Suites 101-104 (x: 23..32.5, y: 8.5..16)
        const suiteBeds = [
          { gx: 29.0, gy: 9.4 }, { gx: 31.1, gy: 9.4 },
          { gx: 29.0, gy: 13.2 }, { gx: 31.1, gy: 13.2 }
        ];
        if (loc.inWait) {
          const w = waitSlot[3]++;
          tx = 23.8 + (w % 4) * 0.85;
          ty = 13.6 + Math.floor(w / 4) * 0.8;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting Check-In (+30m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[3]++;
          if (a < suiteBeds.length) {
            tx = suiteBeds[a].gx;
            ty = suiteBeds[a].gy;
            ag.pose = 'LYING_ON_BED';
            snap = true;
          } else {
            tx = 24.5 + (a % 3) * 1.4;
            ty = 7.4;
            ag.dir = 'NE';
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 4) {
        // Stage 5: Doctor Check-Up Clinic & 24/7 Nurse Triage Station (x: 23..32.5, y: 1..6.5)
        if (loc.inWait) {
          const w = waitSlot[4]++;
          tx = 24.2 + (w % 5) * 1.2;
          ty = 5.6;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) { ag.bubble = 'Waiting Doctor (+28m)'; ag.bubbleType = 'wait'; ag.showBubble = true; }
        } else {
          const a = actSlot[4]++;
          if (a === 0) {
            tx = 24.3; ty = 3.9; ag.pose = 'LYING_ON_BED'; snap = true;
          } else if (a === 1) {
            tx = 26.6; ty = 3.9; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 29.2 + (a % 3) * 0.9;
            ty = 4.6;
            ag.dir = 'SE';
            ag.pose = 'WALKING';
          }
        }
      } else {
        // Stage 6: Hydro Pool, Thermal Spa & Dining Bistro (x: 32.5..37, y: 1..16)
        const a = actSlot[5]++;
        const spots = [
          { gx: 33.8, gy: 2.8, pose: 'SWIMMING_POOL' },
          { gx: 35.2, gy: 4.2, pose: 'SWIMMING_POOL' },
          { gx: 34.0, gy: 5.8, pose: 'SWIMMING_POOL' },
          { gx: 33.8, gy: 9.4, pose: 'LYING_ON_BED' },
          { gx: 35.8, gy: 9.4, pose: 'LYING_ON_BED' },
          { gx: 33.6, gy: 12.4, pose: 'SITTING' },
          { gx: 35.6, gy: 12.4, pose: 'SITTING' },
          { gx: 33.6, gy: 14.6, pose: 'SITTING' },
          { gx: 35.6, gy: 14.6, pose: 'SITTING' }
        ];
        const sp = spots[a % spots.length];
        tx = sp.gx + Math.floor(a / spots.length) * 0.35;
        ty = sp.gy;
        ag.pose = sp.pose;
        snap = sp.pose === 'LYING_ON_BED' || sp.pose === 'SWIMMING_POOL';
      }

      if (snap || Math.hypot(tx - ag.gx, ty - ag.gy) > 4.5) {
        ag.gx = tx;
        ag.gy = ty;
      } else {
        ag.gx += (tx - ag.gx) * 0.16;
        ag.gy += (ty - ag.gy) * 0.16;
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
