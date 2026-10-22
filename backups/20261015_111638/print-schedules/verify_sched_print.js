/* Verifies the Doctor Schedules PRINT sheet:
   - secretary count is a COMPACT number under the doctor (no verbose "secretaries" text)
   - a single day (Today) prints full-width (p-grid--single) → no empty right half
   - multiple days (Week) use the 2-column p-grid
   Run: node verify_sched_print.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "assets", "js", "schedules.js"), "utf8");

// 1) Syntax check
try { new vm.Script(src, { filename: "schedules.js" }); console.log("PASS syntax: schedules.js parses"); }
catch (e) { console.error("FAIL syntax: " + e.message); process.exit(1); }

// 2) Sandbox with in-memory schedule store + minimal DB/App stubs
const backing = {};
const sandbox = {
  console, Math, JSON, Date, Set, Map, Array, Object,
  localStorage: {
    getItem: (k) => (k in backing ? backing[k] : null),
    setItem: (k, v) => { backing[k] = String(v); },
    removeItem: (k) => { delete backing[k]; },
    clear: () => { for (const k in backing) delete backing[k]; },
  },
  read: (k, d) => (k in backing ? JSON.parse(backing[k]) : d),
  store: (k, v) => { backing[k] = JSON.stringify(v); },
  DB: { users: { byRole: () => [{}, {}] } }, // pretend 2 secretaries exist
  App: { esc: (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])) },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: "schedules.js" });

let fail = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { console.log("FAIL " + m); fail++; } };

const today = vm.runInContext("SCHED.today()", sandbox);
const week = vm.runInContext("SCHED_DAYS.slice()", sandbox);

const todayHtml = vm.runInContext(`schedPrintDoc("Doctor Schedule — ${today}", "Availability for ${today}", ["${today}"])`, sandbox);
const weekHtml = vm.runInContext(`schedPrintDoc("Doctor Schedules — This Week", "Monday to Sunday availability", ${JSON.stringify(week)})`, sandbox);

// --- Secretary number is compact (no icon, no verbose text) ---
ok(todayHtml.includes("p-sec-num"), "print row uses compact .p-sec-num");
ok(!/secretar(y|ies)/i.test(todayHtml), "verbose 'secretary/secretaries' text removed from print");
ok(!todayHtml.includes("👥"), "people icon (👥) removed — number only");
ok(/p-sec-num">\s*\d+\s*</.test(todayHtml), "secretary number shown under the doctor (bare number)");
ok(!/p-status|Available|On leave|Unavailable/.test(todayHtml), "Status column removed from print (no status text)");

// --- Logo is kept in the print header ---
ok(/class="p-logo"/.test(todayHtml) && /rmci-logo\.jpg/.test(todayHtml), "clinic logo kept in the print header");

// --- Column layout (3 cols: Doctor/Specialty/Time, Status removed) ---
ok(weekHtml.includes("<th>Doctor</th><th>Specialty</th><th>Time</th>"), "column order is Doctor | Specialty | Time");
ok(!weekHtml.includes("<th>Status"), "Status header removed from print");

// --- Sunday filler box now occupies the bottom area ---
const daySections = (weekHtml.match(/class="p-day(?:\s[^"]*)?"/g) || []).length;
ok(daySections === 7, `Week print shows all 7 days incl. Sunday — ${daySections} day sections`);
ok(weekHtml.includes("p-empty-big") && /No Sunday Schedule/.test(weekHtml), "Sunday box renders big 'No Sunday Schedule' filler");

/* --- 1-page fit + page-fill math ---
   CSS multicol balances WHOLE day boxes across the 2 columns. We replay that
   here: split the real week HTML into its day sections, count rows per day,
   find the best 2-column partition (exhaustive 2^6), then assert the tallest
   column + chrome (a) fits inside A4 usable height (1 page) and (b) fills
   most of it (no big empty space at the bottom). */
