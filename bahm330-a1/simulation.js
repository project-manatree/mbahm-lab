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

  // 12 Clinical/Operational Staff (Stationed behind desks/counters/beds; aligned with Slides 4, 7, 8, 9, 10)
  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', role: 'doctor', gx: 4.1, gy: 2.8, pose: 'EXAMINING', taskCur: 'Gate 1: Summary (25m+30m wait)', taskFut: 'Track A: Clinical e-Sign (20m) ✓', dur: 2.4, show: true },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 6.4, gy: 2.2, pose: 'EXAMINING', taskStations: [{ gx: 6.4, gy: 2.2, pose: 'EXAMINING' }, { gx: 6.4, gy: 4.4, pose: 'HANDOVER_INTERACTION' }], dwell: 4.0 },
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.9, gy: 2.8, pose: 'EXAMINING', taskCur: 'Serial Discharge Order', taskFut: 'T-24h Probable Flag ✓', dur: 2.2, show: false },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 13.55, gy: 2.6, pose: 'TYPING_TERMINAL', taskCur: 'Paper Summary Queue', taskFut: 'EWS < 3 & ISBAR Check ✓', dur: 2.0, show: false },
    { id: 'st-5', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 2.2, gy: 10.6, pose: 'TYPING_TERMINAL', taskCur: 'Rank 1: TTO Batch (45m wait)', taskFut: 'Track B: Sealed TTO (20m) ✓', dur: 2.2, show: true },
    { id: 'st-6', roleLabel: '', role: 'reception', gx: 7.2, gy: 9.15, pose: 'TYPING_TERMINAL', taskCur: 'Rank 3: Serial GL (40m wait)', taskFut: 'Track C: Pre-GL & HL7 (10m) ✓', dur: 2.0, show: true },
    // Escort RN / Concierge operating the Left <-> Right transport between the two downward-facing Main Entrances
    { id: 'st-7', roleLabel: 'Concierge', role: 'concierge', gx: 12.7, gy: 16.2, pose: 'HANDOVER_INTERACTION', taskCur: 'Rank 2: Van Lag (45m)', taskFut: 'Hard-Stop ISBAR Gate ✓', dur: 2.2, show: true },
    { id: 'st-8', retreat: true, roleLabel: 'Concierge', role: 'concierge', gx: 20.15, gy: 11.0, pose: 'TYPING_TERMINAL', taskCur: 'Duplicate Intake (25m)', taskFut: 'Hotel Lobby Concierge ✓', dur: 2.0, show: true },
    { id: 'st-9', retreat: true, roleLabel: 'Doctor', role: 'doctor', gx: 20.55, gy: 2.85, pose: 'EXAMINING', taskCur: 'Delayed Handover', taskFut: 'ISBAR Clinical Salon ✓', dur: 2.4, show: true },
    { id: 'st-10', retreat: true, roleLabel: 'Instructor', role: 'therapist', gx: 31.1, gy: 9.8, pose: 'YOGA_STRETCH', taskCur: 'No Class', taskFut: 'Yoga Studio Class ✓', dur: 2.2, show: true },
    { id: 'st-11', retreat: true, roleLabel: 'Nurse', role: 'nurse', gx: 26.2, gy: 7.8, pose: 'HANDOVER_INTERACTION', taskCur: 'No Retreat RN', taskFut: 'Suites 301–303 RN ✓', dur: 2.5, show: true },
    { id: 'st-12', retreat: true, roleLabel: 'Chef', role: 'chef', gx: 36.4, gy: 9.4, pose: 'HANDOVER_INTERACTION', taskCur: 'No Kitchen', taskFut: 'Garden Bistro Chef ✓', dur: 2.3, show: false }
  ];

  // Fixed Stationary Slots for 30 Non-Pathway Patients (Zero Slot-Shifting or Endless Loops)
  const HOSPITAL_BEDS = [
    { gx: 2.2, gy: 1.8 }, { gx: 2.2, gy: 3.8 }, { gx: 5.2, gy: 1.8 }, { gx: 5.2, gy: 3.8 },
    { gx: 9.2, gy: 1.8 }, { gx: 9.2, gy: 3.8 }, { gx: 12.0, gy: 1.8 }
  ];

  const CURRENT_QUEUE_SPOTS = [
    // Ward waiting benches (4)
    { gx: 2.4, gy: 5.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 3.3, gy: 5.4, pose: 'SITTING_WAIT' },
    { gx: 9.4, gy: 5.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 10.3, gy: 5.4, pose: 'SITTING_WAIT' },
    // Pharmacy queue (3) — queued in front of vertical TTO counter at x = 3.1..4.7
    { gx: 3.1, gy: 14.6, pose: 'SITTING_WAIT' },
    { gx: 3.9, gy: 14.6, pose: 'SITTING_WAIT' },
    { gx: 4.7, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    // Billing hall queue (8)
    { gx: 6.5, gy: 11.8, pose: 'SITTING_WAIT' },
    { gx: 7.4, gy: 11.8, pose: 'SITTING_WAIT' },
    { gx: 8.3, gy: 11.8, pose: 'SITTING_WAIT' },
    { gx: 6.5, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 7.4, gy: 13.2, pose: 'FRUSTRATED_WAIT' },
    { gx: 8.3, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 6.5, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    { gx: 7.4, gy: 14.6, pose: 'SITTING_WAIT' },
    // Departure Lobby delay (no step-down retreat / no concierge van) (4)
    { gx: 11.4, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    { gx: 12.3, gy: 14.6, pose: 'FRUSTRATED_WAIT' },
    { gx: 11.4, gy: 13.2, pose: 'SITTING_WAIT' },
    { gx: 12.3, gy: 13.2, pose: 'SITTING_WAIT' },
    // No retreat exists: bed-blocked patients stuck in hospital corridor (4)
    { gx: 11.8, gy: 7.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 12.7, gy: 7.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 13.6, gy: 7.4, pose: 'FRUSTRATED_WAIT' },
    { gx: 4.4, gy: 14.6, pose: 'SITTING_WAIT' }
  ];

  const TARGET_SMOOTH_SPOTS = [
    // Hospital Main Entrance Waiting Room & Departure Lounge relaxed seating (3)
    { gx: 11.4, gy: 9.5, pose: 'SITTING' },
    { gx: 12.1, gy: 9.5, pose: 'SITTING' },
    { gx: 11.5, gy: 11.5, pose: 'SITTING' },
    // Hospital e-Billing & Pre-Packed Rx fast-track counters (2)
    { gx: 7.4, gy: 10.8, pose: 'HANDOVER_INTERACTION' },
    { gx: 3.9, gy: 10.8, pose: 'HANDOVER_INTERACTION' },
    // VISITING DOCTOR & ISBAR CLINICAL SALON (x: 19.6..23.1, y: 2.6..6.8) (1)
    { gx: 20.7, gy: 5.3, pose: 'SITTING' },
    // SUITES 301 & 302 FAMILY VISITOR ARMCHAIRS (2)
    { gx: 23.79, gy: 5.89, pose: 'SITTING' },
    { gx: 27.29, gy: 5.89, pose: 'SITTING' },
    // RECREATION & GAMES CLUB ROOM (x: 24.6..29.2, y: 8.8..16.0 — Billiards Table, Grand Piano & Mahjong Table) (3)
    { gx: 26.25, gy: 11.20, pose: 'HANDOVER_INTERACTION' }, // Playing Billiards / Pool
    { gx: 25.55, gy: 14.75, pose: 'SITTING' },              // Playing Baby Grand Piano
    { gx: 28.26, gy: 11.05, pose: 'SITTING' },              // Playing Mahjong
    // YOGA, WELLNESS & MOVEMENT STUDIO (x: 29.2..33.6, y: 8.8..16.0, beside East Pool) — 5 of 6 Yoga Mats (5)
    { gx: 30.50, gy: 11.2, pose: 'YOGA_STRETCH' },
    { gx: 32.40, gy: 11.2, pose: 'YOGA_STRETCH' },
    { gx: 30.50, gy: 12.7, pose: 'YOGA_STRETCH' },
    { gx: 32.40, gy: 12.7, pose: 'YOGA_STRETCH' },
    { gx: 32.40, gy: 14.2, pose: 'YOGA_STRETCH' },
    // 5-STAR HOTEL ENTRANCE LOBBY & LOUNGE (x: 22.35..24.45 East Waiting Lounge Zone, clear of x=20.8..22.2 entrance walkthrough) (3)
    { gx: 22.95, gy: 10.35, pose: 'SITTING' },
    { gx: 23.75, gy: 10.35, pose: 'SITTING' },
    { gx: 22.89, gy: 13.25, pose: 'SITTING' },
    // OUTDOOR AL-FRESCO GARDEN BISTRO RESTAURANT PAVILION (x: 34.8..38.5, y: 8.4..15.6) (2)
    { gx: 35.95, gy: 11.55, pose: 'SITTING' }, // Outdoor Garden Bistro Table 1
    { gx: 37.35, gy: 13.95, pose: 'SITTING' }, // Outdoor Garden Bistro Table 2
    // RESORT GARDEN FOUNTAIN PARK (2) — Strictly Outdoors on Inner Benches under North & South Shade Trees facing Fountain
    { gx: 17.85, gy: 4.70, pose: 'SITTING' },
    { gx: 17.85, gy: 11.35, pose: 'SITTING' }
  ];

  function setStepBubble(ag, key, text, type, tSec, active, maxSec = 1.8) {
    if (!active || !text) {
      ag.bubble = null;
      ag.bubbleAlpha = 0;
      ag.showBubble = false;
      return;
    }
    if (ag._stepKey !== key || ag._stepStartSec == null || tSec < ag._stepStartSec) {
      ag._stepKey = key;
      ag._stepStartSec = tSec;
    }
    const alpha = PH.actionAlpha(tSec - ag._stepStartSec, maxSec);
    ag.bubble = alpha > 0.02 ? text : null;
    ag.bubbleType = type;
    ag.bubbleAlpha = alpha;
    ag.showBubble = alpha > 0.02;
  }

  function buildAgents() {
    simState.agents = [];
    // 36 Patients/Residents (name badges suppressed to declutter rooms; active action pills fade after 1.8s)
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
        roleLabel: '',
        role: 'resident',
        gx,
        gy,
        z: 0,
        dir: 'SE',
        pose,
        bubble: null,
        bubbleType: 'ok',
        bubbleAlpha: 0,
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
        bubbleAlpha: 0,
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
      tr.gx = 11.6 + sT * 9.2; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = false;
      tr.phase = 'outbound'; tr.phaseProg = rawT;
      tr.label = 'Executive Shuttle → Resort (25m)';
    } else if (into < 14.5) {
      // Phase 3: 2.0s automated wheelchair ramp unloading at Luxury Resort Entrance
      tr.gx = 20.8; tr.gy = 16.85; tr.dirX = 1; tr.openDoor = true;
      tr.phase = 'dropoff'; tr.phaseProg = (into - 12.5) / 2.0;
      tr.label = 'Resort VIP Handover (2.0m)';
    } else {
      // Phase 4: 3.5s smooth return Right -> Left
      const rawT = (into - 14.5) / 3.5;
      const sT = smoothStep(rawT);
      tr.gx = 20.8 - sT * 9.2; tr.gy = 18.6; tr.dirX = -1; tr.openDoor = false;
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
      if (forceSnap) {
        concierge._stepKey = null;
        concierge._stepStartSec = null;
      }
      concierge.roleLabel = isFut ? 'Concierge' : 'Nurse';
      concierge.role = isFut ? 'concierge' : 'nurse';
      if (isFut && tr.phase === 'ready') {
        concierge.inVehicle = false;
        concierge.gx = 12.2;
        concierge.gy = 16.2;
        concierge.pose = 'IDLE';
        concierge.taskProg = null;
        setStepBubble(concierge, 'concierge-ready', 'Pre-Staged Ready ✓', 'ok', tSec, true);
      } else if (tr.phase === 'board' || tr.phase === 'ed_dropoff') {
        concierge.inVehicle = false;
        concierge.gx = 12.2;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.taskProg = tr.phaseProg;
        setStepBubble(concierge, null, null, 'ok', tSec, false);
      } else if (tr.phase === 'dropoff') {
        concierge.inVehicle = false;
        concierge.gx = 21.4;
        concierge.gy = 16.2;
        concierge.pose = 'HANDOVER_INTERACTION';
        concierge.taskProg = tr.phaseProg;
        setStepBubble(concierge, null, null, 'ok', tSec, false);
      } else {
        concierge.inVehicle = true;
        concierge.gx = tr.gx + 1.4;
        concierge.gy = tr.gy + 0.5;
        setStepBubble(concierge, null, null, 'ok', tSec, false);
      }
    }

    simState.agents.forEach((ag, idx) => {
      if (ag.id === 'st-7') return;
      if (forceSnap) {
        ag._stepKey = null;
        ag._stepStartSec = null;
      }

      // Staff members: stay stationed at desk/counter/bed; action pills pulse for 1.8s staggered by role
      if (ag.role !== 'resident') {
        ag.inVehicle = ag.retreat && !isFut; // retreat staff do not exist in Current
        if (ag.inVehicle) return;
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 4.8, splitX: 18, snap: forceSnap });
          return;
        }
        const dur = ag.dur || 2.2;
        const pulsePhase = (tSec + idx * 1.45) % 7.2;
        const alpha = ag.show ? PH.actionAlpha(pulsePhase, 1.8) : 0;
        ag.taskProg = (tSec % dur) / dur;
        ag.bubble = alpha > 0.02 ? (isFut ? ag.taskFut : ag.taskCur) : null;
        ag.bubbleType = isFut ? 'ok' : 'fail';
        ag.bubbleAlpha = alpha;
        ag.showBubble = alpha > 0.02;
        return;
      }

      ag.inVehicle = false;
      ag.z = 0;
      ag.showBubble = false;
      ag.bubble = null;
      ag.bubbleAlpha = 0;
      ag.taskProg = null;

      const sIdx = ag.slotIdx;

      // Group A (0..6): 7 Inpatient Ward Beds in Current (98% occ) -> 2 Transferred into Private Luxury Recovery Suites 301 & 302 in Target (74% occ); Suite 303 receives the live transfer patient
      if (sIdx < 7) {
        if (isFut && sIdx >= 5) {
          const rSpot = sIdx === 5
            ? { gx: 24.34, gy: 3.65, pose: 'LYING_ON_BED' } // Suite 301 Recovery Bed
            : { gx: 27.84, gy: 3.65, pose: 'LYING_ON_BED' }; // Suite 302 Recovery Bed
          ag.pose = rSpot.pose;
          PH.stepAgentPhysics(ag, rSpot.gx, rSpot.gy, dtSec, { splitX: 18, snap: true });
          return;
        }
        const b = HOSPITAL_BEDS[sIdx];
        ag.pose = 'LYING_ON_BED';
        PH.stepAgentPhysics(ag, b.gx, b.gy, dtSec, { splitX: 18, snap: true });
        return;
      }

      // Group B (7..29): 23 Background Patients/Residents in Current queues or Target resort zones (zero static clutter bubbles)
      if (sIdx < 30) {
        const qIdx = sIdx - 7;
        const spot = isFut ? TARGET_SMOOTH_SPOTS[qIdx] : CURRENT_QUEUE_SPOTS[qIdx];
        ag.pose = spot.pose;
        const isParkSpot = (spot.gx >= 15.0 && spot.gx <= 19.6) || (spot.gx > 18 && (spot.gy < 2.5 || spot.gx > 33.8));
        const snap = forceSnap || isParkSpot || ((spot.pose === 'LYING_ON_BED' || spot.pose === 'YOGA_STRETCH') && Math.hypot(spot.gx - ag.gx, spot.gy - ag.gy) < 1.2);
        PH.stepAgentPhysics(ag, spot.gx, spot.gy, dtSec, { baseSpeed: 7.4, corridorY: spot.gx > 18 ? 7.8 : 7.5, splitX: 18, snap });
        return;
      }

      // Group C (30..35): 6 Active Pathway Agents (Zero indoor foot travel across building gap x=15..19.6)
      const pIdx = sIdx - 30;
      const into18 = tSec % CYCLE_SEC;
      let tx = ag.gx, ty = ag.gy, snap = forceSnap;
      let stepKey = null, stepText = null, stepType = isFut ? 'ok' : 'wait';

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
            ag.taskProg = tr.phaseProg;
            stepKey = 'c5-dropoff'; stepText = 'ED Admission → Hospital'; stepType = 'wait';
          } else {
            tx = 12.8; ty = 13.4; ag.pose = 'FRUSTRATED_WAIT';
          }
          PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.4, corridorY: 7.5, splitX: 18, snap });
          const arrived = Math.hypot(tx - ag.gx, ty - ag.gy) < 0.95;
          setStepBubble(ag, stepKey, stepText, stepType, tSec, arrived && !!stepText);
          return;
        }

        // pIdx 0..4 circulate strictly inside Hospital Serial Bottleneck (18s = 3 stages x 6s: Gate 1 -> Gate 2/3 -> Transport Lag)
        const cPos = (tSec + pIdx * 3.6) % CYCLE_SEC;
        const stg = Math.floor(cPos / 6.0);
        const sProg = (cPos % 6.0) / 6.0;
        if (stg === 0) {
          tx = 11.4 + (pIdx % 3) * 0.45; ty = 3.8; ag.pose = 'FRUSTRATED_WAIT';
          if (pIdx === 0) { stepKey = 'c0-0'; stepText = 'Gate 1: Summary Wait (55m)'; ag.taskProg = sProg; }
        } else if (stg === 1) {
          tx = 7.4 + (pIdx % 3) * 0.45; ty = 10.9; ag.pose = 'FRUSTRATED_WAIT';
          if (pIdx === 0) { stepKey = 'c0-1'; stepText = 'TTO 45m + GL 40m Wait'; ag.taskProg = sProg; }
        } else {
          tx = 12.4 + (pIdx % 3) * 0.4; ty = 13.6; ag.pose = 'FRUSTRATED_WAIT';
          if (pIdx === 0) { stepKey = 'c0-2'; stepText = '275m (170m Wait · 38.2% PCE)'; ag.taskProg = sProg; }
        }
        PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.4, corridorY: 7.5, splitX: 18, snap });
        const arrived = Math.hypot(tx - ag.gx, ty - ag.gy) < 0.95;
        setStepBubble(ag, stepKey, stepText, 'wait', tSec, arrived && !!stepText);
        return;
      }

      // TARGET MODE (isFut === true):
      // - pIdx = 0: Live Full-Journey Transfer Agent (Track A/B/C Parallel -> Scheduled Van -> Lobby Bypass Direct-to-Suite ISBAR)
      // - pIdx = 1, 2: Hospital-side Discharge Pipeline inside Building A ONLY (x < 15)
      // - pIdx = 3, 4: Luxury Resort Wellness Pavilion Pipeline (Building B ONLY, aligned doors)
      // - pIdx = 5: Continuous Walking Park Perimeter Stroller (West -> North -> East -> back around Building B)
      if (pIdx === 0) {
        if (into18 < 2.2) {
          if (ag.gx > 18) snap = true;
          tx = 11.8; ty = 3.8; ag.pose = 'HANDOVER_INTERACTION';
          stepKey = 'p0-predisch'; stepText = 'Track A: e-Sign (20m) ✓'; ag.taskProg = into18 / 2.2;
        } else if (into18 < 5.0) {
          tx = 7.6; ty = 10.8; ag.pose = 'HANDOVER_INTERACTION';
          stepKey = 'p0-ebill'; stepText = 'Track B/C: TTO + Pre-GL ✓'; ag.taskProg = (into18 - 2.2) / 2.8;
        } else if (into18 < 8.5) {
          const boarding = into18 >= 6.5;
          tx = boarding ? 12.6 : 12.6;
          ty = boarding ? 16.35 : 14.2;
          ag.pose = 'HANDOVER_INTERACTION';
          stepKey = boarding ? 'p0-board' : 'p0-lounge';
          stepText = boarding ? 'Escort RN Boarding ✓' : 'Hard-Stop ISBAR Gate ✓';
          ag.taskProg = (into18 - 5.0) / 3.5;
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
          // Step down automated side/rear ramp into Luxury Hotel Lobby Entrance (Unobstructed Walkthrough at x=21.6!)
          ag.inVehicle = false;
          if (ag.gy > 16.6 || ag.gx < 19.6) {
            ag.gx = 21.6; ag.gy = 16.35; ag.z = 0;
          }
          tx = 21.6; ty = 14.8; ag.pose = 'HANDOVER_INTERACTION';
          stepKey = 'p0-exit'; stepText = 'Hotel Lobby Bypass → Suite ✓'; ag.taskProg = (into18 - 12.5) / 1.0;
        } else if (into18 < 15.8) {
          tx = 31.8; ty = 6.1; ag.pose = 'HANDOVER_INTERACTION';
          stepKey = 'p0-concierge'; stepText = 'ISBAR Suite 303 Entry (+5m) ✓'; ag.taskProg = (into18 - 13.5) / 2.3;
        } else {
          tx = 31.34; ty = 3.65; ag.pose = 'LYING_ON_BED';
          if (Math.hypot(tx - ag.gx, ty - ag.gy) < 2.8) snap = true;
          stepKey = 'p0-bistro'; stepText = 'Suite 303 Recovery (110m) ✓'; ag.taskProg = (into18 - 15.8) / 2.2;
        }
      } else if (pIdx === 1 || pIdx === 2) {
        // Building A ONLY (12.0s cycle = 3 stages x 4.0s)
        const cPos = (tSec + (pIdx - 1) * 4.0) % 12.0;
        const stg = Math.floor(cPos / 4.0);
        const sProg = (cPos % 4.0) / 4.0;
        if (stg === 0) {
          tx = 11.4 + (pIdx - 1) * 0.6; ty = 3.8; ag.pose = 'HANDOVER_INTERACTION';
        } else if (stg === 1) {
          tx = 8.7 + (pIdx - 1) * 0.5; ty = 10.6; ag.pose = 'HANDOVER_INTERACTION';
        } else {
          tx = 12.6 + (pIdx - 1) * 0.4; ty = 14.4; ag.pose = 'SITTING';
          if (pIdx === 1 && into18 >= 8.5) { stepKey = 'p1-staging'; stepText = 'Shuttle Staging ✓'; ag.taskProg = sProg; }
        }
      } else if (pIdx === 3) {
        // Building B Indoor Wellness Loop (Doctor Clinical Salon -> Recreation & Games Club Room -> Yoga Studio)
        const cPos = tSec % 12.0;
        const stg = Math.floor(cPos / 4.0);
        const sProg = (cPos % 4.0) / 4.0;
        if (stg === 0) {
          tx = 21.1; ty = 4.4; ag.pose = 'SITTING';
          stepKey = 'p3-md'; stepText = 'Doctor Salon Check ✓';
        } else if (stg === 1) {
          tx = 28.26; ty = 14.25; ag.pose = 'SITTING';
          stepKey = 'p3-spa'; stepText = 'Billiards & Games Club ✓';
        } else {
          tx = 30.50; ty = 14.2; ag.pose = 'YOGA_STRETCH';
          stepKey = 'p3-bistro'; stepText = 'Yoga Studio Class ✓';
        }
        ag.taskProg = sProg;
      } else if (pIdx === 4) {
        // Anchored strictly INSIDE 5-STAR HOTEL ENTRANCE LOBBY & LOUNGE (x: 19.6..24.6, y: 8.8..16); zero static clutter labels
        if (ag.gx < 19.6 || ag.gx > 24.6 || ag.gy < 8.8) {
          snap = true;
        }
        const cPos = (tSec + 2.0) % 12.0;
        const stg = Math.floor(cPos / 4.0);
        if (stg === 0) {
          tx = 21.3; ty = 11.2; ag.pose = 'HANDOVER_INTERACTION';
        } else if (stg === 1) {
          tx = 21.6; ty = 13.8; ag.pose = 'IDLE';
        } else {
          tx = 23.89; ty = 13.25; ag.pose = 'SITTING';
        }
        PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.4, corridorY: null, splitX: 18, snap });
        ag.roleLabel = '';
        return;
      } else {
        // pIdx === 5: Continuous Scenic Perimeter Walking Loop around Building B (passes Middle Fountain Park & East Poolside)
        const loopPts = [
          [15.75, 14.8], [15.75, 8.0], [15.75, 1.85], [25.0, 1.85], [34.25, 1.85],
          [34.25, 8.2], [34.25, 14.8], [34.25, 8.2], [34.25, 1.85], [25.0, 1.85],
          [15.75, 1.85], [15.75, 8.0]
        ];
        if (ag.gx < 15.0) {
          snap = true;
        }
        const stg = Math.floor((tSec / 2.2) % loopPts.length);
        tx = loopPts[stg][0];
        ty = loopPts[stg][1];
        ag.pose = 'IDLE';
        PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 6.2, corridorY: null, splitX: null, snap });
        ag.roleLabel = '';
        return;
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.4, corridorY: ag.gx > 18 ? 7.8 : 7.5, splitX: 18, snap });
      const arrived = Math.hypot(tx - ag.gx, ty - ag.gy) < 0.95;
      setStepBubble(ag, stepKey, stepText, 'ok', tSec, arrived && !!stepText);
    });

    // Suppress floating Resident/Patient name badges (keep badges strictly for key staff roles)
    simState.agents.forEach(ag => {
      if (ag.role === 'resident') {
        ag.roleLabel = '';
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
        ? 'Current: 275m Serial (105m Active + 170m Wait · 38.2% PCE) · 45m TTO · 40m GL · 45m Van Lag'
        : 'Target: 110m Parallel (100m Active + 10m Wait · 90.9% PCE) · Track A/B/C · ISBAR Suite (+2.75h Freed)';
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
