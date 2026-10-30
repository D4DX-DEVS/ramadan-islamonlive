// Marks every stored page (worker.ts) out of date. Run after each deploy: stored pages name the CSS and font files of the
// build that rendered them, and those files disappear when a new build is deployed.
import { execFileSync } from "node:child_process";

execFileSync(
  process.execPath,
  ["node_modules/wrangler/bin/wrangler.js", "r2", "object", "put", "ramdan/cache/purged", "--remote", "--pipe", "--content-type", "text/plain"],
  { input: String(Date.now()), stdio: ["pipe", "inherit", "inherit"] },
);
console.log("page cache cleared");
