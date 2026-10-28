import rateLimit from 'express-rate-limit';

const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

export const standardLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please retry after some time.',
    retryAfterSec: Math.ceil(windowMs / 1000)
  }
});

// Stricter rate limit for expensive operations like video rendering (Pillars 1, 88)
export const renderJobLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many render requests initiated. Please wait for current jobs to finish.'
  }
});
