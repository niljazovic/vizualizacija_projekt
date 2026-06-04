# European Elite — Data Visualization

**VP Project 2026 · FERIT Osijek**  
Interactive D3.js visualization of FC Barcelona (La Liga) and the UEFA Champions League.

## Visualizations

| # | Chart | Description |
|---|-------|-------------|
| 1 | Line chart | Barcelona results / goals per season (2016–2025) |
| 2 | Grouped bar | Home vs Away win % per season |
| 3 | Horizontal bar | Top UCL clubs by wins / matches / points |
| 4 | Timeline | Every UCL final 1955–2023, animated play/stop |
| 5 | Bubble chart | Multidimensional — shots on target, goals, win rate per season |
| 6 | Europe map | UCL wins by country, click for club details — linked to timeline & bar chart |

## Advanced features

- D3 Enter / Update / Exit pattern with transitions throughout
- Play / Stop animation on the UCL timeline
- Linked interactivity: map click updates the timeline filter and highlights clubs in the bar chart
- Multidimensional view (4 variables in one chart)
- Sort controls on the UCL bar chart

## Stack

D3.js v7 · TopoJSON · HTML5 / CSS3 / Vanilla JS · Google Fonts

## Data

- `barcelona_laliga.csv` — La Liga match results 2016–2025 (football-data.co.uk)
- `UCL_AllTime_Performance_Table.csv` — all-time UCL club stats (Kaggle)
- `UCL_Finals_1955-2023.csv` — every UCL final 1955–2023 (Kaggle)

## Run

```bash
python3 -m http.server 3000
```

Open **http://localhost:3000**
