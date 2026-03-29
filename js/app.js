/* Main Application Logic - Router, Navigation, Init */
const App = (function () {
  'use strict';

  var _toastTimer = null;

  function init() {
    AppState.items = Storage.load(Storage.KEYS.ITEMS, []);
    AppState.transactions = Storage.load(Storage.KEYS.TRANSACTIONS, []);
    AppState.reorders = Storage.load(Storage.KEYS.REORDERS, []);
    AppState.settings = Storage.load(Storage.KEYS.SETTINGS, { defaultThreshold: 50 });

    _wireNav();
    navigate(AppState.currentView);
  }

  function navigate(viewName, params) {
    _beforeViewChange();

    AppState.currentView = viewName;
    _updateNavActive(viewName);

    switch (viewName) {
      case 'dashboard':
        Views.renderDashboard();
        break;
      case 'manage':
        Views.renderManageView();
        break;
      case 'add-part':
        Views.renderAddPart(AppState.activePart || (params && params.part) || null);
        break;
      case 'scan':
        Views.renderScanView();
        break;
      case 'import':
        Views.renderImportView();
        break;
      case 'reorder':
        Views.renderReorderQueue();
        break;
      case 'part-detail':
        if (AppState.activePart) {
          Views.renderPartDetail(AppState.activePart);
        } else {
          Views.renderDashboard();
        }
        break;
      default:
        Views.renderDashboard();
    }

    // Move focus to main content for accessibility
    var mainEl = document.getElementById('mainContent');
    if (mainEl) mainEl.focus({ preventScroll: true });
  }

  function _beforeViewChange() {
    // Always stop camera if it's running, regardless of which view we think we're on
    if (typeof Scanner !== 'undefined') {
      Scanner.stop();
    }
  }

  function _wireNav() {
    var navBtns = document.querySelectorAll('.bottom-nav-btn');
    navBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        if (view) {
          AppState.activePart = null;
          navigate(view);
        }
      });
    });
  }

  function _updateNavActive(viewName) {
    var navBtns = document.querySelectorAll('.bottom-nav-btn');
    navBtns.forEach(function (btn) {
      var view = btn.getAttribute('data-view');
      btn.classList.toggle('bottom-nav-btn--active', view === viewName);
      btn.setAttribute('aria-current', view === viewName ? 'page' : 'false');
    });
  }

  function _renderPlaceholder(name, message) {
    var container = document.getElementById('mainContent');
    container.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = message;
    container.appendChild(p);
  }

  function toast(message, type) {
    type = type || 'success';
    var el = document.getElementById('toast');
    if (!el) return;

    el.textContent = message;
    el.className = 'toast toast--visible toast--' + type;

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.className = 'toast';
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    navigate: navigate,
    toast: toast
  };
})();
