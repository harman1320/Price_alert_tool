function parseRules(text) {
  let rules;
  try {
    rules = JSON.parse(text);
  } catch {
    throw new Error("Rules file is not valid JSON.");
  }

  if (!Array.isArray(rules)) throw new Error("Rules must be a JSON array.");
  const ids = new Set();

  for (const rule of rules) {
    if (!rule.id || !rule.instrument || ids.has(rule.id)) {
      throw new Error("Every rule needs a unique id and an instrument.");
    }
    ids.add(rule.id);

    if (rule.type === "level") {
      if (!Number.isFinite(rule.level) || !["above", "below"].includes(rule.direction)) {
        throw new Error(`Invalid level rule: ${rule.id}.`);
      }
    } else if (rule.type === "change") {
      if (!Number.isFinite(rule.amount) || rule.amount < 0 ||
          !["up", "down"].includes(rule.direction)) {
        throw new Error(`Invalid change rule: ${rule.id}.`);
      }
    } else {
      throw new Error(`Unknown rule type: ${rule.type}.`);
    }
  }

  return rules;
}

module.exports = { parseRules };
