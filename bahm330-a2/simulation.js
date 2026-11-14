// ============================================================================
// BAHM330-A2: Calibrated 8-Department Specialist Hospital Simulation
// - Live Shift Clock (08:00 HH:MM, 1x = 1 sim min / 1.5s, 2x, 5x)
// - Proportional Hospital Handling Timings:
//   * C1 Consultation: Registration (4m vs 1.5m) -> Wait (68m vs 12m) -> Exam (18m)
//   * C2 Radiology: Referral Check (3m reject vs 0.5m CPOE) -> CT/MRI Scan (14m)
//   * C3 Discharge Pharmacy: Stockout & Ward Call (92m) vs Robotic Pick (18m)
//   * C5 Reception HIS Sync: Conflict Call (12m) vs Instant SSOT Sync (1m)
// - Overhead Task Progress Rings + Role-Based Ease-In/Ease-Out Physics
// ============================================================================

const SimApp = (() => {
  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    selectedAgentId: 'pat-1',
    simMinutes: 0,
    lastTime: performance.now(),
    agents: []
  };

  const STAFF_DEFS = [
    // Reception & Triage (C1 Registration: 4m Current vs 1.5m Target)
    { id: 'st-1', roleLabel: 'Staff', role: 'reception', gx: 2.2, gy: 2.4, pose: 'TYPING_TERMINAL', taskCur: ['Reg Check', 4], taskFut: ['Kiosk Sync', 1.5] },
    { id: 'st-2', roleLabel: 'Nurse', role: 'nurse', gx: 2.2, gy: 4.0, pose: 'TYPING_TERMINAL', taskCur: ['Triage', 4], taskFut: ['Fast Triage', 1.5] },
    // 5 Consultation Room Doctors (18m realistic doctor-patient exam + PACS review)
    { id: 'st-3', roleLabel: 'Doctor', role: 'doctor', gx: 10.1, gy: 4.8, pose: 'EXAMINING', taskCur: ['Examining', 18], taskFut: ['Examining', 18] },
    { id: 'st-4', roleLabel: 'Doctor', role: 'doctor', gx: 12.6, gy: 4.8, pose: 'EXAMINING', taskCur: ['Examining', 18], taskFut: ['Examining', 18] },
    { id: 'st-5', roleLabel: 'Doctor', role: 'doctor', gx: 15.1, gy: 4.8, pose: 'EXAMINING', taskCur: ['Examining', 18], taskFut: ['Examining', 18] },
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 17.6, gy: 4.8, pose: 'EXAMINING', taskCur: ['Examining', 18], taskFut: ['Examining', 18] },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 20.1, gy: 4.8, pose: 'EXAMINING', taskCur: ['Examining', 18], taskFut: ['Examining', 18] },
    // Diagnostic Imaging Radiographers (3m paper check vs 0.5m CPOE, 14m CT/MRI scan)
    { id: 'st-8', roleLabel: 'Nurse', role: 'radiographer', gx: 23.0, gy: 6.8, pose: 'TYPING_TERMINAL', taskCur: ['Paper Check', 3], taskFut: ['CT Scan', 14] },
    { id: 'st-9', roleLabel: 'Nurse', role: 'radiographer', gx: 29.0, gy: 6.8, pose: 'TYPING_TERMINAL', taskCur: ['Paper Check', 3], taskFut: ['MRI Scan', 14] },
    // Inpatient Ward Nurses
    { id: 'st-10', roleLabel: 'Nurse', role: 'nurse', gx: 8.6, gy: 13.0, pose: 'WALKING', patrol: [{ gx: 3.0, gy: 13.0 }, { gx: 8.6, gy: 13.0 }, { gx: 8.6, gy: 16.2 }] },
    { id: 'st-11', roleLabel: 'Nurse', role: 'nurse', gx: 9.2, gy: 16.0, pose: 'TYPING_TERMINAL', taskCur: ['Ward Call', 92], taskFut: ['Discharge', 18] },
    // Central Pharmacy Pharmacists (92m stockout vs 18m robotic pick & counselling)
    { id: 'st-12', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 17.8, gy: 12.4, pose: 'TYPING_TERMINAL', taskCur: ['Stockout Call', 92], taskFut: ['Robotic Rx', 18] },
    { id: 'st-13', roleLabel: 'Pharmacist', role: 'pharmacist', gx: 20.4, gy: 13.6, pose: 'WALKING', patrol: [{ gx: 18.2, gy: 14.8 }, { gx: 22.8, gy: 14.8 }] },
    // IT & Booking Command Staff (12m conflict resolution vs 1m SSOT check-in)
    { id: 'st-14', roleLabel: 'Staff', role: 'admin', gx: 27.0, gy: 12.6, pose: 'TYPING_TERMINAL', taskCur: ['Clash Call', 12], taskFut: ['SSOT Sync', 1] }
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
        patrol: sd.patrol || null,
        patrolIdx: 0,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false
      });
    });

    // 38 Patients across Consultation (18), Imaging (6), Ward & Lounge (8), Pharmacy (6)
    for (let i = 0; i < 38; i++) {
      simState.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        roleLabel: 'Patient',
        role: (i >= 18 && i < 24) ? 'gown' : (i >= 24 && i < 32) ? 'resident' : 'patient',
        group: i < 18 ? 'consult' : i < 24 ? 'imaging' : i < 32 ? 'ward' : 'pharmacy',
        idxInGroup: i < 18 ? i : i < 24 ? i - 18 : i < 32 ? i - 24 : i - 32,
        gx: 5.0 + (i % 5),
        gy: 4.0 + (i % 3),
        dir: 'SE',
        pose: 'SITTING',
        phase: (i * 0.17) % 1,
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

    // Calibrated clock: 1x = 1 simulated minute per 1.5 real seconds
    const dtSimMins = (dtSec / 1.5) * simState.speed;
    simState.simMinutes += dtSimMins;

    const clockEl = document.getElementById('sim-clock');
    if (clockEl) clockEl.textContent = PH.formatShiftClock(simState.simMinutes);

    const isCur = simState.mode === 'current';
    const roomXs = [9.2, 11.7, 14.2, 16.7, 19.2];
    const bedCoords = [
      [2.2, 12.0], [5.0, 12.0], [7.8, 12.0],
      [2.2, 14.6], [5.0, 14.6], [7.8, 14.6],
      [2.2, 17.2], [5.0, 17.2]
    ];

    simState.agents.forEach((ag, idx) => {
      if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        if (Math.hypot(target.gx - ag.gx, target.gy - ag.gy) < 0.12) {
          ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        }
        PH.stepAgentPhysics(ag, target.gx, target.gy, dtSec, { simSpeed: simState.speed });
        return;
      }

      if (ag.id.startsWith('st-')) {
        if (ag.id === 'st-5' || ag.id === 'st-6' || ag.id === 'st-7') {
          ag.pose = isCur ? 'IDLE' : 'EXAMINING';
        }
        const tSpec = isCur ? ag.taskCur : ag.taskFut;
        if (tSpec) {
          const [tName, tDur] = tSpec;
          const into = (simState.simMinutes + idx * 2.3) % tDur;
          ag.taskProg = into / tDur;
          ag.bubble = `${tName}: ${into < 2 ? into.toFixed(1) : Math.floor(into)}/${tDur}m`;
          ag.bubbleType = isCur && (ag.id === 'st-12' || ag.id === 'st-14') ? 'fail' : 'ok';
          ag.showBubble = (ag.id === 'st-3' || ag.id === 'st-12' || ag.id === 'st-14');
        }
        return;
      }

      ag.showBubble = false;
      ag.bubble = null;
      ag.taskProg = null;
      let tx = ag.gx, ty = ag.gy, snap = false;
      const k = ag.idxInGroup;
      const ph = ((simState.simMinutes * 0.05) + ag.phase) % 1;

      if (ag.group === 'consult') {
        // C1 Outpatient Consultation: Wait 68m Current vs 12m Target; Specialist Exam 18m
        if (isCur) {
          if (k < 2) {
            const into = (simState.simMinutes + k * 7) % 18;
            tx = roomXs[k] + 0.9; ty = 2.0; ag.pose = 'LYING_ON_BED'; snap = true;
            if (k === 0) {
              ag.bubble = `Examining: ${Math.floor(into)}/18m`;
              ag.bubbleType = 'ok';
              ag.taskProg = into / 18;
              ag.showBubble = true;
            }
          } else {
            const w = k - 2;
            const row = Math.floor(w / 4);
            const into = (simState.simMinutes + w * 4.2) % 68;
            tx = 3.8 + (w % 4) * 1.1;
            ty = 2.2 + row * 1.4;
            ag.pose = row < 3 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
            if (w === 0 || w === 8) {
              ag.bubble = `Waiting: ${Math.floor(into)}/68m`;
              ag.bubbleType = 'fail';
              ag.taskProg = into / 68;
              ag.showBubble = true;
            }
          }
        } else {
          if (k < 5) {
            const into = (simState.simMinutes + k * 3.5) % 18;
            tx = roomXs[k] + 0.9; ty = 2.0; ag.pose = 'LYING_ON_BED'; snap = true;
            if (k === 0) {
              ag.bubble = `Examining: ${Math.floor(into)}/18m`;
              ag.bubbleType = 'ok';
              ag.taskProg = into / 18;
              ag.showBubble = true;
            }
          } else if (k < 10) {
            const rm = k - 5;
            const into = (simState.simMinutes + rm * 2.1) % 12;
            tx = roomXs[rm] + 1.0; ty = 5.6; ag.pose = 'SITTING';
            if (rm === 2) {
              ag.bubble = `Wait: ${Math.floor(into)}/12m ✓`;
              ag.bubbleType = 'ok';
              ag.taskProg = into / 12;
              ag.showBubble = true;
            }
          } else {
            const w = k - 10;
            tx = 4.0 + ((ph + w * 0.12) % 1) * 17.0;
            ty = w % 2 === 0 ? 9.4 : 10.2;
            ag.pose = 'WALKING';
          }
        }
      } else if (ag.group === 'imaging') {
        // C2 Radiology: 3m referral check + 14m CT/MRI scan cycle
        const scanInto = (simState.simMinutes + k * 4) % 14;
        if (isCur) {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
            ag.bubble = `CT Scan: ${Math.floor(scanInto)}/14m`;
            ag.bubbleType = 'ok';
            ag.taskProg = scanInto / 14;
            ag.showBubble = true;
          } else {
            const refInto = (simState.simMinutes + k) % 3;
            tx = 22.0 + (k - 1) * 1.6;
            ty = 7.6;
            ag.pose = 'FRUSTRATED_WAIT';
            if (k === 1) {
              ag.bubble = `Paper Reject: ${refInto.toFixed(1)}/3m`;
              ag.bubbleType = 'fail';
              ag.taskProg = refInto / 3;
              ag.showBubble = true;
            }
          }
        } else {
          if (k === 0) {
            tx = 22.9; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
            ag.bubble = `CT Scan: ${Math.floor(scanInto)}/14m`;
            ag.bubbleType = 'ok';
            ag.taskProg = scanInto / 14;
            ag.showBubble = true;
          } else if (k === 1) {
            tx = 28.5; ty = 2.6; ag.pose = 'IN_SCANNER'; snap = true;
            ag.bubble = `3T MRI: ${Math.floor(scanInto)}/14m`;
            ag.bubbleType = 'ok';
            ag.taskProg = scanInto / 14;
            ag.showBubble = true;
          } else if (k === 2) { tx = 26.0; ty = 2.2; ag.pose = 'LYING_ON_BED'; snap = true; }
          else if (k === 3) { tx = 31.6; ty = 2.2; ag.pose = 'LYING_ON_BED'; snap = true; }
          else {
            tx = 22.5 + ((ph + k * 0.3) % 1) * 8.5;
            ty = 9.6;
            ag.pose = 'WALKING';
          }
        }
      } else if (ag.group === 'ward') {
        // C3a Inpatient Ward: 92m stockout bed block in Current vs 18m robotic discharge in Target
        if (isCur) {
          const into = (simState.simMinutes + k * 11) % 92;
          tx = bedCoords[k][0]; ty = bedCoords[k][1]; ag.pose = 'SITTING_WAIT';
          if (k === 0 || k === 3) {
            ag.bubble = `Rx Wait: ${Math.floor(into)}/92m`;
            ag.bubbleType = 'fail';
            ag.taskProg = into / 92;
            ag.showBubble = true;
          }
        } else {
          const into = (simState.simMinutes + k * 3) % 18;
          if (k < 4) {
            tx = bedCoords[k][0]; ty = bedCoords[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            const d = k - 4;
            tx = 12.4 + (d % 2) * 1.4;
            ty = 12.2 + ((ph + d * 0.25) % 1) * 6.2;
            ag.pose = 'WALKING';
            if (d === 0) {
              ag.bubble = `Lounge Rx: ${Math.floor(into)}/18m ✓`;
              ag.bubbleType = 'ok';
              ag.taskProg = into / 18;
              ag.showBubble = true;
            }
          }
        }
      } else if (ag.group === 'pharmacy') {
        // C3b Central Pharmacy: 92m delay vs 18m robotic pick & counselling
        if (isCur) {
          const into = (simState.simMinutes + k * 9) % 92;
          tx = 18.2 + (k % 3) * 1.4;
          ty = 16.2 + Math.floor(k / 3) * 1.3;
          ag.pose = 'FRUSTRATED_WAIT';
          if (k === 0) {
            ag.bubble = `Stockout: ${Math.floor(into)}/92m`;
            ag.bubbleType = 'fail';
            ag.taskProg = into / 92;
            ag.showBubble = true;
          }
        } else {
          tx = 18.8 + (k % 3) * 1.5;
          ty = 12.8 + ((ph + k * 0.16) % 1) * 5.6;
          ag.pose = 'WALKING';
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { simSpeed: simState.speed, snap });
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
