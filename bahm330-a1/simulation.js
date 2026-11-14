// ============================================================================
// BAHM330-A1: Calibrated Hospital-to-Retreat Step-Down Transfer Simulation
// - Live Shift Clock (08:00 HH:MM, 1x = 1 sim min / 1.5s, 2x, 5x)
// - Proportional Stage Timings: Current (275m total) vs Target (110m total)
// - Overhead Task Progress Rings + Role-Based Ease-In/Ease-Out Physics
// - Smooth Concierge Van Acceleration/Deceleration + 2.0m Hydraulic Lift Boarding
// ============================================================================

const SimApp = (() => {
  // Exact proportional stage durations (275m Current vs 110m Target)
  const STAGES = [
    { id: 1, short: "Ward Discharge", current: { va: 25, nva: 45 }, future: { va: 15, nva: 0 } },
    { id: 2, short: "Billing Clearance", current: { va: 15, nva: 40 }, future: { va: 5,  nva: 0 } },
    { id: 3, short: "Concierge Transit", current: { va: 35, nva: 55 }, future: { va: 27, nva: 0 } }, // 2m boarding + 25m transit
    { id: 4, short: "Suite Check-In", current: { va: 10, nva: 20 }, future: { va: 5,  nva: 0 } },
    { id: 5, short: "Doctor Assessment", current: { va: 10, nva: 20 }, future: { va: 25, nva: 0 } },
    { id: 6, short: "Pool & Dining", current: { va: 0,  nva: 0  }, future: { va: 33, nva: 0 } }
  ];

  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    selectedAgentId: 'res-1',
    simMinutes: 0,
    lastTime: performance.now(),
    transports: [
      { id: 'tr-1', gx: 11.6, gy: 16.85, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' }
    ],
    agents: []
  };

  // 36 Patients distributed across the full Hospital-to-Retreat pathway
  const RESIDENT_PROFILES = Array.from({ length: 36 }, (_, i) => ({
    id: `res-${i + 1}`,
    roleLabel: 'Patient',
    offset: i * 7.6
  }));

  // 10 Clinical/Operational Staff + ONLY 1 Concierge
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', role: 'doctor', gx: 3.1, gy: 2.3, pose: 'EXAMINING', taskName: 'Ward Exam', taskDur: 25 },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 6.2, gy: 3.2, pose: 'WALKING', patrol: [{ gx: 6.2, gy: 2.0 }, { gx: 6.2, gy: 5.0 }] },
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.2, gy: 2.3, pose: 'EXAMINING', taskName: 'Discharge Note', taskDur: 15 },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 13.4, gy: 2.8, pose: 'TYPING_TERMINAL', taskName: 'Summary', taskDur: 25 },
    { id: 'st-5', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 2.6, gy: 9.7, pose: 'TYPING_TERMINAL', taskName: 'Meds Check', taskDur: 15 },
    { id: 'st-6', roleLabel: 'Staff', role: 'reception', gx: 7.4, gy: 9.7, pose: 'TYPING_TERMINAL', taskName: 'Billing', taskDur: 15 },
    // Single Concierge operating the Left <-> Right transport between the two downward-facing Main Entrances
    { id: 'st-7', roleLabel: 'Concierge', role: 'concierge', gx: 12.6, gy: 16.2, pose: 'HANDOVER_INTERACTION', taskName: 'Ramp Lift', taskDur: 2 },
    { id: 'st-8', roleLabel: 'Staff', role: 'reception', gx: 24.6, gy: 9.7, pose: 'TYPING_TERMINAL', taskName: 'Check-In', taskDur: 5 },
    { id: 'st-9', roleLabel: 'Doctor', role: 'doctor', gx: 24.4, gy: 2.3, pose: 'EXAMINING', taskName: 'MD Check', taskDur: 25 },
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 29.6, gy: 2.3, pose: 'TYPING_TERMINAL', taskName: 'Vitals', taskDur: 10 },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 33.4, gy: 4.5, pose: 'EXAMINING', taskName: 'Hydro Care', taskDur: 33 }
  ];

  function getTotals(mode) {
    let va = 0, nva = 0;
    STAGES.forEach(s => { va += s[mode].va; nva += s[mode].nva; });
    return { va, nva, total: Math.max(1, va + nva) };
  }

  function locateStage(elapsed, mode) {
    let cum = 0;
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i][mode];
      const stTot = s.va + s.nva;
      if (stTot > 0 && (elapsed <= cum + stTot || i === STAGES.length - 1)) {
        const into = Math.max(0, Math.min(stTot, elapsed - cum));
        const inWait = into > s.va && s.nva > 0;
        const activeDur = inWait ? s.nva : Math.max(1, s.va);
        const activeInto = inWait ? (into - s.va) : into;
        return {
          stageIdx: i,
          inWait,
          into,
          stTot,
          vaProg: s.va > 0 ? Math.min(1, into / s.va) : 1,
          taskProg: Math.min(1, activeInto / activeDur),
          activeInto: Math.round(activeInto),
          activeDur
        };
      }
      cum += stTot;
    }
    return { stageIdx: 5, inWait: false, into: 10, stTot: 33, vaProg: 1, taskProg: 0.5, activeInto: 15, activeDur: 33 };
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
        z: 0,
        dir: 'SE',
        pose: 'LYING_ON_BED',
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
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
        taskName: sd.taskName,
        taskDur: sd.taskDur,
        patrol: sd.patrol || null,
        patrolIdx: 0,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false,
        inVehicle: false
      });
    });
  }

  // Smooth step S-curve for realistic vehicle acceleration & deceleration
  function smoothStep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  }

  // Realistic Concierge Van physics:
  // - 2.0 sim mins hydraulic ramp boarding at Hospital Main Entrance (x=11.6)
  // - 25 sim mins (Target) / 35 sim mins (Current) smooth ease-in/ease-out transit to Retreat Main Entrance (x=24.2)
  // - 2.0 sim mins hydraulic ramp disembarking at Retreat Main Entrance
  // - Smooth return along lower lane (y=18.6)
  function updateTransport(tr, simMins, isFut) {
    const transitMins = isFut ? 25 : 35;
    const cycleMins = 2.0 + transitMins + 2.0 + 15.0; // Board (2m) + Transit (25/35m) + DropOff (2m) + Return (15m)
    const into = simMins % cycleMins;

    if (into < 2.0) {
      // Phase 1: Paused 2.0 sim mins at Hospital Main Entrance lowering hydraulic wheelchair lift
      tr.gx = 11.6;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.phase = 'board';
      tr.phaseProg = into / 2.0;
      tr.label = `Lift Boarding: ${into.toFixed(1)} / 2.0m`;
    } else if (into < 2.0 + transitMins) {
      // Phase 2: Accelerates & decelerates smoothly along the roadway (25m Target / 35m Current)
      const rawT = (into - 2.0) / transitMins;
      const sT = smoothStep(rawT);
      tr.gx = 11.6 + sT * 12.6;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = false;
      tr.phase = 'outbound';
      tr.phaseProg = rawT;
      tr.label = `Transit → (${Math.round(into - 2.0)} / ${transitMins}m)`;
    } else if (into < 4.0 + transitMins) {
      // Phase 3: Paused 2.0 sim mins at Retreat Porte-Cochère unloading resident
      const dInto = into - (2.0 + transitMins);
      tr.gx = 24.2;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.phase = 'dropoff';
      tr.phaseProg = dInto / 2.0;
      tr.label = `Unloading: ${dInto.toFixed(1)} / 2.0m`;
    } else {
      // Phase 4: Smooth return Right -> Left to Hospital Main Entrance
      const rawT = (into - (4.0 + transitMins)) / 15.0;
      const sT = smoothStep(rawT);
      tr.gx = 24.2 - sT * 12.6;
      tr.gy = 18.6;
      tr.dirX = -1;
      tr.openDoor = false;
      tr.phase = 'return';
      tr.phaseProg = rawT;
      tr.label = '← Returning to Hospital';
    }
  }

  function stepSimulation(now) {
    const dtSec = Math.min(0.05, Math.max(0.001, (now - simState.lastTime) / 1000));
    simState.lastTime = now;
    if (!simState.playing) return;

    // Calibrated clock: 1x = 1 simulated minute per 1.5 real seconds
    const dtSimMins = (dtSec / 1.5) * simState.speed;
    simState.simMinutes += dtSimMins;

    const clockEl = document.getElementById('sim-clock');
    if (clockEl) clockEl.textContent = PH.formatShiftClock(simState.simMinutes);

    const isFut = simState.mode === 'future';
    const totals = getTotals(simState.mode);
    const tr = simState.transports[0];
    updateTransport(tr, simState.simMinutes * 3.2, isFut);

    // Single Concierge (`st-7`) steps out during 2.0m hydraulic boarding & unloading
    const concierge = simState.agents.find(a => a.id === 'st-7');
    if (concierge) {
      if (tr.phase === 'board') {
        concierge.inVehicle = false;
        concierge.gx = 12.7;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.bubble = `Ramp Lift: ${(tr.phaseProg * 2).toFixed(1)}/2m`;
        concierge.bubbleType = 'ok';
        concierge.taskProg = tr.phaseProg;
        concierge.showBubble = true;
      } else if (tr.phase === 'dropoff') {
        concierge.inVehicle = false;
        concierge.gx = 25.3;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.bubble = `Arrival Handover: ${(tr.phaseProg * 2).toFixed(1)}/2m`;
        concierge.bubbleType = 'ok';
        concierge.taskProg = tr.phaseProg;
        concierge.showBubble = true;
      } else {
        concierge.inVehicle = true;
        concierge.showBubble = false;
        concierge.gx = tr.gx + 1.4;
        concierge.gy = tr.gy + 0.5;
      }
    }

    const waitSlot = [0, 0, 0, 0, 0, 0];
    const actSlot = [0, 0, 0, 0, 0, 0];

    simState.agents.forEach((ag, idx) => {
      if (ag.id === 'st-7') return;
      if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        if (Math.hypot(target.gx - ag.gx, target.gy - ag.gy) < 0.12) {
          ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        }
        PH.stepAgentPhysics(ag, target.gx, target.gy, dtSec, { simSpeed: simState.speed });
        return;
      }
      if (ag.role !== 'resident') {
        // Stationary clinical staff show calibrated task progress ring on key stations
        const dur = ag.taskDur || 15;
        const into = (simState.simMinutes + idx * 3.7) % dur;
        ag.taskProg = into / dur;
        ag.bubble = `${ag.taskName}: ${Math.floor(into)}/${dur}m`;
        ag.bubbleType = 'ok';
        ag.showBubble = (ag.id === 'st-1' || ag.id === 'st-9');
        return;
      }

      ag.inVehicle = false;
      ag.z = 0;
      ag.showBubble = false;
      ag.bubble = null;
      ag.taskProg = null;

      const el = (simState.simMinutes * 2.4 + ag.offset) % totals.total;
      const loc = locateStage(el, simState.mode);
      const sIdx = loc.stageIdx;

      let tx = ag.gx, ty = ag.gy, snap = false;

      if (sIdx === 0) {
        // Stage 1: Hospital Ward A & B (25m active + 45m wait in Current; 15m active + 0m wait in Target)
        const beds = [
          { gx: 2.2, gy: 1.8 }, { gx: 2.2, gy: 3.8 }, { gx: 5.2, gy: 1.8 }, { gx: 5.2, gy: 3.8 },
          { gx: 9.2, gy: 1.8 }, { gx: 9.2, gy: 3.8 }, { gx: 12.0, gy: 1.8 }
        ];
        if (loc.inWait) {
          const w = waitSlot[0]++;
          tx = (w < 4 ? 2.4 : 9.4) + (w % 4) * 0.85;
          ty = 5.4 + Math.floor(w / 8) * 0.65;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0 || w === 4) {
            ag.bubble = `Ward Wait: ${loc.activeInto}/${loc.activeDur}m`;
            ag.bubbleType = 'wait';
            ag.taskProg = loc.taskProg;
            ag.showBubble = true;
          }
        } else {
          const a = actSlot[0]++;
          if (a < beds.length) {
            tx = beds[a].gx;
            ty = beds[a].gy;
            ag.pose = 'LYING_ON_BED';
            snap = true;
            if (a === 0 && isFut) {
              ag.bubble = `Pre-Discharge: ${loc.activeInto}/${loc.activeDur}m`;
              ag.bubbleType = 'ok';
              ag.taskProg = loc.taskProg;
              ag.showBubble = true;
            }
          } else {
            tx = 3.5 + (a % 5) * 2.1;
            ty = 7.4;
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 1) {
        // Stage 2: Billing & Pharmacy (15m active + 40m wait in Current; 5m walk-through in Target)
        if (loc.inWait) {
          const w = waitSlot[1]++;
          if (w < 4) {
            tx = 1.7 + (w % 4) * 0.78;
            ty = 14.6;
            ag.pose = 'SITTING_WAIT';
            if (w === 0) {
              ag.bubble = `Rx Queue: ${loc.activeInto}/${loc.activeDur}m`;
              ag.bubbleType = 'wait';
              ag.taskProg = loc.taskProg;
              ag.showBubble = true;
            }
          } else {
            const bw = w - 4;
            tx = 6.5 + (bw % 4) * 0.85;
            ty = 11.8 + Math.min(2, Math.floor(bw / 4)) * 1.4;
            ag.pose = bw < 8 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
            if (bw === 0) {
              ag.bubble = `Billing Wait: ${loc.activeInto}/${loc.activeDur}m`;
              ag.bubbleType = 'wait';
              ag.taskProg = loc.taskProg;
              ag.showBubble = true;
            }
          }
        } else {
          const a = actSlot[1]++;
          tx = 3.5 + loc.vaProg * 8.0;
          ty = 10.2 + (a % 3) * 1.3;
          ag.pose = 'WALKING';
          if (a === 0 && isFut) {
            ag.bubble = `e-Billing: ${loc.activeInto}/${loc.activeDur}m ✓`;
            ag.bubbleType = 'ok';
            ag.taskProg = loc.taskProg;
            ag.showBubble = true;
          }
        }
      } else if (sIdx === 2) {
        // Stage 3: Concierge Transport (55m wait + 35m transit in Current; 2m boarding + 25m transit in Target)
        if (loc.inWait) {
          const w = waitSlot[2]++;
          tx = 11.3 + (w % 4) * 0.8;
          ty = 14.8 - Math.floor(w / 4) * 1.1;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) {
            ag.bubble = `Transport Wait: ${loc.activeInto}/${loc.activeDur}m`;
            ag.bubbleType = 'wait';
            ag.taskProg = loc.taskProg;
            ag.showBubble = true;
          }
        } else {
          const a = actSlot[2]++;
          if (tr.phase === 'board') {
            tx = 12.2 + (a % 2) * 0.65;
            ty = 14.8 + tr.phaseProg * 1.5;
            ag.pose = 'WALKING';
          } else if (tr.phase === 'outbound') {
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
              ag.pose = 'WALKING';
            }
          } else if (tr.phase === 'dropoff') {
            tx = 24.8 + (a % 2) * 0.65;
            ty = 16.4 - tr.phaseProg * 1.8;
            ag.pose = 'WALKING';
          } else {
            tx = 24.5 + (a % 3) * 0.85;
            ty = 14.2 - loc.vaProg * 2.4;
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 3) {
        // Stage 4: Retreat Reception & Suites (20m wait in Current vs 5m biometric check-in in Target)
        const suiteBeds = [
          { gx: 29.0, gy: 9.4 }, { gx: 31.1, gy: 9.4 },
          { gx: 29.0, gy: 13.2 }, { gx: 31.1, gy: 13.2 }
        ];
        if (loc.inWait) {
          const w = waitSlot[3]++;
          tx = 23.8 + (w % 4) * 0.85;
          ty = 13.6 + Math.floor(w / 4) * 0.8;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) {
            ag.bubble = `Intake Wait: ${loc.activeInto}/${loc.activeDur}m`;
            ag.bubbleType = 'wait';
            ag.taskProg = loc.taskProg;
            ag.showBubble = true;
          }
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
            ag.pose = 'WALKING';
          }
        }
      } else if (sIdx === 4) {
        // Stage 5: Visiting MD Baseline Assessment (20m wait in Current vs 25m MD exam in Target)
        if (loc.inWait) {
          const w = waitSlot[4]++;
          tx = 24.2 + (w % 5) * 1.2;
          ty = 5.6;
          ag.pose = 'FRUSTRATED_WAIT';
          if (w === 0) {
            ag.bubble = `MD Wait: ${loc.activeInto}/${loc.activeDur}m`;
            ag.bubbleType = 'wait';
            ag.taskProg = loc.taskProg;
            ag.showBubble = true;
          }
        } else {
          const a = actSlot[4]++;
          if (a === 0) {
            tx = 24.3; ty = 3.9; ag.pose = 'LYING_ON_BED'; snap = true;
            ag.bubble = `MD Assessment: ${loc.activeInto}/${loc.activeDur}m`;
            ag.bubbleType = 'ok';
            ag.taskProg = loc.taskProg;
            ag.showBubble = true;
          } else if (a === 1) {
            tx = 26.6; ty = 3.9; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 29.2 + (a % 3) * 0.9;
            ty = 4.6;
            ag.pose = 'WALKING';
          }
        }
      } else {
        // Stage 6: Hydrotherapy & Dining Onboarding (33m Target)
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

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { simSpeed: simState.speed, snap });
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

  function setSpeed(s) {
    simState.speed = s;
    [1, 2, 5].forEach(v => {
      const btn = document.getElementById(`spd-${v}`);
      if (btn) btn.classList.toggle('active', v === s);
    });
  }

  function loop(now) {
    stepSimulation(now || performance.now());
    IsoRenderer.render(simState);
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    buildAgents();
    IsoRenderer.init('iso-canvas', handleWorldClick);
    simState.lastTime = performance.now();
    requestAnimationFrame(loop);
  });

  return {
    setMode,
    setSpeed
  };
})();
