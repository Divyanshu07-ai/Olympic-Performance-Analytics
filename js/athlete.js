/* =========================================================================
   athlete.js — Lane 04
   Age histograms and the gold-medal-age-by-sport list are pre-computed in
   build_data.py now (not binned/reduced in the browser) — smaller payload,
   less client CPU.
   ========================================================================= */
'use strict';
window.App = window.App || {};

(function () {
  const { $, COLORS, fillSelect, baseLineOptions, destroyChart, storage } = App;

  let chartAge = null, chartAgeSportOld = null, chartAgeSportYoung = null, chartHW = null, chartGender = null;

  function render(data) {
    const { ageDistribution, heightWeight, genderOverTime } = data;

    // --- Age distribution: overall + by medal ------------------------------
    destroyChart(chartAge);
    chartAge = new Chart($('#chartAge'), {
      type: 'line',
      data: {
        labels: ageDistribution.overall_hist.labels,
        datasets: [
          { label: 'All athletes', data: ageDistribution.overall_hist.counts, borderColor: COLORS.faint, borderWidth: 2, pointRadius: 0, tension: .35 },
          { label: 'Gold', data: ageDistribution.gold_hist.counts, borderColor: COLORS.gold, borderWidth: 2, pointRadius: 0, tension: .35 },
          { label: 'Silver', data: ageDistribution.silver_hist.counts, borderColor: COLORS.silver, borderWidth: 2, pointRadius: 0, tension: .35 },
          { label: 'Bronze', data: ageDistribution.bronze_hist.counts, borderColor: COLORS.bronze, borderWidth: 2, pointRadius: 0, tension: .35 },
        ],
      },
      options: baseLineOptions({
        plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, color: COLORS.faint, font: { size: 11 } } }, tooltip: App.tooltipStyle },
      }),
    });

    // --- Gold-medal age by sport: oldest & youngest 10, side by side -------
    // (Showing all 40+ sports as one long bar list used to make this panel
    // grow endlessly down the page — two fixed-height top-10 charts give
    // the same insight without the runaway height.)
    const bySport = ageDistribution.by_sport_gold_avg || []; // already sorted oldest -> youngest
    const oldest10 = bySport.slice(0, 10);
    const youngest10 = bySport.slice(-10).reverse();

    function ageBarChart(prevChart, canvasEl, rows, color) {
      destroyChart(prevChart);
      return new Chart(canvasEl, {
        type: 'bar',
        data: {
          labels: rows.map(x => x.sport),
          datasets: [{ data: rows.map(x => x.avg), backgroundColor: color, borderRadius: 3, maxBarThickness: 22 }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: App.tooltipStyle },
          scales: {
            x: { grid: { color: COLORS.grid }, border: { display: false }, ticks: { color: COLORS.faint }, title: { display: true, text: 'Average age', color: COLORS.faint, font: { size: 11 } } },
            y: { grid: { display: false }, border: { display: false }, ticks: { color: COLORS.faint, font: { size: 10.5 } } },
          },
        },
      });
    }
    chartAgeSportOld = ageBarChart(chartAgeSportOld, $('#chartAgeSportOld'), oldest10, COLORS.red);
    chartAgeSportYoung = ageBarChart(chartAgeSportYoung, $('#chartAgeSportYoung'), youngest10, COLORS.navy);

    // --- Height vs weight scatter -------------------------------------------
    const hwSportSelect = $('#hwSportSelect');
    fillSelect(hwSportSelect, heightWeight.sports, { withOverall: true });
    const savedHwSport = storage.get('athlete.hwSport');
    if (savedHwSport && (savedHwSport === 'Overall' || heightWeight.sports.includes(savedHwSport))) hwSportSelect.value = savedHwSport;

    const medalColor = { G: COLORS.gold, S: COLORS.silver, B: COLORS.bronze, N: 'rgba(100,116,139,.35)' };
    const sexShape = { M: 'circle', F: 'triangle' };
    const DENSITY_THRESHOLD = 3000; // above this many "no medal" points, switch to a density grid instead of raw dots

    /** Bins points into a grid and returns {x, y, alpha} per non-empty cell —
     *  a lightweight stand-in for a hexbin/heatmap, with no extra library. */
    function densityGrid(points, binsX = 34, binsY = 34) {
      if (!points.length) return [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      points.forEach(p => {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      });
      if (minX === maxX) { minX -= 1; maxX += 1; }
      if (minY === maxY) { minY -= 1; maxY += 1; }
      const cellW = (maxX - minX) / binsX, cellH = (maxY - minY) / binsY;
      const grid = new Map();
      points.forEach(p => {
        const cx = Math.min(binsX - 1, Math.floor((p.x - minX) / cellW));
        const cy = Math.min(binsY - 1, Math.floor((p.y - minY) / cellH));
        const key = cx + ',' + cy;
        grid.set(key, (grid.get(key) || 0) + 1);
      });
      let maxCount = 0;
      grid.forEach(v => { if (v > maxCount) maxCount = v; });
      const out = [];
      grid.forEach((count, key) => {
        const [cx, cy] = key.split(',').map(Number);
        out.push({ x: minX + (cx + 0.5) * cellW, y: minY + (cy + 0.5) * cellH, alpha: count / maxCount, count });
      });
      return out;
    }

    function renderHW() {
      const sportChoice = hwSportSelect.value;
      const idxWanted = sportChoice === 'Overall' ? null : heightWeight.sports.indexOf(sportChoice);

      const groups = { G: [], S: [], B: [], N: [] };
      let count = 0;
      for (let i = 0; i < heightWeight.height.length; i++) {
        if (idxWanted !== null && heightWeight.sport[i] !== idxWanted) continue;
        count++;
        groups[heightWeight.medal[i]].push({ x: heightWeight.weight[i], y: heightWeight.height[i], sex: heightWeight.sex[i] });
      }

      const usingDensity = groups.N.length > DENSITY_THRESHOLD;
      const datasets = [];

      if (usingDensity) {
        const cells = densityGrid(groups.N);
        datasets.push({
          label: 'N', data: cells,
          backgroundColor: cells.map(c => `rgba(137,148,166,${(0.10 + c.alpha * 0.55).toFixed(2)})`),
          pointStyle: 'rect', pointRadius: 7, pointHoverRadius: 7,
          hoverBackgroundColor: cells.map(c => `rgba(137,148,166,${Math.min(1, 0.25 + c.alpha * 0.6).toFixed(2)})`),
        });
      } else {
        datasets.push({
          label: 'N', data: groups.N, backgroundColor: medalColor.N,
          pointStyle: groups.N.map(p => sexShape[p.sex] || 'circle'), pointRadius: 2.5, pointHoverRadius: 5,
        });
      }
      ['B', 'S', 'G'].forEach(k => {
        datasets.push({
          label: k, data: groups[k], backgroundColor: medalColor[k],
          pointStyle: groups[k].map(p => sexShape[p.sex] || 'circle'), pointRadius: 3.5, pointHoverRadius: 5,
        });
      });

      destroyChart(chartHW);
      chartHW = new Chart($('#chartHeightWeight'), {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...App.tooltipStyle,
              callbacks: {
                label: (ctx) => usingDensity && ctx.dataset.label === 'N'
                  ? `${ctx.raw.count.toLocaleString()} athletes near ${ctx.raw.x.toFixed(0)} kg, ${ctx.raw.y.toFixed(0)} cm`
                  : `${ctx.raw.x} kg, ${ctx.raw.y} cm`,
              },
            },
          },
          scales: {
            x: { title: { display: true, text: 'Weight (kg)', color: COLORS.faint, font: { size: 11 } }, grid: { color: COLORS.grid }, border: { display: false }, ticks: { color: COLORS.faint } },
            y: { title: { display: true, text: 'Height (cm)', color: COLORS.faint, font: { size: 11 } }, grid: { color: COLORS.grid }, border: { display: false }, ticks: { color: COLORS.faint } },
          },
        },
      });

      $('#hwLegend').innerHTML = `
        <span class="legend-chip"><span class="legend-dot" style="background:${COLORS.gold}"></span>Gold</span>
        <span class="legend-chip"><span class="legend-dot" style="background:${COLORS.silver}"></span>Silver</span>
        <span class="legend-chip"><span class="legend-dot" style="background:${COLORS.bronze}"></span>Bronze</span>
        <span class="legend-chip"><span class="legend-dot" style="background:rgba(137,148,166,.5)"></span>No medal${usingDensity ? ' (density)' : ''}</span>
        <span class="legend-chip">&#9679; Male &nbsp; &#9650; Female</span>
        ${usingDensity ? `<span class="legend-chip">${groups.N.length.toLocaleString()} unmedaled athletes shown as a density grid, not individual points</span>` : ''}
      `;
    }
    hwSportSelect.onchange = () => { storage.set('athlete.hwSport', hwSportSelect.value); renderHW(); };
    renderHW();

    // --- Men vs women over time ----------------------------------------------
    destroyChart(chartGender);
    chartGender = new Chart($('#chartGender'), {
      type: 'line',
      data: {
        labels: genderOverTime.years,
        datasets: [
          { label: 'Men', data: genderOverTime.male, borderColor: COLORS.navy, backgroundColor: 'rgba(15,23,42,.07)', fill: true, tension: .25, pointRadius: 0, borderWidth: 2.5 },
          { label: 'Women', data: genderOverTime.female, borderColor: COLORS.red, backgroundColor: 'rgba(220,38,38,.07)', fill: true, tension: .25, pointRadius: 0, borderWidth: 2.5 },
        ],
      },
      options: baseLineOptions({
        plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, boxHeight: 10, color: COLORS.faint, font: { size: 11 } } }, tooltip: App.tooltipStyle },
      }),
    });
  }

  App.nav.register('athlete', render);
})();
