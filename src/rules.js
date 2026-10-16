function parseAndValidateRules(text) {
  let rules;
  try {
    rules = JSON.parse(text);
  } catch {
    throw new Error("Rules file is not valid JSON.");
  }

  if (!Array.isArray(rules)) throw new Error("Rules file must be a JSON array.");

  const ids = new Set();
  for (const [i, rule] of rules.entries()) {
    const label = `Rule ${i + 1}`;
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      throw new Error(`${label} must be an object.`);
    }
    if (typeof rule.id !== "string" || !rule.id.trim()) {
      throw new Error(`${label} needs a non-empty id.`);
    }
    const id = rule.id.trim();
    if (ids.has(id)) throw new Error(`Duplicate rule id: "${id}".`);
    ids.add(id);

    if (typeof rule.instrument !== "string" || !rule.instrument.trim()) {
      throw new Error(`${label} needs an instrument.`);
    }
    if (!['above', 'below'].includes(rule.direction)) {
      throw new Error(`${label} direction must be "above" or "below".`);
    }

    if (rule.type === "level") {
      if (!Number.isFinite(rule.level)) throw new Error(`${label} level must be a number.`);
    } else if (rule.type === "ma_cross") {
      if (!Number.isInteger(rule.short) || rule.short < 1 ||
          !Number.isInteger(rule.long) || rule.long < 1 || rule.short >= rule.long) {
        throw new Error(`${label} needs positive windows, with short smaller than long.`);
      }
    } else {
      throw new Error(`${label} has an unsupported type.`);
    }
  }

  return rules.map(rule => ({ ...rule, id: rule.id.trim(), instrument: rule.instrument.trim() }));
}

module.exports = { parseAndValidateRules };
