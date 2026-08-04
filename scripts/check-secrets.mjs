import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const result = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" });
if (result.status !== 0) {
  process.stderr.write(result.stderr || "Unable to list tracked files.\n");
  process.exit(1);
}

const patterns = [
  {
    name: "GitHub personal access token",
    value: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  },
  { name: "Clerk secret key", value: /\bsk_(?:test|live)_[A-Za-z0-9]{20,}\b/g },
  { name: "AWS access key", value: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    name: "Private key",
    value: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

const findings = [];
for (const file of result.stdout.split("\0").filter(Boolean)) {
  if (file === "scripts/check-secrets.mjs") continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    pattern.value.lastIndex = 0;
    if (pattern.value.test(content)) {
      findings.push(`${file}: possible ${pattern.name}`);
    }
  }
}

if (findings.length > 0) {
  process.stderr.write(
    `Potential committed credentials detected:\n${findings
      .map((finding) => `- ${finding}`)
      .join("\n")}\n`,
  );
  process.exit(1);
}

process.stdout.write("No high-confidence credential patterns found.\n");
