import { cpSync, mkdirSync, rmSync, readdirSync } from "fs";

const ROOT_FILES = new Set([
  "CNAME",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "googlee63cd6836513ab92.html",
]);

rmSync("deploy", { recursive: true, force: true });
mkdirSync("deploy/skill", { recursive: true });

for (const entry of readdirSync("dist")) {
  if (ROOT_FILES.has(entry)) {
    cpSync(`dist/${entry}`, `deploy/${entry}`, { recursive: true });
  } else {
    cpSync(`dist/${entry}`, `deploy/skill/${entry}`, { recursive: true });
  }
}

console.log("deploy/ ready");
