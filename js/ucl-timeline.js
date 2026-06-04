// UCL Finals Timeline with play/stop animation

const COUNTRY_COLORS = {
  'Spain':        '#c60b1e',
  'England':      '#012169',
  'Italy':        '#009246',
  'Germany':      '#ffcc00',
  'West Germany': '#ffcc00',
  'Portugal':     '#006600',
  'Netherlands':  '#ff6600',
  'Romania':      '#002B7F',
  'Yugoslavia':   '#003DA5',
  'France':       '#002395',
  'Scotland':     '#003087',
};
function countryColor(c) { return COUNTRY_COLORS[c] || '#555a7a'; }
function normalizeCountry(c) { return c === 'West Germany' ? 'Germany' : c; }

let timelineG         = null;
let timelineX         = null;
let timelineHalfH     = null;
let timelineAnimation = null;

function initTimeline(container, width, height, margin) {
  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  g.append('g').attr('class', 'axis tl-axis').attr('transform', `translate(0,${height + 5})`);
  g.append('line').attr('class', 'tl-center')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', height / 2).attr('y2', height / 2)
    .attr('stroke', '#232840').attr('stroke-width', 1.5);
  g.append('g').attr('class', 'stems-group');
  g.append('g').attr('class', 'circles-group');
  g.append('g').attr('class', 'initials-group');
  return g;
}

function updateTimeline(displayData, allData) {
  const container = document.getElementById('ucl-timeline');
  const allYears  = allData
    .map(d => +d.Season.split('–')[0].split('/')[0])
    .filter(y => !isNaN(y));

  const margin     = { top: 20, right: 20, bottom: 30, left: 20 };
  const totalWidth = container.offsetWidth || 900;
  const width      = totalWidth - margin.left - margin.right;
  const height     = 420 - margin.top - margin.bottom;
  const cy         = height / 2;
  // Shorter duration during animation so transitions finish before next frame arrives (180ms interval)
  const t = d3.transition().duration(timelineAnimation ? 140 : 400).ease(d3.easeCubicOut);

  if (!timelineG) {
    timelineG     = initTimeline(container, width, height, margin);
    timelineX     = d3.scaleLinear()
      .domain([d3.min(allYears) - 1, d3.max(allYears) + 1])
      .range([0, width]);
    timelineHalfH = cy;

    timelineG.select('.tl-axis')
      .call(d3.axisBottom(timelineX)
        .tickValues(d3.range(1955, 2025, 5))
        .tickFormat(d => d).tickSize(4))
      .selectAll('text')
      .style('fill', '#9ba3c0').style('font-size', '10px')
      .style('font-family', 'DM Sans, sans-serif');
    timelineG.select('.domain').style('stroke', '#232840');
  }

  // Deduplicate by Season - the 1973-74 final had a replay (two CSV rows, same Season key).
  // Without deduplication the play animation re-triggers the enter transition on the same circle.
  const seen = new Set();
  const processed = displayData
    .map(d => ({ ...d, year: +d.Season.split('–')[0].split('/')[0] }))
    .filter(d => !isNaN(d.year))
    .filter(d => { if (seen.has(d.Season)) return false; seen.add(d.Season); return true; })
    .map((d, i) => ({ ...d, _above: i % 2 === 0 })); // stable above/below flag based on data order

  const tooltip = document.getElementById('tooltip-timeline');

  // Stems: Enter/Update/Exit
  timelineG.select('.stems-group').selectAll('line.stem')
    .data(processed, d => d.Season)
    .join(
      enter => enter.append('line').attr('class', 'stem')
        .attr('x1', d => timelineX(d.year)).attr('x2', d => timelineX(d.year))
        .attr('y1', cy).attr('y2', cy)
        .attr('stroke', d => countryColor(d.Country)).attr('stroke-width', 1.5).attr('opacity', 0),
      update => update,
      exit   => exit.transition(t).attr('opacity', 0).remove()
    )
    .transition(t)
    .attr('x1', d => timelineX(d.year)).attr('x2', d => timelineX(d.year))
    .attr('y2', d => d._above ? cy - 44 : cy + 44)
    .attr('opacity', .7);

  // Circles: Enter/Update/Exit
  timelineG.select('.circles-group').selectAll('circle.final')
    .data(processed, d => d.Season)
    .join(
      enter => enter.append('circle').attr('class', 'final')
        .attr('cx', d => timelineX(d.year))
        .attr('cy', d => d._above ? cy - 82 : cy + 82)
        .attr('r', 0)
        .attr('fill', d => countryColor(d.Country))
        .attr('stroke', '#0a0c10').attr('stroke-width', 2).style('cursor', 'pointer'),
      update => update,
      exit   => exit.transition(t).attr('r', 0).attr('opacity', 0).remove()
    )
    .transition(t)
    .attr('cx', d => timelineX(d.year))
    .attr('cy', d => d._above ? cy - 82 : cy + 82)
    .attr('r', 18);

  // Invisible larger hit targets for easier hovering
  timelineG.select('.circles-group').selectAll('circle.hit-target')
    .data(processed, d => d.Season)
    .join(
      enter => enter.append('circle').attr('class', 'hit-target')
        .attr('fill', 'transparent').attr('stroke', 'none').style('cursor', 'pointer'),
      update => update,
      exit   => exit.remove()
    )
    .attr('cx', d => timelineX(d.year))
    .attr('cy', d => d._above ? cy - 82 : cy + 82)
    .attr('r', 28)
    .on('mousemove', (event, d) => {
      tooltip.innerHTML = `<strong>${d.Season}</strong>${d.Winners}<br>vs ${d['Runners-up']}<br>Score: ${d.Score}<br>Country: ${normalizeCountry(d.Country)}`;
      tooltip.classList.add('show');
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top  = (event.clientY - 28) + 'px';
    })
    .on('mouseleave', () => tooltip.classList.remove('show'));

  // Also keep events on the visible circles
  timelineG.select('.circles-group').selectAll('circle.final')
    .on('mousemove', (event, d) => {
      tooltip.innerHTML = `<strong>${d.Season}</strong>${d.Winners}<br>vs ${d['Runners-up']}<br>Score: ${d.Score}<br>Country: ${normalizeCountry(d.Country)}`;
      tooltip.classList.add('show');
      tooltip.style.left = (event.clientX + 14) + 'px';
      tooltip.style.top  = (event.clientY - 28) + 'px';
    })
    .on('mouseleave', () => tooltip.classList.remove('show'));

  // Initials: Enter/Update/Exit
  timelineG.select('.initials-group').selectAll('text.initials')
    .data(processed, d => d.Season)
    .join(
      enter => enter.append('text').attr('class', 'initials')
        .attr('text-anchor', 'middle').attr('fill', '#fff')
        .attr('font-size', '10px').attr('font-weight', '700')
        .attr('font-family', 'DM Sans, sans-serif').attr('opacity', 0),
      update => update,
      exit   => exit.transition(t).attr('opacity', 0).remove()
    )
    .transition(t)
    .attr('x', d => timelineX(d.year))
    .attr('y', d => (d._above ? cy - 82 : cy + 82) + 4)
    .attr('opacity', 1)
    .text(d => d.Winners.split(' ').map(w => w[0]).join('').slice(0, 3));

  // Legend: Enter/Update/Exit on country keys
  let legendDiv = d3.select(container).select('.timeline-legend');
  if (legendDiv.empty()) {
    legendDiv = d3.select(container).append('div')
      .attr('class', 'legend timeline-legend')
      .style('margin-top', '1rem').style('padding-left', '.5rem');
  }
  const countries = [...new Set(processed.map(d => normalizeCountry(d.Country)))];
  legendDiv.selectAll('.legend-item')
    .data(countries, c => c)
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
    .each(function(c) {
      d3.select(this).select('.legend-dot').style('background', countryColor(c));
      d3.select(this).select('span').text(c);
    });
}

