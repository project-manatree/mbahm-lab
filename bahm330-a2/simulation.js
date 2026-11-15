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
    [2.2, 12.0], [5.0, 12.0], [7.8, 12.0],
    [2.2, 14.6], [5.0, 14.6], [7.8, 14.6],
    [2.2, 17.2], [5.0, 17.2]
  ];

  // 14 Clinical Staff stationed at desks/counters/scanners (only walk for specific tasks)
  const STAFF_DEFS = [
    // C1 Reception & Triage
    { id: 'st-1', roleLabel: 'Staff', role: 'reception', gx: 2.2, gy: 2.4, pose: 'TYPING_TERMINAL', taskCur: 'C1 Manual Reg (4m)', taskFut: 'C1 ETA Kiosk (1.5m) ✓', dur: 2.0, show: false },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 2.2, gy: 4.0, pose: 'TYPING_TERMINAL', taskCur: 'C1 Queue Backlog', taskFut: 'C1 Wave Triage ✓', dur: 2.0, show: false },
    // 5 Specialist Consultation Room Doctors
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.1, gy: 4.8, pose: 'EXAMINING', taskCur: 'Examining (18m)', taskFut: 'Examining (18m)', dur: 2.4, show: true },
    { id: 'st-4', roleLabel: 'Doctor', role: 'doctor', gx: 12.6, gy: 4.8, pose: 'EXAMINING', taskCur: 'Examining (18m)', taskFut: 'Examining (18m)', dur: 2.4, show: false },
    { id: 'st-5', roleLabel: 'Doctor', role: 'doctor', gx: 15.1, gy: 4.8, pose: 'EXAMINING', taskCur: 'Room Idle', taskFut: 'Examining (18m)', dur: 2.4, show: false },
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 17.6, gy: 4.8, pose: 'EXAMINING', taskCur: 'Room Idle', taskFut: 'Examining (18m)', dur: 2.4, show: false },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 20.1, gy: 4.8, pose: 'EXAMINING', taskCur: 'Room Idle', taskFut: 'Examining (18m)', dur: 2.4, show: false },
    // C2 Diagnostic Imaging Radiographers
    { id: 'st-8', roleLabel: 'Nurse', role: 'radiographer', gx: 23.0, gy: 6.8, pose: 'TYPING_TERMINAL', taskCur: 'C2 40% Walk-Backs', taskFut: 'C2 99% CPOE CT ✓', dur: 2.0, show: false },
    { id: 'st-9', roleLabel: 'Nurse', role: 'radiographer', gx: 29.0, gy: 6.8, pose: 'TYPING_TERMINAL', taskCur: 'C2 Form Rework', taskFut: 'C2 3T MRI Ready ✓', dur: 2.2, show: false },
    // Inpatient Ward Nurses (st-10 alternates cleanly between Bed 2 check and Ward Desk)
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 5.0, gy: 13.0, pose: 'EXAMINING', taskStations: [{ gx: 5.0, gy: 13.0, pose: 'EXAMINING' }, { gx: 8.5, gy: 15.5, pose: 'TYPING_TERMINAL' }], dwell: 4.2 },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 9.2, gy: 16.0, pose: 'TYPING_TERMINAL', taskCur: 'C3 Ward Call (92m)', taskFut: 'C3 e-Discharge (18m)', dur: 2.2, show: false },
    // C3 Central Pharmacy Pharmacists (st-13 alternates cleanly between Robotic Dispenser and Counter)
    { id: 'st-12', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 18.6, gy: 13.8, pose: 'TYPING_TERMINAL', taskCur: 'C3 Stockout (92m)', taskFut: 'C3 e-Kanban (18m) ✓', dur: 2.3, show: true },
    { id: 'st-13', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 21.2, gy: 13.6, pose: 'HANDOVER_INTERACTION', taskStations: [{ gx: 21.2, gy: 13.6, pose: 'HANDOVER_INTERACTION' }, { gx: 18.8, gy: 12.5, pose: 'HANDOVER_INTERACTION' }], dwell: 3.8 },
    // C5 Reception & HIS Appointment Sync Command Staff
    { id: 'st-14', roleLabel: 'Staff', role: 'admin', gx: 28.0, gy: 14.0, pose: 'TYPING_TERMINAL', taskCur: 'C5 SMS≠Phone Conflict', taskFut: 'C5 99.9% SSOT Sync ✓', dur: 2.0, show: true }
  ];

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
        dwell: sd.dwell || 4.0,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false
      });
    });

    // 38 Patients:
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
        roleLabel: 'Patient',
        role,
        group,
        idxInGroup,
        gx: 4.5 + (i % 4),
        gy: 3.5 + (i % 3),
        dir: 'SE',
        pose: 'SITTING',
        bubble: null,
        bubbleType: 'ok',
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
      // Staff logic: stationary at desk/counter or clean task station step
      if (ag.id.startsWith('st-')) {
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 5.8 });
          return;
        }
        if (ag.id === 'st-5' || ag.id === 'st-6' || ag.id === 'st-7') {
          ag.pose = isCur ? 'IDLE' : 'EXAMINING';
        }
        const dur = ag.dur || 2.2;
        const into = (tSec + idx * 0.6) % dur;
        ag.taskProg = into / dur;
        ag.bubble = isCur ? ag.taskCur : ag.taskFut;
        ag.bubbleType = isCur && (ag.id === 'st-12' || ag.id === 'st-14') ? 'fail' : 'ok';
        ag.showBubble = ag.show;
        return;
      }

      ag.showBubble = false;
      ag.bubble = null;
      ag.taskProg = null;
      let tx = ag.gx, ty = ag.gy, snap = forceSnap;
      const k = ag.idxInGroup;
      const ringProg = ((tSec + k * 0.5) % 2.4) / 2.4;

      if (ag.group === 'consult') {
        // 14 Consultation Patients (Stationary in Waiting Hall chairs or Exam Beds/Chairs)
        if (isCur) {
          if (k < 2) {
            tx = ROOM_XS[k] + 0.9; ty = 2.0; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            const w = k - 2;
            const row = Math.floor(w / 4);
            tx = 3.8 + (w % 4) * 1.1;
            ty = 2.2 + row * 1.4;
            ag.pose = row < 2 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
            if (w === 0) {
              ag.bubble = 'C1 No-ETA Wait (68m)';
              ag.bubbleType = 'fail';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          }
        } else {
          if (k < 5) {
            tx = ROOM_XS[k] + 0.9; ty = 2.0; ag.pose = 'LYING_ON_BED';
            snap = snap || Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
          } else if (k < 10) {
            const rm = k - 5;
            tx = ROOM_XS[rm] + 1.0; ty = 5.6; ag.pose = 'SITTING';
            if (rm === 2 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
              ag.bubble = 'C1 Wave ETA (12m) ✓';
              ag.bubbleType = 'ok';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          } else {
            const w = k - 10;
            tx = 3.8 + (w % 4) * 1.1;
            ty = 2.2;
            ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'imaging') {
        // 5 Diagnostic Imaging Patients (Stationary in CT/MRI Scanners, Prep Tables, or Control Queue)
        if (isCur) {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
            ag.bubble = 'CT Scan (14m)';
            ag.bubbleType = 'ok';
            ag.taskProg = ringProg;
            ag.showBubble = true;
          } else {
            tx = 22.0 + (k - 1) * 1.6;
            ty = 7.6;
            ag.pose = 'FRUSTRATED_WAIT';
            if (k === 1 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
              ag.bubble = 'C2 40% Walk-Back';
              ag.bubbleType = 'fail';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          }
        } else {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
            ag.bubble = 'C2 99% CPOE CT ✓';
            ag.bubbleType = 'ok';
            ag.taskProg = ringProg;
            ag.showBubble = true;
          } else if (k === 1) {
            tx = 28.5; ty = 2.6; ag.pose = 'IN_SCANNER';
            snap = snap || Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
            ag.bubble = '3T MRI Ready ✓';
            ag.bubbleType = 'ok';
            ag.taskProg = ringProg;
            ag.showBubble = true;
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
        // 8 Inpatient Ward & Discharge Lounge Patients (Stationary in Beds or Lounge Sofas)
        if (isCur) {
          tx = BED_COORDS[k][0]; ty = BED_COORDS[k][1]; ag.pose = 'SITTING_WAIT';
          if (k === 0) {
            ag.bubble = 'C3 Rx Block (92m)';
            ag.bubbleType = 'fail';
            ag.taskProg = ringProg;
            ag.showBubble = true;
          }
        } else {
          if (k < 4) {
            tx = BED_COORDS[k][0]; ty = BED_COORDS[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            const d = k - 4;
            const loungeSpots = [
              { gx: 12.1, gy: 12.4 }, { gx: 12.1, gy: 13.5 },
              { gx: 12.1, gy: 15.4 }, { gx: 12.1, gy: 16.5 }
            ];
            tx = loungeSpots[d].gx;
            ty = loungeSpots[d].gy;
            ag.pose = 'SITTING';
            if (d === 0 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
              ag.bubble = 'C3 e-Kanban (18m) ✓';
              ag.bubbleType = 'ok';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          }
        }
      } else if (ag.group === 'pharmacy') {
        // 5 Central Pharmacy Patients (Stationary in Queue or Seated on Bench/Counter)
        if (isCur) {
          tx = 18.2 + (k % 3) * 1.4;
          ty = 16.2 + Math.floor(k / 3) * 1.3;
          ag.pose = 'FRUSTRATED_WAIT';
          if (k === 0 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
            ag.bubble = 'C3 Stockout (92m)';
            ag.bubbleType = 'fail';
            ag.taskProg = ringProg;
            ag.showBubble = true;
          }
        } else {
          const rxSpots = [
            { gx: 17.5, gy: 13.0, pose: 'HANDOVER_INTERACTION' },
            { gx: 19.2, gy: 13.0, pose: 'HANDOVER_INTERACTION' },
            { gx: 21.5, gy: 17.4, pose: 'SITTING' },
            { gx: 22.3, gy: 17.4, pose: 'SITTING' },
            { gx: 23.1, gy: 17.4, pose: 'SITTING' }
          ];
          tx = rxSpots[k].gx;
          ty = rxSpots[k].gy;
          ag.pose = rxSpots[k].pose;
        }
      } else {
        // 6 Active Pathway Patients stepping cleanly through 6 hospital stages in 18 seconds (3.0s per stage)
        const cyclePos = (tSec + k * 3.0) % CYCLE_SEC;
        const stage = Math.floor(cyclePos / 3.0);
        const stageProg = (cyclePos % 3.0) / 3.0;

        if (stage === 0) {
          // Stage 1: C5 Reception HIS Sync Check-In
          tx = 2.4; ty = 5.8; ag.pose = 'HANDOVER_INTERACTION';
          if (k === 0) {
            ag.bubble = isCur ? 'C5 SMS≠Phone Conflict' : 'C5 99.9% SSOT Sync ✓';
            ag.bubbleType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else if (stage === 1) {
          // Stage 2: C1 Outpatient Waiting Hall Bench
          tx = 7.2; ty = 6.4; ag.pose = isCur ? 'FRUSTRATED_WAIT' : 'SITTING';
          if (k === 0) {
            ag.bubble = isCur ? 'C1 No-ETA Wait (68m)' : 'C1 Wave ETA (12m) ✓';
            ag.bubbleType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else if (stage === 2) {
          // Stage 3: Specialist Consultation Room
          tx = 12.7; ty = 5.6; ag.pose = 'SITTING';
          if (k === 0) {
            ag.bubble = 'Specialist Exam (18m)';
            ag.bubbleType = 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else if (stage === 3) {
          // Stage 4: C2 Radiology Referral / CPOE Check
          tx = 23.6; ty = 7.4; ag.pose = isCur ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            ag.bubble = isCur ? 'C2 40% Walk-Back' : 'C2 99% CPOE CT ✓';
            ag.bubbleType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else if (stage === 4) {
          // Stage 5: C3 Central Discharge Pharmacy
          tx = 20.2; ty = 13.0; ag.pose = isCur ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            ag.bubble = isCur ? 'C3 Stockout (92m)' : 'C3 e-Kanban (18m) ✓';
            ag.bubbleType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else {
          // Stage 6: Discharge Lounge Exit
          tx = 13.6; ty = 16.8; ag.pose = 'SITTING';
          if (k === 0) {
            ag.bubble = isCur ? 'Late Discharge' : 'Smooth Discharge ✓';
            ag.bubbleType = isCur ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.8, corridorY: 9.7, snap });
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
        ? 'Current: C1 68m No-ETA · C2 40% Walk-Backs · C3 92m Stockout · C5 SMS≠Phone'
        : 'Target: C1 12m Wave ETA · C2 99% CPOE CT · C3 18m e-Kanban · C5 99.9% SSOT';
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
