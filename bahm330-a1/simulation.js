// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Simulation
// Building 1 (Left, x: 1..10): Partner Hospital
// Distance Road Gap (x: 10..20): Concierge Transport picks up Patient from Left
// Building, drives Left -> Right to Right Building, drops off, and returns Right -> Left.
// Building 2 (Right, x: 20..32): Retreat Centre
// ============================================================================

const SimApp = (() => {
  const STAGES = [
    {
      id: 1,
      short: "Hospital Ward",
      name: "Hospital Ward Discharge Check",
      current: { va: 15, nva: 45, rca: "Paper discharge charts cause a +45m wait in the Hospital Ward." },
      future:  { va: 15, nva: 5,  rca: "Digital discharge summary sent ahead to the Retreat (5m wait)." },
      wp: { gx: 3.5, gy: 3.5 },
      waitWp: { gx: 4.5, gy: 7.5 }
    },
    {
      id: 2,
      short: "Billing & Discharge",
      name: "Hospital Billing & Insurance Clearance",
      current: { va: 15, nva: 45, rca: "Manual paper billing causes a +45m wait at the Billing counter." },
      future:  { va: 15, nva: 0,  rca: "Fast-Track Discharge Lounge clears billing automatically (0m wait)." },
      wp: { gx: 3.5, gy: 13.5 },
      waitWp: { gx: 7.2, gy: 13.8 }
    },
    {
      id: 3,
      short: "Concierge Transport",
      name: "Concierge Transport (Pick-Up Left Building → Drop-Off Right Building)",
      current: { va: 30, nva: 30, rca: "Patients wait +30m at the Hospital exit for the single returning Concierge Transport." },
      future:  { va: 35, nva: 0,  rca: "Dedicated Concierge Transport fleet immediately picks up patients Left-to-Right (0m wait)." },
      wp: { gx: 15.0, gy: 9.6 },
      waitWp: { gx: 9.2, gy: 9.6 }
    },
    {
      id: 4,
      short: "Retreat Suite",
      name: "Retreat Reception & Suite Check-In",
      current: { va: 10, nva: 30, rca: "Unprepared suites and paper check-in cause a +30m lobby wait." },
      future:  { va: 10, nva: 0,  rca: "Instant check-in directly into pre-prepared Retreat Suites (0m wait)." },
      wp: { gx: 22.5, gy: 14.8 },
      waitWp: { gx: 21.5, gy: 12.5 }
    },
    {
      id: 5,
      short: "Doctor Check-Up",
      name: "Doctor Check-Up Room (Baseline Vitals & ECG)",
      current: { va: 15, nva: 30, rca: "Doctor is paged after arrival, causing a +30m wait for check-up." },
      future:  { va: 15, nva: 5,  rca: "On-site Doctor in the Check-Up Room completes baseline exam in 5m." },
      wp: { gx: 22.2, gy: 4.5 },
      waitWp: { gx: 22.2, gy: 6.8 }
    },
    {
      id: 6,
      short: "Pool & Dining",
      name: "Hydro Pool, Spa & Dining Onboarding",
      current: { va: 10, nva: 0,  rca: "Manual sign-off for Hydro Pool, Spa, and Dining Bistro." },
      future:  { va: 10, nva: 0,  rca: "Cleared for Hydro Pool, Spa, and Dining Bistro." },
      wp: { gx: 28.8, gy: 14.5 },
      waitWp: { gx: 28.8, gy: 16.5 }
    }
  ];

  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    inspectorTab: 0,
    selectedAgentId: 'res-1',
    masterClock: 0,
    conciergeCycle: 0,
    transports: [
      { id: 'tr-1', gx: 10.4, gy: 8.4, dirX: 1, openDoor: true, active: true, label: 'Concierge Transport' },
      { id: 'tr-2', gx: 17.4, gy: 10.4, dirX: -1, openDoor: false, active: false, label: 'Concierge Transport #2' }
    ],
    agents: []
  };

  const RESIDENT_PROFILES = [
    { id: 'res-1', roleLabel: 'Patient', name: 'Patient #1', sub: 'Step-Down Transfer Patient', hr: '76 bpm', bp: '124/78 · 98%', offset: 0 },
    { id: 'res-2', roleLabel: 'Patient', name: 'Patient #2', sub: 'Cardiac Rehab Patient', hr: '72 bpm', bp: '118/74 · 99%', offset: 40 },
    { id: 'res-3', roleLabel: 'Patient', name: 'Patient #3', sub: 'Neuro Recovery Patient', hr: '80 bpm', bp: '130/82 · 97%', offset: 80 },
    { id: 'res-4', roleLabel: 'Patient', name: 'Patient #4', sub: 'Respiratory Step-Down Patient', hr: '78 bpm', bp: '126/76 · 98%', offset: 120 },
    { id: 'res-5', roleLabel: 'Patient', name: 'Patient #5', sub: 'Spinal Recovery Patient', hr: '74 bpm', bp: '122/75 · 99%', offset: 160 },
    { id: 'res-6', roleLabel: 'Patient', name: 'Patient #6', sub: 'Mobility Conditioning Patient', hr: '77 bpm', bp: '120/74 · 98%', offset: 200 }
  ];

  const STAFF_DEFS = [
    { id: 'st-1', roleLabel: 'Doctor', name: 'Doctor (Hospital Ward)', sub: 'Hospital Ward Doctor', role: 'doctor', gx: 2.5, gy: 2.8, pose: 'EXAMINING', label: 'Ward Check', stageIdx: 0 },
    { id: 'st-2', roleLabel: 'Nurse', name: 'Nurse (Hospital Ward)', sub: 'Hospital Ward Nurse', role: 'nurse', gx: 7.4, gy: 2.8, pose: 'TYPING_TERMINAL', label: 'Discharge Prep', stageIdx: 0 },
    { id: 'st-3', roleLabel: 'Nurse', name: 'Nurse (Ward Round)', sub: 'Hospital Ward Nurse', role: 'nurse', gx: 5.2, gy: 5.5, pose: 'WALKING', label: 'Ward Care', stageIdx: 0, patrol: [{ gx: 5.2, gy: 2.8 }, { gx: 5.2, gy: 6.5 }] },
    { id: 'st-4', roleLabel: 'Staff', name: 'Staff (Billing)', sub: 'Billing & Discharge Staff', role: 'reception', gx: 2.6, gy: 12.6, pose: 'TYPING_TERMINAL', label: 'Billing Clearance', stageIdx: 1 },
    // Concierge Driver/Escort at the Pick-Up / Drop-Off Bays
    { id: 'st-5', roleLabel: 'Concierge', name: 'Concierge (Transport Driver)', sub: 'Drives Concierge Transport Left ↔ Right', role: 'concierge', gx: 10.2, gy: 9.2, pose: 'IDLE', label: 'Boarding Patient', stageIdx: 2 },
    { id: 'st-7', roleLabel: 'Concierge', name: 'Concierge (Retreat Desk)', sub: 'Retreat Reception Concierge', role: 'concierge', gx: 21.8, gy: 12.2, pose: 'TYPING_TERMINAL', label: 'Suite Check-In', stageIdx: 3 },
    { id: 'st-8', roleLabel: 'Staff', name: 'Staff (Suite Care)', sub: 'Retreat Suite Attendant', role: 'cleaner', gx: 23.2, gy: 15.0, pose: 'MOPPING', label: 'Suite Prep', stageIdx: 3 },
    { id: 'st-9', roleLabel: 'Doctor', name: 'Doctor (Check-Up Room)', sub: 'Retreat Check-Up Doctor', role: 'doctor', gx: 21.8, gy: 2.8, pose: 'EXAMINING', label: 'Doctor Check-Up', stageIdx: 4 },
    { id: 'st-10', roleLabel: 'Nurse', name: 'Nurse (Check-Up Room)', sub: 'Retreat Check-Up Nurse', role: 'nurse', gx: 24.2, gy: 3.8, pose: 'TYPING_TERMINAL', label: 'Vitals Check', stageIdx: 4 },
    { id: 'st-11', roleLabel: 'Nurse', name: 'Nurse (Hydro Pool)', sub: 'Hydro Pool Nurse', role: 'nurse', gx: 27.8, gy: 5.0, pose: 'EXAMINING', label: 'Pool Supervision', stageIdx: 5 },
    { id: 'st-12', roleLabel: 'Staff', name: 'Staff (Dining Bistro)', sub: 'Retreat Dining Staff', role: 'concierge', gx: 29.2, gy: 17.0, pose: 'IDLE', label: 'Dining Service', stageIdx: 5 }
  ];

  function getTotals(mode) {
    let va = 0, nva = 0;
    STAGES.forEach(s => { va += s[mode].va; nva += s[mode].nva; });
    const total = va + nva;
    return { va, nva, total, pce: ((va / total) * 100).toFixed(1) };
  }

  function locateStage(elapsed, mode) {
    let cum = 0, accVA = 0, accNVA = 0;
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i][mode];
      const stTot = s.va + s.nva;
      if (elapsed <= cum + stTot || i === STAGES.length - 1) {
        const into = Math.max(0, Math.min(stTot, elapsed - cum));
        const inWait = into > s.va && s.nva > 0;
        accVA += Math.min(s.va, into);
        accNVA += Math.max(0, into - s.va);
        return {
          stageIdx: i,
          inWait,
          into,
          stTot,
          vaProg: s.va > 0 ? Math.min(1, into / s.va) : 1,
          waitMins: Math.max(0, Math.round(into - s.va)),
          accVA: Math.round(accVA),
          accNVA: Math.round(accNVA)
        };
      }
      cum += stTot;
      accVA += s.va;
      accNVA += s.nva;
    }
    return { stageIdx: 5, inWait: false, into: 10, stTot: 10, vaProg: 1, waitMins: 0, accVA: Math.round(accVA), accNVA: Math.round(accNVA) };
  }

  function buildAgents() {
    simState.agents = [];
    RESIDENT_PROFILES.forEach((rp, idx) => {
      simState.agents.push({
        id: rp.id,
        idNum: idx + 1,
        roleLabel: rp.roleLabel,
        name: rp.name,
        sub: rp.sub,
        hr: rp.hr,
        bp: rp.bp,
        role: 'resident',
        offset: rp.offset,
        gx: 3.5,
        gy: 3.5,
        dir: 'SE',
        pose: 'LYING_ON_BED',
        actionLabel: 'Hospital Ward',
        bubble: null,
        bubbleType: 'ok',
        stageIdx: 0,
        inWait: false,
        inVehicle: false,
        elapsed: 0
      });
    });

    STAFF_DEFS.forEach((sd, idx) => {
      simState.agents.push({
        id: sd.id,
        idNum: 20 + idx,
        roleLabel: sd.roleLabel,
        name: sd.name,
        sub: sd.sub,
        hr: '72 bpm',
        bp: 'On Duty',
        role: sd.role,
        gx: sd.gx,
        gy: sd.gy,
        patrol: sd.patrol || null,
        patrolIdx: 0,
        dir: 'SE',
        pose: sd.pose,
        actionLabel: sd.label,
        bubble: null,
        bubbleType: 'ok',
        stageIdx: sd.stageIdx,
        inWait: false,
        inVehicle: false,
        elapsed: 0
      });
    });
  }

  // Updates a single Concierge Transport vehicle along the 10-tile road (x: 10.4 <-> 17.4)
  function updateTransport(tr, ph) {
    if (ph < 0.16) {
      // Phase 1: Stopped at Left Building (Hospital Pick-Up Bay) boarding Patient
      tr.gx = 10.4;
      tr.gy = 8.35;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Picking Up →';
    } else if (ph < 0.50) {
      // Phase 2: Driving Left -> Right from Hospital (x=10.4) to Retreat (x=17.4)
      const t = (ph - 0.16) / 0.34;
      tr.gx = 10.4 + t * 7.0;
      tr.gy = 8.35;
      tr.dirX = 1;
      tr.openDoor = false;
      tr.label = 'Concierge Transport →';
    } else if (ph < 0.66) {
      // Phase 3: Stopped at Right Building (Retreat Drop-Off Bay) dropping off Patient
      tr.gx = 17.4;
      tr.gy = 8.35;
      tr.dirX = 1;
      tr.openDoor = true;
      tr.label = 'Concierge: Dropping Off';
    } else {
      // Phase 4: Returning Right -> Left from Retreat (x=17.4) back to Hospital (x=10.4)
      const t = (ph - 0.66) / 0.34;
      tr.gx = 17.4 - t * 7.0;
      tr.gy = 10.45;
      tr.dirX = -1;
      tr.openDoor = false;
      tr.label = '← Concierge Returning';
    }
  }

  function stepSimulation() {
    if (!simState.playing) return;
    const totals = getTotals(simState.mode);
    simState.masterClock = (simState.masterClock + 0.14 * simState.speed) % totals.total;
    simState.conciergeCycle = (simState.conciergeCycle + 0.0042 * simState.speed) % 1;

    const ph1 = simState.conciergeCycle;
    const ph2 = (simState.conciergeCycle + 0.5) % 1;

    simState.transports[0].active = true;
    updateTransport(simState.transports[0], ph1);

    simState.transports[1].active = simState.mode === 'future';
    if (simState.transports[1].active) {
      updateTransport(simState.transports[1], ph2);
    }

    // Concierge driver/escort (`st-5`) steps out at Pick-Up (Left) and Drop-Off (Right), and rides inside while driving
    const driver = simState.agents.find(a => a.id === 'st-5');
    if (driver) {
      if (ph1 < 0.16) {
        driver.inVehicle = false;
        driver.gx = 10.0;
        driver.gy = 9.4;
        driver.pose = 'HANDOVER_INTERACTION';
        driver.actionLabel = 'Picking Up Patient at Hospital';
      } else if (ph1 >= 0.50 && ph1 < 0.66) {
        driver.inVehicle = false;
        driver.gx = 19.7;
        driver.gy = 9.4;
        driver.pose = 'HANDOVER_INTERACTION';
        driver.actionLabel = 'Dropping Off Patient at Retreat';
      } else {
        driver.inVehicle = true;
        driver.gx = simState.transports[0].gx + 1.1;
        driver.gy = simState.transports[0].gy + 0.5;
        driver.actionLabel = ph1 < 0.50 ? 'Driving Patient Left → Right' : 'Returning Right → Left to Hospital';
      }
    }

    simState.agents.forEach((ag, idx) => {
      if (ag.role === 'resident') {
        ag.inVehicle = false;
        const el = (simState.masterClock + ag.offset) % totals.total;
        ag.elapsed = el;
        const loc = locateStage(el, simState.mode);
        ag.stageIdx = loc.stageIdx;
        ag.inWait = loc.inWait;

        const st = STAGES[loc.stageIdx];
        if (loc.stageIdx === 0) {
          // Stage 1: Hospital Ward
          const beds = [
            { gx: 2.3, gy: 2.0 },
            { gx: 2.3, gy: 4.2 },
            { gx: 2.3, gy: 6.4 },
            { gx: 5.8, gy: 2.0 }
          ];
          const b = beds[idx % beds.length];
          if (loc.inWait) {
            ag.gx = 4.6 + (idx % 3) * 0.8;
            ag.gy = 7.7;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = `Waiting in Ward (+${loc.waitMins}m)`;
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = b.gx;
            ag.gy = b.gy;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = 'In Hospital Ward Bed';
            ag.bubble = 'Ward Check';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 1) {
          // Stage 2: Billing & Discharge
          if (loc.inWait) {
            ag.gx = 2.0 + (idx % 4) * 0.65;
            ag.gy = 17.6;
            ag.pose = 'SITTING_WAIT';
            ag.actionLabel = `Billing Wait (+${loc.waitMins}m)`;
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 7.2;
            ag.gy = 12.8 + (idx % 2) * 2.6;
            ag.pose = 'SITTING';
            ag.actionLabel = 'Fast-Track Discharge';
            ag.bubble = 'Cleared';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 2) {
          // Stage 3: Concierge Transport (Pick-Up at Left Building -> Drive -> Drop-Off at Right Building)
          if (loc.inWait) {
            // Waiting at Left Building Pick-Up Exit (x = 9.0) for the returning Concierge Transport
            ag.gx = 8.9 - (idx % 2) * 0.7;
            ag.gy = 9.4 + (idx % 2) * 0.7;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = 'Waiting for Concierge Transport';
            ag.bubble = 'Wait Pick-Up';
            ag.bubbleType = 'wait';
          } else {
            // Boarding at Hospital (x=9.8), riding inside Concierge Transport (x: 10.4->17.4), or stepping off at Retreat (x=19.6)
            const tr = simState.transports[0];
            if (ph1 < 0.16) {
              ag.inVehicle = false;
              ag.gx = 9.6;
              ag.gy = 8.9;
              ag.dir = 'SE';
              ag.pose = 'WALKING';
              ag.actionLabel = 'Boarding Concierge Transport (Left)';
              ag.bubble = 'Boarding →';
              ag.bubbleType = 'ok';
            } else if (ph1 >= 0.50 && ph1 < 0.66) {
              ag.inVehicle = false;
              ag.gx = 19.9;
              ag.gy = 9.4;
              ag.dir = 'SE';
              ag.pose = 'WALKING';
              ag.actionLabel = 'Arriving at Retreat (Right)';
              ag.bubble = 'Arrived';
              ag.bubbleType = 'ok';
            } else {
              // Inside moving Concierge Transport
              ag.inVehicle = true;
              ag.gx = tr.gx + 1.1;
              ag.gy = tr.gy + 0.5;
              ag.pose = 'SITTING';
              ag.actionLabel = 'In Concierge Transport (Left → Right)';
              ag.bubble = 'In Transit →';
              ag.bubbleType = 'ok';
            }
          }
        } else if (loc.stageIdx === 3) {
          // Stage 4: Retreat Reception & Suite (Right Building x: 20..26.5)
          if (loc.inWait) {
            ag.gx = 21.5 + (idx % 2) * 0.8;
            ag.gy = 12.5;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = 'Waiting at Retreat Reception';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 21.7;
            ag.gy = idx % 2 === 0 ? 14.1 : 17.4;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = 'Resting in Retreat Suite';
            ag.bubble = 'Suite Ready';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 4) {
          // Stage 5: Doctor Check-Up Room (Right Building x: 20..26.5)
          if (loc.inWait) {
            ag.gx = 22.5 + (idx % 2) * 0.8;
            ag.gy = 7.2;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = 'Waiting for Doctor Check-Up';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 21.6;
            ag.gy = 4.8;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = 'Doctor Check-Up in Progress';
            ag.bubble = 'Doctor Check-Up';
            ag.bubbleType = 'ok';
          }
        } else {
          // Stage 6: Pool & Dining (Right Building x: 26.5..32)
          ag.gx = 27.8 + (idx % 2) * 2.2;
          ag.gy = 15.6;
          ag.pose = 'SITTING';
          ag.actionLabel = `At ${st.short}`;
          ag.bubble = 'Pool & Dining';
          ag.bubbleType = 'ok';
        }
      } else if (ag.id === 'st-8') {
        ag.pose = simState.mode === 'current' ? 'MOPPING' : 'IDLE';
        ag.actionLabel = simState.mode === 'current' ? 'Cleaning Suite (+30m Delay)' : 'Suite Ready';
      } else if (ag.patrol) {
        const target = ag.patrol[ag.patrolIdx];
        const dx = target.gx - ag.gx;
        const dy = target.gy - ag.gy;
        const d = Math.hypot(dx, dy);
        const step = 0.045 * simState.speed;
        if (d <= step) {
          ag.patrolIdx = (ag.patrolIdx + 1) % ag.patrol.length;
        } else {
          ag.gx += (dx / d) * step;
          ag.gy += (dy / d) * step;
          ag.dir = dy > 0 ? 'SW' : 'NE';
        }
      }
    });
  }

  function updateHUD() {
    const totals = getTotals(simState.mode);
    const isFut = simState.mode === 'future';

    document.getElementById('kpi-va').textContent = `${totals.va} mins`;
    const nvaEl = document.getElementById('kpi-nva');
    nvaEl.textContent = `${totals.nva} mins`;
    nvaEl.style.color = isFut ? 'var(--optimal)' : 'var(--bottleneck)';
    document.getElementById('kpi-total').textContent = `${totals.total} mins`;
    document.getElementById('kpi-total-sub').textContent =
      `Clock: T+${String(Math.floor(simState.masterClock)).padStart(3, '0')}m · ${isFut ? '-60% Faster' : 'Baseline'}`;

    const pceEl = document.getElementById('kpi-pce');
    pceEl.textContent = `${totals.pce}%`;
    pceEl.style.color = isFut ? 'var(--optimal)' : 'var(--bottleneck)';

    const strip = document.getElementById('impact-strip');
    const stateTag = document.getElementById('facility-state-tag');
    if (strip) strip.classList.toggle('future-active', isFut);
    if (stateTag) {
      stateTag.textContent = isFut
        ? 'AFTER: FAST CONCIERGE TRANSPORT (110m · 90.9% EFFICIENCY)'
        : 'BEFORE: SLOW MANUAL TRANSFER (275m · 34.5% EFFICIENCY)';
      stateTag.classList.toggle('upgraded', isFut);
    }

    const sel = simState.agents.find(a => a.id === simState.selectedAgentId) || simState.agents[0];
    if (!sel) return;

    const loc = locateStage(sel.elapsed || simState.masterClock, simState.mode);
    const st = STAGES[loc.stageIdx];
    const pct = Math.min(100, Math.round(((sel.elapsed || simState.masterClock) / totals.total) * 100));

    document.getElementById('insp-name').textContent = sel.name;
    document.getElementById('insp-role').textContent = sel.sub;
    document.getElementById('insp-badge').textContent = st.short.toUpperCase();
    document.getElementById('insp-badge').style.color = loc.inWait ? '#fca5a5' : 'var(--primary)';

    document.getElementById('insp-hr').textContent = sel.hr;
    document.getElementById('insp-bp').textContent = sel.bp;
    document.getElementById('insp-pose').textContent = sel.roleLabel;
    document.getElementById('insp-stage-txt').textContent = st.short;
    document.getElementById('insp-pct').textContent = `${pct}%`;
    document.getElementById('insp-progress').style.width = `${pct}%`;

    document.getElementById('insp-micro-summary').innerHTML = `
      <strong>Action:</strong> ${sel.actionLabel}<br/>
      <strong>Stage:</strong> ${st.name}
    `;

    let cum = 0;
    document.getElementById('insp-log-list').innerHTML = STAGES.map((s, idx) => {
      const d = s[simState.mode];
      const tStr = `T+${String(cum).padStart(3, '0')}m`;
      cum += d.va + d.nva;
      if (idx < loc.stageIdx) {
        return `<div class="log-row done"><span>[${tStr}]</span><span>✓ ${s.short}: ${d.va}m Active / ${d.nva}m Wait</span></div>`;
      } else if (idx === loc.stageIdx) {
        const cls = loc.inWait ? 'wait' : 'active';
        return `<div class="log-row ${cls}"><span>[${tStr}]</span><span>▶ ${sel.actionLabel}</span></div>`;
      }
      return `<div class="log-row" style="color:var(--muted)"><span>[${tStr}]</span><span>○ ${s.short}</span></div>`;
    }).join('');

    document.getElementById('insp-rca-body').innerHTML = `
      <div style="margin-bottom:6px;color:var(--primary);font-weight:700;">${st.name}</div>
      <div style="margin-bottom:6px;"><strong>Before (${st.current.nva}m wait):</strong> ${st.current.rca}</div>
      <div style="color:#6ee7b7;"><strong>After (${st.future.nva}m wait):</strong> ${st.future.rca}</div>
    `;

    document.getElementById('bottom-ticker').textContent =
      `[${st.short}] ${sel.actionLabel} — ${st[simState.mode].rca}`;
  }

  function handleWorldClick(mx, my) {
    for (const ag of simState.agents) {
      const p = IsoRenderer.toIso(ag.gx, ag.gy, 14);
      if (Math.hypot(mx - p.x, my - p.y) < 22) {
        simState.selectedAgentId = ag.id;
        updateHUD();
        return;
      }
    }
  }

  function setMode(mode) {
    simState.mode = mode;
    document.getElementById('btn-mode-current').className = 'mode-btn ' + (mode === 'current' ? 'active-current' : '');
    document.getElementById('btn-mode-future').className = 'mode-btn ' + (mode === 'future' ? 'active-future' : '');
    IsoRenderer.triggerUpgradePulse(mode);
    updateHUD();
  }

  function toggleActionLabels() {
    simState.showActionLabels = !simState.showActionLabels;
    document.getElementById('btn-labels').classList.toggle('active', simState.showActionLabels);
  }

  function togglePlay() {
    simState.playing = !simState.playing;
    const btn = document.getElementById('btn-play');
    btn.textContent = simState.playing ? '⏸ Pause' : '▶ Play';
    btn.classList.toggle('active', simState.playing);
  }

  function toggleSpeed() {
    simState.speed = simState.speed === 1 ? 2 : 1;
    const btn = document.getElementById('btn-speed');
    btn.textContent = `${simState.speed}x`;
    btn.classList.toggle('active', simState.speed === 2);
  }

  function resetSim() {
    simState.masterClock = 0;
    buildAgents();
    IsoRenderer.resetCam();
    updateHUD();
  }

  function setInspectorTab(idx, btn) {
    simState.inspectorTab = idx;
    document.querySelectorAll('.insp-tab').forEach((b, i) => b.classList.toggle('active', i === idx));
    for (let i = 0; i < 3; i++) {
      document.getElementById(`insp-pane-${i}`).classList.toggle('active', i === idx);
    }
  }

  function focusZone(zoneIdx, btn) {
    document.querySelectorAll('#dept-tabs .dept-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (zoneIdx === -1) {
      IsoRenderer.resetCam();
      return;
    }
    const z = STAGES[zoneIdx].wp;
    IsoRenderer.panToGrid(z.gx, z.gy, 1.25);
  }

  function exportCSV() {
    const rows = [
      ['Stage_ID', 'Room_Name', 'Current_Active_Mins', 'Current_Wait_Mins', 'Current_Total_Mins', 'Future_Active_Mins', 'Future_Wait_Mins', 'Future_Total_Mins', 'Wait_Reduction_Mins', 'Data_Notice']
    ];
    STAGES.forEach(s => {
      rows.push([
        `Stage ${s.id}`,
        s.name,
        s.current.va,
        s.current.nva,
        s.current.va + s.current.nva,
        s.future.va,
        s.future.nva,
        s.future.va + s.future.nva,
        s.current.nva - s.future.nva,
        'SIMULATED ILLUSTRATIVE MODEL DATA — FOR ACADEMIC PROCESS ANALYSIS ONLY'
      ]);
    });
    const cur = getTotals('current');
    const fut = getTotals('future');
    rows.push([
      'TOTAL',
      'Overall Pathway Summary & PCE (%)',
      cur.va,
      cur.nva,
      `${cur.total} (PCE ${cur.pce}%)`,
      fut.va,
      fut.nva,
      `${fut.total} (PCE ${fut.pce}% — 60% Faster)`,
      cur.nva - fut.nva,
      'SIMULATED ILLUSTRATIVE MODEL DATA — FOR ACADEMIC PROCESS ANALYSIS ONLY'
    ]);
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bahm330-a1-stepdown-transfer-kpis.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  let tick = 0;
  function loop() {
    tick++;
    stepSimulation();
    if (tick % 12 === 0) updateHUD();
    IsoRenderer.render(simState);
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    buildAgents();
    IsoRenderer.init('iso-canvas', handleWorldClick);
    updateHUD();
    requestAnimationFrame(loop);
  });

  return {
    setMode,
    toggleActionLabels,
    togglePlay,
    toggleSpeed,
    resetSim,
    setInspectorTab,
    focusZone,
    exportCSV
  };
})();
