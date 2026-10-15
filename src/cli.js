const fs = require("node:fs");
const path = require("node:path");
const { parseCsv, sortAndValidatePrices } = require("./csvParser");
const { parseAndValidateRules } = require("./rules");
const { generateAlerts, formatAlerts } = require("./alerts");

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    throw new Error(
      "Usage: node src/cli.js <prices.csv> <rules.json>"
    );
  }

  const pricesPath = path.resolve(args[0]);
  const rulesPath = path.resolve(args[1]);

  let csvText;
  let rulesText;

  try {
    csvText = fs.readFileSync(pricesPath, "utf8");
  } catch {
    throw new Error(`Cannot read prices file: ${pricesPath}`);
  }

  try {
    rulesText = fs.readFileSync(rulesPath, "utf8");
  } catch {
    throw new Error(`Cannot read rules file: ${rulesPath}`);
  }

  const prices = sortAndValidatePrices(parseCsv(csvText));
  const rules = parseAndValidateRules(rulesText); // array of rules
  const alerts = generateAlerts(prices, rules); // array of alerts
  const lines = formatAlerts(alerts);

  if (lines.length > 0) {
    process.stdout.write(`${lines.join("\n")}\n`);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
}
