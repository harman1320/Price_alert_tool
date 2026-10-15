// returns array of objects
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  if (field.length > 0 || row.length > 0) { // CSV contains \n at the last
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const headers = rows[0].map((header) => header.trim());
  const required = ["date", "instrument", "close"];
  for (const column of required) {
    if (!headers.includes(column)) {
      throw new Error(`CSV is missing required column: ${column}`);
    }
  }

  return rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`
      );
    }

    const record = {};
    headers.forEach((header, columnIndex) => {
      record[header] = values[columnIndex].trim();
    });

    const date = record.date;
    const instrument = record.instrument;
    const close = Number(record.close);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new Error(`CSV row ${index + 2} has an invalid date: "${date}".`);
    }
    // Ensure dates like 2026-02-31 are rejected rather than normalized.
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (parsedDate.toISOString().slice(0, 10) !== date) {
      throw new Error(`CSV row ${index + 2} has an invalid date: "${date}".`);
    }
    if (!instrument) {
      throw new Error(`CSV row ${index + 2} has an empty instrument.`);
    }
    if (record.close === "" || !Number.isFinite(close)) {
      throw new Error(`CSV row ${index + 2} has an invalid closing price.`);
    }

    return { date, instrument, close };
  });
}

function sortAndValidatePrices(prices) {
  const seen = new Set();
  for (const price of prices) {
    const key = `${price.instrument}\u0000${price.date}`;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate price for instrument "${price.instrument}" on ${price.date}.`
      );
    }
    seen.add(key);
  }

  return [...prices].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.instrument.localeCompare(b.instrument)
  );
}

module.exports = { parseCsv, sortAndValidatePrices };
