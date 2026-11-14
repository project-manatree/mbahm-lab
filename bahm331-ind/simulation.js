// ============================================================================
// BAHM331-IND: Expanded 8-Wing 24-Hour Geriatric Retreat Real-Time Simulation
// - Identical Building Structure in Both Modes
// - 36 Concurrent Patients + 12 Doctors, Nurses & Staff (48 Total)
// - Current Process (Waiting Queues):
//   * Patients wait in bottlenecks outside the Nurse Station (+14m), Doctor
//     Clinic (+18m), Thermal Spa & Physio Wing, and Dining Bistro
// - Optimized Process (Smooth Flow):
//   * Zero/minimal waiting — patients actively swim, practice yoga, receive
//     immediate Doctor/Nurse checks, relax on Spa tables, dine, and rest in Suites
// ============================================================================

const SimApp = (() => {
  let state = {
    mode: 'unfiltered',
    playing: true,
    speed: 1,
    showActionLabels: true,
    selectedAgentId: 'pat-1',
    tick: 0,
    agents: []
  };

  const STAFF_DEFS = [
    // Pool & Yoga Supervision
    { id: 'st-1', roleLabel: 'Nurse', role: 'nurse', gx: 8.0, gy: 4.2, pose: 'EXAMINING' },
    { id: 'st-2', roleLabel: 'Staff', role: 'therapist', gx: 15.2, gy: 3.8, pose: 'IDLE' },
    // 24/7 Central Nurse Station (x: 17..24.5, y: 1..8.5)
    { id: 'st-3', roleLabel: 'Nurse', role: 'nurse', gx: 18.8, gy: 2.3, pose: 'TYPING_TERMINAL' },
    { id: 'st-4', roleLabel: 'Nurse', role: 'nurse', gx: 18.6, gy: 5.0, pose: 'TYPING_TERMINAL' },
    { id: 'st-5', roleLabel: 'Nurse', role: 'nurse', gx: 21.4, gy: 5.0, pose: 'WALKING', patrol: [{ gx: 18.5, gy: 6.8 }, { gx: 23.5, gy: 6.8 }] },
    // Doctor & Acute Observation Clinic (x: 24.5..33, y: 1..8.5)
    { id: 'st-6', roleLabel: 'Doctor', role: 'doctor', gx: 26.0, gy: 2.2, pose: 'EXAMINING' },
    { id: 'st-7', roleLabel: 'Doctor', role: 'doctor', gx: 29.2, gy: 2.2, pose: 'EXAMINING' },
    { id: 'st-8', roleLabel: 'Nurse', role: 'nurse', gx: 27.6, gy: 6.2, pose: 'WALKING', patrol: [{ gx: 25.5, gy: 6.2 }, { gx: 31.5, gy: 6.2 }] },
    // Thermal Spa & Physio Wing (x: 1..10, y: 11..19)
    { id: 'st-9', roleLabel: 'Nurse', role: 'therapist', gx: 3.2, gy: 13.4, pose: 'EXAMINING' },
    { id: 'st-10', roleLabel: 'Staff', role: 'therapist', gx: 6.2, gy: 13.4, pose: 'EXAMINING' },
    // Dining Bistro & Suites
    { id: 'st-11', roleLabel: 'Staff', role: 'chef', gx: 12.2, gy: 17.6, pose: 'TYPING_TERMINAL' },
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
        patrol: sd.patrol || null,
        patrolIdx: 0,
        bubble: null,
        bubbleType: 'ok',
        showBubble: false
      });
    });

    // 36 Patients across 6 zones (6 per zone: Pool/Yoga, Nurse/Doctor Clinic, Spa/Physio, Bistro, Suites, Promenade)
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
        showBubble: false
      });
    }
  }

  function stepSimulation() {
    if (!state.playing) return;
    const isWaitMode = state.mode === 'unfiltered';
    state.tick += 0.005 * state.speed * (isWaitMode ? 1.0 : 1.65);

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

    state.agents.forEach(ag => {
      if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        const dx = target.gx - ag.gx;
        const dy = target.gy - ag.gy;
        const d = Math.hypot(dx, dy);
        if (d < 0.08) ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        else { ag.gx += (dx / d) * 0.045; ag.gy += (dy / d) * 0.045; ag.dir = dx > 0 ? 'SE' : 'NW'; }
        return;
      }

      if (!ag.id.startsWith('pat-')) return;

      ag.showBubble = false;
      ag.bubble = null;
      let tx = ag.gx, ty = ag.gy, snap = false;
      const k = ag.idxInGroup;
      const ph = (state.tick + ag.phase) % 1;

      if (ag.group === 'pool_yoga') {
        if (isWaitMode) {
          // 2 in pool, 4 waiting at poolside / yoga studio door for nurse clearance
          if (k < 2) {
            tx = 3.2 + k * 2.0; ty = 3.6 + k * 1.2; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            tx = 9.6 + (k - 2) * 1.1; ty = 7.4; ag.pose = 'FRUSTRATED_WAIT';
            if (k === 2) { ag.bubble = 'Waiting Clearance (+14m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
          }
        } else {
          // 3 swimming in Hydro Pool + 3 actively doing Yoga
          if (k < 3) {
            tx = 3.0 + k * 1.6; ty = 3.2 + (k % 2) * 1.8; ag.pose = 'SWIMMING_POOL'; snap = true;
          } else {
            const ys = yogaSpots[k - 3];
            tx = ys[0]; ty = ys[1]; ag.pose = 'YOGA_STRETCH';
          }
        }
      } else if (ag.group === 'clinic') {
        // Nurse Station & Doctor Clinic (x: 17..33, y: 1..8.5)
        if (isWaitMode) {
          // 1 on bed, 5 crowded waiting in line across Nurse Station & Doctor Clinic
          if (k === 0) {
            tx = clinicBeds[0][0]; ty = clinicBeds[0][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 18.2 + (k - 1) * 2.2;
            ty = 7.2;
            ag.pose = 'FRUSTRATED_WAIT';
            if (k === 1 || k === 3) { ag.bubble = 'Waiting Doctor (+18m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
          }
        } else {
          // All 3 clinic beds active + 3 consulting smoothly with zero wait
          if (k < 3) {
            tx = clinicBeds[k][0]; ty = clinicBeds[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
            if (k === 0) { ag.bubble = 'No Waiting (<2m) ✓'; ag.bubbleType = 'ok'; ag.showBubble = true; }
          } else {
            tx = 19.0 + (k - 3) * 3.8;
            ty = 6.2;
            ag.pose = 'SITTING';
          }
        }
      } else if (ag.group === 'spa') {
        // Thermal Spa & Physio Wing (x: 1..10, y: 11..19)
        if (isWaitMode) {
          if (k < 2) {
            tx = spaSpots[k][0]; ty = spaSpots[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
          } else {
            tx = 2.2 + (k - 2) * 1.6; ty = 17.8; ag.pose = 'FRUSTRATED_WAIT';
            if (k === 2) { ag.bubble = 'Waiting Physio (+22m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
          }
        } else {
          tx = spaSpots[k][0]; ty = spaSpots[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
        }
      } else if (ag.group === 'bistro') {
        // Nutritional Dining Bistro (x: 10..19.5, y: 11..19)
        if (isWaitMode && k >= 3) {
          tx = 14.2 + (k - 3) * 1.2; ty = 17.6; ag.pose = 'FRUSTRATED_WAIT';
          if (k === 3) { ag.bubble = 'Waiting Table (+15m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
        } else {
          tx = bistroSpots[k][0]; ty = bistroSpots[k][1]; ag.pose = 'SITTING';
        }
      } else if (ag.group === 'suites') {
        // 6 Private Residential King Suites 301-306 (x: 19.5..33, y: 11..19)
        tx = suiteSpots[k][0]; ty = suiteSpots[k][1]; ag.pose = 'LYING_ON_BED'; snap = true;
      } else {
        // Promenade circulation (y: 8.5..11)
        if (isWaitMode) {
          // Standing waiting in the central promenade outside Nurse Station & Clinic doors
          tx = 17.5 + k * 2.2;
          ty = 9.6;
          ag.pose = 'FRUSTRATED_WAIT';
          if (k === 0) { ag.bubble = 'Waiting Triage (+16m)'; ag.bubbleType = 'fail'; ag.showBubble = true; }
        } else {
          // Smoothly strolling along the Central Marble Promenade & Main Entrance
          tx = 3.0 + ((ph + k * 0.16) % 1) * 28.0;
          ty = k % 2 === 0 ? 9.3 : 10.2;
          ag.dir = k % 2 === 0 ? 'SE' : 'NW';
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

  function loop() {
    stepSimulation();
    IsoRenderer.render(state);
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
