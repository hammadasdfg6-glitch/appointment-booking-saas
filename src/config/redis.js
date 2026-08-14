import Redis from 'ioredis';
import "dotenv/config";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null
})

redis.on('error', err => console.log('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Client Connected to Cloud!'));

export default redis;
