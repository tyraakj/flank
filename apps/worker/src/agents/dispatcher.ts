import { StageKey } from "@flank/database";
import { runProfilerAgent } from "./profiler";
import { runDiscoveryAgent } from "./discovery";
import { runVerifierAgent } from "./verifier";
import { runPricingAgent } from "./pricing";
import { runFeatureAgent } from "./feature";
import { runPositioningAgent } from "./positioning";

export async function dispatchAgent(
  runId: string,
  targetId: string,
  stageKey: StageKey,
  _inputArtifact: unknown,
): Promise<unknown> {
  switch (stageKey) {
    case "PROFILER":
      return runProfilerAgent(runId, targetId, _inputArtifact);
    case "DISCOVERY":
      return runDiscoveryAgent(runId, targetId, _inputArtifact);
    case "VERIFIER":
      return runVerifierAgent(runId, targetId, _inputArtifact);
    case "PRICING":
      return runPricingAgent(runId, targetId, _inputArtifact);
    case "FEATURE":
      return runFeatureAgent(runId, targetId, _inputArtifact);
    case "POSITIONING":
      return runPositioningAgent(runId, targetId, _inputArtifact);
    default:
      throw new Error(`Agent for ${stageKey} not yet implemented`);
  }
}
