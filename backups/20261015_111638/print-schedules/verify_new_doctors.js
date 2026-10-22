/* Verifies the two newly-added ENT doctors are seeded on the correct days/times.
   Run: node verify_new_doctors.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "assets", "js", "schedules.js"), "utf8");
const backing = {};
const sb = {
  console, Math, JSON, Date, Set, Map, Array, Object,
  localStorage: {
    getItem: (k) => (k in backing ? backing[k] : null),
    setItem: (k, v) => { backing[k] = String(v); },
    removeItem: (k) => { delete backing[k]; },
    clear: () => {},
  },
  read: (k, d) => (k in backing ? JSON.parse(backing[k]) : d),
  store: (k, v) => { backing[k] = JSON.stringify(v); },
  DB: { users: { byRole: () => [] } },
  App: { esc: (s) => String(s) },
};
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(src, sb, { filename: "schedules.js" });

const byDay = (d) => vm.runInContext(`SCHED.byDay(${JSON.stringify(d)})`, sb);
const find = (d, name) => byDay(d).filter((s) => s.n.indexOf(name) > -1);

let fail = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { console.log("FAIL " + m); fail++; } };

// Dr. Jesus Resurreccion M. Jardin — ENT
const jm = find("Monday", "Jardin");
ok(jm.length === 1 && jm[0].t === "9:00 AM - 11:00 AM" && jm[0].s === "ENT", "Jardin • Monday 9-11 AM (ENT)");
const jt = find("Tuesday", "Jardin");
ok(jt.length === 1 && jt[0].t === "9:00 AM - 11:00 AM", "Jardin • Tuesday 9-11 AM");
const jf = find("Friday", "Jardin");
ok(jf.length === 1 && jf[0].t === "10:00 AM - 2:00 PM", "Jardin • Friday 10 AM-2 PM");
ok(find("Wednesday", "Jardin").length === 0 && find("Thursday", "Jardin").length === 0, "Jardin • not on Wed/Thu");

// Dr. Elaine G. Flores — ENT
const fm = find("Monday", "Flores");
ok(fm.length === 1 && fm[0].t === "2:00 PM - 4:30 PM" && fm[0].s === "ENT", "Flores • Monday 2-4:30 PM (ENT)");
const ft = find("Tuesday", "Flores");
ok(ft.length === 1 && ft[0].t === "2:00 PM - 4:30 PM", "Flores • Tuesday 2-4:30 PM");
ok(find("Friday", "Flores").length === 0, "Flores • not on Friday");

// Name is preserved in full (short name strips credentials for display)
ok(jm[0].n === "Dr. Jesus Resurreccion M. Jardin, MD, FPSO, ENT-HNS", "Jardin full name stored intact");
ok(vm.runInContext(`schedShortName(${JSON.stringify(jm[0].n)})`, sb) === "Dr. Jesus Resurreccion M. Jardin", "Jardin display name strips credentials");

console.log(fail === 0 ? "\nALL NEW-DOCTOR CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
