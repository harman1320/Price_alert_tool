
function movingAverage(values, size) {
  if (values.length < size) return null;

  const window = values.slice(-size);
  return window.reduce((sum, value) => sum + value, 0) / size;
}

module.exports = { movingAverage };
