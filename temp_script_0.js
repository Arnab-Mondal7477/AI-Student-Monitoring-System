
const API_BASE   = 'http://127.0.0.1:8000';
const IST        = 'Asia/Kolkata';
const POLL_MS    = 5000;

const S = {
  students:        [],
  detections:      [],
  evidenceFiles:   [],
  seenIds:         new Set(),
  notifications:   [],
  firstLoad:       true,
};

const pageMeta = {
  dashboard:  ['Control Center',         'Real-time dual-mode security monitoring.'],
  students:   ['Member Profiles',        'Enrolled members with face recognition embeddings.'],
  attendance: ['Daily Attendance',       'Automated entry and exit time tracking roster.'],
  visitors:   ['Unregistered Visitors',  'Automated security alerts and visitor face entries.'],
  register:   ['Register Member',        'Enroll a new member or hotel guest.'],
  violations: ['Telemetry Logs',         'All detection events across sessions.'],
  evidence:   ['Evidence Gallery',       'Captured JPEG snapshots.'],
  health:     ['System Health',          'Live connectivity telemetry.'],
};

function goToSection(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === name));
  document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === name));
  const [title, desc] = pageMeta[name] || [name, ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageDesc').textContent  = desc;
  toggleSidebar(false);
  if (name === 'students')   loadStudents();
  if (name === 'attendance') loadAttendance();
  if (name === 'visitors')   renderVisitors();
  if (name === 'violations') loadDetections().then(renderViolations);
  if (name === 'evidence')   loadEvidence();
  if (name === 'health')     runHealthChecks();
}

document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => goToSection(b.dataset.section))
);

function toggleSidebar(force) {
  const sb = document.getElementById('sidebar');
  const open = typeof force === 'boolean' ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', open);
}

function tick() {
  const now = new Date();
  const s = now.toLocaleString('en-IN', {
    day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit',
    hour12:true, timeZone:IST
  });
  document.getElementById('clockBadge').textContent = s + ' IST';
  const ssTime = document.getElementById('ssTime');
  if (ssTime) ssTime.textContent = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:IST});
}
setInterval(tick, 1000);
tick();

function esc(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0]?.[0]||'') + (parts[1]?.[0]||'')).toUpperCase() || '?';
}

function fmtDT(value) {
  if (!value) return { date:'—', time:'—', full:'—', raw:null };
  let d = new Date(value);
  if (isNaN(d)) d = new Date(String(value).replace(' ','T') + 'Z');
  if (isNaN(d)) return { date:String(value), time:'—', full:String(value), raw:null };
  const date = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:IST});
  const time = d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:IST});
  return { date, time, full:`${date} · ${time}`, raw:d };
}

function isVisitor(studentId) {
  if (!studentId) return true;
  const s = String(studentId).toUpperCase();
  return s === 'UNKNOWN' || s.startsWith('VISITOR') || s === 'UNKNOWN STUDENT';
}

function evidenceUrl(path) {
  if (!path) return '#';
  const s = String(path).replace(/\\/g,'/');
  for (const marker of ['/evidence/', 'evidence/']) {
    const idx = s.indexOf(marker);
    if (idx !== -1) return `${API_BASE}/evidence/${encodeURIComponent(s.slice(idx + marker.length))}`;
  }
  return `${API_BASE}/evidence/${encodeURIComponent(s)}`;
}

function evidenceUrlFromFilename(filename) {
  return `${API_BASE}/evidence/${encodeURIComponent(filename)}`;
}

