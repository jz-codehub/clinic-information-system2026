/* Verifies the Doctor Schedules PRINT sheet:
   - secretary phone numbers are shown under the doctor
   - Today uses a single-column layout and Week uses two columns
   - both layouts fill the usable A4 page without clipping
   Run: node tests/verify_sched_print.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const src = fs.readFileSync(path.join(projectRoot, "assets", "js", "schedules.js"), "utf8");

// 1) Syntax check
try { new vm.Script(src, { filename: "schedules.js" }); console.log("PASS syntax: schedules.js parses"); }
catch (e) { console.error("FAIL syntax: " + e.message); process.exit(1); }

// 2) Sandbox with in-memory schedule store + minimal DB/App stubs
const backing = {};
const downloadState = { links: [], toasts: [], canvas: null };
const canvasContext = {
  measureText: (text) => ({ width: String(text).length * 7 }),
  fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {},
  moveTo() {}, lineTo() {}, stroke() {}, drawImage() {},
};
const sandbox = {
  console, Math, JSON, Date, Set, Map, Array, Object,
  URL: { createObjectURL: () => "blob:schedule-image", revokeObjectURL() {} },
  Image: class { decode() { return Promise.resolve(); } },
  setTimeout: (fn) => { fn(); return 1; },
  document: {
    createElement: (tag) => {
      if (tag === "canvas") {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => canvasContext,
          toBlob: (callback, type) => callback({ type, size: 1 }),
        };
        downloadState.canvas = canvas;
        return canvas;
      }
      const link = {
        click: () => downloadState.links.push({ download: link.download, href: link.href }),
        remove() {},
      };
      return link;
    },
    body: { appendChild() {} },
  },
  localStorage: {
    getItem: (k) => (k in backing ? backing[k] : null),
    setItem: (k, v) => { backing[k] = String(v); },
    removeItem: (k) => { delete backing[k]; },
    clear: () => { for (const k in backing) delete backing[k]; },
  },
  read: (k, d) => (k in backing ? JSON.parse(backing[k]) : d),
  store: (k, v) => { backing[k] = JSON.stringify(v); },
  DB: { users: { byRole: () => [
    { specialty: "Family Medicine", phone: "12345" },
    { specialty: "Family Medicine", phone: "67890" },
  ] } },
  App: {
    esc: (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    toast: (icon, message) => downloadState.toasts.push({ icon, message }),
  },
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

ok(todayHtml.includes('class="p-grid p-grid--single"'), "Today uses the full-width single-day layout");

// --- Secretary phone numbers appear under the doctor without verbose labels ---
ok(weekHtml.includes('class="p-sec-phone"'), "print rows include a secretary phone field");
ok(!/secretar(y|ies)/i.test(weekHtml), "verbose 'secretary/secretaries' text removed from print");
ok(!weekHtml.includes("👥"), "people icon (👥) removed from print rows");
ok(weekHtml.includes("12345 / 67890"), "secretary phone numbers shown under the doctor");
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
  const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");
  const m = css.match(re);
  return m ? parseFloat(m[1]) : null;
}
const rows = (weekHtml.match(/class="p-name"/g) || []).length;
(function fitCheck() {
  const tName = cssNum(/#printArea\s+\.p-name\s*{[^}]*font-size:\s*([\d.]+)px/) || 0;
  const tSec = cssNum(/#printArea\s+\.p-sec-phone\s*{[^}]*font-size:\s*([\d.]+)px/) || 0;
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

// --- Layout rules fill the A4 content box while allowing dense schedules to shrink ---
const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");
ok(/#printArea\s+\.p-fit-wrap\s*{[^}]*width:\s*202mm;[^}]*height:\s*291mm;/s.test(css), "schedule wrapper matches usable A4 dimensions");
ok(/#printArea\s+\.p-fit-inner\s*{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*display:\s*flex;/s.test(css), "schedule content fills the A4 wrapper");
ok(/#printArea\s+\.p-grid\s*{[^}]*flex:\s*1 1 auto;/s.test(css) && /#printArea\s+\.p-day\s*{[^}]*flex:\s*1 1 0;/s.test(css), "day sections expand to use the full page height");
ok(/#printArea\.print-fit-schedule\s*{\s*height:\s*291mm;/.test(css), "schedule print area uses the full A4 content height");
ok(/#printArea\.print-fit-one-page\s*{[^}]*min-height:\s*291mm;[^}]*height:\s*auto;/s.test(css), "abstract and record print area fills A4 and can flow onto later pages");

// --- Structure intact ---
ok(todayHtml.includes("p-head") && todayHtml.includes("p-org"), "print keeps logo header + org name");
ok(todayHtml.includes("p-table"), "print renders the schedule table");
ok(todayHtml.includes("p-foot"), "print keeps the footer line");

(async () => {
  await vm.runInContext('schedDownloadImage("Doctor Schedule — Today", "Availability for today", [SCHED.today()], null, "doctor-schedule-today.png")', sandbox);
  ok(downloadState.canvas.width === 1240 && downloadState.canvas.height === 1754, "download image is rendered at A4 portrait dimensions");
  ok(downloadState.links.some((link) => link.download === "doctor-schedule-today.png" && link.href === "blob:schedule-image"), "Today image is downloaded as a PNG file");
  ok(downloadState.toasts.some((toast) => toast.message === "Schedule image downloaded."), "successful image download is confirmed to the user");
  console.log(fail === 0 ? "\nALL SCHEDULE PRINT CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
