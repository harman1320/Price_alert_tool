const test = require("node:test");
const assert = require("node:assert/strict");

const { parseCsv, sortAndValidatePrices } = require("../src/csvParser");
const { parseAndValidateRules } = require("../src/rules");
const {
  crossedBelow,
  crossedAbove,
  generateAlerts,
  formatAlerts
} = require("../src/alerts");
const { movingAverage } = require("../src/movingAverage");

test("detects a downward level crossing", () => {
  assert.equal(crossedBelow(1510, 1490, 1500), true);
});

test("does not fire if price stays below the level", () => {
  assert.equal(crossedBelow(1490, 1480, 1500), false);
});

test("detects an upward level crossing", () => {
  assert.equal(crossedAbove(1490, 1510, 1500), true);
});

test("parses CSV fields and quoted commas", () => {
  const rows = parseCsv(
    'date,instrument,close\n2026-09-01,"INFY, INC",1520.5\n'
  );
  assert.equal(rows[0].close, 1520.5);
  assert.equal(rows[0].instrument, "INFY, INC");
});

test("sorts prices and rejects duplicate instrument/date pairs", () => {
  const prices = [
    { date: "2026-09-02", instrument: "INFY", close: 1490 },
    { date: "2026-09-01", instrument: "INFY", close: 1510 }
  ];
  assert.deepEqual(
    sortAndValidatePrices(prices).map((price) => price.date),
    ["2026-09-01", "2026-09-02"]
  );

  assert.throws(
    () => sortAndValidatePrices([...prices, prices[0]]),
    /Duplicate price/
  );
});

test("calculates moving average and requires a full window", () => {
  assert.equal(movingAverage([100, 110, 120], 3), 110);
  assert.equal(movingAverage([100, 110], 3), null);
});

test("level rule fires only on the crossing date", () => {
  const prices = [
    { date: "2026-09-01", instrument: "INFY", close: 1520 },
    { date: "2026-09-02", instrument: "INFY", close: 1490 },
    { date: "2026-09-03", instrument: "INFY", close: 1480 }
  ];
  const rules = [{
    id: "r1",
    instrument: "INFY",
    type: "level",
    direction: "below",
    level: 1500
  }];

  const alerts = generateAlerts(prices, rules);
  assert.deepEqual(formatAlerts(alerts), [
    "2026-09-02 r1 INFY level below 1500"
  ]);
});

test("sorts alerts by date and then rule id", () => {
  const prices = [
    { date: "2026-09-01", instrument: "INFY", close: 1510 },
    { date: "2026-09-02", instrument: "INFY", close: 1490 },
    { date: "2026-09-01", instrument: "TCS", close: 1510 },
    { date: "2026-09-02", instrument: "TCS", close: 1490 }
  ];
  const rules = [
    { id: "r2", instrument: "TCS", type: "level", direction: "below", level: 1500 },
    { id: "r1", instrument: "INFY", type: "level", direction: "below", level: 1500 }
  ];

  assert.deepEqual(
    formatAlerts(generateAlerts(prices, rules)),
    [
      "2026-09-02 r1 INFY level below 1500",
      "2026-09-02 r2 TCS level below 1500"
    ]
  );
});

test("validates moving average rules", () => {
  assert.throws(
    () => parseAndValidateRules('[{"id":"x","instrument":"TCS","type":"ma_cross","direction":"above","short":20,"long":5}]'),
    /short window must be smaller/
  );
});

test("detects moving-average crossover with full windows", () => {
  // short=2, long=3. Short MA is below long MA, then crosses above it.
  const prices = [
    { date: "2026-09-01", instrument: "TCS", close: 10 },
    { date: "2026-09-02", instrument: "TCS", close: 9 },
    { date: "2026-09-03", instrument: "TCS", close: 8 },
    { date: "2026-09-04", instrument: "TCS", close: 15 },
    { date: "2026-09-05", instrument: "TCS", close: 16 }
  ];
  const rules = [{
    id: "r2",
    instrument: "TCS",
    type: "ma_cross",
    short: 2,
    long: 3,
    direction: "above"
  }];

  const alerts = generateAlerts(prices, rules);
  assert.deepEqual(formatAlerts(alerts), [
    "2026-09-04 r2 TCS ma_cross 2/3 above"
  ]);
});
