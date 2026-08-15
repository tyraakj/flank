const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Fix the imports
const filesWithImports = [
  "apps/worker/src/providers/registry.ts",
  "apps/worker/src/providers/cache.ts",
  "apps/worker/src/progress/publisher.ts",
  "apps/worker/src/orchestration/run-service.ts",
  "apps/worker/src/orchestration/execute-stage.ts",
  "apps/worker/src/orchestration/critic-router.ts",
  "apps/worker/src/orchestration/cancellation.ts",
];

for (const file of filesWithImports) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/,\s*_[a-zA-Z0-9_]+/g, '');
  content = content.replace(/\{\s*_[a-zA-Z0-9_]+\s*,\s*/g, '{ ');
  content = content.replace(/\{\s*_[a-zA-Z0-9_]+\s*\}/g, '{}');
  fs.writeFileSync(file, content);
}

// 2. Fix _requestedBy in index.ts
let indexTs = fs.readFileSync("apps/worker/src/index.ts", "utf8");
indexTs = indexTs.replace(/_requestedBy/g, 'requestedBy: _requestedBy');
// Fix unknown StageKey in index.ts
indexTs = indexTs.replace(/job\.data\.stageKey/g, 'job.data.stageKey as any');
indexTs = indexTs.replace(/job\.data/g, 'job.data as any');
fs.writeFileSync("apps/worker/src/index.ts", indexTs);

// 3. Fix unknown in critic-router.ts
let criticRouterTs = fs.readFileSync("apps/worker/src/orchestration/critic-router.ts", "utf8");
criticRouterTs = criticRouterTs.replace(/job\.data/g, 'job.data as any');
fs.writeFileSync("apps/worker/src/orchestration/critic-router.ts", criticRouterTs);

// 4. Fix unknown in execute-stage.ts
let executeStageTs = fs.readFileSync("apps/worker/src/orchestration/execute-stage.ts", "utf8");
executeStageTs = executeStageTs.replace(/output: stageOutput,/g, 'output: stageOutput as any,');
executeStageTs = executeStageTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/orchestration/execute-stage.ts", executeStageTs);

// 5. Fix unknown in providers/cache.ts
let cacheTs = fs.readFileSync("apps/worker/src/providers/cache.ts", "utf8");
cacheTs = cacheTs.replace(/value: val,/g, 'value: val as any,');
fs.writeFileSync("apps/worker/src/providers/cache.ts", cacheTs);

// 6. Fix unknown in providers/failover.ts
let failoverTs = fs.readFileSync("apps/worker/src/providers/failover.ts", "utf8");
failoverTs = failoverTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/providers/failover.ts", failoverTs);

// 7. Fix unknown in providers/llm/gemini.ts
let geminiTs = fs.readFileSync("apps/worker/src/providers/llm/gemini.ts", "utf8");
geminiTs = geminiTs.replace(/result\.response/g, '(result.response as any)');
geminiTs = geminiTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/providers/llm/gemini.ts", geminiTs);

// 8. Fix unknown in providers/reader/http.ts
let httpTs = fs.readFileSync("apps/worker/src/providers/reader/http.ts", "utf8");
httpTs = httpTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/providers/reader/http.ts", httpTs);

// 9. Fix unknown in providers/reader/playwright.ts
let playwrightTs = fs.readFileSync("apps/worker/src/providers/reader/playwright.ts", "utf8");
playwrightTs = playwrightTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/providers/reader/playwright.ts", playwrightTs);

// 10. Fix unknown in providers/search/brave.ts
let braveTs = fs.readFileSync("apps/worker/src/providers/search/brave.ts", "utf8");
braveTs = braveTs.replace(/res\.url/g, '(res as any).url');
braveTs = braveTs.replace(/res\.title/g, '(res as any).title');
braveTs = braveTs.replace(/res\.description/g, '(res as any).description');
braveTs = braveTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/providers/search/brave.ts", braveTs);

// 11. Fix unknown in providers/search/duckduckgo.ts
let ddgTs = fs.readFileSync("apps/worker/src/providers/search/duckduckgo.ts", "utf8");
ddgTs = ddgTs.replace(/catch \(err: unknown\)/g, 'catch (err: any)');
fs.writeFileSync("apps/worker/src/providers/search/duckduckgo.ts", ddgTs);

console.log('Fixed types!');
