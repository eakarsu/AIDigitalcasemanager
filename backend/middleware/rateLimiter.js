const rateLimitMod = require('express-rate-limit');
const rateLimit = rateLimitMod.rateLimit || rateLimitMod;
const ipKeyGenerator = rateLimitMod.ipKeyGenerator || ((req) => req.ip);

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req, res) => req.user ? `user:${req.user.id}` : ipKeyGenerator(req, res),
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' }
});

module.exports = { aiRateLimiter };
