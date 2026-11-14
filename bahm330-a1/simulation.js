// ============================================================================
// BAHM330-A1: A* Grid Pathfinding & 24-Agent Step-Down Transfer Simulation
// ============================================================================

const SimApp = (() => {
  const STAGES = [
    {
      id: 1,
      short: "S1: Ward Discharge",
      name: "Hospital Ward Discharge Flag & Medical Summary Handover",
      current: { va: 15, nva: 45, rca: "Paper discharge summary requires physical attending physician sign-off and manual fax relay to the retreat (+45m non-value-added queue wait)." },
      future:  { va: 15, nva: 5,  rca: "HL7/FHIR digital discharge pre-alert automatically pushes summary to Retreat Nurse Station upon ward round flag (5m wait)." },
      wp: { gx: 3.5, gy: 3.5 },
      waitWp: { gx: 4.5, gy: 7.5 }
    },
    {
      id: 2,
      short: "S2: Billing & GL",
      name: "Partner-Hospital Billing & Insurance Clearance",
      current: { va: 20, nva: 40, rca: "Sequential insurance Guarantee Letter (GL) processing starts only after ward discharge flag; patient sits in billing hall (+40m wait)." },
      future:  { va: 15, nva: 5,  rca: "Parallel pre-authorized concierge billing clears insurance GL while patient is still on the ward (5m verification buffer)." },
      wp: { gx: 3.5, gy: 13.5 },
      waitWp: { gx: 6.0, gy: 14.2 }
    },
    {
      id: 3,
      short: "S3: Concierge Van",
      name: "Luxury Medical Concierge Vehicle Dispatch & Transit",
      current: { va: 35, nva: 25, rca: "Concierge medical vehicle dispatched only after billing counter release, causing a 25m staging wait at the departure bay." },
      future:  { va: 35, nva: 0,  rca: "Pre-booked GPS departure slot synchronizes vehicle arrival with ward release; wheelchair lift extends with 0m staging wait." },
      wp: { gx: 11.2, gy: 14.5 },
      waitWp: { gx: 9.8, gy: 14.5 }
    },
    {
      id: 4,
      short: "S4: Suite Check-In",
      name: "Retreat Concierge Arrival & Biometric Suite Check-In",
      current: { va: 10, nva: 20, rca: "Siloed arrival notification leaves housekeeping still mopping the suite upon arrival (+20m lobby wait)." },
      future:  { va: 10, nva: 0,  rca: "Parallel suite preparation and pre-encoded biometric wristband allow direct check-in with 0m lobby wait." },
      wp: { gx: 18.8, gy: 15.5 },
      waitWp: { gx: 17.2, gy: 13.8 }
    },
    {
      id: 5,
      short: "S5: Visiting MD Exam",
      name: "Visiting Physician Baseline Health Inspection",
      current: { va: 20, nva: 30, rca: "External visiting geriatrician is paged ad-hoc after check-in, leaving resident waiting 30m on the examination couch." },
      future:  { va: 20, nva: 5,  rca: "Synchronized visiting physician rounding window aligns with transit ETA (5m buffer)." },
      wp: { gx: 18.0, gy: 3.5 },
      waitWp: { gx: 18.0, gy: 6.2 }
    },
    {
      id: 6,
      short: "S6: Hydro & Wellness",
      name: "Care-Plan & Wellness Onboarding (Dietary/Pool/Physio Clearance)",
      current: { va: 15, nva: 0,  rca: "Hydrotherapy pool, thermal spa & tailored geriatric nutrition plan activated." },
      future:  { va: 15, nva: 0,  rca: "Pre-loaded wellness itinerary & wearable telemetry active across pool, spa, and bistro." },
      wp: { gx: 24.0, gy: 14.0 },
      waitWp: { gx: 24.0, gy: 16.5 }
    }
  ];

  // Build 28x22 Walkability Grid for A* Pathfinding
  const walkable = Array.from({ length: 28 }, () => Array(22).fill(true));
  function initWalkGrid() {
    for (let x = 0; x < 28; x++) {
      walkable[x][0] = false;
      walkable[x][21] = false;
    }
    for (let y = 0; y < 22; y++) {
      walkable[0][y] = false;
      walkable[27][y] = false;
    }
    // Interior partition walls with open doorways at corridors (y=9,10,14,15)
    for (let x = 1; x <= 10; x++) {
      if (x !== 5 && x !== 6) walkable[x][9] = false;
    }
  }
  initWalkGrid();

  // Grid-Based A* Pathfinding
  function findPathAStar(startGx, startGy, goalGx, goalGy) {
    const sx = Math.max(1, Math.min(26, Math.round(startGx)));
    const sy = Math.max(1, Math.min(20, Math.round(startGy)));
    const tx = Math.max(1, Math.min(26, Math.round(goalGx)));
    const ty = Math.max(1, Math.min(20, Math.round(goalGy)));
    if (sx === tx && sy === ty) return [{ gx: goalGx, gy: goalGy }];

    const open = [{ x: sx, y: sy, g: 0, f: Math.hypot(tx - sx, ty - sy), parent: null }];
    const closed = new Set();
    const dirs = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];

    let bestNode = open[0];
    let steps = 0;
    while (open.length > 0 && steps < 380) {
      steps++;
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      if (cur.x === tx && cur.y === ty) {
        bestNode = cur;
        break;
      }
      closed.add(`${cur.x},${cur.y}`);
      for (const d of dirs) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        if (nx < 1 || nx > 26 || ny < 1 || ny > 20) continue;
        if (!walkable[nx][ny] && !(nx === tx && ny === ty)) continue;
        const key = `${nx},${ny}`;
        if (closed.has(key)) continue;
        const g = cur.g + (d.dx !== 0 && d.dy !== 0 ? 1.414 : 1);
        const h = Math.hypot(tx - nx, ty - ny);
        const existing = open.find(o => o.x === nx && o.y === ny);
        if (!existing) {
          const node = { x: nx, y: ny, g, f: g + h, parent: cur };
          open.push(node);
          if (h < Math.hypot(tx - bestNode.x, ty - bestNode.y)) bestNode = node;
        } else if (g < existing.g) {
          existing.g = g;
          existing.f = g + h;
          existing.parent = cur;
        }
      }
    }

    const path = [];
    let curr = bestNode;
    while (curr) {
      path.unshift({ gx: curr.x, gy: curr.y });
      curr = curr.parent;
    }
    path.push({ gx: goalGx, gy: goalGy });
    return path;
  }

  let simState = {
    mode: 'current',
    playing: true,
    speed: 1,
    showActionLabels: true,
    inspectorTab: 0,
    selectedAgentId: 'res-1',
    masterClock: 0,
    van: { gx: 11.8, gy: 14.2, doorsOpen: true, rampExtended: true, brakeLights: true },
    agents: []
  };

  const RESIDENT_PROFILES = [
    { id: 'res-1', name: "Tan Sri Dato' Lim (#G-101)", sub: "78M · Post-Hip Arthroplasty Step-Down", hr: "76 bpm", bp: "124/78 · 98%", offset: 0 },
    { id: 'res-2', name: "Puan Sri Sharifah (#G-102)", sub: "81F · Cardiac Rehab Step-Down", hr: "72 bpm", bp: "118/74 · 99%", offset: 35 },
    { id: 'res-3', name: "Dato' Dr. Arumugam (#G-103)", sub: "75M · Post-Stroke Neuro Recovery", hr: "80 bpm", bp: "130/82 · 97%", offset: 72 },
    { id: 'res-4', name: "Madam Beatrice Wong (#G-104)", sub: "84F · Respiratory Step-Down", hr: "78 bpm", bp: "126/76 · 98%", offset: 110 },
    { id: 'res-5', name: "Tuan Haji Ismail (#G-105)", sub: "79M · Post-Spinal Decompression", hr: "74 bpm", bp: "122/75 · 99%", offset: 145 },
    { id: 'res-6', name: "Mrs. Eleanor Khoo (#G-106)", sub: "82F · Geriatric Frailty Conditioning", hr: "77 bpm", bp: "120/74 · 98%", offset: 180 },
    { id: 'res-7', name: "Encik Kamarul (#G-107)", sub: "73M · Post-Coronary Stent Step-Down", hr: "71 bpm", bp: "119/72 · 99%", offset: 215 },
    { id: 'res-8', name: "Datin Paduka Rosalind (#G-108)", sub: "80F · Knee Replacement Step-Down", hr: "75 bpm", bp: "125/78 · 98%", offset: 250 }
  ];

  const STAFF_DEFS = [
    { id: 'st-1', name: 'Dr. Ariff (Ward Consultant)', sub: 'Partner Hospital Ward MD', role: 'doctor', gx: 2.5, gy: 2.8, pose: 'EXAMINING', label: 'Reviewing Ward Chart', stageIdx: 0 },
    { id: 'st-2', name: 'Dr. Mei Ling (Hospitalist)', sub: 'Partner Hospital Ward MD', role: 'doctor', gx: 5.0, gy: 5.8, pose: 'EXAMINING', label: 'Signing Discharge Summary', stageIdx: 0 },
    { id: 'st-3', name: 'Charge Nurse Siti', sub: 'Ward Discharge Coordinator', role: 'nurse', gx: 8.6, gy: 3.2, pose: 'TYPING_TERMINAL', label: 'Compiling Discharge Summary', stageIdx: 0 },
    { id: 'st-4', name: 'Staff Nurse Kavitha', sub: 'Acute Ward Nurse', role: 'nurse', gx: 7.0, gy: 2.8, pose: 'WALKING', label: 'Bedside Medication Check', stageIdx: 0, patrol: [{gx:7.0,gy:2.8},{gx:3.0,gy:6.5}] },
    { id: 'st-5', name: 'Staff Nurse Farhan', sub: 'Transfer Porter Nurse', role: 'nurse', gx: 5.5, gy: 9.8, pose: 'WALKING', label: 'Escorting Step-Down Resident', stageIdx: 1, patrol: [{gx:5.5,gy:8.5},{gx:5.5,gy:13.5}] },
    { id: 'st-6', name: 'Officer Razak', sub: 'Senior Billing & GL Clerk', role: 'concierge', gx: 2.4, gy: 12.8, pose: 'TYPING_TERMINAL', label: 'Processing Insurance GL', stageIdx: 1 },
    { id: 'st-7', name: 'Officer Priya', sub: 'Insurance Verification Desk', role: 'concierge', gx: 3.6, gy: 12.8, pose: 'TYPING_TERMINAL', label: 'Verifying Guarantee Letter', stageIdx: 1 },
    { id: 'st-8', name: 'Paramedic Driver Zul', sub: 'Luxury Medical Concierge Van', role: 'nurse', gx: 11.2, gy: 15.8, pose: 'IDLE', label: 'Operating Wheelchair Lift', stageIdx: 2 },
    { id: 'st-9', name: 'Concierge Manager Evelyn', sub: 'Retreat Chief Concierge', role: 'concierge', gx: 17.2, gy: 12.8, pose: 'TYPING_TERMINAL', label: 'Encoding Biometric Keycard', stageIdx: 3 },
    { id: 'st-10', name: 'Suite Hostess Hannah', sub: 'Retreat Guest Relations', role: 'concierge', gx: 18.2, gy: 12.8, pose: 'WALKING', label: 'Escorting to King Suite', stageIdx: 3, patrol: [{gx:17.5,gy:13.0},{gx:19.5,gy:16.5}] },
    { id: 'st-11', name: 'Housekeeper Amir', sub: 'Suite Environmental Tech', role: 'cleaner', gx: 18.2, gy: 15.5, pose: 'MOPPING', label: 'Mopping Luxury Suite Floor', stageIdx: 3 },
    { id: 'st-12', name: 'Housekeeper Rohani', sub: 'Linen & Sanitization Crew', role: 'cleaner', gx: 19.5, gy: 18.2, pose: 'MOPPING', label: 'Preparing King Suite Bed', stageIdx: 3 },
    { id: 'st-13', name: 'Dr. Helena Vance', sub: 'Visiting Consultant Geriatrician', role: 'doctor', gx: 18.2, gy: 2.8, pose: 'EXAMINING', label: 'Auscultating Baseline Vitals', stageIdx: 4 },
    { id: 'st-14', name: 'Clinic Nurse Pauline', sub: 'Retreat Triage & ECG Nurse', role: 'nurse', gx: 20.0, gy: 3.2, pose: 'TYPING_TERMINAL', label: 'Logging SpO2 & Care Plan', stageIdx: 4 },
    { id: 'st-15', name: 'Hydro-Physio Chloe', sub: 'Aquatic Rehab Specialist', role: 'nurse', gx: 23.5, gy: 5.5, pose: 'EXAMINING', label: 'Supervising Hydrotherapy Pool', stageIdx: 5 },
    { id: 'st-16', name: 'Chef Nutritionist Daniel', sub: 'Geriatric Therapeutic Dining', role: 'concierge', gx: 24.5, gy: 17.8, pose: 'IDLE', label: 'Curating Low-Sodium Menu', stageIdx: 5 }
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
    return { stageIdx: 5, inWait: false, into: 15, stTot: 15, vaProg: 1, waitMins: 0, accVA: Math.round(accVA), accNVA: Math.round(accNVA) };
  }

  function buildAgents() {
    simState.agents = [];
    RESIDENT_PROFILES.forEach((rp, idx) => {
      simState.agents.push({
        id: rp.id,
        idNum: idx + 1,
        name: rp.name,
        sub: rp.sub,
        hr: rp.hr,
        bp: rp.bp,
        role: 'resident',
        offset: rp.offset,
        gx: 3.5,
        gy: 3.5,
        targetGx: 3.5,
        targetGy: 3.5,
        path: [],
        dir: 'SE',
        pose: 'LYING_ON_BED',
        actionLabel: 'Ward Bed',
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
        name: sd.name,
        sub: sd.sub,
        hr: '70 bpm',
        bp: 'Staff On-Duty',
        role: sd.role,
        gx: sd.gx,
        gy: sd.gy,
        path: [],
        patrol: sd.patrol || null,
        patrolIdx: 0,
        dir: 'SE',
        pose: sd.pose,
        basePose: sd.pose,
        actionLabel: sd.label,
        baseLabel: sd.label,
        bubble: null,
        bubbleType: 'ok',
        stageIdx: sd.stageIdx,
        inWait: false,
        elapsed: 0
      });
    });
  }

  function computeDirection(dx, dy) {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle >= -22.5 && angle < 22.5) return 'SE';
    if (angle >= 22.5 && angle < 67.5) return 'S';
    if (angle >= 67.5 && angle < 112.5) return 'SW';
    if (angle >= 112.5 && angle < 157.5) return 'W';
    if (angle >= 157.5 || angle < -157.5) return 'NW';
    if (angle >= -157.5 && angle < -112.5) return 'N';
    if (angle >= -112.5 && angle < -67.5) return 'NE';
    return 'E';
  }

  function stepSimulation() {
    if (!simState.playing) return;
    const totals = getTotals(simState.mode);
    simState.masterClock = (simState.masterClock + 0.14 * simState.speed) % totals.total;

    // Update Van position based on Primary Resident (res-1)
    const primaryElapsed = simState.masterClock;
    const pLoc = locateStage(primaryElapsed, simState.mode);
    if (pLoc.stageIdx === 2 && !pLoc.inWait) {
      const t = pLoc.vaProg;
      simState.van.gx = 11.4 + t * 3.2;
      simState.van.gy = 14.2;
      simState.van.doorsOpen = t < 0.22 || t > 0.82;
      simState.van.rampExtended = t < 0.22 || t > 0.82;
      simState.van.brakeLights = t < 0.22 || t > 0.82;
    } else {
      simState.van.gx = pLoc.stageIdx < 2 ? 11.4 : 14.6;
      simState.van.gy = 14.2;
      simState.van.doorsOpen = true;
      simState.van.rampExtended = pLoc.stageIdx === 2;
      simState.van.brakeLights = true;
    }

    // Update all 24 Agents
    simState.agents.forEach((ag, idx) => {
      if (ag.role === 'resident') {
        const el = (simState.masterClock + ag.offset) % totals.total;
        ag.elapsed = el;
        const loc = locateStage(el, simState.mode);
        ag.stageIdx = loc.stageIdx;
        ag.inWait = loc.inWait;

        const st = STAGES[loc.stageIdx];
        const dest = loc.inWait ? st.waitWp : st.wp;
        const slotJitterX = ((idx % 3) - 1) * 0.7;
        const slotJitterY = (Math.floor(idx / 3) - 1) * 0.65;
        const goalGx = dest.gx + slotJitterX;
        const goalGy = dest.gy + slotJitterY;

        if (loc.stageIdx === 2 && !loc.inWait && idx === 0) {
          // Riding inside Luxury Concierge Van
          ag.gx = simState.van.gx + 0.6;
          ag.gy = simState.van.gy + 0.4;
          ag.pose = 'SITTING';
          ag.actionLabel = 'Boarding / Riding Concierge Van';
          ag.bubble = '🚐 VAN TRANSIT';
          ag.bubbleType = 'ok';
          ag.path = [];
        } else {
          const distToGoal = Math.hypot(goalGx - ag.gx, goalGy - ag.gy);
          if (distToGoal > 1.1 && ag.path.length === 0) {
            ag.path = findPathAStar(ag.gx, ag.gy, goalGx, goalGy);
          }

          if (ag.path.length > 0) {
            const nextPt = ag.path[0];
            const dx = nextPt.gx - ag.gx;
            const dy = nextPt.gy - ag.gy;
            const d = Math.hypot(dx, dy);
            const step = 0.09 * simState.speed;
            if (d <= step) {
              ag.gx = nextPt.gx;
              ag.gy = nextPt.gy;
              ag.path.shift();
            } else {
              ag.gx += (dx / d) * step;
              ag.gy += (dy / d) * step;
              ag.dir = computeDirection(dx, dy);
            }
            ag.pose = 'WALKING';
            ag.actionLabel = `Walking to ${st.short}...`;
            ag.bubble = `🚶 ${st.short}`;
            ag.bubbleType = 'ok';
          } else {
            // Arrived at stage station
            if (loc.inWait) {
              ag.pose = loc.stageIdx === 1 ? 'SITTING_WAIT' : 'FRUSTRATED_WAIT';
              ag.actionLabel = `Waiting (+${loc.waitMins}m Queue Bottleneck)`;
              ag.bubble = `⏳ WAIT +${loc.waitMins}m`;
              ag.bubbleType = 'wait';
            } else {
              if (loc.stageIdx === 0 || loc.stageIdx === 4) ag.pose = 'LYING_ON_BED';
              else if (loc.stageIdx === 3 || loc.stageIdx === 5) ag.pose = 'SITTING';
              else ag.pose = 'HANDOVER_INTERACTION';
              ag.actionLabel = `${st.short}: Active (${st[simState.mode].va}m)`;
              ag.bubble = `✓ S${st.id} ACTIVE`;
              ag.bubbleType = 'ok';
            }
          }
        }
      } else {
        // Staff Agent Patrol / Pose Update
        if (ag.id === 'st-11' || ag.id === 'st-12') {
          ag.pose = simState.mode === 'current' ? 'MOPPING' : 'IDLE';
          ag.actionLabel = simState.mode === 'current' ? 'Mopping Suite (+20m Delay)' : 'Suite Pre-Cleaned ✓';
          ag.bubble = simState.mode === 'current' ? '🧹 SUITE PREP' : '✓ READY';
          ag.bubbleType = simState.mode === 'current' ? 'wait' : 'ok';
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
            ag.dir = computeDirection(dx, dy);
          }
        }
      }
    });
  }

  function updateHUD() {
    const totals = getTotals(simState.mode);
    document.getElementById('kpi-va').textContent = `${totals.va} mins`;
    const nvaEl = document.getElementById('kpi-nva');
    nvaEl.textContent = `${totals.nva} mins`;
    nvaEl.style.color = simState.mode === 'future' ? 'var(--optimal)' : 'var(--bottleneck)';
    document.getElementById('kpi-total').textContent = `${totals.total} mins`;
    document.getElementById('kpi-total-sub').textContent =
      `Clock: T+${String(Math.floor(simState.masterClock)).padStart(3, '0')}m · 8 Transfers`;

    const pceEl = document.getElementById('kpi-pce');
    pceEl.textContent = `${totals.pce}%`;
    pceEl.style.color = simState.mode === 'future' ? 'var(--optimal)' : 'var(--warning)';

    const sel = simState.agents.find(a => a.id === simState.selectedAgentId) || simState.agents[0];
    if (!sel) return;

    const loc = locateStage(sel.elapsed || simState.masterClock, simState.mode);
    const st = STAGES[loc.stageIdx];
    const pct = Math.min(100, Math.round(((sel.elapsed || simState.masterClock) / totals.total) * 100));

    document.getElementById('insp-name').textContent = sel.name;
    document.getElementById('insp-role').textContent = sel.sub;
    document.getElementById('insp-badge').textContent = loc.inWait
      ? `STAGE ${st.id} · WAITING`
      : `STAGE ${st.id} · ACTIVE`;
    document.getElementById('insp-badge').style.color = loc.inWait ? '#fca5a5' : 'var(--primary)';

    document.getElementById('insp-hr').textContent = sel.hr;
    document.getElementById('insp-bp').textContent = sel.bp;
    document.getElementById('insp-pose').textContent = `${sel.pose} · ${sel.dir}`;
    document.getElementById('insp-stage-txt').textContent = st.short;
    document.getElementById('insp-pct').textContent = `${pct}%`;
    document.getElementById('insp-progress').style.width = `${pct}%`;

    document.getElementById('insp-micro-summary').innerHTML = `
      <strong>Current Micro-Action:</strong> ${sel.actionLabel}<br/>
      <strong>Stage ${st.id} Metrics:</strong>
      <span style="color:var(--optimal)">${st[simState.mode].va}m Active VA</span> ·
      <span style="color:${st[simState.mode].nva > 10 ? 'var(--bottleneck)' : 'var(--muted)'}">${st[simState.mode].nva}m Wait</span>
    `;

    // Tab (b): Journey Log
    let cum = 0;
    document.getElementById('insp-log-list').innerHTML = STAGES.map((s, idx) => {
      const d = s[simState.mode];
      const tStr = `T+${String(cum).padStart(3, '0')}m`;
      cum += d.va + d.nva;
      if (idx < loc.stageIdx) {
        return `<div class="log-row done"><span>[${tStr}]</span><span>✓ ${s.short}: ${d.va}m VA / ${d.nva}m Wait</span></div>`;
      } else if (idx === loc.stageIdx) {
        const cls = loc.inWait ? 'wait' : 'active';
        return `<div class="log-row ${cls}"><span>[${tStr}]</span><span>▶ ${sel.actionLabel}</span></div>`;
      }
      return `<div class="log-row" style="color:var(--muted)"><span>[${tStr}]</span><span>○ ${s.short}: Scheduled</span></div>`;
    }).join('');

    // Tab (c): Root-Cause Analysis
    document.getElementById('insp-rca-body').innerHTML = `
      <div style="margin-bottom:6px;color:var(--primary);font-weight:700;">${st.name}</div>
      <div style="margin-bottom:6px;"><strong>Current State Bottleneck (${st.current.nva}m wait):</strong> ${st.current.rca}</div>
      <div style="color:#6ee7b7;"><strong>Future State Parallel Sync (${st.future.nva}m wait):</strong> ${st.future.rca}</div>
    `;

    document.getElementById('bottom-ticker').textContent =
      `[SELECTED: ${sel.name}] ${sel.actionLabel} — ${st[simState.mode].rca}`;
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
      ['Stage_ID', 'Stage_Name', 'Current_Active_Mins', 'Current_Wait_Mins', 'Current_Total_Mins', 'Future_Active_Mins', 'Future_Wait_Mins', 'Future_Total_Mins', 'Wait_Reduction_Mins', 'Data_Notice']
    ];
    STAGES.forEach(s => {
      rows.push([
        `S${s.id}`,
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
      `${fut.total} (PCE ${fut.pce}%)`,
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
