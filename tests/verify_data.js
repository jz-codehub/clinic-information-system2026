// Live test of the clinic-room reframe in data.js (fresh seed + legacy migration).
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
const backing = {};
const sandbox = {
  console, Math, JSON, Date, isFinite, Array, Object, Set, Map, parseInt, isNaN,
  localStorage: {
    getItem: (k) => (k in backing ? backing[k] : null),
    setItem: (k, v) => { backing[k] = String(v); },
    removeItem: (k) => { delete backing[k]; },
    clear: () => { for (const k in backing) delete backing[k]; },
  },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(projectRoot, "assets", "js", "data.js"), "utf8"), sandbox, { filename: "data.js" });
const DB = vm.runInContext("DB", sandbox); // top-level const isn't a sandbox property

let fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };

// 1) Fresh install -> seed has room-based clinics
DB.init();
const c1 = DB.clinics.find("c1");
ok(c1 && c1.room === "101" && c1.name === "Clinic Room 101" && c1.head === "Dr. Maria Santos" && c1.specialty === "Internal Medicine", "fresh seed: c1 is Clinic Room 101 (Dr. Maria Santos, Internal Medicine)");
ok(DB.clinics.label("c1") === "Clinic Room 101", "label('c1') = Clinic Room 101");
ok(DB.clinics.label("nope") === "—", "label(unknown) = —");
ok(DB.clinics.specialty("c4") === "Ophthalmology", "specialty('c4') = Ophthalmology");

// 2) Legacy multi-branch data (no room) -> migrated in place, IDs preserved
sandbox.localStorage.clear();
sandbox.localStorage.setItem("rmc_clinics", JSON.stringify([
  { id: "c1", name: "Rever Main Clinic", address: "123 Rizal Ave, Manila", color: "#0d9488", head: "Dr. Maria Santos" },
  { id: "c2", name: "Rever Quezon City", address: "45 Commonwealth Ave, QC", color: "#3b82f6", head: "Dr. Jose Reyes" },
]));
DB.init();
const m1 = DB.clinics.find("c1");
ok(m1.room === "101" && m1.name === "Clinic Room 101", "legacy c1 migrated to Clinic Room 101");
ok(DB.clinics.find("c2").room === "102", "legacy c2 migrated to room 102");
ok(DB.clinics.label("c2") === "Clinic Room 102", "label('c2') after migration = Clinic Room 102");

// 3) Migration is idempotent (running twice does not double-apply / no errors)
DB.init();
ok(DB.clinics.find("c1").room === "101", "migration idempotent (room stays 101)");

// 4) Unknown/custom clinic without room falls back to its stored name
sandbox.localStorage.setItem("rmc_clinics", JSON.stringify([{ id: "c9", name: "Custom Room", color: "#111" }]));
ok(DB.clinics.label("c9") === "Custom Room", "custom clinic without room -> label falls back to name");

console.log(fail === 0 ? "\nDATA REFRAME: ALL PASSED" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
