import { isAbsolute, relative, resolve } from "node:path";

// Default scan pattern
const DEFAULT_PATTERN = "**/*.{js,jsx,ts,tsx,json,css,md}";

// CLI arguments parsing
const args = Bun.argv.slice(2);
const isWriteMode = args.includes("--write");
const inputPatterns = args.filter((arg) => !arg.startsWith("-"));

// ANSI color codes
const c = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

function toDisplayPath(filePath: string) {
  const cwd = process.cwd();
  const absPath = isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
  const relPath = relative(cwd, absPath);

  // Prefer a relative path when it stays within the current working directory.
  if (relPath && !relPath.startsWith("..")) return relPath;
  return absPath;
}

function printError(
  filePath: string,
  lineNum: number,
  colNum: number = -1,
  msg: string,
  lines: string[],
) {
  const displayPath = toDisplayPath(filePath);

  const displayCol = colNum !== -1 ? `:${colNum}` : "";
  console.log(`\n${c.bold}${c.blue}${displayPath}:${lineNum}${displayCol}${c.reset} ${msg}\n`);

  const startLine = Math.max(0, lineNum - 2);
  const endLine = Math.min(lines.length - 1, lineNum);
  const numWidth = (endLine + 1).toString().length;

  for (let i = startLine; i <= endLine; i++) {
    const isErrorLine = i === lineNum - 1;
    const marker = isErrorLine ? `${c.red}>${c.reset}` : " ";
    const lineNo = (i + 1).toString().padStart(numWidth, " ");
    const code = lines[i] || "";

    console.log(`  ${marker} ${c.gray}${lineNo} │${c.reset} ${code}`);

    if (isErrorLine && colNum !== -1) {
      const indent = " ".repeat(colNum - 1);
      console.log(`    ${" ".repeat(numWidth)} ${c.gray}│${c.reset} ${indent}${c.red}^${c.reset}`);
    }
  }
}

async function processFile(filePath: string): Promise<boolean> {
  const f = Bun.file(filePath);
  if (!(await f.exists())) return false;

  const text = await f.text();
  const lines = text.split("\n");

  const newLines = [...lines];
  let fileModified = false;
  let localError = false;

  // Trim Trailing Whitespace
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    if (line !== trimmed) {
      fileModified = true;
      newLines[i] = trimmed;

      if (!isWriteMode) {
        localError = true;
        const errCol = trimmed.length + 1;
        printError(filePath, i + 1, errCol, "Trailing whitespace found.", lines);
      }
    }
  }

  let content = newLines.join("\n");

  // Final Newline Logic
  const fixedContent = `${content.trimEnd()}\n`;

  if (content !== fixedContent) {
    fileModified = true;
    if (!isWriteMode) {
      localError = true;

      let msg = "Incorrect file ending.";
      if (!content.endsWith("\n")) msg = "Missing final newline.";
      else if (content.endsWith("\n\n")) msg = "Too many final newlines.";

      printError(filePath, lines.length, -1, msg, lines);
    }
    content = fixedContent;
  }

  if (isWriteMode && fileModified) {
    await Bun.write(filePath, content);
    console.log(`${c.green}Fixed:${c.reset} ${c.blue}${toDisplayPath(filePath)}${c.reset}`);
  }

  return localError;
}

async function main() {
  const start = performance.now();
  let hasErrors = false;
  let fileCount = 0;

  const patternsToScan = inputPatterns.length > 0 ? inputPatterns : [DEFAULT_PATTERN];

  for (const pattern of patternsToScan) {
    const glob = new Bun.Glob(pattern);

    for await (const file of glob.scan(".")) {
      if (file.includes("node_modules") || file.includes(".git")) continue;

      fileCount++;
      const result = await processFile(file);
      if (result) hasErrors = true;
    }
  }

  if (fileCount === 0) {
    console.log(`${c.yellow}Warning:${c.reset} No files matched the pattern.`);
    return;
  }

  if (!isWriteMode && hasErrors) {
    console.log(
      `\n${c.red}error:${c.reset} Linter found errors. Run with ${c.bold}--write${c.reset} to fix.`,
    );
    process.exit(1);
  } else if (!isWriteMode && !hasErrors) {
    const elapsedMs = Math.round(performance.now() - start);
    const fileLabel = fileCount === 1 ? "file" : "files";
    console.log(
      `${c.blue}Checked ${fileCount} ${fileLabel} in ${elapsedMs}ms. No fixes applied.${c.reset}`,
    );
  }
}

main();
