import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const SRC = path.resolve("src");
const violations = [];

function getFiles(dir) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function getModule(file) {
  const relative = path.relative(SRC, file).replaceAll("\\", "/");
  return relative.split("/")[0];
}

function resolveImport(fromFile, importPath) {
  if (!importPath.startsWith(".")) {
    return null;
  }

  let resolved = path.resolve(
    path.dirname(fromFile),
    importPath,
  );

  if (!path.extname(resolved)) {
    resolved += ".ts";
  }

  return fs.existsSync(resolved) ? resolved : null;
}

const files = getFiles(SRC);
const graph = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const dependencies = [];

  const imports = content.matchAll(
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
  );

  for (const match of imports) {
    const importPath = match[1];
    const target = resolveImport(file, importPath);

    if (!target) {
      continue;
    }

    dependencies.push(target);
    if (
      importPath.includes("/internal/") &&
      getModule(file) !== getModule(target)
    ) {
      violations.push(
        `Internal import violation: ${path.relative(process.cwd(), file)} -> ${importPath}`,
      );
    }
  }

  graph.set(file, dependencies);
}
for (const file of files) {
  const relative = path.relative(SRC, file).replaceAll("\\", "/");

  if (
    relative.startsWith("orders/") ||
    relative.startsWith("checkout/")
  ) {
    const content = fs.readFileSync(file, "utf8");

  if (content.includes("database.stock")) {
  violations.push(
    `Inventory ownership violation: ${path.relative(process.cwd(), file)} directly accesses Inventory storage`,
  );
}
  }
}
const visiting = new Set();
const visited = new Set();

function checkCycles(file, stack = []) {
  if (visiting.has(file)) {
    const index = stack.indexOf(file);
    const cycle = stack
      .slice(index)
      .concat(file)
      .map((item) => path.relative(process.cwd(), item))
      .join(" -> ");

    violations.push(`Dependency cycle detected: ${cycle}`);
    return;
  }

  if (visited.has(file)) {
    return;
  }

  visiting.add(file);

  for (const dependency of graph.get(file) ?? []) {
    checkCycles(dependency, [...stack, file]);
  }

  visiting.delete(file);
  visited.add(file);
}

for (const file of files) {
  checkCycles(file);
}

if (violations.length > 0) {
  console.error("Architecture checks failed:\n");

  for (const violation of violations) {
    console.error(`- ${violation}`);
  }

  process.exit(1);
}

console.log("Architecture checks passed.");

