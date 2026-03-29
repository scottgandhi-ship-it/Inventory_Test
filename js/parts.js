/* Parts Module - CRUD, search, threshold logic */
const Parts = (function () {
  'use strict';

  function create(data) {
    const now = new Date().toISOString();
    const part = {
      id: crypto.randomUUID(),
      partNumber: data.prefix ? data.prefix + '-' + data.partNumber : data.partNumber,
      prefix: data.prefix || '',
      name: data.name,
      binLocation: data.binLocation,
      maxQuantity: parseInt(data.maxQuantity, 10),
      currentQuantity: parseInt(data.currentQuantity, 10),
      reorderThreshold: parseInt(data.reorderThreshold, 10) || AppState.settings.defaultThreshold || 50,
      createdAt: now,
      updatedAt: now
    };

    AppState.items.push(part);
    _persist();
    return part;
  }

  function update(id, data) {
    const part = getById(id);
    if (!part) return null;

    if (data.prefix !== undefined) part.prefix = data.prefix;
    if (data.partNumber !== undefined) {
      part.partNumber = data.prefix ? data.prefix + '-' + data.partNumber : data.partNumber;
    }
    if (data.name !== undefined) part.name = data.name;
    if (data.binLocation !== undefined) part.binLocation = data.binLocation;
    if (data.maxQuantity !== undefined) part.maxQuantity = parseInt(data.maxQuantity, 10);
    if (data.currentQuantity !== undefined) part.currentQuantity = parseInt(data.currentQuantity, 10);
    if (data.reorderThreshold !== undefined) part.reorderThreshold = parseInt(data.reorderThreshold, 10);
    part.updatedAt = new Date().toISOString();

    _persist();
    return part;
  }

  function remove(id) {
    const index = AppState.items.findIndex(p => p.id === id);
    if (index === -1) return false;

    AppState.items.splice(index, 1);
    _persist();
    return true;
  }

  function getById(id) {
    return AppState.items.find(p => p.id === id) || null;
  }

  function getByPartNumber(query) {
    if (!query) return null;
    var q = query.trim();

    // Exact match first
    var exact = AppState.items.find(function (p) { return p.partNumber === q; });
    if (exact) return exact;

    // Case-insensitive match
    var lower = q.toLowerCase();
    var ci = AppState.items.find(function (p) { return p.partNumber.toLowerCase() === lower; });
    if (ci) return ci;

    // Match without prefix (e.g. "4410" matches "BRK-4410")
    var suffixMatch = AppState.items.find(function (p) {
      return p.partNumber.toLowerCase().endsWith('-' + lower);
    });
    if (suffixMatch) return suffixMatch;

    // Match just the number portion after the dash
    var numberOnly = AppState.items.find(function (p) {
      var parts = p.partNumber.split('-');
      return parts.length > 1 && parts.slice(1).join('-').toLowerCase() === lower;
    });
    return numberOnly || null;
  }

  function decrement(id, amount) {
    amount = amount || 1;
    const part = getById(id);
    if (!part) return null;

    const previous = part.currentQuantity;
    part.currentQuantity = Math.max(0, part.currentQuantity - amount);
    part.updatedAt = new Date().toISOString();

    _logTransaction(part.id, 'decrement', -(previous - part.currentQuantity), previous, part.currentQuantity);
    _persist();

    return {
      part: part,
      atThreshold: isAtThreshold(part)
    };
  }

  function restock(id, newQuantity) {
    const part = getById(id);
    if (!part) return null;

    const previous = part.currentQuantity;
    part.currentQuantity = parseInt(newQuantity, 10);

    // Auto-bump maxQuantity if overstocked
    if (part.currentQuantity > part.maxQuantity) {
      part.maxQuantity = part.currentQuantity;
    }

    part.updatedAt = new Date().toISOString();

    _logTransaction(part.id, 'restock', part.currentQuantity - previous, previous, part.currentQuantity);
    _persist();
    return part;
  }

  function isAtThreshold(part) {
    const thresholdQty = Math.ceil(part.maxQuantity * part.reorderThreshold / 100);
    return part.currentQuantity <= thresholdQty;
  }

  function getAtThreshold() {
    return AppState.items.filter(isAtThreshold);
  }

  function search(query) {
    if (!query) return AppState.items;
    const q = query.toLowerCase();
    return AppState.items.filter(function (p) {
      return p.name.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        p.binLocation.toLowerCase().includes(q);
    });
  }

  function getSorted(filterStatus, query) {
    let list = query ? search(query) : AppState.items.slice();

    if (filterStatus === 'low') {
      list = list.filter(isAtThreshold);
    } else if (filterStatus === 'ok') {
      list = list.filter(function (p) { return !isAtThreshold(p); });
    }

    list.sort(function (a, b) {
      const aLow = isAtThreshold(a);
      const bLow = isAtThreshold(b);
      if (aLow !== bLow) return aLow ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return list;
  }

  function _logTransaction(partId, type, quantityChange, previous, current) {
    const tx = {
      id: crypto.randomUUID(),
      partId: partId,
      type: type,
      quantityChange: quantityChange,
      previousQuantity: previous,
      newQuantity: current,
      timestamp: new Date().toISOString()
    };
    AppState.transactions.push(tx);
    Storage.save(Storage.KEYS.TRANSACTIONS, AppState.transactions);
  }

  function _persist() {
    Storage.save(Storage.KEYS.ITEMS, AppState.items);
  }

  return {
    create: create,
    update: update,
    remove: remove,
    getById: getById,
    getByPartNumber: getByPartNumber,
    decrement: decrement,
    restock: restock,
    isAtThreshold: isAtThreshold,
    getAtThreshold: getAtThreshold,
    search: search,
    getSorted: getSorted
  };
})();
