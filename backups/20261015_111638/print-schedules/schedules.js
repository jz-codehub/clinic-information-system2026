/* ============================================================
   Rever Medical Center — Doctor Schedules data layer
   Shared by:
     • pages/schedules.html  (read-only: who is available, when)
     • pages/myclinic.html   (secretary edits their own clinic's doctors)
   Persisted in localStorage. Designed to be swapped for Supabase
   later, exactly like data.js. Load AFTER data.js / app.js.
   ============================================================ */

const SCHED_STORE = "rmc_schedule_v2";
const SCHED_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* Real Rever Medical Center roster (seeded only when nothing is stored yet). */
function seedSchedule() {
  return {
    Monday: [
      { n: "Dr. Ron Joseph Moreno", t: "12:00 PM - 3:00 PM", s: "Ophthalmology" },
      { n: "Dr. John Noriel Lamigue, MD", t: "3:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Hakan Anthony Oztemiz, MD, DPCOM", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Regina Amatong Dollaga, MD, AAP", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "8:00 AM - 10:00 AM", s: "Occupational Medicine" },
      { n: "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", t: "9:00 AM - 11:00 AM", s: "ENT" },
      { n: "Dr. Elaine G. Flores", t: "2:00 PM - 4:30 PM", s: "ENT" },
    ],
    Tuesday: [
      { n: "Dr. Marlene Sinadjan", t: "10:00 AM - 2:00 PM", s: "Ophthalmology" },
      { n: "Dr. Ronald Carlos L. Amantiad, MD", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. John Noriel Lamigue, MD", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Vivian S. Adique, MD, DPCOM", t: "9:30 AM - 11:30 AM", s: "Occupational Medicine" },
      { n: "Dr. Regina Amatong Dollaga, MD, AAP", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Georgina Gladdlys Labis-Tamsi, FPOGS", t: "1:00 PM - 4:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Edelle Louiefe D. Evangelista, MD", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "3:00 PM - 5:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", t: "9:00 AM - 11:00 AM", s: "ENT" },
      { n: "Dr. Elaine G. Flores", t: "2:00 PM - 4:30 PM", s: "ENT" },
    ],
    Wednesday: [
      { n: "Dr. Stricklyn Paasa", t: "10:00 AM - 2:00 PM", s: "Ophthalmology" },
      { n: "Dr. Joanne Concepcion", t: "10:00 AM - 2:00 PM", s: "Ophthalmology" },
      { n: "Dr. Zhy Andrea G. Murillo, MD", t: "1:30 PM - 3:30 PM", s: "Internal Medicine" },
      { n: "Dr. Ruel B. Atun", t: "1:00 PM - 5:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Hakan Anthony Oztemiz, MD, DPCOM", t: "9:00 AM - 1:00 PM", s: "Internal Medicine" },
      { n: "Dr. Regina Amatong Dollaga, MD, AAP", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Edelle Louiefe D. Evangelista, MD", t: "2:00 PM - 5:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "8:00 AM - 10:00 AM", s: "Occupational Medicine" },
      { n: "Dr. Nathalie Mundo", t: "9:00 AM - 11:00 AM", s: "ENT" },
    ],
    Thursday: [
      { n: "Dr. Joanne Concepcion", t: "12:00 PM - 3:00 PM", s: "Ophthalmology" },
      { n: "Dr. Abegial Carmen N. Laurdo-Taruc, MD, FPCP", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Ronald Carlos L. Amantiad, MD", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Vivian S. Adique, MD, DPCOM", t: "9:30 AM - 11:30 AM", s: "Occupational Medicine" },
      { n: "Dr. Ruel B. Atun", t: "1:00 PM - 5:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Regina Amatong Dollaga, MD, AAP", t: "12:00 PM - 3:00 PM", s: "Pediatrics" },
      { n: "Dr. Georgina Gladdlys Labis-Tamsi, MD, FPOGS", t: "1:00 PM - 4:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Edelle Louiefe D. Evangelista, MD", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Wilhelma Villan", t: "10:00 AM - 12:00 PM", s: "ENT" },
      { n: "Dr. Larson Taruc", t: "2:00 PM - 5:00 PM", s: "ENT" },
    ],
    Friday: [
      { n: "Dr. Ron Joseph Moreno", t: "12:00 PM - 3:00 PM", s: "Ophthalmology" },
      { n: "Dr. Ronald Carlos L. Amantiad, MD", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. John Noriel Lamigue, MD", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Vivian S. Adique, MD, DPCOM", t: "9:30 AM - 11:30 AM", s: "Occupational Medicine" },
      { n: "Dr. Edelle Louiefe D. Evangelista, MD", t: "2:00 PM - 5:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Donna Bella Z. Davis, MD, DPAFP, FPCOM", t: "10:00 AM - 12:00 PM", s: "Occupational Medicine" },
      { n: "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", t: "10:00 AM - 2:00 PM", s: "ENT" },
    ],
    Saturday: [
      { n: "Dr. Abegial Carmen N. Laurdo-Taruc, MD, FPCP", t: "1:00 PM - 5:00 PM", s: "Internal Medicine" },
      { n: "Dr. Zhy Andrea G. Murillo, MD", t: "9:00 AM - 12:00 PM", s: "Internal Medicine" },
      { n: "Dr. Aprille Joy M. Balano", t: "9:00 AM - 12:00 PM", s: "OB-Gynecology" },
      { n: "Dr. Larson Taruc", t: "2:00 PM - 5:00 PM", s: "ENT" },
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
function schedStatusBadge(st) {
  const cls = st === "available" ? "badge-success" : st === "leave" ? "badge-warning" : "badge-muted";
  return `<span class="badge ${cls}">${schedStatusLabel(st)}</span>`;
}
function schedSpecClass(s) {
  const x = (s || "").toLowerCase();
  if (x.indexOf("ophthal") > -1) return "sp-oph";
  if (x.indexOf("pediatric") > -1) return "sp-ped";
  if (x.indexOf("ob") > -1 || x.indexOf("gyne") > -1) return "sp-obg";
  if (x.indexOf("ent") > -1) return "sp-ent";
  if (x.indexOf("internal") > -1) return "sp-im";
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

/* Morning / Afternoon pill for a slot's time string. */
function schedPartTag(t) {
  const pod = schedPartOfDay(t);
  const cls = pod === "Morning" ? "pod-morning" : "pod-afternoon";
  return `<span class="pod ${cls}">${pod}</span>`;
}

/* ------------------------- PRINT DOCUMENT ------------------------- */

/* One printable row: Dr. fullname + compact secretary number underneath, specialty, time. */
function schedPrintRow(s) {
  const sec = schedSecretariesFor(s.s);
  return `<tr>
    <td class="p-doc">
      <div class="p-name">${App.esc(schedShortName(s.n))}</div>
      <div class="p-sec-num">${sec}</div>
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
    <div class="p-head">
      <img class="p-logo" src="${typeof RMCI_LOGO !== "undefined" ? RMCI_LOGO : "../assets/images/rmci-logo.jpg"}" alt="Rever Medical Center" />
      <div class="p-head-txt">
        <div class="p-org">Rever Medical Center, Inc.</div>
        <div class="p-title">${App.esc(title)}</div>
        <div class="p-sub">${App.esc(subtitle)}</div>
      </div>
    </div>
    ${body}
    <div class="p-foot">Generated ${new Date().toLocaleString("en-PH")} • Rever Medical Center Clinic Information System</div>
  `;
}

/* Render a printable doc into a temporary #printArea and trigger the browser print. */
function schedPrint(html) { App.printSheet(html); }
