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
    snapNext: false,
    lastTime: performance.now(),
    agents: []
  };

  // 12 Clinical & Retreat Staff stationed at desks/counters/beds (only walk for specific clinical tasks)
  const STAFF_DEFS = [
    // Pool & Yoga Supervision (st-1 moves cleanly between Pool Desk and Poolside Resident Assist)
    { id: 'st-1', roleLabel: 'Nurse', role: 'nurse', gx: 8.0, gy: 4.4, pose: 'EXAMINING', taskCur: 'Unfiltered PHI Leak', taskFut: 'Wearable Stream ✓', dur: 2.0, show: true, taskStations: [{ gx: 8.0, gy: 2.2, pose: 'TYPING_TERMINAL' }, { gx: 8.0, gy: 4.4, pose: 'EXAMINING' }], dwell: 4.5 },
    { id: 'st-2', roleLabel: 'Instructor', role: 'therapist', gx: 15.2, gy: 3.8, pose: 'EXAMINING', taskCur: 'PHI Popup (Noise)', taskFut: 'Mobility Guide ✓', dur: 2.2, show: false },
    // 24/7 Duty Nurse Triage Station (6% Alert Fatigue in Target vs 64% Unfiltered Fatigue in Current)
    { id: 'st-3', roleLabel: 'Nurse', role: 'nurse', gx: 19.2, gy: 3.3, pose: 'TYPING_TERMINAL', taskCur: 'No Triage Filter (64%)', taskFut: 'Nurse Filter (6% Fatigue) ✓', dur: 1.8, show: true },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 18.6, gy: 5.0, pose: 'TYPING_TERMINAL', taskCur: 'False Alarm Flood', taskFut: 'False-Alarm Filter ✓', dur: 2.0, show: false },
    { id: 'st-5', roleLabel: 'Nurse', role: 'nurse', gx: 21.4, gy: 5.0, pose: 'TYPING_TERMINAL', taskCur: 'Unfiltered Feed', taskFut: 'RBAC Telemetry Hub ✓', dur: 2.2, show: false },
    // Visiting Physician Clinic (<3m Priority Escalation · 98.5% SLA in Target vs 64% Fatigue · 52% SLA in Current)
    { id: 'st-6', roleLabel: 'Visiting MD', role: 'doctor', gx: 26.2, gy: 3.2, pose: 'EXAMINING', taskCur: '64% Fatigue · 52% SLA', taskFut: 'Visiting MD <3m (98.5%) ✓', dur: 2.2, show: true, taskStations: [{ gx: 26.2, gy: 2.9, pose: 'TYPING_TERMINAL' }, { gx: 26.2, gy: 3.8, pose: 'EXAMINING' }], dwell: 4.5 },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 29.2, gy: 2.2, pose: 'EXAMINING', taskCur: '64% Alert Fatigue', taskFut: 'PriorityMD <3m ✓', dur: 2.4, show: false },
    { id: 'st-8', roleLabel: 'Nurse', role: 'nurse', gx: 28.8, gy: 3.6, pose: 'EXAMINING', taskCur: 'Missed SLA (52%)', taskFut: 'Bedside Vitals ✓', dur: 2.2, show: false },
    // Thermal Spa & Concierge Hospitality Tablets (Raw PHI Leak in Current vs RBAC Masked "Welfare Check Only" in Target)
    { id: 'st-9', roleLabel: 'Therapist', role: 'therapist', gx: 4.8, gy: 13.4, pose: 'TYPING_TERMINAL', taskCur: 'PHI Leaked on Tablet!', taskFut: 'Welfare Check Only ✓', dur: 2.4, show: true },
    { id: 'st-10', roleLabel: '', role: 'therapist', gx: 6.2, gy: 13.4, pose: 'EXAMINING', taskCur: 'Unmasked PHI', taskFut: 'Spa Therapy ✓', dur: 2.4, show: false },
    // Concierge Bistro & Suites
    { id: 'st-11', roleLabel: 'Concierge', role: 'chef', gx: 12.2, gy: 17.6, pose: 'TYPING_TERMINAL', taskCur: '14 PDPA PHI Breaches', taskFut: 'Welfare Check Only (0 PHI) ✓', dur: 2.0, show: true },
    { id: 'st-12', roleLabel: 'Nurse', role: 'nurse', gx: 23.8, gy: 13.2, pose: 'EXAMINING', taskCur: 'Suite Check', taskFut: 'RBAC Smart Hub ✓', dur: 2.4, show: false }
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
    [21.1, 12.35], [25.6, 12.35], [30.1, 12.35],
    [21.1, 16.35], [25.6, 16.35], [30.1, 16.35]
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
        bubbleAlpha: 0,
        taskProg: null,
        showBubble: false
      });
    });

    // 36 Residents across 6 zones (name badges suppressed to declutter rooms; action pills fade after 1.8s)
    const groups = ['pool_yoga', 'clinic', 'spa', 'bistro', 'suites', 'pathway'];
    for (let i = 0; i < 36; i++) {
      const grp = groups[Math.floor(i / 6)];
      const k = i % 6;
      state.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        roleLabel: '',
        role: 'resident',
        group: grp,
        idxInGroup: k,
        gx: 5.0 + (i % 6) * 4,
        gy: 9.6,
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
    const dtSec = Math.min(0.05, Math.max(0.001, (now - state.lastTime) / 1000));
    state.lastTime = now;
    if (!state.playing) return;

    state.elapsedSec += dtSec;
    const tSec = state.elapsedSec;
    const isWaitMode = state.mode === 'unfiltered';
    const forceSnap = !!state.snapNext;
    state.snapNext = false;

    state.agents.forEach((ag, idx) => {
      if (forceSnap) {
        ag._stepKey = null;
        ag._stepStartSec = null;
      }

      // Clinical & Retreat Staff: stationary at station or clean 2-station task step; 1.8s staggered pulses
      if (ag.id.startsWith('st-')) {
        if (ag.taskStations) {
          const stIdx = Math.floor(tSec / ag.dwell) % ag.taskStations.length;
          const st = ag.taskStations[stIdx];
          ag.pose = st.pose;
          PH.stepAgentPhysics(ag, st.gx, st.gy, dtSec, { baseSpeed: 6.2, urgent: !isWaitMode });
        }
        const dur = ag.dur || 2.2;
        const pulsePhase = (tSec + idx * 1.45) % 7.2;
        const alpha = ag.show ? PH.actionAlpha(pulsePhase, 1.8) : 0;
        ag.taskProg = (tSec % dur) / dur;
        ag.bubble = alpha > 0.02 ? (isWaitMode ? ag.taskCur : ag.taskFut) : null;
        ag.bubbleType = isWaitMode ? 'fail' : 'ok';
        ag.bubbleAlpha = alpha;
        ag.showBubble = alpha > 0.02;
        return;
      }

      ag.showBubble = false;
      ag.bubble = null;
      ag.bubbleAlpha = 0;
      ag.taskProg = null;
      let tx = ag.gx, ty = ag.gy, snap = false;
      const k = ag.idxInGroup;
      let stepKey = null, stepText = null, stepType = isWaitMode ? 'fail' : 'ok';

      if (ag.group === 'pool_yoga') {
        if (isWaitMode) {
          if (k < 2) {
            tx = 3.2 + k * 2.0; ty = 3.6 + k * 1.2; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            tx = 9.6 + (k - 2) * 1.1; ty = 7.4; ag.pose = 'FRUSTRATED_WAIT';
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
        // Duty Nurse Triage (6% fatigue) & Visiting MD Priority Escalation (<3m · 98.5% SLA vs 64% fatigue · 52% SLA)
        if (isWaitMode) {
          if (k === 0) {
            tx = CLINIC_BEDS[0][0]; ty = CLINIC_BEDS[0][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 18.2 + (k - 1) * 2.0;
            ty = 7.2;
            ag.pose = 'FRUSTRATED_WAIT';
          }
        } else {
          if (k < 3) {
            tx = CLINIC_BEDS[k][0]; ty = CLINIC_BEDS[k][1]; ag.pose = 'LYING_ON_BED';
            snap = Math.hypot(tx - ag.gx, ty - ag.gy) < 1.0;
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
          // Stage 1: Wearable Telemetry Trigger -> RBAC check
          tx = 7.4; ty = 6.2; ag.pose = isWaitMode ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            stepKey = (isWaitMode ? 'u-' : 't-') + 's0';
            stepText = isWaitMode ? 'Unfiltered IoT Alert' : 'Wearable Telemetry ✓';
            ag.taskProg = stageProg;
          }
        } else if (stage === 1) {
          // Stage 2: Duty Nurse Triage Filtering (6% fatigue) vs Unfiltered Broadcast (PHI Leak)
          tx = 19.6; ty = 3.4; ag.pose = isWaitMode ? 'FRUSTRATED_WAIT' : 'HANDOVER_INTERACTION';
          if (k === 0) {
            stepKey = (isWaitMode ? 'u-' : 't-') + 's1';
            stepText = isWaitMode ? 'PHI → Spa/Concierge' : 'Nurse Filter (6% Fatigue) ✓';
            ag.taskProg = stageProg;
          }
        } else if (stage === 2) {
          // Stage 3: Visiting MD Priority Escalation (<3m, 98.5% SLA vs 64% fatigue, 52% SLA)
          tx = 26.8; ty = 3.2; ag.pose = isWaitMode ? 'FRUSTRATED_WAIT' : 'SITTING';
          if (k === 0) {
            stepKey = (isWaitMode ? 'u-' : 't-') + 's2';
            stepText = isWaitMode ? '52% SLA Missed (64% Fatigue)' : 'Priority MD <3m (98.5% SLA) ✓';
            ag.taskProg = stageProg;
          }
        } else {
          // Stage 4: RBAC Masked Privacy State in Recovery Suite
          tx = 22.4 + (k % 3) * 4.5; ty = 13.4; ag.pose = 'SITTING';
          if (k === 0) {
            stepKey = (isWaitMode ? 'u-' : 't-') + 's3';
            stepText = isWaitMode ? '14 PDPA PHI Breaches' : '0 PHI (RBAC Masked) ✓';
            ag.taskProg = stageProg;
          }
        }
      }

      PH.stepAgentPhysics(ag, tx, ty, dtSec, { baseSpeed: 7.8, corridorY: 9.7, snap: snap || forceSnap, urgent: !isWaitMode });
      if (ag.group === 'pathway' && k === 0 && stepText) {
        const arrived = Math.hypot(tx - ag.gx, ty - ag.gy) < 0.95;
        setStepBubble(ag, stepKey, stepText, stepType, tSec, arrived);
      }
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
    state.snapNext = true;
    const isCur = mode === 'unfiltered';
    const bCur = document.getElementById('btn-mode-unfiltered');
    const bFut = document.getElementById('btn-mode-tiered');
    const strip = document.getElementById('state-time-strip');
    if (bCur) bCur.className = 'mode-btn ' + (isCur ? 'active-current' : '');
    if (bFut) bFut.className = 'mode-btn ' + (!isCur ? 'active-future' : '');
    if (strip) {
      strip.className = 'cmp-strip ' + (isCur ? 'cur-state' : 'fut-state');
      strip.textContent = isCur
        ? 'Current: 14 PDPA PHI Breaches · 64% Alert Fatigue · 52% Escalation SLA'
        : 'Target: 0 PHI Breaches (RBAC) · 6% Fatigue · 98.5% SLA (<3m Visiting MD)';
    }
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
