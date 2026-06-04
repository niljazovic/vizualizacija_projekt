// UCL Europe Map: Country dominance choropleth

const MAP_ISO = {
  'Spain': 724, 'England': 826, 'Scotland': 826,
  'Italy': 380, 'Germany': 276, 'West Germany': 276,
  'Portugal': 620, 'Netherlands': 528, 'France': 250,
  'Romania': 642, 'Yugoslavia': 688,
};

const EUROPE_ISO = new Set([
  8,20,40,56,70,100,112,191,196,203,208,233,246,250,276,300,
  348,352,372,380,428,438,440,442,470,492,498,499,528,578,616,
  620,642,688,703,705,724,752,756,804,807,826,
]);

const ISO_DISPLAY = {
  724: 'Spain', 826: 'United Kingdom', 380: 'Italy', 276: 'Germany',
  620: 'Portugal', 528: 'Netherlands', 250: 'France', 642: 'Romania', 688: 'Serbia',
};

// Map display name - timeline filter value
const DISPLAY_TO_FILTER = {
  'Spain':          'Spain',
  'United Kingdom': 'England',
  'Italy':          'Italy',
  'Germany':        'Germany',
  'Portugal':       'Portugal',
  'Netherlands':    'Netherlands',
  'France':         null,
  'Romania':        null,
  'Serbia':         null,
};

function buildCountryStats(finalsData) {
  const stats = {};
  finalsData.forEach(d => {
    const wc = d.Country;
    const rc = d.RunnerUpCountry;
    if (wc) {
      if (!stats[wc]) stats[wc] = { wins: [], runnerups: [] };
      stats[wc].wins.push({ club: d.Winners, season: d.Season });
    }
    if (rc) {
      if (!stats[rc]) stats[rc] = { wins: [], runnerups: [] };
      stats[rc].runnerups.push({ club: d['Runners-up'], season: d.Season });
    }
  });
  return stats;
}

function showMapPanel(displayName, winsData, runnerupsData) {
  const panel = document.getElementById('map-panel');

  if (!winsData.length && !runnerupsData.length) {
    panel.innerHTML = `<p class="map-panel-hint"><strong>${displayName}</strong> has no UCL final appearances in the data.</p>`;
    return;
  }

  const groupByClub = arr => {
    const m = new Map();
    arr.forEach(({ club, season }) => {
      if (!m.has(club)) m.set(club, []);
      m.get(club).push(season);
    });
    return m;
  };

  const wins      = groupByClub(winsData);
  const runnerups = groupByClub(runnerupsData);

  let html = `<h3>${displayName}</h3>`;

  if (wins.size) {
    html += `<div class="map-panel-section"><h4>&#127942; UCL Champions</h4><ul>`;
    wins.forEach((seasons, club) => {
      html += `<li><strong>${club}</strong><span>${seasons.join(' · ')}</span></li>`;
    });
    html += `</ul></div>`;
  }

  if (runnerups.size) {
    html += `<div class="map-panel-section"><h4>Runners-up</h4><ul>`;
    runnerups.forEach((seasons, club) => {
      html += `<li><strong>${club}</strong><span>${seasons.join(' · ')}</span></li>`;
    });
    html += `</ul></div>`;
  }

  panel.innerHTML = html;
}

