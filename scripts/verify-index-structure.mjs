import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const root = process.cwd();
const indexPath = path.join(root, "index.html");
const toolsPath = path.join(root, "tools.js");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

await access(indexPath);
await access(toolsPath);

const indexHtml = await readFile(indexPath, "utf8");
const toolsJs = await readFile(toolsPath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(toolsJs, sandbox);
const toolEntries = sandbox.window.toolEntries;

assert(indexHtml.includes('<script src="tools.js"></script>'), "index.html must load tools.js");
assert(indexHtml.includes('id="rail-list"'), "index.html must include a rail-list container");
assert(indexHtml.includes('id="tool-list"'), "index.html must include a tool-list container");
assert(indexHtml.includes('data-tool-count'), "index.html must include a dynamic tool count target");
assert(toolsJs.includes("window.toolEntries"), "tools.js must expose window.toolEntries");
assert(Array.isArray(toolEntries), "tools.js must define an array of tool entries");
assert(toolEntries.length > 0, "tools.js must contain at least one tool entry");

for (const entry of toolEntries) {
  assert(typeof entry.href === "string" && entry.href.length > 0, "Each tool entry must include href");
  assert(typeof entry.icon === "string" && entry.icon.length > 0, "Each tool entry must include icon");
  await access(path.join(root, entry.href));
  await access(path.join(root, entry.icon));
}

console.log("Index structure is data-driven.");
