import { StageKey } from '@flank/database';

export const STAGE_SEQUENCE: StageKey[] = [
  'PROFILER',
  'DISCOVERY',
  'SEMANTIC_DEDUP',
  'VERIFIER',
  'PRICING',
  'FEATURE',
  'POSITIONING',
  'STRATEGIST',
  'CRITIC'
];

export function getNextStage(currentStage: StageKey): StageKey | null {
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === STAGE_SEQUENCE.length - 1) {
    return null;
  }
  return STAGE_SEQUENCE[currentIndex + 1];
}
