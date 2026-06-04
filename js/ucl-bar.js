// UCL Horizontal Bar Chart: Top clubs all-time

let uclBarG        = null;
let uclBarHighlight = null; // Set of club names to highlight (from map click)

function drawUCLBar(data, topN, sortKey) {
  const container = document.getElementById('ucl-bar-chart');

  const parsed = data.map(d => ({
    team: d.Team, matches: +d['M.'], wins: +d.W, draws: +d.D, losses: +d.L, points: +d['Pt.'],
  })).filter(d => d.team && !isNaN(d.wins));

  const sorted = [...parsed].sort((a, b) => {
    const k = sortKey === 'W' ? 'wins' : sortKey === 'M.' ? 'matches' : 'points';
    return b[k] - a[k];
  }).slice(0, topN);

  const chartData = [...sorted].reverse();
  const valKey    = sortKey === 'W' ? 'wins' : sortKey === 'M.' ? 'matches' : 'points';

  const margin    = { top: 10, right: 80, bottom: 40, left: 160 };
  const barHeight = 42;
  const height    = chartData.length * barHeight;
  const width     = Math.min(container.offsetWidth || 900, 1000) - margin.left - margin.right;
  const t         = d3.transition().duration(600).ease(d3.easeCubicInOut);

  // Create SVG structure once
  if (!uclBarG) {
    const svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    uclBarG = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    uclBarG.append('g').attr('class', 'grid');
    uclBarG.append('g').attr('class', 'axis y-axis');
    uclBarG.append('g').attr('class', 'axis x-axis');
    uclBarG.append('g').attr('class', 'bars-group');
    uclBarG.append('g').attr('class', 'labels-group');
  }

  // Resize SVG when number of visible bars changes
  d3.select(container).select('svg')
    .transition(t).attr('height', height + margin.top + margin.bottom);

  const x = d3.scaleLinear().domain([0, d3.max(chartData, d => d[valKey]) * 1.1]).range([0, width]);
  const y = d3.scaleBand().domain(chartData.map(d => d.team)).range([0, height]).padding(.22);

  uclBarG.select('.grid').attr('transform', `translate(0,${height})`)
    .transition(t).call(d3.axisBottom(x).tickSize(-height).tickFormat('').ticks(6));
  uclBarG.select('.y-axis').transition(t).call(d3.axisLeft(y));
  uclBarG.select('.x-axis').attr('transform', `translate(0,${height})`)
    .transition(t).call(d3.axisBottom(x).ticks(6));

  const tooltip  = document.getElementById('tooltip-ucl-bar');

  const barColor = d => {
    if (uclBarHighlight && uclBarHighlight.size > 0) {
      return uclBarHighlight.has(d.team) ? '#f0b429' : '#161928';
    }
    if (d.team === 'FC Barcelona') return '#004d98';
    if (d.team === 'Real Madrid')  return '#f0b429';
    return '#2a3050';
  };

  // Bars: Enter/Update/Exit keyed by team name
  uclBarG.select('.bars-group').selectAll('rect.bar')
    .data(chartData, d => d.team)
    .join(
      enter => enter.append('rect').attr('class', 'bar')
        .attr('x', 0).attr('y', d => y(d.team))
        .attr('width', 0).attr('height', y.bandwidth())
        .attr('fill', barColor).attr('rx', 4).style('cursor', 'pointer'),
      update => update,
      exit   => exit.transition(t).attr('width', 0).attr('opacity', 0).remove()
    )
    .transition(t)
    .attr('y', d => y(d.team)).attr('width', d => x(d[valKey]))
    .attr('height', y.bandwidth()).attr('fill', barColor);

  uclBarG.select('.bars-group').selectAll('rect.bar')
    .on('mousemove', (event, d) => {
      tooltip.innerHTML = `<strong>${d.team}</strong>Wins: ${d.wins}<br>Matches: ${d.matches}<br>Points: ${d.points}`;
      tooltip.classList.add('show');
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top  = (event.clientY - 28) + 'px';
    })
    .on('mouseleave', () => tooltip.classList.remove('show'));

  // Value labels: Enter/Update/Exit
  uclBarG.select('.labels-group').selectAll('text.bar-label')
    .data(chartData, d => d.team)
    .join(
      enter => enter.append('text').attr('class', 'bar-label')
        .attr('fill', '#e8eaf2').attr('font-size', '13px')
        .attr('font-family', 'DM Sans, sans-serif').attr('opacity', 0),
      update => update,
      exit   => exit.transition(t).attr('opacity', 0).remove()
    )
    .transition(t)
    .attr('x', d => x(d[valKey]) + 6)
    .attr('y', d => y(d.team) + y.bandwidth() / 2 + 4)
    .attr('opacity', 1)
    .text(d => d[valKey]);
}

// Called by ucl-map.js when a country is clicked
window.highlightUCLBarCountry = function(clubSet) {
  uclBarHighlight = clubSet;
  if (window.uclBarData) {
    drawUCLBar(
      window.uclBarData,
      +document.getElementById('top-n-filter').value,
      document.getElementById('sort-filter').value
    );
  }
};

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
