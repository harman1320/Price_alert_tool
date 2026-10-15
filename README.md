# Wissen Price Alert Tool

A Node.js command-line program that reads daily closing prices from a CSV file, reads alert rules from a JSON file, and prints only the alerts that fire.

## Requirements

- Node.js 18 or newer
- No third-party packages are required

## Run

From this directory:

```bash
node src/cli.js prices.csv rules.json
```

You can also provide other file paths:

```bash
node src/cli.js ./data/prices.csv ./config/rules.json
```

If no rule fires, the program prints nothing. Errors are written to stderr and the process exits with a non-zero status.

## Run tests

```bash
node --test
```

## Input format

Prices CSV must include these columns:

```csv
date,instrument,close
2026-09-01,INFY,1520.50
2026-09-02,INFY,1498.00
```

Rules JSON is an array. Supported rules:

### Level

```json
{
  "id": "r1",
  "instrument": "INFY",
  "type": "level",
  "direction": "below",
  "level": 1500
}
```

A `below` alert fires when the previous close is greater than or equal to the level and the current close is below it. An `above` alert fires when the previous close is less than or equal to the level and the current close is above it. The first price for an instrument cannot trigger a level crossing because it has no previous close.

### Moving-average crossover

```json
{
  "id": "r2",
  "instrument": "TCS",
  "type": "ma_cross",
  "short": 5,
  "long": 20,
  "direction": "above"
}
```

The short window must be smaller than the long window. `above` fires when the short moving average crosses from less than or equal to the long moving average to strictly greater than it. `below` uses the inverse condition. All moving averages use closing prices for the same instrument, and a full window must be available. A crossover is evaluated only when both averages exist on both the previous and current observations.

## Output

Each alert is printed on one line:

```text
YYYY-MM-DD RULE_ID INSTRUMENT DESCRIPTION
```

Alerts are sorted by date and then rule ID. For level alerts the description is `level below 1500` or `level above 1500`; for moving-average alerts it is `ma_cross 5/20 above` or `ma_cross 5/20 below`.

## Design decisions and limitations

- Prices are sorted chronologically before evaluation, so input rows can be out of order.
- Duplicate `(instrument, date)` rows are rejected because they make a daily closing price ambiguous.
- Invalid dates, non-numeric prices, invalid JSON, unsupported rule types, and invalid rule parameters produce a clear error.
- Trading-day observations mean rows present for an instrument. The program does not invent prices for missing dates.
- The program does not fetch live prices; it processes only the supplied files.
- Rule IDs are sorted lexicographically, matching ordinary string ordering.

## AI assistance and verification

AI assistance may be used during development, but all generated logic should be reviewed and tested. The tests in `test/alerts.test.js` cover level crossings, date sorting, CSV parsing, moving-average windows, rule validation, and crossover behaviour.
