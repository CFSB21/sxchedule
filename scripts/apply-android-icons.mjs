import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "resources", "launcher", "res");
const dest = join(root, "android", "app", "src", "main", "res");

if (!existsSync(src)) {
  console.error("Missing resources/launcher/res");
  process.exit(1);
}
if (!existsSync(dest)) {
  console.error("Android project not found. Run npx cap add android first.");
  process.exit(1);
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const a = join(from, name);
    const b = join(to, name);
    if (statSync(a).isDirectory()) copyTree(a, b);
    else cpSync(a, b);
  }
}

copyTree(src, dest);
console.log("Applied Sxchedule launcher icons to android/app/src/main/res");
