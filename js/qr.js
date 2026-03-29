/* QR Code Generation and Printing */
const QR = (function () {
  'use strict';

  function generate(partNumber, targetElement, size) {
    size = size || 200;
    targetElement.innerHTML = '';

    if (typeof QRCode === 'undefined') {
      targetElement.textContent = 'QR library not loaded';
      return;
    }

    new QRCode(targetElement, {
      text: partNumber,
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function printLabel(part) {
    _openPrintWindow([part]);
  }

  function printAllLabels(parts) {
    if (parts.length === 0) return;
    _openPrintWindow(parts);
  }

  function _openPrintWindow(parts) {
    var win = window.open('', '_blank', 'width=800,height=600');
    if (!win) {
      App.toast('Pop-up blocked. Please allow pop-ups for this site.', 'error');
      return;
    }

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html += '<title>QR Labels</title>';
    html += '<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }';
    html += '.label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }';
    html += '.label { border: 1px dashed #ccc; padding: 12px; text-align: center; page-break-inside: avoid; }';
    html += '.label-qr { margin: 0 auto 8px; }';
    html += '.label-number { font-family: monospace; font-size: 14px; font-weight: bold; margin-bottom: 4px; }';
    html += '.label-bin { font-size: 12px; color: #666; }';
    html += '.label-name { font-size: 11px; color: #999; margin-top: 4px; }';
    html += '@media print { .no-print { display: none; } .label { border: 1px dashed #ccc; } }';
    html += '</style></head><body>';
    html += '<div class="no-print" style="margin-bottom:16px;"><button onclick="window.print()" style="padding:8px 24px;font-size:16px;cursor:pointer;">Print Labels</button></div>';
    html += '<div class="label-grid">';

    parts.forEach(function (part, i) {
      html += '<div class="label">';
      html += '<div class="label-qr" id="qr' + i + '"></div>';
      html += '<div class="label-number">' + _escapeHtml(part.partNumber) + '</div>';
      html += '<div class="label-bin">Bin: ' + _escapeHtml(part.binLocation) + '</div>';
      html += '<div class="label-name">' + _escapeHtml(part.name) + '</div>';
      html += '</div>';
    });

    html += '</div>';
    html += '<script>';
    html += 'window.onload = function() {';
    parts.forEach(function (part, i) {
      html += 'new QRCode(document.getElementById("qr' + i + '"), {';
      html += 'text: "' + _escapeJs(part.partNumber) + '",';
      html += 'width: 150, height: 150,';
      html += 'colorDark: "#000000", colorLight: "#ffffff",';
      html += 'correctLevel: QRCode.CorrectLevel.M });';
    });
    html += '};';
    html += '<\/script></body></html>';

    win.document.write(html);
    win.document.close();
  }

  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _escapeJs(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
  }

  return {
    generate: generate,
    printLabel: printLabel,
    printAllLabels: printAllLabels
  };
})();
