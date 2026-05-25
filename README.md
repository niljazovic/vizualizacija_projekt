# Europska Elita — Vizualizacija Podataka

Projektni zadatak iz predmeta **Vizualizacija Podataka**  
FERIT Osijek, 2025.

## Opis projekta

Interaktivna D3.js web vizualizacija koja prikazuje:

1. **FC Barcelona — Uspješnost po sezoni** (line chart): trend pobjeda, poraza i golova u La Ligi od 2016. do 2025.
2. **FC Barcelona — Domaći vs. Gostujući** (grouped bar chart): postotak pobjeda ovisno o terenu igre
3. **UCL — Dominacija klubova** (horizontal bar chart): top klubovi prema pobjedama/utakmicama/bodovima
4. **UCL — Pobjednici finala 1955–2023** (timeline): kronološki prikaz svakog finalnog dvoboja

## Tehnologije

- D3.js v7
- HTML5 / CSS3 / JavaScript (Vanilla)
- Google Fonts (Bebas Neue, DM Sans)

## Dataseti

- `barcelona_laliga.csv` — stvarni La Liga rezultati Barcelone 2016–2025 (football-data.co.uk)
- `UCL_AllTime_Performance_Table.csv` — sve-vremenska UCL tablica klubova (Kaggle)
- `UCL_Finals_1955-2023.csv` — sva UCL finala od 1955. do 2023. (Kaggle)

## Pokretanje

```bash
# Python 3
python -m http.server 8080
```

Zatim otvori `http://localhost:8080` u pregledniku.

## Struktura projekta

```
vizualizacija_projekt/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── barca-line.js
│   ├── barca-grouped.js
│   ├── ucl-bar.js
│   └── ucl-timeline.js
└── data/
    ├── barcelona_laliga.csv
    ├── UCL_AllTime_Performance_Table.csv
    └── UCL_Finals_1955-2023.csv
```
