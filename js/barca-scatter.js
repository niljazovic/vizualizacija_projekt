// Barcelona Scatter: Multidimensional view - shots on target, goals, win rate per season

function drawBarcaScatter(data) {
  const container = document.getElementById('barca-scatter');
  const seasons   = [...new Set(data.map(d => d.Season))].sort();

  // Compute per-season metrics
  const chartData = seasons.map((s, i) => {
    const m     = data.filter(d => d.Season === s);
    const homeM = m.filter(d => d.HomeTeam === 'Barcelona');
    const awayM = m.filter(d => d.AwayTeam === 'Barcelona');

    const totalSOT  = homeM.reduce((a, d) => a + +d.HST, 0) + awayM.reduce((a, d) => a + +d.AST, 0);
    const totalGoals = homeM.reduce((a, d) => a + +d.FTHG, 0) + awayM.reduce((a, d) => a + +d.FTAG, 0);
    const wins      = m.filter(d => (d.HomeTeam === 'Barcelona' && d.FTR === 'H') || (d.AwayTeam === 'Barcelona' && d.FTR === 'A')).length;

    return {
      season:   s,
      idx:      i,
      avgSOT:   +(totalSOT  / m.length).toFixed(2),
      avgGoals: +(totalGoals / m.length).toFixed(2),
      winRate:  +(wins / m.length * 100).toFixed(1),
    };
  });

  const margin = { top: 40, right: 160, bottom: 60, left: 60 };
  const width  = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;
  const height = 440 - margin.top - margin.bottom;

  const xExt = d3.extent(chartData, d => d.avgSOT);
  const yExt = d3.extent(chartData, d => d.avgGoals);
  const x    = d3.scaleLinear().domain([xExt[0] - .3, xExt[1] + .3]).range([0, width]).nice();
  const y    = d3.scaleLinear().domain([yExt[0] - .1, yExt[1] + .1]).range([height, 0]).nice();
  const rScale = d3.scaleSqrt().domain([0, 100]).range([6, 28]);
  const colorScale = d3.scaleSequential()
    .domain([0, seasons.length - 1])
    .interpolator(d3.interpolateRgb('#004d98', '#a50044'));

  const t = d3.transition().duration(700).ease(d3.easeCubicInOut);

  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Horizontal grid lines (y-axis based)
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5));
  // Vertical grid lines (x-axis based, anchored at bottom)
  g.append('g').attr('class', 'grid').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(-height).tickFormat('').ticks(6));

  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(6));
  g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5));

  // Axis labels
  g.append('text').attr('x', width / 2).attr('y', height + 48)
    .attr('text-anchor', 'middle').attr('fill', '#9ba3c0').attr('font-size', '13px')
    .attr('font-family', 'DM Sans, sans-serif').text('Avg Shots on Target per Game');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -46)
    .attr('text-anchor', 'middle').attr('fill', '#9ba3c0').attr('font-size', '13px')
    .attr('font-family', 'DM Sans, sans-serif').text('Avg Goals Scored per Game');

  const tooltip = document.getElementById('tooltip-scatter');

  // Bubbles: Enter with scale-in animation
  const bubbles = g.selectAll('circle.bubble')
    .data(chartData, d => d.season)
    .join(
      enter => enter.append('circle').attr('class', 'bubble')
        .attr('cx', d => x(d.avgSOT)).attr('cy', d => y(d.avgGoals))
        .attr('r', 0)
        .attr('fill', d => colorScale(d.idx))
        .attr('stroke', '#0a0c10').attr('stroke-width', 2)
        .attr('opacity', .88).style('cursor', 'pointer'),
      update => update,
      exit   => exit.transition(t).attr('r', 0).remove()
    );

  bubbles.transition(t)
    .delay((d, i) => i * 60)
    .attr('cx', d => x(d.avgSOT)).attr('cy', d => y(d.avgGoals))
    .attr('r', d => rScale(d.winRate));

  bubbles
    .on('mousemove', (event, d) => {
      tooltip.innerHTML = `<strong>${d.season}</strong>Shots on target/game: <b>${d.avgSOT}</b><br>Goals/game: <b>${d.avgGoals}</b><br>Win rate: <b>${d.winRate}%</b>`;
      tooltip.classList.add('show');
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top  = (event.clientY - 28) + 'px';
    })
    .on('mouseleave', () => tooltip.classList.remove('show'));

  // Season labels next to each bubble
  g.selectAll('text.bubble-label')
    .data(chartData, d => d.season)
    .join(
      enter => enter.append('text').attr('class', 'bubble-label')
        .attr('text-anchor', 'middle').attr('fill', '#e8eaf2')
        .attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif')
        .attr('opacity', 0).attr('pointer-events', 'none'),
      update => update,
      exit   => exit.remove()
    )
    .transition(t)
    .delay((d, i) => i * 60 + 200)
    .attr('x', d => x(d.avgSOT))
    .attr('y', d => y(d.avgGoals) - rScale(d.winRate) - 5)
    .attr('opacity', 1)
    .text(d => d.season.replace('/', '/'));

  // Legend
  const legendG = svg.append('g')
    .attr('transform', `translate(${width + margin.left + 16},${margin.top + 10})`);

  legendG.append('text').attr('x', 0).attr('y', 0)
    .attr('fill', '#f0b429').attr('font-size', '11px').attr('font-weight', '700')
    .attr('font-family', 'DM Sans, sans-serif').attr('letter-spacing', '.1em')
    .text('BUBBLE SIZE');
  legendG.append('text').attr('x', 0).attr('y', 13)
    .attr('fill', '#9ba3c0').attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif')
    .text('= win rate');

  const sizeLegendData = [30, 60, 90];
  let offsetY = 36;
  sizeLegendData.forEach(pct => {
    const r = rScale(pct);
    legendG.append('circle').attr('cx', 16).attr('cy', offsetY + r)
      .attr('r', r).attr('fill', 'none').attr('stroke', '#9ba3c0').attr('stroke-width', 1);
    legendG.append('text').attr('x', 36).attr('y', offsetY + r + 4)
      .attr('fill', '#9ba3c0').attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif')
      .text(`${pct}%`);
    offsetY += r * 2 + 8;
  });

  // Color gradient legend for era
  const gradLegendY = offsetY + 10;
  legendG.append('text').attr('x', 0).attr('y', gradLegendY)
    .attr('fill', '#f0b429').attr('font-size', '11px').attr('font-weight', '700')
    .attr('font-family', 'DM Sans, sans-serif').attr('letter-spacing', '.1em')
    .text('COLOR');
  legendG.append('text').attr('x', 0).attr('y', gradLegendY + 13)
    .attr('fill', '#9ba3c0').attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif')
    .text('= season era');

  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'scatter-era-grad').attr('x1', '0%').attr('x2', '0%').attr('y1', '0%').attr('y2', '100%');
  grad.append('stop').attr('offset', '0%').attr('stop-color', '#004d98');
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#a50044');
  legendG.append('rect').attr('x', 4).attr('y', gradLegendY + 20)
    .attr('width', 12).attr('height', 50).attr('rx', 3)
    .attr('fill', 'url(#scatter-era-grad)');
  legendG.append('text').attr('x', 20).attr('y', gradLegendY + 28)
    .attr('fill', '#9ba3c0').attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif')
    .text('2016');
  legendG.append('text').attr('x', 20).attr('y', gradLegendY + 70)
    .attr('fill', '#9ba3c0').attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif')
    .text('2025');
}

function waitForBarcaScatterData() {
  if (window.barcaData && window.barcaData.length) {
    drawBarcaScatter(window.barcaData);
  } else {
    setTimeout(waitForBarcaScatterData, 100);
  }
}
waitForBarcaScatterData();
