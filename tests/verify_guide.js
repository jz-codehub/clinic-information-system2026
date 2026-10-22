// Validates guide-map.html: syntax + A* wall-avoidance + existing-room delete/rename.
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const file = path.join(projectRoot, "pages", "guide-map.html");
const html = fs.readFileSync(file, "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!m) { console.error("FAIL: inline script not found"); process.exit(1); }
const script = m[1];

// --- 1) Syntax check (parse only) ---
try {
  new vm.Script(script, { filename: "guide-map.inline.js" });
  console.log("PASS syntax: inline script parses");
} catch (e) { console.error("FAIL syntax:", e.message); process.exit(1); }

// --- 2) Minimal sandbox so top-level bindings + logic can run ---
const backing = {};
const pointerHandlers = {};
// Tolerant fake DOM element: property sets ok, unknown methods are no-ops.
const fakeEl = () => new Proxy({
  classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  style:{}, dataset:{}, value:"", textContent:"", innerHTML:"", hidden:false,
  addEventListener(){}, removeEventListener(){}, appendChild(){}, setAttribute(){}, getAttribute(){ return null; }, focus(){}, remove(){},
  querySelectorAll(){ return []; }, querySelector(){ return null; },
}, { get(t,k){ return (k in t) ? t[k] : (()=>{}); }, set(t,k,v){ t[k]=v; return true; } });
const sandbox = {
  console, Math, JSON, Date, isFinite, Array, Object, Uint8Array, Float64Array, Int32Array, Set, Map,
  setTimeout:(fn)=>{ fn(); return 0; },
  localStorage: { getItem:(k)=>(k in backing?backing[k]:null), setItem:(k,v)=>{backing[k]=String(v);}, removeItem:(k)=>{delete backing[k];}, clear:()=>{for(const k in backing)delete backing[k];} },
  read: (k, d) => (k in backing ? JSON.parse(backing[k]) : d),
  store: (k, v) => { backing[k] = JSON.stringify(v); },
  App: { esc:(s)=>String(s==null?"":s), toast:()=>{}, openModal:()=>{}, closeModal:()=>{} },
  DB: { session:()=>({role:"superadmin"}), users:{ all:()=>[] } },
  requireAuth: ()=>{},
  renderLayout: ()=>{},
  document: { getElementById:()=>fakeEl(), querySelector:()=>fakeEl(), querySelectorAll:()=>[], addEventListener:()=>{}, body:{style:{}}, createElementNS:()=>fakeEl() },
  window: {
    addEventListener:(name, fn)=>{ pointerHandlers[name] = fn; },
    removeEventListener:(name, fn)=>{ if(pointerHandlers[name] === fn) delete pointerHandlers[name]; },
  },
  confirm: ()=>true, alert: ()=>{}, prompt: ()=>null,
};
sandbox.globalThis = sandbox;
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);
try { vm.runInContext(script, sandbox, { filename:"guide-map.inline.js" }); }
catch (e) { console.log("note: boot threw (expected in sandbox):", e.message); }

const T = vm.runInContext(`({
  routeTo, routePoints, parseWallSegs, buildBlocked, distSeg, astar, legPath,
  allRooms, deptById, LAYOUT, WALLS_BASE, DEPTS, ENTRANCES, geom, isEntrance,
  roomNo, GMAP, doorPoint, doorFromPoint, wrapName, fitName, wallSegs,
  setStart:(id)=>{ startId = id; }, getStart:()=>startId,
  deleteSelected, setSel:(id)=>{ selId = id; },
  clampPan, startPan,
  setPanForTest:(el, z, x, y)=>{ holder = el; zoom = z; panX = x; panY = y; clampPan(); return { x:panX, y:panY }; },
})`, sandbox);

let fail = 0;
const ok = (cond, msg) => { if (cond) console.log("PASS " + msg); else { console.log("FAIL " + msg); fail++; } };

