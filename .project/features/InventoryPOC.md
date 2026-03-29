# Inventory POC - Feature Plan

## Executive Summary

Single-user proof of concept for garage parts inventory management. Manager enters parts into bins, generates QR labels for bins, technicians scan QR codes via phone camera to decrement stock. Dashboard shows inventory levels with configurable threshold alerts for reordering.

## Requirements

- Manager can add, edit, and delete parts (part number, prefix, name, bin location, max qty, reorder threshold)
- App generates QR codes from part numbers for printing bin labels
- Technician scans bin QR with phone camera to pull up part
- One-tap decrement ("Use 1") to log part removal
- Dashboard shows all parts with visual quantity levels
- Parts at or below threshold (default 50%) highlighted with "REORDER" alert
- Search and filter across all parts
- All data stored in localStorage (single user, no backend)
- Works as installable PWA, offline-capable after first load

## Architecture Overview

- Bottom tab navigation: Dashboard | Scan | Manage
- Simple view router in app.js (no framework)
- External libraries via CDN: html5-qrcode (scanning), qrcodejs (generation)
- Transaction log for every quantity change (audit trail)

## Data Model

**Part**: id, partNumber, prefix, name, binLocation, maxQuantity, currentQuantity, reorderThreshold, createdAt, updatedAt

**Transaction**: id, partId, type (decrement/restock/adjust), quantityChange, previousQuantity, newQuantity, timestamp

**Settings**: defaultThreshold (50), companyName

## QR Strategy

Encode partNumber as plain text string. Lookup on scan via exact match. High-contrast codes for garage lighting.

## Task Breakdown

### Phase 1: Data Model + Part Entry
- [ ] Update state.js with new AppState shape
- [ ] Add TRANSACTIONS key to storage.js
- [ ] Create parts.js (CRUD, search, threshold queries)
- [ ] Create views.js (renderManageView, renderAddPart)
- [ ] Update app.js (router, nav, init)
- [ ] Update index.html (bottom nav, script tags)
- [ ] Style form, cards, nav in CSS

### Phase 2: Dashboard + Reorder Alerts
- [ ] renderDashboard with search bar, status filter
- [ ] Quantity bar component (green/yellow/red)
- [ ] Reorder badge on threshold parts
- [ ] Sort: low-stock first, then alphabetical
- [ ] Responsive grid (1-col mobile, 2-col tablet, 3-col desktop)

### Phase 3: QR Code Generation + Printing
- [ ] Add qrcodejs CDN to index.html
- [ ] Create qr.js (generate, print single, print all)
- [ ] Print QR button per part in Manage view
- [ ] Print All QR Codes button
- [ ] @media print styles

### Phase 4: Camera Scanning + Decrement
- [ ] Add html5-qrcode CDN to index.html
- [ ] Create scanner.js (camera lifecycle, decode handler)
- [ ] renderScanView (camera container, rear-facing preference)
- [ ] renderPartDetail (quantity display, Use 1, quantity bar)
- [ ] decrementPart with transaction logging
- [ ] Toast notification at threshold
- [ ] Camera cleanup on view change

### Phase 5: Restock + Polish
- [ ] Restock flow on Part Detail
- [ ] Custom decrement (remove N)
- [ ] Update sw.js (new files, cache bump)
- [ ] Update manifest.json
- [ ] Accessibility: keyboard nav, focus management, ARIA
- [ ] Lighthouse audit

## Integration Points

- localStorage via existing Storage module
- Service worker for offline support (network-first)
- PWA manifest for installability

## Accessibility

- All form inputs with labels (no placeholders)
- 44x44px minimum touch targets
- 4.5:1 color contrast
- Keyboard navigable views
- Focus management on view switches
- ARIA labels on icon-only buttons
- role="alert" on threshold notifications

## Acceptance Criteria

1. Manager adds a part -> it persists across refresh
2. QR label prints cleanly with correct part number
3. Phone scans QR -> correct part appears
4. "Use 1" decrements quantity and logs transaction
5. Parts at threshold show reorder alert on dashboard
6. Search filters parts by name or number
7. App installs as PWA and works offline
8. Lighthouse 90+ all categories
