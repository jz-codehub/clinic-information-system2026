/* ============================================================
   Rever Medical Center — App Shell
   Role-based navigation, layout rendering, auth guard, UI helpers.
   Loaded on every page AFTER data.js
   ============================================================ */

/* ------------------ ROLE METADATA ------------------ */
const ROLE_LABEL = {
  superadmin: "Super Admin",
  doctor: "Doctor",
  secretary: "Secretary",
  regular: "Regular User",
};

const ROLE_HOME = {
  superadmin: "dashboard.html",
  doctor: "dashboard.html",
  secretary: "dashboard.html",
  regular: "dashboard.html",
};

/* ------------------ NAVIGATION CONFIG ------------------
   Each role gets its own sidebar sections. Items support an
   optional `badge` function returning a count string.
--------------------------------------------------------- */
const NAV = {
  superadmin: [
    { section: "Overview" },
    { label: "Dashboard", icon: "📊", href: "dashboard.html" },
    { section: "Management" },
    { label: "Clinic Rooms", icon: "🏥", href: "clinics.html" },
    { label: "Staff & Users", icon: "👥", href: "users.html" },
    { label: "All Patients", icon: "🗂️", href: "patients.html" },
    { label: "Doctor Schedules", icon: "🗓️", href: "schedules.html" },
    { label: "Services & Pricing", icon: "🧪", href: "services.html" },
    { section: "Reports" },
    { label: "Reports & Income", icon: "📈", href: "reports.html" },
    { section: "Facilities" },
    { label: "Guide Map", icon: "🗺️", href: "guide-map.html" },
  ],
  regular: [
    { section: "Overview" },
    { label: "Dashboard", icon: "📊", href: "dashboard.html" },
    { section: "Patient Intake" },
    { label: "Register Patient", icon: "➕", href: "register-patient.html" },
    { label: "My Registrations", icon: "🗂️", href: "patients.html" },
    { label: "Doctor Schedules", icon: "🗓️", href: "schedules.html" },
    { label: "Services & Pricing", icon: "🧪", href: "services.html" },
    { section: "Facilities" },
    { label: "Guide Map", icon: "🗺️", href: "guide-map.html" },
  ],
  secretary: [
    { section: "Overview" },
    { label: "Dashboard", icon: "📊", href: "dashboard.html" },
    { section: "Clinic Desk" },
    { label: "Register Walk-in", icon: "➕", href: "register-patient.html" },
    { label: "Walk-in Queue", icon: "🚶", href: "queue.html" },
    { label: "Patient Records", icon: "🗂️", href: "patients.html" },
    { section: "Clinic Schedule" },
    { label: "My Clinic", icon: "🏥", href: "myclinic.html" },
    { label: "Doctor Schedules", icon: "🗓️", href: "schedules.html" },
    { label: "Services & Pricing", icon: "🧪", href: "services.html" },
    { section: "Reports" },
    { label: "Clinic Reports", icon: "📈", href: "reports.html" },
    { section: "Facilities" },
    { label: "Guide Map", icon: "🗺️", href: "guide-map.html" },
  ],
  doctor: [
    { section: "Overview" },
    { label: "Dashboard", icon: "📊", href: "dashboard.html" },
    { section: "Consultation" },
    { label: "Waiting Room", icon: "⏳", href: "queue.html" },
    { label: "Patient Records", icon: "🗂️", href: "patients.html" },
    { section: "Schedule" },
    { label: "Doctor Schedules", icon: "🗓️", href: "schedules.html" },
    { label: "Services & Pricing", icon: "🧪", href: "services.html" },
    { section: "Facilities" },
    { label: "Guide Map", icon: "🗺️", href: "guide-map.html" },
  ],
};

/* ------------------ AUTH GUARD ------------------ */
function requireAuth(allowedRoles) {
  DB.init();
  const session = DB.session();
  if (!session) {
    window.location.replace("../index.html");
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // wrong role -> bounce to their own dashboard
    window.location.replace(ROLE_HOME[session.role] || "dashboard.html");
    return null;
  }
  return session;
}

