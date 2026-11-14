// ============================================================================
// BAHM330-A1: Two-Building Hospital-to-Retreat Step-Down Transfer Simulation
// Concierge picks up Patient from Left Building (Hospital), escorts Left-to-Right
// across the transfer walkway into Right Building (Retreat), and returns.
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
      short: "Concierge Transfer",
      name: "Concierge Pick-Up & Transfer (Left Building → Right Building)",
      current: { va: 30, nva: 30, rca: "Patients wait +30m at the Hospital exit for a single Concierge escort." },
      future:  { va: 35, nva: 0,  rca: "Dedicated Concierge team immediately escorts patients Left-to-Right into the Retreat (0m wait)." },
      wp: { gx: 12.5, gy: 9.8 },
      waitWp: { gx: 9.2, gy: 9.8 }
    },
    {
      id: 4,
      short: "Retreat Suite",
      name: "Retreat Reception & Suite Check-In",
      current: { va: 10, nva: 30, rca: "Unprepared suites and paper check-in cause a +30m lobby wait." },
      future:  { va: 10, nva: 0,  rca: "Instant check-in directly into pre-prepared Retreat Suites (0m wait)." },
      wp: { gx: 17.5, gy: 14.8 },
      waitWp: { gx: 16.5, gy: 12.5 }
    },
    {
      id: 5,
      short: "Doctor Check-Up",
      name: "Doctor Check-Up Room (Baseline Vitals & ECG)",
      current: { va: 15, nva: 30, rca: "Doctor is paged after arrival, causing a +30m wait for check-up." },
      future:  { va: 15, nva: 5,  rca: "On-site Doctor in the Check-Up Room completes baseline exam in 5m." },
      wp: { gx: 17.2, gy: 4.5 },
      waitWp: { gx: 17.2, gy: 6.8 }
    },
    {
      id: 6,
      short: "Pool & Dining",
      name: "Hydro Pool, Spa & Dining Onboarding",
      current: { va: 10, nva: 0,  rca: "Manual sign-off for Hydro Pool, Spa, and Dining Bistro." },
      future:  { va: 10, nva: 0,  rca: "Cleared for Hydro Pool, Spa, and Dining Bistro." },
      wp: { gx: 23.8, gy: 14.5 },
      waitWp: { gx: 23.8, gy: 16.5 }
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
    // Concierge #1 & #2 picking up patients from Left Building (x=9.5) to Right Building (x=15.8) and returning
    { id: 'st-5', roleLabel: 'Concierge', name: 'Concierge (Transfer Escort)', sub: 'Picks up Patient Left → Right & Returns', role: 'concierge', gx: 11.0, gy: 9.6, pose: 'WALKING', label: 'Picking Up Patient', stageIdx: 2 },
    { id: 'st-6', roleLabel: 'Concierge', name: 'Concierge (Transfer Escort)', sub: 'Picks up Patient Left → Right & Returns', role: 'concierge', gx: 14.0, gy: 10.5, pose: 'WALKING', label: 'Returning to Hospital', stageIdx: 2 },
    { id: 'st-7', roleLabel: 'Concierge', name: 'Concierge (Retreat Desk)', sub: 'Retreat Reception Concierge', role: 'concierge', gx: 16.8, gy: 12.2, pose: 'TYPING_TERMINAL', label: 'Suite Check-In', stageIdx: 3 },
    { id: 'st-8', roleLabel: 'Staff', name: 'Staff (Suite Care)', sub: 'Retreat Suite Attendant', role: 'cleaner', gx: 18.2, gy: 15.0, pose: 'MOPPING', label: 'Suite Prep', stageIdx: 3 },
    { id: 'st-9', roleLabel: 'Doctor', name: 'Doctor (Check-Up Room)', sub: 'Retreat Check-Up Doctor', role: 'doctor', gx: 16.8, gy: 2.8, pose: 'EXAMINING', label: 'Doctor Check-Up', stageIdx: 4 },
    { id: 'st-10', roleLabel: 'Nurse', name: 'Nurse (Check-Up Room)', sub: 'Retreat Check-Up Nurse', role: 'nurse', gx: 19.2, gy: 3.8, pose: 'TYPING_TERMINAL', label: 'Vitals Check', stageIdx: 4 },
    { id: 'st-11', roleLabel: 'Nurse', name: 'Nurse (Hydro Pool)', sub: 'Hydro Pool Nurse', role: 'nurse', gx: 22.8, gy: 5.0, pose: 'EXAMINING', label: 'Pool Supervision', stageIdx: 5 },
    { id: 'st-12', roleLabel: 'Staff', name: 'Staff (Dining Bistro)', sub: 'Retreat Dining Staff', role: 'concierge', gx: 24.2, gy: 17.0, pose: 'IDLE', label: 'Dining Service', stageIdx: 5 }
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
        elapsed: 0
      });
    });
  }

  function stepSimulation() {
    if (!simState.playing) return;
    const totals = getTotals(simState.mode);
    simState.masterClock = (simState.masterClock + 0.14 * simState.speed) % totals.total;
    simState.conciergeCycle = (simState.conciergeCycle + 0.0045 * simState.speed) % 1;

    // Concierge #1 (`st-5`) & Concierge #2 (`st-6`) loop:
    // 0.0 -> 0.5: Pick up Patient at Left Building (x = 9.2) and escort Left-to-Right to Right Building (x = 15.8)
    // 0.5 -> 1.0: Return Right-to-Left from Right Building (x = 15.8) back to Left Building (x = 9.2)
    const c1 = simState.agents.find(a => a.id === 'st-5');
    const c2 = simState.agents.find(a => a.id === 'st-6');
    const updateConcierge = (c, ph) => {
      if (!c) return;
      if (ph < 0.5) {
        const t = ph / 0.5;
        c.gx = 9.2 + t * 6.6;
        c.gy = 9.6;
        c.dir = 'SE';
        c.pose = 'WALKING';
        c.actionLabel = 'Escorting Patient Left → Right';
        c.bubble = 'Escorting Patient →';
      } else {
        const t = (ph - 0.5) / 0.5;
        c.gx = 15.8 - t * 6.6;
        c.gy = 10.5;
        c.dir = 'NW';
        c.pose = 'WALKING';
        c.actionLabel = 'Returning to Hospital ←';
        c.bubble = '← Returning';
      }
    };
    updateConcierge(c1, simState.conciergeCycle);
    updateConcierge(c2, (simState.conciergeCycle + 0.5) % 1);

    simState.agents.forEach((ag, idx) => {
      if (ag.role === 'resident') {
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
          // Stage 3: Concierge Pick-Up & Left-to-Right Transfer across Walkway
          if (loc.inWait) {
            // Waiting at Left Building Exit Door (x = 9.0) for Concierge
            ag.gx = 8.8 - (idx % 2) * 0.8;
            ag.gy = 9.6 + (idx % 2) * 0.7;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = 'Waiting for Concierge Pick-Up';
            ag.bubble = 'Waiting Pick-Up';
            ag.bubbleType = 'wait';
          } else {
            // Walking side-by-side with Concierge #1 from Left Building (x=9.2) to Right Building (x=15.8)
            const t = simState.conciergeCycle < 0.5 ? (simState.conciergeCycle / 0.5) : loc.vaProg;
            ag.gx = 9.2 + t * 6.6;
            ag.gy = 9.9;
            ag.dir = 'SE';
            ag.pose = 'WALKING';
            ag.actionLabel = 'Picked up by Concierge (Left → Right)';
            ag.bubble = 'Transfer →';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 3) {
          // Stage 4: Retreat Reception & Suite
          if (loc.inWait) {
            ag.gx = 16.5 + (idx % 2) * 0.8;
            ag.gy = 12.5;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = 'Waiting at Retreat Reception';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 16.7;
            ag.gy = idx % 2 === 0 ? 14.1 : 17.4;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = 'Resting in Retreat Suite';
            ag.bubble = 'Suite Ready';
            ag.bubbleType = 'ok';
          }
        } else if (loc.stageIdx === 4) {
          // Stage 5: Doctor Check-Up Room
          if (loc.inWait) {
            ag.gx = 17.5 + (idx % 2) * 0.8;
            ag.gy = 7.2;
            ag.pose = 'FRUSTRATED_WAIT';
            ag.actionLabel = 'Waiting for Doctor Check-Up';
            ag.bubble = `Wait +${loc.waitMins}m`;
            ag.bubbleType = 'wait';
          } else {
            ag.gx = 16.6;
            ag.gy = 4.8;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = 'Doctor Check-Up in Progress';
            ag.bubble = 'Doctor Check-Up';
            ag.bubbleType = 'ok';
          }
        } else {
          // Stage 6: Pool & Dining
          ag.gx = 22.8 + (idx % 2) * 2.2;
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
        ? 'AFTER: FAST CONCIERGE TRANSFER (110m · 90.9% EFFICIENCY)'
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
      <strong>Room:</strong> ${st.name}
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
