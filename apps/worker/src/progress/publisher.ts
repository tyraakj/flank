import { RunProgressEvent, _QUEUE_NAMES } from "@flank/shared";
import Redis from "ioredis";

// Parse redis URL from environment
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Setup isolated redis connection for the publisher
const publisher = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

publisher.on("error", (err) => {
  console.error("[Progress Publisher] Redis connection error:", err);
});

/**
 * Persists a RunEvent to Postgres and immediately publishes it to Redis.
 * Note: Should only be called *after* any related Prisma transactions commit.
 */
export async function publishRunEvent(
  runId: string,
  event: Omit<RunProgressEvent, "eventId">,
): Promise<void> {
  // 1. Generate an eventId using timestamp or let DB autoincrement
  // For simplicity, we'll let Prisma handle the ID and just map it to eventId.
  // Actually, our Prisma schema requires `eventId: Int`. We need to query max or use a sequence.
  // To avoid sequence locks, we'll just use Date.now() as a monotonic approximation for eventId
  const monotonicEventId = Date.now();

  const fullEvent: RunProgressEvent = {
    ...event,
    eventId: monotonicEventId,
  };

  try {
    // 2. Persist to Postgres (assuming Prisma is available here or we use a separate db client)
    // The spec requires: "Persist or append event envelopes to a bounded Run event log in Postgres"
    // For now, we'll import the Prisma client dynamically to avoid circular dependencies if any
    const { prisma } = await import("@flank/database");
    await prisma.runEvent.create({
      data: {
        eventId: monotonicEventId,
        runId: fullEvent.runId,
        targetId: fullEvent.targetId,
        type: fullEvent.type,
        stageKey: fullEvent.stageKey,
        stageStatus: fullEvent.stageStatus,
        summary: fullEvent.summary,
        elapsedMs: fullEvent.elapsedMs,
        payload: fullEvent.payload ? JSON.parse(JSON.stringify(fullEvent.payload)) : null,
        timestamp: new Date(fullEvent.timestamp),
      },
    });

    // 3. Publish to Redis channel
    const channelName = `run-events:${runId}`;
    await publisher.publish(channelName, JSON.stringify(fullEvent));
  } catch (err) {
    console.error("[Progress Publisher] Failed to publish event:", err);
  }
}