/* ------------------ LAYOUT RENDER ------------------ */
function renderLayout(opts) {
  const session = DB.session();
  if (!session) { window.location.replace("../index.html"); return; }

  const role = session.role;
  const currentPage = (opts && opts.page) || (location.pathname.split("/").pop() || "dashboard.html");
  const navItems = NAV[role] || [];

  // Count pending items for badges
  let queueCount = 0;
  if (role === "secretary") {
    queueCount = DB.patients.byStatus(STATUS.TRANSFERRED).length;
  } else if (role === "doctor") {
    queueCount = DB.patients.byStatus(STATUS.WAITING_DOCTOR).length;
  }

  const navHtml = navItems
    .filter((item) => !item.section) // section labels are only used by the legacy sidebar
    .map((item) => {
    const active = item.href === currentPage ? "active" : "";
    let badge = "";
    if ((item.href === "queue.html") && queueCount > 0) {
      badge = `<span class="badge-count">${queueCount}</span>`;
    }
    return `<a class="nav-item ${active}" href="${item.href}">
      <span class="ico">${item.icon}</span><span>${item.label}</span>${badge}
    </a>`;
  }).join("");

  const pageTitle = (opts && opts.title) || "Dashboard";
  const pageSub = (opts && opts.subtitle) || "";
  const pageActions = (opts && opts.actions) || "";
  const shell = `
  <header class="appbar">
    <div class="appbar-row appbar-row--top">
      <a class="appbar-brand" href="dashboard.html">
        <div class="logo-mark"><img src="../assets/images/rmci-logo.jpg" alt="Rever Medical Center" /></div>
        <div class="appbar-brand-text">
          <div class="brand-name">Rever Medical Center</div>
          <div class="brand-sub">Clinic Information System</div>
        </div>
      </a>
      <div class="topbar-search">
        <span class="s-ico">🔍</span>
        <input type="text" placeholder="Search patients, records..." onkeydown="if(event.key==='Enter')App.quickSearch(this.value)">
      </div>
      <div class="appbar-actions">
        <button class="icon-btn" title="Notifications" onclick="App.toast('🔔','No new notifications')">🔔<span class="dot-badge"></span></button>
        <div class="user-menu">
          <div class="avatar">${initials(session.name)}</div>
          <div class="u-meta">
            <div class="u-name">${session.name}</div>
            <div class="u-role">${ROLE_LABEL[role]}</div>
          </div>
        </div>
        <button class="icon-btn" title="Log out" onclick="App.logout()">↪</button>
      </div>
    </div>
    <div class="appbar-row appbar-row--nav">
      <button class="appbar-toggle" id="appbarToggle" onclick="App.toggleNav()" aria-label="Menu">☰</button>
      <nav class="appbar-nav" id="appbarNav">${navHtml}</nav>
    </div>
  </header>
  <div class="overlay-nav" id="overlayNav" onclick="App.toggleNav()"></div>
  <div class="main">
    <div class="pagebar">
      <div class="pagebar-titles">
        <h1 class="pagebar-title">${pageTitle}</h1>
        ${pageSub ? `<p class="pagebar-sub">${pageSub}</p>` : ""}
      </div>
      ${pageActions ? `<div class="pagebar-actions">${pageActions}</div>` : ""}
    </div>
    <main class="content" id="pageContent">
  `;

  document.body.innerHTML = shell + (opts && opts.content ? opts.content : "") + `</main>
    <footer class="app-footer">
      <div class="app-footer-inner">
        <p class="af-line af-copy">&copy; 2026 Johnzynd. All Rights Reserved.</p>
        <p class="af-line">This website, including its original design, layout, graphics, and code, was created and developed by Johnzynd.</p>
        <p class="af-line">Unauthorized copying, reproduction, modification, or redistribution of this website or its original content is prohibited without prior permission.</p>
      </div>
    </footer>
  </div>`;
  renderToastHost();
  wireNavFit();
}

/* ------------------ NAVBAR AUTO-FIT ------------------
   Long role menus (Super Admin = 8 items, Secretary = 9) would overflow the
   nav row on smaller screens. Instead of scrolling or wrapping, we shrink the
   nav items (via the centralized data-nav-fit levels in CSS) until they fit.
   Level 0 = roomiest (:root defaults). Falls back to sideways scroll only if
   even the most compact level can't fit. */
const NAV_FIT_LEVELS = 3; // keep in sync with the .appbar[data-nav-fit] rules in style.css

function wireNavFit() {
  const nav = document.getElementById("appbarNav");
  const bar = document.querySelector(".appbar");
  if (!nav || !bar) return;

  let raf = 0;
  const compute = () => {
    // Only auto-fit when the nav is the inline desktop row (not the mobile dropdown).
    const pos = (typeof getComputedStyle === "function") ? getComputedStyle(nav).position : "";
    if (pos === "absolute") { bar.setAttribute("data-nav-fit", "0"); return; }
    let level = 0;
    for (let lvl = 0; lvl <= NAV_FIT_LEVELS; lvl++) {
      bar.setAttribute("data-nav-fit", lvl);
      if (nav.scrollWidth <= nav.clientWidth + 1) { level = lvl; break; } // roomiest that fits
      level = lvl; // otherwise keep the most compact tried so far
    }
    bar.setAttribute("data-nav-fit", level);
  };

  compute();
  window.addEventListener("resize", () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(compute);
  });
}

function renderToastHost() {
  if (document.getElementById("toastHost")) return;
  const t = document.createElement("div");
  t.className = "toast"; t.id = "toastHost";
  t.innerHTML = `<span class="t-ico"></span><span class="t-msg"></span>`;
  document.body.appendChild(t);
}

