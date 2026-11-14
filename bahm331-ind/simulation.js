// ============================================================================
// BAHM331-IND: 8-Wing 24-Hour Geriatric Retreat & Clinical Governance Simulation
// - Fast 18-Second Presentation Cycle with 2.0-2.5s Snappy Stage Actions
// - Stationary Clinical Staff + Fixed Resident Slots (Zero Endless Running)
// - Corridor-Aware Waypoint Routing (corridorY = 9.7)
// ============================================================================

const SimApp = (() => {
  const CYCLE_SEC = 18.0; // Full presentation workflow finishes in 18 seconds

  let state = {
    mode: 'unfiltered',
    playing: true,
    showActionLabels: true,
    selectedAgentId: 'pat-1',
    elapsedSec: 0,
    lastTime: performance.now(),
    agents: []
  };

  // 12 Clinical & Retreat Staff stationed at desks/counters/beds (only walk for specific clinical tasks)
  const STAFF_DEFS = [
    // Pool & Yoga Supervision (st-1 moves cleanly between Pool Desk and Poolside Resident Assist)
    { id: 'st-1', roleLabel: 'Nurse', role: 'nurse', gx: 8.0, gy: 4.4, pose: 'EXAMINING', taskCur: 'PHI Exposed (6m)', taskFut: 'Pool Assist (1.2m) ✓', dur: 2.0, show: true, taskStations: [{ gx: 8.0, gy: 2.2, pose: 'TYPING_TERMINAL' }, { gx: 8.0, gy: 4.4, pose: 'EXAMINING' }], dwell: 4.5 },
    { id: 'st-2', roleLabel: 'Staff', role: 'therapist', gx: 15.2, gy: 3.8, pose: 'EXAMINING', taskCur: 'Alert Noise (6m)', taskFut: 'Mobility Guide ✓', dur: 2.2, show: false },
    // 24/7 Central Nurse Triage Station (0.8m / 48s verification in Target vs 8.0m backlog in Current)
    { id: 'st-3', roleLabel: 'Nurse', role: 'nurse', gx: 18.8, gy: 2.3, pose: 'TYPING_TERMINAL', taskCur: 'Alarm Backlog (8m)', taskFut: 'Triage Verify (48s) ✓', dur: 1.8, show: true },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 18.6, gy: 5.0, pose: 'TYPING_TERMINAL', taskCur: 'Manual Log (8m)', taskFut: 'False-Alarm Filter ✓', dur: 2.0, show: false },
    { id: 'st-5', roleLabel: 'Nurse', role: 'nurse', gx: 21.4, gy: 5.0, pose: 'TYPING_TERMINAL', taskCur: 'Unfiltered Feed', taskFut: 'Telemetry Hub ✓', dur: 2.2, show: false },
    // Doctor & Acute Observation Clinic (st-6 moves cleanly between MD Desk and Acute Bed 1)
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 26.0, gy: 2.2, pose: 'EXAMINING', taskCur: 'SLA Breach (11m 30s)', taskFut: 'MD Escalation (2m 40s) ✓', dur: 2.2, show: true, taskStations: [{ gx: 26.0, gy: 2.2, pose: 'TYPING_TERMINAL' }, { gx: 26.0, gy: 3.6, pose: 'EXAMINING' }], dwell: 4.5 },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 29.2, gy: 2.2, pose: 'EXAMINING', taskCur: 'Alert Fatigue', taskFut: 'Acute Care ✓', dur: 2.4, show: false },
    { id: 'st-8', roleLabel: 'Nurse', role: 'nurse', gx: 28.8, gy: 3.6, pose: 'EXAMINING', taskCur: 'Delayed Aid', taskFut: 'Bedside Vitals ✓', dur: 2.2, show: false },
    // Thermal Spa & Physio Wing
    { id: 'st-9', roleLabel: 'Nurse', role: 'therapist', gx: 3.2, gy: 13.4, pose: 'EXAMINING', taskCur: 'Wait Physio', taskFut: 'Physio Care ✓', dur: 2.4, show: false },
    { id: 'st-10', roleLabel: 'Staff', role: 'therapist', gx: 6.2, gy: 13.4, pose: 'EXAMINING', taskCur: 'Unlogged', taskFut: 'Spa Therapy ✓', dur: 2.4, show: false },
    // Dining Bistro & Suites
    { id: 'st-11', roleLabel: 'Staff', role: 'chef', gx: 12.2, gy: 17.6, pose: 'TYPING_TERMINAL', taskCur: 'Manual Menu', taskFut: 'Diet Sync ✓', dur: 2.0, show: false },
    { id: 'st-12', roleLabel: 'Nurse', role: 'nurse', gx: 23.8, gy: 13.2, pose: 'EXAMINING', taskCur: 'Suite Check', taskFut: 'Smart Hub Sync ✓', dur: 2.4, show: false }
  ];

  const YOGA_SPOTS = [
    [10.4, 2.3], [12.6, 2.3], [14.8, 2.3],
    [10.4, 4.5], [12.6, 4.5], [14.8, 4.5]
  ];
  const CLINIC_BEDS = [
    [26.0, 4.6], [28.8, 4.6], [31.4, 4.6]
  ];
  const SPA_SPOTS = [
    [2.4, 12.2], [5.2, 12.2], [8.0, 12.2],
    [2.4, 15.8], [5.2, 15.8], [8.0, 15.8]
  ];
  const BISTRO_SPOTS = [
    [11.4, 12.2], [14.2, 12.2], [17.0, 12.2],
    [11.4, 15.0], [14.2, 15.0], [17.0, 15.0]
  ];
  const SUITE_SPOTS = [
    [21.0, 12.0], [25.5, 12.0], [30.0, 12.0],
    [21.0, 16.0], [25.5, 16.0], [30.0, 16.0]
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
        dur: sd.dur || 2.2,
        show: !!sd.show,
        taskStations: sd.taskStations || null,
        dwell: sd.dwell || 4.5,
        bubble: null,
        bubbleType: 'ok',
        taskProg: null,
        showBubble: false
      });
    });

    // 36 Residents across 6 zones (6 per zone: pool_yoga, clinic, spa, bistro, suites, pathway)
    const groups = ['pool_yoga', 'clinic', 'spa', 'bistro', 'suites', 'pathway'];
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
        pose: 'SITTING',
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

    state.elapsedSec += dtSec;
    const tSec = state.elapsedSec;
    const isWaitMode = state.mode === 'unfiltered';

    state.agents.forEach((ag, idx) => {
      // Clinical & Retreat Staff: stationary at station or clean 2-station task step
      if (ag.id.startsWith('st-')) {
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 6.2, urgent: !isWaitMode });
        }
        const dur = ag.dur || 2.2;
        const into = (tSec + idx * 0.5) % dur;
        ag.taskProg = into / dur;
        ag.bubble = isWaitMode ? ag.taskCur : ag.taskFut;
        ag.bubbleType = isWaitMode ? 'fail' : 'ok';
        ag.showBubble = ag.show;
        return;
      }

      ag.showBubble = false;
      ag.bubble = null;
      ag.taskProg = null;
      let tx = ag.gx, ty = ag.gy, snap = false;
      const k = ag.idxInGroup;
      const ringProg = ((tSec + k * 0.5) % 2.2) / 2.2;

      if (ag.group === 'pool_yoga') {
        if (isWaitMode) {
          if (k < 2) {
            tx = 3.2 + k * 2.0; ty = 3.6 + k * 1.2; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            tx = 9.6 + (k - 2) * 1.1; ty = 7.4; ag.pose = 'FRUSTRATED_WAIT';
            if (k === 2 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
              ag.bubble = 'PHI Exposed (6m)';
              ag.bubbleType = 'fail';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          }
        } else {
          if (k < 3) {
            tx = 3.0 + k * 1.6; ty = 3.2 + (k % 2) * 1.8; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            const ys = YOGA_SPOTS[k - 3];
            tx = ys[0]; ty = ys[1]; ag.pose = 'YOGA_STRETCH';
          }
        }
      } else if (ag.group === 'clinic') {
        // Nurse Triage (0.8m / 48s) & Visiting MD Escalation (2m 40s Target vs 11m 30s Current)
        if (isWaitMode) {
          if (k === 0) {
            tx = CLINIC_BEDS[0][0]; ty = CLINIC_BEDS[0][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 18.2 + (k - 1) * 2.0;
            ty = 7.2;
            ag.pose = 'FRUSTRATED_WAIT';
            if (k === 1 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
              ag.bubble = 'SLA Breach (11m 30s)';
              ag.bubbleType = 'fail';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          }
        } else {
          if (k < 3) {
            tx = CLINIC_BEDS[k][0]; ty = CLINIC_BEDS[k][1]; ag.pose = 'LYING_ON_BED';
            snap = Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
            if (k === 0) {
              ag.bubble = 'SLA Met (2m 40s) ✓';
              ag.bubbleType = 'ok';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          } else {
            tx = 19.2 + (k - 3) * 1.6;
            ty = 6.4;
            ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'spa') {
        if (isWaitMode) {
          if (k < 2) {
            tx = SPA_SPOTS[k][0]; ty = SPA_SPOTS[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 2.2 + (k - 2) * 1.6; ty = 17.8; ag.pose = 'FRUSTRATED_WAIT';
            if (k === 2 && Math.hypot(tx - ag.gx, ty - ag.gy) < 0.2) {
              ag.bubble = 'Alert Backlog (8m)';
              ag.bubbleType = 'fail';
              ag.taskProg = ringProg;
              ag.showBubble = true;
            }
          }
        } else {
          tx = SPA_SPOTS[k][0]; ty = SPA_SPOTS[k][1]; ag.pose = 'LYING_ON_BED';
          snap = Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
        }
      } else if (ag.group === 'bistro') {
        if (isWaitMode && k >= 3) {
          tx = 14.2 + (k - 3) * 1.2; ty = 17.6; ag.pose = 'FRUSTRATED_WAIT';
        } else {
          tx = BISTRO_SPOTS[k][0]; ty = BISTRO_SPOTS[k][1]; ag.pose = 'SITTING';
        }
      } else if (ag.group === 'suites') {
        tx = SUITE_SPOTS[k][0]; ty = SUITE_SPOTS[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
      } else {
        // 6 Active Escalation Pathway Residents stepping cleanly through 4 stages in 18 seconds (4.5s per stage)
        const cyclePos = (tSec + k * 3.0) % CYCLE_SEC;
        const stage = Math.floor(cyclePos / 4.5); // 0..3
        const stageProg = (cyclePos % 4.5) / 4.5;

        if (stage === 0) {
          // Stage 1: Poolside / Yoga Telemetry Trigger (0.1m)
          tx = 7.4; ty = 6.2; ag.pose = isWaitMode ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            ag.bubble = isWaitMode ? 'Unfiltered Alert (0.1m)' : 'Wearable Telemetry (0.1m) ✓';
            ag.bubbleType = isWaitMode ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else if (stage === 1) {
          // Stage 2: 24/7 Duty Nurse Triage Verification (48s Target vs 8m Backlog Current)
          tx = 19.6; ty = 3.4; ag.pose = isWaitMode ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            ag.bubble = isWaitMode ? 'Nurse Backlog (8m)' : 'Nurse Triage (48s) ✓';
            ag.bubbleType = isWaitMode ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else if (stage === 2) {
          // Stage 3: Visiting MD Acute Assessment (2m 40s Target vs 11m 30s Current)
          tx = 26.8; ty = 3.2; ag.pose = isWaitMode ? 'FRUSTRATED_WAIT' : 'SITTING';
          if (k === 0) {
            ag.bubble = isWaitMode ? 'Late MD (11m 30s)' : 'MD Escalation (2m 40s) ✓';
            ag.bubbleType = isWaitMode ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        } else {
          // Stage 4: Return to Recovery Suite Lounge Armchair
          tx = 22.4 + (k % 3) * 4.5; ty = 13.4; ag.pose = 'SITTING';
          if (k === 0) {
            ag.bubble = isWaitMode ? 'Delayed Recovery' : 'Stabilised in Suite ✓';
            ag.bubbleType = isWaitMode ? 'fail' : 'ok';
            ag.taskProg = stageProg;
            ag.showBubble = true;
          }
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.8, corridorY: 9.7, snap, urgent: !isWaitMode });
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
    setMode
  };
})();
