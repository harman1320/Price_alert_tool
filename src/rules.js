const VALID_DIRECTIONS = new Set(["above", "below"]);

function parseAndValidateRules(jsonText) {
  let rules;
  try {
    rules = JSON.parse(jsonText);
  } catch {
    throw new Error("Rules file is not valid JSON.");
  }

  if (!Array.isArray(rules)) {
    throw new Error("Rules file must contain a JSON array.");
  }

  const ids = new Set();

  return rules.map((rule, index) => {
    const label = `Rule at index ${index}`;

    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
      throw new Error(`${label} must be a JSON object.`);
    }

    if (typeof rule.id !== "string" || rule.id.trim() === "") {
      throw new Error(`${label} must have a non-empty string id.`);
    }

    if (ids.has(rule.id)) {
      throw new Error(`Duplicate rule id: "${rule.id}".`);
    }
    ids.add(rule.id);

    if (typeof rule.instrument !== "string" || rule.instrument.trim() === "") {
      throw new Error(`${label} must have a non-empty instrument.`);
    }
    
    if (!VALID_DIRECTIONS.has(rule.direction)) {
      throw new Error(`${label} direction must be "above" or "below".`);
    }

    if (rule.type === "level") {
      if (!Number.isFinite(rule.level)) {
        throw new Error(`${label} level rule must have a numeric level.`);
      }
    } else if (rule.type === "ma_cross") {
      if (!Number.isInteger(rule.short) || rule.short < 1) {
        throw new Error(`${label} short window must be a positive integer.`);
      }
      if (!Number.isInteger(rule.long) || rule.long < 1) {
        throw new Error(`${label} long window must be a positive integer.`);
      }
      if (rule.short >= rule.long) {
        throw new Error(
          `${label} short window must be smaller than long window.`,
        );
      }
    } else {
      throw new Error(`${label} has unsupported type "${rule.type}".`);
    }

    return { ...rule, instrument: rule.instrument.trim() };
  });
}

module.exports = { parseAndValidateRules };
