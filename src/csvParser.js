function parseCsv(text) {
  const lines = text.trim().split("\n").map(line => line.endsWith("\r") ? line.slice(0, -1) : line);
  if (!text.trim()) throw new Error("CSV file is empty.");

  const rows = lines.map(line => {
    const fields = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && quoted && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        fields.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    if (quoted) throw new Error("CSV contains an unterminated quoted field.");
    fields.push(field.trim());
    return fields;
  });

  const headers = rows.shift();
  for (const name of ["date", "instrument", "close"]) {
    if (!headers.includes(name)) throw new Error(`CSV is missing required column: ${name}.`);
  }

  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has the wrong number of fields.`);
    const row = Object.fromEntries(headers.map((name, i) => [name, values[i]]));
    const date = row.date;
    const close = Number(row.close);

    const parsedDate = new Date(`${date}T00:00:00Z`);
    const dateParts = date.split("-");
    let validFormat = dateParts.length === 3 &&
      dateParts[0].length === 4 && dateParts[1].length === 2 && dateParts[2].length === 2;

    for (const part of dateParts) {
      for (const char of part) {
        if (char < "0" || char > "9") validFormat = false;
      }
    }

    if (!validFormat || !Number.isFinite(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date) {
      throw new Error(`CSV row ${index + 2} has an invalid date: "${date}".`);
    }
    if (!row.instrument) throw new Error(`CSV row ${index + 2} has an empty instrument.`);
    if (row.close === "" || !Number.isFinite(close) || close < 0) {
      throw new Error(`CSV row ${index + 2} has an invalid closing price.`);
    }
    return { date, instrument: row.instrument, close };
  });
}

function sortAndValidatePrices(prices) {
  const seen = new Set();
  for (const price of prices) {
    const key = `${price.instrument}|${price.date}`;
    if (seen.has(key)) throw new Error(`Duplicate price for instrument "${price.instrument}" on ${price.date}.`);
    seen.add(key);
  }
  return [...prices].sort((a, b) =>
    a.date.localeCompare(b.date) || a.instrument.localeCompare(b.instrument)
  );
}

module.exports = { parseCsv, sortAndValidatePrices };
