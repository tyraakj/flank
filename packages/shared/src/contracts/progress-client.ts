import { RunProgressEvent } from '../events/run-progress';

/**
 * Expected interface for the UI to consume Run Progress events.
 */
export interface ProgressStreamConsumer {
  /**
   * Connect to the SSE endpoint for a specific run.
   */
  connect(targetId: string, runId: string, lastEventId?: number): void;

  /**
   * Disconnect and clean up the EventSource.
   */
  disconnect(): void;

  /**
   * Idempotently merge a new event into the UI state based on eventId.
   */
  onEvent(event: RunProgressEvent): void;

  /**
   * Handle terminal states (cancellation, failure, or completion)
   * which may trigger a full refetch of the Run state from the BFF.
   */
  onTerminalEvent(event: RunProgressEvent): void;
}
