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
    snapNext: true,
    lastTime: performance.now(),
    transports: [
      { id: 'tr-1', gx: 11.6, gy: 16.85, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' }
    ],
    agents: []
  };

  // 11 Clinical/Operational Staff (Stationed at desks/counters/beds; only walk for specific tasks)
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', role: 'doctor', gx: 3.6, gy: 2.9, pose: 'EXAMINING', taskCur: 'Ward Note (70m)', taskFut: 'Pre-Discharge (15m)', dur: 2.4, show: true },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 6.8, gy: 2.2, pose: 'EXAMINING', taskStations: [{ gx: 6.8, gy: 2.0, pose: 'EXAMINING' }, { gx: 6.8, gy: 4.8, pose: 'HANDOVER_INTERACTION' }], dwell: 4.0 },
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.7, gy: 2.8, pose: 'EXAMINING', taskCur: 'Chart Review', taskFut: 'e-Clearance', dur: 2.2, show: false },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 13.4, gy: 2.8, pose: 'TYPING_TERMINAL', taskCur: 'Paper Summary', taskFut: 'EHR Sync', dur: 2.0, show: false },
    { id: 'st-5', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 2.6, gy: 9.7, pose: 'TYPING_TERMINAL', taskCur: 'Manual Rx', taskFut: 'Pre-Packed Rx', dur: 2.2, show: false },
    { id: 'st-6', roleLabel: 'Staff', role: 'reception', gx: 7.5, gy: 10.4, pose: 'TYPING_TERMINAL', taskCur: 'Billing (55m)', taskFut: 'e-Billing (5m) ✓', dur: 2.0, show: true },
    // Single Concierge operating the Left <-> Right transport between the two downward-facing Main Entrances
    { id: 'st-7', roleLabel: 'Concierge', role: 'concierge', gx: 12.7, gy: 16.2, pose: 'HANDOVER_INTERACTION', taskCur: 'Ramp Lift', taskFut: 'VIP Ramp (2m)', dur: 2.2, show: true },
    { id: 'st-8', retreat: true, roleLabel: 'Concierge', role: 'concierge', gx: 24.4, gy: 10.7, pose: 'TYPING_TERMINAL', taskCur: 'Paper Intake (30m)', taskFut: 'Biometric Lounge ✓', dur: 2.0, show: true },
    { id: 'st-9', retreat: true, roleLabel: 'Doctor', role: 'doctor', gx: 24.9, gy: 4.3, pose: 'EXAMINING', taskCur: 'Delayed MD (30m)', taskFut: 'Monthly MD Visit ✓', dur: 2.4, show: true },
    { id: 'st-10', retreat: true, roleLabel: 'Instructor', role: 'therapist', gx: 32.8, gy: 4.3, pose: 'YOGA_STRETCH', taskCur: 'No Class', taskFut: 'Wellness Class ✓', dur: 2.2, show: true },
    { id: 'st-11', retreat: true, roleLabel: 'Therapist', role: 'therapist', gx: 28.9, gy: 3.6, pose: 'HANDOVER_INTERACTION', taskCur: 'No Spa', taskFut: 'Thermal Massage ✓', dur: 2.5, show: true },
    { id: 'st-12', retreat: true, roleLabel: 'Chef', role: 'chef', gx: 35.8, gy: 10.3, pose: 'HANDOVER_INTERACTION', taskCur: 'No Kitchen', taskFut: 'Bistro Service ✓', dur: 2.3, show: false }
  ];

  // Fixed Stationary Slots for 30 Non-Pathway Patients (Zero Slot-Shifting or Endless Loops)
  const HOSPITAL_BEDS = [
    { gx: 2.2, gy: 1.8 }, { gx: 2.2, gy: 3.8 }, { gx: 5.2, gy: 1.8 }, { gx: 5.2, gy: 3.8 },
    { gx: 9.2, gy: 1.8 }, { gx: 9.2, gy: 3.8 }, { gx: 12.0, gy: 1.8 }
  ];

  const CURRENT_QUEUE_SPOTS = [
    // Ward waiting benches (4)
    { gx: 2.4, gy: 5.4, pose: 'FRUSTRATED_WAIT', b: '98% Ward Occ. (Wait)' },
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
    // Departure Lobby delay (no step-down retreat / no concierge van) (4)
    { gx: 11.4, gy: 14.6, pose: 'FRUSTRATED_WAIT', b: 'No Concierge Van (180m)' },
    { gx: 12.3, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    { gx: 11.4, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 12.3, gy: 13.2, pose: 'SITTING_WAIT' },
    // No retreat exists: bed-blocked patients stuck in hospital corridor (4)
    { gx: 11.8, gy: 7.4, pose: 'FRUSTRATED_WAIT', b: 'Ward Bed-Block (275m)' },
    { gx: 12.7, gy: 7.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 13.6, gy: 7.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 4.4, gy: 14.6, pose: 'SITTING_WAIT' }
  ];

  const TARGET_SMOOTH_SPOTS = [
    // Hospital Departure Lounge relaxed seating (3)
    { gx: 11.4, gy: 9.5, pose: 'SITTING', b: 'Pre-Cleared ✓' },
    { gx: 12.1, gy: 9.5, pose: 'SITTING' },
    { gx: 11.5, gy: 11.5, pose: 'SITTING' },
    // Hospital e-Billing & Pre-Packed Rx fast-track counters (2)
    { gx: 8.6, gy: 10.5, pose: 'HANDOVER_INTERACTION' },
    { gx: 2.8, gy: 10.5, pose: 'HANDOVER_INTERACTION' },
    // MONTHLY VISITING MD ROOM (1 compact medical check-up suite ONLY) (2)
    { gx: 24.7, gy: 5.5, pose: 'SITTING', b: 'Monthly Check-Up ✓' },
    { gx: 25.8, gy: 3.7, pose: 'SITTING' },
    // THERMAL SPA & MASSAGE (2) — Heated Massage Table + Relaxation Lounger
    { gx: 28.2, gy: 5.2, pose: 'LYING_ON_BED', b: 'Thermal Massage ✓' },
    { gx: 30.6, gy: 5.9, pose: 'SITTING' },
    // WELLNESS & MOVEMENT CLASS (4) — Yoga / Tai Chi Studio Mats
    { gx: 34.1, gy: 3.4, pose: 'YOGA_STRETCH', b: 'Tai Chi & Yoga ✓' },
    { gx: 35.7, gy: 3.4, pose: 'YOGA_STRETCH' },
    { gx: 34.1, gy: 5.1, pose: 'YOGA_STRETCH' },
    { gx: 35.7, gy: 5.1, pose: 'YOGA_STRETCH' },
    // EVENTS & SOCIAL LOUNGE (4) — Plush Cream/Emerald Sofas, Coffee Table & Espresso Bar (Zero Beds)
    { gx: 26.8, gy: 10.7, pose: 'SITTING', b: 'Events & Social ✓' },
    { gx: 27.6, gy: 10.7, pose: 'SITTING' },
    { gx: 26.8, gy: 13.7, pose: 'SITTING' },
    { gx: 28.8, gy: 11.8, pose: 'SITTING' },
    // FINE-DINING RESTAURANT (4) — Round White-Clothed Bistro Tables (Zero Beds)
    { gx: 30.7, gy: 10.8, pose: 'SITTING', b: 'Fine-Dining Bistro ✓' },
    { gx: 33.6, gy: 10.8, pose: 'SITTING' },
    { gx: 30.7, gy: 13.8, pose: 'SITTING' },
    { gx: 34.9, gy: 13.8, pose: 'SITTING' },
    // RESORT GARDEN PARK (2) — Strictly Outdoors on Wooden Park Benches beside Cobblestone Paths & Fountain
    { gx: 19.65, gy: 4.9, pose: 'SITTING', b: 'Park Bench Relaxation ✓' },
    { gx: 19.65, gy: 11.9, pose: 'SITTING' }
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
        retreat: !!sd.retreat,
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

  // Synced 18-second vehicle cycle:
  // - Current mode: Emergency Ambulance brings incoming patients TO the Hospital ED only (never sends patients home)
  // - Target mode: Concierge Van transfers step-down patients from Hospital -> Retreat Village
  function updateTransport(tr, elapsedSec, isFut) {
    const into = elapsedSec % CYCLE_SEC;
    tr.active = true;
    if (!isFut) {
      // Current: Emergency Ambulance continuously queuing/unloading acute arrivals at Hospital ED only (never sends patients home)
      if (into < 5.0) {
        const sT = smoothStep(into / 5.0);
        tr.gx = 1.5 + sT * 10.1; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = false;
        tr.phase = 'ed_inbound'; tr.phaseProg = into / 5.0; tr.label = 'Ambulance Queuing → ED';
      } else if (into < 10.5) {
        tr.gx = 11.6; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = true;
        tr.phase = 'ed_dropoff'; tr.phaseProg = (into - 5.0) / 5.5;
        tr.label = 'Hospital ED Queue / Drop-Off';
      } else if (into < 15.0) {
        const sT = smoothStep((into - 10.5) / 4.5);
        tr.gx = 11.6 - sT * 10.1; tr.gy = 18.6; tr.dirX = -1; tr.openDoor = false;
        tr.phase = 'ed_depart'; tr.phaseProg = (into - 10.5) / 4.5; tr.label = '← Ambulance Clearing ED';
      } else {
        tr.gx = 1.5; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = false;
        tr.phase = 'ed_approach'; tr.phaseProg = (into - 15.0) / 3.0; tr.label = 'Next EMS Unit → ED Queue';
      }
      return;
    }

    if (into < 6.5) {
      // Phase 1a: Pre-staged open at Hospital Main Entrance awaiting outgoing pathway patient
      tr.gx = 11.6; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = true;
      tr.phase = 'ready'; tr.phaseProg = into / 6.5;
      tr.label = 'VIP Concierge Pre-Staged (0m Wait)';
    } else if (into < 8.5) {
      // Phase 1b: 2.0s automated wheelchair ramp boarding at Hospital Main Entrance
      tr.gx = 11.6; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = true;
      tr.phase = 'board'; tr.phaseProg = (into - 6.5) / 2.0;
      tr.label = 'Automated Ramp Lift (2.0m)';
    } else if (into < 12.5) {
      // Phase 2: 4.0s smooth S-curve transit Left -> Right carrying patient
      const rawT = (into - 8.5) / 4.0;
      const sT = smoothStep(rawT);
      tr.gx = 11.6 + sT * 12.6; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = false;
      tr.phase = 'outbound'; tr.phaseProg = rawT;
      tr.label = 'Executive Shuttle → Resort (25m)';
    } else if (into < 14.5) {
      // Phase 3: 2.0s automated wheelchair ramp unloading at Luxury Resort Entrance
      tr.gx = 24.2; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = true;
      tr.phase = 'dropoff'; tr.phaseProg = (into - 12.5) / 2.0;
      tr.label = 'Resort VIP Handover (2.0m)';
    } else {
      // Phase 4: 3.5s smooth return Right -> Left
      const rawT = (into - 14.5) / 3.5;
      const sT = smoothStep(rawT);
      tr.gx = 24.2 - sT * 12.6; tr.gy = 18.6; tr.dirX = -1; tr.openDoor = false;
      tr.phase = 'return'; tr.phaseProg = rawT;
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
    const forceSnap = simState.snapNext;

    const tr = simState.transports[0];
    updateTransport(tr, tSec, isFut);

    // Single Concierge (`st-7`) in Target, or ED Paramedic in Current unloading patients INTO Hospital ED
    const concierge = simState.agents.find(a => a.id === 'st-7');
    if (concierge) {
      concierge.roleLabel = isFut ? 'Concierge' : 'Nurse';
      concierge.role = isFut ? 'concierge' : 'nurse';
      if (isFut && tr.phase === 'ready') {
        concierge.inVehicle = false;
        concierge.gx = 12.2;
        concierge.gy = 16.2;
        concierge.pose = 'IDLE';
        concierge.bubble = 'Pre-Staged Ready ✓';
        concierge.bubbleType = 'ok';
        concierge.taskProg = null;
        concierge.showBubble = true;
      } else if (tr.phase === 'board' || tr.phase === 'ed_dropoff') {
        concierge.inVehicle = false;
        concierge.gx = 12.2;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.bubble = isFut ? 'Ramp Lift (2.0m)' : 'ED Admission In →';
        concierge.bubbleType = isFut ? 'ok' : 'wait';
        concierge.taskProg = tr.phaseProg;
        concierge.showBubble = true;
      } else if (tr.phase === 'dropoff') {
        concierge.inVehicle = false;
        concierge.gx = 24.8;
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
        ag.inVehicle = ag.retreat && !isFut; // retreat staff do not exist in Current
        if (ag.inVehicle) return;
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 5.5, splitX: 18, snap: forceSnap });
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

      // Group A (0..6): 7 Inpatient Ward Beds in Current (98% occ) -> 2 Freed into Resort Spa/Lounge in Target (74% occ)
      if (sIdx < 7) {
        if (isFut && sIdx >= 5) {
          const rSpot = sIdx === 5 ? { gx: 28.2, gy: 3.4, pose: 'LYING_ON_BED' } : { gx: 30.6, gy: 4.7, pose: 'SITTING' };
          ag.pose = rSpot.pose;
          PH.stepAgentPhysics(ag, rSpot.gx, rSpot.gy, dtSec, { splitX: 18, snap: true });
          return;
        }
        const b = HOSPITAL_BEDS[sIdx];
        ag.pose = 'LYING_ON_BED';
        PH.stepAgentPhysics(ag, b.gx, b.gy, dtSec, { splitX: 18, snap: true });
        return;
      }

      // Group B (7..29): 23 Background Patients seated in Current queues or enjoying Target resort zones
      if (sIdx < 30) {
        const qIdx = sIdx - 7;
        const spot = isFut ? TARGET_SMOOTH_SPOTS[qIdx] : CURRENT_QUEUE_SPOTS[qIdx];
        ag.pose = spot.pose;
        const isParkSpot = spot.gx > 18 && (spot.gx < 22.8 || spot.gy < 2.5);
        const snap = forceSnap || isParkSpot || ((spot.pose === 'LYING_ON_BED' || spot.pose === 'YOGA_STRETCH') && Math.hypot(spot.gx - ag.gx, spot.gy - ag.gy) < 1.2);
        PH.stepAgentPhysics(ag, spot.gx, spot.gy, dtSec, { baseSpeed: 7.5, corridorY: spot.gx > 18 ? 7.8 : 7.5, splitX: 18, snap });
        if (spot.b && Math.hypot(spot.gx - ag.gx, spot.gy - ag.gy) < 0.2) {
          const ringDur = 2.4;
          ag.taskProg = ((tSec + qIdx * 0.5) % ringDur) / ringDur;
          ag.bubble = spot.b;
          ag.bubbleType = isFut ? 'ok' : 'wait';
          ag.showBubble = true;
        }
        return;
      }

      // Group C (30..35): 6 Active Pathway Patients (Zero foot travel across building gap x=15..23)
      const pIdx = sIdx - 30;
      const into18 = tSec % CYCLE_SEC;
      let tx = ag.gx, ty = ag.gy, snap = forceSnap;

      if (!isFut) {
        // CURRENT MODE: Retreat Resort does not exist — all patients remain inside Hospital (Building A)
        if (pIdx === 5) {
          // Incoming ED patient brought TO Hospital ED inside Ambulance (never sent home)
          if (tr.phase === 'ed_inbound') {
            ag.inVehicle = true;
            ag.gx = tr.gx + 1.1;
            ag.gy = tr.gy + 0.55;
            ag.z = 5;
            ag.dir = 'SE';
            ag.pose = 'SITTING';
            return;
          } else if (tr.phase === 'ed_dropoff') {
            ag.inVehicle = false;
            tx = 12.8; ty = 14.5; ag.pose = 'HANDOVER_INTERACTION';
            ag.bubble = 'ED Admission → Hospital';
            ag.bubbleType = 'wait';
            ag.taskProg = tr.phaseProg;
            ag.showBubble = true;
          } else {
            tx = 12.8; ty = 13.4; ag.pose = 'FRUSTRATED_WAIT';
            ag.bubble = 'ED Backlog';
            ag.bubbleType = 'wait';
            ag.taskProg = (into18 % 4.0) / 4.0;
            ag.showBubble = true;
          }
          PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 8.5, corridorY: 7.5, splitX: 18, snap });
          return;
        }

        // pIdx 0..4 circulate strictly inside Hospital Bottleneck (15s = 3 stages x 5s)
        const cPos = (tSec + pIdx * 3.0) % 15.0;
        const stg = Math.floor(cPos / 5.0);
        const sProg = (cPos % 5.0) / 5.0;
        if (stg === 0) {
          tx = 11.4 + (pIdx % 3) * 0.45; ty = 3.8; ag.pose = 'FRUSTRATED_WAIT';
          if (pIdx === 0) { ag.bubble = 'Ward Bed-Block (98%)'; ag.bubbleType = 'wait'; ag.taskProg = sProg; ag.showBubble = true; }
        } else if (stg === 1) {
          tx = 8.7 + (pIdx % 3) * 0.4; ty = 10.6; ag.pose = 'FRUSTRATED_WAIT';
          if (pIdx === 0) { ag.bubble = 'Billing Wait (55m)'; ag.bubbleType = 'wait'; ag.taskProg = sProg; ag.showBubble = true; }
        } else {
          tx = 12.5 + (pIdx % 3) * 0.4; ty = 14.0; ag.pose = 'FRUSTRATED_WAIT';
          if (pIdx === 0) { ag.bubble = '275m Cycle · No Van'; ag.bubbleType = 'wait'; ag.taskProg = sProg; ag.showBubble = true; }
        }
        PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 8.0, corridorY: 7.5, splitX: 18, snap });
        return;
      }

      // TARGET MODE (isFut === true):
      // - pIdx = 0: Live Full-Journey Transfer Patient (Building A -> Rides INSIDE Concierge Van -> Luxury Wellness Resort)
      // - pIdx = 1, 2: Hospital-side Discharge Pipeline inside Building A ONLY (x < 15)
      // - pIdx = 3, 4: Luxury Resort Wellness Pavilion Pipeline (Building B ONLY, aligned doors)
      // - pIdx = 5: Resort Garden Park Outdoor Stroller (completely on outer park stone footpaths)
      if (pIdx === 0) {
        if (into18 < 2.2) {
          tx = 11.8; ty = 3.8; ag.pose = 'HANDOVER_INTERACTION';
          ag.bubble = 'Pre-Discharge (15m) ✓'; ag.bubbleType = 'ok'; ag.taskProg = into18 / 2.2; ag.showBubble = true;
        } else if (into18 < 5.0) {
          tx = 9.0; ty = 10.6; ag.pose = 'HANDOVER_INTERACTION';
          ag.bubble = 'e-Billing (5m) ✓'; ag.bubbleType = 'ok'; ag.taskProg = (into18 - 2.2) / 2.8; ag.showBubble = true;
        } else if (into18 < 8.5) {
          const boarding = into18 >= 6.5;
          tx = boarding ? 12.6 : 12.8;
          ty = boarding ? 16.35 : 15.4;
          ag.pose = 'HANDOVER_INTERACTION';
          ag.bubble = boarding ? 'VIP Ramp Boarding (2m) ✓' : 'Departure Lounge ✓';
          ag.bubbleType = 'ok'; ag.taskProg = (into18 - 5.0) / 3.5; ag.showBubble = true;
        } else if (into18 < 12.5) {
          // Riding INSIDE Executive Concierge Shuttle Left -> Right across road
          ag.inVehicle = true;
          ag.gx = tr.gx + 1.2;
          ag.gy = tr.gy + 0.55;
          ag.z = 5;
          ag.dir = 'SE';
          ag.pose = 'SITTING';
          return;
        } else if (into18 < 13.5) {
          // Step down automated side/rear ramp into Luxury Resort Entrance (x = 24.4..26.8, y = 16.0)
          ag.inVehicle = false;
          if (ag.gy > 16.6 || ag.gx < 23) {
            ag.gx = 25.5; ag.gy = 16.35; ag.z = 0;
          }
          tx = 25.5; ty = 15.3; ag.pose = 'HANDOVER_INTERACTION';
          ag.bubble = 'Exiting VIP Ramp ✓'; ag.bubbleType = 'ok'; ag.taskProg = (into18 - 12.5) / 1.0; ag.showBubble = true;
        } else if (into18 < 15.8) {
          tx = 25.6; ty = 10.7; ag.pose = 'HANDOVER_INTERACTION';
          ag.bubble = 'Lounge Concierge (5m) ✓'; ag.bubbleType = 'ok'; ag.taskProg = (into18 - 13.5) / 2.3; ag.showBubble = true;
        } else {
          tx = 33.4; ty = 12.2; ag.pose = 'SITTING';
          ag.bubble = 'Fine-Dining Bistro ✓'; ag.bubbleType = 'ok'; ag.taskProg = (into18 - 15.8) / 2.2; ag.showBubble = true;
        }
      } else if (pIdx === 1 || pIdx === 2) {
        // Building A ONLY (12.0s cycle = 3 stages x 4.0s)
        const cPos = (tSec + (pIdx - 1) * 4.0) % 12.0;
        const stg = Math.floor(cPos / 4.0);
        const sProg = (cPos % 4.0) / 4.0;
        if (stg === 0) {
          tx = 11.4 + (pIdx - 1) * 0.6; ty = 3.8; ag.pose = 'HANDOVER_INTERACTION';
          if (pIdx === 1) { ag.bubble = 'Pre-Discharge ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true; }
        } else if (stg === 1) {
          tx = 8.7 + (pIdx - 1) * 0.5; ty = 10.6; ag.pose = 'HANDOVER_INTERACTION';
          if (pIdx === 1) { ag.bubble = 'e-Billing ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true; }
        } else {
          tx = 12.6 + (pIdx - 1) * 0.4; ty = 14.4; ag.pose = 'SITTING';
          if (pIdx === 1) { ag.bubble = 'Shuttle Staging ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true; }
        }
      } else if (pIdx === 3) {
        // Building B Indoor Wellness Loop (Monthly Visiting MD -> Thermal Spa -> Fine-Dining)
        const cPos = tSec % 12.0;
        const stg = Math.floor(cPos / 4.0);
        const sProg = (cPos % 4.0) / 4.0;
        let roomBubble;
        if (stg === 0) {
          tx = 25.1; ty = 4.6; ag.pose = 'SITTING';
          roomBubble = 'Monthly MD Visit ✓';
        } else if (stg === 1) {
          tx = 29.6; ty = 5.5; ag.pose = 'SITTING';
          roomBubble = 'Thermal Spa & Lounge ✓';
        } else {
          tx = 33.4; ty = 12.4; ag.pose = 'SITTING';
          roomBubble = 'Fine-Dining Bistro ✓';
        }
        const arrived = Math.hypot(tx - ag.gx, ty - ag.gy) < 0.85;
        ag.bubble = arrived ? roomBubble : 'Resort Promenade →';
        ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true;
      } else if (pIdx === 4) {
        // Anchored strictly INSIDE EVENTS & SOCIAL LOUNGE (x: 23..29.8, y: 8.8..16)
        if (ag.gx < 23.0 || ag.gx > 29.8 || ag.gy < 8.8) {
          snap = true;
        }
        const cPos = (tSec + 2.0) % 12.0;
        const stg = Math.floor(cPos / 4.0);
        const sProg = (cPos % 4.0) / 4.0;
        if (stg === 0) {
          tx = 26.0; ty = 10.6; ag.pose = 'SITTING';
        } else if (stg === 1) {
          tx = 24.5; ty = 13.3; ag.pose = 'IDLE';
        } else {
          tx = 26.9; ty = 13.7; ag.pose = 'SITTING';
        }
        ag.bubble = 'Events & Social Hour ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true;
        PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.5, corridorY: null, splitX: 18, snap });
        ag.roleLabel = isFut && ag.gx >= 18 ? 'Resident' : 'Patient';
        return;
      } else {
        // pIdx === 5: Strictly OUTDOORS along Cobblestone Park Footpath connecting South Entrance (20.7,15.2) to Central Fountain (20.7,9.9)
        if (ag.gx < 18 || ag.gx > 22.0) {
          snap = true;
        }
        const cPos = tSec % 12.0;
        const stg = Math.floor(cPos / 3.0);
        const sProg = (cPos % 3.0) / 3.0;
        if (stg === 0) {
          tx = 20.7; ty = 15.2; ag.pose = 'IDLE';
          ag.bubble = 'Cobblestone Path ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true;
        } else if (stg === 1) {
          tx = 20.7; ty = 12.4; ag.pose = 'IDLE';
          ag.bubble = 'Flowerbed Stroll ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true;
        } else if (stg === 2) {
          tx = 20.7; ty = 9.9; ag.pose = 'IDLE';
          ag.bubble = 'Fountain Plaza ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true;
        } else {
          tx = 20.7; ty = 12.6; ag.pose = 'IDLE';
          ag.bubble = 'Garden Park Walk ✓'; ag.bubbleType = 'ok'; ag.taskProg = sProg; ag.showBubble = true;
        }
        PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 8.0, corridorY: null, splitX: 18, snap });
        ag.roleLabel = isFut && ag.gx >= 18 ? 'Resident' : 'Patient';
        return;
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 10.8, corridorY: ag.gx > 18 ? 7.8 : 7.5, splitX: 18, snap });
    });

    // Ensure every individual at/entering the Luxury Retreat Resort is labeled 'Resident' (keeping 'Patient' inside Hospital)
    simState.agents.forEach(ag => {
      if (ag.role === 'resident') {
        const atRetreat = isFut && (ag.gx >= 18 || (ag.slotIdx === 30 && tr && tr.phase === 'dropoff'));
        ag.roleLabel = atRetreat ? 'Resident' : 'Patient';
      }
    });

    simState.snapNext = false;
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
    simState.snapNext = true;
    const isCur = mode === 'current';
    const bCur = document.getElementById('btn-mode-current');
    const bFut = document.getElementById('btn-mode-future');
    const strip = document.getElementById('state-time-strip');
    if (bCur) bCur.className = 'mode-btn ' + (isCur ? 'active-current' : '');
    if (bFut) bFut.className = 'mode-btn ' + (!isCur ? 'active-future' : '');
    if (strip) {
      strip.className = 'cmp-strip ' + (isCur ? 'cur-state' : 'fut-state');
      strip.textContent = isCur
        ? 'Current: 275m Cycle · 180m Wait · 98% Ward Occ. · No Retreat / No Van'
        : 'Target: 110m Cycle · 10m Wait · 74% Ward Occ. · Concierge Van + e-Billing';
    }
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