function showToast(title, msg, kind) {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast ${kind||''}`;
  el.innerHTML = `<strong>${esc(title)}</strong>${msg ? `<span>${esc(msg)}</span>` : ''}`;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 4500);
}

function setDot(dotId, labelId, ok) {
  const d = document.getElementById(dotId);
  const l = document.getElementById(labelId);
  if (d) { d.classList.remove('on','off','pending'); d.classList.add(ok?'on':'off'); }
  if (l) l.textContent = ok ? 'Connected' : 'Unavailable';
}

function setSystemOnline(ok) {
  const pill = document.getElementById('systemPill');
  const dot  = document.getElementById('systemDot');
  const label= document.getElementById('systemStatus');
  const live = document.getElementById('liveBadge');
  const footer=document.getElementById('footerStatus');
  pill.classList.toggle('online',ok); pill.classList.toggle('offline',!ok);
  dot.classList.toggle('on',ok); dot.classList.toggle('off',!ok);
  label.textContent = ok ? 'System Online' : 'Backend Offline';
  live.style.display = ok ? 'inline-flex' : 'none';
  if (footer) footer.textContent = ok ? 'Operational' : 'Offline';
}

async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('dash');
    const dash = await res.json();

    document.getElementById('kpiMembers').textContent    = dash.total_students ?? 0;
    document.getElementById('kpiRegPhone').textContent   = dash.reg_phone_violations ?? 0;
    document.getElementById('kpiRegFace').textContent    = dash.reg_face_entries ?? 0;
    document.getElementById('kpiUnregPhone').textContent = dash.unreg_phone_violations ?? 0;
    document.getElementById('kpiUnregFace').textContent  = dash.unreg_face_entries ?? 0;

    document.getElementById('ssMembers').textContent    = dash.total_students ?? 0;
    document.getElementById('ssRegPhone').textContent   = dash.reg_phone_violations ?? 0;
    document.getElementById('ssRegFace').textContent    = dash.reg_face_entries ?? 0;
    document.getElementById('ssUnregPhone').textContent = dash.unreg_phone_violations ?? 0;
    document.getElementById('ssUnregFace').textContent  = dash.unreg_face_entries ?? 0;

    document.getElementById('navStudentCount').textContent = dash.total_students ?? 0;
    const unregTotal = (dash.unreg_phone_violations||0) + (dash.unreg_face_entries||0);
    const nv = document.getElementById('navVisitorCount');
    if (unregTotal > 0) { nv.textContent = unregTotal; nv.style.display = ''; } else nv.style.display = 'none';

    setSystemOnline(true);
    setDot('dotBackend','lblBackend',true);
    setDot('dotDb','lblDb',true);
    if(document.getElementById('hBackend')) document.getElementById('hBackend').textContent = 'Connected';
    setDot('hDotBackend',null,true);
    if(document.getElementById('hBaseUrl')) document.getElementById('hBaseUrl').textContent = API_BASE;

    const banner = document.getElementById('offlineBanner');
    if (banner) banner.style.display = 'none';

    await loadDetections();
    renderRecentDetections();
    renderActivityFeed();
    await loadEvidence(true);

  } catch(e) {
    console.error('dashboard:', e);
    setSystemOnline(false);
    setDot('dotBackend','lblBackend',false);
    setDot('dotDb','lblDb',false);
    setDot('hDotBackend',null,false);
    if(document.getElementById('hBackend')) document.getElementById('hBackend').textContent = 'Offline';
    setDot('hDotDb',null,false);
    if(document.getElementById('hDb')) document.getElementById('hDb').textContent = 'Offline';
    setDot('hDotEvidence',null,false);
    if(document.getElementById('hEvidence')) document.getElementById('hEvidence').textContent = 'Unavailable';
    setDot('hDotDetections',null,false);
    if(document.getElementById('hDetections')) document.getElementById('hDetections').textContent = 'Offline';

    const banner = document.getElementById('offlineBanner');
    if (banner) banner.style.display = 'flex';

    const recent = document.getElementById('recentDetections');
    if (recent && (recent.querySelector('.skeleton') || S.detections.length === 0)) {
      recent.innerHTML = `<div class="empty-state" style="padding:30px 16px;"><p>Backend Offline — Waiting for stream connection…</p></div>`;
    }
    const feed = document.getElementById('activityFeed');
    if (feed && (feed.querySelector('.skeleton') || S.detections.length === 0)) {
      feed.innerHTML = `<div class="empty-state" style="padding:30px 16px;"><p>Backend Offline.</p></div>`;
    }
  }
}

async function loadDetections() {
  try {
    const res = await fetch(`${API_BASE}/phone-detections`);
    if (!res.ok) throw new Error('detections');
    const data = await res.json();
    const list = data.detections || [];

    detectNew(list);
    S.detections = list;
    return list;
  } catch(e) {
    return S.detections;
  }
}

function detectNew(list) {
  if (S.firstLoad) { list.forEach(d => S.seenIds.add(d.id)); return; }
  list.forEach(d => {
    if (!S.seenIds.has(d.id)) {
      S.seenIds.add(d.id);
      const unreg = isVisitor(d.student_id);
      const isPhone = (d.detection_type || '').toUpperCase() === 'PHONE_VIOLATION';

      let title = 'Detection Alert';
      let msg = '';
      let kind = 'warning';

      if (unreg && isPhone)       { title = '⚠️ Visitor Phone Alert'; msg = `Unregistered visitor detected with phone (${(Number(d.confidence)*100).toFixed(1)}%)`; kind = 'critical'; }
      else if (unreg && !isPhone) { title = '👁️ Visitor Face Entry'; msg = `Unregistered visitor entered area (${(Number(d.confidence)*100).toFixed(1)}%)`; kind = 'warning'; }
      else if (!unreg && isPhone){ title = '📱 Member Phone Violation'; msg = `${d.student_id} phone violation (${(Number(d.confidence)*100).toFixed(1)}%)`; kind = 'critical'; }
      else                        { title = '👤 Member Check-in'; msg = `${d.student_id} checked in`; kind = 'success'; }

      pushNotification({ kind, title, msg, time: d.created_at });
      showToast(title, msg, kind);
    }
  });
}

function renderRecentDetections() {
  const c = document.getElementById('recentDetections');
  if (!c) return;
  const list = S.detections;
  if (list.length === 0) {
    c.innerHTML = `<div class="empty-state"><strong>No detection records</strong><p>Events stream here in real time.</p></div>`;
    return;
  }

  const rows = list.slice(0,10).map(d => {
    const dt = fmtDT(d.created_at);
    const conf = (Number(d.confidence)*100).toFixed(1);
    const evUrl = d.evidence_path ? evidenceUrl(d.evidence_path) : null;
    const unreg = isVisitor(d.student_id);
    const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';

    let tagHtml = '';
    if (unreg && isPhone)       tagHtml = `<span class="badge tag-visitor-alert"><span class="badge-dot"></span>⚠️ VISITOR PHONE ALERT</span>`;
    else if (unreg && !isPhone) tagHtml = `<span class="badge tag-visitor-face"><span class="badge-dot"></span>👁️ VISITOR FACE ENTRY</span>`;
    else if (!unreg && isPhone) tagHtml = `<span class="badge tag-phone-violation"><span class="badge-dot"></span>📱 PHONE VIOLATION</span>`;
    else                        tagHtml = `<span class="badge tag-face-checkin"><span class="badge-dot"></span>👤 MEMBER CHECK-IN</span>`;

    return `
      <tr>
        <td class="cell-id">#${d.id}</td>
        <td class="cell-strong">${unreg ? 'Unregistered Visitor' : esc(d.student_id)}</td>
        <td>${tagHtml}</td>
        <td>${conf}%</td>
        <td>${dt.date}<br><small style="color:var(--text-mute)">${dt.time}</small></td>
        <td>${evUrl ? `<button class="btn btn-xs" onclick="openEvidModal('${encodeURIComponent(evUrl)}','${unreg ? 'Unregistered Visitor' : esc(d.student_id)}','${dt.full}','${conf}%','${esc(evUrl.split('/').pop())}')">View</button>` : '—'}</td>
      </tr>`;
  }).join('');

  c.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Person</th><th>Event Type</th><th>Confidence</th><th>Timestamp (IST)</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  if (S.detections.length === 0) { feed.innerHTML = `<div class="empty-state"><p>No activity yet.</p></div>`; return; }

  feed.innerHTML = S.detections.slice(0,8).map(d => {
    const dt = fmtDT(d.created_at);
    const unreg = isVisitor(d.student_id);
    const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';
    const dotCls = isPhone ? 'phone' : (unreg ? 'visitor' : 'checkin');
    const label  = unreg ? (isPhone ? '⚠️ Visitor Phone Alert' : '👁️ Visitor Face Entry') : (isPhone ? `${esc(d.student_id)} · Phone Violation` : `${esc(d.student_id)} · Check-in`);

    return `
      <div class="activity-item">
        <div class="activity-dot ${dotCls}"></div>
        <div class="activity-body">
          <div class="activity-title">${label}</div>
          <div class="activity-meta">${dt.full} · ${(Number(d.confidence)*100).toFixed(1)}% confidence</div>
        </div>
      </div>`;
  }).join('');
}

async function loadStudents() {
  const c = document.getElementById('studentsList');
  try {
    const [stuRes, detRes] = await Promise.all([
      fetch(`${API_BASE}/students`),
      loadDetections(),
    ]);
    if (!stuRes.ok) throw new Error('students');
    const data     = await stuRes.json();
    const students = data.students || [];
    S.students = students;

    document.getElementById('studentsCountLabel').textContent = `${students.length} profile${students.length===1?'':'s'}`;
    document.getElementById('navStudentCount').textContent    = students.length;

    if (students.length === 0) {
      c.innerHTML = `<div class="empty-state"><strong>No members registered</strong><p>Register a profile to start tracking check-ins.</p></div>`;
      return;
    }

    const violCounts = {};
    const checkinCounts = {};
    S.detections.forEach(d => {
      const k = d.student_id||'UNKNOWN';
      const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';
      if (isPhone) violCounts[k] = (violCounts[k]||0)+1;
      else checkinCounts[k] = (checkinCounts[k]||0)+1;
    });

    const profiles = await Promise.all(
      students.map(s => fetch(`${API_BASE}/students/${encodeURIComponent(s.student_id)}/face-profile`).then(r => r.ok ? r.json() : null).catch(() => null))
    );

    c.innerHTML = students.map((s, idx) => {
      const vc = violCounts[s.student_id] || 0;
      const cc = checkinCounts[s.student_id] || 0;
      const prof = profiles[idx] || { completeness_pct: 20, status: 'INCOMPLETE', registered_poses: ['front'], total_views: 1 };
      const pct = prof.completeness_pct || 20;

      let statusColor = '#38BDF8';
      let statusBg = 'rgba(56, 189, 248, 0.15)';
      let statusBorder = 'rgba(56, 189, 248, 0.35)';

      if (prof.status === 'EXCELLENT') {
        statusColor = '#10B981';
        statusBg = 'rgba(16, 185, 129, 0.15)';
        statusBorder = 'rgba(16, 185, 129, 0.35)';
      } else if (prof.status === 'GOOD') {
        statusColor = '#F59E0B';
        statusBg = 'rgba(245, 158, 11, 0.15)';
        statusBorder = 'rgba(245, 158, 11, 0.35)';
      } else {
        statusColor = '#EF4444';
        statusBg = 'rgba(239, 68, 68, 0.15)';
        statusBorder = 'rgba(239, 68, 68, 0.35)';
      }

      const poseBadges = ['front', 'left', 'right', 'up', 'down'].map(p => {
        const has = (prof.registered_poses || []).includes(p);
        return `<span style="font-size:9.5px; padding:3px 7px; border-radius:6px; font-weight:800; letter-spacing:0.3px; ${has ? 'background:rgba(16,185,129,0.2); color:#6EE7B7; border:1px solid rgba(16,185,129,0.4); box-shadow:0 0 8px rgba(16,185,129,0.2);' : 'background:rgba(255,255,255,0.03); color:var(--text-mute); border:1px solid rgba(255,255,255,0.08);'}">${has ? '✓' : '○'} ${p.toUpperCase()}</span>`;
      }).join(' ');

      return `
        <div class="student-card">
          <div style="display:flex; gap:14px; align-items:flex-start;">
            ${s.avatar_url ? `<img src="${API_BASE}${s.avatar_url}" class="avatar" alt="${esc(s.name)}">` : `<div class="avatar">${esc(initials(s.name))}</div>`}
            <div class="student-info">
              <div class="student-name">${esc(s.name)}</div>
              <div class="student-id">${esc(s.student_id)}</div>
              <div class="student-email">${esc(s.email||'')}</div>
            </div>
          </div>

          <!-- Futuristic 3D Face Profile HUD Box -->
          <div style="margin-top:14px; padding:12px 14px; background:rgba(5, 11, 24, 0.65); border-radius:12px; border:1px solid rgba(56, 189, 248, 0.2); backdrop-filter:blur(10px);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:10px; font-weight:800; letter-spacing:0.8px; color:var(--accent); text-transform:uppercase;">3D Face Profile</span>
              <span style="font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px; background:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder}; box-shadow:0 0 10px ${statusBg};">${prof.status} (${pct}%)</span>
            </div>
            <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:10px;">
              <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, var(--accent), #8B5CF6); border-radius:3px; box-shadow:0 0 12px var(--accent); transition:width 0.5s ease;"></div>
            </div>
            <div style="display:flex; gap:5px; flex-wrap:wrap;">
              ${poseBadges}
            </div>
          </div>

          <div class="student-stats" style="margin-top:12px;">
            ${vc > 0 ? `<span class="stat-chip alert">📱 ${vc} phone violation${vc===1?'':'s'}</span>` : ''}
            ${cc > 0 ? `<span class="stat-chip succ">👤 ${cc} check-in${cc===1?'':'s'}</span>` : ''}
          </div>

          <div class="student-card-actions">
            <button class="btn-card-action accent-glow" onclick="openEditStudentModal('${esc(s.student_id)}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Edit Profile
            </button>
            <button class="btn-card-action danger" onclick="confirmDeleteStudent('${esc(s.student_id)}', '${esc(s.name)}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Remove
            </button>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    if(c) c.innerHTML = `<div class="empty-state"><p>Unable to load members.</p></div>`;
  }
}

