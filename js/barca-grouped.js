// ── Barça Grouped Bar: Domaći vs Gostujući (pravi podaci) ────

function drawBarcaGrouped(data) {
  const container = document.getElementById('barca-grouped-bar');
  container.innerHTML = '';

  const seasons = [...new Set(data.map(d => d.Season))].sort();

  const chartData = seasons.map(s => {
    const m = data.filter(d => d.Season === s);
    const homeM = m.filter(d => d.HomeTeam === 'Barcelona');
    const awayM = m.filter(d => d.AwayTeam === 'Barcelona');
    const homeWins = homeM.filter(d => d.FTR === 'H').length;
    const awayWins = awayM.filter(d => d.FTR === 'A').length;
    return {
      season: s,
      Home: homeM.length ? +(homeWins / homeM.length * 100).toFixed(1) : 0,
      Away: awayM.length ? +(awayWins / awayM.length * 100).toFixed(1) : 0,
      HomeTotal: homeM.length,
      AwayTotal: awayM.length,
    };
  });

  const margin = { top: 30, right: 30, bottom: 55, left: 55 };
  const width  = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;
  const height = 320 - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(seasons).range([0, width]).paddingInner(.25).paddingOuter(.1);
  const x1 = d3.scaleBand().domain(['Home','Away']).range([0, x0.bandwidth()]).padding(.08);
  const y  = d3.scaleLinear().domain([0, 100]).range([height, 0]);
  const colors = { Home: '#004d98', Away: '#a50044' };

  svg.append('g').attr('class','grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll('text').attr('transform','rotate(-30)').attr('text-anchor','end');
  svg.append('g').attr('class','axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));

  svg.append('text').attr('transform','rotate(-90)').attr('x', -height/2).attr('y', -42)
    .attr('text-anchor','middle').attr('fill','#6b7394').attr('font-size','11px')
    .text('% pobjeda');

  const tooltip = document.getElementById('tooltip-bar');

  const seasonGroup = svg.selectAll('.season-group').data(chartData).join('g')
    .attr('class','season-group').attr('transform', d => `translate(${x0(d.season)},0)`);

  ['Home','Away'].forEach(key => {
    seasonGroup.append('rect')
      .attr('x', d => x1(key)).attr('y', d => y(d[key]))
      .attr('width', x1.bandwidth()).attr('height', d => height - y(d[key]))
      .attr('fill', colors[key]).attr('rx', 3).style('cursor','pointer')
      .on('mousemove', (event, d) => {
        const total = key === 'Home' ? d.HomeTotal : d.AwayTotal;
        tooltip.innerHTML = `<strong>${d.season} — ${key === 'Home' ? 'Domaći' : 'Gostujući'}</strong>% pobjeda: <b>${d[key]}%</b><br>Utakmica: ${total}`;
        tooltip.classList.add('show');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', () => tooltip.classList.remove('show'));

    seasonGroup.append('text')
      .attr('x', d => x1(key) + x1.bandwidth() / 2).attr('y', d => y(d[key]) - 4)
      .attr('text-anchor','middle').attr('fill', colors[key])
      .attr('font-size','9px').attr('font-family','DM Sans, sans-serif')
      .text(d => d[key] > 0 ? d[key] + '%' : '');
  });

  const legend = d3.select(container).append('div').attr('class','legend');
  [['Home','Domaći'],['Away','Gostujući']].forEach(([k, label]) => {
    const item = legend.append('div').attr('class','legend-item');
    item.append('div').attr('class','legend-rect').style('background', colors[k]);
    item.append('span').text(label);
  });
}

function waitForBarcaData() {
  if (window.barcaData && window.barcaData.length) {
    drawBarcaGrouped(window.barcaData);
  } else {
    setTimeout(waitForBarcaData, 100);
  }
}
waitForBarcaData();
