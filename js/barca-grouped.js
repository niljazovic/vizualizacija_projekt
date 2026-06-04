// Barcelona Grouped Bar Chart: Home vs. Away win % per season

let barcaGroupedG = null;

function drawBarcaGrouped(data) {
  const container = document.getElementById('barca-grouped-bar');
  const seasons = [...new Set(data.map(d => d.Season))].sort();

  const chartData = seasons.map(s => {
    const m     = data.filter(d => d.Season === s);
    const homeM = m.filter(d => d.HomeTeam === 'Barcelona');
    const awayM = m.filter(d => d.AwayTeam === 'Barcelona');
    return {
      season:    s,
      Home:      homeM.length ? +(homeM.filter(d => d.FTR === 'H').length / homeM.length * 100).toFixed(1) : 0,
      Away:      awayM.length ? +(awayM.filter(d => d.FTR === 'A').length / awayM.length * 100).toFixed(1) : 0,
      HomeTotal: homeM.length,
      AwayTotal: awayM.length,
    };
  });

  const margin = { top: 30, right: 30, bottom: 55, left: 55 };
  const width  = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const x0     = d3.scaleBand().domain(seasons).range([0, width]).paddingInner(.25).paddingOuter(.1);
  const x1     = d3.scaleBand().domain(['Home', 'Away']).range([0, x0.bandwidth()]).padding(.08);
  const y      = d3.scaleLinear().domain([0, 100]).range([height, 0]);
  const colors = { Home: '#004d98', Away: '#a50044' };
  const t      = d3.transition().duration(600).ease(d3.easeCubicInOut);

  // Create SVG structure once
  if (!barcaGroupedG) {
    const svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    barcaGroupedG = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    barcaGroupedG.append('g').attr('class', 'grid');
    barcaGroupedG.append('g').attr('class', 'axis x-axis').attr('transform', `translate(0,${height})`);
    barcaGroupedG.append('g').attr('class', 'axis y-axis');
    barcaGroupedG.append('g').attr('class', 'bars-group');
    barcaGroupedG.append('g').attr('class', 'labels-group');
    barcaGroupedG.append('text')
      .attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -42)
      .attr('text-anchor', 'middle').attr('fill', '#9ba3c0').attr('font-size', '13px')
      .text('Win %');
    // Static legend
    const legend = d3.select(container).append('div').attr('class', 'legend');
    ['Home', 'Away'].forEach(k => {
      const item = legend.append('div').attr('class', 'legend-item');
      item.append('div').attr('class', 'legend-rect').style('background', colors[k]);
      item.append('span').text(k);
    });
  }

  barcaGroupedG.select('.grid').transition(t)
    .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5));
  barcaGroupedG.select('.x-axis')
    .call(d3.axisBottom(x0))
    .selectAll('text').attr('transform', 'rotate(-30)').attr('text-anchor', 'end');
  barcaGroupedG.select('.y-axis').transition(t)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));

  const tooltip = document.getElementById('tooltip-bar');

  ['Home', 'Away'].forEach(key => {
    // Bars: Enter/Update/Exit keyed by season
    barcaGroupedG.select('.bars-group').selectAll(`rect.bar-${key}`)
      .data(chartData, d => d.season)
      .join(
        enter => enter.append('rect').attr('class', `bar-${key}`)
          .attr('x', d => x0(d.season) + x1(key)).attr('y', height)
          .attr('width', x1.bandwidth()).attr('height', 0)
          .attr('fill', colors[key]).attr('rx', 3).style('cursor', 'pointer'),
        update => update,
        exit   => exit.transition(t).attr('y', height).attr('height', 0).remove()
      )
      .transition(t)
      .attr('x', d => x0(d.season) + x1(key))
      .attr('y', d => y(d[key]))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d[key]));

    barcaGroupedG.select('.bars-group').selectAll(`rect.bar-${key}`)
      .on('mousemove', (event, d) => {
        const total = key === 'Home' ? d.HomeTotal : d.AwayTotal;
        tooltip.innerHTML = `<strong>${d.season} — ${key}</strong>Win rate: <b>${d[key]}%</b><br>Matches: ${total}`;
        tooltip.classList.add('show');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', () => tooltip.classList.remove('show'));

    // Value labels above bars
    barcaGroupedG.select('.labels-group').selectAll(`text.label-${key}`)
      .data(chartData, d => d.season)
      .join(
        enter => enter.append('text').attr('class', `label-${key}`)
          .attr('text-anchor', 'middle').attr('fill', colors[key])
          .attr('font-size', '11px').attr('font-family', 'DM Sans, sans-serif').attr('opacity', 0),
        update => update,
        exit   => exit.remove()
      )
      .transition(t)
      .attr('x', d => x0(d.season) + x1(key) + x1.bandwidth() / 2)
      .attr('y', d => y(d[key]) - 4)
      .attr('opacity', 1)
      .text(d => d[key] > 0 ? d[key] + '%' : '');
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
