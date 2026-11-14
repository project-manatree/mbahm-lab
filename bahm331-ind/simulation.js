// ============================================================================
// BAHM331-IND: Luxury Geriatric Retreat Clinical Governance & IoT Simulation
// 28x22 Grid A* Pathfinding, 24 Concurrent Agents, 5 Wearable Scenarios & RBAC
// ============================================================================

const SimApp = (() => {
  const GRID_W = 28;
  const GRID_H = 22;

  // 5 Wearable Telemetry & Clinical Governance Scenarios
  const EVENTS = [
    {
      id: 'EVT-01',
      name: 'Poolside Tachycardia (#R-204)',
      zone: 'Hydrotherapy Pool · Biometric Wristband',
      acuity: 'TIER 3 ACUTE',
      hr: '158 bpm',
      pose: 'SWIMMING_POOL',
      sourceAgentId: 'R-204',
      staffAgentId: 'C-01',
      sourcePos: { gx: 4.5, gy: 4.0 },
      staffPos: { gx: 8.5, gy: 4.5 },
      unfiltered: {
        slaTxt: 'SLA BREACHED (+14.2m)',
        slaPct: 24,
        slaColor: '#ef4444',
        rbac: 'OFF (PHI LEAK)',
        summary: 'Raw cardiac arrhythmia waveform + psychiatric history broadcast directly to Pool Lifeguard tablet (PDPA breach). Visiting MD overwhelmed by concurrent false-positive yoga alerts.',
        logs: [
          { t: '14:02:01', m: '[WEARABLE #R-204]: Sustained HR 158 bpm detected in Hydrotherapy Pool.', cls: 'err' },
          { t: '14:02:02', m: '[UNFILTERED BROADCAST]: Full EHR & Medication Record pushed to Pool Attendant tablet.', cls: 'err' },
          { t: '14:04:15', m: '[ALERT FATIGUE]: Visiting MD phone muted due to 18 prior motion artifacts.', cls: 'warn' },
          { t: '14:16:18', m: '[SLA BREACH]: Unlogged verbal check 14.2 mins late; zero immutable audit entry.', cls: 'err' }
        ],
        rca: '<strong>Root Cause (Unfiltered Routing):</strong> Lack of clinical triage middleware causes dual failure: (1) Non-clinical pool staff view unprotected sensitive EHR data (violating PDPA & MSQH confidentiality standards), and (2) High-acuity cardiac events compete with benign motion noise on the Visiting Physician pager.'
      },
      tiered: {
        slaTxt: 'SLA MET (1.8m < 5.0m)',
        slaPct: 96,
        slaColor: '#10b981',
        rbac: 'ON (RBAC MASKED)',
        summary: 'Duty Triage Nurse validates 158 bpm ECG waveform in 22s, dispatches RBAC-masked Poolside Welfare Ping to Lifeguard (#C-01), and triggers 5-min SLA escalation to Visiting MD (#D-01).',
        logs: [
          { t: '14:02:01', m: '[WEARABLE #R-204]: Sustained HR 158 bpm routed to Nurse Triage Gate (#N-01).', cls: 'ok' },
          { t: '14:02:23', m: '[RBAC DISPATCH]: Masked "Assist Poolside Zone 1" ping sent to Attendant #C-01 (No PHI).', cls: 'ok' },
          { t: '14:02:40', m: '[TIER 3 ESCALATION]: Verified cardiac alert escalated to Visiting Physician #D-01.', cls: 'ok' },
          { t: '14:03:49', m: '[IMMUTABLE AUDIT]: Physician bedside stabilization logged at 1.8m (5m SLA met).', cls: 'ok' }
        ],
        rca: '<strong>Governance Control (Tiered MSQH Model):</strong> Role-Based Access Control (RBAC) strips diagnosis/medication history from hospitality tablets while the On-Site Nurse Triage Gate filters artifacts and guarantees sub-5-minute physician response.'
      }
    },
    {
      id: 'EVT-02',
      name: 'Thermal Spa Slip/Fall (#R-206)',
      zone: 'Thermal Spa Suites · 3-Axis Accelerometer',
      acuity: 'TIER 3 ACUTE',
      hr: '132 bpm + 4.2G',
      pose: 'LYING_ON_BED',
      sourceAgentId: 'R-206',
      staffAgentId: 'C-02',
      sourcePos: { gx: 3.9, gy: 12.8 },
      staffPos: { gx: 8.2, gy: 14.5 },
      unfiltered: {
        slaTxt: 'SLA BREACHED (+11.5m)',
        slaPct: 30,
        slaColor: '#ef4444',
        rbac: 'OFF (PHI LEAK)',
        summary: 'Accelerometer impact triggers raw broadcast exposing osteoporosis & anticoagulant history on Spa lobby display; uncoordinated response between spa therapist and nurse.',
        logs: [
          { t: '15:10:12', m: '[WEARABLE #R-206]: 4.2G deceleration spike in Thermal Spa Suite 2.', cls: 'err' },
          { t: '15:10:13', m: '[PRIVACY BREACH]: Anticoagulant & fall-risk chart shown on Spa reception screen.', cls: 'err' },
          { t: '15:21:42', m: '[SLA BREACH]: Nurse arrives 11.5m post-impact; no incident timestamp recorded.', cls: 'err' }
        ],
        rca: '<strong>Root Cause (Unfiltered Routing):</strong> Diffuse accountability ("everyone paged = nobody owns") delays spinal immobilization and exposes sensitive geriatric diagnoses on shared spa terminals.'
      },
      tiered: {
        slaTxt: 'SLA MET (2.1m < 5.0m)',
        slaPct: 95,
        slaColor: '#10b981',
        rbac: 'ON (RBAC MASKED)',
        summary: 'Triage Nurse locks 5-min SLA timer, sends location-only First-Responder lock to Spa Attendant (#C-02), and dispatches Triage Nurse (#N-02) with cervical collar kit.',
        logs: [
          { t: '15:10:12', m: '[WEARABLE #R-206]: 4.2G fall vector ingested by Clinical Triage Console.', cls: 'ok' },
          { t: '15:10:28', m: '[RBAC DISPATCH]: Spa Attendant #C-02 receives "Stay With Resident - Do Not Lift" prompt.', cls: 'ok' },
          { t: '15:12:18', m: '[SLA MET]: Nurse #N-02 + MD #D-01 complete neuro-checks in 2.1m; audit hash sealed.', cls: 'ok' }
        ],
        rca: '<strong>Governance Control (Tiered MSQH Model):</strong> Structured clinical escalation pairs immediate non-clinical visual reassurance with rapid nurse/MD trauma assessment and cryptographic audit logging.'
      }
    },
    {
      id: 'EVT-03',
      name: 'Nocturnal Arrhythmia (#R-212)',
      zone: 'Residential Suite 304 · Bedside Biometric Patch',
      acuity: 'TIER 3 ACUTE',
      hr: '146 bpm AFib',
      pose: 'LYING_ON_BED',
      sourceAgentId: 'R-212',
      staffAgentId: 'N-02',
      sourcePos: { gx: 22.7, gy: 13.2 },
      staffPos: { gx: 20.0, gy: 5.5 },
      unfiltered: {
        slaTxt: 'SLA BREACHED (+9.8m)',
        slaPct: 38,
        slaColor: '#ef4444',
        rbac: 'OFF (PHI LEAK)',
        summary: 'Paroxysmal AFib alert routed to night concierge desk alongside 14 low-battery wristband pings; delayed clinical escalation to on-call physician.',
        logs: [
          { t: '02:14:05', m: '[PATCH #R-212]: Irregular R-R interval (AFib 146 bpm) in Suite 304.', cls: 'err' },
          { t: '02:14:06', m: '[QUEUE BURIAL]: Alert buried under 14 unprioritized device-battery notifications.', cls: 'warn' },
          { t: '02:23:53', m: '[SLA BREACH]: Physician notified 9.8m after onset via manual phone call.', cls: 'err' }
        ],
        rca: '<strong>Root Cause (Unfiltered Routing):</strong> Absence of severity tiering mixes technical telemetry noise (battery/signal pings) with life-critical cardiac rhythms.'
      },
      tiered: {
        slaTxt: 'SLA MET (2.4m < 5.0m)',
        slaPct: 94,
        slaColor: '#10b981',
        rbac: 'ON (RBAC MASKED)',
        summary: 'Tier-3 auto-priority bypasses hospitality queue, pages Triage Nurse (#N-02) and Visiting MD (#D-01) with 12-lead ECG strip while logging smart-door access.',
        logs: [
          { t: '02:14:05', m: '[TIER 3 PRIORITY]: AFib R-R irregularity flagged as Red-Priority at Nurse Console.', cls: 'ok' },
          { t: '02:14:35', m: '[MD ESCALATION]: Visiting Physician #D-01 receives verified ECG strip on clinical tablet.', cls: 'ok' },
          { t: '02:16:29', m: '[SLA MET]: Bedside rhythm control initiated in 2.4m; smart-key entry logged.', cls: 'ok' }
        ],
        rca: '<strong>Governance Control (Tiered MSQH Model):</strong> Automated severity stratification separates Tier-1 device maintenance from Tier-3 cardiac emergencies.'
      }
    },
    {
      id: 'EVT-04',
      name: 'Yoga Motion Artifact (#R-208)',
      zone: 'Yoga & Wellness Pavilion · Optical PPG Sensor',
      acuity: 'TIER 1 ARTIFACT',
      hr: '162 bpm (Noise)',
      pose: 'YOGA_STRETCH',
      sourceAgentId: 'R-208',
      staffAgentId: 'C-03',
      sourcePos: { gx: 13.2, gy: 2.8 },
      staffPos: { gx: 16.2, gy: 4.2 },
      unfiltered: {
        slaTxt: 'FALSE MD PAGE (FATIGUE)',
        slaPct: 18,
        slaColor: '#f59e0b',
        rbac: 'OFF (PHI LEAK)',
        summary: 'Rhythmic arm stretching causes optical PPG cadence lock (false 162 bpm). Unfiltered router fires emergency cardiac alarm to Visiting Physician (#D-01), causing severe alert fatigue.',
        logs: [
          { t: '10:30:10', m: '[PPG #R-208]: Optical sensor cadence spike (162 bpm) during Sun Salutation.', cls: 'warn' },
          { t: '10:30:11', m: '[FALSE ALARM]: Emergency Code-Red paged to Visiting Physician #D-01 & Yoga Instructor.', cls: 'err' },
          { t: '10:33:00', m: '[ALERT FATIGUE]: MD interrupts acute consult to clear benign motion artifact.', cls: 'err' }
        ],
        rca: '<strong>Root Cause (Unfiltered Routing):</strong> Raw PPG spikes from upper-limb movement trigger false code-red pages when not cross-checked against accelerometer cadence at the Nurse Triage Gate.'
      },
      tiered: {
        slaTxt: 'SUPPRESSED AT GATE (0m)',
        slaPct: 100,
        slaColor: '#10b981',
        rbac: 'ON (RBAC MASKED)',
        summary: 'Nurse Triage Engine correlates 3-axis accelerometer yoga cadence with PPG spike, classifies as Tier-1 Motion Artifact, suppresses false MD page, and logs quiet audit entry.',
        logs: [
          { t: '10:30:10', m: '[PPG #R-208]: 162 bpm optical spike cross-checked with 3-axis cadence sensor.', cls: 'ok' },
          { t: '10:30:14', m: '[ARTIFACT FILTER]: Nurse Triage Gate classifies Tier-1 Motion Noise; MD NOT paged.', cls: 'ok' },
          { t: '10:30:15', m: '[AUDIT SEALED]: Auto-suppressed artifact logged for quality assurance review.', cls: 'ok' }
        ],
        rca: '<strong>Governance Control (Tiered MSQH Model):</strong> Multi-sensor fusion + Nurse Triage Gate eliminates 87% of false-positive physician interrupts, preserving clinical vigilance for real emergencies.'
      }
    },
    {
      id: 'EVT-05',
      name: 'Bistro Med-Diet Alert (#R-210)',
      zone: 'Fine-Dining Bistro · Smart RFID + Glycemic Sensor',
      acuity: 'TIER 2 CLINICAL',
      hr: '94 bpm · Post-Prandial',
      pose: 'SITTING',
      sourceAgentId: 'R-210',
      staffAgentId: 'C-04',
      sourcePos: { gx: 11.9, gy: 13.3 },
      staffPos: { gx: 15.8, gy: 18.0 },
      unfiltered: {
        slaTxt: 'PRIVACY BREACH (+8.4m)',
        slaPct: 42,
        slaColor: '#ef4444',
        rbac: 'OFF (PHI LEAK)',
        summary: 'Warfarin / Vitamin-K & renal diagnosis displayed in plaintext on Bistro waiter POS terminal; no clinical pharmacist/nurse verification.',
        logs: [
          { t: '12:45:02', m: '[BISTRO POS #R-210]: Resident orders grapefruit & high-potassium tasting menu.', cls: 'warn' },
          { t: '12:45:03', m: '[PDPA BREACH]: Full renal & psychiatric med list displayed on public waiter screen.', cls: 'err' },
          { t: '12:53:26', m: '[UNLOGGED]: Waiter verbally warns resident; zero clinical nutritionist log.', cls: 'err' }
        ],
        rca: '<strong>Root Cause (Unfiltered Routing):</strong> Exposing raw medication lists to food-and-beverage staff violates resident dignity and PDPA data minimization principles.'
      },
      tiered: {
        slaTxt: 'SLA MET (1.4m < 5.0m)',
        slaPct: 98,
        slaColor: '#10b981',
        rbac: 'ON (RBAC MASKED)',
        summary: 'Bistro POS receives RBAC-masked "Offer Chef Low-K Citrus Alternative" prompt while Triage Nurse (#N-01) confirms INR/glycemic stability.',
        logs: [
          { t: '12:45:02', m: '[RULE ENGINE]: Drug-nutrient interaction flagged at Nurse Governance Gateway.', cls: 'ok' },
          { t: '12:45:08', m: '[RBAC PROMPT]: Bistro Concierge #C-04 sees "Serve Menu Option B (Dietary Safe)" only.', cls: 'ok' },
          { t: '12:46:24', m: '[AUDIT LOGGED]: Nurse #N-01 verifies glycemic curve; zero PHI exposed in Bistro.', cls: 'ok' }
        ],
        rca: '<strong>Governance Control (Tiered MSQH Model):</strong> Zero-knowledge hospitality prompts translate clinical contraindications into safe culinary instructions without revealing underlying diagnoses.'
      }
    }
  ];

  // Zone camera focus coordinates
  const ZONE_CAM = [
    { gx: 5.5, gy: 4.5, zoom: 1.3 },   // 0: Hydrotherapy Pool
    { gx: 5.5, gy: 15.0, zoom: 1.3 },  // 1: Thermal Spa Suites
    { gx: 22.0, gy: 15.5, zoom: 1.3 }, // 2: Resident Suites 301-309
    { gx: 14.0, gy: 4.5, zoom: 1.3 },  // 3: Yoga & Wellness Pavilion
    { gx: 14.0, gy: 15.5, zoom: 1.3 }, // 4: Fine-Dining Bistro
    { gx: 22.0, gy: 4.5, zoom: 1.35 }  // 5: Nurse Triage & MD Clinic
  ];

  let state = {
    mode: 'unfiltered',
    playing: true,
    speed: 1,
    showActionLabels: true,
    activeEventIdx: 0,
    activeEvent: EVENTS[0],
    selectedAgentId: 'R-204',
    agents: []
  };

  // Walkability check for 28x22 grid
  function isWalkable(gx, gy) {
    if (gx < 1 || gx >= GRID_W - 1 || gy < 1 || gy >= GRID_H - 1) return false;
    return true;
  }

  function findPath(sx, sy, tx, ty) {
    const startX = Math.round(sx), startY = Math.round(sy);
    const goalX = Math.round(tx), goalY = Math.round(ty);
    const open = [{ x: startX, y: startY, g: 0, f: Math.abs(goalX - startX) + Math.abs(goalY - startY), p: null }];
    const closed = new Set();
    let steps = 0;

    while (open.length > 0 && steps < 220) {
      steps++;
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      if (cur.x === goalX && cur.y === goalY) {
        const path = [];
        let n = cur;
        while (n.p) {
          path.unshift({ gx: n.x, gy: n.y });
          n = n.p;
        }
        return path;
      }
      closed.add(`${cur.x},${cur.y}`);
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!isWalkable(nx, ny) || closed.has(`${nx},${ny}`)) continue;
        const g = cur.g + 1;
        const f = g + Math.abs(goalX - nx) + Math.abs(goalY - ny);
        if (!open.some(o => o.x === nx && o.y === ny && o.g <= g)) {
          open.push({ x: nx, y: ny, g, f, p: cur });
        }
      }
    }
    return [{ gx: tx, gy: ty }];
  }

  function buildRoster() {
    const roster = [
      // 14 Wearable-Monitored Elderly Residents
      { id: 'R-204', idNum: 1, name: 'Tan Sri Halim (#R-204)', sub: 'Hydrotherapy Pool · Biometric Band', role: 'resident', gx: 4.5, gy: 4.0, homeX: 4.5, homeY: 4.0, basePose: 'SWIMMING_POOL', hr: '158 bpm' },
      { id: 'R-205', idNum: 2, name: 'Puan Sri Evelyn (#R-205)', sub: 'Hydrotherapy Pool · Biometric Band', role: 'resident', gx: 6.5, gy: 4.5, homeX: 6.5, homeY: 4.5, basePose: 'SWIMMING_POOL', hr: '86 bpm' },
      { id: 'R-206', idNum: 3, name: 'Dato’ Seri K. Lim (#R-206)', sub: 'Thermal Spa Suite 1 · Fall Sensor', role: 'resident', gx: 3.9, gy: 12.8, homeX: 3.9, homeY: 12.8, basePose: 'LYING_ON_BED', hr: '78 bpm' },
      { id: 'R-207', idNum: 4, name: 'Mdm. Beatrice Wu (#R-207)', sub: 'Thermal Spa Suite 2 · PPG Band', role: 'resident', gx: 6.9, gy: 12.8, homeX: 6.9, homeY: 12.8, basePose: 'LYING_ON_BED', hr: '74 bpm' },
      { id: 'R-208', idNum: 5, name: 'Dr. Ariff Mansor (#R-208)', sub: 'Yoga Pavilion · Optical PPG + Accel', role: 'resident', gx: 11.8, gy: 2.8, homeX: 11.8, homeY: 2.8, basePose: 'YOGA_STRETCH', hr: '112 bpm' },
      { id: 'R-209', idNum: 6, name: 'Lady Margaret Chen (#R-209)', sub: 'Yoga Pavilion · Optical PPG + Accel', role: 'resident', gx: 13.8, gy: 2.8, homeX: 13.8, homeY: 2.8, basePose: 'YOGA_STRETCH', hr: '108 bpm' },
      { id: 'R-210', idNum: 7, name: 'Mr. Victor Khoo (#R-210)', sub: 'Fine-Dining Bistro · CGM + RFID', role: 'resident', gx: 11.9, gy: 13.3, homeX: 11.9, homeY: 13.3, basePose: 'SITTING', hr: '88 bpm' },
      { id: 'R-211', idNum: 8, name: 'Mrs. Clara Raj (#R-211)', sub: 'Fine-Dining Bistro · Biometric Band', role: 'resident', gx: 14.7, gy: 13.3, homeX: 14.7, homeY: 13.3, basePose: 'SITTING', hr: '82 bpm' },
      { id: 'R-212', idNum: 9, name: 'Gen. (R) Zainal (#R-212)', sub: 'Suite 304 · ECG Smart Patch', role: 'resident', gx: 20.2, gy: 13.2, homeX: 20.2, homeY: 13.2, basePose: 'LYING_ON_BED', hr: '76 bpm' },
      { id: 'R-213', idNum: 10, name: 'Prof. Eleanor Loh (#R-213)', sub: 'Suite 306 · ECG Smart Patch', role: 'resident', gx: 23.4, gy: 13.2, homeX: 23.4, homeY: 13.2, basePose: 'LYING_ON_BED', hr: '71 bpm' },
      { id: 'R-214', idNum: 11, name: 'Mr. Bernard Teo (#R-214)', sub: 'Central Promenade · Ambulatory Band', role: 'resident', gx: 8.0, gy: 9.5, homeX: 8.0, homeY: 9.5, basePose: 'WALKING', patX: 19.0, patY: 9.5, hr: '92 bpm' },
      { id: 'R-215', idNum: 12, name: 'Mdm. Sofea Aziz (#R-215)', sub: 'Central Promenade · Ambulatory Band', role: 'resident', gx: 18.0, gy: 10.2, homeX: 18.0, homeY: 10.2, basePose: 'WALKING', patX: 6.0, patY: 10.2, hr: '89 bpm' },
      { id: 'R-216', idNum: 13, name: 'Dato’ Henry Ong (#R-216)', sub: 'Suite 308 · Smart Bed Sensor', role: 'resident', gx: 20.2, gy: 17.2, homeX: 20.2, homeY: 17.2, basePose: 'LYING_ON_BED', hr: '69 bpm' },
      { id: 'R-217', idNum: 14, name: 'Mrs. Grace Phua (#R-217)', sub: 'Yoga Pavilion Mat 5 · PPG Band', role: 'resident', gx: 15.8, gy: 5.5, homeX: 15.8, homeY: 5.5, basePose: 'YOGA_STRETCH', hr: '104 bpm' },

      // 10 Retreat Clinical & Hospitality Staff
      { id: 'N-01', idNum: 15, name: 'Charge Nurse Aisha (#N-01)', sub: 'Nurse Triage Gate · Clinical Governance', role: 'nurse', gx: 20.0, gy: 3.5, homeX: 20.0, homeY: 3.5, basePose: 'TYPING_TERMINAL', hr: '78 bpm' },
      { id: 'N-02', idNum: 16, name: 'Rapid-Response Nurse Dev (#N-02)', sub: 'Mobile Triage & First-Aid', role: 'nurse', gx: 20.5, gy: 6.2, homeX: 20.5, homeY: 6.2, basePose: 'WALKING', patX: 14.0, patY: 9.5, hr: '84 bpm' },
      { id: 'N-03', idNum: 17, name: 'Suite Care Nurse Mei (#N-03)', sub: 'Residential Wing 301–309', role: 'nurse', gx: 21.8, gy: 15.2, homeX: 21.8, homeY: 15.2, basePose: 'WALKING', patX: 24.5, patY: 15.2, hr: '80 bpm' },
      { id: 'D-01', idNum: 18, name: 'Dr. Julian Vance (#D-01)', sub: 'Visiting Geriatrician · MD Clinic', role: 'doctor', gx: 23.2, gy: 3.2, homeX: 23.2, homeY: 3.2, basePose: 'TYPING_TERMINAL', hr: '74 bpm' },
      { id: 'D-02', idNum: 19, name: 'Dr. Kavita Nair (#D-02)', sub: 'Visiting Cardiologist · Consult Suite', role: 'doctor', gx: 23.2, gy: 6.2, homeX: 23.2, homeY: 6.2, basePose: 'STANDING', hr: '72 bpm' },
      { id: 'C-01', idNum: 20, name: 'Pool Attendant Danish (#C-01)', sub: 'Hydrotherapy Deck · Non-Clinical', role: 'concierge', gx: 8.5, gy: 4.5, homeX: 8.5, homeY: 4.5, basePose: 'STANDING', hr: '82 bpm' },
      { id: 'C-02', idNum: 21, name: 'Spa Therapist Farah (#C-02)', sub: 'Thermal Spa Suites · Non-Clinical', role: 'concierge', gx: 8.2, gy: 14.5, homeX: 8.2, homeY: 14.5, basePose: 'STANDING', hr: '79 bpm' },
      { id: 'C-03', idNum: 22, name: 'Wellness Coach Liam (#C-03)', sub: 'Yoga Pavilion · Non-Clinical', role: 'concierge', gx: 16.2, gy: 4.2, homeX: 16.2, homeY: 4.2, basePose: 'YOGA_STRETCH', hr: '90 bpm' },
      { id: 'C-04', idNum: 23, name: 'Bistro Maitre D’ Andre (#C-04)', sub: 'Fine-Dining Bistro · Non-Clinical', role: 'concierge', gx: 15.8, gy: 18.0, homeX: 15.8, homeY: 18.0, basePose: 'TYPING_TERMINAL', hr: '77 bpm' },
      { id: 'C-05', idNum: 24, name: 'Chief Concierge Nadia (#C-05)', sub: 'Promenade Desk · Non-Clinical', role: 'concierge', gx: 12.5, gy: 9.5, homeX: 12.5, homeY: 9.5, basePose: 'WALKING', patX: 16.5, patY: 9.5, hr: '75 bpm' }
    ];

    state.agents = roster.map(r => ({
      ...r,
      pose: r.basePose,
      actionLabel: '',
      bubble: '',
      bubbleType: 'info',
      glowingWrist: false,
      path: r.patX ? findPath(r.gx, r.gy, r.patX, r.patY) : [],
      forward: true
    }));

    applyScenarioState();
  }

  function applyScenarioState() {
    const ev = EVENTS[state.activeEventIdx];
    state.activeEvent = ev;
    const isTiered = state.mode === 'tiered';

    state.agents.forEach(ag => {
      ag.pose = ag.basePose;
      ag.bubble = '';
      ag.bubbleType = 'info';
      ag.glowingWrist = false;

      if (ag.role === 'resident') {
        ag.actionLabel = `${ag.id} · ${ag.hr}`;
      } else if (ag.role === 'nurse') {
        ag.actionLabel = 'Monitoring Telemetry';
      } else if (ag.role === 'doctor') {
        ag.actionLabel = 'Clinical Consult';
      } else {
        ag.actionLabel = 'Hospitality Duty';
      }

      // Highlight source resident of active wearable event
      if (ag.id === ev.sourceAgentId) {
        ag.glowingWrist = true;
        ag.pose = ev.pose;
        ag.bubble = `${ev.id}: ${ev.hr}`;
        ag.bubbleType = ev.id === 'EVT-04' && isTiered ? 'ok' : 'fail';
        ag.actionLabel = isTiered ? 'Tiered Alert Active' : 'Unfiltered Broadcast!';
      }

      // Non-clinical hospitality attendant near event
      if (ag.id === ev.staffAgentId) {
        if (!isTiered) {
          ag.pose = 'HOLDING_TABLET_LEAK';
          ag.bubble = 'PHI BREACH!';
          ag.bubbleType = 'fail';
          ag.actionLabel = 'Viewing Raw Diagnosis (PDPA Breach)';
        } else {
          ag.pose = 'CARRYING_AID';
          ag.bubble = 'RBAC PING OK';
          ag.bubbleType = 'ok';
          ag.actionLabel = 'Dispatched (Zero PHI Exposed)';
        }
      }

      // Charge Nurse at Triage Gate (#N-01)
      if (ag.id === 'N-01') {
        ag.pose = 'TYPING_TERMINAL';
        if (!isTiered) {
          ag.bubble = 'BYPASSED';
          ag.bubbleType = 'warn';
          ag.actionLabel = 'Bypassed by Raw Broadcast';
        } else {
          ag.bubble = ev.id === 'EVT-04' ? 'FILTERED NOISE' : 'TRIAGE LOCKED';
          ag.bubbleType = 'ok';
          ag.actionLabel = ev.id === 'EVT-04' ? 'Suppressed Yoga Artifact' : 'Validated & Escalated (<30s)';
        }
      }

      // Visiting Physician (#D-01)
      if (ag.id === 'D-01') {
        if (!isTiered) {
          ag.pose = 'HANDS_UP_FATIGUE';
          ag.bubble = '64% FATIGUE!';
          ag.bubbleType = 'fail';
          ag.actionLabel = 'Overwhelmed by Unfiltered Noise';
        } else {
          ag.pose = 'TYPING_TERMINAL';
          ag.bubble = ev.id === 'EVT-04' ? '0 FALSE PAGES' : '5m SLA ACTIVE';
          ag.bubbleType = 'ok';
          ag.actionLabel = ev.id === 'EVT-04' ? 'Uninterrupted Consult' : 'Responding to Verified Tier-3';
        }
      }
    });

    updateHUD();
    updateInspector();
  }

  function updateHUD() {
    const isTiered = state.mode === 'tiered';
    const setKPI = (id, val, col, subId, subTxt) => {
      const el = document.getElementById(id);
      const sub = document.getElementById(subId);
      if (el) { el.textContent = val; el.style.color = col; }
      if (sub) sub.textContent = subTxt;
    };

    if (!isTiered) {
      setKPI('kpi-sla', '52.0%', 'var(--bottleneck)', 'kpi-sla-sub', 'Unfiltered: Delayed Response');
      setKPI('kpi-fat', '64.0%', 'var(--bottleneck)', 'kpi-fat-sub', 'MD Paged on Motion Noise');
      setKPI('kpi-phi', '14 Breaches', 'var(--bottleneck)', 'kpi-phi-sub', 'Raw EHR on Spa/Pool Tablets');
      setKPI('kpi-aud', '45.0%', 'var(--warning)', 'kpi-aud-sub', 'Unlogged Verbal Handovers');
    } else {
      setKPI('kpi-sla', '96.5%', 'var(--optimal)', 'kpi-sla-sub', 'Tiered: <5m Nurse/MD SLA Met');
      setKPI('kpi-fat', '8.2%', 'var(--optimal)', 'kpi-fat-sub', '87% Motion Noise Filtered');
      setKPI('kpi-phi', '0 Breaches', 'var(--optimal)', 'kpi-phi-sub', '100% RBAC Data Masking');
      setKPI('kpi-aud', '100.0%', 'var(--optimal)', 'kpi-aud-sub', 'Immutable Cryptographic Log');
    }

    const ticker = document.getElementById('bottom-ticker');
    if (ticker) {
      const ev = state.activeEvent;
      const modeData = isTiered ? ev.tiered : ev.unfiltered;
      ticker.textContent = `[${ev.id} · ${ev.name}]: ${modeData.summary}`;
    }
  }

  function updateInspector() {
    const ev = state.activeEvent;
    const isTiered = state.mode === 'tiered';
    const modeData = isTiered ? ev.tiered : ev.unfiltered;
    const selAgent = state.agents.find(a => a.id === state.selectedAgentId) || state.agents[0];

    const nameEl = document.getElementById('insp-name');
    const roleEl = document.getElementById('insp-role');
    const badgeEl = document.getElementById('insp-badge');
    const hrEl = document.getElementById('insp-hr');
    const poseEl = document.getElementById('insp-pose');
    const rbacEl = document.getElementById('insp-rbac');
    const slaTxtEl = document.getElementById('insp-sla-txt');
    const slaFillEl = document.getElementById('insp-sla-fill');
    const summaryEl = document.getElementById('insp-micro-summary');
    const logListEl = document.getElementById('insp-log-list');
    const rcaBodyEl = document.getElementById('insp-rca-body');

    if (nameEl) nameEl.textContent = `${ev.name} · Focus: ${selAgent.id}`;
    if (roleEl) roleEl.textContent = `${selAgent.name} (${selAgent.sub})`;
    if (badgeEl) {
      badgeEl.textContent = ev.acuity;
      badgeEl.style.background = ev.acuity.includes('TIER 3') ? 'rgba(239,68,68,0.2)' : 'rgba(14,165,233,0.2)';
      badgeEl.style.color = ev.acuity.includes('TIER 3') ? '#fca5a5' : '#7dd3fc';
    }
    if (hrEl) {
      hrEl.textContent = selAgent.id === ev.sourceAgentId ? ev.hr : selAgent.hr;
      hrEl.style.color = selAgent.id === ev.sourceAgentId ? '#ef4444' : '#38bdf8';
    }
    if (poseEl) poseEl.textContent = selAgent.pose;
    if (rbacEl) {
      rbacEl.textContent = modeData.rbac;
      rbacEl.style.color = isTiered ? '#10b981' : '#ef4444';
    }
    if (slaTxtEl) {
      slaTxtEl.textContent = modeData.slaTxt;
      slaTxtEl.style.color = modeData.slaColor;
    }
    if (slaFillEl) {
      slaFillEl.style.width = `${modeData.slaPct}%`;
      slaFillEl.style.background = modeData.slaColor;
    }
    if (summaryEl) {
      summaryEl.innerHTML = `<strong>Active Agent (${selAgent.id}):</strong> ${selAgent.actionLabel}<br/><span style="color:#94a3b8">${modeData.summary}</span>`;
    }
    if (logListEl) {
      logListEl.innerHTML = modeData.logs.map(l =>
        `<div class="log-item ${l.cls}"><strong>${l.t}</strong> ${l.m}</div>`
      ).join('');
    }
    if (rcaBodyEl) {
      rcaBodyEl.innerHTML = modeData.rca;
    }
  }

  function stepAgents() {
    if (!state.playing) return;
    const stepSize = 0.032 * state.speed;

    state.agents.forEach(ag => {
      if (!ag.patX || !ag.path || ag.path.length === 0) return;
      const target = ag.path[0];
      const dx = target.gx - ag.gx;
      const dy = target.gy - ag.gy;
      const dist = Math.hypot(dx, dy);

      if (dist <= stepSize) {
        ag.gx = target.gx;
        ag.gy = target.gy;
        ag.path.shift();
        if (ag.path.length === 0) {
          ag.forward = !ag.forward;
          const destX = ag.forward ? ag.patX : ag.homeX;
          const destY = ag.forward ? ag.patY : ag.homeY;
          ag.path = findPath(ag.gx, ag.gy, destX, destY);
        }
      } else {
        ag.gx += (dx / dist) * stepSize;
        ag.gy += (dy / dist) * stepSize;
      }
    });
  }

  function handleCanvasClick(mx, my) {
    let best = null;
    let bestDist = 26;
    state.agents.forEach(ag => {
      const p = IsoRenderer.toIso(ag.gx, ag.gy, 10);
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d < bestDist) {
        bestDist = d;
        best = ag;
      }
    });
    if (best) {
      state.selectedAgentId = best.id;
      updateInspector();
    }
  }

  function setMode(m) {
    state.mode = m;
    const btnU = document.getElementById('btn-mode-unfiltered');
    const btnT = document.getElementById('btn-mode-tiered');
    if (btnU) btnU.className = m === 'unfiltered' ? 'mode-btn active-unfiltered' : 'mode-btn';
    if (btnT) btnT.className = m === 'tiered' ? 'mode-btn active-tiered' : 'mode-btn';
    applyScenarioState();
  }

  function triggerEvent(idx) {
    state.activeEventIdx = idx;
    state.selectedAgentId = EVENTS[idx].sourceAgentId;
    applyScenarioState();
    const ev = EVENTS[idx];
    IsoRenderer.panToGrid(ev.sourcePos.gx, ev.sourcePos.gy, 1.22);
  }

  function focusZone(zoneIdx, btn) {
    document.querySelectorAll('#dept-tabs .dept-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (zoneIdx === -1) {
      IsoRenderer.resetCam();
    } else if (ZONE_CAM[zoneIdx]) {
      const z = ZONE_CAM[zoneIdx];
      IsoRenderer.panToGrid(z.gx, z.gy, z.zoom);
    }
  }

  function setInspectorTab(tabIdx, btn) {
    document.querySelectorAll('.insp-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    for (let i = 0; i < 3; i++) {
      const pane = document.getElementById(`insp-pane-${i}`);
      if (pane) pane.classList.toggle('active', i === tabIdx);
    }
  }

  function toggleActionLabels() {
    state.showActionLabels = !state.showActionLabels;
    const btn = document.getElementById('btn-labels');
    if (btn) btn.classList.toggle('active', state.showActionLabels);
  }

  function togglePlay() {
    state.playing = !state.playing;
    const btn = document.getElementById('btn-play');
    if (btn) {
      btn.textContent = state.playing ? '⏸ Pause' : '▶ Play';
      btn.classList.toggle('active', state.playing);
    }
  }

  function toggleSpeed() {
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
    const btn = document.getElementById('btn-speed');
    if (btn) btn.textContent = `${state.speed}x`;
  }

  function resetSim() {
    state.activeEventIdx = 0;
    IsoRenderer.resetCam();
    buildRoster();
  }

  function exportCSV() {
    const rows = [
      ['Notice', 'SIMULATED ILLUSTRATIVE MODEL DATA - FOR ACADEMIC PROCESS ANALYSIS ONLY'],
      ['Module', 'BAHM331-IND Luxury Geriatric Retreat Clinical Governance & IoT Console'],
      ['Active Governance Mode', state.mode === 'tiered' ? 'Tiered Clinical Governance (MSQH/PDPA)' : 'Unfiltered Broadcast Routing'],
      ['Escalation SLA Compliance', state.mode === 'tiered' ? '96.5%' : '52.0%'],
      ['Physician Alert Fatigue / False-Positive Rate', state.mode === 'tiered' ? '8.2%' : '64.0%'],
      ['PHI Privacy Exposure Breaches', state.mode === 'tiered' ? '0' : '14'],
      ['Audit Trail Completeness', state.mode === 'tiered' ? '100.0%' : '45.0%'],
      [],
      ['Scenario ID', 'Event Name', 'Acuity Tier', 'Vital Telemetry', 'Unfiltered Outcome', 'Tiered MSQH Governance Outcome']
    ];

    EVENTS.forEach(e => {
      rows.push([
        e.id,
        e.name,
        e.acuity,
        e.hr,
        `${e.unfiltered.slaTxt} (${e.unfiltered.rbac})`,
        `${e.tiered.slaTxt} (${e.tiered.rbac})`
      ]);
    });

    const csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bahm331-ind-governance-kpis-${state.mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loop() {
    stepAgents();
    IsoRenderer.render(state);
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    IsoRenderer.init('iso-canvas', handleCanvasClick);
    buildRoster();
    requestAnimationFrame(loop);
  });

  return {
    setMode,
    triggerEvent,
    focusZone,
    setInspectorTab,
    toggleActionLabels,
    togglePlay,
    toggleSpeed,
    resetSim,
    exportCSV
  };
})();
