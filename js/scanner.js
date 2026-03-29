/* Scanner Module - Camera QR scanning via html5-qrcode */
const Scanner = (function () {
  'use strict';

  var _scanner = null;
  var _scanning = false;

  function start() {
    var container = document.getElementById('scannerContainer');
    var status = document.getElementById('scanStatus');
    if (!container) return;

    if (typeof Html5Qrcode === 'undefined') {
      if (status) status.textContent = 'Scanner library not loaded. Use manual entry below.';
      return;
    }

    _scanner = new Html5Qrcode('scannerContainer');

    var config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    _scanner.start(
      { facingMode: 'environment' },
      config,
      function (decodedText) {
        _onSuccess(decodedText);
      },
      function () {
        // Continuous scan failures are normal, no action needed
      }
    ).then(function () {
      _scanning = true;
      if (status) status.textContent = 'Point camera at a QR code on a bin label';
    }).catch(function (err) {
      _scanning = false;
      if (status) status.textContent = 'Camera unavailable. Use manual entry below.';
    });
  }

  function stop() {
    if (_scanner && _scanning) {
      _scanner.stop().then(function () {
        _scanning = false;
        _scanner = null;
      }).catch(function () {
        _scanning = false;
        _scanner = null;
      });
    }
  }

  function handleDecode(decodedText) {
    _onSuccess(decodedText);
  }

  function _onSuccess(decodedText) {
    // Pause scanning to prevent re-triggers
    if (_scanner && _scanning) {
      _scanner.pause(true);
    }

    var part = Parts.getByPartNumber(decodedText);

    if (!part) {
      App.toast('Part not found: ' + decodedText, 'error');
      // Resume scanning after a brief delay
      setTimeout(function () {
        if (_scanner && _scanning) {
          try { _scanner.resume(); } catch (e) { /* scanner may have been stopped */ }
        }
      }, 1500);
      return;
    }

    stop();
    AppState.activePart = part;
    App.navigate('part-detail');
  }

  return {
    start: start,
    stop: stop,
    handleDecode: handleDecode
  };
})();
