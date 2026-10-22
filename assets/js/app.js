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
  regular: "Information Department",
};

const ROLE_HOME = {
  superadmin: "dashboard.html",
  doctor: "dashboard.html",
  secretary: "dashboard.html",
  regular: "dashboard.html",
};

/* ------------------ NAV ICONS ------------------
   Monochrome line icons (stroke = currentColor, 1.75 weight, round caps).
   Clean Lucide-style geometry — legible down to 13px. */
const NAV_ICONS = {
  "📊": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/></svg>`,
  "🏥": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/><path d="M2 21h20"/><path d="M12 9v6M9 12h6"/><path d="M9 21v-4.5h6V21"/></svg>`,
  "👥": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.5"/><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><path d="M16.5 3.7a3.5 3.5 0 0 1 0 6.6"/><path d="M18 14.2a5 5 0 0 1 3.5 4.8V20"/></svg>`,
  "🗂️": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  "🗓️": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>`,
  "🧪": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.3"/><path d="M14 9.3V2"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.5 16h13"/></svg>`,
  "📈": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 18v-3"/><path d="M12 18v-6"/><path d="M16 18v-2"/></svg>`,
  "🗺️": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16"/><path d="M16 6v16"/></svg>`,
  "➕": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3.5"/><path d="M1.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><path d="M18.5 8v6"/><path d="M21.5 11h-6"/></svg>`,
  "🚶": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>`,
  "⏳": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
};

/* Stat-card icons — same visual language as the nav set (1.75 round strokes).
   Keyed by the emoji passed to statCard(); falls back to the raw emoji. */
