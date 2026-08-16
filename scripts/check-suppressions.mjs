import { execFileSync } from "child_process";

const PATTERNS = [
  "@ts-ignore", // APPROVED-SUPPRESSION: rule definition
  "@ts-expect-error", // APPROVED-SUPPRESSION: rule definition
  "@ts-nocheck", // APPROVED-SUPPRESSION: rule definition
  "eslint-disable", // APPROVED-SUPPRESSION: rule definition
  " as any", // APPROVED-SUPPRESSION: rule definition
  "<any>", // APPROVED-SUPPRESSION: rule definition
  ": any", // APPROVED-SUPPRESSION: rule definition
  "--no-verify", // APPROVED-SUPPRESSION: rule definition
  "SKIP_TESTS", // APPROVED-SUPPRESSION: rule definition
  "\\.skip\\(", // APPROVED-SUPPRESSION: rule definition
  "\\.only\\(", // APPROVED-SUPPRESSION: rule definition
  "xfail", // APPROVED-SUPPRESSION: rule definition
  "describe\\.skip", // APPROVED-SUPPRESSION: rule definition
  "it\\.todo", // APPROVED-SUPPRESSION: rule definition
  "test\\.todo", // APPROVED-SUPPRESSION: rule definition
];

const APPROVAL_MARKER = "APPROVED-SUPPRESSION:";

function main() {
  let diff = "";
  try {
    diff = execFileSync(
      "git",
      [
        "diff",
        "--cached",
        "--unified=0",
        "--",
        "*.ts",
        "*.tsx",
        "*.js",
        "*.jsx",
        "*.sol",
        "*.mjs",
        "*.cjs",
        ":!**/node_modules/**",
        ":!**/dist/**",
        ":!**/build/**",
        ":!**/.next/**",
        ":!**/coverage/**",
      ],
      { encoding: "utf-8" },
    );
  } catch (err) {
    // If git diff fails (e.g., nothing to compare), just use stdout or empty
    diff = err.stdout ? err.stdout.toString() : "";
  }

  if (!diff || !diff.trim()) {
    process.exit(0);
  }

  let violations = [];
  let currentFile = "";

  const lines = diff.split("\n");
  for (const line of lines) {
    const fileMatch = line.match(/^diff --git a\/(.*?) b\//);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }

    if (line.startsWith("+++")) {
      continue;
    }

    if (line.startsWith("+")) {
      const addedLine = line.substring(1);

      for (const pattern of PATTERNS) {
        const regex = new RegExp(pattern);
        if (regex.test(addedLine)) {
          if (!addedLine.includes(APPROVAL_MARKER)) {
            violations.push(`  ${currentFile}: ${addedLine}`);
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    console.log("");
    console.log("COMMIT BLOCKED — suppression pattern(s) added without approval marker:");
    console.log("");
    console.log(violations.join("\n"));
    console.log("");
    console.log("If this suppression is genuinely necessary and has been explicitly");
    console.log("approved, add a comment on the same line containing:");
    console.log(`  // ${APPROVAL_MARKER} <short reason>`);
    console.log("");
    console.log("Otherwise, fix the underlying issue instead of suppressing it.");
    console.log("");
    process.exit(1);
  }

  process.exit(0);
}

main();