function renderVisitors() {
  const c = document.getElementById('visitorsContainer');
  if (!c) return;
  const filterType = document.getElementById('filterVisitorType')?.value || 'all';

  const visitors = S.detections.filter(d => {
    if (!isVisitor(d.student_id)) return false;
    const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';
    if (filterType === 'phone' && !isPhone) return false;
    if (filterType === 'face' && isPhone) return false;
    return true;
  });

  const lbl = document.getElementById('visitorsCountLabel');
  if (lbl) lbl.textContent = `${visitors.length} visitor event${visitors.length===1?'':'s'}`;

  if (visitors.length === 0) {
    c.innerHTML = `<div class="empty-state"><strong>No visitor detections logged</strong><p>Unregistered visitor face entries and phone alerts stream here.</p></div>`;
    return;
  }

  const rows = visitors.map(d => {
    const dt = fmtDT(d.created_at);
    const conf = (Number(d.confidence)*100).toFixed(1);
    const evUrl = d.evidence_path ? evidenceUrl(d.evidence_path) : null;
    const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';
    const tagHtml = isPhone
      ? `<span class="badge tag-visitor-alert"><span class="badge-dot"></span>⚠️ VISITOR PHONE ALERT</span>`
      : `<span class="badge tag-visitor-face"><span class="badge-dot"></span>👁️ VISITOR FACE ENTRY</span>`;

    return `
      <tr>
        <td class="cell-id">#${d.id}</td>
        <td>${tagHtml}</td>
        <td>${isPhone ? 'Cell Phone' : 'Face Entry'}</td>
        <td>${conf}%</td>
        <td>${dt.date}<br><small style="color:var(--text-mute)">${dt.time}</small></td>
        <td>${evUrl ? `<button class="btn btn-xs ${isPhone?'btn-danger':''}" onclick="openEvidModal('${encodeURIComponent(evUrl)}','Unregistered Visitor','${dt.full}','${conf}%','${esc(evUrl.split('/').pop())}')">View Evidence</button>` : '—'}</td>
      </tr>`;
  }).join('');

  c.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Visitor Tag</th><th>Event</th><th>Confidence</th><th>Timestamp (IST)</th><th>Evidence Capture</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

let webcamActionState = {
  stream: null,
  manualSnapTriggered: false,
  skipped: false,
  aborted: false
};

function triggerManualSnap() {
  webcamActionState.manualSnapTriggered = true;
}

function skipWebcamAndSubmit() {
  webcamActionState.skipped = true;
}

function abortWebcamRegistration() {
  webcamActionState.aborted = true;
}

function playShutterSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch(e) {}
}

