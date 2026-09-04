import { renameSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const result = spawnSync(
  "npx",
  ["vite", "build", "--config", "vite.android.config.ts"],
  { stdio: "inherit", cwd: root, shell: false },
);
if (result.status !== 0) process.exit(result.status ?? 1);

const from = join(root, "android-www", "android-index.html");
const to = join(root, "android-www", "index.html");
if (existsSync(from)) renameSync(from, to);
if (!existsSync(to)) {
  console.error("android-www/index.html was not produced");
  process.exit(1);
}
console.log("Android web bundle ready at android-www/");
