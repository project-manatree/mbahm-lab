// ============================================================================
// BAHM330-A2: Expanded 8-Department Specialist Hospital Real-Time Simulation
// - Identical Building Structure in Both Modes
// - 38 Concurrent Patients + 14 Doctors, Nurses, Pharmacists & Staff (52 Total)
// - Current Process (Waiting Queues):
//   * 16 Patients crowded waiting in Reception & Consultation Hall (+68m wait)
//   * 6 Patients waiting in CT/MRI corridor due to paper referral delays
//   * 8 Ward Patients stuck in beds & Pharmacy queue waiting +92m for discharge Rx
// - Optimized Process (Smooth Flow):
//   * All 5 Consultation Rooms actively cycling patients (minimal 12m wait)
//   * Both CT & 3T MRI Scanners actively scanning with smooth corridor flow
//   * Ward beds turn over smoothly via Discharge Lounge & 18m Robotic Pharmacy
// ============================================================================

const SimApp = (() => {
  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    selectedAgentId: 'pat-1',
    tick: 0,
    agents: []
  };

  const STAFF_DEFS = [
    // Reception & Triage
    { id: 'st-1', roleLabel: 'Staff', role: 'reception', gx: 2.2, gy: 2.4, pose: 'TYPING_TERMINAL' },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 2.2, gy: 4.0, pose: 'TYPING_TERMINAL' },
    // 5 Consultation Room Doctors (Rooms 1-5)
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.1, gy: 4.8, pose: 'EXAMINING' },
    { id: 'st-4', roleLabel: 'Doctor', role: 'doctor', gx: 12.6, gy: 4.8, pose: 'EXAMINING' },
    { id: 'st-5', roleLabel: 'Doctor', role: 'doctor', gx: 15.1, gy: 4.8, pose: 'EXAMINING' },
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 17.6, gy: 4.8, pose: 'EXAMINING' },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 20.1, gy: 4.8, pose: 'EXAMINING' },
    // Diagnostic Imaging Radiographers
    { id: 'st-8', roleLabel: 'Nurse', role: 'radiographer', gx: 23.0, gy: 6.8, pose: 'TYPING_TERMINAL' },
    { id: 'st-9', roleLabel: 'Nurse', role: 'radiographer', gx: 29.0, gy: 6.8, pose: 'TYPING_TERMINAL' },
    // Inpatient Ward Nurses
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 8.6, gy: 13.0, pose: 'WALKING', patrol: [{ gx: 3.0, gy: 13.0 }, { gx: 8.6, gy: 13.0 }, { gx: 8.6, gy: 16.2 }] },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 9.2, gy: 16.0, pose: 'TYPING_TERMINAL' },
    // Central Pharmacy Pharmacists
    { id: 'st-12', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 17.8, gy: 12.4, pose: 'TYPING_TERMINAL' },
    { id: 'st-13', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 20.4, gy: 13.6, pose: 'WALKING', patrol: [{ gx: 18.2, gy: 14.8 }, { gx: 22.8, gy: 14.8 }] },
    // IT & Booking Command Staff
    { id: 'st-14', roleLabel: 'Staff', role: 'admin', gx: 27.0, gy: 12.6, pose: 'TYPING_TERMINAL' }
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
        tx: sd.gx,
        ty: sd.gy,
        dir: 'SE',
        pose: sd.pose,
        patrol: sd.patrol || null,
        patrolIdx: 0,
        bubble: null,
        bubbleType: 'ok',
        showBubble: false
      });
    });

    // 38 Patients across Consultation (18), Imaging (6), Ward & Lounge (8), Pharmacy (6)
    for (let i = 0; i < 38; i++) {
      simState.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        roleLabel: 'Patient',
        role: (i >= 18 && i < 24) ? 'gown' : 'patient',
        group: i < 18 ? 'consult' : i < 24 ? 'imaging' : i < 32 ? 'ward' : 'pharmacy',
        idxInGroup: i < 18 ? i : i < 24 ? i - 18 : i < 32 ? i - 24 : i - 32,
        gx: 5.0 + (i % 5),
        gy: 4.0 + (i % 3),
        tx: 5.0,
        ty: 4.0,
        dir: 'SE',
        pose: 'SITTING',
        phase: (i * 0.17) % 1,
        bubble: null,
        bubbleType: 'ok',
        showBubble: false
      });
    }
  }

  function stepSimulation() {
    if (!simState.playing) return;
    const isCur = simState.mode === 'current';
    simState.tick += 0.005 * simState.speed * (isCur ? 1.0 : 1.65);

    const roomXs = [9.2, 11.7, 14.2, 16.7, 19.2];
    const bedCoords = [
      [2.2, 12.0], [5.0, 12.0], [7.8, 12.0],
      [2.2, 14.6], [5.0, 14.6], [7.8, 14.6],
      [2.2, 17.2], [5.0, 17.2]
    ];

    simState.agents.forEach(ag => {
      if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        const dx = target.gx - ag.gx;
        const dy = target.gy - ag.gy;
        const d = Math.hypot(dx, dy);
        if (d < 0.08) ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        else { ag.gx += (dx / d) * 0.045; ag.gy += (dy / d) * 0.045; ag.dir = dx > 0 ? 'SE' : 'NW'; }
        return;
      }

      // Doctors in Rooms 3-5 (st-5, st-6, st-7)
      if (ag.id === 'st-5' || ag.id === 'st-6' || ag.id === 'st-7') {
        ag.pose = isCur ? 'IDLE' : 'EXAMINING';
        return;
      }

      if (!ag.id.startsWith('pat-')) return;

      ag.showBubble = false;
      ag.bubble = null;
      let tx = ag.gx, ty = ag.gy, snap = false;
      const k = ag.idxInGroup;
      const ph = (simState.tick + ag.phase) % 1;

      if (ag.group === 'consult') {
        // 18 Consultation Patients
        if (isCur) {
          // Current Process: Only 2 rooms active; 16 patients stuck waiting on benches & standing in corridor
          if (k < 2) {
            tx = roomXs[k] + 0.9;
            ty = 2.0;
            ag.pose = 'LYING_ON_BED';
            snap = true;
          } else {
            const w = k - 2;
            const row = Math.floor(w / 4);
            tx = 3.8 + (w % 4) * 1.1;
            ty = 2.2 + row * 1.4;
            ag.pose = row < 3 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
            if (w === 0 || w === 8) {
              ag.bubble = 'Waiting (+68m)';
              ag.bubbleType = 'fail';
              ag.showBubble = true;
            }
          }
        } else {
          // Optimized Process: All 5 Consultation Rooms active + continuous smooth walk-in/walk-out flow
          if (k < 5) {
            tx = roomXs[k] + 0.9;
            ty = 2.0;
            ag.pose = 'LYING_ON_BED';
            snap = true;
            if (k === 0) { ag.bubble = 'No Waiting ✓'; ag.bubbleType = 'ok'; ag.showBubble = true; }
          } else if (k < 10) {
            // Consulting at the 5 doctor desks
            const rm = k - 5;
            tx = roomXs[rm] + 1.0;
            ty = 5.6;
            ag.pose = 'SITTING';
          } else {
            // Smoothly walking along the central hospital corridor & check-in lobby
            const w = k - 10;
            tx = 4.0 + ((ph + w * 0.12) % 1) * 17.0;
            ty = w % 2 === 0 ? 9.4 : 10.2;
            ag.dir = w % 2 === 0 ? 'SE' : 'NW';
            ag.pose = 'WALKING';
          }
        }
      } else if (ag.group === 'imaging') {
        // 6 Diagnostic Imaging Patients (CT & 3T MRI Wing, x: 21.5..33)
        if (isCur) {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
          } else {
            // Waiting in imaging queue / corridor due to paper order backlog
            tx = 22.0 + (k - 1) * 1.6;
            ty = 7.6;
            ag.pose = 'FRUSTRATED_WAIT';
            if (k === 1) { ag.bubble = 'Waiting Scan (+45m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
          }
        } else {
          // Both CT and 3T MRI + prep tables active with zero queue
          if (k === 0) { tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true; }
          else if (k === 1) { tx = 28.5; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true; }
          else if (k === 2) { tx = 26.0; ty = 2.2; ag.pose = 'LYING_ON_BED'; snap = true; }
          else if (k === 3) { tx = 31.6; ty = 2.2; ag.pose = 'LYING_ON_BED'; snap = true; }
          else {
            tx = 22.5 + ((ph + k * 0.3) % 1) * 8.5;
            ty = 9.6;
            ag.dir = 'SE';
            ag.pose = 'WALKING';
          }
        }
      } else if (ag.group === 'ward') {
        // 8 Inpatient Ward & Discharge Lounge Patients
        if (isCur) {
          // Stuck in ward beds waiting +92m for manual discharge meds
          tx = bedCoords[k][0];
          ty = bedCoords[k][1];
          ag.pose = 'SITTING_WAIT';
          if (k === 0 || k === 3) { ag.bubble = 'Waiting Rx (+92m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
        } else {
          // 4 resting comfortably in Ward beds, 4 smoothly transitioning through Discharge Lounge & Main Entrance
          if (k < 4) {
            tx = bedCoords[k][0];
            ty = bedCoords[k][1];
            ag.pose = 'LYING_ON_BED';
            snap = true;
          } else {
            const d = k - 4;
            tx = 12.4 + (d % 2) * 1.4;
            ty = 12.2 + ((ph + d * 0.25) % 1) * 6.2;
            ag.dir = 'SW';
            ag.pose = 'WALKING';
            if (d === 0) { ag.bubble = 'Discharged (18m) ✓'; ag.bubbleType = 'ok'; ag.showBubble = true; }
          }
        }
      } else if (ag.group === 'pharmacy') {
        // 6 Central Pharmacy Patients (x: 16..25.5, y: 11..19)
        if (isCur) {
          // Crowded waiting line at Pharmacy counter & bench
          tx = 18.2 + (k % 3) * 1.4;
          ty = 16.2 + Math.floor(k / 3) * 1.3;
          ag.pose = 'FRUSTRATED_WAIT';
          if (k === 0) { ag.bubble = 'Waiting Pharmacy (+92m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
        } else {
          // Smooth walk-up pickup at Robotic Pharmacy & exit out bottom door
          tx = 18.8 + (k % 3) * 1.5;
          ty = 12.8 + ((ph + k * 0.16) % 1) * 5.6;
          ag.dir = 'SW';
          ag.pose = 'WALKING';
        }
      }

      if (snap || Math.hypot(tx - ag.gx, ty - ag.gy) > 4.5) {
        ag.gx = tx;
        ag.gy = ty;
      } else {
        ag.gx += (tx - ag.gx) * 0.15;
        ag.gy += (ty - ag.gy) * 0.15;
      }
    });
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