const STAT_ICONS = {
  "👥": NAV_ICONS["👥"],
  "⏳": NAV_ICONS["⏳"],
  "💰": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01"/><path d="M18 12h.01"/></svg>`,
  "⚕️": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
  "📅": NAV_ICONS["🗓️"],
  "🗂️": NAV_ICONS["🗂️"],
  "🚶": NAV_ICONS["🚶"],
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
    { label: "Patient Referrals", icon: "🗂️", href: "patients.html" },
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
    { label: "Intake Queue", icon: "🚶", href: "queue.html" },
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
      <span class="ico">${NAV_ICONS[item.icon] || item.icon}</span><span>${item.label}</span>${badge}
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
          <div class="brand-name">Rever Medical Center, Inc.</div>
          <div class="brand-sub">Clinic Information System</div>
        </div>
      </a>
      <div class="appbar-actions">
        <button class="icon-btn" title="Notifications" onclick="App.toast('🔔','No new notifications')">🔔<span class="dot-badge"></span></button>
        <button class="icon-btn messenger-btn" type="button" title="Messenger" aria-label="Open clinic chatbot" aria-controls="chatbotModal" aria-expanded="false" onclick="App.toggleChat()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>
        </button>
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
  </div>
    <section class="chatbot-widget" id="chatbotModal" role="dialog" aria-modal="false" aria-labelledby="chatbotTitle" aria-hidden="true" hidden>
      <div class="chatbot-head">
        <div><strong id="chatbotTitle">Clinic Assistant</strong><span>Karaniwang tulong sa paggamit ng system</span></div>
        <button class="chatbot-close" type="button" aria-label="Close chatbot" onclick="App.toggleChat(false)">×</button>
      </div>
      <div class="chatbot-messages" id="chatbotMessages" role="log" aria-live="polite">
        <div class="chat-message bot">Kumusta! Maaari akong tumulong sa registration, queue, schedules, at clinic services.</div>
      </div>
      <form class="chatbot-form" onsubmit="return App.sendChatMessage(event)">
        <label class="sr-only" for="chatbotInput">Message the clinic assistant</label>
        <input id="chatbotInput" type="text" maxlength="500" placeholder="I-type ang iyong tanong..." autocomplete="off" required />
        <button class="btn btn-primary" type="submit" aria-label="Send message">Send</button>
      </form>
    </section>
  `;
  wireResponsiveTables();
  renderToastHost();
  wireNavFit();
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("chatbotModal").hidden) App.toggleChat(false);
  });
}

function wireResponsiveTables() {
  const labelTables = (root) => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("table.tbl").forEach((table) => {
      const labels = Array.from(table.querySelectorAll("thead th"), (th) => th.textContent.trim());
      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (cell.tagName !== "TD") return;
          cell.setAttribute("data-label", cell.hasAttribute("colspan") ? "" : (labels[index] || ""));
        });
      });
    });
  };
  const pageContent = document.getElementById("pageContent");
  labelTables(pageContent);
  if (pageContent && typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => labelTables(pageContent));
    observer.observe(pageContent, { childList: true, subtree: true });
  }
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
  toggleChat(forceOpen) {
    const panel = document.getElementById("chatbotModal");
    const button = document.querySelector(".messenger-btn");
    if (!panel || !button) return;
    const isOpen = forceOpen === undefined ? panel.hidden : !!forceOpen;
    panel.hidden = !isOpen;
    panel.setAttribute("aria-hidden", String(!isOpen));
    button.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) document.getElementById("chatbotInput").focus();
    else button.focus();
  },
  sendChatMessage(event) {
    event.preventDefault();
    const input = document.getElementById("chatbotInput");
    const messages = document.getElementById("chatbotMessages");
    const text = input.value.trim();
    if (!text) return false;

    const addMessage = (message, className) => {
      const item = document.createElement("div");
      item.className = "chat-message " + className;
      item.textContent = message;
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
    };
    addMessage(text, "user");
    input.value = "";
    const question = text.toLowerCase();
    let reply = "Makakatulong ako sa registration, queue, schedules, at clinic services. Subukan ang isa sa mga paksang ito.";
    if (question.includes("register") || question.includes("patient")) {
      reply = "Para mag-register, buksan ang Register Patient o Register Walk-in sa navigation at kumpletuhin ang mga required field.";
    } else if (question.includes("queue") || question.includes("status")) {
      reply = "Makikita ang mga pasyente sa Intake Queue o Waiting Room depende sa iyong role.";
    } else if (question.includes("schedule") || question.includes("doctor")) {
      reply = "Buksan ang Doctor Schedules sa navigation para makita ang nakatalagang iskedyul.";
    } else if (question.includes("service") || question.includes("fee") || question.includes("price")) {
      reply = "Buksan ang Services & Pricing sa navigation para makita ang mga serbisyo at bayarin.";
    } else if (question.includes("emergency") || question.includes("urgent")) {
      reply = "Para sa emergency o agarang medical concern, tawagan o puntahan agad ang clinic; hindi kapalit ng medical advice ang chatbot na ito.";
    }
    setTimeout(() => addMessage(reply, "bot"), 250);
    return false;
  },
  async logout() {
    const yes = await this.confirm({
      icon: "🚪",
      title: "Mag-log out",
      message: "Gusto mo bang mag-log out ngayon? Mawawala ang iyong kasalukuyang session.",
      okLabel: "Oo, log out",
      cancelLabel: "Manatili",
      danger: true,
    });
    if (yes) {
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

  /* Custom confirmation popup — replaces native confirm().
     Returns Promise<boolean>: true = OK, false = cancel / ESC / backdrop click.
     Options: { icon, title, message, okLabel, cancelLabel, danger, hideCancel } */
  confirm(opts) {
    const o = Object.assign({
      icon: "❓", title: "Kumpirmahin", message: "",
      okLabel: "Oo, ituloy", cancelLabel: "Kanselahin",
      danger: false, hideCancel: false,
    }, opts || {});
    return new Promise((resolve) => {
      // Dismiss any popup that is already open (never leak an unresolved promise)
      const old = document.getElementById("cfmBackdrop");
      if (old) { if (old._dismiss) old._dismiss(); else if (old.parentNode) old.parentNode.removeChild(old); }

      const bd = document.createElement("div");
      bd.id = "cfmBackdrop";
      bd.className = "cfm-backdrop";
      bd.innerHTML =
        '<div class="cfm-modal" role="alertdialog" aria-modal="true" aria-labelledby="cfmTitle">' +
          '<div class="cfm-ico"></div>' +
          '<h3 class="cfm-title" id="cfmTitle"></h3>' +
          '<p class="cfm-msg"></p>' +
          '<div class="cfm-actions">' +
            '<button type="button" class="btn btn-outline cfm-cancel"></button>' +
            '<button type="button" class="btn cfm-ok"></button>' +
          '</div>' +
        '</div>';
      const modalEl = bd.querySelector(".cfm-modal");
      bd.querySelector(".cfm-ico").textContent = o.icon;
      bd.querySelector(".cfm-title").textContent = o.title;
      bd.querySelector(".cfm-msg").textContent = o.message;
      const btnCancel = bd.querySelector(".cfm-cancel");
      const btnOk = bd.querySelector(".cfm-ok");
      btnCancel.textContent = o.cancelLabel;
      btnOk.textContent = o.okLabel;
      modalEl.classList.toggle("cfm-danger", !!o.danger);
      btnOk.classList.add(o.danger ? "btn-danger" : "btn-primary");
      if (o.hideCancel) btnCancel.style.display = "none";

      let settled = false;
      const done = (val) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKey);
        if (bd.parentNode) bd.parentNode.removeChild(bd);
        resolve(!!val);
      };
      bd._dismiss = () => done(false);
      const onKey = (e) => { if (e.key === "Escape") done(false); };
      btnOk.addEventListener("click", () => done(true));
      btnCancel.addEventListener("click", () => done(false));
      bd.addEventListener("click", (e) => { if (e.target === bd) done(false); });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(bd);
      setTimeout(() => bd.classList.add("open"), 10);
      setTimeout(() => { if (o.hideCancel) btnOk.focus(); else btnCancel.focus(); }, 60);
    });
  },

  /* Single-button popup — replaces native alert(). */
  alert(message, opts) {
    return this.confirm(Object.assign({
      icon: "ℹ️", title: "Paunawa", message: message,
      okLabel: "Sige", hideCancel: true, danger: false,
    }, opts || {}));
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
     Used by medical abstract, patient record, schedules, and services sheets.
     Waits for images (e.g. the clinic logo) to finish loading first, so the
     preview never captures a missing image. Guards against DOUBLE print: only
     one window.print() can ever fire per call, and the safety timer is cleared
     as soon as printing starts (otherwise cancelling the first dialog would let
     the overdue timeout fire a second popup). */
  printSheet(html) {
    let area = document.getElementById("printArea");
    if (!area) { area = document.createElement("div"); area.id = "printArea"; document.body.appendChild(area); }
    if (area.classList) area.classList.remove("print-fit-one-page", "print-fit-schedule", "print-fit-abstract");
    if (area.style && area.style.removeProperty) area.style.removeProperty("--print-scale");
    if (area.style && area.style.removeProperty) area.style.removeProperty("--abstract-print-scale");
    area.innerHTML = html;
    const fitSheet = area.querySelector ? area.querySelector(".ab-sheet") : null;
    const fitAbstract = area.querySelector ? area.querySelector(".ab-abstract-sheet") : null;
    const fitWrap  = area.querySelector ? area.querySelector(".p-fit-wrap") : null;
    if (fitSheet || fitWrap) { if (area.classList) area.classList.add("print-fit-one-page"); }
    if (fitAbstract && area.classList) area.classList.add("print-fit-abstract");
    if (fitWrap && area.classList) area.classList.add("print-fit-schedule");
    const imgs = Array.prototype.slice.call(area.querySelectorAll("img"));
    let printed = false;
    let timer = null;
    const go = () => {
      if (printed) return;            // one print per call — never double-pop
      printed = true;
      if (timer) clearTimeout(timer);  // cancel the safety net

      // --- Doctor schedule (.p-fit-wrap): shrink oversized content to fit one A4 page ---
      if (fitWrap && area.style && area.style.setProperty) {
        const previousStyle = area.getAttribute("style");
        area.style.cssText = "position:fixed;display:block;visibility:hidden;left:-10000px;top:0;width:202mm;";
        const fitInner = area.querySelector(".p-fit-inner");
        const contentWidth  = fitInner ? fitInner.scrollWidth  : fitWrap.scrollWidth;
        const contentHeight = fitInner ? fitInner.scrollHeight : fitWrap.scrollHeight;
        const usableWidth  = 202 * (96 / 25.4);  // A4 210mm − 4mm L − 4mm R  ≈ 202mm
        const usableHeight = 291 * (96 / 25.4);  // A4 297mm − 3mm T − 3mm B ≈ 291mm
        const scaleW = contentWidth  > 0 ? usableWidth  / contentWidth  : 1;
        const scaleH = contentHeight > 0 ? usableHeight / contentHeight : 1;
        let scale;
        if (scaleW >= 1) {
          // Width already fits (2-col layout is full width) → scale by HEIGHT to fill page
          scale = scaleH;
        } else {
          // Content too wide → scale down to fit both dimensions
          scale = Math.min(scaleW, scaleH);
        }
        scale = Math.max(0.3, Math.min(6, scale));
        if (previousStyle === null) area.removeAttribute("style");
        else area.setAttribute("style", previousStyle);
        area.style.setProperty("--print-scale", String(scale));
      }

      // Keep the medical abstract on one A4 page, scaling only when its content
      // exceeds the printable height. Other record sheets retain natural flow.
      if (fitAbstract && area.style && area.style.setProperty) {
        const previousStyle = area.getAttribute("style");
        area.style.cssText = "position:fixed;display:block;visibility:hidden;left:-10000px;top:0;width:202mm;";
        const contentHeight = fitAbstract.scrollHeight;
        const usableHeight = 291 * (96 / 25.4);
        const scale = contentHeight > usableHeight
          ? Math.min(1, (usableHeight / contentHeight) * 0.98)
          : 1;
        if (previousStyle === null) area.removeAttribute("style");
        else area.setAttribute("style", previousStyle);
        area.style.setProperty("--abstract-print-scale", String(scale));
      }

      window.print();
    };
    if (!imgs.length) { go(); return; }
    let left = imgs.length;
    const imgDone = () => { left -= 1; if (left <= 0) go(); };
    // Safety net FIRST, so a synchronous image hit (below) can clear it.
    timer = setTimeout(go, 1200);
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth) imgDone();
      else { img.onload = imgDone; img.onerror = imgDone; }
    });
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
