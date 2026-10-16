function parseCsv(text) {
  if (!text.trim()) throw new Error("CSV file is empty.");

  const lines = text.trim().split("\n").map(line => line.endsWith("\r") ? line.slice(0, -1) : line);
  const headers = lines.shift().split(",").map(value => value.trim());

  for (const name of ["date", "instrument", "close"]) {
    if (!headers.includes(name)) throw new Error(`Missing CSV column: ${name}.`);
  }

  return lines.map((line, index) => {
    const values = line.split(",").map(value => value.trim());
    if (values.length !== headers.length) throw new Error(`Invalid CSV row ${index + 2}.`);

    const row = Object.fromEntries(headers.map((name, i) => [name, values[i]]));
    const dateParts = row.date.split("-");
    const date = new Date(`${row.date}T00:00:00Z`);
    const close = Number(row.close);

    if (dateParts.length !== 3 || dateParts[0].length !== 4 ||
        dateParts[1].length !== 2 || dateParts[2].length !== 2 ||
        !dateParts.every(part => [...part].every(char => char >= "0" && char <= "9")) ||
        !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== row.date) {
      throw new Error(`Invalid date on CSV row ${index + 2}.`);
    }
    if (!row.instrument) throw new Error(`Missing instrument on CSV row ${index + 2}.`);
    if (row.close === "" || !Number.isFinite(close) || close < 0) {
      throw new Error(`Invalid price on CSV row ${index + 2}.`);
    }

    return { date: row.date, instrument: row.instrument, close };
  });
}

function sortAndValidatePrices(prices) {
  const seen = new Set();
  for (const price of prices) {
    const key = `${price.instrument}|${price.date}`;
    if (seen.has(key)) throw new Error(`Duplicate price for ${price.instrument} on ${price.date}.`);
    seen.add(key);
  }
  return [...prices].sort((a, b) =>
    a.date.localeCompare(b.date) || a.instrument.localeCompare(b.instrument)
  );
}

module.exports = { parseCsv, sortAndValidatePrices };
