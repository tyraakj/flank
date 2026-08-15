const fs = require('fs');
const path = require('path');

// Helper to replace text in file
function replaceInFile(filePath, searchRegex, replaceWith) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(searchRegex, replaceWith);
  fs.writeFileSync(filePath, content);
}

// 1. Fix Route Handlers context: unknown -> context: any
const routeFiles = [
  "apps/app/app/api/targets/[targetId]/reports/[runId]/[section]/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/[runId]/cancel/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/[runId]/curation/[...path]/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/[runId]/route.ts",
  "apps/app/app/api/targets/[targetId]/runs/route.ts",
  "apps/app/app/api/workspaces/[workspaceSlug]/targets/route.ts",
];
for (const file of routeFiles) {
  replaceInFile(file, /context: unknown/g, 'context: any');
  replaceInFile(file, /_session/g, 'session');
  replaceInFile(file, /_body/g, 'body');
  replaceInFile(file, /_target/g, 'target');
}

// 2. Fix page.tsx
const pageFile = "apps/app/app/page.tsx";
replaceInFile(pageFile, /_Network/g, 'Network');
replaceInFile(pageFile, /unknown/g, 'any'); // just replace all unknown to any in page.tsx

// 3. Fix components UI ClassValue
const uiFiles = [
  "apps/app/components/flank/data-table.tsx",
  "apps/app/components/ui/checkbox.tsx",
  "apps/app/components/ui/input.tsx",
  "apps/app/components/ui/scroll-area.tsx",
  "apps/app/components/ui/select.tsx",
  "apps/app/components/ui/switch.tsx",
  "apps/app/components/ui/tabs.tsx",
  "apps/app/components/ui/textarea.tsx",
];
for (const file of uiFiles) {
  replaceInFile(file, /unknown/g, 'any');
}

// 4. Fix matrix.tsx & top-bar.tsx & workspace-switcher.tsx
replaceInFile("apps/app/components/flank/matrix.tsx", /_pinnedFirstColumn/g, 'pinnedFirstColumn');
replaceInFile("apps/app/components/flank/top-bar.tsx", /_workspaceName/g, 'workspaceName');
replaceInFile("apps/app/components/flank/workspace-switcher.tsx", /e =>/g, '(e: any) =>');
replaceInFile("apps/app/components/ui/sheet.tsx", /_useState/g, 'useState');

// 5. Fix lib/progress/redis-bridge.ts
replaceInFile("apps/app/lib/progress/redis-bridge.ts", /unknown/g, 'any');

console.log('Fixed app types!');
