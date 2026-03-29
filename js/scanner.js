/* Scanner Module - Camera QR scanning via html5-qrcode */
const Scanner = (function () {
  'use strict';

  var _scanner = null;
  var _scanning = false;
  var _stopping = false;

  function start() {
    var container = document.getElementById('scannerContainer');
    var status = document.getElementById('scanStatus');
    if (!container) return;

    if (typeof Html5Qrcode === 'undefined') {
      if (status) status.textContent = 'Scanner library not loaded. Use manual entry below.';
      return;
    }

    // Clean up any previous instance before creating a new one
    if (_scanner) {
      _forceCleanup();
    }

    _scanner = new Html5Qrcode('scannerContainer');

    var config = {
      fps: 10,
      qrbox: function (viewfinderWidth, viewfinderHeight) {
        // Responsive scan box: 70% of the smaller dimension
        var size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
        return { width: size, height: size };
      },
      aspectRatio: 1.0,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
    };

    _scanner.start(
      { facingMode: 'environment' },
      config,
      function (decodedText) {
        _onSuccess(decodedText);
      },
      function () {
        // Continuous scan misses are normal
      }
    ).then(function () {
      _scanning = true;
      if (status) status.textContent = 'Point camera at a QR code on a bin label';
    }).catch(function () {
      _scanning = false;
      if (status) status.textContent = 'Camera unavailable. Use manual entry below.';
    });
  }

  function stop() {
    if (_stopping) return Promise.resolve();
    _stopping = true;

    if (_scanner && _scanning) {
      return _scanner.stop().then(function () {
        _scanning = false;
        _scanner.clear();
        _scanner = null;
        _stopping = false;
      }).catch(function () {
        _forceCleanup();
        _stopping = false;
      });
    }

    _forceCleanup();
    _stopping = false;
    return Promise.resolve();
  }

  function _forceCleanup() {
    // Release any lingering camera streams
    _scanning = false;
    if (_scanner) {
      try { _scanner.clear(); } catch (e) { /* DOM may already be cleared */ }
    }
    _scanner = null;

    // Belt-and-suspenders: stop all video tracks in the document
    var videos = document.querySelectorAll('#scannerContainer video');
    videos.forEach(function (video) {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(function (track) { track.stop(); });
        video.srcObject = null;
      }
    });
  }

  function handleDecode(decodedText) {
    _onSuccess(decodedText);
  }

  function _onSuccess(decodedText) {
    if (_stopping) return;

    // Stop camera immediately on successful scan
    stop().then(function () {
      var part = Parts.getByPartNumber(decodedText);

      if (!part) {
        App.toast('Part not found: ' + decodedText, 'error');
        // Restart scanning after showing the error
        setTimeout(function () {
          if (AppState.currentView === 'scan') {
            App.navigate('scan');
          }
        }, 1500);
        return;
      }

      AppState.activePart = part;
      App.navigate('part-detail');
    });
  }

  return {
    start: start,
    stop: stop,
    handleDecode: handleDecode
  };
})();
