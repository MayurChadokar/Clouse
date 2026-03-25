import ioredis from 'ioredis';

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Critical for BullMQ
};

const redisConnection = new ioredis({
    ...redisConfig,
    retryStrategy: (times) => {
        // Retry every 2-10 seconds
        return Math.min(times * 100, 10000);
    },
    // Prevent unhandled error event crashes
    lazyConnect: false, 
    maxRetriesPerRequest: null,
});

// A standard, global error handler for the master connection to prevent app crashes
redisConnection.on('error', (err) => {
    // Suppress logs unless it's something special, to avoid spam
    if (err.code !== 'ENOTFOUND' && err.code !== 'ECONNREFUSED') {
        console.error('❌ Redis Master Connection Error:', err.message);
    }
});

const connectRedis = async () => {
    console.log(`[Redis] Current status: ${redisConnection.status}`);
    return new Promise((resolve, reject) => {
        if (redisConnection.status === 'ready') {
            console.log('✅ Redis Connected for Queues (cached)');
            return resolve(redisConnection);
        }
        
        redisConnection.once('ready', () => {
            console.log('✅ Redis Connected for Queues');
            resolve(redisConnection);
        });
        
        redisConnection.once('error', (err) => {
            console.error('❌ Redis Connection Error:', err.message);
            reject(err);
        });
    });
};

export { connectRedis };
export default redisConnection;
