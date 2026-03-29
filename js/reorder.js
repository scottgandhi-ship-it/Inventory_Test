/* Reorder Queue Module - Auto-queue, status tracking, email/CSV output */
const Reorder = (function () {
  'use strict';

  function create(part) {
    var reorder = {
      id: crypto.randomUUID(),
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      binLocation: part.binLocation,
      currentQuantity: part.currentQuantity,
      maxQuantity: part.maxQuantity,
      quantityToOrder: part.maxQuantity - part.currentQuantity,
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderedAt: null,
      receivedAt: null,
      notes: ''
    };

    AppState.reorders.push(reorder);
    _persist();
    return reorder;
  }

  function getByPartId(partId) {
    return AppState.reorders.filter(function (r) {
      return r.partId === partId;
    });
  }

  function getActiveByPartId(partId) {
    return AppState.reorders.find(function (r) {
      return r.partId === partId && (r.status === 'pending' || r.status === 'ordered');
    }) || null;
  }

  function getById(id) {
    return AppState.reorders.find(function (r) { return r.id === id; }) || null;
  }

  function updateStatus(id, status) {
    var reorder = getById(id);
    if (!reorder) return null;

    reorder.status = status;
    if (status === 'ordered') reorder.orderedAt = new Date().toISOString();
    if (status === 'received') reorder.receivedAt = new Date().toISOString();

    _persist();
    return reorder;
  }

  function updateQuantity(id, qty) {
    var reorder = getById(id);
    if (!reorder) return null;

    reorder.quantityToOrder = parseInt(qty, 10);
    _persist();
    return reorder;
  }

  function updateNotes(id, notes) {
    var reorder = getById(id);
    if (!reorder) return null;

    reorder.notes = notes;
    _persist();
    return reorder;
  }

  function remove(id) {
    var index = AppState.reorders.findIndex(function (r) { return r.id === id; });
    if (index === -1) return false;

    AppState.reorders.splice(index, 1);
    _persist();
    return true;
  }

  function getByStatus(status) {
    if (!status) return AppState.reorders.slice();
    return AppState.reorders.filter(function (r) { return r.status === status; });
  }

  function getPendingCount() {
    return AppState.reorders.filter(function (r) { return r.status === 'pending'; }).length;
  }

  // Auto-queue: called after decrement. Creates reorder if part is at threshold and no active reorder exists.
  function autoQueue(part) {
    if (!Parts.isAtThreshold(part)) return null;
    if (getActiveByPartId(part.id)) return null;
    return create(part);
  }

  // Auto-remove: called after restock. Removes pending reorder if part is above threshold.
  function autoRemove(partId) {
    var part = Parts.getById(partId);
    if (!part) return;
    if (Parts.isAtThreshold(part)) return;

    var pending = AppState.reorders.find(function (r) {
      return r.partId === partId && r.status === 'pending';
    });
    if (pending) remove(pending.id);
  }

  // Sync snapshots: update denormalized fields when a part's current qty changes
  function syncSnapshot(part) {
    AppState.reorders.forEach(function (r) {
      if (r.partId === part.id && r.status !== 'received') {
        r.currentQuantity = part.currentQuantity;
        r.maxQuantity = part.maxQuantity;
      }
    });
    _persist();
  }

  // Generate mailto link for selected reorder items
  function generateEmail(reorderIds) {
    var items = reorderIds.map(getById).filter(Boolean);
    if (items.length === 0) return '';

    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var subject = 'Parts Reorder - ' + date;

    var body = 'Parts Reorder Request\n';
    body += 'Date: ' + date + '\n\n';
    body += 'Part Number | Name | Qty to Order | Current Stock\n';
    body += '--------------------------------------------\n';

    items.forEach(function (item) {
      body += item.partNumber + ' | ' + item.partName + ' | ' + item.quantityToOrder + ' | ' + item.currentQuantity + '\n';
    });

    body += '\nTotal items: ' + items.length + '\n';

    return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  // Generate CSV content for selected reorder items
  function generateCSV(reorderIds) {
    var items = reorderIds.map(getById).filter(Boolean);
    if (items.length === 0) return '';

    var lines = ['Part Number,Name,Bin Location,Current Qty,Max Qty,Qty to Order,Notes'];
    items.forEach(function (item) {
      lines.push([
        _csvField(item.partNumber),
        _csvField(item.partName),
        _csvField(item.binLocation),
        item.currentQuantity,
        item.maxQuantity,
        item.quantityToOrder,
        _csvField(item.notes)
      ].join(','));
    });

    return lines.join('\n');
  }

  function downloadCSV(reorderIds) {
    var csv = generateCSV(reorderIds);
    if (!csv) return;

    var date = new Date().toISOString().split('T')[0];
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'reorder-' + date + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function _csvField(str) {
    str = str || '';
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function _persist() {
    Storage.save(Storage.KEYS.REORDERS, AppState.reorders);
  }

  return {
    create: create,
    getById: getById,
    getByPartId: getByPartId,
    getActiveByPartId: getActiveByPartId,
    updateStatus: updateStatus,
    updateQuantity: updateQuantity,
    updateNotes: updateNotes,
    remove: remove,
    getByStatus: getByStatus,
    getPendingCount: getPendingCount,
    autoQueue: autoQueue,
    autoRemove: autoRemove,
    syncSnapshot: syncSnapshot,
    generateEmail: generateEmail,
    generateCSV: generateCSV,
    downloadCSV: downloadCSV
  };
})();
