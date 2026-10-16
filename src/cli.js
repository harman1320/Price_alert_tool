const fs = require("node:fs");
const { parseCsv, sortAndValidatePrices } = require("./csvParser");
const { parseRules } = require("./rules");
const { generateAlerts, formatAlerts } = require("./alerts");

try {
  const [pricesFile, rulesFile] = process.argv.slice(2);
  if (!pricesFile || !rulesFile) {
    throw new Error("Usage: node src/cli.js prices.csv rules.json");
  }

  const prices = sortAndValidatePrices(parseCsv(fs.readFileSync(pricesFile, "utf8")));
  const rules = parseRules(fs.readFileSync(rulesFile, "utf8"));
  const output = formatAlerts(generateAlerts(prices, rules));
  if (output.length) console.log(output.join("\n"));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
