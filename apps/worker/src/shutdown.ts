import { Worker } from 'bullmq';
import { connection } from './queue';
// We will also import the prisma client later if we open a connection here, but the worker typically uses database from shared

export async function registerGracefulShutdown(workers: Worker[]) {
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}. Draining active work...`);
    
    // Stop accepting new jobs
    const closePromises = workers.map((worker) => worker.close());
    
    try {
      // Wait for active jobs until a deadline (e.g. 30s)
      await Promise.race([
        Promise.all(closePromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), 30000))
      ]);
      console.log('[Shutdown] All workers closed gracefully.');
    } catch (err) {
      console.error('[Shutdown] Failed to close workers within deadline:', err);
    } finally {
      // Disconnect redis
      connection.disconnect();
      console.log('[Shutdown] Redis disconnected. Exiting.');
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