// Play / Stop animation

function stopTimelineAnimation() {
  clearInterval(timelineAnimation);
  timelineAnimation = null;
  const btn = document.getElementById('timeline-play-btn');
  if (btn) { btn.textContent = '▶ Play'; btn.classList.remove('playing'); }
  // Final clean render so any circles stuck mid-transition are restored correctly
  if (window.uclFinalsData) {
    const country  = document.getElementById('country-filter')?.value || 'all';
    const filtered = country === 'all'
      ? window.uclFinalsData
      : window.uclFinalsData.filter(d => normalizeCountry(d.Country) === country);
    updateTimeline(filtered, window.uclFinalsData);
  }
}

function playTimelineAnimation(allData, filteredData) {
  let idx = 0;
  const sorted = [...filteredData].sort((a, b) =>
    (+a.Season.split('–')[0].split('/')[0]) - (+b.Season.split('–')[0].split('/')[0])
  );
  timelineAnimation = setInterval(() => {
    if (idx > sorted.length) { stopTimelineAnimation(); return; }
    updateTimeline(sorted.slice(0, idx), allData);
    idx++;
  }, 180);
}

d3.csv('data/UCL_Finals_1955-2023.csv').then(data => {
  window.uclFinalsData = data;
  updateTimeline(data, data);

  document.getElementById('country-filter').addEventListener('change', function() {
    stopTimelineAnimation();
    const norm     = this.value;
    const filtered = norm === 'all'
      ? data
      : data.filter(d => normalizeCountry(d.Country) === norm);
    updateTimeline(filtered, data);
    if (window.syncMapToCountry) window.syncMapToCountry(norm);
  });

  document.getElementById('timeline-play-btn').addEventListener('click', function() {
    if (timelineAnimation) {
      stopTimelineAnimation();
    } else {
      this.textContent = '⏹ Stop';
      this.classList.add('playing');
      const norm     = document.getElementById('country-filter').value;
      const filtered = norm === 'all'
        ? data
        : data.filter(d => normalizeCountry(d.Country) === norm);
      playTimelineAnimation(data, filtered);
    }
  });
});