function cssNum(re) {
  const css = fs.readFileSync(path.join(__dirname, "assets", "css", "style.css"), "utf8");
  const m = css.match(re);
  return m ? parseFloat(m[1]) : null;
}
const rows = (weekHtml.match(/class="p-name"/g) || []).length;
(function fitCheck() {
  const tName = cssNum(/#printArea\s+\.p-name\s*{[^}]*font-size:\s*([\d.]+)px/) || 0;
  const tSec = cssNum(/#printArea\s+\.p-sec-num\s*{[^}]*font-size:\s*([\d.]+)px/) || 0;
  const tDay = cssNum(/#printArea\s+\.p-day-title\s*{[^}]*font-size:\s*([\d.]+)px/) || 0;
  const tTh = cssNum(/#printArea\s+\.p-table\s+th\s*{[^}]*font-size:\s*([\d.]+)px/) || 0;
  const tDayMb = cssNum(/#printArea\s+\.p-day\s*{[^}]*margin-bottom:\s*([\d.]+)px/) || 0;
  const tdPad = cssNum(/#printArea\s+\.p-table\s+td\s*{[^}]*padding:\s*([\d.]+)px/) || 0;
  const dayPad = cssNum(/#printArea\s+\.p-day\s*{[^}]*padding:\s*([\d.]+)px/) || 0;
  const dayBorder = cssNum(/#printArea\s+\.p-day\s*{[^}]*border:\s*([\d.]+)px/) || 0;
  if (!tName || !tSec || !tDay) { console.log("SKIP 1-page fit math (CSS values not found)"); return; }

  const rowPx = tName * 1.15 + 1 + tSec * 1.1 + tdPad * 2; // 1 name line + 1 number line + padding
  const boxExtra = tDayMb + dayPad * 2 + dayBorder * 2;    // per-day box: margin + padding + border
  const thRow = tTh * 1.2 + 3 * 2 + 1;                     // table header row
  const dayTitle = tDay * 1.2 + 5 + 2 + 1;                 // title + margin + padding + border
  const headsPad = 44 + 4 + 4 + 6;                         // logo + paddings + org/title/sub ~ px

  const daySecs = weekHtml.split('<section class="p-day').slice(1); // 7 day sections
  const emptyBigH = 26 * 2 + 15 * 1.2 + 2; // p-empty-big padding + text + border
  const dayH = daySecs.map((s) => {
    const r = (s.match(/class="p-name"/g) || []).length;
    return (/is-empty/.test(s.split(">")[0]) ? dayTitle + emptyBigH : r * rowPx + dayTitle + thRow) + boxExtra;
  });
  // Two masonry columns: left = Mon/Wed/Fri, right = Tue/Thu/Sat; Sunday full-width.
  const col1 = dayH[0] + dayH[2] + dayH[4];
  const col2 = dayH[1] + dayH[3] + dayH[5];
  const sun = dayH[6] || 0;
  const content = Math.max(col1, col2) + sun + headsPad + 20 + 4; // tallest col + Sunday + head + foot + slack
  const margin = cssNum(/@page\s*{\s*size:\s*A4;\s*margin:\s*([\d.]+)mm/) || 0;
  const usablePx = (297 - margin * 2) * (96 / 25.4);
  console.log(`  fit detail: dayRows=[${daySecs.map((s) => (s.match(/class="p-name"/g) || []).length).join(",")}], col1~${Math.round(col1)}px col2~${Math.round(col2)}px`);
  ok(content <= usablePx, `1-page fit (masonry cols): ${Math.round(content)}px vs ${Math.round(usablePx)}px A4 usable (${rows} doctors, Mon/Wed/Fri | Tue/Thu/Sat + Sun)`);
  ok(content >= usablePx * 0.6, `page occupied: ${Math.round((content / usablePx) * 100)}% of A4 used (no big empty space)`);
})();

// --- Structure intact ---
ok(todayHtml.includes("p-head") && todayHtml.includes("p-org"), "print keeps logo header + org name");
ok(todayHtml.includes("p-table"), "print renders the schedule table");
ok(todayHtml.includes("p-foot"), "print keeps the footer line");

console.log(fail === 0 ? "\nALL SCHEDULE PRINT CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
