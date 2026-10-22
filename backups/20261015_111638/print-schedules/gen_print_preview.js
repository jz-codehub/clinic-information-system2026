/* Generates self-contained HTML previews of the Doctor Schedules PRINT sheet
   (Today + Week) so you can see exactly what prints before changing anything.
   The @media print rules are activated on-screen so the preview matches paper.
   Run: node gen_print_preview.js  →  open preview-print-today.html / -week.html  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const schedSrc = fs.readFileSync(path.join(__dirname, "assets", "js", "schedules.js"), "utf8");
let css = fs.readFileSync(path.join(__dirname, "assets", "css", "style.css"), "utf8");

// Activate the print stylesheet on-screen too, so the preview looks like paper.
css = css.replace("@media print {", "@media screen {");

// --- Build the print content in a sandbox (same stubs as verify_sched_print) ---
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
  DB: { users: { byRole: () => [{}, {}] } },
  App: { esc: (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])) },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(schedSrc, sandbox, { filename: "schedules.js" });

const today = vm.runInContext("SCHED.today()", sandbox);
const todayHtml = vm.runInContext(`schedPrintDoc("Doctor Schedule — ${today}", "Availability for ${today}", ["${today}"])`, sandbox);
const weekHtml = vm.runInContext(`schedPrintDoc("Doctor Schedules — This Week", "Monday to Sunday availability", SCHED_DAYS.slice())`, sandbox);

// Embed the logo inline (base64) so it ALWAYS renders in the preview,
// regardless of the file's location / relative path.
const logoB64 = fs.readFileSync(path.join(__dirname, "assets", "images", "rmci-logo.jpg")).toString("base64");
const logoUri = "data:image/jpeg;base64," + logoB64;
const withLogo = (html) => html.replace("../assets/images/rmci-logo.jpg", logoUri);

function page(body, label) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Print Preview — ${label}</title>
<style>${css}</style>
<style>
  @media screen {
    body { background:#e5e7eb; padding:24px; }
    #printArea { width:210mm; min-height:297mm; margin:0 auto; background:#fff;
      box-sizing:border-box; box-shadow:0 4px 18px rgba(0,0,0,.18); padding:6mm 8mm; }
  }
</style></head>
<body><div id="printArea">${body}</div></body></html>`;
}

fs.writeFileSync(path.join(__dirname, "preview-print-today.html"), page(withLogo(todayHtml), "Today"));
fs.writeFileSync(path.join(__dirname, "preview-print-week.html"), page(withLogo(weekHtml), "This Week"));
console.log("Generated:");
console.log("  preview-print-today.html  (Today — single day, fills the A4 page)");
console.log("  preview-print-week.html   (This Week — 2 columns, one page)");
console.log("Open either in your browser. Ctrl+P to confirm it is 1 page.");
