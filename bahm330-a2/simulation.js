// ============================================================================
// BAHM330-A2: MSH 30-Agent A* Pathfinding & C1/C2/C3/C5 Operations Simulation
// Before (68m Wait, 60% Scan, 92m Rx, 68% Sync) vs After (12m Wait, 99.2% Scan, 18m Rx, 99.9% SSOT)
// ============================================================================

const SimApp = (() => {
  const COMPLAINTS = {
    C1: {
      code: "C1",
      dept: "2. Specialist Outpatient Pod (C1)",
      title: "Outpatient Queue Congestion (68m → 12m · -82% Wait)",
      curWait: "68m Wait", futWait: "12m Wait",
      curPct: 28, futPct: 95,
      curLogs: [
        { t: "09:40", txt: "14+ frustrated patients packed around 1 small waiting bench", cls: "wait" },
        { t: "09:55", txt: "Only 2 slow consultation rooms open (Rooms 3 & 4 closed)", cls: "wait" },
        { t: "10:20", txt: "Specialist consult overruns (+22m unbuffered variance)", cls: "wait" },
        { t: "10:48", txt: "Pacing & foot-tapping: Waiting 68m — Wall Screen shows ETA: Unknown", cls: "wait" }
      ],
      futLogs: [
        { t: "09:40", txt: "Self-service biometric kiosk check-in assigns wave micro-buffer", cls: "done" },
        { t: "09:43", txt: "Live Digital Wall Queue Screen displays real-time 12m ETA countdown", cls: "done" },
        { t: "09:52", txt: "Expanded 4-Room Specialist Pod calls 4 patients in parallel", cls: "active" },
        { t: "10:06", txt: "Consultation & CPOE e-orders completed with zero backlog ✓", cls: "done" }
      ],
      rca: "Before (Current State): 1 small waiting area packed with 14+ frustrated patients (68m wait, ETA: Unknown) feeding only 2 slow consultation rooms. After (Future State): Unlocks Expanded 4-Room Specialist Pod + Self-Service Biometric Kiosks + Live Digital Wall Queue Screens (12m wait, -82%)."
    },
    C2: {
      code: "C2",
      dept: "3. Dual-Suite Imaging Wing — 3T MRI + High-Speed CT (C2)",
      title: "Incomplete Diagnostic Referrals (60.0% → 99.2% First-Pass)",
      curWait: "40% Rejected", futWait: "99.2% Pass",
      curPct: 40, futPct: 99,
      curLogs: [
        { t: "10:10", txt: "Walked to single older X-Ray room with handwritten paper slip", cls: "done" },
        { t: "10:14", txt: "Handed paper referral slip to Radiographer at booth", cls: "done" },
        { t: "10:16", txt: "Radiographer shakes head: Missing eGFR & clinical indication!", cls: "wait" },
        { t: "10:20", txt: "Stamped [INCOMPLETE REFERRAL] -> Turned away back to Reception", cls: "wait" }
      ],
      futLogs: [
        { t: "10:10", txt: "CPOE Digital Order-Entry Hard-Stop verified eGFR & clinical fields", cls: "done" },
        { t: "10:12", txt: "Cleared at Imaging Control Booth on first pass (99.2%)", cls: "done" },
        { t: "10:14", txt: "IN_SCANNER: Dual 3T MRI + High-Speed CT scanning in parallel", cls: "active" },
        { t: "10:20", txt: "DICOM study pushed to PACS in single visit (Zero repeat visits) ✓", cls: "done" }
      ],
      rca: "Before (Current State): Single older X-Ray room turns away 40% of patients ('INCOMPLETE REFERRAL' red stamp) back to Reception due to missing eGFR/indication on paper slips. After (Future State): Upgraded Dual-Suite Imaging Wing (3T MRI + High-Speed CT) with mandatory CPOE Digital Order-Entry Hard-Stop achieves 99.2% first-pass completion."
    },
    C3: {
      code: "C3",
      dept: "4 & 5. Robotic Pharmacy, RFID Racks & Discharge Lounge (C3)",
      title: "Discharge Medication Turnaround (92m → 18m · -80% Delay)",
      curWait: "92m Delay", futWait: "18m Robotic",
      curPct: 24, futPct: 96,
      curLogs: [
        { t: "11:00", txt: "4 inpatient ward beds blocked by packed patients awaiting discharge", cls: "wait" },
        { t: "11:15", txt: "Cramped manual pharmacy hits red empty shelf [STOCKOUT!]", cls: "wait" },
        { t: "11:28", txt: "Pharmacist stuck on landline phone calling ward for dose check", cls: "wait" },
        { t: "12:32", txt: "92m discharge turnaround blocks acute inpatient bed turnover", cls: "wait" }
      ],
      futLogs: [
        { t: "11:00", txt: "CPOE e-Prescribing verified against RFID Smart Inventory Racks", cls: "done" },
        { t: "11:04", txt: "Automated Robotic Pharmacy Dispensing System picks & labels meds", cls: "active" },
        { t: "11:12", txt: "Pneumatic Supply Pod delivers meds to Dedicated Discharge Lounge", cls: "done" },
        { t: "11:18", txt: "18m turnaround (-80% delay); all 4 inpatient beds freed instantly ✓", cls: "done" }
      ],
      rca: "Before (Current State): Cramped manual pharmacy with red empty shelves (STOCKOUT), pharmacist stuck on landline phone (92m delay), and 4 inpatient beds blocked by waiting patients. After (Future State): Automated Robotic Pharmacy Dispensing System + RFID Smart Inventory Racks + Dedicated Inpatient Discharge Lounge cuts turnaround to 18m (-80%)."
    },
    C5: {
      code: "C5",
      dept: "6. Central HIS Single-Source-of-Truth Command Hub (C5)",
      title: "Schedule Synchronization (68.0% → 99.9% SSOT Accuracy)",
      curWait: "68.0% Sync", futWait: "99.9% SSOT",
      curPct: 45, futPct: 100,
      curLogs: [
        { t: "09:50", txt: "Call centre logged phone reschedule to 11:30 in local sheet", cls: "done" },
        { t: "09:55", txt: "Disconnected SMS batch gateway sent 10:00 reminder", cls: "wait" },
        { t: "10:00", txt: "Clashing SMS (10:00) != PHONE (11:30) sparks at Reception Desk!", cls: "wait" },
        { t: "10:08", txt: "Front desk dispute & manual schedule override required", cls: "wait" }
      ],
      futLogs: [
        { t: "09:50", txt: "Central HIS Single-Source-of-Truth (SSOT) locks slot atomically", cls: "done" },
        { t: "09:51", txt: "Glowing cyan sync conduits unite Reception, SMS & Call Centre", cls: "active" },
        { t: "10:00", txt: "Patient arrives at verified 10:00 slot with zero conflict ✓", cls: "done" },
        { t: "10:02", txt: "99.9% schedule accuracy across all specialist pods", cls: "done" }
      ],
      rca: "Before (Current State): Reception desk surrounded by clashing 'SMS != PHONE' red warning sparks (68.0% accuracy) due to siloed spreadsheets. After (Future State): Central HIS Single-Source-of-Truth (SSOT) Command Hub with live cyan sync conduits unites Reception, SMS, and Call Centre (99.9% accuracy)."
    }
  };

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
    const c1Names = [
      'Puan Faridah #401', 'En. Razali #402', 'Mdm. Liew #403', 'Dato’ Tan #404',
      'Mrs. Krishnan #405', 'Mr. Wong #406', 'Cik Nurul #407', 'Hj. Zulkifli #408',
      'Mdm. Chong #409', 'En. Hafiz #410', 'Mrs. Devi #411', 'Mr. Lim #412',
      'Puan Aishah #413', 'Mr. Ravi #414'
    ];
    // 14 C1 Outpatient Queue & Consult Patients (spaced cleanly so nameplates are readable)
    for (let i = 0; i < 14; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      simState.agents.push({
        id: `pat-${i + 1}`,
        idNum: i + 1,
        shortName: c1Names[i],
        name: `${c1Names[i]} (Outpatient)`,
        sub: `C1 · Arrived 09:40 for 10:00 Slot`,
        code: i === 0 ? 'C5' : 'C1',
        role: 'patient',
        gx: 5.5 + col * 1.15,
        gy: 2.1 + row * 1.75,
        baseGx: 5.5 + col * 1.15,
        baseGy: 2.1 + row * 1.75,
        path: [],
        dir: 'NW',
        pose: i < 5 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT',
        actionLabel: 'Waiting 68m (ETA: Unknown)',
        bubble: i < 4 ? '⏳ +68m (NO ETA)' : null,
        bubbleType: 'fail'
      });
    }

    // 2 C2 Radiology / MRI Patients
    const radNames = ['En. Azman #510 (CT)', 'Mdm. Kamala #511 (MRI)'];
    for (let i = 0; i < 2; i++) {
      simState.agents.push({
        id: `pat-rad-${i + 1}`,
        idNum: 15 + i,
        shortName: radNames[i],
        name: `Imaging Patient ${radNames[i]}`,
        sub: `C2 · ${i === 0 ? 'High-Speed CT' : '3T MRI'} Referral`,
        code: 'C2',
        role: 'patient',
        gx: 20.2 + i * 2.5,
        gy: 7.2,
        path: [],
        dir: 'NE',
        pose: 'WALKING',
        actionLabel: 'Radiology Referral Check',
        bubble: '✗ INCOMPLETE REF',
        bubbleType: 'fail'
      });
    }

    // 4 C3 Inpatient Discharge Patients in 4 Blocked Ward Beds
    const wardNames = ['Dato’ Rahim #201', 'Mdm.Siti #202', 'Mr. Cheah #203', 'Puan Salmah #204'];
    const bedCoords = [
      { gx: 4.3, gy: 13.4 },
      { gx: 6.8, gy: 13.4 },
      { gx: 9.3, gy: 13.4 },
      { gx: 4.3, gy: 17.2 }
    ];
    for (let i = 0; i < 4; i++) {
      simState.agents.push({
        id: `pat-ward-${i + 1}`,
        idNum: 17 + i,
        shortName: wardNames[i],
        name: `Inpatient ${wardNames[i]}`,
        sub: `C3 · Ward Bed #${i + 1} Discharge`,
        code: 'C3',
        role: 'patient',
        gx: bedCoords[i].gx,
        gy: bedCoords[i].gy,
        baseGx: bedCoords[i].gx,
        baseGy: bedCoords[i].gy,
        path: [],
        dir: 'SE',
        pose: 'SITTING_WAIT',
        actionLabel: 'Blocking Ward Bed (+92m Rx Delay)',
        bubble: i < 2 ? '⏳ 92m BED BLOCK' : null,
        bubbleType: 'fail'
      });
    }

    // 10 Hospital Staff (Reception, 4 Consult MDs, Radiographer, Ward Nurse, Pharmacist, HIS Admin)
    const staffList = [
      { id: 'st-rec-1', name: 'Receptionist Aina', sub: 'Main Triage & Registration (C1/C5)', code: 'C5', role: 'concierge', gx: 4.5, gy: 2.8, pose: 'TYPING_TERMINAL', label: 'Checking Appointment Slot' },
      { id: 'st-doc-1', name: 'Dr. Lim Wei (Cardiology)', sub: 'Specialist Pod Room 1 (C1)', code: 'C1', role: 'doctor', gx: 11.2, gy: 2.8, pose: 'EXAMINING', label: 'Consult Room 1' },
      { id: 'st-doc-2', name: 'Dr. Farah (Internal Med)', sub: 'Specialist Pod Room 2 (C1)', code: 'C1', role: 'doctor', gx: 13.2, gy: 2.8, pose: 'TYPING_TERMINAL', label: 'Consult Room 2' },
      { id: 'st-doc-3', name: 'Dr. Raj (Orthopaedics)', sub: 'Specialist Pod Room 3 (C1)', code: 'C1', role: 'doctor', gx: 15.3, gy: 2.8, pose: 'EXAMINING', label: 'Consult Room 3 (Unlocked)' },
      { id: 'st-doc-4', name: 'Dr. Mei (Neurology)', sub: 'Specialist Pod Room 4 (C1)', code: 'C1', role: 'doctor', gx: 17.3, gy: 2.8, pose: 'EXAMINING', label: 'Consult Room 4 (Unlocked)' },
      { id: 'st-rad-1', name: 'Chief Radiographer Hafiz', sub: 'Dual 3T MRI + CT Control (C2)', code: 'C2', role: 'nurse', gx: 21.0, gy: 6.8, pose: 'HANDOVER_INTERACTION', label: 'Inspecting Referral Slip' },
      { id: 'st-rad-2', name: 'MRI Technologist Sujata', sub: '3T MRI Suite Operator (C2)', code: 'C2', role: 'nurse', gx: 25.0, gy: 3.4, pose: 'TYPING_TERMINAL', label: '3T MRI Calibration' },
      { id: 'st-ward-1', name: 'Ward Sister Noraini', sub: 'Inpatient Discharge Lounge (C3)', code: 'C3', role: 'nurse', gx: 10.2, gy: 15.0, pose: 'WALKING', label: 'Coordinating Discharge Lounge' },
      { id: 'st-pharm-1', name: 'Chief Pharmacist Wong', sub: 'Robotic Dispensing Bay (C3)', code: 'C3', role: 'doctor', gx: 15.2, gy: 13.4, pose: 'PHONE_CALL', label: 'STOCKOUT: Landline Phone (92m)' },
      { id: 'st-his-1', name: 'HIS Systems Lead Vikram', sub: 'Central SSOT Command Hub (C5)', code: 'C5', role: 'concierge', gx: 23.2, gy: 14.2, pose: 'TYPING_TERMINAL', label: 'SSOT Sync Hub (99.9%)' }
    ];

    staffList.forEach((s, idx) => {
      simState.agents.push({
        id: s.id,
        idNum: 21 + idx,
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

    simState.agents.forEach(ag => {
      // C1: 14 Crowded Patients in 1 Waiting Area (Current) vs 4-Room Pod + Open Lounge (Future)
      if (ag.id.startsWith('pat-') && !ag.id.includes('rad') && !ag.id.includes('ward')) {
        const pIdx = parseInt(ag.id.split('-')[1], 10);
        if (isCur) {
          ag.gx = ag.baseGx + (pIdx > 5 ? Math.sin(cyc * Math.PI * 2 + pIdx) * 0.25 : 0);
          ag.gy = ag.baseGy;
          ag.pose = pIdx <= 5 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
          ag.actionLabel = 'Waiting 68m — ETA: Unknown';
          ag.bubble = pIdx <= 3 ? '⏳ +68m (NO ETA)' : null;
          ag.bubbleType = 'fail';
        } else {
          if (pIdx <= 4) {
            // Inside the 4 unlocked Specialist Consult Rooms!
            ag.gx = 10.9 + (pIdx - 1) * 2.05;
            ag.gy = 2.0;
            ag.pose = 'LYING_ON_BED';
            ag.actionLabel = `Pod Room #${pIdx}: Active Consult (12m)`;
            ag.bubble = `✓ POD #${pIdx} (12m)`;
            ag.bubbleType = 'ok';
          } else {
            ag.gx = ag.baseGx;
            ag.gy = ag.baseGy;
            ag.pose = 'SITTING';
            ag.actionLabel = 'Live Wall ETA: 12m (-82%)';
            ag.bubble = pIdx === 5 ? '✓ ETA 12m' : null;
            ag.bubbleType = 'ok';
          }
        }
      }

      // Specialist Doctors 3 & 4 in Rooms 3 & 4
      if (ag.id === 'st-doc-3' || ag.id === 'st-doc-4') {
        ag.pose = isCur ? 'IDLE' : 'EXAMINING';
        ag.actionLabel = isCur ? 'Room Closed (Unrenovated)' : 'Active in Expanded 4-Room Pod';
        ag.bubble = isCur ? '🔒 CLOSED' : '✓ POD OPEN';
        ag.bubbleType = isCur ? 'warn' : 'ok';
      }

      // C2: Single X-Ray Rejection Loop (Current) vs Dual 3T MRI + High-Speed CT (Future)
      if (ag.id === 'pat-rad-1') {
        if (isCur) {
          if (cyc < 0.4) {
            ag.gx = 12.0 + (cyc / 0.4) * 8.5;
            ag.gy = 9.5;
            ag.pose = 'WALKING';
            ag.dir = 'SE';
            ag.actionLabel = 'Walking with paper referral slip...';
            ag.bubble = '📋 PAPER REF';
            ag.bubbleType = 'warn';
          } else if (cyc < 0.65) {
            ag.gx = 20.8;
            ag.gy = 7.4;
            ag.pose = 'HANDOVER_INTERACTION';
            ag.actionLabel = 'Stamped: INCOMPLETE REFERRAL!';
            ag.bubble = '✗ INCOMPLETE REF';
            ag.bubbleType = 'fail';
          } else {
            ag.gx = 20.8 - ((cyc - 0.65) / 0.35) * 11.0;
            ag.gy = 9.5;
            ag.pose = 'WALKING';
            ag.dir = 'NW';
            ag.actionLabel = 'Turned away (40% Rejections)';
            ag.bubble = '✗ REPEAT VISIT';
            ag.bubbleType = 'fail';
          }
        } else {
          const slide = Math.sin(cyc * Math.PI * 2) * 0.55;
          ag.gx = 21.0 + slide;
          ag.gy = 2.2;
          ag.pose = 'IN_SCANNER';
          ag.actionLabel = 'High-Speed CT Scan (99.2% Pass)';
          ag.bubble = '✓ CT SCANNING';
          ag.bubbleType = 'ok';
        }
      }

      if (ag.id === 'pat-rad-2') {
        if (isCur) {
          ag.gx = 19.2;
          ag.gy = 7.8;
          ag.pose = 'FRUSTRATED_WAIT';
          ag.actionLabel = 'Waiting outside Single X-Ray Room';
          ag.bubble = '⏳ X-RAY BACKLOG';
          ag.bubbleType = 'fail';
        } else {
          const slide = Math.cos(cyc * Math.PI * 2) * 0.55;
          ag.gx = 24.6 + slide;
          ag.gy = 2.2;
          ag.pose = 'IN_SCANNER';
          ag.actionLabel = '3T MRI Suite Scanning (99.2% Pass)';
          ag.bubble = '✓ 3T MRI SCAN';
          ag.bubbleType = 'ok';
        }
      }

      if (ag.id === 'st-rad-1') {
        ag.headShake = isCur && cyc >= 0.4 && cyc < 0.65;
        ag.actionLabel = isCur
          ? (ag.headShake ? 'Stamping INCOMPLETE REFERRAL!' : '40% Paper Referrals Rejected')
          : 'CPOE Hard-Stop: 99.2% First-Pass';
        ag.bubble = isCur ? '✗ 40% REJECTED' : '✓ CPOE 99.2%';
        ag.bubbleType = isCur ? 'fail' : 'ok';
      }

      // C3: Pharmacist Landline Loop & 4 Blocked Beds (Current) vs Robotic Dispensing & Discharge Lounge (Future)
      if (ag.id === 'st-pharm-1') {
        if (isCur) {
          ag.gx = 15.2;
          ag.gy = 13.4;
          ag.pose = 'PHONE_CALL';
          ag.actionLabel = 'Stuck on Landline Phone (92m Delay)';
          ag.bubble = '☎ STOCKOUT + 92m';
          ag.bubbleType = 'fail';
        } else {
          ag.gx = 15.2;
          ag.gy = 13.4;
          ag.pose = 'TYPING_TERMINAL';
          ag.actionLabel = 'Robotic + RFID Dispensing (18m)';
          ag.bubble = '🤖 ROBOTIC 18m';
          ag.bubbleType = 'ok';
        }
      }

      if (ag.id.startsWith('pat-ward-')) {
        const wIdx = parseInt(ag.id.split('-')[2], 10);
        if (isCur) {
          ag.gx = ag.baseGx;
          ag.gy = ag.baseGy;
          ag.pose = 'SITTING_WAIT';
          ag.actionLabel = `Blocking Bed #${wIdx} (+92m Rx Delay)`;
          ag.bubble = wIdx <= 2 ? '⏳ 92m BED BLOCK' : null;
          ag.bubbleType = 'fail';
        } else {
          // Move to Dedicated Inpatient Discharge Lounge so ward beds turn over immediately!
          ag.gx = 11.2;
          ag.gy = 13.4 + (wIdx - 1) * 0.85;
          ag.pose = 'SITTING';
          ag.actionLabel = 'In Discharge Lounge (18m Robotic Rx ✓)';
          ag.bubble = wIdx === 1 ? '✓ BED FREED (18m)' : null;
          ag.bubbleType = 'ok';
        }
      }
    });
  }

  function updateHUD() {
    const isCur = simState.mode === 'current';

    const strip = document.getElementById('impact-strip');
    const stateTag = document.getElementById('facility-state-tag');
    if (strip) strip.classList.toggle('future-active', !isCur);
    if (stateTag) {
      stateTag.textContent = isCur
        ? 'BEFORE: CONGESTED 2-ROOM CLINIC & MANUAL RX'
        : 'AFTER: 4-ROOM POD · DUAL 3T MRI+CT · ROBOTIC RX';
      stateTag.classList.toggle('upgraded', !isCur);
    }

    const c1 = document.getElementById('kpi-c1');
    c1.textContent = isCur ? '68 mins' : '12 mins';
    c1.style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('kpi-c1-sub').textContent = isCur ? '14+ Crowded · 2 Rooms Only' : '4-Room Pod + Live ETA (-82%)';

    const c2 = document.getElementById('kpi-c2');
    c2.textContent = isCur ? '60.0%' : '99.2%';
    c2.style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('kpi-c2-sub').textContent = isCur ? '40% Rejected at Single X-Ray' : 'Dual 3T MRI + CT + CPOE';

    const c3 = document.getElementById('kpi-c3');
    c3.textContent = isCur ? '92 mins' : '18 mins';
    c3.style.color = isCur ? 'var(--bottleneck)' : 'var(--optimal)';
    document.getElementById('kpi-c3-sub').textContent = isCur ? 'Stockout + 4 Beds Blocked' : 'Robotic Rx + Lounge (-80%)';

    const c5 = document.getElementById('kpi-c5');
    c5.textContent = isCur ? '68.0%' : '99.9%';
    c5.style.color = isCur ? 'var(--warning)' : 'var(--optimal)';
    document.getElementById('kpi-c5-sub').textContent = isCur ? 'SMS != Phone Clash Sparks' : 'SSOT Cyan Sync Conduits';

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
      <text x="14" y="30" fill="#94a3b8" font-size="11" font-family="monospace">BEFORE: CURRENT BROKEN FACILITY</text>
      <rect x="14" y="38" width="${cw}" height="22" rx="4" fill="#ef4444"/>
      <text x="${22 + cw}" y="53" fill="#fca5a5" font-size="12" font-weight="bold" font-family="monospace">${cur}${unit}</text>
      <text x="14" y="88" fill="#94a3b8" font-size="11" font-family="monospace">AFTER: SMART RENOVATED HOSPITAL WING</text>
      <rect x="14" y="96" width="${fw}" height="22" rx="4" fill="#10b981"/>
      <text x="${22 + fw}" y="111" fill="#6ee7b7" font-size="12" font-weight="bold" font-family="monospace">${fut}${unit}</text>
    `;
  }

  function renderCharts() {
    drawBarSVG('chart-c1', 68, 12, 80, ' mins (-82%)');
    drawBarSVG('chart-c2', 60.0, 99.2, 100, '%');
    drawBarSVG('chart-c3', 92, 18, 100, ' mins (-80%)');
    drawBarSVG('chart-c5', 68.0, 99.9, 100, '%');
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
    IsoRenderer.triggerUpgradePulse(mode);
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
      ['Complaint_Code', 'Department', 'Metric_Name', 'Before_Current_State', 'After_Future_Smart_State', 'Improvement', 'Physical_Facility_Upgrade', 'Data_Notice'],
      ['C1', 'Specialist Outpatient Pod', 'Mean Outpatient Wait Time (mins)', '68 mins (ETA: Unknown)', '12 mins (Live Queue ETA)', '-82% Wait Time', 'Expanded 4-Room Specialist Pod + Biometric Kiosks + Live Wall Screens', 'SIMULATED ILLUSTRATIVE MODEL DATA'],
      ['C2', 'Dual-Suite Imaging Wing', 'First-Pass Diagnostic Completion (%)', '60.0% (40% Repeat Visit Rejected)', '99.2% (0% Incomplete Rejections)', '+39.2% First-Pass', 'Upgraded Dual 3T MRI + High-Speed CT Wing + Mandatory CPOE Hard-Stop', 'SIMULATED ILLUSTRATIVE MODEL DATA'],
      ['C3', 'Robotic Pharmacy & Ward Lounge', 'Discharge Medication Turnaround (mins)', '92 mins (Stockout + 4 Beds Blocked)', '18 mins (Instant Bed Turnover)', '-80% Discharge Delay', 'Automated Robotic Pharmacy Dispensing + RFID Racks + Discharge Lounge', 'SIMULATED ILLUSTRATIVE MODEL DATA'],
      ['C5', 'Central SSOT HIS Command Hub', 'Appointment Schedule Sync Accuracy (%)', '68.0% (SMS != Phone Clash)', '99.9% (SSOT Auto-Sync)', '+31.9% Sync Accuracy', 'Central HIS Single-Source-of-Truth (SSOT) Hub + Live Cyan Sync Conduits', 'SIMULATED ILLUSTRATIVE MODEL DATA']
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
