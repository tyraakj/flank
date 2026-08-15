const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function replaceUnknownWithAny(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/as unknown/g, 'as any');
  fs.writeFileSync(filePath, content);
}

const files = [
  "apps/worker/src/index.ts",
  "apps/worker/src/providers/llm/gemini.ts",
  "apps/worker/src/orchestration/critic-router.ts",
  "apps/worker/src/orchestration/execute-stage.ts",
  "apps/worker/src/providers/cache.ts",
];

for (const file of files) {
  replaceUnknownWithAny(file);
}

console.log('Fixed unknown back to any');
