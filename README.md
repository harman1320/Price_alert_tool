# Wissen Price Alert Tool

A small Node.js command-line tool that reads closing prices from CSV and alert rules from JSON. It prints only alerts that trigger. It uses no third-party packages.

## Run

Requires Node.js 18 or newer.

```bash
node src/cli.js prices.csv rules.json
```

Run the automated tests:

```bash
node --test
```

## Input

`prices.csv` must contain `date`, `instrument`, and `close` columns:

```csv
date,instrument,close
2026-09-01,INFY,1520.50
2026-09-02,INFY,1498.00
```

`rules.json` must be an array. Example level rule:

```json
{"id":"r1","instrument":"INFY","type":"level","direction":"below","level":1500}
```

Example moving-average rule:

```json
{"id":"r2","instrument":"TCS","type":"ma_cross","short":5,"long":20,"direction":"above"}
```

For a level rule, `above` triggers when the price moves from at-or-below the level to above it. `below` works in the opposite direction. For `ma_cross`, the short window must be smaller than the long window; a crossover is checked only after both averages have full windows on two consecutive observations.

## Output and checks

Each alert is printed as `DATE RULE_ID INSTRUMENT DESCRIPTION`. Alerts are sorted by date and then rule ID. If no alert triggers, nothing is printed. Errors go to stderr and return a non-zero exit code.

The program sorts dates, rejects duplicate instrument/date records, validates dates and closing prices, and validates rule settings. It uses only rows in the supplied CSV; it does not fetch live prices or fill missing dates.
