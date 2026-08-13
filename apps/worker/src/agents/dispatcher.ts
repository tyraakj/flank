import { StageKey } from '@flank/database';

export async function dispatchAgent(stageKey: StageKey, inputArtifact: any): Promise<any> {
  // In Units 11-18, this will route to the specific agent implementation
  // e.g. switch(stageKey) { case 'PROFILER': return runProfiler(inputArtifact); ... }
  throw new Error(`Agent for ${stageKey} not yet implemented`);
}