async function submitRegistration(e) {
  e.preventDefault();
  const studentId = document.getElementById('regId').value.trim();
  const name      = document.getElementById('regName').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const fileInput = document.getElementById('regFace');
  if (!studentId || !name || !email) return false;

  const modal       = document.getElementById('webcamModal');
  const video       = document.getElementById('webcamVideo');
  const canvas      = document.getElementById('webcamCanvas');
  const statusTxt   = document.getElementById('webcamStatus');
  const countdownEl = document.getElementById('webcamCountdown');
  const flashEl     = document.getElementById('webcamFlash');
  const detailEl    = document.getElementById('webcamStudentDetail');

  webcamActionState = { stream: null, manualSnapTriggered: false, skipped: false, aborted: false };

  if (detailEl) detailEl.textContent = `3D Face Scan: ${studentId} · ${name}`;
  if (modal) modal.classList.add('active');

  // Poses to capture automatically in sequence
  const poseSteps = [
    { key: "front", label: "Step 1/5: Look directly FRONT at camera (0°)" },
    { key: "left",  label: "Step 2/5: Slowly turn head LEFT (-20°)" },
    { key: "right", label: "Step 3/5: Slowly turn head RIGHT (+20°)" },
    { key: "up",    label: "Step 4/5: Tilt head slightly UP (+15°)" },
    { key: "down",  label: "Step 5/5: Tilt head slightly DOWN (-15°)" }
  ];

  try {
    if (statusTxt) statusTxt.textContent = "Requesting device camera permission...";
    webcamActionState.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
    });
    video.srcObject = webcamActionState.stream;
    await new Promise(res => { video.onloadedmetadata = () => { video.play(); res(); }; });

    let isFirstStep = true;

    for (let stepIdx = 0; stepIdx < poseSteps.length; stepIdx++) {
      if (webcamActionState.skipped || webcamActionState.aborted) break;

      const step = poseSteps[stepIdx];
      if (statusTxt) statusTxt.textContent = step.label;
      if (detailEl) detailEl.textContent = `${studentId} · ${name} [${step.label}]`;

      for (let i = 3; i > 0; i--) {
        if (webcamActionState.manualSnapTriggered || webcamActionState.skipped || webcamActionState.aborted) break;
        if (countdownEl) {
          countdownEl.textContent = i;
          countdownEl.classList.add('show');
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      if (countdownEl) countdownEl.classList.remove('show');
      webcamActionState.manualSnapTriggered = false;

      if (webcamActionState.aborted) break;

      if (!webcamActionState.skipped) {
        if (flashEl) {
          flashEl.style.opacity = '0.95';
          setTimeout(() => flashEl.style.opacity = '0', 180);
        }
        playShutterSound();

        canvas.width  = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const capturedBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.95));

        if (capturedBlob) {
          if (isFirstStep) {
            // Step 1: Initial Profile Registration
            const formData = new FormData();
            formData.append('student_id', studentId);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('pose_category', step.key);
            formData.append('files', capturedBlob, `webcam_${studentId}_${step.key}.jpg`);

            if (registerSelectedFiles.length > 0) {
              registerSelectedFiles.forEach(f => formData.append('files', f));
            }

            const regRes = await fetch(`${API_BASE}/students/register`, { method: 'POST', body: formData });
            if (!regRes.ok) {
              const d = await regRes.json();
              throw new Error(d.detail || 'Registration failed');
            }
            isFirstStep = false;
          } else {
            // Steps 2-5: Multi-Pose Upload
            const upForm = new FormData();
            upForm.append('pose_category', step.key);
            upForm.append('files', capturedBlob, `webcam_${studentId}_${step.key}.jpg`);

            await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/upload-face`, {
              method: 'POST',
              body: upForm
            });
          }
        }
      }
    }

    if (webcamActionState.skipped && isFirstStep) {
      // If skipped without camera, submit text details only
      const formData = new FormData();
      formData.append('student_id', studentId);
      formData.append('name', name);
      formData.append('email', email);
      if (registerSelectedFiles.length > 0) {
        registerSelectedFiles.forEach(f => formData.append('files', f));
      }
      const regRes = await fetch(`${API_BASE}/students/register`, { method: 'POST', body: formData });
      if (!regRes.ok) {
        const d = await regRes.json();
        throw new Error(d.detail || 'Registration failed');
      }
    }

    if (!webcamActionState.aborted) {
      showToast('3D Registration Complete', `🎉 3D Face Profile for ${studentId} (${name}) registered successfully!`, 'success');
      playCheckinChime();
      resetRegisterForm();
      await loadStudents();
      goToSection('students');
    }
  } catch(err) {
    showToast('Registration Error', err.message, 'critical');
  } finally {
    if (webcamActionState.stream) {
      webcamActionState.stream.getTracks().forEach(t => t.stop());
    }
    video.srcObject = null;
    if (modal) modal.classList.remove('active');
  }
  return false;
}

function renderViolations() {
  const c = document.getElementById('violationsContainer');
  if (!c) return;
  const cat = document.getElementById('filterCategory')?.value || 'all';

  const list = S.detections.filter(d => {
    const unreg = isVisitor(d.student_id);
    const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';
    if (cat === 'reg_phone' && (unreg || !isPhone)) return false;
    if (cat === 'reg_face' && (unreg || isPhone)) return false;
    if (cat === 'unreg_phone' && (!unreg || !isPhone)) return false;
    if (cat === 'unreg_face' && (!unreg || isPhone)) return false;
    return true;
  });

  if (list.length === 0) {
    c.innerHTML = `<div class="empty-state"><strong>No events found</strong></div>`;
    return;
  }

  const rows = list.map(d => {
    const dt   = fmtDT(d.created_at);
    const conf = (Number(d.confidence)*100).toFixed(1);
    const evUrl= d.evidence_path ? evidenceUrl(d.evidence_path) : null;
    const unreg = isVisitor(d.student_id);
    const isPhone = (d.detection_type||'').toUpperCase() === 'PHONE_VIOLATION';

    let tagHtml = '';
    if (unreg && isPhone)       tagHtml = `<span class="badge tag-visitor-alert">⚠️ VISITOR PHONE ALERT</span>`;
    else if (unreg && !isPhone) tagHtml = `<span class="badge tag-visitor-face">👁️ VISITOR FACE ENTRY</span>`;
    else if (!unreg && isPhone) tagHtml = `<span class="badge tag-phone-violation">📱 MEMBER PHONE VIOLATION</span>`;
    else                        tagHtml = `<span class="badge tag-face-checkin">👤 MEMBER CHECK-IN</span>`;

    return `
      <tr>
        <td class="cell-id">#${d.id}</td>
        <td class="cell-strong">${unreg ? 'Unregistered Visitor' : esc(d.student_id)}</td>
        <td>${tagHtml}</td>
        <td>${conf}%</td>
        <td>${dt.date} · ${dt.time}</td>
        <td>${evUrl ? `<button class="btn btn-xs" onclick="openEvidModal('${encodeURIComponent(evUrl)}','${unreg ? 'Unregistered Visitor' : esc(d.student_id)}','${dt.full}','${conf}%','${esc(evUrl.split('/').pop())}')">View</button>` : '—'}</td>
      </tr>`;
  }).join('');

  c.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Person</th><th>Event Tag</th><th>Confidence</th><th>Timestamp (IST)</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function loadEvidence(silent) {
  const c = document.getElementById('evidenceGrid');
  try {
    const [evRes, detRes] = await Promise.all([
      fetch(`${API_BASE}/evidence/status`),
      fetch(`${API_BASE}/phone-detections`),
    ]);
    if (!evRes.ok) throw new Error('evidence');
    const evData  = await evRes.json();
    const detData = detRes.ok ? await detRes.json() : {detections:[]};
    const files   = evData.files    || [];
    const dets    = detData.detections || [];

    S.evidenceFiles = files;
    const detByFile = {};
    dets.forEach(d => {
      if (d.evidence_path) {
        const fn = d.evidence_path.replace(/\\/g,'/').split('/').pop();
        detByFile[fn] = d;
      }
    });

    const cnt = files.length;
    document.getElementById('kpiEvidence').textContent = cnt;
    document.getElementById('navEvidCount').textContent = cnt;
    setDot('hDotEvidence',null,true);

    if (silent || !c) { S.firstLoad = false; return; }

    const catFilter = document.getElementById('filterEvidCategory')?.value || 'all';

    const sorted = [...files].reverse().filter(file => {
      const det = detByFile[file.filename];
      const studentId = det?.student_id || (file.filename.includes('_UNKNOWN_') ? 'UNKNOWN' : 'MEMBER');
      const unreg = isVisitor(studentId);
      const isPhone = file.filename.startsWith('phone_') || (det?.detection_type === 'PHONE_VIOLATION');

      if (catFilter === 'reg_phone' && (unreg || !isPhone)) return false;
      if (catFilter === 'reg_face' && (unreg || isPhone)) return false;
      if (catFilter === 'unreg_phone' && (!unreg || !isPhone)) return false;
      if (catFilter === 'unreg_face' && (!unreg || isPhone)) return false;
      return true;
    }).slice(0, 48);

    if (sorted.length === 0) {
      c.innerHTML = `<div class="empty-state"><strong>No evidence snapshots</strong></div>`;
      S.firstLoad = false; return;
    }

    c.innerHTML = sorted.map(file => {
      const url    = evidenceUrlFromFilename(file.filename);
      const det    = detByFile[file.filename];
      const studentId = det?.student_id || (file.filename.includes('_UNKNOWN_') ? 'UNKNOWN' : 'MEMBER');
      const unreg    = isVisitor(studentId);
      const isPhone  = file.filename.startsWith('phone_') || (det?.detection_type === 'PHONE_VIOLATION');
      const dtStr    = det?.created_at ? fmtDT(det.created_at).full : '—';
      const conf     = det ? `${(Number(det.confidence)*100).toFixed(1)}%` : '—';
      const enc      = encodeURIComponent(url);

      let badgeHtml = '';
      if (unreg && isPhone)       badgeHtml = `<span class="badge tag-visitor-alert" style="font-size:9px;">⚠️ VISITOR PHONE</span>`;
      else if (unreg && !isPhone) badgeHtml = `<span class="badge tag-visitor-face" style="font-size:9px;">👁️ VISITOR FACE</span>`;
      else if (!unreg && isPhone) badgeHtml = `<span class="badge tag-phone-violation" style="font-size:9px;">📱 MEMBER PHONE</span>`;
      else                        badgeHtml = `<span class="badge tag-face-checkin" style="font-size:9px;">👤 MEMBER CHECK-IN</span>`;

      return `
        <div class="evidence-card ${unreg && isPhone ? 'visitor-alert' : ''}" onclick="openEvidModal('${enc}','${unreg ? 'Unregistered Visitor' : esc(studentId)}','${esc(dtStr)}','${esc(conf)}','${esc(file.filename)}')">
          <div class="evidence-thumb-wrap">
            <img class="evidence-thumb" src="${url}" alt="Evidence" loading="lazy" onerror="this.style.opacity='.15';this.src=''">
          </div>
          <div class="evidence-info">
            <div class="evidence-title">${badgeHtml}</div>
            <div class="evidence-student ${unreg ? 'visitor' : ''}">${unreg ? 'Unregistered Visitor' : esc(studentId)}</div>
            <div class="evidence-meta">${esc(file.filename)}</div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    if (c && !silent) c.innerHTML = `<div class="empty-state"><p>Unable to load evidence.</p></div>`;
  }
  S.firstLoad = false;
}

function openEvidModal(encUrl, studentId, time, conf, filename) {
  const url = decodeURIComponent(encUrl);
  document.getElementById('modalImage').src      = url;
  document.getElementById('modalStudent').textContent  = `Person: ${studentId}`;
  document.getElementById('modalFilename').textContent = filename;
  document.getElementById('modalTime').textContent     = time;
  document.getElementById('modalConf').textContent     = conf;
  document.getElementById('modalOpenLink').href        = url;
  document.getElementById('evidenceModal').classList.add('active');
}

function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

function pushNotification(n) {
  S.notifications.unshift(n);
  S.notifications = S.notifications.slice(0, 30);
  renderNotifications();
  document.getElementById('notifDot').style.display = 'block';
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (S.notifications.length === 0) { list.innerHTML = `<div class="empty-state"><p>No activity.</p></div>`; return; }
  list.innerHTML = S.notifications.map(n => {
    const dt = fmtDT(n.time);
    return `
      <div class="notif-item">
        <div class="notif-icon ${n.kind==='critical'?'crit':(n.kind==='warning'?'warn':'ok')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        </div>
        <div style="min-width:0;">
          <strong>${esc(n.title)}</strong>
          <p>${esc(n.msg)}</p>
          <time>${dt.full}</time>
        </div>
      </div>`;
  }).join('');
}

function toggleNotifPanel() {
  document.getElementById('notifPanel').classList.toggle('active');
  document.getElementById('notifDot').style.display = 'none';
}
function clearNotifs() { S.notifications=[]; renderNotifications(); }

function handleSearch(q) {
  q = q.trim().toLowerCase();
  if (!q) { document.querySelectorAll('.student-card, tbody tr, .evidence-card').forEach(e => e.style.display=''); return; }
  document.querySelectorAll('#studentsList .student-card').forEach(el => el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none');
  document.querySelectorAll('tbody tr').forEach(el => el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none');
  document.querySelectorAll('#evidenceGrid .evidence-card').forEach(el => el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none');
}

async function runHealthChecks() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const h = await res.json();
      setDot('hDotBackend', null, true);
      if(document.getElementById('hBackend')) document.getElementById('hBackend').textContent = 'Connected';
      if(document.getElementById('hBaseUrl')) document.getElementById('hBaseUrl').textContent = API_BASE;

      const dbOk = h.database === 'connected';
      setDot('hDotDb', 'lblDb', dbOk);
      setDot('dotDb', 'lblDb', dbOk);
      if(document.getElementById('hDb')) document.getElementById('hDb').textContent = dbOk ? 'Connected' : h.database;
      if(document.getElementById('hDbDetections')) document.getElementById('hDbDetections').textContent = h.total_detections ?? '—';

      setDot('hDotEvidence', null, true);
      if(document.getElementById('hEvidence')) document.getElementById('hEvidence').textContent = 'Operational';
      if(document.getElementById('hEvidenceFiles')) document.getElementById('hEvidenceFiles').textContent = h.evidence_files ?? '—';

      setDot('hDotDetections', null, true);
      if(document.getElementById('hDetections')) document.getElementById('hDetections').textContent = 'Active';
    } else {
      throw new Error('Health check error');
    }
  } catch(e) {
    setDot('hDotBackend', null, false);
    if(document.getElementById('hBackend')) document.getElementById('hBackend').textContent = 'Offline';
    setDot('hDotDb', 'lblDb', false);
    setDot('dotDb', 'lblDb', false);
    if(document.getElementById('hDb')) document.getElementById('hDb').textContent = 'Offline';
    setDot('hDotEvidence', null, false);
    if(document.getElementById('hEvidence')) document.getElementById('hEvidence').textContent = 'Unavailable';
    setDot('hDotDetections', null, false);
    if(document.getElementById('hDetections')) document.getElementById('hDetections').textContent = 'Offline';
  }
  await loadDashboard();
  await loadStudents();
  await loadDetections();
  await loadEvidence(true);
}

async function init() {
  await loadDashboard();
  await loadStudents();
  initRegisterDropzone();
  connectWebSocket();
  S.firstLoad = false;
}

setInterval(() => {
  loadDashboard();
  const active = document.querySelector('.section.active');
  if (!active) return;
  if (active.id === 'students')   loadStudents();
  if (active.id === 'visitors')   renderVisitors();
  if (active.id === 'violations') loadDetections().then(renderViolations);
  if (active.id === 'evidence')   loadEvidence();
  if (active.id === 'health')     runHealthChecks();
}, POLL_MS);

// ============================================================
// WEBSOCKET & AUDIO ALERT SYSTEM
// ============================================================
let audioAlertEnabled = true;
let ws = null;

function toggleAudioAlert() {
  audioAlertEnabled = !audioAlertEnabled;
  const pill = document.getElementById('audioPill');
  if (pill) {
    pill.classList.toggle('online', audioAlertEnabled);
    pill.classList.toggle('offline', !audioAlertEnabled);
    pill.querySelector('span:last-child').textContent = audioAlertEnabled ? 'Sound On' : 'Muted';
  }
  showToast('Audio Alert', audioAlertEnabled ? 'Sound alerts enabled.' : 'Sound alerts muted.', 'info');
}

function playSecuritySiren() {
  if (!audioAlertEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.30);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.32);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.33);
  } catch(e) {}
}

