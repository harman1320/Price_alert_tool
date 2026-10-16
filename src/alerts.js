const { movingAverage } = require("./movingAverage");

function generateAlerts(prices, rules) {
  const alerts = [];

  const grouped = {};
  for (const price of prices) {
    if (!grouped[price.instrument]) grouped[price.instrument] = [];
    grouped[price.instrument].push(price);
  }
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }

  for (const rule of rules) {
    const list = grouped[rule.instrument] || [];

    if (rule.type === "level") {
      for (let i = 1; i < list.length; i++) {
        const previous = list[i - 1].close;
        const current = list[i].close;
        const crossed = rule.direction === "above"
          ? previous <= rule.level && current > rule.level
          : previous >= rule.level && current < rule.level;

        if (crossed) {
          alerts.push({
            date: list[i].date,
            ruleId: rule.id,
            instrument: rule.instrument,
            message: `level ${rule.direction} ${rule.level}`
          });
        }
      }
    }

    if (rule.type === "ma_cross") {
      const closes = [];
      let previousShort = null;
      let previousLong = null;

      for (const price of list) {
        closes.push(price.close);
        const shortAverage = movingAverage(closes, rule.short);
        const longAverage = movingAverage(closes, rule.long);

        if (previousShort !== null && previousLong !== null &&
            shortAverage !== null && longAverage !== null) {
          const crossed = rule.direction === "above"
            ? previousShort <= previousLong && shortAverage > longAverage
            : previousShort >= previousLong && shortAverage < longAverage;

          if (crossed) {
            alerts.push({
              date: price.date,
              ruleId: rule.id,
              instrument: rule.instrument,
              message: `ma_cross ${rule.short}/${rule.long} ${rule.direction}`
            });
          }
        }

        previousShort = shortAverage;
        previousLong = longAverage;
      }
    }
  }

  alerts.sort((a, b) =>
    a.date.localeCompare(b.date) || a.ruleId.localeCompare(b.ruleId)
  );
  return alerts;
}

function formatAlerts(alerts) {
  return alerts.map(alert =>
    `${alert.date} ${alert.ruleId} ${alert.instrument} ${alert.message}`
  );
}

module.exports = { generateAlerts, formatAlerts };
