/* =========================================================================
   overall.js — Lane 02
   ========================================================================= */
'use strict';
window.App = window.App || {};

(function () {
  const { $, $$, COLORS, fillSelect, baseLineOptions, animateNumber, destroyChart, storage } = App;

  let chartNations = null, chartEvents = null, chartAthletes = null, chartParticipation = null;

  function render(data) {
    const { meta, overtime, mostSuccessful } = data;

    const tiles = [
      ['Editions', meta.stats.editions],
      ['Hosts', meta.stats.cities],
      ['Sports', meta.stats.sports],
      ['Events', meta.stats.events],
      ['Nations', meta.stats.nations],
      ['Athletes', meta.stats.athletes],
    ];
    const board = $('#scoreboard');
    board.innerHTML = tiles.map(([label]) => `
      <div class="stat-tile">
        <span class="stat-label">${label}</span>
        <span class="stat-value">0</span>
      </div>`).join('');
    $$('.stat-value', board).forEach((el, i) => animateNumber(el, tiles[i][1]));

    destroyChart(chartNations);
    destroyChart(chartEvents);
    destroyChart(chartAthletes);
    destroyChart(chartParticipation);

    chartNations = new Chart($('#chartNations'), {
      type: 'line',
      data: { labels: overtime.years, datasets: [{ data: overtime.nations, borderColor: COLORS.red, backgroundColor: 'rgba(220,38,38,.08)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 }] },
      options: baseLineOptions(),
    });
    chartEvents = new Chart($('#chartEvents'), {
      type: 'line',
      data: { labels: overtime.events_years, datasets: [{ data: overtime.events, borderColor: COLORS.navy, backgroundColor: 'rgba(15,23,42,.06)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 }] },
      options: baseLineOptions(),
    });
    chartAthletes = new Chart($('#chartAthletes'), {
      type: 'line',
      data: { labels: overtime.athletes_years, datasets: [{ data: overtime.athletes, borderColor: COLORS.blue, backgroundColor: 'rgba(29,78,216,.08)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 }] },
      options: baseLineOptions(),
    });

    // Participation intensity: average athletes represented per participating nation.
    // This replaces the duplicate sport × edition heatmap, which belongs in Sports & Events.
    const participationYears = overtime.athletes_years || overtime.years || [];
    const participationAthletes = overtime.athletes || [];
    const participationNations = overtime.nations || [];
    const intensity = participationAthletes.map((v, i) => {
      const n = Number(participationNations[i] || 0);
      return n ? Number(v || 0) / n : null;
    });
    chartParticipation = new Chart($('#chartParticipationIntensity'), {
      type: 'line',
      data: {
        labels: participationYears,
        datasets: [{
          data: intensity,
          borderColor: COLORS.red,
          backgroundColor: 'rgba(220,38,38,.08)',
          fill: true,
          tension: .32,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2.5
        }]
      },
      options: {
        ...baseLineOptions(),
        scales: {
          x: {
            grid: { color: COLORS.grid },
            border: { display: false },
            ticks: { color: COLORS.faint, maxTicksLimit: 18 }
          },
          y: {
            beginAtZero: true,
            grid: { color: COLORS.grid },
            border: { display: false },
            ticks: { color: COLORS.faint, precision: 0 }
          }
        },
        plugins: {
          ...baseLineOptions().plugins,
          tooltip: {
            ...App.tooltipStyle,
            callbacks: {
              label: ctx => ` ${Number(ctx.parsed.y || 0).toFixed(1)} athletes per nation`
            }
          }
        }
      }
    });

    const sportSelect = $('#successSportSelect');
    const searchInput = $('#successSearch');
    const sports = Object.keys(mostSuccessful).filter(s => s !== 'Overall').sort();
    fillSelect(sportSelect, sports);
    const saved = storage.get('overall.successSport');
    if (saved && (saved === 'Overall' || sports.includes(saved))) sportSelect.value = saved;

    function renderSuccess() {
      const sport = sportSelect.value;
      const query = (searchInput.value || '').trim().toLowerCase();
      const all = mostSuccessful[sport] || [];
      const rows = query
        ? all.filter(r => r.Name.toLowerCase().includes(query) || (r.region || '').toLowerCase().includes(query))
        : all;
      const tbody = $('#successTable tbody');
      tbody.innerHTML = rows.length ? rows.map(r => `
        <tr><td>${r.Name}</td><td>${r.Medals}</td><td>${r.Sport}</td><td>${r.region ?? '—'}</td></tr>
      `).join('') : `<tr class="empty-row"><td colspan="4">${all.length ? 'No matches for your search.' : 'No medalists found.'}</td></tr>`;
    }
    sportSelect.onchange = () => { storage.set('overall.successSport', sportSelect.value); renderSuccess(); };
    searchInput.oninput = App.debounce(renderSuccess, 120);
    renderSuccess();
  }

  App.nav.register('overall', render);
})();