function playCheckinChime() {
  if (!audioAlertEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.26);
  } catch(e) {}
}

function connectWebSocket() {
  const loc = window.location;
  const wsProtocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${loc.hostname || '127.0.0.1'}:8000/ws`;

  try {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('⚡ WebSocket Live Telemetry Connected');
      const pill = document.getElementById('wsPill');
      if (pill) { pill.style.display = 'inline-flex'; }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_DETECTION' && payload.detection) {
          const d = payload.detection;
          if (!S.seenIds.has(d.id)) {
            S.seenIds.add(d.id);
            S.detections.unshift(d);

            const unreg = isVisitor(d.student_id);
            const isPhone = (d.detection_type || '').toUpperCase() === 'PHONE_VIOLATION';

            let title = 'Detection Alert';
            let msg = '';
            let kind = 'warning';

            if (unreg && isPhone)       { title = '⚠️ Visitor Phone Alert'; msg = `Unregistered visitor detected with phone (${(Number(d.confidence)*100).toFixed(1)}%)`; kind = 'critical'; playSecuritySiren(); }
            else if (unreg && !isPhone) { title = '👁️ Visitor Face Entry'; msg = `Unregistered visitor entered area (${(Number(d.confidence)*100).toFixed(1)}%)`; kind = 'warning'; playCheckinChime(); }
            else if (!unreg && isPhone){ title = '📱 Member Phone Violation'; msg = `${d.student_id} phone violation (${(Number(d.confidence)*100).toFixed(1)}%)`; kind = 'critical'; playSecuritySiren(); }
            else                        { title = '👤 Member Check-in'; msg = `${d.student_id} checked in`; kind = 'success'; playCheckinChime(); }

            pushNotification({ kind, title, msg, time: d.created_at });
            showToast(title, msg, kind);

            renderRecentDetections();
            renderActivityFeed();
            const active = document.querySelector('.section.active');
            if (active) {
              if (active.id === 'visitors') renderVisitors();
              if (active.id === 'violations') renderViolations();
              if (active.id === 'attendance') loadAttendance();
            }
          }
        }
      } catch(e) {}
    };

    ws.onclose = () => {
      const pill = document.getElementById('wsPill');
      if (pill) { pill.style.display = 'none'; }
      setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = () => {
      if (ws) ws.close();
    };
  } catch(e) {}
}

function exportCSV(category) {
  category = category || 'all';
  window.open(`${API_BASE}/reports/export?category=${encodeURIComponent(category)}`, '_blank');
}

async function markStudentCheckout(studentId) {
  if (!confirm(`Mark student "${studentId}" as departed/left college for today?`)) return;
  try {
    const formData = new FormData();
    formData.append('student_id', studentId);
    const res = await fetch(`${API_BASE}/attendance/checkout`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    showToast('Student Departed', `${studentId} marked as Left (${data.total_hours} hrs total stay).`, 'success');
    await loadAttendance();
  } catch(e) {
    showToast('Checkout Error', e.message, 'critical');
  }
}

async function loadAttendance() {
  const c = document.getElementById('attendanceContainer');
  try {
    const res = await fetch(`${API_BASE}/attendance/today`);
    if (!res.ok) throw new Error('attendance');
    const data = await res.json();
    const roster = data.roster || [];

    document.getElementById('attendanceDateLabel').textContent = data.date || 'Today';
    document.getElementById('attTotalCnt').textContent = data.total_enrolled || 0;
    document.getElementById('attPresentCnt').textContent = data.present_count || 0;
    document.getElementById('attAbsentCnt').textContent = data.absent_count || 0;

    if (roster.length === 0) {
      c.innerHTML = `<div class="empty-state"><strong>No members enrolled</strong><p>Register members to track daily attendance.</p></div>`;
      return;
    }

    const rows = roster.map(s => {
      const isPresent = s.status === 'PRESENT';
      const isDeparted = s.status === 'DEPARTED';
      const hasViolations = (s.violation_count || 0) > 0;
      let statusHtml = '';
      if (isDeparted) {
        statusHtml = `<span class="badge" style="background:rgba(139,92,246,0.12); color:#C4B5FD; border:1px solid rgba(139,92,246,0.3);"><span class="badge-dot" style="background:#8B5CF6;"></span>DEPARTED (${s.total_hours||0} hrs)</span>`;
      } else if (isPresent && hasViolations) {
        statusHtml = `<span class="badge tag-phone-violation"><span class="badge-dot"></span>PRESENT (${s.violation_count} Violation${s.violation_count===1?'':'s'})</span>`;
      } else if (isPresent) {
        statusHtml = `<span class="badge tag-face-checkin"><span class="badge-dot"></span>PRESENT</span>`;
      } else {
        statusHtml = `<span class="badge" style="background:rgba(239,68,68,0.1); color:#FCA5A5; border:1px solid rgba(239,68,68,0.3);"><span class="badge-dot" style="background:#EF4444;"></span>ABSENT</span>`;
      }

      const totalHrsStr = s.total_hours > 0 ? `${s.total_hours} hrs (${s.estimated_classes} Class${s.estimated_classes===1?'':'es'})` : '—';

      return `
        <tr>
          <td class="cell-strong">${esc(s.name)}<br><small style="color:var(--text-mute); font-family:var(--font-mono);">${esc(s.student_id)}</small></td>
          <td>${esc(s.email||'—')}</td>
          <td>${statusHtml}</td>
          <td>${s.first_seen}</td>
          <td>${s.last_seen}</td>
          <td style="font-weight:600; color:var(--text);">${totalHrsStr}</td>
          <td>
            ${isPresent ? `<button class="btn btn-xs btn-ghost" onclick="markStudentCheckout('${esc(s.student_id)}')" style="color:var(--accent); gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Mark Exit</button>` : (isDeparted ? `<small style="color:var(--text-mute);">Checked Out</small>` : '—')}
          </td>
        </tr>`;
    }).join('');

    c.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Member</th><th>Email</th><th>Status</th><th>Entry (IST)</th><th>Exit (IST)</th><th>Total Stay (Hours & Classes)</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } catch(e) {
    if (c) c.innerHTML = `<div class="empty-state"><p>Unable to load attendance roster.</p></div>`;
  }
}

// ============================================================
// ADMIN MEMBER EDIT & DELETE LOGIC
// ============================================================
let currentEditingStudent = null;
let editSelectedNewFiles = [];
let registerSelectedFiles = [];

function handleRegisterFilesSelected(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    registerSelectedFiles.push(files[i]);
  }
  renderRegisterFilePreviews();
}

function renderRegisterFilePreviews() {
  const container = document.getElementById('regFacePreviews');
  if (!container) return;
  if (registerSelectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = registerSelectedFiles.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="preview-thumb" onclick="event.stopPropagation()">
        <img src="${url}" alt="Preview">
        <button type="button" class="preview-remove" onclick="removeRegisterFile(event, ${idx})">&times;</button>
      </div>`;
  }).join('');
}

