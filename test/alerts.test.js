const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCsv, sortAndValidatePrices } = require("../src/csvParser");
const { parseRules } = require("../src/rules");
const { generateAlerts, formatAlerts } = require("../src/alerts");

test("parses prices and sorts them by date", () => {
  const prices = sortAndValidatePrices(parseCsv(
    "date,instrument,close\n2026-09-02,INFY,1490\n2026-09-01,INFY,1510"
  ));
  assert.deepEqual(prices.map(price => price.date), ["2026-09-01", "2026-09-02"]);
});

test("rejects duplicate instrument and date", () => {
  const price = { date: "2026-09-01", instrument: "INFY", close: 10 };
  assert.throws(() => sortAndValidatePrices([price, { ...price, close: 12 }]));
});

test("detects level and daily-change alerts", () => {
  const prices = [
    { date: "2026-09-01", instrument: "INFY", close: 1510 },
    { date: "2026-09-02", instrument: "INFY", close: 1490 },
    { date: "2026-09-01", instrument: "TCS", close: 100 },
    { date: "2026-09-02", instrument: "TCS", close: 80 }
  ];
  const rules = parseRules(JSON.stringify([
    { id: "r1", instrument: "INFY", type: "level", direction: "below", level: 1500 },
    { id: "r2", instrument: "TCS", type: "change", direction: "down", amount: 15 }
  ]));
  assert.deepEqual(formatAlerts(generateAlerts(prices, rules)), [
    "2026-09-02 r1 INFY level below 1500",
    "2026-09-02 r2 TCS change down 15"
  ]);
});

test("rejects invalid rules", () => {
  assert.throws(() => parseRules("not json"));
});
