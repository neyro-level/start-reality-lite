const { createRequire } = require("node:module");
const { dirname, join } = require("node:path");

const root = dirname(__dirname);
const requireFromTsx = createRequire(require.resolve("tsx/package.json"));
const esbuild = requireFromTsx("esbuild");

esbuild.buildSync({
  absWorkingDir: root,
  entryPoints: [join(root, "scripts", "worker.ts")],
  outfile: join(root, "dist", "worker.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node24",
  logLevel: "info",
});