function removeRegisterFile(e, idx) {
  e.stopPropagation();
  registerSelectedFiles.splice(idx, 1);
  renderRegisterFilePreviews();
}

function resetRegisterForm() {
  document.getElementById('registerForm').reset();
  registerSelectedFiles = [];
  renderRegisterFilePreviews();
}

function initRegisterDropzone() {
  const dropzone = document.getElementById('regDropzone');
  if (!dropzone) return;
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleRegisterFilesSelected(dt.files);
    }
  });
}

function openEditStudentModal(studentId) {
  const student = S.students.find(s => s.student_id === studentId);
  if (!student) {
    showToast('Error', 'Student profile not found.', 'critical');
    return;
  }
  currentEditingStudent = student;
  editSelectedNewFiles = [];

  document.getElementById('editStudentId').value = student.student_id;
  document.getElementById('editModalStudentIdHeader').textContent = `${student.student_id} · ${student.name}`;
  document.getElementById('editStudentName').value = student.name || '';
  document.getElementById('editStudentEmail').value = student.email || '';

  renderEditFaceGrid(student);
  document.getElementById('editNewFacePreviews').innerHTML = '';
  document.getElementById('editStudentModal').classList.add('active');
}

function closeEditStudentModal() {
  document.getElementById('editStudentModal').classList.remove('active');
  currentEditingStudent = null;
  editSelectedNewFiles = [];
}

