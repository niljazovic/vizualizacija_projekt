// ── Barça Line Chart: Rezultati/Golovi po sezoni (La Liga, pravi podaci) ──

function drawBarcaLine(data, metric) {
  const container = document.getElementById('barca-line-chart');
  container.innerHTML = '';

  const seasons = [...new Set(data.map(d => d.Season))].sort();

  let chartData;
  if (metric === 'results') {
    chartData = seasons.map(s => {
      const m = data.filter(d => d.Season === s);
      const wins  = m.filter(d => (d.HomeTeam === 'Barcelona' && d.FTR === 'H') || (d.AwayTeam === 'Barcelona' && d.FTR === 'A')).length;
      const draws = m.filter(d => d.FTR === 'D').length;
      const losses= m.length - wins - draws;
      return { season: s, Win: wins, Draw: draws, Loss: losses };
    });
  } else {
    chartData = seasons.map(s => {
      const m = data.filter(d => d.Season === s);
      const scored   = m.reduce((acc, d) => acc + (d.HomeTeam === 'Barcelona' ? +d.FTHG : +d.FTAG), 0);
      const conceded = m.reduce((acc, d) => acc + (d.HomeTeam === 'Barcelona' ? +d.FTAG : +d.FTHG), 0);
      return { season: s, Scored: scored, Conceded: conceded };
    });
  }

  const margin = { top: 30, right: 30, bottom: 55, left: 50 };
  const width  = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;
  const height = 320 - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint().domain(seasons).range([0, width]).padding(.3);
  const keys = metric === 'results' ? ['Win','Draw','Loss'] : ['Scored','Conceded'];
  const colors = metric === 'results'
    ? { Win: '#00c875', Draw: '#f0b429', Loss: '#a50044' }
    : { Scored: '#004d98', Conceded: '#a50044' };

  const allVals = chartData.flatMap(d => keys.map(k => d[k]));
  const y = d3.scaleLinear().domain([0, d3.max(allVals) * 1.15]).range([height, 0]);

  svg.append('g').attr('class','grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text').attr('transform','rotate(-30)').attr('text-anchor','end');
  svg.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5));

  const tooltip = document.getElementById('tooltip-line');

  keys.forEach(key => {
    const line = d3.line().x(d => x(d.season)).y(d => y(d[key])).curve(d3.curveMonotoneX);
    svg.append('path').datum(chartData)
      .attr('fill','none').attr('stroke', colors[key]).attr('stroke-width', 2.5).attr('d', line);

    svg.selectAll(`.dot-${key}`).data(chartData).join('circle')
      .attr('cx', d => x(d.season)).attr('cy', d => y(d[key]))
      .attr('r', 5).attr('fill', colors[key]).attr('stroke','#0a0c10').attr('stroke-width', 2)
      .style('cursor','pointer')
      .on('mousemove', (event, d) => {
        tooltip.innerHTML = `<strong>${d.season}</strong>${key}: <b>${d[key]}</b>`;
        tooltip.classList.add('show');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', () => tooltip.classList.remove('show'));
  });

  const legend = d3.select(container).append('div').attr('class','legend');
  keys.forEach(k => {
    const item = legend.append('div').attr('class','legend-item');
    item.append('div').attr('class','legend-dot').style('background', colors[k]);
    item.append('span').text(k);
  });
}

d3.csv('data/barcelona_laliga.csv').then(data => {
  window.barcaData = data;
  drawBarcaLine(data, document.getElementById('metric-filter').value);
  document.getElementById('metric-filter').addEventListener('change', function() {
    drawBarcaLine(window.barcaData, this.value);
  });
});
