'use strict';
window.App = window.App || {};
(function(){
  const { $, COLORS, destroyChart } = App;
  const charts = {};
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const fmt = n => Number(n || 0).toLocaleString();

  function medalRows(data){
    const m=data.medals, map=new Map();
    for(let i=0;i<m.year.length;i++){
      const c=m.countries[m.country[i]], medal=m.medal[i];
      if(!map.has(c)) map.set(c,{country:c,gold:0,silver:0,bronze:0,total:0});
      const r=map.get(c); r[medal.toLowerCase()]++; r.total++;
    }
    return [...map.values()].sort((a,b)=>b.gold-a.gold||b.total-a.total);
  }

  function peakForSport(heat, sportIndex){
    const values = heat.z[sportIndex] || [];
    let best = {year: heat.years[0], value: 0};
    values.forEach((v,i)=>{ if((+v||0) > best.value) best={year:heat.years[i],value:+v||0}; });
    return best;
  }

  function renderSports(data){
    const heat=data.sportYearHeatmap;
    const totals=heat.sports.map((sport,i)=>({sport,total:heat.z[i].reduce((a,b)=>a+(+b||0),0),peak:peakForSport(heat,i)})).sort((a,b)=>b.total-a.total);
    const top=totals.slice(0,12);
    const leading=top.slice(0,4);

    $('#sportsStory').innerHTML = `
      <div class="story-kicker">PROGRAMME PULSE</div>
      <h3>${esc(top[0]?.sport || 'Olympic sport')} leads the archive</h3>
      <p>The event programme has expanded and diversified dramatically across 130 years. Use the panels below to see which sports carried the largest event volume and when their programmes peaked.</p>
    `;
    $('#sportsSpotlight').innerHTML = leading.map((x,i)=>`<article class="spot-card spot-${i+1}">
      <span class="spot-rank">0${i+1}</span><span class="spot-label">EVENT VOLUME</span>
      <strong>${esc(x.sport)}</strong><b>${fmt(x.total)}</b><small>recorded event slots · peak ${x.peak.year} (${fmt(x.peak.value)})</small>
    </article>`).join('');

    const summary = [
      ['Sports',fmt(data.meta.stats.sports),'disciplines represented'],
      ['Events',fmt(data.meta.stats.events),'event records in the archive'],
      ['Editions',fmt(data.meta.stats.editions),'Olympic editions covered'],
      ['Programme leader',esc(top[0]?.sport || '—'),`${fmt(top[0]?.total || 0)} event slots`]
    ];
    $('#sportsSummary').innerHTML=summary.map((x,i)=>`<div class="stat-tile stat-tile-${i+1}"><span class="stat-label">${x[0]}</span><span class="stat-value">${x[1]}</span><span class="stat-note">${x[2]}</span></div>`).join('');

    destroyChart(charts.sports);
    charts.sports=new Chart($('#chartSportsTop'),{type:'bar',data:{labels:top.map(x=>x.sport),datasets:[{label:'Events',data:top.map(x=>x.total),backgroundColor:COLORS.navy,borderRadius:7,barThickness:14}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:App.tooltipStyle},scales:{x:{grid:{color:COLORS.grid},border:{display:false},beginAtZero:true,ticks:{color:COLORS.faint}},y:{grid:{display:false},border:{display:false},ticks:{color:COLORS.faint,font:{size:10}}}}}});
    App.renderHeatmap($('#heatmapSports'),heat.sports,heat.years,heat.z);
    $('#sportsInsight').innerHTML = `<span class="insight-mark">✦</span><div><strong>Programme evolution</strong><p>${esc(top[0]?.sport || 'The leading sport')} accounts for the largest cumulative event volume in this season's archive. The heatmap shows how individual programmes rise, disappear, or expand from edition to edition.</p></div>`;
  }

  function renderHosts(data){
    const rows=(data.editionInfo||[]).slice().sort((a,b)=>b.year-a.year);
    const cities=new Map(); rows.forEach(r=>cities.set(r.city,(cities.get(r.city)||0)+1));
    const top=[...cities.entries()].sort((a,b)=>b[1]-a[1]);
    const leader=top[0] || ['—',0];
    const first=rows[rows.length-1] || {}; const latest=rows[0] || {};
    const span = latest.year && first.year ? latest.year-first.year : 0;

    $('#hostsSummary').innerHTML = [
      ['Editions',fmt(data.meta.stats.editions),'staged in this season'],
      ['Host cities',fmt(data.meta.stats.cities),'distinct Olympic locations'],
      ['Most hosted',esc(leader[0]),`${leader[1]} editions`],
      ['Historical span',`${span} years`,`${first.year || '—'} → ${latest.year || '—'}`]
    ].map((x,i)=>`<div class="stat-tile stat-tile-${i+1}"><span class="stat-label">${x[0]}</span><span class="stat-value">${x[1]}</span><span class="stat-note">${x[2]}</span></div>`).join('');

    $('#hostFeature').innerHTML=`<div class="feature-number">${String(latest.year||'—').slice(-2)}</div><div><span class="story-kicker">LATEST STOP</span><h3>${esc(latest.city || 'Unknown')}</h3><p>${esc(latest.edition || '')}. The host timeline moves from the earliest modern Games to a global network of returning and first-time cities.</p></div><div class="feature-chip">${esc(first.city || '—')} → ${esc(latest.city || '—')}</div>`;

    destroyChart(charts.hosts); charts.hosts=new Chart($('#chartHostCities'),{type:'bar',data:{labels:top.slice(0,10).map(x=>x[0]),datasets:[{label:'Editions hosted',data:top.slice(0,10).map(x=>x[1]),backgroundColor:COLORS.red,borderRadius:7,barThickness:14}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:App.tooltipStyle},scales:{x:{grid:{color:COLORS.grid},border:{display:false},beginAtZero:true,ticks:{color:COLORS.faint,stepSize:1}},y:{grid:{display:false},border:{display:false},ticks:{color:COLORS.faint}}}}});

    $('#hostTableCount').textContent = `${rows.length} editions in view`;
    $('#hostTable tbody').innerHTML=rows.map((r,i)=>`<tr><td class="host-rank">${String(i+1).padStart(2,'0')}</td><td class="host-year">${r.year}</td><td><strong>${esc(r.edition)}</strong></td><td><span class="host-city">${esc(r.city)}</span></td></tr>`).join('');
  }

  function renderSeasonCompare(){
    const s=window.OLYMPIC_DATA.summer,w=window.OLYMPIC_DATA.winter;
    const vals=[
      ['Editions',s.meta.stats.editions,w.meta.stats.editions,'Olympic editions in the archive'],
      ['Sports',s.meta.stats.sports,w.meta.stats.sports,'Distinct sports represented'],
      ['Events',s.meta.stats.events,w.meta.stats.events,'Recorded event slots'],
      ['Athletes',s.meta.stats.athletes,w.meta.stats.athletes,'Athlete records represented'],
      ['Nations',s.meta.stats.nations,w.meta.stats.nations,'Participating nations represented'],
      ['Host cities',s.meta.stats.cities,w.meta.stats.cities,'Distinct cities that hosted the Games']
    ];
    $('#seasonCompareCards').innerHTML=vals.map((v,i)=>{
      const max=Math.max(v[1],v[2]); const sp=(v[1]/max)*100, wp=(v[2]/max)*100; const lead=v[1]>=v[2]?'Summer':'Winter';
      return `<article class="compare-card premium-compare"><div class="compare-top"><span>0${i+1}</span><b>${v[0]}</b><em>${lead} leads</em></div><p class="compare-card-desc">${v[3]}</p><div class="compare-values"><div><small>SUMMER</small><strong>${fmt(v[1])}</strong></div><div><small>WINTER</small><strong>${fmt(v[2])}</strong></div></div><div class="compare-bars"><i style="width:${sp}%"></i><i style="width:${wp}%"></i></div><div class="compare-foot"><span>${Math.round(sp)}% scale</span><span>${Math.round(wp)}% scale</span></div></article>`;
    }).join('');

    const ratios = [
      ['Athlete scale', `${(s.meta.stats.athletes/w.meta.stats.athletes).toFixed(1)}×`, 'Summer has the larger athlete footprint across the rebuilt archive.'],
      ['Event scale', `${(s.meta.stats.events/w.meta.stats.events).toFixed(1)}×`, 'Summer carries a much broader event programme.'],
      ['Host-city reach', `${(s.meta.stats.cities/w.meta.stats.cities).toFixed(2)}×`, 'Summer has appeared in slightly more distinct host cities.']
    ];
    $('#seasonInsights').innerHTML=ratios.map((r,i)=>`<article class="ratio-card"><span>0${i+1}</span><small>${r[0]}</small><strong>${r[1]}</strong><p>${r[2]}</p></article>`).join('');

    // Two readable scales: small-count metrics together, large-count metrics together.
    destroyChart(charts.seasonsSmall);
    charts.seasonsSmall=new Chart($('#chartSeasonSmall'),{type:'bar',data:{labels:['Editions','Sports','Nations'],datasets:[{label:'Summer',data:[s.meta.stats.editions,s.meta.stats.sports,s.meta.stats.nations],backgroundColor:COLORS.navy,borderRadius:7},{label:'Winter',data:[w.meta.stats.editions,w.meta.stats.sports,w.meta.stats.nations],backgroundColor:COLORS.red,borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',labels:{color:COLORS.faint}},tooltip:App.tooltipStyle},scales:{x:{grid:{color:COLORS.grid},border:{display:false},ticks:{color:COLORS.faint}},y:{grid:{color:COLORS.grid},border:{display:false},beginAtZero:true,ticks:{color:COLORS.faint,precision:0}}}}});
    destroyChart(charts.seasonsLarge);
    charts.seasonsLarge=new Chart($('#chartSeasonLarge'),{type:'bar',data:{labels:['Events','Athletes'],datasets:[{label:'Summer',data:[s.meta.stats.events,s.meta.stats.athletes],backgroundColor:COLORS.navy,borderRadius:7},{label:'Winter',data:[w.meta.stats.events,w.meta.stats.athletes],backgroundColor:COLORS.red,borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',labels:{color:COLORS.faint}},tooltip:App.tooltipStyle},scales:{x:{grid:{color:COLORS.grid},border:{display:false},ticks:{color:COLORS.faint}},y:{grid:{color:COLORS.grid},border:{display:false},beginAtZero:true,ticks:{color:COLORS.faint,callback:v=>Number(v).toLocaleString()}}}}});
  }

  function topAthlete(data){ const a=(data.mostSuccessful.Overall||[])[0]; return a ? {name:a.Name,medals:a.Medals,sport:a.Sport,region:a.region} : null; }

  function editionStats(data){
    const o=data.overtime || {};
    const years=o.years || [];
    const events=o.events || [];
    const athletes=o.athletes || [];
    const nations=o.nations || [];
    const idxMax = arr => arr.length ? arr.reduce((best,v,i)=> (+v > +(arr[best]||0) ? i : best),0) : 0;
    const ei=idxMax(events), ai=idxMax(athletes), ni=idxMax(nations);
    return {
      biggestEvents: years[ei] ? {year:years[ei], value:+events[ei]||0} : null,
      biggestAthletes: years[ai] ? {year:years[ai], value:+athletes[ai]||0} : null,
      biggestNations: years[ni] ? {year:years[ni], value:+nations[ni]||0} : null
    };
  }

  function nationEditionRecords(data){
    const years=data.medals?.year || [], countries=data.medals?.countries || [], countryIdx=data.medals?.country || [], medal=data.medals?.medal || [];
    const map=new Map();
    for(let i=0;i<years.length;i++){
      const year=+years[i], country=countries[countryIdx[i]], m=String(medal[i]||'').toLowerCase();
      if(!country || !year) continue;
      const key=`${year}|||${country}`;
      if(!map.has(key)) map.set(key,{year,country,gold:0,silver:0,bronze:0,total:0});
      const r=map.get(key); if(m==='gold'||m==='silver'||m==='bronze') r[m]++; r.total++;
    }
    const rows=[...map.values()];
    const byTotal=rows.slice().sort((a,b)=>b.total-a.total||b.gold-a.gold);
    const byGold=rows.slice().sort((a,b)=>b.gold-a.gold||b.total-a.total);
    const editions=new Map();
    rows.forEach(r=>{ if(!editions.has(r.country)) editions.set(r.country,new Set()); editions.get(r.country).add(r.year); });
    const mostEditions=[...editions.entries()].map(([country,set])=>({country,editions:set.size})).sort((a,b)=>b.editions-a.editions)[0];
    return { biggest:byTotal[0]||null, gold:byGold[0]||null, mostEditions:mostEditions||null };
  }

  function renderRecords(data){
    const season=(data.meta.season || (data===window.OLYMPIC_DATA.winter?'Winter':'Summer'));
    const seasonUpper=season.toUpperCase();
    const athlete=topAthlete(data);
    const edition=editionStats(data);
    const nation=nationEditionRecords(data);
    const years=data.meta.years || [];
    const firstYear=years[0], latestYear=years.at(-1);

    const records=[
      {tag:`${seasonUpper} · MOST DECORATED`,title:athlete?.name||'—',value:`${fmt(athlete?.medals)} medals`,meta:`${athlete?.sport||'—'} · ${athlete?.region||'—'}`,accent:'gold'},
      {tag:`${seasonUpper} · SINGLE-EDITION HAUL`,title:nation?.biggest?.country||'—',value:`${fmt(nation?.biggest?.total)} medals`,meta:`${nation?.biggest?.year||'—'} · largest medal-record total`,accent:'blue'},
      {tag:`${seasonUpper} · MOST GOLD IN ONE EDITION`,title:nation?.gold?.country||'—',value:`${fmt(nation?.gold?.gold)} gold`,meta:`${nation?.gold?.year||'—'} · ${fmt(nation?.gold?.total)} medal records`,accent:'teal'},
      {tag:`${seasonUpper} · MOST EDITIONS WITH MEDALS`,title:nation?.mostEditions?.country||'—',value:`${fmt(nation?.mostEditions?.editions)} editions`,meta:`medal records across the ${season.toLowerCase()} archive`,accent:'pink'},
      {tag:`${seasonUpper} · LARGEST ATHLETE FIELD`,title:edition.biggestAthletes?.year ? String(edition.biggestAthletes.year) : '—',value:`${fmt(edition.biggestAthletes?.value)} athletes`,meta:'largest athlete count in one edition',accent:'violet'},
      {tag:`${seasonUpper} · LARGEST PROGRAMME`,title:edition.biggestEvents?.year ? String(edition.biggestEvents.year) : '—',value:`${fmt(edition.biggestEvents?.value)} events`,meta:'largest event programme in one edition',accent:'silver'}
    ];
    $('#recordsGrid').innerHTML=records.map((r,i)=>`<article class="record-hero record-${r.accent}"><span class="record-no">${String(i+1).padStart(2,'0')}</span><span class="record-label">${esc(r.tag)}</span><h3>${esc(r.title)}</h3><strong>${esc(r.value)}</strong><p>${esc(r.meta)}</p><span class="record-line"></span></article>`).join('');

    const milestones=[];
    if(firstYear) milestones.push([firstYear,(data.editionInfo?.[0]?.city)||'First edition',`The ${season.toLowerCase()} archive begins with its earliest recorded Olympic edition.` ,seasonUpper]);
    if(edition.biggestNations?.year) milestones.push([edition.biggestNations.year,'Participation peak',`${fmt(edition.biggestNations.value)} nations were represented in the edition with the widest national participation.` ,seasonUpper]);
    if(edition.biggestEvents?.year) milestones.push([edition.biggestEvents.year,'Programme peak',`${fmt(edition.biggestEvents.value)} events made this the largest event programme in the ${season.toLowerCase()} archive.` ,seasonUpper]);
    if(edition.biggestAthletes?.year) milestones.push([edition.biggestAthletes.year,'Athlete-field peak',`${fmt(edition.biggestAthletes.value)} athletes made this the largest athlete field in the rebuilt archive.` ,seasonUpper]);
    if(latestYear) milestones.push([latestYear,(data.editionInfo?.at(-1)?.city)||'Latest edition',`The latest ${season.toLowerCase()} edition currently included in the 1896–2026 rebuild.` ,seasonUpper]);
    $('#milestoneTimeline').innerHTML=milestones.map((m,i)=>`<article class="milestone"><span>${String(i+1).padStart(2,'0')}</span><b>${m[0]}</b><div><strong>${esc(m[1])}</strong><p>${esc(m[2])}</p></div><em>${esc(m[3])}</em></article>`).join('');

    $('#recordsTable thead').innerHTML='<tr><th>Record</th><th>Holder</th><th>Year</th><th>Value</th><th>Context</th></tr>';
    const rows=[
      ['Most decorated athlete',athlete?.name||'—',latestYear && athlete ? 'Career' : '—',`${fmt(athlete?.medals)} medals`,`${athlete?.sport||'—'} · ${athlete?.region||'—'}`],
      ['Biggest single-edition medal haul',nation?.biggest?.country||'—',nation?.biggest?.year||'—',`${fmt(nation?.biggest?.total)} medals`,`Gold ${fmt(nation?.biggest?.gold)} · Silver ${fmt(nation?.biggest?.silver)} · Bronze ${fmt(nation?.biggest?.bronze)}`],
      ['Most golds in one edition',nation?.gold?.country||'—',nation?.gold?.year||'—',`${fmt(nation?.gold?.gold)} gold`,`Total medal records ${fmt(nation?.gold?.total)}`],
      ['Most editions with medals',nation?.mostEditions?.country||'—','Career',`${fmt(nation?.mostEditions?.editions)} editions`,`At least one medal record in each edition`],
      ['Largest athlete field',edition.biggestAthletes?.year||'—',edition.biggestAthletes?.year||'—',`${fmt(edition.biggestAthletes?.value)} athletes`,`Largest athlete count in one ${season.toLowerCase()} edition`],
      ['Largest event programme',edition.biggestEvents?.year||'—',edition.biggestEvents?.year||'—',`${fmt(edition.biggestEvents?.value)} events`,`Largest event count in one ${season.toLowerCase()} edition`]
    ];
    $('#recordsTable tbody').innerHTML=rows.map(r=>`<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('');
    $('#recordsClosing').innerHTML=`<span class="insight-mark">✦</span><div><strong>${esc(season)} record book</strong><p>Every record and milestone above is calculated only from the selected ${season.toLowerCase()} archive. Switch the global Summer / Winter control to rebuild this entire section for the other season.</p></div>`;
    const head=document.querySelector('#records .view-head .view-sub'); if(head) head.textContent=`${season} records only — standout athletes, nation achievements and edition-scale milestones from ${firstYear}–${latestYear}.`;
  }

  function register(){
    App.nav.register('sports',renderSports);
    App.nav.register('hosts',renderHosts);
    App.nav.register('season-compare',renderSeasonCompare);
    App.nav.register('records',renderRecords);
  }
  register();
})();
