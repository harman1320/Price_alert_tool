function movingAverage(values, windowSize) {
  if (!Number.isInteger(windowSize) || windowSize < 1) {
    throw new Error("windowSize must be a positive integer.");
  }
  if (values.length < windowSize) return null;

  const window = values.slice(values.length - windowSize);
  return window.reduce((sum, value) => sum + value, 0) / windowSize;
}

module.exports = { movingAverage };
