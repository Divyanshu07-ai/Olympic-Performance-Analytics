/* =========================================================================
   medal-tally.js — Lane 01
   ========================================================================= */
'use strict';
window.App = window.App || {};

(function () {
  const { $, fillSelect, storage, debounce } = App;

  function render(data) {
    const { meta, medals } = data;
    const yearSelect = $('#yearSelect');
    const countrySelect = $('#countrySelect');
    const searchInput = $('#medalSearch');

    fillSelect(yearSelect, meta.years);
    fillSelect(countrySelect, meta.countries);

    const savedYear = storage.get('medalTally.year');
    const savedCountry = storage.get('medalTally.country');
    if (savedYear && meta.years.includes(Number(savedYear))) yearSelect.value = savedYear;
    if (savedCountry && meta.countries.includes(savedCountry)) countrySelect.value = savedCountry;

    function compute(year, country) {
      // Rows matching the YEAR filter only — needed even when a country is
      // also selected, so we can rank that country against the full field
      // rather than trivially showing it alone at "rank 1".
      const yearRows = [];
      for (let i = 0; i < medals.year.length; i++) {
        const rowYear = medals.year[i];
        if (year !== 'Overall' && String(rowYear) !== String(year)) continue;
        yearRows.push({ year: rowYear, country: medals.countries[medals.country[i]], medal: medals.medal[i] });
      }

      const groupByYear = year === 'Overall' && country !== 'Overall';

      if (groupByYear) {
        // One country, every edition it competed in. Ranked by TOTAL
        // medals first (its best years should be rank 1), tie-broken by
        // Gold, then Silver, then Bronze — not simply by year order.
        const rows = yearRows.filter(r => r.country === country);
        const buckets = new Map();
        rows.forEach(r => {
          if (!buckets.has(r.year)) buckets.set(r.year, { key: r.year, Gold: 0, Silver: 0, Bronze: 0 });
          buckets.get(r.year)[r.medal]++;
        });
        const list = Array.from(buckets.values())
          .map(b => ({ ...b, total: b.Gold + b.Silver + b.Bronze }))
          .sort((a, b) => b.total - a.total || b.Gold - a.Gold || b.Silver - a.Silver || b.Bronze - a.Bronze);
        return { list, groupByYear, singleRank: null };
      }

      // One row per nation for the chosen year (or all-time if "Overall"),
      // ranked the standard Olympic way: Gold, then Silver, then Bronze.
      const buckets = new Map();
      yearRows.forEach(r => {
        if (!buckets.has(r.country)) buckets.set(r.country, { key: r.country, Gold: 0, Silver: 0, Bronze: 0 });
        buckets.get(r.country)[r.medal]++;
      });
      const fullList = Array.from(buckets.values())
        .map(b => ({ ...b, total: b.Gold + b.Silver + b.Bronze }))
        .sort((a, b) => b.Gold - a.Gold || b.Silver - a.Silver || b.Bronze - a.Bronze || b.total - a.total);

      if (country === 'Overall') {
        return { list: fullList, groupByYear: false, singleRank: null };
      }

      // A specific nation AND a specific year: show just that nation's row,
      // but its rank comes from its position in the full field, not 1.
      const idx = fullList.findIndex(r => r.key === country);
      if (idx === -1) return { list: [], groupByYear: false, singleRank: null };
      return { list: [fullList[idx]], groupByYear: false, singleRank: idx + 1 };
    }

    function draw() {
      const year = yearSelect.value;
      const country = countrySelect.value;
      const query = (searchInput.value || '').trim().toLowerCase();
      const { list, groupByYear, singleRank } = compute(year, country);
      const filtered = query ? list.filter(r => String(r.key).toLowerCase().includes(query)) : list;

      const title = $('#medalTallyTitle');
      const theadFirst = $('#medalTable thead th:first-child + th');
      if (year === 'Overall' && country === 'Overall') title.textContent = 'Overall Tally';
      else if (year !== 'Overall' && country === 'Overall') title.textContent = `Medal Tally — ${year} Olympics`;
      else if (year === 'Overall' && country !== 'Overall') title.textContent = `${country} — Overall Performance`;
      else title.textContent = `${country} — ${year} Olympics`;
      theadFirst.textContent = groupByYear ? 'Edition' : 'Nation';
      searchInput.placeholder = groupByYear ? 'Search editions…' : 'Search nations…';

      const tbody = $('#medalTable tbody');
      tbody.innerHTML = '';
      if (!filtered.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">${list.length ? 'No matches for your search.' : 'No medals recorded for this selection.'}</td></tr>`;
        return;
      }
      filtered.forEach((row) => {
        const rank = singleRank != null ? singleRank : (list.indexOf(row) + 1);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${rank}</td>
          <td>${row.key}</td>
          <td class="col-gold">${row.Gold}</td>
          <td class="col-silver">${row.Silver}</td>
          <td class="col-bronze">${row.Bronze}</td>
          <td>${row.total}</td>`;
        tbody.appendChild(tr);
      });
    }

    yearSelect.addEventListener('change', () => { storage.set('medalTally.year', yearSelect.value); draw(); });
    countrySelect.addEventListener('change', () => { storage.set('medalTally.country', countrySelect.value); draw(); });
    searchInput.addEventListener('input', debounce(draw, 120));
    draw();
  }

  App.nav.register('medal-tally', render);
})();
