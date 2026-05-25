// ── UCL Horizontal Bar: Top klubovi ───────────────────────────

function drawUCLBar(data, topN, sortKey) {
  const container = document.getElementById('ucl-bar-chart');
  container.innerHTML = '';

  const parsed = data.map(d => ({
    team: d.Team, matches: +d['M.'], wins: +d.W, draws: +d.D, losses: +d.L, points: +d['Pt.'],
  })).filter(d => d.team && !isNaN(d.wins));

  const sorted = [...parsed].sort((a, b) => {
    const key = sortKey === 'W' ? 'wins' : sortKey === 'M.' ? 'matches' : 'points';
    return b[key] - a[key];
  }).slice(0, topN);

  const chartData = [...sorted].reverse();
  const valKey = sortKey === 'W' ? 'wins' : sortKey === 'M.' ? 'matches' : 'points';

  const margin = { top: 10, right: 80, bottom: 40, left: 160 };
  const height = chartData.length * 34;
  const width  = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;

  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(chartData, d => d[valKey]) * 1.1]).range([0, width]);
  const y = d3.scaleBand().domain(chartData.map(d => d.team)).range([0, height]).padding(.22);

  svg.append('g').attr('class','grid').attr('transform',`translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(-height).tickFormat('').ticks(6));
  svg.append('g').attr('class','axis').call(d3.axisLeft(y));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x).ticks(6));

  const tooltip = document.getElementById('tooltip-ucl-bar');
  const barColor = d => d.team === 'FC Barcelona' ? '#004d98' : d.team === 'Real Madrid' ? '#f0b429' : '#2a3050';

  svg.selectAll('.bar').data(chartData).join('rect')
    .attr('class','bar').attr('x', 0).attr('y', d => y(d.team))
    .attr('width', d => x(d[valKey])).attr('height', y.bandwidth())
    .attr('fill', barColor).attr('rx', 4).style('cursor','pointer')
    .on('mousemove', (event, d) => {
      tooltip.innerHTML = `<strong>${d.team}</strong>Pobjede: ${d.wins}<br>Utakmice: ${d.matches}<br>Bodovi: ${d.points}`;
      tooltip.classList.add('show');
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top  = (event.clientY - 28) + 'px';
    })
    .on('mouseleave', () => tooltip.classList.remove('show'));

  svg.selectAll('.bar-label').data(chartData).join('text')
    .attr('x', d => x(d[valKey]) + 6).attr('y', d => y(d.team) + y.bandwidth() / 2 + 4)
    .attr('fill','#e8eaf2').attr('font-size','11px').attr('font-family','DM Sans, sans-serif')
    .text(d => d[valKey]);
}

d3.csv('data/UCL_AllTime_Performance_Table.csv').then(data => {
  window.uclBarData = data;
  drawUCLBar(data, +document.getElementById('top-n-filter').value, document.getElementById('sort-filter').value);
  document.getElementById('top-n-filter').addEventListener('change', function() {
    drawUCLBar(window.uclBarData, +this.value, document.getElementById('sort-filter').value);
  });
  document.getElementById('sort-filter').addEventListener('change', function() {
    drawUCLBar(window.uclBarData, +document.getElementById('top-n-filter').value, this.value);
  });
});
