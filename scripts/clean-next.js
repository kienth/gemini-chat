const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const targets = [".next", ".turbo"];

for (const target of targets) {
  const absolute = path.join(projectRoot, target);
  try {
    fs.rmSync(absolute, { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.log(`[clean] removed ${target}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[clean] failed to remove ${target}:`, err);
  }
}
