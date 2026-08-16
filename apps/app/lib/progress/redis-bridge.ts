import Redis from "ioredis";
import { RunProgressEvent, RunProgressEventSchema } from "@flank/shared";
import { prisma } from "@flank/database";

// A single shared redis connection for pub/sub is not possible for subscriptions because a subscriber connection cannot issue standard commands.
// Thus, we instantiate a new Redis connection per stream or use a connection pool.
// For SSE, it's better to create a subscriber per request so they don't block each other.
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export async function createProgressStream(
  runId: string,
  lastEventId?: number,
): Promise<ReadableStream> {
  const channelName = `run-events:${runId}`;
  const subscriber = new Redis(redisUrl, { maxRetriesPerRequest: null });

  let missedEvents: RunProgressEvent[] = [];

  // Replay logic
  if (lastEventId !== undefined) {
    // Query Postgres for missed events after lastEventId
    const events = await prisma.runEvent.findMany({
      where: {
        runId,
        eventId: { gt: lastEventId },
      },
      orderBy: { eventId: "asc" },
    });

    missedEvents = events.map((e) => ({
      eventId: e.eventId,
      type: e.type as import("@flank/shared").RunProgressEvent["type"],
      runId: e.runId,
      targetId: e.targetId,
      stageKey: e.stageKey,
      stageStatus: e.stageStatus,
      summary: e.summary,
      elapsedMs: e.elapsedMs,
      payload: e.payload as import("@flank/shared").RunProgressEvent["payload"],
      timestamp: e.timestamp.toISOString(),
    }));
  }

  let heartbeatInterval: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send missed events first
      for (const event of missedEvents) {
        controller.enqueue(
          `id: ${event.eventId}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`,
        );
      }

      // 2. Subscribe to live events
      await subscriber.subscribe(channelName, (err, _count) => {
        if (err) {
          console.error(`[Redis Bridge] Failed to subscribe to ${channelName}:`, err);
        }
      });

      subscriber.on("message", (channel, message) => {
        if (channel === channelName) {
          try {
            const rawEvent = JSON.parse(message);
            const event = RunProgressEventSchema.parse(rawEvent);
            // Deduplicate if we already sent this event in replay
            if (lastEventId !== undefined && event.eventId <= lastEventId) {
              return;
            }
            if (missedEvents.some((m) => m.eventId === event.eventId)) {
              return;
            }

            controller.enqueue(
              `id: ${event.eventId}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`,
            );
          } catch (err) {
            console.error("[Redis Bridge] Invalid event received:", err);
          }
        }
      });

      // 3. Heartbeat
      heartbeatInterval = setInterval(() => {
        controller.enqueue(`: heartbeat\n\n`); // comment line as heartbeat
      }, 15000); // 15s to keep proxies alive
    },
    cancel() {
      subscriber.unsubscribe(channelName);
      subscriber.quit();
      clearInterval(heartbeatInterval);
    },
  });

  return stream;
}
