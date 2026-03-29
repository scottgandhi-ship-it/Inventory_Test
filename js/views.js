/* Views Module - Renders each app view into #mainContent */
const Views = (function () {
  'use strict';

  const main = function () { return document.getElementById('mainContent'); };

  /* ── Manage View ── */
  function renderManageView() {
    const container = main();
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'view-header';

    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = 'Manage Parts';
    header.appendChild(title);

    const headerBtns = document.createElement('div');
    headerBtns.className = 'header-btns';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = 'Add Part';
    addBtn.setAttribute('aria-label', 'Add a new part');
    addBtn.addEventListener('click', function () {
      App.navigate('add-part');
    });
    headerBtns.appendChild(addBtn);

    const importBtn = document.createElement('button');
    importBtn.className = 'btn-secondary';
    importBtn.textContent = 'Import CSV';
    importBtn.setAttribute('aria-label', 'Import parts from CSV file');
    importBtn.addEventListener('click', function () {
      App.navigate('import');
    });
    headerBtns.appendChild(importBtn);

    if (AppState.items.length > 0) {
      const printAllBtn = document.createElement('button');
      printAllBtn.className = 'btn-secondary';
      printAllBtn.textContent = 'Print All QR';
      printAllBtn.setAttribute('aria-label', 'Print QR labels for all parts');
      printAllBtn.addEventListener('click', function () {
        QR.printAllLabels(AppState.items);
      });
      headerBtns.appendChild(printAllBtn);
    }

    header.appendChild(headerBtns);
    container.appendChild(header);

    if (AppState.items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No parts yet. Add your first part to get started.';
      container.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'parts-list';

    AppState.items.forEach(function (part) {
      list.appendChild(_createPartCard(part, true));
    });

    container.appendChild(list);
  }

  /* ── Add / Edit Part View ── */
  function renderAddPart(existingPart) {
    const container = main();
    container.innerHTML = '';

    const isEdit = !!existingPart;

    const header = document.createElement('div');
    header.className = 'view-header';

    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = isEdit ? 'Edit Part' : 'Add Part';
    header.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.textContent = 'Back';
    backBtn.setAttribute('aria-label', 'Back to manage parts');
    backBtn.addEventListener('click', function () {
      App.navigate('manage');
    });
    header.appendChild(backBtn);
    container.appendChild(header);

    const form = document.createElement('form');
    form.className = 'part-form';
    form.setAttribute('novalidate', '');

    // Split partNumber back into prefix + number for editing
    let editPrefix = '';
    let editNumber = '';
    if (isEdit) {
      editPrefix = existingPart.prefix || '';
      editNumber = existingPart.prefix
        ? existingPart.partNumber.replace(existingPart.prefix + '-', '')
        : existingPart.partNumber;
    }

    const fields = [
      { id: 'partPrefix', label: 'Prefix (optional)', type: 'text', value: editPrefix, required: false },
      { id: 'partNumber', label: 'Part Number', type: 'text', value: editNumber, required: true },
      { id: 'partName', label: 'Part Name', type: 'text', value: isEdit ? existingPart.name : '', required: true },
      { id: 'binLocation', label: 'Bin Location', type: 'text', value: isEdit ? existingPart.binLocation : '', required: true },
      { id: 'maxQuantity', label: 'Max Quantity', type: 'number', value: isEdit ? existingPart.maxQuantity : '', required: true, min: 1 },
      { id: 'currentQuantity', label: 'Current Quantity', type: 'number', value: isEdit ? existingPart.currentQuantity : '', required: true, min: 0 },
      { id: 'reorderThreshold', label: 'Reorder Threshold %', type: 'number', value: isEdit ? existingPart.reorderThreshold : (AppState.settings.defaultThreshold || 50), required: true, min: 1, max: 100 }
    ];

    fields.forEach(function (f) {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.setAttribute('for', f.id);
      label.textContent = f.label;
      group.appendChild(label);

      const input = document.createElement('input');
      input.type = f.type;
      input.id = f.id;
      input.name = f.id;
      input.required = f.required;
      if (f.value !== undefined && f.value !== '') input.value = f.value;
      if (f.min !== undefined) input.min = f.min;
      if (f.max !== undefined) input.max = f.max;
      group.appendChild(input);

      form.appendChild(group);
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-primary btn-full';
    submitBtn.textContent = isEdit ? 'Update Part' : 'Save Part';
    form.appendChild(submitBtn);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      _handlePartSubmit(form, existingPart);
    });

    container.appendChild(form);
  }

  /* ── Dashboard View ── */
  function renderDashboard() {
    const container = main();
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'view-header';
    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = 'Inventory Dashboard';
    header.appendChild(title);

    var pendingCount = Reorder.getPendingCount();
    if (pendingCount > 0) {
      var queueBtn = document.createElement('button');
      queueBtn.className = 'btn-accent';
      queueBtn.textContent = 'Reorder Queue (' + pendingCount + ')';
      queueBtn.setAttribute('aria-label', pendingCount + ' items pending reorder');
      queueBtn.addEventListener('click', function () { App.navigate('reorder'); });
      header.appendChild(queueBtn);
    }

    container.appendChild(header);

    if (AppState.items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No parts in inventory. Go to Manage to add parts.';
      container.appendChild(empty);
      return;
    }

    // Summary banner - clickable to open reorder queue
    const lowCount = Parts.getAtThreshold().length;
    if (lowCount > 0) {
      const banner = document.createElement('button');
      banner.className = 'alert-banner alert-banner--clickable';
      banner.setAttribute('role', 'alert');
      banner.textContent = lowCount + ' part' + (lowCount > 1 ? 's' : '') + ' need reordering — tap to view queue';
      banner.addEventListener('click', function () { App.navigate('reorder'); });
      container.appendChild(banner);
    }

    // Search bar
    const searchWrap = document.createElement('div');
    searchWrap.className = 'search-wrap';

    const searchLabel = document.createElement('label');
    searchLabel.setAttribute('for', 'dashboardSearch');
    searchLabel.className = 'sr-only';
    searchLabel.textContent = 'Search parts';
    searchWrap.appendChild(searchLabel);

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = 'dashboardSearch';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search parts by name, number, or bin');
    if (AppState.searchQuery) searchInput.value = AppState.searchQuery;
    searchInput.addEventListener('input', function () {
      AppState.searchQuery = searchInput.value.trim();
      _refreshPartsList(listContainer);
    });
    searchWrap.appendChild(searchInput);
    container.appendChild(searchWrap);

    // Filter toggles
    const filterWrap = document.createElement('div');
    filterWrap.className = 'filter-wrap';

    var filters = [
      { value: null, label: 'All' },
      { value: 'low', label: 'Low Stock' },
      { value: 'ok', label: 'In Stock' }
    ];

    filters.forEach(function (f) {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (AppState.filterStatus === f.value ? ' filter-btn--active' : '');
      btn.textContent = f.label;
      btn.setAttribute('aria-pressed', AppState.filterStatus === f.value ? 'true' : 'false');
      btn.addEventListener('click', function () {
        AppState.filterStatus = f.value;
        renderDashboard();
      });
      filterWrap.appendChild(btn);
    });
    container.appendChild(filterWrap);

    // Parts list
    const listContainer = document.createElement('div');
    listContainer.className = 'parts-list';
    _refreshPartsList(listContainer);
    container.appendChild(listContainer);
  }

  function _refreshPartsList(listContainer) {
    listContainer.innerHTML = '';
    var sorted = Parts.getSorted(AppState.filterStatus, AppState.searchQuery);
    if (sorted.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No parts match your search.';
      listContainer.appendChild(empty);
      return;
    }
    sorted.forEach(function (part) {
      listContainer.appendChild(_createPartCard(part, false));
    });
  }

  /* ── Scan View ── */
  function renderScanView() {
    const container = main();
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'view-header';
    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = 'Scan Part';
    header.appendChild(title);
    container.appendChild(header);

    const scanContainer = document.createElement('div');
    scanContainer.id = 'scannerContainer';
    scanContainer.className = 'scanner-container';
    container.appendChild(scanContainer);

    const status = document.createElement('p');
    status.id = 'scanStatus';
    status.className = 'scan-status';
    status.textContent = 'Starting camera...';
    container.appendChild(status);

    // Manual entry fallback
    const fallback = document.createElement('div');
    fallback.className = 'scan-fallback';

    const fallbackLabel = document.createElement('label');
    fallbackLabel.setAttribute('for', 'manualPartNumber');
    fallbackLabel.textContent = 'Or enter part number manually';
    fallback.appendChild(fallbackLabel);

    const fallbackRow = document.createElement('div');
    fallbackRow.className = 'scan-fallback-row';

    const fallbackInput = document.createElement('input');
    fallbackInput.type = 'text';
    fallbackInput.id = 'manualPartNumber';
    fallbackRow.appendChild(fallbackInput);

    const fallbackBtn = document.createElement('button');
    fallbackBtn.className = 'btn-primary';
    fallbackBtn.textContent = 'Look Up';
    fallbackBtn.addEventListener('click', function () {
      var val = fallbackInput.value.trim();
      if (val) Scanner.handleDecode(val);
    });
    fallbackRow.appendChild(fallbackBtn);

    fallback.appendChild(fallbackRow);
    container.appendChild(fallback);

    Scanner.start();
  }

  /* ── Part Detail View (post-scan / decrement) ── */
  function renderPartDetail(part) {
    const container = main();
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'view-header';
    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = part.name;
    header.appendChild(title);
    container.appendChild(header);

    const detail = document.createElement('div');
    detail.className = 'part-detail';

    // Part info
    const infoGrid = document.createElement('div');
    infoGrid.className = 'detail-info';
    infoGrid.innerHTML =
      '<div class="detail-row"><span class="detail-label">Part Number</span><span class="detail-value">' + _escapeHtml(part.partNumber) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Bin Location</span><span class="detail-value">' + _escapeHtml(part.binLocation) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Reorder At</span><span class="detail-value">' + Math.ceil(part.maxQuantity * part.reorderThreshold / 100) + ' units (' + part.reorderThreshold + '%)</span></div>';
    detail.appendChild(infoGrid);

    // Large quantity display
    const qtyDisplay = document.createElement('div');
    qtyDisplay.className = 'detail-qty-display';
    qtyDisplay.id = 'detailQty';

    const qtyNumber = document.createElement('span');
    qtyNumber.className = 'detail-qty-number';
    qtyNumber.id = 'detailQtyNumber';
    qtyNumber.textContent = part.currentQuantity;
    qtyDisplay.appendChild(qtyNumber);

    const qtyMax = document.createElement('span');
    qtyMax.className = 'detail-qty-max';
    qtyMax.textContent = ' / ' + part.maxQuantity;
    qtyDisplay.appendChild(qtyMax);

    detail.appendChild(qtyDisplay);

    // Quantity bar
    const barWrap = document.createElement('div');
    barWrap.className = 'quantity-bar-wrap quantity-bar-wrap--lg';
    const bar = document.createElement('div');
    bar.className = 'quantity-bar';
    bar.id = 'detailQtyBar';
    _updateDetailBar(bar, part);
    barWrap.appendChild(bar);
    detail.appendChild(barWrap);

    // Threshold alert (shown if at threshold)
    const alertEl = document.createElement('div');
    alertEl.className = 'detail-alert';
    alertEl.id = 'detailAlert';
    alertEl.setAttribute('role', 'alert');
    if (Parts.isAtThreshold(part)) {
      alertEl.textContent = 'Below reorder threshold -- reorder now';
      alertEl.classList.add('detail-alert--visible');
    }
    detail.appendChild(alertEl);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'detail-actions';
    actions.id = 'detailActions';

    const useOneBtn = document.createElement('button');
    useOneBtn.className = 'btn-primary btn-lg';
    useOneBtn.textContent = 'Use 1';
    useOneBtn.setAttribute('aria-label', 'Remove one ' + part.name + ' from inventory');
    useOneBtn.addEventListener('click', function () {
      _handleDecrement(part, 1);
    });
    actions.appendChild(useOneBtn);

    const useCustomBtn = document.createElement('button');
    useCustomBtn.className = 'btn-secondary btn-lg';
    useCustomBtn.textContent = 'Use Custom';
    useCustomBtn.setAttribute('aria-label', 'Remove a custom number of ' + part.name);
    useCustomBtn.addEventListener('click', function () {
      var amount = prompt('How many to remove?');
      if (amount && parseInt(amount, 10) > 0) {
        _handleDecrement(part, parseInt(amount, 10));
      }
    });
    actions.appendChild(useCustomBtn);

    detail.appendChild(actions);

    // Restock section
    const restockSection = document.createElement('div');
    restockSection.className = 'restock-section';

    const restockToggle = document.createElement('button');
    restockToggle.className = 'btn-accent btn-full';
    restockToggle.textContent = 'Restock';
    restockToggle.setAttribute('aria-label', 'Restock ' + part.name);
    restockToggle.addEventListener('click', function () {
      _showRestockForm(restockSection, part);
    });
    restockSection.appendChild(restockToggle);

    detail.appendChild(restockSection);

    // Secondary actions
    const secondaryActions = document.createElement('div');
    secondaryActions.className = 'detail-secondary-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.textContent = 'Edit Part';
    editBtn.addEventListener('click', function () {
      AppState.activePart = part;
      App.navigate('add-part');
    });
    secondaryActions.appendChild(editBtn);

    const scanAgainBtn = document.createElement('button');
    scanAgainBtn.className = 'btn-secondary';
    scanAgainBtn.textContent = 'Scan Another';
    scanAgainBtn.addEventListener('click', function () {
      App.navigate('scan');
    });
    secondaryActions.appendChild(scanAgainBtn);

    const dashBtn = document.createElement('button');
    dashBtn.className = 'btn-secondary';
    dashBtn.textContent = 'Dashboard';
    dashBtn.addEventListener('click', function () {
      App.navigate('dashboard');
    });
    secondaryActions.appendChild(dashBtn);

    detail.appendChild(secondaryActions);
    container.appendChild(detail);
  }

  function _handleDecrement(part, amount) {
    var result = Parts.decrement(part.id, amount);
    if (!result) return;

    var numEl = document.getElementById('detailQtyNumber');
    var barEl = document.getElementById('detailQtyBar');
    var alertEl = document.getElementById('detailAlert');

    if (numEl) {
      numEl.textContent = result.part.currentQuantity;
      numEl.classList.add('qty-flash');
      setTimeout(function () { numEl.classList.remove('qty-flash'); }, 300);
    }
    if (barEl) _updateDetailBar(barEl, result.part);

    if (result.atThreshold && alertEl) {
      alertEl.textContent = 'Below reorder threshold -- reorder now';
      alertEl.classList.add('detail-alert--visible');
      App.toast('Reorder needed: ' + result.part.name, 'error');
    }
  }

  function _showRestockForm(container, part) {
    container.innerHTML = '';

    const form = document.createElement('div');
    form.className = 'restock-form';

    const label = document.createElement('label');
    label.setAttribute('for', 'restockQty');
    label.textContent = 'New total quantity in bin';
    form.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'restockQty';
    input.min = 0;
    input.value = part.currentQuantity;
    form.appendChild(input);

    const btnRow = document.createElement('div');
    btnRow.className = 'restock-btn-row';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-primary';
    confirmBtn.textContent = 'Confirm Restock';
    confirmBtn.addEventListener('click', function () {
      var val = parseInt(input.value, 10);
      if (isNaN(val) || val < 0) {
        App.toast('Enter a valid quantity.', 'error');
        return;
      }
      var updated = Parts.restock(part.id, val);
      if (updated) {
        App.toast('"' + part.name + '" restocked to ' + updated.currentQuantity + '.', 'success');
        // Re-render the full detail view with fresh data
        AppState.activePart = updated;
        App.navigate('part-detail');
      }
    });
    btnRow.appendChild(confirmBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', function () {
      container.innerHTML = '';
      var restockToggle = document.createElement('button');
      restockToggle.className = 'btn-accent btn-full';
      restockToggle.textContent = 'Restock';
      restockToggle.addEventListener('click', function () {
        _showRestockForm(container, part);
      });
      container.appendChild(restockToggle);
    });
    btnRow.appendChild(cancelBtn);

    form.appendChild(btnRow);
    container.appendChild(form);

    input.focus();
    input.select();
  }

  function _updateDetailBar(bar, part) {
    var pct = part.maxQuantity > 0 ? (part.currentQuantity / part.maxQuantity) * 100 : 0;
    bar.style.width = pct + '%';
    bar.className = 'quantity-bar';
    if (pct <= part.reorderThreshold * 0.5) {
      bar.classList.add('quantity-bar--critical');
    } else if (pct <= part.reorderThreshold) {
      bar.classList.add('quantity-bar--low');
    } else {
      bar.classList.add('quantity-bar--ok');
    }
  }

  /* ── Part Card Component ── */
  function _createPartCard(part, showActions) {
    const card = document.createElement('div');
    card.className = 'part-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'View details for ' + part.name);

    // Dashboard cards are clickable to open Part Detail
    if (!showActions) {
      card.classList.add('part-card--clickable');
      card.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        AppState.activePart = part;
        App.navigate('part-detail');
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          AppState.activePart = part;
          App.navigate('part-detail');
        }
      });
    }

    const isLow = Parts.isAtThreshold(part);
    if (isLow) card.classList.add('part-card--low');

    // Header row: name + badge
    const cardHeader = document.createElement('div');
    cardHeader.className = 'part-card-header';

    const name = document.createElement('span');
    name.className = 'part-card-name';
    name.textContent = part.name;
    cardHeader.appendChild(name);

    if (isLow) {
      const badge = document.createElement('span');
      badge.className = 'reorder-badge';
      badge.textContent = 'REORDER';
      badge.setAttribute('aria-label', 'This part needs to be reordered');
      cardHeader.appendChild(badge);
    }
    card.appendChild(cardHeader);

    // Info row
    const info = document.createElement('div');
    info.className = 'part-card-info';
    info.innerHTML =
      '<span class="part-card-number">' + _escapeHtml(part.partNumber) + '</span>' +
      '<span class="part-card-bin">Bin: ' + _escapeHtml(part.binLocation) + '</span>';
    card.appendChild(info);

    // Quantity bar
    const barWrap = document.createElement('div');
    barWrap.className = 'quantity-bar-wrap';

    const bar = document.createElement('div');
    bar.className = 'quantity-bar';
    const pct = part.maxQuantity > 0 ? (part.currentQuantity / part.maxQuantity) * 100 : 0;
    bar.style.width = pct + '%';

    const thresholdPct = part.reorderThreshold;
    if (pct <= thresholdPct * 0.5) {
      bar.classList.add('quantity-bar--critical');
    } else if (pct <= thresholdPct) {
      bar.classList.add('quantity-bar--low');
    } else {
      bar.classList.add('quantity-bar--ok');
    }

    barWrap.appendChild(bar);
    card.appendChild(barWrap);

    // Quantity text
    const qtyText = document.createElement('div');
    qtyText.className = 'part-card-qty';
    qtyText.textContent = part.currentQuantity + ' / ' + part.maxQuantity;
    card.appendChild(qtyText);

    // Actions (Manage view only)
    if (showActions) {
      const actions = document.createElement('div');
      actions.className = 'part-card-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-small';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit ' + part.name);
      editBtn.addEventListener('click', function () {
        AppState.activePart = part;
        App.navigate('add-part');
      });
      actions.appendChild(editBtn);

      const qrBtn = document.createElement('button');
      qrBtn.className = 'btn-small';
      qrBtn.textContent = 'Print QR';
      qrBtn.setAttribute('aria-label', 'Print QR label for ' + part.name);
      qrBtn.addEventListener('click', function () {
        QR.printLabel(part);
      });
      actions.appendChild(qrBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-small btn-danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete ' + part.name);
      deleteBtn.addEventListener('click', function () {
        if (confirm('Delete "' + part.name + '"? This cannot be undone.')) {
          Parts.remove(part.id);
          renderManageView();
          App.toast('"' + part.name + '" deleted.');
        }
      });
      actions.appendChild(deleteBtn);

      card.appendChild(actions);
    }

    return card;
  }

  /* ── Import View ── */
  function renderImportView() {
    const container = main();
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'view-header';

    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = 'Import Parts from CSV';
    header.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', function () {
      App.navigate('manage');
    });
    header.appendChild(backBtn);
    container.appendChild(header);

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'import-instructions';
    instructions.innerHTML =
      '<p><strong>Required columns:</strong> Part Number, Name, Bin Location, Max Quantity</p>' +
      '<p><strong>Optional columns:</strong> Prefix, Current Quantity (defaults to Max), Reorder Threshold % (defaults to 50%)</p>' +
      '<p>Column headers are matched flexibly. The first row of your CSV should be headers.</p>';
    container.appendChild(instructions);

    // File picker
    const fileGroup = document.createElement('div');
    fileGroup.className = 'form-group';

    const fileLabel = document.createElement('label');
    fileLabel.setAttribute('for', 'csvFile');
    fileLabel.textContent = 'Select CSV file';
    fileGroup.appendChild(fileLabel);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'csvFile';
    fileInput.accept = '.csv,.txt';
    fileGroup.appendChild(fileInput);
    container.appendChild(fileGroup);

    // Preview area
    const previewArea = document.createElement('div');
    previewArea.id = 'importPreview';
    container.appendChild(previewArea);

    fileInput.addEventListener('change', function () {
      if (!fileInput.files || !fileInput.files[0]) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        _handleCSVLoaded(e.target.result, previewArea);
      };
      reader.onerror = function () {
        App.toast('Failed to read file.', 'error');
      };
      reader.readAsText(fileInput.files[0]);
    });
  }

  function _handleCSVLoaded(text, previewArea) {
    previewArea.innerHTML = '';

    var rows = Import.parseCSV(text);
    if (rows.length < 2) {
      App.toast('CSV must have a header row and at least one data row.', 'error');
      return;
    }

    var headers = rows[0];
    var dataRows = rows.slice(1);
    var columnMap = Import.detectColumns(headers);
    var missing = Import.getMissingRequired(columnMap);

    // Column mapping display
    var mapSection = document.createElement('div');
    mapSection.className = 'import-map';

    var mapTitle = document.createElement('h3');
    mapTitle.textContent = 'Column Mapping';
    mapSection.appendChild(mapTitle);

    var allFields = ['partNumber', 'prefix', 'name', 'binLocation', 'maxQuantity', 'currentQuantity', 'reorderThreshold'];
    var fieldLabels = {
      partNumber: 'Part Number *',
      prefix: 'Prefix',
      name: 'Name *',
      binLocation: 'Bin Location *',
      maxQuantity: 'Max Quantity *',
      currentQuantity: 'Current Quantity',
      reorderThreshold: 'Reorder Threshold %'
    };

    allFields.forEach(function (field) {
      var row = document.createElement('div');
      row.className = 'import-map-row';

      var label = document.createElement('label');
      label.setAttribute('for', 'map_' + field);
      label.textContent = fieldLabels[field];
      row.appendChild(label);

      var select = document.createElement('select');
      select.id = 'map_' + field;
      select.setAttribute('data-field', field);

      var emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Skip --';
      select.appendChild(emptyOpt);

      headers.forEach(function (h, i) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.textContent = h;
        if (columnMap[field] === i) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', function () {
        if (select.value === '') {
          delete columnMap[field];
        } else {
          columnMap[field] = parseInt(select.value, 10);
        }
        _updatePreviewTable(tableBody, dataRows, columnMap);
        _updateImportBtn(importBtn, columnMap);
      });

      row.appendChild(select);
      mapSection.appendChild(row);
    });

    previewArea.appendChild(mapSection);

    // Preview table
    var previewTitle = document.createElement('h3');
    previewTitle.textContent = 'Preview (first 5 rows)';
    previewTitle.style.marginTop = 'var(--space-md)';
    previewArea.appendChild(previewTitle);

    var table = document.createElement('table');
    table.className = 'import-table';

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    ['Part Number', 'Prefix', 'Name', 'Bin', 'Max Qty', 'Current Qty', 'Threshold'].forEach(function (h) {
      var th = document.createElement('th');
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tableBody = document.createElement('tbody');
    table.appendChild(tableBody);
    previewArea.appendChild(table);

    _updatePreviewTable(tableBody, dataRows, columnMap);

    // Row count
    var countText = document.createElement('p');
    countText.className = 'import-count';
    countText.textContent = dataRows.length + ' rows found in CSV';
    previewArea.appendChild(countText);

    // Import button
    var importBtn = document.createElement('button');
    importBtn.className = 'btn-primary btn-full';
    importBtn.id = 'importBtn';
    importBtn.textContent = 'Import ' + dataRows.length + ' Parts';
    _updateImportBtn(importBtn, columnMap);

    importBtn.addEventListener('click', function () {
      var validation = Import.validateRows(dataRows, columnMap);
      if (validation.valid.length === 0) {
        App.toast('No valid rows to import. Check your column mapping.', 'error');
        return;
      }

      var result = Import.importParts(validation.valid);
      var msg = 'Imported ' + result.imported + ' parts.';
      if (result.duplicates > 0) {
        msg += ' ' + result.duplicates + ' duplicates skipped.';
      }
      if (validation.errors.length > 0) {
        msg += ' ' + validation.errors.length + ' rows had errors.';
      }
      App.toast(msg, result.imported > 0 ? 'success' : 'error');

      if (result.imported > 0) {
        App.navigate('dashboard');
      }
    });

    previewArea.appendChild(importBtn);
  }

  function _updatePreviewTable(tbody, dataRows, columnMap) {
    tbody.innerHTML = '';
    var previewRows = dataRows.slice(0, 5);
    var fields = ['partNumber', 'prefix', 'name', 'binLocation', 'maxQuantity', 'currentQuantity', 'reorderThreshold'];

    previewRows.forEach(function (row) {
      var tr = document.createElement('tr');
      fields.forEach(function (field) {
        var td = document.createElement('td');
        var idx = columnMap[field];
        td.textContent = (idx !== undefined && idx < row.length) ? row[idx] : '--';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function _updateImportBtn(btn, columnMap) {
    var missing = Import.getMissingRequired(columnMap);
    btn.disabled = missing.length > 0;
    if (missing.length > 0) {
      btn.title = 'Missing required columns: ' + missing.join(', ');
    } else {
      btn.title = '';
    }
  }

  /* ── Form Submit Handler ── */
  function _handlePartSubmit(form, existingPart) {
    const data = {
      prefix: form.partPrefix.value.trim(),
      partNumber: form.partNumber.value.trim(),
      name: form.partName.value.trim(),
      binLocation: form.binLocation.value.trim(),
      maxQuantity: form.maxQuantity.value,
      currentQuantity: form.currentQuantity.value,
      reorderThreshold: form.reorderThreshold.value
    };

    if (!data.partNumber || !data.name || !data.binLocation || !data.maxQuantity || !data.currentQuantity) {
      App.toast('Please fill in all required fields.', 'error');
      return;
    }

    if (existingPart) {
      Parts.update(existingPart.id, data);
      App.toast('"' + data.name + '" updated.');
    } else {
      Parts.create(data);
      App.toast('"' + data.name + '" added.');
    }

    AppState.activePart = null;
    App.navigate('manage');
  }

  /* ── Reorder Queue View ── */
  var _selectedReorders = new Set();
  var _reorderFilter = null;

  function renderReorderQueue() {
    _selectedReorders.clear();
    const container = main();
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'view-header';

    const title = document.createElement('h2');
    title.className = 'view-title';
    title.textContent = 'Reorder Queue';
    header.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.textContent = 'Dashboard';
    backBtn.addEventListener('click', function () { App.navigate('dashboard'); });
    header.appendChild(backBtn);
    container.appendChild(header);

    // Batch action bar
    var batchBar = document.createElement('div');
    batchBar.className = 'batch-bar';
    batchBar.id = 'batchBar';

    var selectAllLabel = document.createElement('label');
    selectAllLabel.className = 'batch-select-all';
    var selectAllCb = document.createElement('input');
    selectAllCb.type = 'checkbox';
    selectAllCb.id = 'selectAllReorders';
    selectAllCb.setAttribute('aria-label', 'Select all reorder items');
    selectAllCb.addEventListener('change', function () {
      _toggleSelectAll(selectAllCb.checked, listContainer);
    });
    selectAllLabel.appendChild(selectAllCb);
    selectAllLabel.appendChild(document.createTextNode(' Select All'));
    batchBar.appendChild(selectAllLabel);

    var batchBtns = document.createElement('div');
    batchBtns.className = 'batch-btns';

    var emailBtn = document.createElement('button');
    emailBtn.className = 'btn-primary btn-small';
    emailBtn.textContent = 'Send Email';
    emailBtn.addEventListener('click', function () {
      var ids = Array.from(_selectedReorders);
      if (ids.length === 0) { App.toast('Select items first.', 'error'); return; }
      var mailto = Reorder.generateEmail(ids);
      window.location.href = mailto;
    });
    batchBtns.appendChild(emailBtn);

    var csvBtn = document.createElement('button');
    csvBtn.className = 'btn-secondary btn-small';
    csvBtn.textContent = 'Export CSV';
    csvBtn.addEventListener('click', function () {
      var ids = Array.from(_selectedReorders);
      if (ids.length === 0) { App.toast('Select items first.', 'error'); return; }
      Reorder.downloadCSV(ids);
      App.toast('CSV downloaded.');
    });
    batchBtns.appendChild(csvBtn);

    var markOrderedBtn = document.createElement('button');
    markOrderedBtn.className = 'btn-accent btn-small';
    markOrderedBtn.textContent = 'Mark Ordered';
    markOrderedBtn.addEventListener('click', function () {
      var ids = Array.from(_selectedReorders);
      if (ids.length === 0) { App.toast('Select items first.', 'error'); return; }
      ids.forEach(function (id) { Reorder.updateStatus(id, 'ordered'); });
      App.toast(ids.length + ' item(s) marked as ordered.');
      renderReorderQueue();
    });
    batchBtns.appendChild(markOrderedBtn);

    batchBar.appendChild(batchBtns);
    container.appendChild(batchBar);

    // Filter tabs
    var filterWrap = document.createElement('div');
    filterWrap.className = 'filter-wrap';

    [{ value: null, label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'ordered', label: 'Ordered' }, { value: 'received', label: 'Received' }].forEach(function (f) {
      var btn = document.createElement('button');
      btn.className = 'filter-btn' + (_reorderFilter === f.value ? ' filter-btn--active' : '');
      btn.textContent = f.label;

      var count = f.value ? Reorder.getByStatus(f.value).length : AppState.reorders.length;
      if (count > 0) btn.textContent += ' (' + count + ')';

      btn.setAttribute('aria-pressed', _reorderFilter === f.value ? 'true' : 'false');
      btn.addEventListener('click', function () {
        _reorderFilter = f.value;
        renderReorderQueue();
      });
      filterWrap.appendChild(btn);
    });
    container.appendChild(filterWrap);

    // Queue list
    var listContainer = document.createElement('div');
    listContainer.className = 'reorder-list';

    var items = Reorder.getByStatus(_reorderFilter);
    if (items.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = _reorderFilter ? 'No ' + _reorderFilter + ' reorders.' : 'Reorder queue is empty.';
      listContainer.appendChild(empty);
    } else {
      items.forEach(function (reorder) {
        listContainer.appendChild(_createReorderCard(reorder));
      });
    }

    container.appendChild(listContainer);
  }

  function _createReorderCard(reorder) {
    var card = document.createElement('div');
    card.className = 'reorder-card reorder-card--' + reorder.status;

    // Top row: checkbox + part info + status badge
    var topRow = document.createElement('div');
    topRow.className = 'reorder-card-top';

    if (reorder.status !== 'received') {
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'reorder-cb';
      cb.setAttribute('aria-label', 'Select ' + reorder.partName);
      cb.checked = _selectedReorders.has(reorder.id);
      cb.addEventListener('change', function () {
        if (cb.checked) { _selectedReorders.add(reorder.id); } else { _selectedReorders.delete(reorder.id); }
      });
      topRow.appendChild(cb);
    }

    var info = document.createElement('div');
    info.className = 'reorder-card-info';
    info.innerHTML = '<strong>' + _escapeHtml(reorder.partName) + '</strong>' +
      '<span class="part-card-number">' + _escapeHtml(reorder.partNumber) + '</span>' +
      '<span class="part-card-bin">Bin: ' + _escapeHtml(reorder.binLocation) + '</span>';
    topRow.appendChild(info);

    var badge = document.createElement('span');
    badge.className = 'status-badge status-badge--' + reorder.status;
    badge.textContent = reorder.status.charAt(0).toUpperCase() + reorder.status.slice(1);
    topRow.appendChild(badge);

    card.appendChild(topRow);

    // Quantity row
    var qtyRow = document.createElement('div');
    qtyRow.className = 'reorder-qty-row';

    var stockText = document.createElement('span');
    stockText.className = 'reorder-stock';
    stockText.textContent = 'Stock: ' + reorder.currentQuantity + ' / ' + reorder.maxQuantity;
    qtyRow.appendChild(stockText);

    if (reorder.status === 'pending') {
      var qtyLabel = document.createElement('label');
      qtyLabel.setAttribute('for', 'qty_' + reorder.id);
      qtyLabel.textContent = 'Order:';
      qtyLabel.className = 'reorder-qty-label';
      qtyRow.appendChild(qtyLabel);

      var qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.id = 'qty_' + reorder.id;
      qtyInput.className = 'reorder-qty-input';
      qtyInput.min = 1;
      qtyInput.value = reorder.quantityToOrder;
      qtyInput.addEventListener('change', function () {
        var val = parseInt(qtyInput.value, 10);
        if (val > 0) Reorder.updateQuantity(reorder.id, val);
      });
      qtyRow.appendChild(qtyInput);
    } else {
      var qtyText = document.createElement('span');
      qtyText.textContent = 'Ordered: ' + reorder.quantityToOrder;
      qtyRow.appendChild(qtyText);
    }

    card.appendChild(qtyRow);

    // Notes
    if (reorder.status === 'pending') {
      var notesRow = document.createElement('div');
      notesRow.className = 'reorder-notes-row';

      var notesLabel = document.createElement('label');
      notesLabel.setAttribute('for', 'notes_' + reorder.id);
      notesLabel.textContent = 'Notes';
      notesLabel.className = 'sr-only';
      notesRow.appendChild(notesLabel);

      var notesInput = document.createElement('input');
      notesInput.type = 'text';
      notesInput.id = 'notes_' + reorder.id;
      notesInput.className = 'reorder-notes-input';
      notesInput.value = reorder.notes;
      notesInput.setAttribute('aria-label', 'Notes for ' + reorder.partName);
      notesInput.addEventListener('change', function () {
        Reorder.updateNotes(reorder.id, notesInput.value.trim());
      });
      notesRow.appendChild(notesInput);
      card.appendChild(notesRow);
    } else if (reorder.notes) {
      var noteDisplay = document.createElement('div');
      noteDisplay.className = 'reorder-notes-display';
      noteDisplay.textContent = reorder.notes;
      card.appendChild(noteDisplay);
    }

    // Timestamps
    if (reorder.orderedAt) {
      var orderedDate = document.createElement('div');
      orderedDate.className = 'reorder-timestamp';
      orderedDate.textContent = 'Ordered: ' + new Date(reorder.orderedAt).toLocaleDateString();
      card.appendChild(orderedDate);
    }
    if (reorder.receivedAt) {
      var receivedDate = document.createElement('div');
      receivedDate.className = 'reorder-timestamp';
      receivedDate.textContent = 'Received: ' + new Date(reorder.receivedAt).toLocaleDateString();
      card.appendChild(receivedDate);
    }

    // Actions
    var actions = document.createElement('div');
    actions.className = 'reorder-card-actions';

    if (reorder.status === 'pending') {
      var orderBtn = document.createElement('button');
      orderBtn.className = 'btn-small btn-accent';
      orderBtn.textContent = 'Mark Ordered';
      orderBtn.addEventListener('click', function () {
        Reorder.updateStatus(reorder.id, 'ordered');
        App.toast('"' + reorder.partName + '" marked as ordered.');
        renderReorderQueue();
      });
      actions.appendChild(orderBtn);

      var dismissBtn = document.createElement('button');
      dismissBtn.className = 'btn-small btn-danger';
      dismissBtn.textContent = 'Dismiss';
      dismissBtn.addEventListener('click', function () {
        if (confirm('Remove "' + reorder.partName + '" from reorder queue?')) {
          Reorder.remove(reorder.id);
          App.toast('Removed from queue.');
          renderReorderQueue();
        }
      });
      actions.appendChild(dismissBtn);
    } else if (reorder.status === 'ordered') {
      var receiveBtn = document.createElement('button');
      receiveBtn.className = 'btn-small btn-primary';
      receiveBtn.textContent = 'Mark Received';
      receiveBtn.addEventListener('click', function () {
        Reorder.updateStatus(reorder.id, 'received');
        App.toast('"' + reorder.partName + '" marked as received.');

        // Prompt to restock
        var part = Parts.getById(reorder.partId);
        if (part && confirm('Restock "' + reorder.partName + '" now?')) {
          AppState.activePart = part;
          App.navigate('part-detail');
        } else {
          renderReorderQueue();
        }
      });
      actions.appendChild(receiveBtn);
    }

    card.appendChild(actions);
    return card;
  }

  function _toggleSelectAll(checked, listContainer) {
    var checkboxes = listContainer.querySelectorAll('.reorder-cb');
    var items = Reorder.getByStatus(_reorderFilter);
    checkboxes.forEach(function (cb, i) {
      cb.checked = checked;
      if (items[i]) {
        if (checked) { _selectedReorders.add(items[i].id); } else { _selectedReorders.delete(items[i].id); }
      }
    });
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    renderManageView: renderManageView,
    renderAddPart: renderAddPart,
    renderDashboard: renderDashboard,
    renderScanView: renderScanView,
    renderPartDetail: renderPartDetail,
    renderImportView: renderImportView,
    renderReorderQueue: renderReorderQueue
  };
})();
