function generateAlerts(prices, rules) {
  const alerts = [];

  for (const rule of rules) {
    const history = prices.filter(price => price.instrument === rule.instrument);

    for (let i = 1; i < history.length; i++) {
      const previous = history[i - 1].close;
      const current = history[i].close;
      let triggered = false;
      let message = "";

      if (rule.type === "level") {
        triggered = rule.direction === "above"
          ? previous <= rule.level && current > rule.level
          : previous >= rule.level && current < rule.level;
        message = `level ${rule.direction} ${rule.level}`;
      } else {
        const change = current - previous;
        triggered = rule.direction === "up"
          ? change >= rule.amount
          : change <= -rule.amount;
        message = `change ${rule.direction} ${rule.amount}`;
      }

      if (triggered) {
        alerts.push({
          date: history[i].date,
          ruleId: rule.id,
          instrument: rule.instrument,
          message
        });
      }
    }
  }

  return alerts.sort((a, b) =>
    a.date.localeCompare(b.date) || a.ruleId.localeCompare(b.ruleId)
  );
}

function formatAlerts(alerts) {
  return alerts.map(alert =>
    `${alert.date} ${alert.ruleId} ${alert.instrument} ${alert.message}`
  );
}

module.exports = { generateAlerts, formatAlerts };
