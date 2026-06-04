// Barcelona Line Chart: Results/Goals per season (La Liga)

let barcaLineG = null;

function drawBarcaLine(data, metric) {
  const container = document.getElementById('barca-line-chart');
  const seasons = [...new Set(data.map(d => d.Season))].sort();

  let chartData;
  if (metric === 'results') {
    chartData = seasons.map(s => {
      const m = data.filter(d => d.Season === s);
      const wins   = m.filter(d => (d.HomeTeam === 'Barcelona' && d.FTR === 'H') || (d.AwayTeam === 'Barcelona' && d.FTR === 'A')).length;
      const draws  = m.filter(d => d.FTR === 'D').length;
      const losses = m.length - wins - draws;
      return { season: s, Win: wins, Draw: draws, Loss: losses };
    });
  } else {
    chartData = seasons.map(s => {
      const m = data.filter(d => d.Season === s);
      const scored   = m.reduce((a, d) => a + (d.HomeTeam === 'Barcelona' ? +d.FTHG : +d.FTAG), 0);
      const conceded = m.reduce((a, d) => a + (d.HomeTeam === 'Barcelona' ? +d.FTAG : +d.FTHG), 0);
      return { season: s, Scored: scored, Conceded: conceded };
    });
  }

  const margin = { top: 30, right: 30, bottom: 55, left: 50 };
  const width  = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const keys   = metric === 'results' ? ['Win', 'Draw', 'Loss'] : ['Scored', 'Conceded'];
  const colors = metric === 'results'
    ? { Win: '#00c875', Draw: '#f0b429', Loss: '#a50044' }
    : { Scored: '#004d98', Conceded: '#a50044' };

  const x = d3.scalePoint().domain(seasons).range([0, width]).padding(.3);
  const allVals = chartData.flatMap(d => keys.map(k => d[k]));
  const y = d3.scaleLinear().domain([0, d3.max(allVals) * 1.15]).range([height, 0]);

  const t = d3.transition().duration(600).ease(d3.easeCubicInOut);

  // Create SVG structure once
  if (!barcaLineG) {
    const svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    barcaLineG = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    barcaLineG.append('g').attr('class', 'grid');
    barcaLineG.append('g').attr('class', 'axis x-axis').attr('transform', `translate(0,${height})`);
    barcaLineG.append('g').attr('class', 'axis y-axis');
    barcaLineG.append('g').attr('class', 'lines-group');
    barcaLineG.append('g').attr('class', 'dots-group');
    d3.select(container).append('div').attr('class', 'legend barca-line-legend');
  }

  // Update grid and axes with transition
  barcaLineG.select('.grid').transition(t)
    .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5));
  barcaLineG.select('.x-axis')
    .call(d3.axisBottom(x))
    .selectAll('text').attr('transform', 'rotate(-30)').attr('text-anchor', 'end');
  barcaLineG.select('.y-axis').transition(t).call(d3.axisLeft(y).ticks(5));

  // Lines: Enter/Update/Exit keyed by metric name
  const lineData = keys.map(k => ({
    key: k,
    path: d3.line().x(d => x(d.season)).y(d => y(d[k])).curve(d3.curveMonotoneX)(chartData),
  }));

  barcaLineG.select('.lines-group').selectAll('path.line')
    .data(lineData, d => d.key)
    .join(
      enter => enter.append('path').attr('class', 'line')
        .attr('fill', 'none').attr('stroke', d => colors[d.key]).attr('stroke-width', 2.5)
        .attr('d', d => d.path)
        .each(function() {
          const len = this.getTotalLength();
          d3.select(this).attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len);
        })
        .call(s => s.transition(t).attr('stroke-dashoffset', 0)),
      update => update.transition(t).attr('stroke', d => colors[d.key]).attr('d', d => d.path),
      exit   => exit.transition(t).attr('opacity', 0).remove()
    );

  // Dots: one group per key, circles per season
  const tooltip = document.getElementById('tooltip-line');

  const dotGroups = barcaLineG.select('.dots-group').selectAll('g.dot-group')
    .data(keys, k => k)
    .join(
      enter => enter.append('g').attr('class', 'dot-group'),
      update => update,
      exit   => exit.transition(t).attr('opacity', 0).remove()
    );

  dotGroups.each(function(key) {
    d3.select(this).selectAll('circle')
      .data(chartData, d => d.season)
      .join(
        enter => enter.append('circle')
          .attr('cx', d => x(d.season)).attr('cy', height)
          .attr('r', 0).attr('fill', colors[key])
          .attr('stroke', '#0a0c10').attr('stroke-width', 2).style('cursor', 'pointer'),
        update => update,
        exit   => exit.transition(t).attr('r', 0).attr('opacity', 0).remove()
      )
      .transition(t)
      .attr('cx', d => x(d.season)).attr('cy', d => y(d[key])).attr('r', 6).attr('fill', colors[key]);

    // Re-attach tooltip events
    d3.select(this).selectAll('circle')
      .on('mousemove', (event, d) => {
        tooltip.innerHTML = `<strong>${d.season}</strong>${key}: <b>${d[key]}</b>`;
        tooltip.classList.add('show');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', () => tooltip.classList.remove('show'));
  });

  // Legend: Enter/Update/Exit
  d3.select(container).select('.barca-line-legend')
    .selectAll('.legend-item')
    .data(keys, k => k)
    .join(
      enter => {
        const item = enter.append('div').attr('class', 'legend-item').style('opacity', 0);
        item.append('div').attr('class', 'legend-dot');
        item.append('span');
        return item;
      },
      update => update,
      exit   => exit.style('opacity', 0).remove()
    )
    .style('opacity', 1)
    .each(function(key) {
      d3.select(this).select('.legend-dot').style('background', colors[key]);
      d3.select(this).select('span').text(key);
    });
}

d3.csv('data/barcelona_laliga.csv').then(data => {
  window.barcaData = data;
  drawBarcaLine(data, document.getElementById('metric-filter').value);
  document.getElementById('metric-filter').addEventListener('change', function() {
    drawBarcaLine(window.barcaData, this.value);
  });
});
