# Inventory POC - Implementation Notes

## Current Status

Phase 1: Planning - awaiting approval

## Implementation Checklist

### Phase 1: Data Model + Part Entry
- [ ] state.js updated
- [ ] storage.js updated
- [ ] parts.js created
- [ ] views.js created (Manage + AddPart)
- [ ] app.js rewritten (router + nav)
- [ ] index.html updated (nav + scripts)
- [ ] CSS styled (form, cards, nav)
- [ ] Tested: CRUD persists on refresh

### Phase 2: Dashboard + Reorder Alerts
- [ ] Dashboard view built
- [ ] Quantity bars working
- [ ] Search + filter working
- [ ] Responsive layout verified
- [ ] Tested: low-stock items highlighted

### Phase 3: QR Generation + Printing
- [ ] qrcodejs integrated
- [ ] qr.js created
- [ ] Print single + Print All working
- [ ] Print styles clean
- [ ] Tested: printed QR scans correctly

### Phase 4: Camera Scanning + Decrement
- [ ] html5-qrcode integrated
- [ ] scanner.js created
- [ ] Scan view + Part Detail built
- [ ] Decrement + transaction logging working
- [ ] Threshold toast working
- [ ] Tested: full scan-to-decrement flow on phone

### Phase 5: Restock + Polish
- [ ] Restock flow working
- [ ] Custom decrement working
- [ ] SW + manifest updated
- [ ] Accessibility audit passed
- [ ] Lighthouse 90+ all categories
- [ ] Tested: PWA installs + works offline

## Issues and Resolutions

(none yet)

## Deviations from Plan

(none yet)
