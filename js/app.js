/* Main Application Logic */
(function () {
  'use strict';

  function init() {
    AppState.items = Storage.load(Storage.KEYS.ITEMS, []);
    AppState.categories = Storage.load(Storage.KEYS.CATEGORIES, []);
    render();
  }

  function render() {
    const container = document.querySelector('.inventory-view');
    if (!container) return;

    container.innerHTML = '';

    if (AppState.items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No items yet. Add your first item to get started.';
      container.appendChild(empty);
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
