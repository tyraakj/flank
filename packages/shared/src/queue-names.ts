export const QUEUE_NAMES = {
  RUN_EXECUTE: "run.execute",
  STAGE_EXECUTE: "stage.execute",
  STAGE_REPLAY: "stage.replay",
  RUN_CANCEL: "run.cancel",
  DEAD_LETTER_REVIEW: "dead-letter.review",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
