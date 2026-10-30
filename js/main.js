/* =========================================================================
   main.js — boots the app. Must load AFTER data.js and every view module
   (utils.js, nav.js, medal-tally.js, overall.js, country.js, athlete.js).
   ========================================================================= */
'use strict';

(function boot() {
  const overlay = document.getElementById('loadingOverlay');

  function fail(message, err) {
    if (err) console.error(err);
    if (overlay) {
      overlay.innerHTML = `
        <div class="overlay-error">
          <strong>Couldn't load the dashboard.</strong>
          <p>${message}</p>
        </div>`;
    }
  }

  try {
    if (!window.OLYMPIC_DATA || !window.OLYMPIC_DATA.summer) {
      fail('window.OLYMPIC_DATA is missing — make sure data.js is loaded before the other scripts in index.html.');
      return;
    }
    if (!window.Chart) {
      fail('Chart.js failed to load. If you\'re offline, the CDN script tag in index.html can\'t be fetched — connect to the internet once, or download Chart.js locally.');
      return;
    }

    App.nav.initShell();

    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
    }
  } catch (err) {
    fail('Something went wrong while rendering the page. Details are in the browser console (F12).', err);
  }
})();
