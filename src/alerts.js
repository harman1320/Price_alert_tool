const { movingAverage } = require("./movingAverage");

function crossedBelow(previousValue, currentValue, level) {
  return previousValue >= level && currentValue < level;
}

function crossedAbove(previousValue, currentValue, level) {
  return previousValue <= level && currentValue > level;
}

function didCross(previousValue, currentValue, direction) {
  return direction === "above"
    ? crossedAbove(previousValue, currentValue, 0)
    : crossedBelow(previousValue, currentValue, 0);
}

// Generate alerts in chronological order. A crossing needs both a previous
// observation and a current observation; the first available price cannot fire.
function generateAlerts(prices, rules) {
  const pricesByInstrument = new Map();

  for (const price of prices) {
    if (!pricesByInstrument.has(price.instrument)) {
      pricesByInstrument.set(price.instrument, []);
    }
    pricesByInstrument.get(price.instrument).push(price);
  }

  const alerts = [];

  for (const rule of rules) {
    const instrumentPrices = pricesByInstrument.get(rule.instrument) || [];

    if (rule.type === "level") {
      for (let i = 1; i < instrumentPrices.length; i += 1) {
        const previous = instrumentPrices[i - 1];
        const current = instrumentPrices[i];

        const fired =
          rule.direction === "below"
            ? crossedBelow(previous.close, current.close, rule.level)
            : crossedAbove(previous.close, current.close, rule.level);

        if (fired) {
          alerts.push({
            date: current.date,
            ruleId: rule.id,
            instrument: rule.instrument,
            message: `level ${rule.direction} ${formatNumber(rule.level)}`
          });
        }
      }
    } else if (rule.type === "ma_cross") {
      const closes = [];
      const shortAverages = [];
      const longAverages = [];

      for (const price of instrumentPrices) {
        closes.push(price.close);
        shortAverages.push(movingAverage(closes, rule.short));
        longAverages.push(movingAverage(closes, rule.long));
      }

      for (let i = 1; i < instrumentPrices.length; i += 1) {
        const previousShort = shortAverages[i - 1];
        const previousLong = longAverages[i - 1];
        const currentShort = shortAverages[i];
        const currentLong = longAverages[i];

        // No crossover is evaluated until both averages exist on both days.
        if (
          previousShort === null ||
          previousLong === null ||
          currentShort === null ||
          currentLong === null
        ) {
          continue;
        }

        const fired =
          rule.direction === "above"
            ? previousShort <= previousLong && currentShort > currentLong
            : previousShort >= previousLong && currentShort < currentLong;

        if (fired) {
          alerts.push({
            date: instrumentPrices[i].date,
            ruleId: rule.id,
            instrument: rule.instrument,
            message: `ma_cross ${rule.short}/${rule.long} ${rule.direction}`
          });
        }
      }
    }
  }

  alerts.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.ruleId.localeCompare(b.ruleId)
  );

  return alerts;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function formatAlerts(alerts) {
  return alerts.map(
    (alert) => `${alert.date} ${alert.ruleId} ${alert.instrument} ${alert.message}`
  );
}

module.exports = {
  crossedBelow,
  crossedAbove,
  generateAlerts,
  formatAlerts
};
