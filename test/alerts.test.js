const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCsv, sortAndValidatePrices } = require("../src/csvParser");
const { parseAndValidateRules } = require("../src/rules");
const { generateAlerts, formatAlerts } = require("../src/alerts");
const { movingAverage } = require("../src/movingAverage");

test("parses quoted CSV fields", () => {
  const rows = parseCsv('date,instrument,close\n2026-09-01,"INFY, INC",1520.5\n');
  assert.equal(rows[0].instrument, "INFY, INC");
  assert.equal(rows[0].close, 1520.5);
});

test("rejects invalid dates, prices and duplicate daily prices", () => {
  assert.throws(() => parseCsv("date,instrument,close\n2026-02-31,INFY,10"), error => error.message.includes("invalid date"));
  assert.throws(() => parseCsv("date,instrument,close\n2026-09-01,INFY,-1"), error => error.message.includes("invalid closing price"));
  const row = { date: "2026-09-01", instrument: "INFY", close: 10 };
  assert.throws(() => sortAndValidatePrices([row, row]), error => error.message.includes("Duplicate price"));
});

test("sorts dates before evaluating rules", () => {
  const prices = sortAndValidatePrices([
    { date: "2026-09-02", instrument: "INFY", close: 1490 },
    { date: "2026-09-01", instrument: "INFY", close: 1510 }
  ]);
  assert.deepEqual(prices.map(p => p.date), ["2026-09-01", "2026-09-02"]);
});

test("detects a level crossing only once", () => {
  const prices = [
    { date: "2026-09-01", instrument: "INFY", close: 1510 },
    { date: "2026-09-02", instrument: "INFY", close: 1490 },
    { date: "2026-09-03", instrument: "INFY", close: 1480 }
  ];
  const rules = [{ id: "r1", instrument: "INFY", type: "level", direction: "below", level: 1500 }];
  assert.deepEqual(formatAlerts(generateAlerts(prices, rules)), [
    "2026-09-02 r1 INFY level below 1500"
  ]);
});

test("moving average needs a full window", () => {
  assert.equal(movingAverage([10, 20], 3), null);
  assert.equal(movingAverage([10, 20, 30], 3), 20);
});

test("detects a moving-average crossover after full windows exist", () => {
  const prices = [10, 9, 8, 15, 16].map((close, i) => ({
    date: `2026-09-0${i + 1}`, instrument: "TCS", close
  }));
  const rules = [{ id: "r2", instrument: "TCS", type: "ma_cross", short: 2, long: 3, direction: "above" }];
  assert.deepEqual(formatAlerts(generateAlerts(prices, rules)), [
    "2026-09-04 r2 TCS ma_cross 2/3 above"
  ]);
});

test("sorts alerts by date then rule id", () => {
  const prices = ["TCS", "INFY"].flatMap(instrument => [
    { date: "2026-09-01", instrument, close: 1510 },
    { date: "2026-09-02", instrument, close: 1490 }
  ]);
  const rules = ["r2", "r1"].map((id, i) => ({
    id, instrument: i === 0 ? "TCS" : "INFY", type: "level", direction: "below", level: 1500
  }));
  assert.deepEqual(formatAlerts(generateAlerts(prices, rules)), [
    "2026-09-02 r1 INFY level below 1500",
    "2026-09-02 r2 TCS level below 1500"
  ]);
});

test("rejects invalid rules", () => {
  assert.throws(() => parseAndValidateRules("not json"), error => error.message.includes("not valid JSON"));
  assert.throws(() => parseAndValidateRules('[{"id":"x","instrument":"TCS","type":"ma_cross","direction":"above","short":20,"long":5}]'), error => error.message.includes("short smaller than long"));
});
