const redisRepository = require("../redis");

/**
 * @method function
 * @param {boolean} isLogin - Check if the route getting hits is the login route
 * @param {string} errMsg - Custom Error Message to be shown to the user, else the default is used.
 * @param {string} prefix - Prefix added to make the key stored in the store unique, if not provided, default is used.
 * @param {number} allowedHits - The number of requests the user can make to the API before their access to the API is blocked.
 * @param {number} secondsWindow - The windows in seconds the user is granted access to the API from their first call to the API.
 **/
exports.rateLimiter = ({secondsWindow, allowedHits, errMsg, prefix = '', isLogin = false}) => {
  return async (req, res, next) => {
    let requestIPs; // holds all IPs making request to the server
    const {email} = req.body, {userId} = req.params, ip = req.headers['x-forwarded-for'];
    const key = `${prefix || ip}_${email || userId || req?.authUser?._id || ip}`;

    // limit users requests based on their email, if not available, use the userId
    const numRequests = await redisRepository.redisAIncr({key});

    requestIPs = await redisRepository.getRedisAsync({key: 'requestIPs'});
    if (!requestIPs) {
      await redisRepository.setRedisAsync({
        key: 'requestIPs', value: JSON.stringify({[ip]: {hits: 1, emails: [email]}}), expiry: 604800
      });
    } else {
      requestIPs = JSON.parse(requestIPs);
      const existingIP = requestIPs?.[ip];
      requestIPs = !existingIP?.hits ? {...requestIPs, [ip]: {hits: 1, emails: [email]}}
        : {...requestIPs, [ip]: {emails: [...new Set([...existingIP.emails, email])], hits: existingIP.hits + 1}};
      await redisRepository.setRedisAsync({key: 'requestIPs', value: JSON.stringify(requestIPs), expiry: 604800});
    }

    let ttl
    // noinspection JSIncompatibleTypesComparison
    if (numRequests === 1) {
      await redisRepository.redisExpire({key, expire: secondsWindow});
      ttl = secondsWindow;
    } else {
      ttl = await redisRepository.redisTTL({key});
    }

    /**
     * Using GitHub's type of Rate Limit headers:
     * X-RateLimit-Limit: The maximum number of requests you're permitted to make per hour.
     * X-RateLimit-Remaining: The number of requests remaining in the current rate limit window.
     * X-RateLimit-Reset: the time at which the current rate limit window resets in UTC epoch seconds
     **/
    res.set({
      'X-RateLimit-Reset': ttl,
      'X-RateLimit-Limit': allowedHits,
      'X-RateLimit-Remaining': numRequests > allowedHits ? 0 : allowedHits - numRequests,
    });

    const seconds = ttl % 60;
    const minutes = Math.floor(ttl / 60);
    const hours = Math.floor(ttl / (60 * 60));
    const remainderMinutes = minutes % 60; // (ttl/60)%60
    const remainderTime = minutes < 1 ? `${seconds} seconds.` : hours >= 1 ? `${hours} hour, ${remainderMinutes} minutes.` : `${minutes} minute.`;
    const message = isLogin ? `we noticed a rather strange activity from you, login again in ${remainderTime}`
      : errMsg ? `${errMsg} ${remainderTime}` : `too many requests made to our server, please try again in ${remainderTime}`;

    if (numRequests > allowedHits) return res.status(429).json({ttl, message, totalCalls: numRequests, success: false});
    next()
  }
}
