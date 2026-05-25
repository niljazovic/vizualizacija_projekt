// ── UCL Timeline: Pobjednici finala 1955–2023 ─────────────────

const COUNTRY_COLORS = {
  'Spain': '#c60b1e', 'England': '#012169', 'Italy': '#009246',
  'Germany': '#ffcc00', 'Portugal': '#006600', 'Netherlands': '#ff6600',
  'Romania': '#002B7F', 'Yugoslavia': '#003DA5', 'France': '#002395', 'Scotland': '#003087',
};
function countryColor(c) { return COUNTRY_COLORS[c] || '#555a7a'; }

function drawUCLTimeline(data, countryFilter) {
  const container = document.getElementById('ucl-timeline');
  container.innerHTML = '';

  let filtered = (countryFilter === 'all' ? data : data.filter(d => d.Country === countryFilter))
    .map(d => ({ ...d, year: +d.Season.split('–')[0].split('/')[0] }))
    .filter(d => !isNaN(d.year));

  const allYears = data.map(d => +d.Season.split('–')[0]).filter(y => !isNaN(y));
  const margin = { top: 20, right: 20, bottom: 30, left: 20 };
  const totalWidth = Math.max(container.offsetWidth || 900, 700);
  const width  = totalWidth - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg')
    .attr('width', totalWidth).attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([d3.min(allYears) - 1, d3.max(allYears) + 1]).range([0, width]);
  const cy = height / 2;

  svg.append('g').attr('transform', `translate(0,${height + 5})`)
    .call(d3.axisBottom(x).tickValues(d3.range(1955, 2025, 5)).tickFormat(d => d).tickSize(4))
    .selectAll('text').style('fill','#6b7394').style('font-size','10px').style('font-family','DM Sans, sans-serif');
  svg.select('.domain').style('stroke','#232840');

  svg.append('line').attr('x1', 0).attr('x2', width).attr('y1', cy).attr('y2', cy)
    .attr('stroke','#232840').attr('stroke-width', 1.5);

  const tooltip = document.getElementById('tooltip-timeline');

  filtered.forEach((d, i) => {
    const cx = x(d.year);
    const above = i % 2 === 0;
    const stemEnd = above ? cy - 28 : cy + 28;
    const circleY = above ? cy - 52 : cy + 52;

    svg.append('line').attr('x1', cx).attr('x2', cx).attr('y1', cy).attr('y2', stemEnd)
      .attr('stroke', countryColor(d.Country)).attr('stroke-width', 1.5).attr('opacity', .7);

    svg.append('circle').attr('cx', cx).attr('cy', circleY).attr('r', 14)
      .attr('fill', countryColor(d.Country)).attr('stroke','#0a0c10').attr('stroke-width', 2)
      .style('cursor','pointer')
      .on('mousemove', (event) => {
        tooltip.innerHTML = `<strong>${d.Season}</strong>${d.Winners}<br>vs ${d['Runners-up']}<br>Rezultat: ${d.Score}<br>Zemlja: ${d.Country}`;
        tooltip.classList.add('show');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', () => tooltip.classList.remove('show'));

    const initials = d.Winners.split(' ').map(w => w[0]).join('').slice(0,3);
    svg.append('text').attr('x', cx).attr('y', circleY + 4).attr('text-anchor','middle')
      .attr('fill','#fff').attr('font-size','8px').attr('font-weight','700')
      .attr('font-family','DM Sans, sans-serif').text(initials);
  });

  const countries = [...new Set(filtered.map(d => d.Country))];
  const legendDiv = d3.select(container).append('div').attr('class','legend').style('margin-top','1rem').style('padding-left','.5rem');
  countries.forEach(c => {
    const item = legendDiv.append('div').attr('class','legend-item');
    item.append('div').attr('class','legend-dot').style('background', countryColor(c));
    item.append('span').text(c);
  });
}

d3.csv('data/UCL_Finals_1955-2023.csv').then(data => {
  window.uclFinalsData = data;
  drawUCLTimeline(data, 'all');
  document.getElementById('country-filter').addEventListener('change', function() {
    drawUCLTimeline(window.uclFinalsData, this.value);
  });
});
