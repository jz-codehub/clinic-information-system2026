/* Generates standalone previews of the doctor's PRINT RECORD and RECETA
   (uses the REAL buildRecord()/buildReceta() + style.css) so you can see them.
   Run: node tools/gen_record_preview.js  →  open previews/preview-record.html / preview-receta.html  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const dataSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "data.js"), "utf8");
const appSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "app.js"), "utf8");
const pdHtml = fs.readFileSync(path.join(projectRoot, "pages", "patient-detail.html"), "utf8");
const pdSrc = pdHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");

function makeEl() {
  const el = { _html: "", classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);}, contains(c){return this._s.has(c);} }, style:{}, dataset:{}, value:"", textContent:"", hidden:false, addEventListener(){}, appendChild(){}, setAttribute(){}, getAttribute(){return null;}, querySelectorAll(){return [];}, querySelector(){return null;} };
  Object.defineProperty(el, "innerHTML", { get(){return this._html;}, set(v){this._html = String(v);} });
  return el;
}

const backing = {};
backing["rmc_data_version"] = "v3";
backing["rmc_clinics"] = JSON.stringify([{ id:"c1", name:"Clinic Room 101", room:"101", head:"Dr. Maria Santos", specialty:"Internal Medicine", color:"#0d9488", icon:"🩺" }]);
backing["rmc_users"] = JSON.stringify([{ id:"u3", name:"Dr. Maria Santos", role:"doctor", clinicId:"c1" }]);
backing["rmc_patients"] = JSON.stringify([{
  id:"P-001", fullName:"Juan Dela Cruz", age:45, gender:"Male", status:"completed", clinicId:"c1",
  registeredAt:new Date().toISOString(), registeredBy:"u1", contact:"0917-000-0001", address:"123 Rizal St., Manila",
  birthdate:"1981-03-15", employed:true, hmo:true, philhealth:true, yakap:false, complaint:"Fever and cough",
  demographics:{ birthplace:"Manila", nationality:"Filipino", religion:"Catholic", maritalStatus:"Married", occupation:"Engineer", companyName:"Acme Corp" },
  emergency:{ name:"Maria Dela Cruz", relationship:"Spouse", contact:"0918-000-0002", address:"123 Rizal St., Manila" },
  vitals:{ bp:"130/85", temp:"37.5", hr:"88", rr:"18", weight:"72", height:"170", spo2:"98" },
  consultation:{ date:new Date().toISOString(), symptoms:"Fever, cough, sore throat", diagnosis:"Acute pharyngitis", treatment:"Rest, hydration, warm salt-water gargle.", prescription:"Amoxicillin 500mg — 1 capsule 3x a day for 7 days\nParacetamol 500mg — as needed for fever", notes:"Return after 1 week if not improved.", doctor:"Dr. Maria Santos", fee:500 },
  fee:500,
}]);
backing["rmc_session"] = JSON.stringify({ userId:"u3", role:"doctor", name:"Dr. Maria Santos", clinicId:"c1" });

const body = makeEl();
const els = { appbarNav: makeEl(), overlayNav: makeEl(), appbarToggle: makeEl(), toastHost: null, abstractBody: makeEl(), abstractModal: makeEl() };
const sandbox = {
  console, Math, JSON, Date, isFinite, Array, Object, Uint8Array, Float64Array, Int32Array, Set, Map, URLSearchParams,
  localStorage: { getItem:(k)=>(k in backing?backing[k]:null), setItem:(k,v)=>{backing[k]=String(v);}, removeItem:(k)=>{delete backing[k];}, clear:()=>{} },
  document: { body, getElementById:(id)=>(id in els?els[id]:makeEl()), querySelector:()=>makeEl(), querySelectorAll:()=>[], addEventListener(){}, createElement:()=>makeEl() },
  getComputedStyle: () => ({ position: "relative" }),
  window: { addEventListener(){}, location:{ href:"", replace(){} }, print(){} },
  location: { pathname: "/pages/patient-detail.html", search: "?id=P-001" },
  confirm: ()=>true, alert: ()=>{}, prompt: ()=>null,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataSrc, sandbox, { filename: "data.js" });
vm.runInContext(appSrc, sandbox, { filename: "app.js" });
vm.runInContext(pdSrc, sandbox, { filename: "patient-detail.js" });

const record = vm.runInContext(`buildRecord(DB.patients.find("P-001"))`, sandbox);
const receta = vm.runInContext(`buildReceta(DB.patients.find("P-001"))`, sandbox);

function page(inner, label) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${label} — Print Preview</title>
<style>${css}</style>
<style>@media screen{ body{background:#e5e7eb;padding:22px;} #printArea{display:block;background:#fff;width:210mm;min-height:297mm;margin:0 auto;box-sizing:border-box;box-shadow:0 4px 18px rgba(0,0,0,.18);padding:10mm 9mm;} }</style>
</head><body><div id="printArea">${inner}</div></body></html>`;
}

fs.writeFileSync(path.join(projectRoot, "previews", "preview-record.html"), page(record, "Patient Record"));
fs.writeFileSync(path.join(projectRoot, "previews", "preview-receta.html"), page(receta, "Receta"));
console.log("Generated previews/preview-record.html and previews/preview-receta.html");
