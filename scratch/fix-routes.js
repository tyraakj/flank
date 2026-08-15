const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceWith) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceWith);
  fs.writeFileSync(filePath, content);
}

const routeFiles = [
  "apps/app/app/api/targets/[targetId]/reports/[runId]/[section]/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/[runId]/cancel/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/[runId]/curation/[...path]/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/[runId]/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/route.ts",
  "apps/app/app/api/workspaces/[workspaceSlug]/targets/route.ts",
];

for (const file of routeFiles) {
  replaceInFile(file, /\}: unknown\)/g, '}: any)');
}
console.log('Fixed route params!');
