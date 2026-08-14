import redis from "../config/redis.js";

export async function rateLimiter(req,res,next) {
    const checkKey = `ratelimit:${req.ip}`;
    const count = await redis.incr(checkKey)
    if(1 === count){
        await redis.expire(checkKey, 60)
    }
    if(5 === count){
        await redis.expire(checkKey,60)
    }
    if(5 < count){
        return res.status(429).json({success: false, message: 'Try again after some time!'})
    }

    next()
}

export async function refreshRateLimiter(req,res,next) {

    const checkKey = `refreshlimit:${req.ip}`;
    const count = await redis.incr(checkKey)
    if(1 === count){
        await redis.expire(checkKey, 1)
    }
    if(3 === count){
        await redis.expire(checkKey,5)
    }
    if(4 < count){
        
        return res.status(429).json({success: false, message: 'Too many requests wait 5s!'})
    }

    next()
}