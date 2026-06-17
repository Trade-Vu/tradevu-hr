import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // In development, use pino-pretty for human-readable output
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  // In production, emit structured JSON
  base: {
    service: 'tradevu-hr-api',
    env: process.env.NODE_ENV || 'development',
  },
  // Redact any field that might accidentally contain secrets
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret'],
    censor: '[REDACTED]',
  },
});

export default logger;