function renderEditFaceGrid(student) {
  const container = document.getElementById('editFaceGrid');
  const countLabel = document.getElementById('editFaceCountLabel');
  const faces = student.face_images || [];
  if (countLabel) countLabel.textContent = `(${faces.length} photo${faces.length === 1 ? '' : 's'})`;

  if (!faces || faces.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; color:var(--text-mute); font-size:12px; padding:6px 0;">No face photos enrolled yet. Snap a photo or upload files below.</div>`;
    return;
  }

  container.innerHTML = faces.map(f => `
    <div class="edit-face-item" title="${esc(f.filename)}">
      <img src="${API_BASE}${f.url}" alt="Face Image" onerror="this.src=''">
      <button type="button" class="edit-face-delete" onclick="deleteFacePhoto('${esc(student.student_id)}', '${esc(f.filename)}')" title="Delete this face photo">&times;</button>
    </div>
  `).join('');
}

async function deleteFacePhoto(studentId, filename) {
  if (!confirm(`Delete face photo "${filename}"?`)) return;
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/face/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    showToast('Photo Removed', `Face photo ${filename} deleted.`, 'success');

    if (currentEditingStudent && currentEditingStudent.student_id === studentId) {
      currentEditingStudent.face_images = data.face_images || [];
      if (data.avatar_url) currentEditingStudent.avatar_url = data.avatar_url;
      renderEditFaceGrid(currentEditingStudent);
    }
    await loadStudents();
  } catch(e) {
    showToast('Delete Error', e.message, 'critical');
  }
}

