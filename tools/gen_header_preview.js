/* Generates a standalone preview of the polished APP HEADER (appbar + pagebar)
   using the REAL renderLayout() + style.css, so you can see it instantly.
   Run: node tools/gen_header_preview.js  →  open previews/preview-header.html  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const dataSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "data.js"), "utf8");
const appSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");

function makeEl() {
  const el = { _html: "", classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);}, contains(c){return this._s.has(c);} }, style:{}, dataset:{}, value:"", textContent:"", hidden:false, addEventListener(){}, appendChild(){}, setAttribute(){}, getAttribute(){return null;}, querySelectorAll(){return [];}, querySelector(){return null;} };
  Object.defineProperty(el, "innerHTML", { get(){return this._html;}, set(v){this._html = String(v);} });
  return el;
}

const backing = {};
const body = makeEl();
const els = { appbarNav: makeEl(), overlayNav: makeEl(), appbarToggle: makeEl(), toastHost: null };
backing["rmc_session"] = JSON.stringify({ userId: "u0", name: "Rever Admin", role: "superadmin" });
backing["rmc_users"] = JSON.stringify([{ id:"u0", name:"Rever Admin", role:"superadmin" }]);

const sandbox = {
  console, Math, JSON, Date, isFinite, Array, Object, Uint8Array, Float64Array, Int32Array, Set, Map,
  localStorage: { getItem:(k)=>(k in backing?backing[k]:null), setItem:(k,v)=>{backing[k]=String(v);}, removeItem:(k)=>{delete backing[k];}, clear:()=>{} },
  document: { body, getElementById:(id)=>(id in els?els[id]:makeEl()), querySelector:()=>makeEl(), querySelectorAll:()=>[], addEventListener(){}, createElement:()=>makeEl() },
  getComputedStyle: () => ({ position: "relative" }),
  window: { addEventListener(){}, location:{ href:"", replace(){} } },
  location: { pathname: "/pages/dashboard.html", search: "" },
  confirm: ()=>true, alert: ()=>{}, prompt: ()=>null,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataSrc, sandbox, { filename: "data.js" });
vm.runInContext(appSrc, sandbox, { filename: "app.js" });

const sampleContent = `
  <div class="grid grid-4 mb-20">
    <div class="stat"><div class="stat-top"><div><div class="stat-label">Total Patients</div><div class="stat-value">128</div></div><div class="stat-ico ico-teal">👥</div></div></div>
    <div class="stat"><div class="stat-top"><div><div class="stat-label">Consultations</div><div class="stat-value">42</div></div><div class="stat-ico ico-blue">🩺</div></div></div>
    <div class="stat"><div class="stat-top"><div><div class="stat-label">Waiting</div><div class="stat-value">7</div></div><div class="stat-ico ico-purple">⏳</div></div></div>
    <div class="stat"><div class="stat-top"><div><div class="stat-label">Income</div><div class="stat-value">₱24,500</div></div><div class="stat-ico ico-green">💰</div></div></div>
  </div>
  <div class="card card-pad"><p class="text-muted">Sample content — ito ang page body sa ilalim ng header.</p></div>`;

vm.runInContext(`renderLayout({
  page: "dashboard.html",
  title: "System Overview",
  subtitle: "Kabuuan ng Rever Medical Center, Inc. — real-time na balita.",
  actions: '<button class="btn btn-primary">➕ Quick Action</button>',
  content: ${JSON.stringify(sampleContent)}
});`, sandbox);

const shell = body.innerHTML;
const out = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Header Preview — Rever Medical Center</title>
<style>${css}</style>
<style>body{background:var(--bg);} .content{min-height:60vh;}</style>
</head><body>${shell}</body></html>`;

fs.writeFileSync(path.join(projectRoot, "previews", "preview-header.html"), out);
console.log("Generated previews/preview-header.html — open it to see the polished header (Super Admin nav).");
