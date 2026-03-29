/* CSV Import Module - Parse, validate, and bulk-import parts */
const Import = (function () {
  'use strict';

  // Maps flexible header names to our field names
  var HEADER_ALIASES = {
    partNumber: ['partnumber', 'part_number', 'part number', 'part#', 'part no', 'partno', 'part_no', 'number', 'item number', 'item_number', 'itemno'],
    prefix: ['prefix', 'pre', 'category', 'group', 'type'],
    name: ['name', 'part name', 'part_name', 'partname', 'description', 'desc', 'item', 'item name', 'item_name'],
    binLocation: ['binlocation', 'bin_location', 'bin location', 'bin', 'location', 'loc', 'shelf', 'slot'],
    maxQuantity: ['maxquantity', 'max_quantity', 'max quantity', 'max', 'max qty', 'maxqty', 'max_qty', 'capacity'],
    currentQuantity: ['currentquantity', 'current_quantity', 'current quantity', 'current', 'qty', 'quantity', 'current qty', 'currentqty', 'current_qty', 'on hand', 'onhand', 'on_hand', 'stock'],
    reorderThreshold: ['reorderthreshold', 'reorder_threshold', 'reorder threshold', 'threshold', 'reorder', 'reorder%', 'reorder pct', 'threshold%']
  };

  var REQUIRED_FIELDS = ['partNumber', 'name', 'binLocation', 'maxQuantity'];

  function parseCSV(text) {
    var lines = text.split(/\r?\n/);
    var result = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      result.push(_parseLine(line));
    }

    return result;
  }

  function _parseLine(line) {
    var fields = [];
    var current = '';
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      var next = line[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  function detectColumns(headers) {
    var mapping = {};
    var normalizedHeaders = headers.map(function (h) { return h.toLowerCase().trim(); });

    Object.keys(HEADER_ALIASES).forEach(function (field) {
      var aliases = HEADER_ALIASES[field];
      for (var i = 0; i < normalizedHeaders.length; i++) {
        if (aliases.indexOf(normalizedHeaders[i]) !== -1) {
          mapping[field] = i;
          break;
        }
      }
    });

    return mapping;
  }

  function getMissingRequired(columnMap) {
    return REQUIRED_FIELDS.filter(function (f) {
      return columnMap[f] === undefined;
    });
  }

  function validateRows(rows, columnMap) {
    var valid = [];
    var errors = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var partNumber = _getField(row, columnMap, 'partNumber');
      var name = _getField(row, columnMap, 'name');
      var bin = _getField(row, columnMap, 'binLocation');
      var maxQty = parseInt(_getField(row, columnMap, 'maxQuantity'), 10);

      if (!partNumber || !name || !bin) {
        errors.push({ row: i + 2, reason: 'Missing required field' });
        continue;
      }

      if (isNaN(maxQty) || maxQty < 1) {
        errors.push({ row: i + 2, reason: 'Invalid max quantity' });
        continue;
      }

      var prefix = _getField(row, columnMap, 'prefix') || '';
      var currentQty = parseInt(_getField(row, columnMap, 'currentQuantity'), 10);
      if (isNaN(currentQty)) currentQty = maxQty;

      var threshold = parseInt(_getField(row, columnMap, 'reorderThreshold'), 10);
      if (isNaN(threshold) || threshold < 1 || threshold > 100) {
        threshold = AppState.settings.defaultThreshold || 50;
      }

      valid.push({
        prefix: prefix,
        partNumber: partNumber,
        name: name,
        binLocation: bin,
        maxQuantity: maxQty,
        currentQuantity: currentQty,
        reorderThreshold: threshold
      });
    }

    return { valid: valid, errors: errors };
  }

  function importParts(validRows) {
    var imported = 0;
    var duplicates = 0;

    validRows.forEach(function (data) {
      // Build the full part number the same way Parts.create does
      var fullPartNumber = data.prefix ? data.prefix + '-' + data.partNumber : data.partNumber;

      if (Parts.getByPartNumber(fullPartNumber)) {
        duplicates++;
        return;
      }

      Parts.create(data);
      imported++;
    });

    return { imported: imported, duplicates: duplicates };
  }

  function _getField(row, columnMap, field) {
    var idx = columnMap[field];
    if (idx === undefined || idx >= row.length) return '';
    return row[idx] || '';
  }

  return {
    parseCSV: parseCSV,
    detectColumns: detectColumns,
    getMissingRequired: getMissingRequired,
    validateRows: validateRows,
    importParts: importParts,
    REQUIRED_FIELDS: REQUIRED_FIELDS
  };
})();