/* ------------------ APP HELPERS ------------------ */
const App = {
  logout() {
    if (confirm("Log out ngayon?")) {
      DB.logout();
      window.location.href = "../index.html";
    }
  },
  toggleNav() {
    const nav = document.getElementById("appbarNav");
    const overlay = document.getElementById("overlayNav");
    const btn = document.getElementById("appbarToggle");
    if (nav) nav.classList.toggle("open");
    if (overlay) overlay.classList.toggle("open");
    if (btn) btn.textContent = nav && nav.classList.contains("open") ? "✕" : "☰";
  },
  toast(icon, message) {
    renderToastHost();
    const host = document.getElementById("toastHost");
    host.querySelector(".t-ico").textContent = icon || "✅";
    host.querySelector(".t-msg").textContent = message || "";
    host.classList.add("show");
    clearTimeout(host._t);
    host._t = setTimeout(() => host.classList.remove("show"), 2600);
  },
  quickSearch(q) {
    if (q && q.trim()) this.toast("🔍", `Searching for "${q.trim()}"...`);
  },

  /* Modal helpers */
  openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add("open");
  },
  closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove("open");
  },

  /* Status badge html */
  statusBadge(status) {
    const meta = STATUS_META[status] || { label: status, badge: "badge-muted" };
    return `<span class="badge ${meta.badge}">${meta.label}</span>`;
  },

  /* Yes/No pill */
  ynPill(val) {
    return val ? `<span class="yes-pill">Yes</span>` : `<span class="no-pill">No</span>`;
  },

  /* Render arbitrary HTML into a hidden #printArea and trigger browser print.
     Used by medical abstract, schedules, and services pricing sheets.
     Waits for images (e.g. the clinic logo) to finish loading first, otherwise
     the print preview can capture a missing/broken image. */
  printSheet(html) {
    let area = document.getElementById("printArea");
    if (!area) { area = document.createElement("div"); area.id = "printArea"; document.body.appendChild(area); }
    area.innerHTML = html;
    const imgs = Array.prototype.slice.call(area.querySelectorAll("img"));
    const go = () => window.print();
    if (!imgs.length) { go(); return; }
    let left = imgs.length;
    const done = () => { left -= 1; if (left <= 0) go(); };
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth) done();
      else { img.onload = done; img.onerror = done; }
    });
    // Safety net: never block printing longer than ~1.2s if an image stalls.
    setTimeout(go, 1200);
  },

  /* Patient flow steps: Registered -> Vitals -> Consultation -> Done */
  flowSteps(status) {
    const steps = [
      { key: "registered", label: "Registered", done: true },
      { key: "vitals", label: "Vitals", done: status !== STATUS.TRANSFERRED && status !== STATUS.WITH_SECRETARY },
      { key: "consult", label: "Consultation", done: status === STATUS.COMPLETED },
      { key: "done", label: "Completed", done: status === STATUS.COMPLETED },
    ];
    const currentIndex =
      status === STATUS.TRANSFERRED ? 1 :
      status === STATUS.WITH_SECRETARY ? 1 :
      status === STATUS.WAITING_DOCTOR ? 2 : 3;

    let html = "";
    steps.forEach((s, i) => {
      const cls = s.done ? "done" : (i === currentIndex ? "current" : "");
      const ico = s.done ? "✓" : (i + 1);
      html += `<div class="flow-step ${cls}"><div class="fs-dot">${ico}</div><div class="fs-label">${s.label}</div></div>`;
      if (i < steps.length - 1) html += `<div class="flow-line ${s.done ? "done" : ""}"></div>`;
    });
    return `<div class="flow-steps">${html}</div>`;
  },

  /* Escape HTML for safety */
  esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  },

  /* ---------- Activity-growth helpers ----------
     dailySeries(patients, days, field) -> counts per day for last N days.
     Used by reports & dashboards to show growth over time. */
  dailySeries(patients, days, field) {
    const key = field || "registeredAt";
    const counts = {};
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      counts[d.toISOString().slice(0, 10)] = 0;
    }
    patients.forEach((p) => {
      const raw = key === "registeredAt" ? p.registeredAt : (p.consultation && p.consultation.date);
      const k = (raw || "").slice(0, 10);
      if (k in counts) counts[k] += 1;
    });
    return Object.keys(counts).map((d) => ({
      date: d,
      label: new Date(d + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      weekday: new Date(d + "T00:00:00").toLocaleDateString("en-PH", { weekday: "short" }),
      value: counts[d],
    }));
  },

  /* Vertical bar chart (pure CSS) from a dailySeries result. */
  barChart(series, opts) {
    const o = opts || {};
    const color = o.color || "var(--primary)";
    if (!series || !series.length) return `<div class="empty"><div class="e-ico">📉</div><h4>No data</h4><p>Wala pang aktibidad sa napiling panahon.</p></div>`;
    const max = Math.max(1, ...series.map((s) => s.value));
    const bars = series.map((s, i) => {
      const pct = Math.round((s.value / max) * 100);
      const isToday = i === series.length - 1;
      return `<div class="bc-col" title="${s.label}: ${s.value}">
        <div class="bc-val">${s.value || ""}</div>
        <div class="bc-track"><div class="bc-fill ${isToday ? "bc-today" : ""}" style="height:${pct}%;${!isToday ? `background:${color}` : ""}"></div></div>
        <div class="bc-x">${s.weekday}</div>
      </div>`;
    }).join("");
    return `<div class="bar-chart">${bars}</div>`;
  },
};

/* Close modals on backdrop click & ESC */
document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal-backdrop")) {
    e.target.classList.remove("open");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
});
