// ============================================================================
// BAHM330-A2: MSH 28-Agent A* Pathfinding & C1/C2/C3/C5 Operations Simulation
// ============================================================================

const SimApp = (() => {
  const COMPLAINTS = {
    C1: {
      code: "C1",
      dept: "2. Specialist Outpatient Clinic (C1)",
      title: "Outpatient Queue Delay & Unbuffered Consultation Variance",
      curWait: "65m Wait", futWait: "14m Wait",
      curPct: 32, futPct: 92,
      curLogs: [
        { t: "09:40", txt: "Patient arrived 20m early for 10:00 slot at Reception", cls: "done" },
        { t: "09:45", txt: "Seated in Waiting Hall Row 1 (12+ chairs overflowing)", cls: "done" },
        { t: "10:15", txt: "Specialist consult overruns (+18m unbuffered variance)", cls: "wait" },
        { t: "10:45", txt: "Checking wristwatch & foot-tapping: Waiting 65m — ETA: Unknown", cls: "wait" }
      ],
      futLogs: [
        { t: "09:40", txt: "Digital self-check-in at Reception; wave buffer assigned", cls: "done" },
        { t: "09:44", txt: "Wall Queue Screen displays Live ETA: 10:04 (14m wait)", cls: "done" },
        { t: "10:04", txt: "Called into Specialist Consultation Office #2 on time", cls: "active" },
        { t: "10:18", txt: "Consultation & CPOE e-orders completed smoothly ✓", cls: "done" }
      ],
      rca: "Current State overbooks fixed 10-minute slots without micro-buffers; early arrivals (09:40 for 10:00) compound with consultation duration variance into a 65-minute backlog while front-desk screens show 'ETA: Unknown'. Future State implements wave-scheduling micro-buffers and live token ETA boards (14m mean wait)."
    },
    C2: {
      code: "C2",
      dept: "3. Diagnostic Imaging / Radiology CT Suite (C2)",
      title: "Incomplete Diagnostic Referrals & Repeat-Visit Rework Loop",
      curWait: "40% Rejected", futWait: "98.5% Pass",
      curPct: 40, futPct: 98,
      curLogs: [
        { t: "10:10", txt: "Walked via main corridor to Radiology CT Control Booth", cls: "done" },
        { t: "10:14", txt: "Handed paper referral slip to Radiographer at window", cls: "done" },
        { t: "10:16", txt: "Radiographer shakes head: Missing eGFR & clinical indication!", cls: "wait" },
        { t: "10:20", txt: "Stamped [INCOMPLETE REFERRAL] -> Walking back to Reception", cls: "wait" }
      ],
      futLogs: [
        { t: "10:10", txt: "Mandatory CPOE hard-stop verified eGFR & history prior to booking", cls: "done" },
        { t: "10:12", txt: "Cleared at Radiology Control Booth on first pass (98.5%)", cls: "done" },
        { t: "10:15", txt: "IN_SCANNER: Sliding into CT Gantry under cyan laser scan beam", cls: "active" },
        { t: "10:22", txt: "DICOM images pushed to HIS PACS in single visit ✓", cls: "done" }
      ],
      rca: "In Current State, 40% of paper/free-text radiology requests arrive missing renal function (eGFR) or clinical indication, forcing radiographers to reject patients at the booth ('Repeat Visit Required'). Future State enforces mandatory CPOE field validation hard-stops before slot confirmation (98.5% first-pass completion)."
    },
    C3: {
      code: "C3",
      dept: "4 & 5. Inpatient Ward & Pharmacy Inventory Store (C3)",
      title: "Discharge Medication Stockout & Ward Clarification Delay",
      curWait: "90m Turnaround", futWait: "22m Turnaround",
      curPct: 28, futPct: 94,
      curLogs: [
        { t: "11:00", txt: "Inpatient packed with suitcase sitting on edge of Ward Bed #2", cls: "done" },
        { t: "11:15", txt: "Pharmacist checks shelving rack: Empty red slot [STOCKOUT!]", cls: "wait" },
        { t: "11:28", txt: "Pharmacist on desk phone: Calling ward for dosage clarification", cls: "wait" },
        { t: "12:30", txt: "90m turnaround delay blocks acute inpatient bed release", cls: "wait" }
      ],
      futLogs: [
        { t: "11:00", txt: "CPOE e-Prescribing checks formulary stock & dose at ward round", cls: "done" },
        { t: "11:05", txt: "Automated green e-Kanban reorder box replenishes pharmacy shelf", cls: "done" },
        { t: "11:14", txt: "Pharmacist bags discharge medications with zero phone rework", cls: "active" },
        { t: "11:22", txt: "Bedside/Lounge delivery in 22m; ward bed released immediately ✓", cls: "done" }
      ],
      rca: "Current State relies on manual bin cards and handwritten discharge prescriptions, causing unexpected stockouts and a 90-minute 'Ward Clarification Pending' phone loop that blocks inpatient beds. Future State couples automated e-Kanban par reorder alerts with CPOE e-prescribing and parallel discharge lounge prep (22m)."
    },
    C5: {
      code: "C5",
      dept: "6. Central Scheduling & HIS Server Hub (C5)",
      title: "Disconnected Manual Phone Rescheduling vs. SMS Gateway Mismatch",
      curWait: "68.0% Sync", futWait: "99.8% SSOT",
      curPct: 45, futPct: 100,
      curLogs: [
        { t: "09:50", txt: "Call centre agent rescheduled appointment by phone to 11:30", cls: "done" },
        { t: "09:55", txt: "Batch SMS gateway (HIS Sync: OFF) sent 10:00 reminder", cls: "wait" },
        { t: "10:00", txt: "SMS (10:00) != Phone (11:30) conflict when patient arrives!", cls: "wait" },
        { t: "10:08", txt: "Front desk dispute & manual slot override required", cls: "wait" }
      ],
      futLogs: [
        { t: "09:50", txt: "Single-Source-of-Truth (SSOT) HIS locks slot atomically", cls: "done" },
        { t: "09:51", txt: "Real-time bidirectional webhook updates SMS & WhatsApp", cls: "active" },
        { t: "10:00", txt: "Patient arrives at verified 10:00 slot with zero conflict ✓", cls: "done" },
        { t: "10:02", txt: "99.8% schedule sync accuracy across all outpatient clinics", cls: "done" }
      ],
      rca: "In Current State, manual phone rescheduling logs into a local spreadsheet while the SMS gateway runs on a 24-hour batch export ('HIS Sync: OFF'), resulting in 32% conflicting arrival timestamps. Future State enforces an atomic Single-Source-of-Truth (SSOT) HIS scheduling engine."
    }
  };

  const walkable = Array.from({ length: 28 }, () => Array(22).fill(true));
  function findPathAStar(sx, sy, tx, ty) {
    const x0 = Math.max(1, Math.min(26, Math.round(sx)));
    const y0 = Math.max(1, Math.min(20, Math.round(sy)));
    const x1 = Math.max(1, Math.min(26, Math.round(tx)));
    const y1 = Math.max(1, Math.min(20, Math.round(ty)));
    if (x0 === x1 && y0 === y1) return [{ gx: tx, gy: ty }];
    // Route smoothly through main hospital corridor (gy = 9.5) if crossing rooms
    if (Math.abs(x1 - x0) > 4) {
      return [
        { gx: sx, gy: 9.5 },
        { gx: tx, gy: 9.5 },
        { gx: tx, gy: ty }
      ];
    }
    return [{ gx: tx, gy: ty }];
  }

  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    analyticsOpen: false,
    inspectorTab: 0,
    focusCode: 'C1',
    selectedAgentId: 'pat-1',
    cycleTick: 0,
    agents: []
  };

  function buildAgents() {
    simState.agents = [];
    // 10 C1 Outpatient Queue & Consult Patients
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      simState.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        name: `Outpatient #MSH-${401 + i}`,
        sub: `C1 · Arrived 09:40 for 10:00 Slot`,
        code: i === 0 ? 'C5' : 'C1',
        role: 'patient',
        gx: 6.2 + col * 0.75,
        gy: 2.5 + row * 1.8,
        baseGx: 6.2 + col * 0.75,
        baseGy: 2.5 + row * 1.8,
        path: [],
        dir: 'NW',
        pose: 'SITTING_WAIT',
        actionLabel: 'Sitting: Waiting 65m (No ETA)',
        bubble: i < 3 ? '⏳ +65m (NO ETA)' : null,
        bubbleType: 'fail'
      });
    }

    // 3 C2 Radiology Patients (Walking in, handing slip, rejected in Current vs CT Scanner in Future)
    for (let i = 0; i < 3; i++) {
      simState.agents.push({
        id: `pat-rad-${i + 1}`,
        idNum: 11 + i,
        name: `Radiology Patient #MSH-${510 + i}`,
        sub: `C2 · CT Contrast Referral`,
        code: 'C2',
        role: 'patient',
        gx: 19.8 + i * 1.2,
        gy: 7.2,
        path: [],
        dir: 'NE',
        pose: 'WALKING',
        actionLabel: 'Radiology Referral Check',
        bubble: '✗ REPEAT VISIT',
        bubbleType: 'fail'
      });
    }

    // 3 C3 Inpatient Discharge Patients in Ward Beds
    for (let i = 0; i < 3; i++) {
      simState.agents.push({
        id: `pat-ward-${i + 1}`,
        idNum: 15 + i,
        name: `Inpatient #MSH-${201 + i}`,
        sub: `C3 · Ward Bed #${i + 1} Discharge Pending`,
        code: 'C3',
        role: 'patient',
        gx: 4.5 + i * 2.6,
        gy: 13.4,
        path: [],
        dir: 'SE',
        pose: i === 1 ? 'SITTING_WAIT' : 'LYING_ON_BED',
        actionLabel: i === 1 ? 'Sitting Packed (+90m Rx Delay)' : 'Inpatient Ward Bed',
        bubble: i === 1 ? '⏳ 90m BED BLOCK' : null,
        bubbleType: 'fail'
      });
    }

    // 12 Hospital Staff (Receptionists, Specialist MDs, Radiographers, Ward Nurses, Pharmacists, HIS Admins)
    const staffList = [
      { id: 'st-rec-1', name: 'Receptionist Aina', sub: 'Main Triage & Registration (C1/C5)', code: 'C5', role: 'concierge', gx: 4.5, gy: 2.8, pose: 'TYPING_TERMINAL', label: 'Checking Appointment Slot' },
      { id: 'st-rec-2', name: 'Receptionist Danish', sub: 'Outpatient Queue Desk (C1)', code: 'C1', role: 'concierge', gx: 4.5, gy: 4.2, pose: 'TYPING_TERMINAL', label: 'Front Desk Terminal' },
      { id: 'st-doc-1', name: 'Dr. Lim Wei (Cardiology)', sub: 'Specialist Consult Room 1 (C1)', code: 'C1', role: 'doctor', gx: 11.6, gy: 2.8, pose: 'EXAMINING', label: 'Consult Overrun (+18m)' },
      { id: 'st-doc-2', name: 'Dr. Farah (Internal Med)', sub: 'Specialist Consult Room 2 (C1)', code: 'C1', role: 'doctor', gx: 14.2, gy: 2.8, pose: 'TYPING_TERMINAL', label: 'Entering Clinical Notes' },
      { id: 'st-doc-3', name: 'Dr. Raj (Orthopaedics)', sub: 'Specialist Consult Room 3 (C1)', code: 'C1', role: 'doctor', gx: 16.8, gy: 2.8, pose: 'EXAMINING', label: 'Examining Outpatient' },
      { id: 'st-rad-1', name: 'Chief Radiographer Hafiz', sub: 'CT Control Booth (C2)', code: 'C2', role: 'nurse', gx: 21.0, gy: 6.8, pose: 'HANDOVER_INTERACTION', label: 'Inspecting Referral Slip' },
      { id: 'st-rad-2', name: 'CT Technologist Sujata', sub: 'Scanner Gantry Operator (C2)', code: 'C2', role: 'nurse', gx: 24.5, gy: 3.2, pose: 'TYPING_TERMINAL', label: 'CT Gantry Calibration' },
      { id: 'st-ward-1', name: 'Ward Sister Noraini', sub: 'Inpatient Discharge Lounge (C3)', code: 'C3', role: 'nurse', gx: 8.5, gy: 15.2, pose: 'WALKING', label: 'Chasing Discharge Rx' },
      { id: 'st-ward-2', name: 'Staff Nurse Melissa', sub: 'Inpatient Ward Rounds (C3)', code: 'C3', role: 'nurse', gx: 5.5, gy: 18.0, pose: 'EXAMINING', label: 'Bedside Vitals Check' },
      { id: 'st-pharm-1', name: 'Chief Pharmacist Wong', sub: 'Inpatient Dispensing Bay (C3)', code: 'C3', role: 'doctor', gx: 16.2, gy: 15.8, pose: 'PHONE_CALL', label: 'STOCKOUT: Calling Ward (90m)' },
      { id: 'st-pharm-2', name: 'Pharmacy Tech Azlan', sub: 'Inventory Shelving Store (C3)', code: 'C3', role: 'nurse', gx: 17.5, gy: 17.8, pose: 'EXAMINING', label: 'Checking Empty Red Shelf' },
      { id: 'st-his-1', name: 'HIS Systems Lead Vikram', sub: 'Central Scheduling Hub (C5)', code: 'C5', role: 'concierge', gx: 23.2, gy: 14.2, pose: 'TYPING_TERMINAL', label: 'HIS Sync Gateway Monitor' }
    ];

    staffList.forEach((s, idx) => {
      simState.agents.push({
        id: s.id,
        idNum: 20 + idx,
        name: s.name,
        sub: s.sub,
        code: s.code,
        role: s.role,
        gx: s.gx,
        gy: s.gy,
        path: [],
        dir: 'SE',
        pose: s.pose,
        actionLabel: s.label,
        bubble: null,
        bubbleType: 'ok',
        headShake: false
      });
    });
  }

  function stepSimulation() {
    if (!simState.playing) return;
    simState.cycleTick = (simState.cycleTick + simState.speed) % 360;
    const cyc = simState.cycleTick / 360;
    const isCur = simState.mode === 'current';

    simState.agents.forEach((ag, idx) => {
      // C1 Waiting Patients vs Wave Flow
      if (ag.id.startsWith('pat-') && !ag.id.includes('rad') && !ag.id.includes('ward')) {
        const pIdx = parseInt(ag.id.split('-')[1], 10);
        if (isCur) {
          ag.gx = ag.baseGx;
          ag.gy = ag.baseGy;
          ag.pose = pIdx % 2 === 0 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
          ag.actionLabel = 'Waiting 65m — No ETA';
          ag.bubble = pIdx <= 2 ? '⏳ +65m (NO ETA)' : null;
          ag.bubbleType = 'fail';
        } else {
          // Future State: Half of chairs clear out smoothly into consult rooms!
          if (pIdx <= 3) {
            const roomX = 11.4 + (pIdx - 1) * 2.6;
            ag.gx = roomX;
            ag.gy = 2.0;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = 'Wave Slot: In Consultation (14m)';
            ag.bubble = '✓ WAVE 14m';
            ag.bubbleType = 'ok';
          } else {
            ag.gx = ag.baseGx;
            ag.gy = ag.baseGy;
            ag.pose = 'SITTING';
            ag.actionLabel = 'Live ETA: 10:04 Displayed';
            ag.bubble = pIdx === 4 ? '✓ ETA 10:04' : null;
            ag.bubbleType = 'ok';
          }
        }
      }

      // C2 Radiology Patient & Radiographer Micro-Actions
      if (ag.id === 'pat-rad-1') {
        if (isCur) {
          if (cyc < 0.4) {
            ag.gx = 12.0 + (cyc / 0.4) * 8.5;
            ag.gy = 9.5;
            ag.pose = 'WALKING';
            ag.dir = 'SE';
            ag.actionLabel = 'Walking to Radiology with paper slip...';
            ag.bubble = '📋 PAPER REF';
            ag.bubbleType = 'warn';
          } else if (cyc < 0.65) {
            ag.gx = 20.8;
            ag.gy = 7.4;
            ag.pose = 'HANDOVER_INTERACTION';
            ag.actionLabel = 'Handing incomplete referral slip';
            ag.bubble = '✗ MISSING eGFR!';
            ag.bubbleType = 'fail';
          } else {
            ag.gx = 20.8 - ((cyc - 0.65) / 0.35) * 11.0;
            ag.gy = 9.5;
            ag.pose = 'WALKING';
            ag.dir = 'NW';
            ag.actionLabel = 'Turned away: Repeat visit required';
            ag.bubble = '✗ REPEAT VISIT REQ';
            ag.bubbleType = 'fail';
          }
        } else {
          // Future State: Sliding horizontally inside CT Scanner Gantry!
          const slide = Math.sin(cyc * Math.PI * 2) * 0.55;
          ag.gx = 22.3 + slide;
          ag.gy = 2.2;
          ag.pose = 'IN_SCANNER';
          ag.actionLabel = 'CT Gantry Scanning... (98.5% Pass)';
          ag.bubble = '✓ CPOE SCANNING';
          ag.bubbleType = 'ok';
        }
      }

      if (ag.id === 'st-rad-1') {
        ag.headShake = isCur && cyc >= 0.4 && cyc < 0.65;
        ag.actionLabel = isCur
          ? (ag.headShake ? 'Shaking Head: Incomplete Referral!' : 'Checking Paper Referrals (40% Defect)')
          : 'CPOE Pre-Validated: 98.5% First-Pass';
        ag.bubble = isCur ? '✗ 40% REJECTED' : '✓ CPOE HARD-STOP';
        ag.bubbleType = isCur ? 'fail' : 'ok';
      }

      // C3 Pharmacist & Inpatient Discharge Micro-Actions
      if (ag.id === 'st-pharm-1') {
        if (isCur) {
          if (cyc < 0.5) {
            ag.gx = 16.0;
            ag.gy = 16.0;
            ag.pose = 'EXAMINING';
            ag.actionLabel = 'STOCKOUT: Reorder missed at shelf!';
            ag.bubble = '💊 STOCKOUT!';
            ag.bubbleType = 'fail';
          } else {
            ag.gx = 15.2;
            ag.gy = 13.4;
            ag.pose = 'PHONE_CALL';
            ag.actionLabel = 'Calling ward for clarification (90m)';
            ag.bubble = '☎ CALLING WARD';
            ag.bubbleType = 'fail';
          }
        } else {
          ag.gx = 15.2;
          ag.gy = 13.4;
          ag.pose = 'HANDOVER_INTERACTION';
          ag.actionLabel = 'Bagging CPOE Meds (22m Turnaround)';
          ag.bubble = '✓ 22m READY';
          ag.bubbleType = 'ok';
        }
      }

      if (ag.id === 'pat-ward-2') {
        if (isCur) {
          ag.pose = 'SITTING_WAIT';
          ag.actionLabel = 'Sitting Packed on Bed (+90m Rx Delay)';
          ag.bubble = '⏳ 90m BED BLOCK';
          ag.bubbleType = 'fail';
        } else {
          ag.pose = 'HANDOVER_INTERACTION';
          ag.actionLabel = 'Discharged via Lounge in 22m ✓';
          ag.bubble = '🛍️ MEDS RECEIVED';
          ag.bubbleType = 'ok';
        }
      }
    });
  }

  function updateHUD() {
    const isCur = simState.mode === 'current';

    const c1 = document.getElementById('kpi-c1');
    c1.textContent = isCur ? '65 mins' : '14 mins';
    c1.style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('kpi-c1-sub').textContent = isCur ? '09:40 Arrival · ETA: Unknown' : 'Wave Buffer + Live ETA';

    const c2 = document.getElementById('kpi-c2');
    c2.textContent = isCur ? '60.0%' : '98.5%';
    c2.style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('kpi-c2-sub').textContent = isCur ? '40% Repeat Visit Rejections' : 'Mandatory CPOE Hard-Stop';

    const c3 = document.getElementById('kpi-c3');
    c3.textContent = isCur ? '90 mins' : '22 mins';
    c3.style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('kpi-c3-sub').textContent = isCur ? 'Stockout + Ward Clarification' : 'Auto Safety-Stock + CPOE';

    const c5 = document.getElementById('kpi-c5');
    c5.textContent = isCur ? '68.0%' : '99.8%';
    c5.style.color = isCur ? 'var(--warning)' : 'var(--optimal)';
    document.getElementById('kpi-c5-sub').textContent = isCur ? 'HIS Sync: OFF · SMS Conflict' : 'HIS Sync: ON (SSOT)';

    const sel = simState.agents.find(a => a.id === simState.selectedAgentId) || simState.agents[0];
    const comp = COMPLAINTS[simState.focusCode] || COMPLAINTS.C1;

    document.getElementById('insp-name').textContent = sel ? sel.name : comp.title;
    document.getElementById('insp-role').textContent = sel ? sel.sub : comp.dept;
    document.getElementById('insp-badge').textContent = `${comp.code} FOCUS`;
    document.getElementById('insp-v1').textContent = comp.code;
    document.getElementById('insp-v2').textContent = isCur ? comp.curWait : comp.futWait;
    document.getElementById('insp-v2').style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('insp-v3').textContent = sel ? sel.pose : 'ACTIVE';

    const pct = isCur ? comp.curPct : comp.futPct;
    document.getElementById('insp-pct').textContent = `${pct}%`;
    document.getElementById('insp-progress').style.width = `${pct}%`;

    document.getElementById('insp-micro-summary').innerHTML = `
      <strong>Active Micro-Action:</strong> ${sel ? sel.actionLabel : ''}<br/>
      <strong>Department:</strong> ${comp.dept}
    `;

    const logs = isCur ? comp.curLogs : comp.futLogs;
    document.getElementById('insp-log-list').innerHTML = logs.map(l =>
      `<div class="log-row ${l.cls}"><span>[${l.t}]</span><span>${l.txt}</span></div>`
    ).join('');

    document.getElementById('insp-rca-body').innerHTML = `
      <div style="color:var(--primary);font-weight:700;margin-bottom:4px;">${comp.title}</div>
      <div>${comp.rca}</div>
    `;

    document.getElementById('bottom-ticker').textContent =
      `[${comp.code} · ${comp.dept}]: ${logs[logs.length - 1].txt}`;
  }

  function drawBarSVG(id, cur, fut, max, unit) {
    const svg = document.getElementById(id);
    if (!svg) return;
    const cw = Math.round((cur / max) * 240);
    const fw = Math.round((fut / max) * 240);
    svg.innerHTML = `
      <rect x="0" y="0" width="420" height="140" rx="6" fill="#090d16"/>
      <text x="14" y="30" fill="#94a3b8" font-size="11" font-family="monospace">CURRENT (Fragmented)</text>
      <rect x="14" y="38" width="${cw}" height="22" rx="4" fill="#ef4444"/>
      <text x="${22 + cw}" y="53" fill="#fca5a5" font-size="12" font-weight="bold" font-family="monospace">${cur}${unit}</text>
      <text x="14" y="88" fill="#94a3b8" font-size="11" font-family="monospace">FUTURE (Integrated HIS &amp; Lean)</text>
      <rect x="14" y="96" width="${fw}" height="22" rx="4" fill="#10b981"/>
      <text x="${22 + fw}" y="111" fill="#6ee7b7" font-size="12" font-weight="bold" font-family="monospace">${fut}${unit}</text>
    `;
  }

  function renderCharts() {
    drawBarSVG('chart-c1', 65, 14, 80, ' mins');
    drawBarSVG('chart-c2', 60.0, 98.5, 100, '%');
    drawBarSVG('chart-c3', 90, 22, 100, ' mins');
    drawBarSVG('chart-c5', 68.0, 99.8, 100, '%');
  }

  function handleWorldClick(mx, my) {
    for (const ag of simState.agents) {
      const p = IsoRenderer.toIso(ag.gx, ag.gy, 14);
      if (Math.hypot(mx - p.x, my - p.y) < 22) {
        simState.selectedAgentId = ag.id;
        simState.focusCode = ag.code || 'C1';
        updateHUD();
        return;
      }
    }
  }

  function setMode(mode) {
    simState.mode = mode;
    document.getElementById('btn-mode-current').className = 'mode-btn ' + (mode === 'current' ? 'active-current' : '');
    document.getElementById('btn-mode-future').className = 'mode-btn ' + (mode === 'future' ? 'active-future' : '');
    updateHUD();
    renderCharts();
  }

  function toggleActionLabels() {
    simState.showActionLabels = !simState.showActionLabels;
    document.getElementById('btn-labels').classList.toggle('active', simState.showActionLabels);
  }

  function toggleAnalytics() {
    simState.analyticsOpen = !simState.analyticsOpen;
    document.getElementById('analytics-drawer').classList.toggle('open', simState.analyticsOpen);
    document.getElementById('btn-analytics').classList.toggle('active', simState.analyticsOpen);
    renderCharts();
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
    simState.cycleTick = 0;
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

  function focusComplaint(code) {
    simState.focusCode = code;
    const match = simState.agents.find(a => a.code === code);
    if (match) simState.selectedAgentId = match.id;
    updateHUD();
  }

  function focusDept(dept, btn) {
    document.querySelectorAll('#dept-tabs .dept-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (dept === 'ALL') { IsoRenderer.resetCam(); return; }
    const coords = {
      REC: { gx: 6.5, gy: 4.5 },
      C1: { gx: 14.5, gy: 4.0 },
      C2: { gx: 22.5, gy: 4.5 },
      WARD: { gx: 7.5, gy: 15.5 },
      PHARM: { gx: 16.5, gy: 15.5 },
      C5: { gx: 23.5, gy: 15.5 }
    };
    const c = coords[dept];
    if (c) IsoRenderer.panToGrid(c.gx, c.gy, 1.25);
    if (dept === 'C1' || dept === 'C2' || dept === 'C5') focusComplaint(dept);
    else if (dept === 'WARD' || dept === 'PHARM') focusComplaint('C3');
  }

  function exportCSV() {
    const rows = [
      ['Complaint_Code', 'Department', 'Metric_Name', 'Current_Fragmented_State', 'Future_Integrated_HIS_State', 'Key_Intervention', 'Data_Notice'],
      ['C1', 'Specialist Outpatient Clinic', 'Mean Outpatient Wait Time (mins)', '65 mins (ETA: Unknown)', '14 mins (Live Queue ETA)', 'Wave-scheduling buffers + real-time queue ETA display', 'SIMULATED ILLUSTRATIVE MODEL DATA'],
      ['C2', 'Diagnostic Imaging / Radiology', 'First-Pass Diagnostic Completion (%)', '60.0% (40% Repeat Visit Required)', '98.5% (0% Incomplete Rejections)', 'Mandatory digital CPOE order-entry hard-stops before booking', 'SIMULATED ILLUSTRATIVE MODEL DATA'],
      ['C3', 'Inpatient Ward & Pharmacy Store', 'Discharge Medication Turnaround (mins)', '90 mins (Stockout + Ward Clarification)', '22 mins (Parallel Prep)', 'Automated safety-stock reorder alerts + CPOE validation', 'SIMULATED ILLUSTRATIVE MODEL DATA'],
      ['C5', 'Central Scheduling & HIS Hub', 'Appointment Schedule Sync Accuracy (%)', '68.0% (HIS Sync: OFF)', '99.8% (SSOT Auto-Sync)', 'Single-Source-of-Truth (SSOT) HIS bidirectional SMS notifications', 'SIMULATED ILLUSTRATIVE MODEL DATA']
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bahm330-a2-msh-operations-kpis.csv';
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
    renderCharts();
    requestAnimationFrame(loop);
  });

  return {
    setMode,
    toggleActionLabels,
    toggleAnalytics,
    togglePlay,
    toggleSpeed,
    resetSim,
    setInspectorTab,
    focusComplaint,
    focusDept,
    exportCSV
  };
})();
