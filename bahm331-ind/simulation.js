// ============================================================================
// BAHM331-IND: Calibrated 8-Wing 24-Hour Geriatric Retreat Simulation
// - Live Shift Clock (08:00 HH:MM, 1x = 1 sim min / 1.5s, 2x, 5x)
// - Proportional Governance & Response Timings:
//   * Current Mode: Telemetry (0.1m) -> Unfiltered PHI Exposed (6m) ->
//     False Alarm Fatigue (8m) -> Late Escalation (11.5m / 11m 30s > 5m SLA)
//   * Target Mode: Telemetry (0.1m) -> Duty Nurse Verification (0.8m / 48s) ->
//     Poolside Attendant Dispatch (1.2m) -> Visiting MD Escalation (2.7m / 2m 40s < 5m SLA)
// - Overhead Task Progress Rings + Role-Based Ease-In/Ease-Out Physics
// ============================================================================

const SimApp = (() => {
  let state = {
    mode: 'unfiltered',
    playing: true,
    speed: 1,
    showActionLabels: true,
    selectedAgentId: 'pat-1',
    simMinutes: 0,
    lastTime: performance.now(),
    agents: []
  };

  const STAFF_DEFS = [
    // Pool & Yoga Supervision (1.2m arrival in Target vs 6.0m PHI exposure in Current)
    { id: 'st-1', roleLabel: 'Nurse', role: 'nurse', gx: 8.0, gy: 4.2, pose: 'EXAMINING', taskCur: ['PHI Exposed', 6.0], taskFut: ['Pool Assist', 1.2] },
    { id: 'st-2', roleLabel: 'Staff', role: 'therapist', gx: 15.2, gy: 3.8, pose: 'IDLE', taskCur: ['Alert Noise', 6.0], taskFut: ['Mobility Guide', 2.0] },
    // 24/7 Central Nurse Station (0.8m / 48s verification in Target vs 8.0m backlog in Current)
    { id: 'st-3', roleLabel: 'Nurse', role: 'nurse', gx: 18.8, gy: 2.3, pose: 'TYPING_TERMINAL', taskCur: ['Alarm Backlog', 8.0], taskFut: ['Triage Verify', 0.8] },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 18.6, gy: 5.0, pose: 'TYPING_TERMINAL', taskCur: ['Manual Log', 8.0], taskFut: ['Filter Noise', 0.8] },
    { id: 'st-5', roleLabel: 'Nurse', role: 'nurse', gx: 21.4, gy: 5.0, pose: 'WALKING', patrol: [{ gx: 18.5, gy: 6.8 }, { gx: 23.5, gy: 6.8 }] },
    // Doctor & Acute Observation Clinic (11.5m SLA breach in Current vs 2.7m / 2m 40s SLA met in Target)
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 26.0, gy: 2.2, pose: 'EXAMINING', taskCur: ['Fatigue Delay', 11.5], taskFut: ['MD Escalation', 2.7] },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 29.2, gy: 2.2, pose: 'EXAMINING', taskCur: ['Late Check', 11.5], taskFut: ['Acute Care', 2.7] },
    { id: 'st-8', roleLabel: 'Nurse', role: 'nurse', gx: 27.6, gy: 6.2, pose: 'WALKING', patrol: [{ gx: 25.5, gy: 6.2 }, { gx: 31.5, gy: 6.2 }] },
    // Thermal Spa & Physio Wing
    { id: 'st-9', roleLabel: 'Nurse', role: 'therapist', gx: 3.2, gy: 13.4, pose: 'EXAMINING', taskCur: ['Delayed Aid', 11.5], taskFut: ['Physio Care', 2.7] },
    { id: 'st-10', roleLabel: 'Staff', role: 'therapist', gx: 6.2, gy: 13.4, pose: 'EXAMINING', taskCur: ['Unlogged', 6.0], taskFut: ['Spa Care', 2.0] },
    // Dining Bistro & Suites
    { id: 'st-11', roleLabel: 'Staff', role: 'chef', gx: 12.2, gy: 17.6, pose: 'TYPING_TERMINAL', taskCur: ['Manual Menu', 6.0], taskFut: ['Diet Sync', 1.2] },
    { id: 'st-12', roleLabel: 'Nurse', role: 'nurse', gx: 23.5, gy: 10.0, pose: 'WALKING', patrol: [{ gx: 12.0, gy: 9.8 }, { gx: 29.0, gy: 9.8 }] }
  ];

  function buildAgents() {
    state.agents = [];
    STAFF_DEFS.forEach((sd, i) => {
      state.agents.push({
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

    // 36 Patients across 6 zones (6 per zone)
    const groups = ['pool_yoga', 'clinic', 'spa', 'bistro', 'suites', 'promenade'];
    for (let i = 0; i < 36; i++) {
      const grp = groups[Math.floor(i / 6)];
      const k = i % 6;
      state.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        roleLabel: 'Patient',
        role: 'resident',
        group: grp,
        idxInGroup: k,
        gx: 5.0 + (i % 6) * 4,
        gy: 9.6,
        dir: 'SE',
        pose: 'WALKING',
        phase: (i * 0.19) % 1,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false
      });
    }
  }

  function stepSimulation(now) {
    const dtSec = Math.min(0.05, Math.max(0.001, (now - state.lastTime) / 1000));
    state.lastTime = now;
    if (!state.playing) return;

    // Calibrated clock: 1x = 1 simulated minute per 1.5 real seconds
    const dtSimMins = (dtSec / 1.5) * state.speed;
    state.simMinutes += dtSimMins;

    const clockEl = document.getElementById('sim-clock');
    if (clockEl) clockEl.textContent = PH.formatShiftClock(state.simMinutes);

    const isWaitMode = state.mode === 'unfiltered';

    const yogaSpots = [
      [10.4, 2.3], [12.6, 2.3], [14.8, 2.3],
      [10.4, 4.5], [12.6, 4.5], [14.8, 4.5]
    ];
    const clinicBeds = [
      [26.0, 4.6], [28.8, 4.6], [31.4, 4.6]
    ];
    const spaSpots = [
      [2.4, 12.2], [5.2, 12.2], [8.0, 12.2],
      [2.4, 15.8], [5.2, 15.8], [8.0, 15.8]
    ];
    const bistroSpots = [
      [11.4, 12.2], [14.2, 12.2], [17.0, 12.2],
      [11.4, 15.0], [14.2, 15.0], [17.0, 15.0]
    ];
    const suiteSpots = [
      [21.0, 12.0], [25.5, 12.0], [30.0, 12.0],
      [21.0, 16.0], [25.5, 16.0], [30.0, 16.0]
    ];

    state.agents.forEach((ag, idx) => {
      if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        if (Math.hypot(target.gx - ag.gx, target.gy - ag.gy) < 0.12) {
          ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        }
        // Urgent 1.45x clinical response stride in Target mode
        PH.stepAgentPhysics(ag, target.gx, target.gy, dtSec, { simSpeed: state.speed, urgent: !isWaitMode });
        return;
      }

      if (ag.id.startsWith('st-')) {
        const tSpec = isWaitMode ? ag.taskCur : ag.taskFut;
        if (tSpec) {
          const [tName, tDur] = tSpec;
          const into = (state.simMinutes + idx * 1.1) % tDur;
          ag.taskProg = into / tDur;
          ag.bubble = `${tName}: ${into.toFixed(1)}/${tDur}m`;
          ag.bubbleType = isWaitMode ? 'fail' : 'ok';
          ag.showBubble = (ag.id === 'st-1' || ag.id === 'st-3' || ag.id === 'st-6');
        }
        return;
      }

      ag.showBubble = false;
      ag.bubble = null;
      ag.taskProg = null;
      let tx = ag.gx, ty = ag.gy, snap = false;
      const k = ag.idxInGroup;
      const ph = ((state.simMinutes * 0.05) + ag.phase) % 1;

      if (ag.group === 'pool_yoga') {
        if (isWaitMode) {
          if (k < 2) {
            tx = 3.2 + k * 2.0; ty = 3.6 + k * 1.2; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            const into = (state.simMinutes + k) % 6.0;
            tx = 9.6 + (k - 2) * 1.1; ty = 7.4; ag.pose = 'FRUSTRATED_WAIT';
            if (k === 2) {
              ag.bubble = `Wait Assist: ${into.toFixed(1)}/6.0m`;
              ag.bubbleType = 'fail';
              ag.taskProg = into / 6.0;
              ag.showBubble = true;
            }
          }
        } else {
          if (k < 3) {
            tx = 3.0 + k * 1.6; ty = 3.2 + (k % 2) * 1.8; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            const ys = yogaSpots[k - 3];
            tx = ys[0]; ty = ys[1]; ag.pose = 'YOGA_STRETCH';
          }
        }
      } else if (ag.group === 'clinic') {
        // Nurse Triage (0.8m) & Visiting MD Escalation (2.7m / 2m40s Target vs 11.5m / 11m30s Current)
        if (isWaitMode) {
          const into = (state.simMinutes + k * 2.1) % 11.5;
          if (k === 0) {
            tx = clinicBeds[0][0]; ty = clinicBeds[0][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 18.2 + (k - 1) * 2.2;
            ty = 7.2;
            ag.pose = 'FRUSTRATED_WAIT';
            if (k === 1) {
              ag.bubble = `SLA Breach: ${into.toFixed(1)}/11.5m`;
              ag.bubbleType = 'fail';
              ag.taskProg = into / 11.5;
              ag.showBubble = true;
            }
          }
        } else {
          const into = (state.simMinutes + k * 0.7) % 2.7;
          if (k < 3) {
            tx = clinicBeds[k][0]; ty = clinicBeds[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
            if (k === 0) {
              ag.bubble = `SLA Met: ${into.toFixed(1)}/2.7m ✓`;
              ag.bubbleType = 'ok';
              ag.taskProg = into / 2.7;
              ag.showBubble = true;
            }
          } else {
            tx = 19.0 + (k - 3) * 3.8;
            ty = 6.2;
            ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'spa') {
        if (isWaitMode) {
          const into = (state.simMinutes + k * 1.8) % 8.0;
          if (k < 2) {
            tx = spaSpots[k][0]; ty = spaSpots[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 2.2 + (k - 2) * 1.6; ty = 17.8; ag.pose = 'FRUSTRATED_WAIT';
            if (k === 2) {
              ag.bubble = `Wait Physio: ${into.toFixed(1)}/8.0m`;
              ag.bubbleType = 'fail';
              ag.taskProg = into / 8.0;
              ag.showBubble = true;
            }
          }
        } else {
          tx = spaSpots[k][0]; ty = spaSpots[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
        }
      } else if (ag.group === 'bistro') {
        if (isWaitMode && k >= 3) {
          tx = 14.2 + (k - 3) * 1.2; ty = 17.6; ag.pose = 'FRUSTRATED_WAIT';
        } else {
          tx = bistroSpots[k][0]; ty = bistroSpots[k][1]; ag.pose = 'SITTING';
        }
      } else if (ag.group === 'suites') {
        tx = suiteSpots[k][0]; ty = suiteSpots[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
      } else {
        if (isWaitMode) {
          tx = 17.5 + k * 2.2;
          ty = 9.6;
          ag.pose = 'FRUSTRATED_WAIT';
        } else {
          tx = 3.0 + ((ph + k * 0.16) % 1) * 28.0;
          ty = k % 2 === 0 ? 9.3 : 10.2;
          ag.pose = 'WALKING';
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { simSpeed: state.speed, snap });
    });
  }

  function handleWorldClick(mx, my) {
    for (const ag of state.agents) {
      const p = IsoRenderer.toIso(ag.gx, ag.gy, 14);
      if (Math.hypot(mx - p.x, my - p.y) < 22) {
        state.selectedAgentId = ag.id;
        return;
      }
    }
  }

  function setMode(mode) {
    state.mode = mode;
    const bCur = document.getElementById('btn-mode-unfiltered');
    const bFut = document.getElementById('btn-mode-tiered');
    if (bCur) bCur.className = 'mode-btn ' + (mode === 'unfiltered' ? 'active-current' : '');
    if (bFut) bFut.className = 'mode-btn ' + (mode === 'tiered' ? 'active-future' : '');
  }

  function setSpeed(s) {
    state.speed = s;
    [1, 2, 5].forEach(v => {
      const btn = document.getElementById(`spd-${v}`);
      if (btn) btn.classList.toggle('active', v === s);
    });
  }

  function loop(now) {
    stepSimulation(now || performance.now());
    IsoRenderer.render(state);
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    buildAgents();
    IsoRenderer.init('iso-canvas', handleWorldClick);
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  });

  return {
    setMode,
    setSpeed
  };
})();
