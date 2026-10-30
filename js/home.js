/* =========================================================================
   home.js — the landing view.
   The scoreboard AND the Key Insights panel both rebuild per the active
   season toggle (like every other view) — only the selected season's
   stats are shown at a time.
   ========================================================================= */
'use strict';
window.App = window.App || {};

(function () {
  const { $, $$, animateNumber } = App;

  function medalLeader(medals, type) {
    const counts = new Map();
    for (let i = 0; i < medals.medal.length; i++) {
      if (type && medals.medal[i] !== type) continue;
      const c = medals.countries[medals.country[i]];
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    let best = null, bestCount = -1;
    counts.forEach((count, nation) => { if (count > bestCount) { best = nation; bestCount = count; } });
    return { nation: best, count: bestCount };
  }

  function insightsColumn(seasonData, label, dotClass) {
    if (!seasonData) return '';
    const { meta, medals, mostSuccessful } = seasonData;
    const totalLeader = medalLeader(medals, null);
    const goldLeader = medalLeader(medals, 'Gold');
    const silverLeader = medalLeader(medals, 'Silver');
    const bronzeLeader = medalLeader(medals, 'Bronze');
    const topAthlete = (mostSuccessful.Overall || [])[0];
    const totalMedals = medals.year.length;
    const years = meta.years;
    const yearRange = years.length ? `${years[0]}\u2013${years[years.length - 1]}` : '';

    const rows = [
      ['Most total medals &mdash; country', totalLeader.nation, totalLeader.nation ? `${totalLeader.count.toLocaleString()} medals` : ''],
      ['Most gold medals &mdash; country', goldLeader.nation, goldLeader.nation ? `${goldLeader.count.toLocaleString()} gold medals` : ''],
      ['Most silver medals &mdash; country', silverLeader.nation, silverLeader.nation ? `${silverLeader.count.toLocaleString()} silver medals` : ''],
      ['Most bronze medals &mdash; country', bronzeLeader.nation, bronzeLeader.nation ? `${bronzeLeader.count.toLocaleString()} bronze medals` : ''],
      ['Most medals &mdash; athlete', topAthlete ? topAthlete.Name : null, topAthlete ? `${topAthlete.Medals} medals &middot; ${topAthlete.Sport}` : ''],
      ['Total medals awarded', totalMedals.toLocaleString(), ''],
    ];

    return `
      <div class="insights-col-head">
        <span class="insights-dot ${dotClass}"></span>
        <h3>${label} Games</h3>
        <span class="insights-sub">${meta.stats.editions} editions &middot; ${yearRange}</span>
      </div>
      <div class="insights-grid">
        ${rows.map(([lbl, value, detail]) => `
        <div class="insight-row">
          <span class="insight-label">${lbl}</span>
          <span class="insight-value">${value ?? '—'}</span>
          <span class="insight-detail">${detail}</span>
        </div>`).join('')}
      </div>`;
  }

  function render(data) {
    const { meta } = data;
    const seasonLabel = App.nav.season === 'winter' ? 'Winter' : 'Summer';
    const dotClass = App.nav.season === 'winter' ? 'insights-dot-winter' : 'insights-dot-summer';

    const tiles = [
      ['Editions', meta.stats.editions],
      ['Hosts', meta.stats.cities],
      ['Sports', meta.stats.sports],
      ['Nations', meta.stats.nations],
    ];
    const board = $('#homeScoreboard');
    board.innerHTML = tiles.map(([label]) => `
      <div class="stat-tile">
        <span class="stat-label">${label} &middot; ${seasonLabel}</span>
        <span class="stat-value">0</span>
      </div>`).join('');
    $$('.stat-value', board).forEach((el, i) => animateNumber(el, tiles[i][1]));

    // Only the active season's insights are shown — rebuilt whenever the
    // season toggle changes, same as every other lane.
    $('#homeInsights').innerHTML = insightsColumn(data, seasonLabel, dotClass);

    $$('.lane-card', $('#homeLaneCards')).forEach(card => {
      card.onclick = () => App.nav.showView(card.dataset.target);
    });
  }

  App.nav.register('home', render);
})();