function handleEditFileSelect(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    editSelectedNewFiles.push(files[i]);
  }
  renderEditNewPreviews();
}

function renderEditNewPreviews() {
  const container = document.getElementById('editNewFacePreviews');
  if (editSelectedNewFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = editSelectedNewFiles.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="preview-thumb">
        <img src="${url}" alt="Preview">
        <button type="button" class="preview-remove" onclick="removeEditNewFile(${idx})">&times;</button>
      </div>`;
  }).join('');
}

function removeEditNewFile(idx) {
  editSelectedNewFiles.splice(idx, 1);
  renderEditNewPreviews();
}

async function startEditWebcamCapture() {
  if (!currentEditingStudent) return;
  const studentId = currentEditingStudent.student_id;
  const name = currentEditingStudent.name;

  const modal = document.getElementById('webcamModal');
  const video = document.getElementById('webcamVideo');
  const canvas = document.getElementById('webcamCanvas');
  const statusTxt = document.getElementById('webcamStatus');
  const countdownEl = document.getElementById('webcamCountdown');
  const flashEl = document.getElementById('webcamFlash');
  const detailEl = document.getElementById('webcamStudentDetail');

  webcamActionState = { stream: null, manualSnapTriggered: false, skipped: false, aborted: false };
  if (detailEl) detailEl.textContent = `${studentId} · ${name} (Adding Face Photo)`;
  if (modal) modal.classList.add('active');

  let capturedBlob = null;
  try {
    webcamActionState.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
    });
    video.srcObject = webcamActionState.stream;
    await new Promise(res => video.onloadedmetadata = () => { video.play(); res(); });

    if (statusTxt) statusTxt.textContent = "Position face inside frame. Auto-capturing photo...";
    for (let i = 3; i > 0; i--) {
      if (webcamActionState.manualSnapTriggered || webcamActionState.skipped || webcamActionState.aborted) break;
      if (countdownEl) { countdownEl.textContent = i; countdownEl.classList.add('show'); }
      await new Promise(r => setTimeout(r, 1000));
    }
    if (countdownEl) countdownEl.classList.remove('show');

    if (!webcamActionState.skipped && !webcamActionState.aborted) {
      if (statusTxt) statusTxt.textContent = "Capturing photo snapshot...";
      if (flashEl) { flashEl.style.opacity = '0.95'; setTimeout(() => flashEl.style.opacity = '0', 200); }
      playShutterSound();

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      capturedBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.95));
    }
  } catch(e) {
    showToast('Camera Error', e.message, 'warning');
  } finally {
    if (webcamActionState.stream) webcamActionState.stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
    if (modal) modal.classList.remove('active');
  }

  if (capturedBlob) {
    const file = new File([capturedBlob], `webcam_${studentId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
    editSelectedNewFiles.push(file);
    renderEditNewPreviews();
    showToast('Photo Captured', 'Webcam photo added to draft.', 'success');
  }
}

async function handleSaveStudentEdits(e) {
  e.preventDefault();
  if (!currentEditingStudent) return false;
  const studentId = currentEditingStudent.student_id;
  const name = document.getElementById('editStudentName').value.trim();
  const email = document.getElementById('editStudentEmail').value.trim();

  try {
    const formTxt = new FormData();
    formTxt.append('name', name);
    formTxt.append('email', email);

    const updateRes = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, {
      method: 'PUT',
      body: formTxt
    });
    if (!updateRes.ok) {
      const d = await updateRes.json();
      throw new Error(d.detail || 'Failed to update student profile');
    }

    if (editSelectedNewFiles.length > 0) {
      const uploadForm = new FormData();
      editSelectedNewFiles.forEach(f => uploadForm.append('files', f));
      const upRes = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/upload-face`, {
        method: 'POST',
        body: uploadForm
      });
      if (!upRes.ok) throw new Error('Failed to upload new face photos');
    }

    showToast('Profile Updated', `${studentId} · ${name} saved successfully.`, 'success');
    closeEditStudentModal();
    await loadStudents();
  } catch(err) {
    showToast('Save Error', err.message, 'critical');
  }
  return false;
}

async function confirmDeleteStudent(studentId, name) {
  if (!confirm(`Are you sure you want to permanently delete member "${name || studentId}" (${studentId})?\n\nThis will remove the student profile and all stored face embeddings.`)) return;
  try {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    showToast('Member Removed', `${studentId} removed from database.`, 'success');
    await loadDashboard();
    await loadStudents();
  } catch(err) {
    showToast('Delete Error', err.message, 'critical');
  }
}

function confirmDeleteStudentFromEditModal() {
  if (!currentEditingStudent) return;
  const sId = currentEditingStudent.student_id;
  const name = currentEditingStudent.name;
  closeEditStudentModal();
  confirmDeleteStudent(sId, name);
}

init();
