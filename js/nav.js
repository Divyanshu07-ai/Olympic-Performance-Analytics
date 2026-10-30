/* =========================================================================
   nav.js — sidebar navigation, season toggle, and the lazy-init controller.

   Perf note: views are only rendered the first time they're opened
   (App.nav.ensureView), not all at boot. Switching season marks every
   already-built view "dirty" so it rebuilds next time it's shown, and
   immediately rebuilds whichever view is on screen right now.
   ========================================================================= */
'use strict';
window.App = window.App || {};

App.nav = (function () {
  const { $, $$, storage } = App;

  let season = storage.get('season', 'summer');
  let activeView = storage.get('activeView', 'home');

  // view id -> { render(seasonData), built: bool }
  const views = {};

  function register(id, render) {
    views[id] = { render, built: false };
  }

  function seasonData() {
    return window.OLYMPIC_DATA[season];
  }

  function ensureView(id) {
    const v = views[id];
    if (!v) return;
    if (!v.built) {
      v.render(seasonData());
      v.built = true;
    }
  }

  function showView(id) {
    activeView = id;
    storage.set('activeView', id);
    $$('.lane').forEach(l => l.setAttribute('aria-selected', String(l.dataset.target === id)));
    $$('.view').forEach(v => { v.hidden = v.id !== id; });
    ensureView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setSeason(next) {
    if (next === season) return;
    season = next;
    storage.set('season', season);
    // every built view now shows stale-season data — mark all dirty,
    // then immediately rebuild the one currently on screen.
    Object.values(views).forEach(v => { v.built = false; });
    ensureView(activeView);
    $$('.season-toggle button').forEach(b => b.classList.toggle('active', b.dataset.season === season));
  }

  function initShell() {
    $$('.lane').forEach(lane => {
      lane.addEventListener('click', () => {
        showView(lane.dataset.target);
        $('.sidebar').classList.remove('open');
      });
    });

    $$('.season-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.season === season);
      btn.addEventListener('click', () => setSeason(btn.dataset.season));
    });

    const toggle = $('#menuToggle');
    if (toggle) toggle.addEventListener('click', () => $('.sidebar').classList.toggle('open'));

    showView(activeView);
  }

  return { register, seasonData, showView, setSeason, initShell, get season() { return season; } };
})();
