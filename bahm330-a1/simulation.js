// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Simulation
// - 16 Concurrent Patients across Hospital (Left) and Retreat (Right)
// - Only 1 Concierge operating the Concierge Transport between the two
//   downward-facing Main Entrances (Left <-> Right)
// ============================================================================

const SimApp = (() => {
  const STAGES = [
    {
      id: 1,
      short: "Hospital Ward",
      name: "Hospital Ward Discharge Check",
      current: { va: 15, nva: 45, rca: "Paper discharge charts cause a +45m wait in the Hospital Ward." },
      future:  { va: 15, nva: 5,  rca: "Digital discharge summary sent ahead to the Retreat (5m wait)." },
      wp: { gx: 4.5, gy: 3.5 }
    },
    {
      id: 2,
      short: "Billing & Discharge",
      name: "Hospital Billing & Insurance Clearance",
      current: { va: 15, nva: 45, rca: "Manual paper billing causes a +45m wait at the Billing counter." },
      future:  { va: 15, nva: 0,  rca: "Fast-Track Discharge Lounge clears billing automatically (0m wait)." },
      wp: { gx: 4.5, gy: 10.5 }
    },
    {
      id: 3,
      short: "Concierge Transport",
      name: "Concierge Transport (Hospital Main Entrance → Retreat Main Entrance)",
      current: { va: 30, nva: 30, rca: "Patients wait +30m at the Hospital Main Entrance for the returning Concierge Transport." },
      future:  { va: 35, nva: 0,  rca: "Concierge Transport immediately picks up patients Left-to-Right (0m wait)." },
      wp: { gx: 15.0, gy: 15.5 }
    },
    {
      id: 4,
      short: "Retreat Suite",
      name: "Retreat Reception & Suite Check-In",
      current: { va: 10, nva: 30, rca: "Unprepared suites and paper check-in cause a +30m lobby wait." },
      future:  { va: 10, nva: 0,  rca: "Instant check-in directly into pre-prepared Retreat Suites (0m wait)." },
      wp: { gx: 22.0, gy: 11.0 }
    },
    {
      id: 5,
      short: "Doctor Check-Up",
      name: "Doctor Check-Up Room (Baseline Vitals & ECG)",
      current: { va: 15, nva: 30, rca: "Doctor is paged after arrival, causing a +30m wait for check-up." },
      future:  { va: 15, nva: 5,  rca: "On-site Doctor in the Check-Up Room completes baseline exam in 5m." },
      wp: { gx: 22.0, gy: 4.0 }
    },
    {
      id: 6,
      short: "Pool & Dining",
      name: "Hydro Pool, Spa & Dining Onboarding",
      current: { va: 10, nva: 0,  rca: "Manual sign-off for Hydro Pool, Spa, and Dining Bistro." },
      future:  { va: 10, nva: 0,  rca: "Cleared for Hydro Pool, Spa, and Dining Bistro." },
      wp: { gx: 28.0, gy: 10.0 }
    }
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
      { id: 'tr-1', gx: 5.2, gy: 14.8, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' }
    ],
    agents: []
  };

  // 16 Patients distributed across the full journey
  const RESIDENT_PROFILES = Array.from({ length: 16 }, (_, i) => ({
    id: `res-${i + 1}`,
    roleLabel: 'Patient',
    name: `Patient #${i + 1}`,
    sub: 'Transfer Patient',
    hr: `${72 + (i % 8)} bpm`,
    bp: '122/76 · 98%',
    offset: i * 17
  }));

  // Clean clinical & operational staff — ONLY 1 Concierge (who operates the transport)
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', name: 'Doctor', sub: 'Hospital Ward Doctor', role: 'doctor', gx: 3.4, gy: 2.6, pose: 'EXAMINING', label: 'Ward Check', stageIdx: 0 },
    { id: 'st-2', roleLabel: 'Nurse', name: 'Nurse', sub: 'Hospital Ward Nurse', role: 'nurse', gx: 8.2, gy: 2.6, pose: 'TYPING_TERMINAL', label: 'Discharge Prep', stageIdx: 0 },
    { id: 'st-3', roleLabel: 'Staff', name: 'Staff', sub: 'Billing Staff', role: 'reception', gx: 2.6, gy: 8.9, pose: 'TYPING_TERMINAL', label: 'Billing Clearance', stageIdx: 1 },
    // Single Concierge operating the Left <-> Right transport between the two Main Entrances
    { id: 'st-4', roleLabel: 'Concierge', name: 'Concierge', sub: 'Concierge Transport Escort', role: 'concierge', gx: 6.2, gy: 14.3, pose: 'HANDOVER_INTERACTION', label: 'Picking Up Patient', stageIdx: 2 },
    { id: 'st-5', roleLabel: 'Staff', name: 'Staff', sub: 'Retreat Reception Staff', role: 'reception', gx: 20.6, gy: 8.9, pose: 'TYPING_TERMINAL', label: 'Suite Check-In', stageIdx: 3 },
    { id: 'st-6', roleLabel: 'Doctor', name: 'Doctor', sub: 'Retreat Check-Up Doctor', role: 'doctor', gx: 20.8, gy: 2.6, pose: 'EXAMINING', label: 'Doctor Check-Up', stageIdx: 4 },
    { id: 'st-7', roleLabel: 'Nurse', name: 'Nurse', sub: 'Retreat Nurse', role: 'nurse', gx: 26.8, gy: 4.5, pose: 'EXAMINING', label: 'Pool & Spa Care', stageIdx: 5 }
  ];

  function getTotals(mode) {
    let va = 0, nva = 0;
    STAGES.forEach(s => { va += s[mode].va; nva += s[mode].nva; });
    const total = va + nva;
    return { va, nva, total, pce: ((va / total) * 100).toFixed(1) };
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
        name: rp.name,
        sub: rp.sub,
        hr: rp.hr,
        bp: rp.bp,
        role: 'resident',
        offset: rp.offset,
        gx: 2.3,
        gy: 2.0,
        z: 0,
        dir: 'SE',
        pose: 'LYING_ON_BED',
        actionLabel: 'Hospital Ward',
        bubble: null,
        bubbleType: 'ok',
        stageIdx: 0,
        inWait: false,
        inVehicle: false,
        elapsed: 0
      });
    });

    STAFF_DEFS.forEach((sd, idx) => {
      simState.agents.push({
        id: sd.id,
        idNum: 30 + idx,
        roleLabel: sd.roleLabel,
        name: sd.name,
        sub: sd.sub,
        hr: '72 bpm',
        bp: 'On Duty',
        role: sd.role,
        gx: sd.gx,
        gy: sd.gy,
        z: 0,
        dir: 'SE',
        pose: sd.pose,
        actionLabel: sd.label,
        bubble: null,
        bubbleType: 'ok',
        stageIdx: sd.stageIdx,
        inWait: false,
        inVehicle: false,
        elapsed: 0
      });
    });
  }

  // Updates the Concierge Transport between Hospital Main Entrance (x=5.2, y=14.8)
  // and Retreat Main Entrance (x=21.1, y=14.8) along the horizontal front road
  function updateTransport(tr, ph) {
    if (ph < 0.16) {
      // Phase 1: Stopped at Left Building Main Entrance (Hospital Pick-Up)
      tr.gx = 5.2;
      tr.gy = 14.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Picking Up →';
    } else if (ph < 0.50) {
      // Phase 2: Driving Left -> Right from Hospital Entrance (x=5.2) to Retreat Entrance (x=21.1)
      const t = (ph - 0.16) / 0.34;
      tr.gx = 5.2 + t * 15.9;
      tr.gy = 14.85;
      tr.dirX = 1;
      tr.openDoor = false;
      tr.label = 'Concierge Transport →';
    } else if (ph < 0.66) {
      // Phase 3: Stopped at Right Building Main Entrance (Retreat Drop-Off)
      tr.gx = 21.1;
      tr.gy = 14.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Dropping Off';
    } else {
      // Phase 4: Returning Right -> Left from Retreat Entrance (x=21.1) to Hospital Entrance (x=5.2)
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
    const totals = getTotals(simState.mode);
    const speedMul = simState.mode === 'future' ? 1.45 : 1.0;
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
        concierge.z = 0;
        concierge.pose = 'HANDOVER_INTERACTION';
      } else if (ph1 >= 0.50 && ph1 < 0.66) {
        concierge.inVehicle = false;
        concierge.gx = 22.2;
        concierge.gy = 14.2;
        concierge.z = 0;
        concierge.pose = 'HANDOVER_INTERACTION';
      } else {
        concierge.inVehicle = true;
        concierge.gx = tr.gx + 1.4;
        concierge.gy = tr.gy + 0.5;
      }
    }

    simState.agents.forEach((ag, idx) => {
      if (ag.role === 'resident') {
        ag.inVehicle = false;
        ag.z = 0;
        const el = (simState.masterClock + ag.offset) % totals.total;
        ag.elapsed = el;
        const loc = locateStage(el, simState.mode);
        ag.stageIdx = loc.stageIdx;
        ag.inWait = loc.inWait;

        if (loc.stageIdx === 0) {
          // Stage 1: Hospital Ward (Left Building Top Floor, x: 1..11, y: 1..7.5)
          const beds = [
            { gx: 2.3, gy: 1.9 },
            { gx: 2.3, gy: 4.0 },
            { gx: 5.6, gy: 1.9 },
            { gx: 5.6, gy: 4.0 }
          ];
          const b = beds[idx % beds.length];
          if (loc.inWait) {
            ag.gx = 4.6 + (idx % 4) * 0.75;
            ag.gy = 6.2;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = b.gx;
            ag.gy = b.gy;
            ag.pose = 'LYING_ON_BED';
            ag.bubble = 'Ward Check';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 1) {
          // Stage 2: Billing & Discharge (Left Building Bottom Floor, x: 1..11, y: 7.5..14)
          if (loc.inWait) {
            ag.gx = 1.9 + (idx % 4) * 0.7;
            ag.gy = idx % 2 === 0 ? 11.4 : 12.8;
            ag.pose = 'SITTING_WAIT';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 7.6 + (idx % 2) * 1.1;
            ag.gy = 9.0 + (idx % 3) * 1.1;
            ag.pose = 'SITTING';
            ag.bubble = 'Cleared';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 2) {
          // Stage 3: Hospital Main Entrance (facing down at y=14) -> Concierge Transport Left-to-Right -> Retreat Main Entrance (facing down at y=14)
          if (loc.inWait) {
            // Waiting inside/at Hospital Main Entrance (x: 5.2..7.4, y: 13.4)
            ag.gx = 5.4 + (idx % 3) * 0.7;
            ag.gy = 13.3;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.bubble = 'Waiting Pick-Up';
            ag.bubbleType = 'wait';
          } else {
            if (ph1 < 0.16) {
              // Walking DOWN out of Hospital Main Entrance (x=6.2, y: 13.2 -> 14.5) to board Concierge Transport
              const t = ph1 / 0.16;
              ag.gx = 6.1;
              ag.gy = 13.2 + t * 1.3;
              ag.dir = 'SW';
              ag.pose = 'WALKING';
              ag.bubble = 'Boarding ↓';
              ag.bubbleType = 'ok';
            } else if (ph1 < 0.50) {
              // Riding inside the Concierge Transport from Left (x=5.2) to Right (x=21.1)
              ag.gx = tr.gx + 0.9;
              ag.gy = tr.gy + 0.5;
              ag.z = 5;
              ag.dir = 'SE';
              ag.pose = 'SITTING';
              ag.bubble = 'Transfer →';
              ag.bubbleType = 'ok';
            } else if (ph1 < 0.66) {
              // Stepping off at Retreat Main Entrance and walking UP into Retreat (x=22.1, y: 14.5 -> 13.0)
              const t = (ph1 - 0.50) / 0.16;
              ag.gx = 22.1;
              ag.gy = 14.5 - t * 1.5;
              ag.dir = 'NE';
              ag.pose = 'WALKING';
              ag.bubble = 'Entering Retreat ↑';
              ag.bubbleType = 'ok';
            } else {
              // Newly arrived inside Retreat Main Entrance Lobby
              ag.gx = 21.8 + (idx % 2) * 0.8;
              ag.gy = 12.8;
              ag.dir = 'NE';
              ag.pose = 'WALKING';
              ag.bubble = 'Arrived';
              ag.bubbleType = 'ok';
            }
          }
        } else if (loc.stageIdx === 3) {
          // Stage 4: Retreat Reception & Suites (Right Building Bottom-Left, x: 19..25.5, y: 7.5..14)
          if (loc.inWait) {
            ag.gx = 20.2 + (idx % 3) * 0.8;
            ag.gy = 12.4;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = idx % 2 === 0 ? 20.5 : 23.5;
            ag.gy = 10.6;
            ag.pose = 'LYING_ON_BED';
            ag.bubble = 'Suite Ready';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 4) {
          // Stage 5: Doctor Check-Up Room (Right Building Top-Left, x: 19..25.5, y: 1..7.5)
          if (loc.inWait) {
            ag.gx = 21.2 + (idx % 3) * 0.8;
            ag.gy = 6.2;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 20.7;
            ag.gy = 4.5;
            ag.pose = 'LYING_ON_BED';
            ag.bubble = 'Doctor Check-Up';
            ag.bubbleType = 'ok';
          }
        } else {
          // Stage 6: Hydro Pool, Spa & Dining (Right Building Right Wing, x: 25.5..31, y: 1..14)
          if (idx % 3 === 0) {
            ag.gx = 27.4 + (idx % 2) * 1.4;
            ag.gy = 3.2 + (idx % 2) * 1.6;
            ag.pose = 'SWIMMING_POOL';
            ag.bubble = 'Hydro Pool';
          } else {
            ag.gx = 26.8 + (idx % 2) * 2.3;
            ag.gy = 11.6;
            ag.pose = 'SITTING';
            ag.bubble = 'Dining';
          }
          ag.bubbleType = 'ok';
        }
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
    IsoRenderer.triggerUpgradePulse(mode);
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
