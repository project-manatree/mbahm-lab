// ============================================================================
// BAHM330-A2: 8-Department Specialist Hospital Simulation
// - Fast 18-Second Presentation Cycle with 2.0-2.5s Snappy Stage Actions
// - Stationary Clinical Staff + Fixed Patient Slots (Zero Endless Running)
// - Corridor-Aware Waypoint Routing (corridorY = 9.7)
// ============================================================================

const SimApp = (() => {
  const CYCLE_SEC = 18.0; // Full 6-stage presentation workflow finishes in 18 seconds

  let simState = {
    mode: 'current',
    playing: true,
    showActionLabels: true,
    selectedAgentId: 'pat-1',
    elapsedSec: 0,
    snapNext: true,
    lastTime: performance.now(),
    agents: []
  };

  const ROOM_XS = [9.2, 11.7, 14.2, 16.7, 19.2];
  const BED_COORDS = [
    [2.1, 1.8], [4.7, 1.8], [7.3, 1.8],
    [2.1, 4.2], [4.7, 4.2], [7.3, 4.2],
    [2.1, 6.6], [4.9, 6.6]
  ];

  // Clinical staff stationed at desks/counters/scanners (aligned with realistic hospital floorplan & v2.1)
  // st-5..st-7: in Current they start on the Rear-Left inpatient ward round and walk to clinic late (+25 min);
  // in Target they start the session on time (Action 3).
  const STAFF_DEFS = [
    // Front-Center: Main Entrance C1 Reception & Triage (behind counter at x = 9.85)
    { id: 'st-1', roleLabel: '', role: 'reception', gx: 9.85, gy: 12.6, pose: 'TYPING_TERMINAL', taskCur: 'C1 History on the day (10m)', taskFut: 'C1 Pre-visit form done ✓', dur: 2.0, show: false, failCur: true },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 9.85, gy: 14.1, pose: 'TYPING_TERMINAL', taskCur: 'C1 Vague update only', taskFut: 'C1 Live delay notice ✓', dur: 2.0, show: false, failCur: true },
    // Rear-Center: 5 Specialist Consultation Room Doctors (seated behind desk at gy = 3.95)
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.1, gy: 3.95, pose: 'EXAMINING', taskCur: 'C1 19 booked · 119% load', taskFut: 'C1 On time · 16–17 booked ✓', dur: 2.4, show: true, failCur: true },
    { id: 'st-4', roleLabel: 'Doctor', role: 'doctor', gx: 12.6, gy: 3.95, pose: 'EXAMINING', taskCur: 'Consult (15m slot)', taskFut: 'Consult (15m slot)', dur: 2.4, show: false },
    {
      id: 'st-5', roleLabel: 'Doctor', role: 'doctor', gx: 15.1, gy: 3.95, pose: 'EXAMINING', dur: 2.4, show: false,
      lateRound: { offset: 0.0, bubble: 'C1 Late from ward round (+25m)', path: [[4.5, 2.8], [5.5, 6.8], [5.5, 9.7], [15.25, 9.7], [16.1, 6.2], [16.1, 3.95], [15.1, 3.95]] }
    },
    {
      id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 17.6, gy: 3.95, pose: 'EXAMINING', dur: 2.4, show: false,
      lateRound: { offset: 0.5, path: [[7.1, 2.8], [5.5, 6.8], [5.5, 9.7], [17.75, 9.7], [18.6, 6.2], [18.6, 3.95], [17.6, 3.95]] }
    },
    {
      id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 20.1, gy: 3.95, pose: 'EXAMINING', dur: 2.4, show: false,
      lateRound: { offset: 1.0, path: [[4.5, 5.2], [5.5, 6.8], [5.5, 9.7], [20.25, 9.7], [21.1, 6.2], [21.1, 3.95], [20.1, 3.95]] }
    },
    // Rear-Right: C2 Diagnostic Imaging Radiographers (behind control desks at gy = 5.75)
    { id: 'st-8', roleLabel: 'Nurse', role: 'radiographer', gx: 23.0, gy: 5.75, pose: 'TYPING_TERMINAL', taskCur: 'C2 Referral incomplete (12%)', taskFut: 'C2 Complete at booking ✓', dur: 2.0, show: true, failCur: true },
    { id: 'st-9', roleLabel: 'Nurse', role: 'radiographer', gx: 29.0, gy: 5.75, pose: 'TYPING_TERMINAL', taskCur: 'C2 Slot wasted → rebook', taskFut: 'C2 72h pre-check ✓', dur: 2.2, show: false, failCur: true },
    // Rear-Left: Inpatient Ward Nurses (st-10 alternates cleanly between Bed 2 check and Ward Desk)
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 4.7, gy: 2.9, pose: 'EXAMINING', taskStations: [{ gx: 4.7, gy: 2.9, pose: 'EXAMINING' }, { gx: 6.2, gy: 6.1, pose: 'TYPING_TERMINAL' }], dwell: 4.2 },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 6.2, gy: 7.0, pose: 'TYPING_TERMINAL', taskCur: 'C3 Ward query (35m)', taskFut: 'C3 Day-before check ✓', dur: 2.2, show: false, failCur: true },
    // Front-Right: C3 Discharge Pharmacy (inside West staff dispensary behind counter x = 24.6)
    { id: 'st-12', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 24.2, gy: 13.2, pose: 'TYPING_TERMINAL', taskCur: 'C3 Item X stock-out', taskFut: 'C3 Safety stock 22 · ROP 52 ✓', dur: 2.3, show: true, failCur: true },
    { id: 'st-13', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 23.6, gy: 15.4, pose: 'HANDOVER_INTERACTION', taskStations: [{ gx: 23.6, gy: 15.4, pose: 'HANDOVER_INTERACTION' }, { gx: 24.2, gy: 14.6, pose: 'HANDOVER_INTERACTION' }], dwell: 3.8 },
    // Front-Left: C5 Appointment & Booking Office — 3 desks (Call Centre, RIS, Clinic List)
    { id: 'st-14', roleLabel: '', role: 'admin', gx: 2.6, gy: 11.85, pose: 'TYPING_TERMINAL', taskCur: 'C5 3 booking versions', taskFut: 'C5 One master record ✓', dur: 2.0, show: true, failCur: true },
    { id: 'st-15', roleLabel: '', role: 'admin', gx: 6.0, gy: 11.85, pose: 'TYPING_TERMINAL', dur: 2.2, show: false },
    { id: 'st-16', roleLabel: '', role: 'admin', gx: 2.6, gy: 14.65, pose: 'TYPING_TERMINAL', dur: 2.2, show: false }
  ];

  const LATE_WARD_END = 5.0;   // on ward round
  const LATE_ARRIVE = 9.5;     // reaches clinic ~25 sim-min late
  const LATE_LEAVE = 14.0;     // heads back for next morning's round

  function easeInOut(f) {
    const x = Math.max(0, Math.min(1, f));
    return x * x * (3 - 2 * x);
  }

  function pointOnPath(pts, f) {
    let total = 0;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(L);
      total += L;
    }
    let d = Math.max(0, Math.min(1, f)) * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) {
        const r = segs[i] > 0 ? Math.min(1, d / segs[i]) : 1;
        const a = pts[i], b = pts[i + 1];
        return { x: a[0] + (b[0] - a[0]) * r, y: a[1] + (b[1] - a[1]) * r, dx: b[0] - a[0], dy: b[1] - a[1] };
      }
      d -= segs[i];
    }
    const last = pts[pts.length - 1];
    return { x: last[0], y: last[1], dx: 0, dy: 0 };
  }

  function dirFrom(dx, dy) {
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'SE' : 'NW') : (dy > 0 ? 'SW' : 'NE');
  }

  function stepLateDoctor(ag, tSec, isCur) {
    const lr = ag.lateRound;
    const path = lr.path;
    const desk = path[path.length - 1];
    ag.taskProg = null;
    if (!isCur) {
      // Target: punctual session start — doctor already at the consultation desk
      ag.gx = desk[0]; ag.gy = desk[1]; ag.pose = 'EXAMINING'; ag.dir = 'SE';
      setStepBubble(ag, null, null, 'ok', tSec, false);
      return;
    }
    const c = (tSec + lr.offset) % CYCLE_SEC;
    const cycleNo = Math.floor((tSec + lr.offset) / CYCLE_SEC);
    let atClinic = false;
    if (c < LATE_WARD_END) {
      ag.gx = path[0][0]; ag.gy = path[0][1]; ag.pose = 'EXAMINING'; ag.dir = 'SW';
    } else if (c < LATE_ARRIVE) {
      const p = pointOnPath(path, easeInOut((c - LATE_WARD_END) / (LATE_ARRIVE - LATE_WARD_END)));
      ag.gx = p.x; ag.gy = p.y; ag.pose = 'WALKING'; ag.dir = dirFrom(p.dx, p.dy);
    } else if (c < LATE_LEAVE) {
      ag.gx = desk[0]; ag.gy = desk[1]; ag.pose = 'EXAMINING'; ag.dir = 'SE';
      atClinic = true;
    } else {
      const rev = path.slice().reverse();
      const p = pointOnPath(rev, easeInOut((c - LATE_LEAVE) / (CYCLE_SEC - LATE_LEAVE)));
      ag.gx = p.x; ag.gy = p.y; ag.pose = 'WALKING'; ag.dir = dirFrom(p.dx, p.dy);
    }
    setStepBubble(ag, 'late-' + cycleNo, lr.bubble || null, 'fail', tSec, atClinic && !!lr.bubble);
  }

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
    STAFF_DEFS.forEach((sd, i) => {
      simState.agents.push({
        id: sd.id,
        idNum: 100 + i,
        roleLabel: sd.roleLabel,
        role: sd.role,
        gx: sd.gx,
        gy: sd.gy,
        dir: 'SE',
        pose: sd.pose,
        taskCur: sd.taskCur,
        taskFut: sd.taskFut,
        dur: sd.dur || 2.2,
        show: !!sd.show,
        taskStations: sd.taskStations || null,
        lateRound: sd.lateRound || null,
        failCur: !!sd.failCur,
        dwell: sd.dwell || 4.0,
        bubble: null,
        bubbleType: 'ok',
        bubbleAlpha: 0,
        taskProg: null,
        showBubble: false
      });
    });

    // 38 Patients (name badges suppressed to declutter rooms; context action pills fade after 1.8s):
    // - 0..13 (14 consult patients)
    // - 14..18 (5 imaging patients)
    // - 19..26 (8 inpatient ward & lounge patients)
    // - 27..31 (5 pharmacy patients)
    // - 32..37 (6 active pathway patients stepping through the 6 hospital stages in 18s)
    for (let i = 0; i < 38; i++) {
      let group = 'pathway', idxInGroup = i - 32, role = 'patient';
      if (i < 14) { group = 'consult'; idxInGroup = i; }
      else if (i < 19) { group = 'imaging'; idxInGroup = i - 14; role = 'gown'; }
      else if (i < 27) { group = 'ward'; idxInGroup = i - 19; role = 'resident'; }
      else if (i < 32) { group = 'pharmacy'; idxInGroup = i - 27; }

      simState.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        roleLabel: '',
        role,
        group,
        idxInGroup,
        gx: 4.5 + (i % 4),
        gy: 3.5 + (i % 3),
        dir: 'SE',
        pose: 'SITTING',
        bubble: null,
        bubbleType: 'ok',
        bubbleAlpha: 0,
        taskProg: null,
        showBubble: false
      });
    }
  }

  function stepSimulation(now) {
    const dtSec = Math.min(0.05, Math.max(0.001, (now - simState.lastTime) / 1000));
    simState.lastTime = now;
    if (!simState.playing) return;

    simState.elapsedSec += dtSec;
    const tSec = simState.elapsedSec;
    const isCur = simState.mode === 'current';
    const forceSnap = simState.snapNext;

    simState.agents.forEach((ag, idx) => {
      if (forceSnap) {
        ag._stepKey = null;
        ag._stepStartSec = null;
      }

      // Staff logic: stationary at desk/counter or clean task station step; 1.8s staggered action pulses
      if (ag.id.startsWith('st-')) {
        if (ag.lateRound) {
          stepLateDoctor(ag, tSec, isCur);
          return;
        }
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 4.8 });
          return;
        }
        const dur = ag.dur || 2.2;
        const pulsePhase = (tSec + idx * 1.45) % 7.2;
        const alpha = ag.show ? PH.actionAlpha(pulsePhase, 1.8) : 0;
        ag.taskProg = (tSec % dur) / dur;
        ag.bubble = alpha > 0.02 ? (isCur ? ag.taskCur : ag.taskFut) : null;
        ag.bubbleType = isCur && ag.failCur ? 'fail' : 'ok';
        ag.bubbleAlpha = alpha;
        ag.showBubble = alpha > 0.02;
        return;
      }

      ag.showBubble = false;
      ag.bubble = null;
      ag.bubbleAlpha = 0;
      ag.taskProg = null;
      let tx = ag.gx, ty = ag.gy, snap = forceSnap;
      const k = ag.idxInGroup;
      let stepKey = null, stepText = null, stepType = isCur ? 'fail' : 'ok';

      if (ag.group === 'consult') {
        // 14 Consultation Patients (Front Main Entrance Waiting Hall or Rear-Center Consult Rooms)
        if (isCur) {
          if (k < 2) {
            tx = ROOM_XS[k] + 0.9; ty = 2.0; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            const w = k - 2;
            const row = Math.floor(w / 4);
            tx = 16.5 + (w % 4) * 1.05;
            ty = 12.4 + row * 1.6;
            ag.pose = row < 2 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
          }
        } else {
          if (k < 5) {
            tx = ROOM_XS[k] + 0.9; ty = 2.0; ag.pose = 'LYING_ON_BED';
            snap = snap || Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
          } else if (k < 10) {
            const rm = k - 5;
            tx = ROOM_XS[rm] + 1.0; ty = 5.6; ag.pose = 'SITTING';
          } else {
            const w = k - 10;
            tx = 16.5 + (w % 4) * 1.05;
            ty = 12.4;
            ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'imaging') {
        // 5 Diagnostic Imaging Patients — Current: incomplete requests queue for rework & the MRI slot is wasted; Target: pre-checked, both scanners in use
        if (isCur) {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
          } else {
            tx = 22.0 + (k - 1) * 1.6;
            ty = 7.6;
            ag.pose = 'FRUSTRATED_WAIT';
          }
        } else {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
          } else if (k === 1) {
            tx = 28.5; ty = 2.6; ag.pose = 'IN_SCANNER';
            snap = snap || Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
          } else if (k === 2) {
            tx = 26.0; ty = 2.2; ag.pose = 'LYING_ON_BED';
            snap = snap || Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
          } else if (k === 3) {
            tx = 31.6; ty = 2.2; ag.pose = 'LYING_ON_BED';
            snap = snap || Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
          } else {
            tx = 24.5; ty = 7.4; ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'ward') {
        // 8 Inpatient Ward (Rear-Left) & Discharge Lounge (Front-Right) Patients
        if (isCur) {
          tx = BED_COORDS[k][0]; ty = BED_COORDS[k][1]; ag.pose = k < 7 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
        } else {
          if (k < 4) {
            tx = BED_COORDS[k][0]; ty = BED_COORDS[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            const d = k - 4;
            const loungeSpots = [
              { gx: 30.3, gy: 12.6 }, { gx: 30.3, gy: 13.7 },
              { gx: 30.3, gy: 15.6 }, { gx: 30.3, gy: 16.7 }
            ];
            tx = loungeSpots[d].gx;
            ty = loungeSpots[d].gy;
            ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'pharmacy') {
        // 5 Front-Right Discharge Pharmacy Patients — Current: queue behind Item X stock-out; Target: quick counter pickup
        if (isCur) {
          tx = 26.6 + (k % 2) * 1.3;
          ty = 12.8 + Math.floor(k / 2) * 1.4;
          ag.pose = 'FRUSTRATED_WAIT';
        } else {
          const rxSpots = [
            { gx: 26.2, gy: 12.8, pose: 'HANDOVER_INTERACTION' },
            { gx: 26.2, gy: 14.4, pose: 'HANDOVER_INTERACTION' },
            { gx: 27.1, gy: 17.2, pose: 'SITTING' },
            { gx: 27.9, gy: 17.2, pose: 'SITTING' },
            { gx: 28.7, gy: 17.2, pose: 'SITTING' }
          ];
          tx = rxSpots[k].gx;
          ty = rxSpots[k].gy;
          ag.pose = rxSpots[k].pose;
        }
      } else {
        // 6 Active Pathway Patients stepping from Front Main Entrance through Consultation, Imaging & Front Pharmacy Exit
        const cyclePos = (tSec + k * 3.0) % CYCLE_SEC;
        const stage = Math.floor(cyclePos / 3.0);
        const stageProg = (cyclePos % 3.0) / 3.0;

        if (stage === 0) {
          // Stage 1: Enter Front Main Entrance into C1/C5 Reception Check-In (aligned with doorway x=13.8..16.8)
          tx = 14.4; ty = 16.4; ag.pose = 'HANDOVER_INTERACTION';
          if (k === 0) {
            stepKey = (isCur ? 'c-' : 't-') + 's0';
            stepText = isCur ? 'C5 SMS ≠ call-centre time' : 'C5 One booking record ✓';
            stepType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
          }
        } else if (stage === 1) {
          // Stage 2: Front C1 Outpatient Waiting Hall Bench (|14.4 - 15.6| <= 1.4, walks directly inside lobby)
          tx = 15.6; ty = 15.4; ag.pose = isCur ? 'FRUSTRATED_WAIT' : 'SITTING';
          if (k === 0) {
            stepKey = (isCur ? 'c-' : 't-') + 's1';
            stepText = isCur ? 'C1 Wait 33m · no update' : 'C1 Wait 6–9m · live notice ✓';
            stepType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
          }
        } else if (stage === 2) {
          // Stage 3: Cross central corridor into Rear-Center Specialist Consultation Room 2 (door x=12.2..13.3)
          tx = 12.7; ty = 5.6; ag.pose = 'SITTING';
          if (k === 0) {
            stepKey = (isCur ? 'c-' : 't-') + 's2';
            stepText = 'Consult (15m slot)';
            stepType = 'ok';
            ag.taskProg = stageProg;
          }
        } else if (stage === 3) {
          // Stage 4: Rear-Right C2 Imaging referral completeness check (door x=23.2..24.8)
          tx = 23.6; ty = 7.4; ag.pose = isCur ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            stepKey = (isCur ? 'c-' : 't-') + 's3';
            stepText = isCur ? 'C2 Incomplete → rebook' : 'C2 Pre-checked → scan ✓';
            stepType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
          }
        } else if (stage === 4) {
          // Stage 5: Obvious C2 divergence — Current: turned away to Front-Left C5 Rebooking Office; Target: enters Scan Bay
          if (isCur) {
            tx = 5.2; ty = 13.4; ag.pose = 'FRUSTRATED_WAIT';
          } else {
            tx = 24.2; ty = 4.2; ag.pose = 'HANDOVER_INTERACTION';
          }
          if (k === 0) {
            stepKey = (isCur ? 'c-' : 't-') + 's4';
            stepText = isCur ? 'C2 Wasted visit → rebook' : 'C2 First-time-right scan ✓';
            stepType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
          }
        } else {
          // Stage 6: Front-Right C3 Discharge & Outpatient Pharmacy Pickup & Exit (door x=27.2..29.6)
          tx = 27.8; ty = 13.6; ag.pose = isCur ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            stepKey = (isCur ? 'c-' : 't-') + 's5';
            stepText = isCur ? 'C3 Rx wait ≈90m' : 'C3 Pre-packed Rx ≤30m ✓';
            stepType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
          }
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.4, corridorY: 9.7, snap });
      if (ag.group === 'pathway' && k === 0 && stepText) {
        const arrived = Math.hypot(tx - ag.gx, ty - ag.gy) < 0.95;
        setStepBubble(ag, stepKey, stepText, stepType, tSec, arrived);
      }
    });

    simState.snapNext = false;
  }

  function handleWorldClick(mx, my) {
    for (const ag of simState.agents) {
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
        ? 'Current: C1 33m wait · C2 12% incomplete · C3 ≈90m Rx · C5 3 booking versions'
        : 'Target: C1 6–9m wait · C2 ≥95% complete · C3 ≤30m Rx · C5 <1% mismatch';
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
