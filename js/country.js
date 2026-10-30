/* =========================================================================
   country.js — Lane 03
   Adds a "Compare with" second country: overlays a second line on the
   medal-tally chart, aligned on the union of both countries' years.
   ========================================================================= */
'use strict';
window.App = window.App || {};

(function () {
  const { $, COLORS, fillSelect, baseLineOptions, renderHeatmap, destroyChart, storage, debounce } = App;

  let lineChart = null;

  function alignSeries(primary, compare) {
    const years = Array.from(new Set([...primary.years, ...(compare ? compare.years : [])])).sort((a, b) => a - b);
    const lookup = (d, y) => { const i = d.years.indexOf(y); return i === -1 ? null : d.medals[i]; };
    return {
      years,
      primary: years.map(y => lookup(primary, y)),
      compare: compare ? years.map(y => lookup(compare, y)) : null,
    };
  }

  function render(data) {
    const { meta, countryData } = data;
    const select = $('#countryOnlySelect');
    const compareSelect = $('#compareSelect');
    const available = meta.countries.filter(c => countryData[c]);
    fillSelect(select, available, { withOverall: false });
    fillSelect(compareSelect, available, { withOverall: false, withNone: true });
    compareSelect.value = 'None';

    const savedCountry = storage.get('country.country');
    select.value = (savedCountry && available.includes(savedCountry)) ? savedCountry
      : (available.includes('USA') ? 'USA' : available[0]);

    function draw() {
      const country = select.value;
      const compareName = compareSelect.value;
      const d = countryData[country];
      const cmp = (compareName !== 'None' && compareName !== country) ? countryData[compareName] : null;

      $('#countryHeading').textContent = country;
      $('#countryLineTitle').textContent = cmp ? `${country} vs ${compareName} — medal tally over the years` : `${country} — medal tally over the years`;
      $('#countryHeatTitle').textContent = `${country} — sports strength map`;
      $('#countryTopTitle').textContent = `Top 10 athletes — ${country}`;

      const aligned = alignSeries(d, cmp);
      const datasets = [{
        label: country, data: aligned.primary, borderColor: COLORS.red, backgroundColor: 'rgba(220,38,38,.08)',
        fill: !cmp, tension: .25, pointRadius: 3, pointBackgroundColor: COLORS.red, borderWidth: 2.5, spanGaps: true,
      }];
      if (cmp) {
        datasets.push({
          label: compareName, data: aligned.compare, borderColor: COLORS.navy, backgroundColor: 'rgba(15,23,42,.06)',
          fill: false, tension: .25, pointRadius: 3, pointBackgroundColor: COLORS.navy, borderWidth: 2.5, spanGaps: true,
        });
      }

      destroyChart(lineChart);
      lineChart = new Chart($('#chartCountryLine'), {
        type: 'line',
        data: { labels: aligned.years, datasets },
        options: baseLineOptions({
          plugins: {
            legend: { display: !!cmp, position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, color: COLORS.faint, font: { size: 11 } } },
            tooltip: App.tooltipStyle,
          },
        }),
      });

      renderHeatmap($('#heatmapCountry'), d.heatmap.sports, d.heatmap.years, d.heatmap.z);

      renderTop10();
    }

    function renderTop10() {
      const country = select.value;
      const d = countryData[country];
      const query = (topSearch.value || '').trim().toLowerCase();
      const rows = query ? d.top10.filter(r => r.Name.toLowerCase().includes(query)) : d.top10;
      const tbody = $('#countryTopTable tbody');
      tbody.innerHTML = rows.length ? rows.map(r => `
        <tr><td>${r.Name}</td><td>${r.Medals}</td><td>${r.Sport}</td></tr>
      `).join('') : `<tr class="empty-row"><td colspan="3">${d.top10.length ? 'No matches for your search.' : 'No medalists found.'}</td></tr>`;
    }

    const topSearch = $('#countryTopSearch');
    select.onchange = () => { storage.set('country.country', select.value); draw(); };
    compareSelect.onchange = draw;
    topSearch.oninput = debounce(renderTop10, 120);
    draw();
  }

  App.nav.register('country', render);
})();
