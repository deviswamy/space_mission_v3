#!/usr/bin/env tsx
/**
 * generate-codemap.ts — Scans the project filesystem and generates CODEMAP.yaml
 *
 * Preserves existing descriptions, adds "TODO" for new entries, prunes deleted files.
 *
 * Usage:
 *   npx tsx .claude/skills/codemap/scripts/generate-codemap.ts
 *   npx tsx .claude/skills/codemap/scripts/generate-codemap.ts --include client server shared docs
 *   npx tsx .claude/skills/codemap/scripts/generate-codemap.ts --exclude ".test.ts" ".spec.ts"
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { parse, stringify } from "yaml";

// ── Types ───────────────────────────────────────────────────────────────────

interface Config {
  includeDirs: string[];
  excludeDirs: string[];
  excludeFilePatterns: string[];
  includeExtensions: string[];
  outputPath: string;
  maxDepth: number;
}

/** Nested tree: directories are objects, files are string descriptions */
type TreeNode = { [key: string]: TreeNode | string };

// ── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Config = {
  includeDirs: ["client", "server", "shared"],
  excludeDirs: [
    "node_modules",
    "dist",
    "build",
    ".git",
    "__pycache__",
    ".next",
    ".cache",
    ".turbo",
    "coverage",
  ],
  excludeFilePatterns: [".d.ts", ".map", ".lock", ".log", ".tsbuildinfo", ".DS_Store"],
  includeExtensions: [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".sql",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".sh",
    ".py",
    ".html",
  ],
  outputPath: "CODEMAP.yaml",
  maxDepth: 15,
};

const TODO_MARKER = "TODO";

// ── CLI Arg Parsing ─────────────────────────────────────────────────────────

function parseArgs(): Partial<Config> {
  const args = process.argv.slice(2);
  const result: Partial<Config> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--include": {
        const dirs: string[] = [];
        while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
          dirs.push(args[++i]);
        }
        result.includeDirs = dirs;
        break;
      }
      case "--exclude": {
        const patterns: string[] = [];
        while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
          patterns.push(args[++i]);
        }
        result.excludeFilePatterns = [...DEFAULT_CONFIG.excludeFilePatterns, ...patterns];
        break;
      }
      case "--output":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error("Error: --output requires a value");
          process.exit(1);
        }
        result.outputPath = args[++i];
        break;
      case "--max-depth": {
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error("Error: --max-depth requires a value");
          process.exit(1);
        }
        const val = parseInt(args[++i], 10);
        if (Number.isNaN(val) || val < 1) {
          console.error("Error: --max-depth must be a positive integer");
          process.exit(1);
        }
        result.maxDepth = val;
        break;
      }
    }
  }
  return result;
}

// ── Load Existing Codemap ───────────────────────────────────────────────────

/**
 * Flatten an existing CODEMAP.yaml into a Map<relativePath, description>.
 * Handles the nested tree structure with `_` keys for directory descriptions.
 */
function loadExistingDescriptions(filePath: string): Map<string, string> {
  const descriptions = new Map<string, string>();

  if (!fs.existsSync(filePath)) return descriptions;

  const content = fs.readFileSync(filePath, "utf-8");
  let data: TreeNode | null;
  try {
    data = parse(content) as TreeNode | null;
  } catch {
    console.warn(`  Warning: could not parse existing ${filePath}, starting fresh`);
    return descriptions;
  }
  if (!data || typeof data !== "object") return descriptions;

  function walk(node: TreeNode, prefix: string): void {
    for (const [key, value] of Object.entries(node)) {
      if (key === "_" && typeof value === "string") {
        // Directory description
        descriptions.set(prefix, value);
      } else if (typeof value === "string") {
        // File entry
        descriptions.set(prefix + key, value);
      } else if (typeof value === "object" && value !== null) {
        // Directory — recurse
        walk(value as TreeNode, prefix + key);
      }
    }
  }

  walk(data, "");
  return descriptions;
}

// ── Filesystem Scanning ─────────────────────────────────────────────────────

function shouldExcludeDir(name: string, config: Config): boolean {
  return config.excludeDirs.includes(name);
}

function shouldExcludeFile(name: string, config: Config): boolean {
  return config.excludeFilePatterns.some((pattern) => {
    // Strip leading * for glob-style patterns (e.g., "*.test.ts" → ".test.ts")
    const suffix = pattern.startsWith("*") ? pattern.slice(1) : pattern;
    return name.endsWith(suffix);
  });
}

function shouldIncludeFile(name: string, config: Config): boolean {
  return config.includeExtensions.some((ext) => name.endsWith(ext));
}

function scanDirectory(dirPath: string, config: Config, depth: number): TreeNode | null {
  if (depth > config.maxDepth) return null;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return null;
  }

  // Separate and sort: directories first (alphabetical), then files (alphabetical)
  const dirs = entries
    .filter((e) => e.isDirectory() && !shouldExcludeDir(e.name, config))
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter(
      (e) => e.isFile() && !shouldExcludeFile(e.name, config) && shouldIncludeFile(e.name, config),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  if (dirs.length === 0 && files.length === 0) return null;

  const node: TreeNode = {};

  for (const dir of dirs) {
    const subtree = scanDirectory(path.join(dirPath, dir.name), config, depth + 1);
    if (subtree !== null) {
      node[`${dir.name}/`] = subtree;
    }
  }

  for (const file of files) {
    node[file.name] = TODO_MARKER;
  }

  return Object.keys(node).length > 0 ? node : null;
}

