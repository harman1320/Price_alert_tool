# Wissen Price Alert Tool

A small Node.js CLI that reads daily closing prices from CSV and alert rules from JSON. It uses no third-party packages.

## Run

```bash
node src/cli.js prices.csv rules.json
node --test
```

## CSV format

The CSV must have `date`, `instrument`, and `close` columns. Use one row per instrument per date. This simple parser expects ordinary comma-separated values without commas inside quoted fields.

## Rules

Level crossing:

```json
{"id":"r1","instrument":"INFY","type":"level","direction":"below","level":1500}
```

Daily price change:

```json
{"id":"r2","instrument":"TCS","type":"change","direction":"down","amount":15}
```

A `level` alert triggers when a price crosses its level between two consecutive records. A `change` alert triggers when the price rises or falls by at least `amount` compared with the previous available price for that instrument.

Alerts are sorted by date and rule ID. The tool validates dates, prices, rule settings, and duplicate instrument/date records. It only uses the supplied CSV; it does not fetch live prices.
