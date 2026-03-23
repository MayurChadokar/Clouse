import { createClient } from 'redis';

const IS_REDIS_CONFIGURED = !!(process.env.REDIS_URL || process.env.REDIS_HOST);

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

let redisClient = null;

if (IS_REDIS_CONFIGURED) {
    redisClient = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        console.log('📡 Redis client connecting...');
    });

    redisClient.on('ready', () => {
        console.log('✅ Redis client ready and connected');
    });
}

export const connectRedis = async () => {
    if (!IS_REDIS_CONFIGURED) {
        console.log('ℹ️  Redis not configured. Skipping connection.');
        return;
    }
    
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error.message);
    }
};

export default redisClient;
