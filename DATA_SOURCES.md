# Data Sources

This project combines three dataset families supplied for the 1896–2026 upgrade.

## 1. Historical Olympic archive

Bundled files:
- `Olympic_Athlete_Bio.csv`
- `Olympic_Athlete_Event_Results.csv`
- `Olympic_Games_Medal_Tally.csv`
- `Olympics_Games.csv`
- `Olympics_Country.csv`

Coverage used by the dashboard: historical Olympic editions through 2022.

## 2. Paris 2024

Bundled files:
- `athletes.csv`
- `medallists.csv`
- `events.csv`
- `schedules.csv`
- `medals_total.csv`

Coverage: Paris 2024 Summer Olympics.

## 3. Milano Cortina 2026

Bundled files:
- `athletes.csv`
- `medallists.csv`
- `medals.csv`
- `schedules.csv`

Coverage: Milano Cortina 2026 Winter Olympics.

## Normalization

The build pipeline normalizes:
- country names and NOC codes
- Summer/Winter season
- edition year
- medal labels
- athlete identifiers
- sport/event fields
- gender labels
- age where birth information exists

The generated files under `data/` and `data.js` are derived artifacts and are what the browser dashboard consumes.
