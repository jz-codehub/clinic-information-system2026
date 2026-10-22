# 💾 BACKUP — Guide Map + Print Schedules
Created: see folder name (yyyyMMdd_HHmmss)

This backup captures the WORKING state of two features so they can be restored
if a future edit breaks them.

## 📁 Contents

### guide-map/
- `guide-map.html`   — Guide Map page (WITH baked-in DEFAULT_LAYOUT + DEFAULT_GMAP = admin's edited map)
- `verify_guide.js`  — its test suite

### print-schedules/
- `schedules.js`     — Doctor Schedules data + print doc (masonry 2-col week, 1-page, secretary number, no Status)
- `style.css`        — print CSS (@page 6mm/8mm, day boxes, masonry columns)
- `app.js`           — app shell + printSheet (waits for images; logo as base64)
- `rmci-logo-data.js`— clinic logo embedded as base64 (always renders in print)
- `schedules.html`   — Doctor Schedules page
- `myclinic.html`    — My Clinic page (also prints schedules)
- `verify_sched_print.js`, `verify_layout.js`, `verify_new_doctors.js` — test suites
- `gen_print_preview.js` — regenerates preview-print-*.html
- `preview-print-week.html`, `preview-print-today.html` — visual print previews

## ♻️ HOW TO RESTORE

From the project root, copy the files back over the live ones:

```powershell
$b = "backups\<THIS-FOLDER-NAME>"   # e.g. backups\20261015_111638

Copy-Item "$b/guide-map/guide-map.html"  "pages/guide-map.html"  -Force
Copy-Item "$b/guide-map/verify_guide.js" "verify_guide.js"       -Force

Copy-Item "$b/print-schedules/schedules.js"      "assets/js/schedules.js"      -Force
Copy-Item "$b/print-schedules/style.css"         "assets/css/style.css"        -Force
Copy-Item "$b/print-schedules/app.js"            "assets/js/app.js"            -Force
Copy-Item "$b/print-schedules/rmci-logo-data.js" "assets/js/rmci-logo-data.js" -Force
Copy-Item "$b/print-schedules/schedules.html"    "pages/schedules.html"        -Force
Copy-Item "$b/print-schedules/myclinic.html"     "pages/myclinic.html"         -Force
```

## ✅ VERIFY AFTER RESTORE
```powershell
node verify_guide.js
node verify_sched_print.js
node verify_pages.js
```
All should print "ALL ... PASSED".
