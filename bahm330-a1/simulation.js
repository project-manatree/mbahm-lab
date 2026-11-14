// ============================================================================
// BAHM330-A1: Hospital-to-Retreat Step-Down Transfer Simulation
// - Fast 18-Second Presentation Cycle with 2.0-2.5s Snappy Stage Actions
// - Stationary Clinical Staff + Fixed Patient Slots (Zero Endless Running)
// - Smooth Concierge Van S-Curve Transit + 2.2s Hydraulic Lift Boarding
// ============================================================================

const SimApp = (() => {
  const CYCLE_SEC = 18.0; // Full 6-stage presentation workflow finishes in 18 seconds

  let simState = {
    mode: 'current',
    playing: true,
    showActionLabels: true,
    selectedAgentId: 'res-1',
    elapsedSec: 0,
    lastTime: performance.now(),
    transports: [
      { id: 'tr-1', gx: 11.6, gy: 16.85, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' }
    ],
    agents: []
  };

  // 11 Clinical/Operational Staff (Stationed at desks/counters/beds; only walk for specific tasks)
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', role: 'doctor', gx: 3.1, gy: 2.3, pose: 'EXAMINING', taskCur: 'Ward Note (70m)', taskFut: 'Pre-Discharge (15m)', dur: 2.4, show: true },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 6.2, gy: 2.2, pose: 'EXAMINING', taskStations: [{ gx: 6.2, gy: 2.0, pose: 'EXAMINING' }, { gx: 6.2, gy: 4.8, pose: 'HANDOVER_INTERACTION' }], dwell: 4.0 },
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.2, gy: 2.3, pose: 'EXAMINING', taskCur: 'Chart Review', taskFut: 'e-Clearance', dur: 2.2, show: false },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 13.4, gy: 2.8, pose: 'TYPING_TERMINAL', taskCur: 'Paper Summary', taskFut: 'EHR Sync', dur: 2.0, show: false },
    { id: 'st-5', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 2.6, gy: 9.7, pose: 'TYPING_TERMINAL', taskCur: 'Manual Rx', taskFut: 'Pre-Packed Rx', dur: 2.2, show: false },
    { id: 'st-6', roleLabel: 'Staff', role: 'reception', gx: 7.4, gy: 9.7, pose: 'TYPING_TERMINAL', taskCur: 'Billing (55m)', taskFut: 'e-Billing (5m) ✓', dur: 2.0, show: true },
    // Single Concierge operating the Left <-> Right transport between the two downward-facing Main Entrances
    { id: 'st-7', roleLabel: 'Concierge', role: 'concierge', gx: 12.6, gy: 16.2, pose: 'HANDOVER_INTERACTION', taskCur: 'Ramp Lift', taskFut: 'VIP Ramp (2m)', dur: 2.2, show: true },
    { id: 'st-8', roleLabel: 'Staff', role: 'reception', gx: 24.6, gy: 9.7, pose: 'TYPING_TERMINAL', taskCur: 'Paper Intake (30m)', taskFut: 'Biometric (5m) ✓', dur: 2.0, show: true },
    { id: 'st-9', roleLabel: 'Doctor', role: 'doctor', gx: 24.4, gy: 2.3, pose: 'EXAMINING', taskCur: 'Delayed MD (30m)', taskFut: 'MD Baseline (25m)', dur: 2.4, show: true },
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 29.6, gy: 2.3, pose: 'TYPING_TERMINAL', taskCur: 'Vitals Log', taskFut: 'Smart Telemetry', dur: 2.2, show: false },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 33.4, gy: 4.5, pose: 'EXAMINING', taskCur: 'Pool Standby', taskFut: 'Hydro Care (33m)', dur: 2.5, show: false }
  ];

  // Fixed Stationary Slots for 30 Non-Pathway Patients (Zero Slot-Shifting or Endless Loops)
  const HOSPITAL_BEDS = [
    { gx: 2.2, gy: 1.8 }, { gx: 2.2, gy: 3.8 }, { gx: 5.2, gy: 1.8 }, { gx: 5.2, gy: 3.8 },
    { gx: 9.2, gy: 1.8 }, { gx: 9.2, gy: 3.8 }, { gx: 12.0, gy: 1.8 }
  ];

  const CURRENT_QUEUE_SPOTS = [
    // Ward waiting benches (4)
    { gx: 2.4, gy: 5.4, pose: 'FRUSTRATED_WAIT', b: 'Ward Wait (45m)' },
    { gx: 3.3, gy: 5.4, pose: 'SITTING_WAIT' },
    { gx: 9.4, gy: 5.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 10.3, gy: 5.4, pose: 'SITTING_WAIT' },
    // Pharmacy queue (3)
    { gx: 1.7, gy: 14.6, pose: 'SITTING_WAIT', b: 'Rx Wait (40m)' },
    { gx: 2.6, gy: 14.6, pose: 'SITTING_WAIT' },
    { gx: 3.5, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    // Billing hall queue (8)
    { gx: 6.5, gy: 11.8, pose: 'SITTING_WAIT', b: 'Billing Queue (40m)' },
    { gx: 7.4, gy: 11.8, pose: 'SITTING_WAIT' },
    { gx: 8.3, gy: 11.8, pose: 'SITTING_WAIT' },
    { gx: 6.5, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 7.4, gy: 13.2, pose: 'FRUSTRATED_WAIT' },
    { gx: 8.3, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 6.5, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    { gx: 7.4, gy: 14.6, pose: 'SITTING_WAIT' },
    // Departure Lobby transport wait (4)
    { gx: 11.4, gy: 14.6, pose: 'FRUSTRATED_WAIT', b: 'Van Wait (55m)' },
    { gx: 12.3, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    { gx: 11.4, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 12.3, gy: 13.2, pose: 'SITTING_WAIT' },
    // Retreat Reception & MD Wait (4)
    { gx: 23.8, gy: 13.8, pose: 'FRUSTRATED_WAIT', b: 'Intake Wait (40m)' },
    { gx: 24.8, gy: 13.8, pose: 'FRUSTRATED_WAIT' },
    { gx: 24.2, gy: 5.6, pose: 'FRUSTRATED_WAIT', b: 'MD Wait (20m)' },
    { gx: 25.4, gy: 5.6, pose: 'SITTING_WAIT' }
  ];

  const TARGET_SMOOTH_SPOTS = [
    // Departure lounge relaxed seating (3)
    { gx: 11.6, gy: 9.5, pose: 'SITTING', b: 'Pre-Cleared ✓' },
    { gx: 12.6, gy: 9.5, pose: 'SITTING' },
    { gx: 11.6, gy: 11.5, pose: 'SITTING' },
    // Billing fast-track counter (2)
    { gx: 7.2, gy: 10.6, pose: 'HANDOVER_INTERACTION' },
    { gx: 2.6, gy: 10.6, pose: 'HANDOVER_INTERACTION' },
    // Visiting MD Clinic Exam Tables & Nurse Triage (4)
    { gx: 24.3, gy: 3.9, pose: 'LYING_ON_BED', b: 'MD Exam (25m) ✓' },
    { gx: 26.6, gy: 3.9, pose: 'LYING_ON_BED' },
    { gx: 29.5, gy: 4.8, pose: 'SITTING' },
    { gx: 30.6, gy: 4.8, pose: 'SITTING' },
    // Retreat Reception Lounge (2)
    { gx: 24.0, gy: 11.8, pose: 'SITTING', b: 'Instant Check-In ✓' },
    { gx: 25.1, gy: 11.8, pose: 'SITTING' },
    // Recovery Suites 301 & 302 Beds + Armchairs (4)
    { gx: 28.9, gy: 9.3, pose: 'LYING_ON_BED', b: 'Suite 301 Rest ✓' },
    { gx: 30.6, gy: 11.1, pose: 'SITTING' },
    { gx: 28.9, gy: 13.1, pose: 'LYING_ON_BED' },
    { gx: 30.6, gy: 14.9, pose: 'SITTING' },
    // Hydrotherapy Pool (3)
    { gx: 33.8, gy: 2.8, pose: 'SWIMMING_POOL', b: 'Hydro Pool (33m) ✓' },
    { gx: 35.1, gy: 4.3, pose: 'SWIMMING_POOL' },
    { gx: 34.0, gy: 5.8, pose: 'SWIMMING_POOL' },
    // Therapeutic Spa & Dining Tables (5)
    { gx: 33.8, gy: 9.4, pose: 'LYING_ON_BED' },
    { gx: 33.6, gy: 12.4, pose: 'SITTING', b: 'Therapeutic Dining ✓' },
    { gx: 35.6, gy: 12.4, pose: 'SITTING' },
    { gx: 33.6, gy: 14.6, pose: 'SITTING' },
    { gx: 35.6, gy: 14.6, pose: 'SITTING' }
  ];

  function buildAgents() {
    simState.agents = [];
    // 36 Patients:
    // - 0..6 (7 patients): In Hospital Ward beds
    // - 7..29 (23 patients): Transition between Current waiting queues and Target wellness/recovery rooms
    // - 30..35 (6 pathway patients): Step through the 6 transfer stages across the 18s cycle
    for (let i = 0; i < 36; i++) {
      let gx = 2.2, gy = 1.8, pose = 'LYING_ON_BED';
      if (i < 7) {
        gx = HOSPITAL_BEDS[i].gx;
        gy = HOSPITAL_BEDS[i].gy;
      } else if (i < 30) {
        const sp = CURRENT_QUEUE_SPOTS[i - 7];
        gx = sp.gx;
        gy = sp.gy;
        pose = sp.pose;
      } else {
        gx = 8.8;
        gy = 7.5;
        pose = 'IDLE';
      }
      simState.agents.push({
        id: `res-${i + 1}`,
        idNum: i + 1,
        slotIdx: i,
        roleLabel: 'Patient',
        role: 'resident',
        gx,
        gy,
        z: 0,
        dir: 'SE',
        pose,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false,
        inVehicle: false
      });
    }

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
        taskCur: sd.taskCur,
        taskFut: sd.taskFut,
        dur: sd.dur || 2.2,
        show: !!sd.show,
        taskStations: sd.taskStations || null,
        dwell: sd.dwell || 4.0,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false,
        inVehicle: false
      });
    });
  }

  function smoothStep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  }

  // Fast 15-second Concierge Van round-trip with 2.0s boarding/unloading pauses
  function updateTransport(tr, elapsedSec, isFut) {
    const cycle = 15.0;
    const into = elapsedSec % cycle;
    const transitLbl = isFut ? '25m' : '35m';

    if (into < 2.2) {
      // Phase 1: 2.2s hydraulic wheelchair lift boarding at Hospital Main Entrance
      tr.gx = 11.6;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.phase = 'board';
      tr.phaseProg = into / 2.2;
      tr.label = `Lift Boarding (2.0m)`;
    } else if (into < 6.8) {
      // Phase 2: 4.6s smooth S-curve transit Left -> Right
      const rawT = (into - 2.2) / 4.6;
      const sT = smoothStep(rawT);
      tr.gx = 11.6 + sT * 12.6;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = false;
      tr.phase = 'outbound';
      tr.phaseProg = rawT;
      tr.label = `Concierge Transit → (${transitLbl})`;
    } else if (into < 9.0) {
      // Phase 3: 2.2s hydraulic ramp unloading at Retreat Main Entrance
      const dInto = into - 6.8;
      tr.gx = 24.2;
      tr.gy = 16.85;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.phase = 'dropoff';
      tr.phaseProg = dInto / 2.2;
      tr.label = `Suite Handover (2.0m)`;
    } else {
      // Phase 4: Smooth return Right -> Left
      const rawT = (into - 9.0) / 6.0;
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

    simState.elapsedSec += dtSec;
    const tSec = simState.elapsedSec;
    const isFut = simState.mode === 'future';

    const tr = simState.transports[0];
    updateTransport(tr, tSec, isFut);

    // Single Concierge (`st-7`) steps out during 2.2s hydraulic boarding & unloading
    const concierge = simState.agents.find(a => a.id === 'st-7');
    if (concierge) {
      if (tr.phase === 'board') {
        concierge.inVehicle = false;
        concierge.gx = 12.7;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.bubble = 'Ramp Lift (2.0m)';
        concierge.bubbleType = 'ok';
        concierge.taskProg = tr.phaseProg;
        concierge.showBubble = true;
      } else if (tr.phase === 'dropoff') {
        concierge.inVehicle = false;
        concierge.gx = 25.3;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.bubble = 'Retreat Handover';
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

    simState.agents.forEach((ag, idx) => {
      if (ag.id === 'st-7') return;

      // Staff members: stay stationed at desk/counter/bed (or move between 2 task stations with 4s dwell)
      if (ag.role !== 'resident') {
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 5.5 });
          return;
        }
        const dur = ag.dur || 2.2;
        const into = (tSec + idx * 0.7) % dur;
        ag.taskProg = into / dur;
        ag.bubble = isFut ? ag.taskFut : ag.taskCur;
        ag.bubbleType = isFut ? 'ok' : 'fail';
        ag.showBubble = ag.show;
        return;
      }

      ag.inVehicle = false;
      ag.z = 0;
      ag.showBubble = false;
      ag.bubble = null;
      ag.taskProg = null;

      const sIdx = ag.slotIdx;

      // Group A (0..6): 7 Inpatient Ward Beds (Stationary)
      if (sIdx < 7) {
        const b = HOSPITAL_BEDS[sIdx];
        ag.pose = 'LYING_ON_BED';
        PH.stepAgentPhysics(ag, b.gx, b.gy, dtSec, { snap: true });
        return;
      }

      // Group B (7..29): 23 Patients who sit/wait in Current queues OR transition to Target wellness/recovery rooms
      if (sIdx < 30) {
        const qIdx = sIdx - 7;
        const spot = isFut ? TARGET_SMOOTH_SPOTS[qIdx] : CURRENT_QUEUE_SPOTS[qIdx];
        ag.pose = spot.pose;
        const snap = (spot.pose === 'LYING_ON_BED' || spot.pose === 'SWIMMING_POOL') && Math.hypot(spot.gx - ag.gx, spot.gy - ag.gy) < 1.2;
        const corrY = spot.gx < 18 ? 7.5 : 7.5;
        PH.stepAgentPhysics(ag, spot.gx, spot.gy, dtSec, { baseSpeed: 7.5, corridorY: corrY, snap });
        if (spot.b && Math.hypot(spot.gx - ag.gx, spot.gy - ag.gy) < 0.2) {
          const ringDur = 2.4;
          ag.taskProg = ((tSec + qIdx * 0.5) % ringDur) / ringDur;
          ag.bubble = spot.b;
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.showBubble = true;
        }
        return;
      }

      // Group C (30..35): 6 Active Pathway Patients stepping through the 6 transfer stages in 18 seconds (3.0s per stage)
      const pIdx = sIdx - 30;
      const cyclePos = (tSec + pIdx * 3.0) % CYCLE_SEC;
      const stage = Math.floor(cyclePos / 3.0); // 0..5
      const stageProg = (cyclePos % 3.0) / 3.0; // 0..1 within the 3.0s stage window

      let tx = ag.gx, ty = ag.gy, corrY = 7.5;
      if (stage === 0) {
        // Stage 1: Ward B Discharge Desk (2.5s pause)
        tx = 12.2; ty = 3.2; ag.pose = 'HANDOVER_INTERACTION';
        if (pIdx === 0) {
          ag.bubble = isFut ? 'Pre-Discharge (15m) ✓' : 'Ward Backlog (70m)';
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.taskProg = stageProg;
          ag.showBubble = true;
        }
      } else if (stage === 1) {
        // Stage 2: Billing & Clearance Counter
        tx = 7.8; ty = 10.6; ag.pose = isFut ? 'HANDOVER_INTERACTION' : 'FRUSTRATED_WAIT';
        if (pIdx === 0) {
          ag.bubble = isFut ? 'e-Billing (5m) ✓' : 'Billing Wait (55m)';
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.taskProg = stageProg;
          ag.showBubble = true;
        }
      } else if (stage === 2) {
        // Stage 3: Hospital Main Entrance Boarding
        tx = 12.6; ty = 15.2; ag.pose = isFut ? 'HANDOVER_INTERACTION' : 'FRUSTRATED_WAIT';
        if (pIdx === 0) {
          ag.bubble = isFut ? 'Concierge Ready ✓' : 'Transport Delay (90m)';
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.taskProg = stageProg;
          ag.showBubble = true;
        }
      } else if (stage === 3) {
        // Stage 4: Ride Concierge Van or Arrive at Retreat Reception
        if (tr.phase === 'outbound' && pIdx === 0) {
          ag.gx = tr.gx + 0.9;
          ag.gy = tr.gy + 0.5;
          ag.z = 5;
          ag.dir = 'SE';
          ag.pose = 'SITTING';
          return;
        }
        tx = 25.0; ty = 10.6; ag.pose = 'HANDOVER_INTERACTION';
        if (pIdx === 0) {
          ag.bubble = isFut ? 'Suite Check-In (5m) ✓' : 'Manual Intake (30m)';
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.taskProg = stageProg;
          ag.showBubble = true;
        }
      } else if (stage === 4) {
        // Stage 5: Recovery Suite 301 Armchair / Visiting MD Check
        tx = 29.5; ty = 10.2; ag.pose = 'SITTING';
        if (pIdx === 0) {
          ag.bubble = isFut ? 'Suite 301 Settled ✓' : 'Handover Delay';
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.taskProg = stageProg;
          ag.showBubble = true;
        }
      } else {
        // Stage 6: Visiting MD Clinic & Wellness
        tx = 25.4; ty = 2.4; ag.pose = 'SITTING';
        if (pIdx === 0) {
          ag.bubble = isFut ? 'Visiting MD (25m) ✓' : 'Late Assessment';
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.taskProg = stageProg;
          ag.showBubble = true;
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 8.0, corridorY: corrY });
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
    setMode
  };
})();
