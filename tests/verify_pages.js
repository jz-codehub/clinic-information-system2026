/* Parses every page's inline <script> blocks to catch syntax errors after edits.
   Run: node tests/verify_pages.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const pages = ["dashboard", "patients", "clinics", "users", "queue", "register-patient",
  "reports", "schedules", "services", "myclinic", "patient-detail", "guide-map"];

let fail = 0;
for (const p of pages) {
  const file = path.join(projectRoot, "pages", p + ".html");
  if (!fs.existsSync(file)) { console.log("SKIP (missing) " + p); continue; }
  const html = fs.readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  let ok = true;
  blocks.forEach((m, i) => {
    try { new vm.Script(m[1], { filename: p + "#" + i }); }
    catch (e) { ok = false; console.log("  SYNTAX ERR " + p + " block " + i + ": " + e.message); fail++; }
  });
  if (ok) console.log("PASS " + p + " (" + blocks.length + " inline script block(s) parse)");
}
console.log(fail === 0 ? "\nALL PAGE SCRIPTS PARSE OK" : "\n" + fail + " SYNTAX ERROR(S)");
process.exit(fail === 0 ? 0 : 1);