// --- Fullscreen map and drag/zoom controls are available independently of admin edit mode ---
ok(/\.gm-map-card\.gm-fullscreen\s*{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*width:\s*100vw;[^}]*height:\s*100vh;[^}]*height:\s*100dvh;/s.test(html), "map fullscreen fills the viewport at desktop and mobile sizes");
ok(/\.gm-map-card\.gm-fullscreen \.gm-toolbar,[\s\S]*?\.gm-map-card\.gm-fullscreen \.route-box\s*{\s*display:\s*none !important;/.test(html) && /\.gm-map-card\.gm-fullscreen \.gm-holder svg\s*{\s*pointer-events:\s*none;/.test(html), "fullscreen hides all controls and lets map drags start anywhere");
ok(/class="gm-exit-full" onclick="toggleFull\(\)" aria-label="Exit fullscreen map">[^<]*Exit Fullscreen<\/button>/.test(script), "fullscreen includes an accessible Exit Fullscreen button");
ok(/\.gm-map-card\.gm-fullscreen\s*{[^}]*transform:\s*none !important;/.test(html) && /\.gm-map-card\.gm-fullscreen > \.gm-exit-full\s*{[^}]*position:\s*fixed;[^}]*z-index:\s*10001;[^}]*display:\s*inline-flex;/.test(html), "exit button is fixed above the map holder and card hover transform");
ok(/card\.requestFullscreen\(\)/.test(script) && /document\.addEventListener\("fullscreenchange"/.test(script), "fullscreen uses the Fullscreen API so only the map covers the whole screen, with CSS overlay fallback");
  ok(/\.gm-map-card\.gm-fullscreen \.gm-holder svg \.room,[\s\S]*?\.gm-map-card\.gm-fullscreen \.gm-holder svg \.ent-flag\s*{\s*pointer-events:\s*auto;/.test(html), "fullscreen keeps the route line usable: rooms, doors, entrances and S/D markers stay interactive");
ok(/id="btnZoomIn"/.test(script) && /id="btnZoomOut"/.test(script) && /id="btnZoomReset"/.test(script), "zoom in, out and reset controls exist outside the admin-only toolbar");
ok(/holder\.addEventListener\("wheel",\s*zoomAtPointer,\s*{\s*passive:false\s*}\)/.test(script), "mouse wheel zoom is attached to the map");
ok(/holder\.classList\.add\("is-panning"\)/.test(script) && /panX\s*=\s*px\s*\+\s*dx/.test(script) && /panY\s*=\s*py\s*\+\s*dy/.test(script), "mouse drag pans the map canvas rather than using scrollbars");
const freePan = T.setPanForTest({ clientWidth:1000, clientHeight:800, closest:()=>({}) }, 1, 1000, -1000);
ok(freePan.x === 1000 && freePan.y === -1000, "map pans freely with no boundary limit at 100% zoom");
const panHolder = {
  clientWidth:1000, clientHeight:800, classList:{ add(){}, remove(){} },
  closest:()=>({}), style:{},
};
T.setPanForTest(panHolder, 1, 0, 0);
T.startPan({ button:0, clientX:10, clientY:20, target:{ closest:()=>null } });
if (pointerHandlers.pointermove) pointerHandlers.pointermove({ clientX:110, clientY:95 });
const dragged = vm.runInContext("({ x:panX, y:panY })", sandbox);
ok(dragged.x === 100 && dragged.y === 75, "mouse pointer movement drags the fullscreen map without scrolling");
if (pointerHandlers.pointerup) pointerHandlers.pointerup();
ok(/svg\.style\.transform\s*=\s*"translate\("/.test(script) && /function resetMapView\(\)/.test(script), "zoom and pan are applied to the map and can be reset");
ok(/holder\.addEventListener\("dblclick",[\s\S]*?toggleFull\(\)/.test(script) && /e\.key === "Escape"[\s\S]*?toggleFull\(\)/.test(script), "fullscreen can be exited by double-click or Escape");

// --- Print: the guide map fills ONE WHOLE A4 landscape bond-paper page ---
ok(/@media print \{\s*@page \{ size: A4 landscape; margin: 3mm 4mm; \}/.test(html), "print flips this page to A4 landscape (document-owned @page override)");
ok(/\.gm-p-sheet\s*\{[^}]*width:\s*289mm;[^}]*height:\s*204mm;[^}]*overflow:\s*hidden;/s.test(html) && /\.gm-p-map\s*\{[^}]*flex:\s*1 1 auto;[^}]*position:\s*relative;/s.test(html) && /\.gm-p-map > svg\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/s.test(html), "print sheet is an exact 289x204mm landscape box with the map box stretched to fill it");
ok(/class="gm-p-sheet"/.test(script) && /class="gm-p-head"/.test(script) && /class="gm-p-map"/.test(script) && /class="gm-p-legend"/.test(script) && /position:absolute;left:0;top:0;width:100%;height:100%;display:block;transform:none;/.test(script), "printGuideMap stacks title, full-bleed map and legend inside the A4 box");

// --- Baked defaults: a fresh load (nothing stored) returns the admin's edited map ---
ok(T.LAYOUT.deleted().includes("opd2") && T.LAYOUT.deleted().includes("er3"), "baked default hides deleted rooms (opd2, er3, ...)");
ok(T.LAYOUT.boxes().length === 6, "baked default includes 6 custom room boxes");
ok(T.GMAP.names()["vitals"] === "Radiology", "baked default renames vitals → Radiology");
ok(T.GMAP.names()["waiting"] === "Medical Records, HMO, Billing, Accounting", "baked default renames the waiting area");
ok(T.roomNo(T.deptById("cr")) === "RM 111", "baked default sets Comfort Room number RM 111");

// --- Establish a clean slate so the LOGIC tests below run on pristine DEPTS ---
// (The baked defaults are data; the tests below validate routing/delete/rename logic.)
T.LAYOUT.save({ rooms:{}, walls:[], cols:{}, rows:{}, boxes:[], ways:[], chairs:[], colNames:{}, colNos:{}, doors:{}, deleted:[] });
T.GMAP.save({ names:{}, nos:{}, editors:[] });

// --- Feature 1: existing (default) rooms deletable + renameable ---
const before = T.allRooms().length;
ok(before === T.DEPTS.length, `allRooms starts with default rooms (${before})`);
T.setSel("opd1"); T.deleteSelected();
ok(T.allRooms().length === before - 1, "deleting a default room hides it from allRooms");
ok(T.deptById("opd1") === undefined, "deptById(opd1) gone after delete");
ok(T.LAYOUT.deleted().includes("opd1"), "opd1 recorded in LAYOUT.deleted");
T.LAYOUT.resetGeo();
ok(T.allRooms().length === before, "resetGeo restores deleted room");
T.LAYOUT.addBox({ id:"bxtest1", name:"New Room", no:"", icon:"x", cat:"Custom", x:100, y:100, w:80, h:60, door:"L" });
ok(T.deptById("bxtest1") && T.deptById("bxtest1").name === "New Room", "box visible via deptById (rename target exists)");

// --- Feature 3: A* arrow does not penetrate walls ---
function parseWallsBase() {
  const segs = [];
  T.WALLS_BASE.forEach((dstr) => {
    const ps = []; const re = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g; let m;
    while ((m = re.exec(dstr))) ps.push({ x:+m[1], y:+m[2] });
    for (let i = 1; i < ps.length; i++) segs.push([ps[i-1], ps[i]]);
  });
  return segs;
}
const baseSegs = parseWallsBase();
// min distance sampled along polyline segment a-b to wall segment c-d
function segSegDist(a, b, c, d) {
  let best = Infinity;
  const n = Math.max(2, Math.ceil(Math.hypot(b.x-a.x, b.y-a.y)));
  for (let i = 0; i <= n; i++) { const t = i/n, p = { x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t }; best = Math.min(best, T.distSeg(p.x, p.y, c, d)); }
  return best;
}
const targets = ["opd1", "lab", "er3", "waiting", "cashier", "lobby"];
let worst = Infinity;
for (const id of targets) {
  T.setStart("__south");
  const rt = T.routeTo(id);
  ok(rt.points && rt.points.length >= 2, `route to ${id} produced points (${rt.points.length})`);
  const pts = rt.points;
  for (let i = 1; i < pts.length; i++) {
    if (i === pts.length - 1) continue; // final door->centre hop is inside the room
    for (const w of baseSegs) worst = Math.min(worst, segSegDist(pts[i-1], pts[i], w[0], w[1]));
  }
}
console.log(`  (min clearance route<->structural walls: ${worst.toFixed(2)} px; wall stroke=6)`);
ok(worst >= 4, "no route segment touches a structural wall (>=4px clearance)");

// --- Feature 3b: a drawn line sealing the corridor forces a detour, not a crossing ---
T.LAYOUT.addWall({ x1:640, y1:600, x2:745, y2:600 }); // horizontal drawn wall across the corridor
T.setStart("__south");
const rt2 = T.routeTo("waiting");
const dw = [{ x:640, y:600 }, { x:745, y:600 }];
let crossMin = Infinity;
for (let i = 1; i < rt2.points.length; i++) crossMin = Math.min(crossMin, segSegDist(rt2.points[i-1], rt2.points[i], dw[0], dw[1]));
console.log(`  (min clearance route<->drawn line: ${crossMin.toFixed(2)} px, pts=${rt2.points.length})`);
ok(crossMin >= 4, "route does not penetrate the drawn line (routes around it)");
T.LAYOUT.delWall(0);

// --- Feature 4: PLUS-sign decorations removed from the map ---
ok(!/class:\s*"plus"/.test(script), "plus-sign decorations removed (no class:'plus')");
ok(!/\.plus\s*\{/.test(script), "plus CSS rule removed");

// --- Feature 5: room number is editable + can be blank (even over a default) ---
ok(T.roomNo(T.deptById("opd1")) === "RM 101", "default room number shown when no override");
T.GMAP.setNo("opd1", "RM 201");
ok(T.roomNo(T.deptById("opd1")) === "RM 201", "room number override applied");
T.GMAP.setNo("opd1", "");
ok(T.roomNo(T.deptById("opd1")) === "", "room number can be cleared to blank");
const gm = T.GMAP.load(); delete gm.nos["opd1"]; T.GMAP.save(gm); // drop override

// --- Feature 6: rows + per-cell grid room numbers ---
T.setSel("treat");
T.LAYOUT.setRows("treat", 3);
ok(T.LAYOUT.rows()["treat"] === 3, "rows count stored for a room");
T.LAYOUT.setColNo("treat", 0, "R1A");
T.LAYOUT.setColNo("treat", 1, "R1B");
ok(T.LAYOUT.colNos()["treat"][0] === "R1A" && T.LAYOUT.colNos()["treat"][1] === "R1B", "per-cell grid room numbers stored");
T.LAYOUT.setRows("treat", 1); // cleanup

// --- Feature 7: route ends AT the door (no centre hop, never crosses a wall) ---
const dR = T.deptById("opd1");
const gR = T.geom(dR);
const dpR = T.doorPoint(dR, gR);
ok(dpR && Math.abs(dpR.x - (gR.x + gR.w)) < 0.01 && Math.abs(dpR.y - (gR.y + gR.h / 2)) < 0.01, "doorPoint computed on room edge (R door)");
T.setStart("__south");
const rp = T.routePoints("opd1");
const lastP = rp[rp.length - 1];
ok(Math.abs(lastP.x - dpR.x) < 1 && Math.abs(lastP.y - dpR.y) < 1, "route ends at the door point (no centre hop)");
let worstAll = Infinity;
for (let i = 1; i < rp.length; i++)
  for (const w of baseSegs) worstAll = Math.min(worstAll, segSegDist(rp[i - 1], rp[i], w[0], w[1]));
console.log(`  (min clearance incl. final leg: ${worstAll.toFixed(2)} px)`);
ok(worstAll >= 4, "no route segment (incl. final) touches a structural wall");

// --- Feature 8: doors are editable (drag along any edge) ---
T.setStart("__south");
const dd = T.deptById("opd1");
const gg = T.geom(dd);
ok(T.doorPoint(dd, gg).edge === "R", "default door side is R for opd1");
T.LAYOUT.setDoor("opd1", "L", 0.3);
const dp2 = T.doorPoint(dd, gg);
ok(dp2.edge === "L" && Math.abs(dp2.x - gg.x) < 0.01 && Math.abs(dp2.y - (gg.y + 0.3 * gg.h)) < 0.5, "door override moves it to the L edge at t=0.3");
// dragging a pointer near the top edge snaps the door to that edge
const near = T.doorFromPoint(dd, gg, { x: gg.x + gg.w * 0.2, y: gg.y - 5 });
ok(near.edge === "T", "doorFromPoint snaps a drag near the top edge to T");
T.LAYOUT.clearDoor("opd1");
ok(T.doorPoint(dd, gg).edge === "R", "clearDoor restores the default door side");

// --- Feature 9: long room names wrap onto multiple centred lines ---
ok(JSON.stringify(T.wrapName("admitting section", 9)) === JSON.stringify(["admitting", "section"]), "wrapName breaks 'admitting section' into two lines");
ok(T.wrapName("HMO", 9).length === 1, "short name stays on one line");
const fn = T.fitName("admitting section", 90, 11);
ok(fn.lines.length >= 1 && fn.fs >= 7 && fn.fs <= 11, `fitName shrinks font within bounds (fs=${fn.fs.toFixed(1)}, lines=${fn.lines.length})`);

// --- Feature 10: drawn lines get a wider clearance so the arrow steers clear ---
T.LAYOUT.addWall({ x1:640, y1:600, x2:745, y2:600 });
const rt3 = T.routeTo("waiting");
const dwl = [{ x:640, y:600 }, { x:745, y:600 }];
let clr = Infinity;
for (let i = 1; i < rt3.points.length; i++) clr = Math.min(clr, segSegDist(rt3.points[i - 1], rt3.points[i], dwl[0], dwl[1]));
console.log(`  (min clearance route<->drawn line now: ${clr.toFixed(2)} px)`);
ok(clr >= 12, "route keeps a >=12px buffer from drawn lines");
T.LAYOUT.delWall(0);

// --- Feature 11: route never cuts through an ENCLOSED room/box interior ---
// Open halls (door:null, e.g. lobby/entrance) are walkable, so they're excluded.
function insideRoom(px, py, excludeId) {
  return T.allRooms().some((d) => {
    if (d.id === excludeId || !d.door) return false;
    const g = T.geom(d);
    return px > g.x + 7 && px < g.x + g.w - 7 && py > g.y + 7 && py < g.y + g.h - 7;
  });
}
function whichRoom(px, py, excludeId) {
  return T.allRooms().filter((d) => d.id !== excludeId && d.door && (() => { const g = T.geom(d); return px > g.x + 7 && px < g.x + g.w - 7 && py > g.y + 7 && py < g.y + g.h - 7; })()).map((d) => d.id).join(",");
}
let cutCount = 0;
for (const id of ["opd1", "treat", "vitals", "admit", "lab", "xray", "er3", "waiting", "cashier", "records"]) {
  T.setStart("__south");
  const rtc = T.routeTo(id);
  let cut = "", cutAt = null;
  for (let i = 0; i < rtc.points.length - 1 && !cut; i++) {
    const a = rtc.points[i], b = rtc.points[i + 1];
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let k = 0; k <= n; k++) {
      const t = k / n, px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
      if (insideRoom(px, py, id)) { cut = whichRoom(px, py, id); cutAt = { px: Math.round(px), py: Math.round(py) }; break; }
    }
  }
  if (cut) cutCount++;
  ok(!cut, `route to ${id} avoids all enclosed rooms (pts=${rtc.points.length}${cut ? ", cut " + cut + " @ " + JSON.stringify(cutAt) : ""})`);
}
console.log(cutCount === 0 ? "  (no route cut through any enclosed room)" : `  (${cutCount} route(s) cut through a room)`);

console.log(fail === 0 ? "\nALL TESTS PASSED" : `\n${fail} TEST(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