// ── Merge Trees ─────────────────────────────────────────────────────────────

/**
 * Walk the scanned tree and fill in descriptions from the existing map.
 * Returns stats about what was preserved vs new.
 */
function mergeDescriptions(
  tree: TreeNode,
  existing: Map<string, string>,
  prefix: string,
  stats: { total: number; preserved: number; todo: number; dirs: number },
): void {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") {
      // File entry
      stats.total++;
      const fullPath = prefix + key;
      const existingDesc = existing.get(fullPath);
      if (existingDesc && existingDesc !== TODO_MARKER) {
        tree[key] = existingDesc;
        stats.preserved++;
      } else {
        stats.todo++;
      }
    } else if (typeof value === "object" && value !== null) {
      // Directory entry
      stats.dirs++;
      const dirPath = prefix + key;

      // Check for existing directory description
      const existingDirDesc = existing.get(dirPath);
      if (existingDirDesc && existingDirDesc !== TODO_MARKER) {
        (value as TreeNode)._ = existingDirDesc;
        stats.preserved++;
      } else {
        (value as TreeNode)._ = TODO_MARKER;
        stats.todo++;
      }

      mergeDescriptions(value as TreeNode, existing, dirPath, stats);
    }
  }
}

/**
 * Ensure `_` key (directory description) appears first in each directory node.
 */
function sortTreeKeys(tree: TreeNode): TreeNode {
  const sorted: TreeNode = {};
  const keys = Object.keys(tree);

  // `_` first
  if ("_" in tree) {
    sorted._ = tree._;
  }

  // Directories (keys ending with /)
  const dirKeys = keys.filter((k) => k !== "_" && typeof tree[k] === "object").sort();
  for (const k of dirKeys) {
    sorted[k] = sortTreeKeys(tree[k] as TreeNode);
  }

  // Files (string values)
  const fileKeys = keys.filter((k) => k !== "_" && typeof tree[k] === "string").sort();
  for (const k of fileKeys) {
    sorted[k] = tree[k];
  }

  return sorted;
}

// ── Main ────────────────────────────────────────────────────────────────────

function findProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== "/") {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function main(): void {
  const config: Config = { ...DEFAULT_CONFIG, ...parseArgs() };
  const projectRoot = findProjectRoot();
  const outputPath = path.resolve(projectRoot, config.outputPath);

  // Ensure output stays within project root
  if (!outputPath.startsWith(projectRoot + path.sep) && outputPath !== projectRoot) {
    console.error("Error: output path resolves outside project root");
    process.exit(1);
  }

  // Load existing descriptions
  const existing = loadExistingDescriptions(outputPath);
  const _previousCount = existing.size;

  // Scan filesystem
  const tree: TreeNode = {};
  for (const dir of config.includeDirs) {
    const fullDir = path.resolve(projectRoot, dir);
    // Ensure included dirs stay within project root
    if (!fullDir.startsWith(projectRoot + path.sep) && fullDir !== projectRoot) {
      console.error(`  Error: "${dir}" resolves outside project root, skipping`);
      continue;
    }
    if (fs.existsSync(fullDir)) {
      const subtree = scanDirectory(fullDir, config, 0);
      if (subtree !== null) {
        tree[`${dir}/`] = subtree;
      }
    } else {
      console.warn(`  Warning: directory "${dir}" not found, skipping`);
    }
  }

  // Merge descriptions
  const stats = { total: 0, preserved: 0, todo: 0, dirs: 0 };
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "object" && value !== null) {
      stats.dirs++;
      const dirPath = key;
      const existingDirDesc = existing.get(dirPath);
      if (existingDirDesc && existingDirDesc !== TODO_MARKER) {
        (value as TreeNode)._ = existingDirDesc;
        stats.preserved++;
      } else {
        (value as TreeNode)._ = TODO_MARKER;
        stats.todo++;
      }
      mergeDescriptions(value as TreeNode, existing, dirPath, stats);
    }
  }

  // Sort keys for consistent output
  const sortedTree = sortTreeKeys(tree);

  // Generate YAML
  const header = [
    "# Dialectica Alpha - Code Map",
    "# Auto-generated structure. Descriptions maintained by Claude Code.",
    `# Last generated: ${new Date().toISOString()}`,
    "#",
    "# Format:",
    '#   directory/:          Directories end with "/"',
    "#   _:                   Directory description (always first key)",
    "#   filename.ts:         File with its description as the value",
    '#   "TODO":              Needs a description from Claude Code',
    "",
  ].join("\n");

  const yamlContent = stringify(sortedTree, {
    lineWidth: 0,
    defaultStringType: "QUOTE_DOUBLE",
    sortMapEntries: false,
  });

  fs.writeFileSync(outputPath, header + yamlContent);

  // Summary — only count non-TODO entries that were lost as "pruned"
  const previousNonTodo = [...existing.values()].filter((v) => v !== TODO_MARKER).length;
  const pruned = Math.max(0, previousNonTodo - stats.preserved);
  console.log(`\nCODEMAP.yaml generated at: ${outputPath}`);
  console.log(`  Directories: ${stats.dirs}`);
  console.log(`  Files:       ${stats.total}`);
  console.log(`  TODO (new):  ${stats.todo}`);
  console.log(`  Preserved:   ${stats.preserved}`);
  if (pruned > 0) {
    console.log(`  Pruned:      ${pruned}`);
  }
}

main();
