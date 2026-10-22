/* ============================================================
   Rever Medical Center — Doctor Schedules data layer
   Shared by:
     • pages/schedules.html  (read-only: who is available, when)
     • pages/myclinic.html   (secretary edits their own clinic's doctors)
   Persisted in localStorage. Designed to be swapped for Supabase
   later, exactly like data.js. Load AFTER data.js / app.js.
   ============================================================ */

const SCHED_STORE = "rmc_schedule_v5";
const SCHED_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* Real Rever Medical Center roster (seeded only when nothing is stored yet).
   Updated with the new doctor roster: full names, secretaries & secretary numbers,
   specialty/department, and room numbers (see data.js users + clinic rooms). */
function seedSchedule() {
  return {
    Monday: [
      { n: "Dr. Ruel B. Atun", t: "9:00 AM - 12:00 PM", s: "Family Medicine" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "8:00 AM - 10:00 AM", s: "Internal Medicine" },
      { n: "Dr. Abegail Carmie L. Taruc", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Regine A. Dollaga", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Ron Joseph Moreno", t: "12:00 PM - 3:00 PM", s: "Ophthalmology" },
      { n: "Dr. Nathalie Mundo", t: "9:00 AM - 11:00 AM", s: "ENT" },
      { n: "Dr. Richard Dl. Quing", t: "9:00 AM - 12:00 PM", s: "Surgery – General Surgeon" },
      { n: "Dr. John Noriel Lamigue", t: "3:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Hakan Anthony Oztemiz, MD, DPCP", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "2:00 PM - 4:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", t: "9:00 AM - 11:00 AM", s: "ENT" },
      { n: "Dr. Elaine G. Flores", t: "2:00 PM - 4:30 PM", s: "ENT" },
    ],
    Tuesday: [
      { n: "Dr. Vivian S. Adique", t: "2:00 PM - 5:00 PM", s: "Family Medicine" },
      { n: "Dr. Ronald Carlos L. Amantiad", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Georgina Gladdlys B. Labis-Tamsi", t: "1:00 PM - 4:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Geenen T. Macadaeg", t: "9:00 AM - 12:00 PM", s: "Pediatrics" },
      { n: "Dr. Stricklyn Paasa", t: "10:00 AM - 2:00 PM", s: "Ophthalmology" },
      { n: "Dr. Wilhelma M. Villan", t: "10:00 AM - 12:00 PM", s: "ENT" },
      { n: "Dr. Edgar Shaun W. Rey Inres", t: "2:00 PM - 5:00 PM", s: "Surgery – General Surgeon" },
      { n: "Dr. John Noriel Lamigue", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Regine A. Dollaga", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "3:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "2:00 PM - 4:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", t: "9:00 AM - 11:00 AM", s: "ENT" },
      { n: "Dr. Elaine G. Flores", t: "2:00 PM - 4:30 PM", s: "ENT" },
    ],
    Wednesday: [
      { n: "Dr. Vivian S. Adique", t: "9:30 AM - 11:30 AM", s: "Family Medicine" },
      { n: "Dr. John Noriel P. Lamique", t: "3:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Joanne R. Boloncio", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Rona O. Ortenio", t: "1:00 PM - 4:00 PM", s: "Pediatrics" },
      { n: "Dr. Joanne Concepcion", t: "10:00 AM - 2:00 PM", s: "Ophthalmology" },
      { n: "Dr. Larson E. Taruc", t: "2:00 PM - 5:00 PM", s: "ENT" },
      { n: "Dr. Jobert Dale Chan", t: "9:00 AM - 12:00 PM", s: "Surgery – Orthopedic" },
      { n: "Dr. Zhy Andrea G. Murillo", t: "1:30 PM - 3:30 PM", s: "Internal Medicine" },
      { n: "Dr. Ruel B. Atun", t: "1:00 PM - 5:00 PM", s: "Family Medicine" },
      { n: "Dr. Hakan Anthony Oztemiz, MD, DPCP", t: "9:00 AM - 1:00 PM", s: "Internal Medicine" },
      { n: "Dr. Regine A. Dollaga", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "8:00 AM - 10:00 AM", s: "Internal Medicine" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "2:00 PM - 4:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Nathalie Mundo", t: "9:00 AM - 11:00 AM", s: "ENT" },
    ],
    Thursday: [
      { n: "Dr. Ruel B. Atun", t: "1:00 PM - 5:00 PM", s: "Family Medicine" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Anna Janine B. Gamulo", t: "9:00 AM - 12:00 PM", s: "Pediatrics" },
      { n: "Dr. Marlene R. Sinadjan", t: "10:00 AM - 2:00 PM", s: "Ophthalmology" },
      { n: "Dr. John Kenneth Zaragoza", t: "1:00 PM - 4:00 PM", s: "Surgery – Orthopedic" },
      { n: "Dr. Joanne Concepcion", t: "12:00 PM - 3:00 PM", s: "Ophthalmology" },
      { n: "Dr. Abegail Carmie L. Taruc", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Ronald Carlos L. Amantiad", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Vivian S. Adique", t: "9:30 AM - 11:30 AM", s: "Occupational Medicine" },
      { n: "Dr. Regine A. Dollaga", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Georgina Gladdlys B. Labis-Tamsi", t: "1:00 PM - 4:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Wilhelma M. Villan", t: "10:00 AM - 12:00 PM", s: "ENT" },
      { n: "Dr. Larson E. Taruc", t: "2:00 PM - 5:00 PM", s: "ENT" },
    ],
    Friday: [
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "10:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Zhy Andrea G. Murillo", t: "1:30 PM - 3:30 PM", s: "Internal Medicine" },
      { n: "Dr. Regine A. Dollaga", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Adrian Patrick P. Gomez", t: "2:00 PM - 5:00 PM", s: "Surgery – General Surgeon" },
      { n: "Dr. Ron Joseph Moreno", t: "12:00 PM - 3:00 PM", s: "Ophthalmology" },
      { n: "Dr. Ronald Carlos L. Amantiad", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. John Noriel Lamigue", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Vivian S. Adique", t: "9:30 AM - 11:30 AM", s: "Occupational Medicine" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "2:00 PM - 4:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", t: "10:00 AM - 2:00 PM", s: "ENT" },
    ],
    Saturday: [
      { n: "Dr. Hakan Anthony Oztemiz, MD, DPCP", t: "9:00 AM - 1:00 PM", s: "Internal Medicine" },
      { n: "Dr. Samsida Abaton", t: "9:00 AM - 11:00 AM", s: "ENT" },
      { n: "Dr. Abegail Carmie L. Taruc", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Zhy Andrea G. Murillo", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Larson E. Taruc", t: "2:00 PM - 5:00 PM", s: "ENT" },
    ],
    Sunday: [],
  };
}

/* Backfill ids/status onto stored/seed data so every slot is addressable. */
function schedNormalize(sched) {
  SCHED_DAYS.forEach((day) => {
    if (!sched[day]) sched[day] = [];
    sched[day].forEach((slot) => {
      if (!slot.id) slot.id = "sl_" + Math.random().toString(36).slice(2, 9);
      if (!slot.st) slot.st = "available";
    });
  });
  return sched;
}

const SCHED = {
  days() { return SCHED_DAYS; },

  data() {
    let s = read(SCHED_STORE, null);
    if (!s || !s.Monday) { s = seedSchedule(); this.save(s); }
    return schedNormalize(s);
  },

  save(sched) { store(SCHED_STORE, sched); },

  reset() { const s = seedSchedule(); this.save(s); return s; },

  /* Today's weekday name (Monday..Sunday). */
  today() { return SCHED_DAYS[(new Date().getDay() + 6) % 7]; },

  byDay(day) { return this.data()[day] || []; },

  /* Aggregate every doctor across the week -> { n, s, slots[], st }.
     st = worst-case status: leave > unavailable > available. */
  doctors(filterFn) {
    const map = {};
    SCHED_DAYS.forEach((day) => {
      this.byDay(day).forEach((slot) => {
        if (!map[slot.n]) map[slot.n] = { n: slot.n, s: slot.s, slots: [], leave: false, unavail: false };
        map[slot.n].slots.push({ day, t: slot.t, id: slot.id, st: slot.st || "available" });
        if (slot.st === "leave") map[slot.n].leave = true;
        if (slot.st === "unavailable") map[slot.n].unavail = true;
      });
    });
    const arr = Object.keys(map).map((k) => map[k]);
    arr.forEach((d) => { d.st = d.leave ? "leave" : (d.unavail ? "unavailable" : "available"); });
    arr.sort((a, b) => a.n.localeCompare(b.n));
    return filterFn ? arr.filter(filterFn) : arr;
  },

  /* Available doctors on a given day (default: today). */
  availableToday(day) {
    const d = day || this.today();
    return this.byDay(d).filter((s) => (s.st || "available") === "available");
  },

  /* Set a doctor's availability across all their slots. */
  setStatus(name, status) {
    const s = this.data();
    const now = new Date().toISOString();
    const by = schedNowUser();
    SCHED_DAYS.forEach((day) => s[day].forEach((slot) => { if (slot.n === name) { slot.st = status; slot.eb = by; slot.ea = now; } }));
    this.save(s);
  },

  /* Add a slot for a doctor (creating the doctor if new). */
  addSlot(name, specialty, day, time, status) {
    const s = this.data();
    const now = new Date().toISOString();
    const by = schedNowUser();
    s[day].push({ id: "sl_" + Math.random().toString(36).slice(2, 9), n: name, t: time, s: specialty, st: status || "available", eb: by, ea: now });
    this.save(s);
  },

  /* Remove one slot by id. */
  removeSlot(id) {
    const s = this.data();
    const now = new Date().toISOString();
    const by = schedNowUser();
    let doctorName = null;
    SCHED_DAYS.forEach((day) => { const hit = s[day].find((slot) => slot.id === id); if (hit) doctorName = hit.n; });
    SCHED_DAYS.forEach((day) => { s[day] = s[day].filter((slot) => slot.id !== id); });
    // Stamp the remaining slots so the last editor (removal) is still visible.
    if (doctorName) SCHED_DAYS.forEach((day) => s[day].forEach((slot) => { if (slot.n === doctorName) { slot.eb = by; slot.ea = now; } }));
    this.save(s);
  },

  /* Name of the secretary who last edited a doctor's schedule (or null). */
  lastEditor(name) {
    let latest = null;
    SCHED_DAYS.forEach((day) => this.byDay(day).forEach((slot) => {
      if (slot.n === name && slot.ea) { if (!latest || slot.ea > latest.at) latest = { by: slot.eb, at: slot.ea }; }
    }));
    return latest;
  },
};

/* ------------------------- SCHEDULE HELPERS ------------------------- */
function schedTimeValue(t) {
  const m = String(t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 99999;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
}
function schedPartOfDay(t) { return schedTimeValue(t) < 720 ? "Morning" : "Afternoon"; }
function schedStatusLabel(st) {
  return st === "available" ? "Available" : st === "leave" ? "On leave" : st === "unavailable" ? "Unavailable" : st;
}
const ICON_LEAVE = '<svg class="leave-ico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><rect x="2" y="4" width="12" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 10h12M8 4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

function schedStatusBadge(st) {
  const cls = st === "available" ? "badge-success" : st === "leave" ? "badge-warning" : "badge-muted";
  const ico = st === "leave" ? ICON_LEAVE : "";
  return `<span class="badge ${cls}">${ico}${schedStatusLabel(st)}</span>`;
}
function schedSpecClass(s) {
  const x = (s || "").toLowerCase();
  if (x.indexOf("ophthal") > -1) return "sp-oph";
  if (x.indexOf("pediatric") > -1) return "sp-ped";
  if (x.indexOf("ob") > -1 || x.indexOf("gyne") > -1) return "sp-obg";
  if (x.indexOf("ent") > -1) return "sp-ent";
  if (x.indexOf("internal") > -1) return "sp-im";
  if (x.indexOf("family") > -1) return "sp-fam";
  if (x.indexOf("surg") > -1) return "sp-sur";
  return "sp-om";
}
function schedByTime(a, b) { return schedTimeValue(a.t) - schedTimeValue(b.t); }

/* ------------------------- EXTRA HELPERS ------------------------- */

/* Short specialty label used everywhere (on-screen + print). */
function schedSpecShort(s) {
  const x = (s || "").toLowerCase();
  if (x.indexOf("ophthal") > -1) return "OPHTH";
  if (x.indexOf("pediatric") > -1) return "PEDS";
  if (x.indexOf("ob") > -1 || x.indexOf("gyne") > -1) return "OB-GYNE";
  if (x.indexOf("ent") > -1) return "ENT";
  if (x.indexOf("internal") > -1) return "IM";
  if (x.indexOf("family") > -1) return "FAM";
  if (x.indexOf("surg") > -1) return "SURG";
  if (x.indexOf("occupational") > -1) return "OCC MED";
  return (s || "").toUpperCase().slice(0, 8);
}

/* Specialty shortcut pill (full name kept in the title tooltip). */
function schedSpecPill(s) {
  return `<span class="spec ${schedSpecClass(s)}" title="${App.esc(s)}">${schedSpecShort(s)}</span>`;
}

/* Current logged-in user's name — used as the "last edited by" stamp. */
function schedNowUser() {
  const s = DB.session && DB.session();
  return (s && s.name) || "Unknown";
}

/* "Dr. John Noriel Lamigue, MD" -> "Dr. John Noriel Lamigue"
   Strips everything after the first comma (MD, DPCOM, FPCP titles...). */
function schedShortName(name) {
  const s = String(name || "").trim();
  const comma = s.indexOf(",");
  return (comma > -1 ? s.slice(0, comma) : s).trim();
}

/* Number of secretaries assigned to a given specialty.
   Secretaries carry a `specialty` field; count those matching. */
function schedSecretariesFor(specialty) {
  const target = (specialty || "").toLowerCase();
  if (!target) return 0;
  try {
    return DB.users.byRole("secretary").filter((u) => (u.specialty || "").toLowerCase() === target).length;
  } catch (e) { return 0; }
}

/* Secretary phone number(s) for a specialty, joined by " / ". Used on print. */
function schedSecretaryPhones(specialty) {
  const target = (specialty || "").toLowerCase();
  if (!target) return "";
  try {
    const phones = DB.users.byRole("secretary")
      .filter((u) => (u.specialty || "").toLowerCase() === target)
      .map((u) => u.phone || "")
      .filter(Boolean);
    return phones.join(" / ");
  } catch (e) { return ""; }
}

/* Morning / Afternoon pill for a slot's time string. */
function schedPartTag(t) {
  const pod = schedPartOfDay(t);
  const cls = pod === "Morning" ? "pod-morning" : "pod-afternoon";
  return `<span class="pod ${cls}">${pod}</span>`;
}

/* ------------------------- PRINT DOCUMENT ------------------------- */

/* One printable row: Dr. fullname + secretary phone number(s) underneath, specialty, time. */
function schedPrintRow(s) {
  const secPhone = schedSecretaryPhones(s.s);
  return `<tr>
    <td class="p-doc">
      <div class="p-name">${App.esc(schedShortName(s.n))}</div>
      <div class="p-sec-phone">${secPhone ? "📞 " + App.esc(secPhone) : "—"}</div>
    </td>
    <td class="p-spec"><span class="spec ${schedSpecClass(s.s)} p-spec-pill">${schedSpecShort(s.s)}</span></td>
    <td class="p-time">${App.esc(s.t)} <span class="pod ${schedTimeValue(s.t) < 720 ? "pod-morning" : "pod-afternoon"}">${schedPartOfDay(s.t)}</span></td>
  </tr>`;
}

/* One printable day section. */
function schedPrintDay(day, filterFn) {
  const slots = SCHED.byDay(day).slice().sort(schedByTime).filter(filterFn || (() => true));
  const isToday = day === SCHED.today();
  return `<section class="p-day${slots.length ? "" : " is-empty"}">
    <h3 class="p-day-title">${day}${isToday ? " <span class=\"p-today\">• Today</span>" : ""} <span class="p-count">${slots.length} slot${slots.length === 1 ? "" : "s"}</span></h3>
    ${slots.length
      ? `<table class="p-table"><thead><tr><th>Doctor</th><th>Specialty</th><th>Time</th></tr></thead><tbody>${slots.map(schedPrintRow).join("")}</tbody></table>`
      : (day === "Sunday" ? `<div class="p-empty p-empty-big">No Sunday Schedule</div>` : `<div class="p-empty">No schedule</div>`)}
  </section>`;
}

/* Full printable document (A4, fills one page) — with clinic logo header. */
function schedPrintDoc(title, subtitle, days, filterFn) {
  const day = (d) => schedPrintDay(d, filterFn);
  // Week → two MASONRY columns so each box keeps its natural height:
  //   Left:  Mon, Wed, Fri   (Wednesday sits right below Monday)
  //   Right: Tue, Thu, Sat
  //   Sunday (and any extra days) → full-width row at the bottom.
  // A single day (e.g. "Today") → full-width, no columns.
  const body = days.length <= 1
    ? `<div class="p-grid p-grid--single">${days.map(day).join("")}</div>`
    : `<div class="p-grid">
         <div class="p-col">${[days[0], days[2], days[4]].filter(Boolean).map(day).join("")}</div>
         <div class="p-col">${[days[1], days[3], days[5]].filter(Boolean).map(day).join("")}</div>
       </div>
       ${days.slice(6).map((d) => `<div class="p-full">${day(d)}</div>`).join("")}`;
  return `
    <div class="p-fit-wrap">
      <div class="p-fit-inner">
        <div class="p-head">
          <img class="p-logo" src="${typeof RMCI_LOGO !== "undefined" ? RMCI_LOGO : "../assets/images/rmci-logo.jpg"}" alt="Rever Medical Center" />
          <div class="p-head-txt">
            <div class="p-org">Rever Medical Center, Inc.</div>
            <div class="p-title">${App.esc(title)}</div>
            <div class="p-sub">${App.esc(subtitle)}</div>
          </div>
        </div>
        ${body}
        <div class="p-foot">Generated ${new Date().toLocaleString("en-PH")} • Rever Medical Center, Inc. — Clinic Information System</div>
      </div>
    </div>
  `;
}

/* Download the matching schedule sheet as a shareable A4-sized PNG. */
async function schedDownloadImage(title, subtitle, days, filterFn, filename) {
  try {
    const width = 1240;
    const height = 1754;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");

    const colors = {
      blue: "#0B5E9C",
      darkBlue: "#084573",
      text: "#111827",
      muted: "#64748b",
      border: "#cbd5e1",
      light: "#f1f7fc",
      line: "#e2e8f0",
      morning: "#fef3c7",
      afternoon: "#dbeafe",
    };
    const margin = 64;
    const right = width - margin;
    const contentTop = 220;
    const footerY = height - 48;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic";

    const logo = new Image();
    logo.src = typeof RMCI_LOGO !== "undefined" ? RMCI_LOGO : "../assets/images/rmci-logo.jpg";
    if (logo.decode) await logo.decode();
    else await new Promise((resolve, reject) => {
      logo.onload = resolve;
      logo.onerror = () => reject(new Error("Clinic logo could not be loaded."));
    });
    ctx.drawImage(logo, margin, 48, 112, 112);

    ctx.fillStyle = colors.darkBlue;
    ctx.font = "700 37px Arial, sans-serif";
    ctx.fillText("Rever Medical Center, Inc.", 198, 91);
    ctx.fillStyle = colors.text;
    ctx.font = "700 27px Arial, sans-serif";
    ctx.fillText(title, 198, 128);
    ctx.fillStyle = colors.muted;
    ctx.font = "19px Arial, sans-serif";
    ctx.fillText(subtitle, 198, 158);
    ctx.fillStyle = colors.blue;
    ctx.fillRect(margin, 183, right - margin, 4);

    const fittedText = (text, maxWidth, font) => {
      ctx.font = font;
      let value = String(text || "");
      while (value && ctx.measureText(value).width > maxWidth) value = value.slice(0, -1);
      if (value !== String(text || "")) {
        while (value && ctx.measureText(value + "…").width > maxWidth) value = value.slice(0, -1);
        value += "…";
      }
      return value;
    };

    const slotsFor = (day) => SCHED.byDay(day)
      .slice()
      .sort(schedByTime)
      .filter(filterFn || (() => true));

    const drawDay = (day, x, y, w, h) => {
      const slots = slotsFor(day);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = colors.blue;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      const titleHeight = days.length === 1 ? 62 : 42;
      const columnHeight = days.length === 1 ? 42 : 30;
      ctx.fillStyle = colors.light;
      ctx.fillRect(x + 2, y + 2, w - 4, titleHeight - 2);
      ctx.fillStyle = colors.text;
      ctx.font = `700 ${days.length === 1 ? 27 : 20}px Arial, sans-serif`;
      ctx.fillText(`${day}${day === SCHED.today() ? " • Today" : ""}`, x + 18, y + (days.length === 1 ? 39 : 28));
      ctx.textAlign = "right";
      ctx.fillStyle = colors.muted;
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(`${slots.length} slot${slots.length === 1 ? "" : "s"}`, x + w - 18, y + (days.length === 1 ? 39 : 28));
      ctx.textAlign = "left";

      const tableY = y + titleHeight;
      const rowTop = tableY + columnHeight;
      const doctorWidth = Math.round(w * (days.length === 1 ? 0.48 : 0.44));
      const specialtyWidth = Math.round(w * (days.length === 1 ? 0.23 : 0.21));
      const timeX = x + doctorWidth + specialtyWidth;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(x + 1, tableY, w - 2, columnHeight);
      ctx.fillStyle = colors.muted;
      ctx.font = "700 14px Arial, sans-serif";
      ctx.fillText("DOCTOR", x + 16, tableY + columnHeight - 10);
      ctx.fillText("SPECIALTY", x + doctorWidth + 8, tableY + columnHeight - 10);
      ctx.fillText("TIME", timeX + 8, tableY + columnHeight - 10);

      if (!slots.length) {
        ctx.fillStyle = colors.muted;
        ctx.font = "italic 19px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(day === "Sunday" ? "No Sunday Schedule" : "No schedule", x + w / 2, y + h / 2);
        ctx.textAlign = "left";
        return;
      }

      const rowHeight = Math.max(32, (y + h - rowTop) / slots.length);
      slots.forEach((slot, index) => {
        const rowY = rowTop + index * rowHeight;
        if (index % 2 === 1) {
          ctx.fillStyle = "#fbfdff";
          ctx.fillRect(x + 1, rowY, w - 2, rowHeight);
        }
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, rowY + rowHeight);
        ctx.lineTo(x + w - 1, rowY + rowHeight);
        ctx.stroke();

        const nameFont = days.length === 1 ? "700 21px Arial, sans-serif" : "700 15px Arial, sans-serif";
        const phoneFont = days.length === 1 ? "16px Arial, sans-serif" : "12px Arial, sans-serif";
        const lineGap = days.length === 1 ? 23 : 16;
        ctx.fillStyle = colors.text;
        ctx.font = nameFont;
        ctx.fillText(fittedText(schedShortName(slot.n), doctorWidth - 30, nameFont), x + 16, rowY + rowHeight * 0.48);
        ctx.fillStyle = colors.muted;
        ctx.font = phoneFont;
        ctx.fillText(fittedText(schedSecretaryPhones(slot.s) || "—", doctorWidth - 30, phoneFont), x + 16, rowY + rowHeight * 0.48 + lineGap);

        ctx.fillStyle = colors.darkBlue;
        ctx.font = `700 ${days.length === 1 ? 16 : 12}px Arial, sans-serif`;
        ctx.fillText(fittedText(schedSpecShort(slot.s), specialtyWidth - 16, ctx.font), x + doctorWidth + 8, rowY + rowHeight * 0.62);

        const period = schedPartOfDay(slot.t);
        const timeFont = days.length === 1 ? "16px Arial, sans-serif" : "12px Arial, sans-serif";
        ctx.font = timeFont;
        ctx.fillStyle = colors.text;
        const timeLabel = `${slot.t} · ${period}`;
        ctx.fillText(fittedText(timeLabel, w - (timeX - x) - 14, timeFont), timeX + 8, rowY + rowHeight * 0.62);
      });
    };

    if (days.length <= 1) {
      drawDay(days[0], margin, contentTop, right - margin, footerY - contentTop - 28, true);
    } else {
      const gap = 18;
      const colWidth = (right - margin - gap) / 2;
      const colBottom = 1514;
      const dayGap = 12;
      const columnDays = [
        [days[0], days[2], days[4]].filter(Boolean),
        [days[1], days[3], days[5]].filter(Boolean),
      ];
      columnDays.forEach((column, colIndex) => {
        const count = column.reduce((sum, day) => sum + slotsFor(day).length, 0);
        const availableRows = colBottom - contentTop - dayGap * (column.length - 1) - column.length * 72;
        const rowHeight = count ? availableRows / count : 32;
        let y = contentTop;
        column.forEach((day) => {
          const dayHeight = 72 + slotsFor(day).length * rowHeight;
          drawDay(day, margin + colIndex * (colWidth + gap), y, colWidth, dayHeight, true);
          y += dayHeight + dayGap;
        });
      });
      days.slice(6).forEach((day) => {
        drawDay(day, margin, 1534, right - margin, footerY - 1534 - 28, false);
      });
    }

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, footerY);
    ctx.lineTo(right, footerY);
    ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.font = "13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Generated ${new Date().toLocaleString("en-PH")} • Rever Medical Center, Inc. — Clinic Information System`, width / 2, footerY + 22);
    ctx.textAlign = "left";

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The PNG image could not be created.")), "image/png");
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (filename || "doctor-schedule.png").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    App.toast("✅", "Schedule image downloaded.");
  } catch (error) {
    console.error("Unable to download schedule image:", error);
    App.toast("⚠️", "Could not create the schedule image. Please try again.");
  }
}

/* Render a printable doc into a temporary #printArea and trigger the browser print. */
function schedPrint(html) { App.printSheet(html); }
