import Redis from 'ioredis';

// Parse redis URL from environment
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Factory for bullmq redis connections
export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});
