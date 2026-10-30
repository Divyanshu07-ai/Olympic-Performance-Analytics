/* =========================================================================
   utils.js — shared helpers used by every view module.
   Everything hangs off window.App so files can stay plain <script> tags
   (no bundler, no ES modules — that keeps double-click-to-open working,
   since type="module" scripts are blocked by CORS on file:// URLs).
   ========================================================================= */
'use strict';
window.App = window.App || {};

App.COLORS = {
  text: '#0F172A',
  faint: '#64748B',
  grid: 'rgba(15, 23, 42, 0.07)',
  navy: '#0F172A',
  red: '#DC2626',
  gold: '#D97706',
  silver: '#64748B',
  bronze: '#C2410C',
  blue: '#1D4ED8',
  teal: '#0D9488',
  pink: '#E11D48',
};

App.$ = (sel, root = document) => root.querySelector(sel);
App.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------------------------------------------------------------
   Small localStorage wrapper — never throws (file:// / private-mode
   browsers sometimes disallow storage access).
   --------------------------------------------------------------------- */
App.storage = {
  prefix: 'olympicAnalysis.',
  get(key, fallback = null) {
    try {
      const v = window.localStorage.getItem(this.prefix + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { window.localStorage.setItem(this.prefix + key, JSON.stringify(value)); }
    catch (e) { /* ignore — non-fatal */ }
  },
};

App.debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

App.fillSelect = (select, options, { withOverall = true, withNone = false } = {}) => {
  const prev = select.value;
  select.innerHTML = '';
  if (withNone) select.appendChild(new Option('None', 'None'));
  if (withOverall) select.appendChild(new Option('Overall', 'Overall'));
  options.forEach(o => select.appendChild(new Option(String(o), String(o))));
  if (prev && Array.from(select.options).some(o => o.value === prev)) select.value = prev;
};

App.animateNumber = (el, target, duration = 900) => {
  const start = performance.now();
  const from = 0;
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
};

/* ---------------------------------------------------------------------
   Chart.js shared config
   --------------------------------------------------------------------- */
if (window.Chart) {
  Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  Chart.defaults.color = App.COLORS.faint;
}

App.tooltipStyle = {
  backgroundColor: '#0F172A',
  borderColor: '#1E293B',
  borderWidth: 1,
  titleColor: '#FFFFFF',
  bodyColor: '#F8FAFC',
  padding: 10,
  cornerRadius: 8,
};

App.baseLineOptions = (extra = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false, labels: { color: App.COLORS.faint } },
    tooltip: App.tooltipStyle,
  },
  scales: {
    x: { grid: { color: App.COLORS.grid, drawTicks: false }, border: { display: false }, ticks: { color: App.COLORS.faint, maxRotation: 0, autoSkip: true } },
    y: { grid: { color: App.COLORS.grid, drawTicks: false }, border: { display: false }, ticks: { color: App.COLORS.faint }, beginAtZero: true },
  },
  ...extra,
});

/** Destroys a Chart.js instance if it exists — used before re-creating a
 *  chart on the same canvas (e.g. when the user switches season). */
App.destroyChart = (chart) => { if (chart) { try { chart.destroy(); } catch (e) {} } };

/* ---------------------------------------------------------------------
   Heatmap grid renderer (custom — no chart-library matrix plugin needed)
   --------------------------------------------------------------------- */
App.renderHeatmap = (container, sports, years, z) => {
  if (!sports.length) {
    container.innerHTML = '<p style="color:var(--text-faint);font-size:13px;padding:16px;">No data available.</p>';
    return;
  }
  let max = 0;
  z.forEach(row => row.forEach(v => { if (v > max) max = v; }));

  let html = '<table class="heatmap"><thead><tr><th class="row-label"></th>';
  years.forEach(y => { html += `<th>${y}</th>`; });
  html += '</tr></thead><tbody>';

  sports.forEach((sport, i) => {
    html += `<tr><th class="row-label">${sport}</th>`;
    z[i].forEach(v => {
      const alpha = max ? (v / max) : 0;
      const bg = v === 0 ? '#F8FAFC' : `rgba(220, 38, 38, ${(0.10 + alpha * 0.85).toFixed(2)})`;
      const textColor = alpha > 0.48 ? '#FFFFFF' : (v > 0 ? '#991B1B' : '#94A3B8');
      const fw = v > 0 ? '600' : '400';
      html += `<td style="background:${bg};color:${textColor};font-weight:${fw};">${v || ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
};