function drawUCLMap(finalsData) {
  const container   = document.getElementById('ucl-map');
  const countryStats = buildCountryStats(finalsData);

  // Aggregate win counts per ISO code
  const winsByISO = new Map();
  Object.entries(countryStats).forEach(([country, s]) => {
    const iso = MAP_ISO[country];
    if (iso) winsByISO.set(iso, (winsByISO.get(iso) || 0) + s.wins.length);
  });

  const margin     = { top: 10, right: 10, bottom: 30, left: 10 };
  const totalWidth = Math.min(container.offsetWidth || 680, 680);
  const totalHeight = 400;
  const width       = totalWidth - margin.left - margin.right;
  const height      = totalHeight - margin.top - margin.bottom;

  const projection = d3.geoMercator()
    .center([14, 54])
    .scale(width * 0.78)
    .translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  const maxWins    = d3.max([...winsByISO.values()]) || 1;
  // Scale only covers 1..max - 0-win countries get a distinct flat color below
  const colorScale = d3.scaleSequential()
    .domain([1, maxWins])
    .interpolator(d3.interpolateRgb('#4a80c0', '#f0b429'));

  const svg = d3.select(container).append('svg')
    .attr('width', totalWidth).attr('height', totalHeight);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = document.getElementById('tooltip-map');

  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
    const allFeatures  = topojson.feature(world, world.objects.countries).features;
    const europeFeatures = allFeatures.filter(f => EUROPE_ISO.has(+f.id));

    g.selectAll('path.map-country')
      .data(europeFeatures)
      .join('path')
      .attr('class', 'map-country')
      .attr('d', path)
      .attr('fill', d => {
        const wins = winsByISO.get(+d.id) || 0;
        return wins > 0 ? colorScale(wins) : '#2a3360';
      })
      .attr('stroke', '#4a5280')
      .attr('stroke-width', 1)
      .on('mousemove', (event, d) => {
        const name = ISO_DISPLAY[+d.id];
        if (!name) return;
        const wins = winsByISO.get(+d.id) || 0;
        tooltip.innerHTML = `<strong>${name}</strong>UCL wins: ${wins}`;
        tooltip.classList.add('show');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', () => tooltip.classList.remove('show'))
      .on('click', (event, d) => {
        const iso     = +d.id;
        const display = ISO_DISPLAY[iso];
        if (!display) return;

        // Highlight clicked country
        g.selectAll('path.map-country')
          .classed('active', false).attr('stroke-width', 0.7);
        d3.select(event.currentTarget)
          .classed('active', true).attr('stroke-width', 2);

        // Collect all UCL keys that map to this ISO (e.g. Germany + West Germany both → 276)
        const matchingKeys = Object.keys(MAP_ISO).filter(k => MAP_ISO[k] === iso);
        const allWins      = matchingKeys.flatMap(k => countryStats[k]?.wins      || []);
        const allRunnerups = matchingKeys.flatMap(k => countryStats[k]?.runnerups || []);

        // Show info panel
        showMapPanel(display, allWins, allRunnerups);

        // Sync timeline filter dropdown
        const filterVal = DISPLAY_TO_FILTER[display];
        const sel       = document.getElementById('country-filter');
        if (filterVal && sel) {
          const opts = [...sel.options].map(o => o.value);
          sel.value = opts.includes(filterVal) ? filterVal : 'all';
          sel.dispatchEvent(new Event('change'));
        }

        // Highlight matching clubs in the bar chart
        if (window.highlightUCLBarCountry) {
          const clubs = new Set([
            ...allWins.map(w => w.club),
            ...allRunnerups.map(r => r.club),
          ]);
          window.highlightUCLBarCountry(clubs.size ? clubs : null);
        }
      });

    // Color legend
    const lw = 110, lh = 10;
    const legendG = svg.append('g')
      .attr('transform', `translate(${totalWidth - lw - 16},${totalHeight - 28})`);
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'ucl-map-grad');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#4a80c0');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#f0b429');
    legendG.append('rect').attr('width', lw).attr('height', lh)
      .attr('fill', 'url(#ucl-map-grad)').attr('rx', 3);
    legendG.append('text').attr('y', lh + 13)
      .attr('fill', '#9ba3c0').attr('font-size', '10px').attr('font-family', 'DM Sans,sans-serif')
      .text('1 win');
    legendG.append('text').attr('x', lw).attr('y', lh + 13)
      .attr('fill', '#9ba3c0').attr('font-size', '10px').attr('font-family', 'DM Sans,sans-serif')
      .attr('text-anchor', 'end').text(`${maxWins} wins`);
  });
}

// Called by timeline when filter dropdown changes to "all" - reset map state
window.syncMapToCountry = function(filterValue) {
  if (filterValue === 'all') {
    d3.selectAll('path.map-country').classed('active', false).attr('stroke-width', 0.7);
    const panel = document.getElementById('map-panel');
    if (panel) panel.innerHTML = '<p class="map-panel-hint">Click a country on the map to explore its UCL history.</p>';
    if (window.highlightUCLBarCountry) window.highlightUCLBarCountry(null);
  }
};

function waitForUCLFinalsMap() {
  if (window.uclFinalsData) {
    drawUCLMap(window.uclFinalsData);
  } else {
    setTimeout(waitForUCLFinalsMap, 100);
  }
}
waitForUCLFinalsMap();
