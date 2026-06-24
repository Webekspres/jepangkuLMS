/** Dipakai worker pino-pretty — field terstruktur tetap ada di file JSON. */
module.exports = {
  statusCode(value, _key, _log, { colors }) {
    if (value == null || value === '') return '';
    const code = Number(value);
    if (Number.isNaN(code)) return String(value);
    if (code >= 500) return colors.red(` ${code}`);
    if (code >= 400) return colors.yellow(` ${code}`);
    return colors.green(` ${code}`);
  },
  durationMs(value) {
    if (value == null || value === '') return '';
    return ` ${value}ms`;
  },
};
