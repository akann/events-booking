import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';

const redisClient = new Redis(parseInt(redisPort), redisHost);

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export default redisClient;
