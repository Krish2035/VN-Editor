import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface TracedRequest extends Request {
  traceId?: string;
  startTime?: number;
}

export const requestLogger = (req: TracedRequest, res: Response, next: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  req.traceId = traceId;
  req.startTime = Date.now();
  res.setHeader('X-Trace-ID', traceId);

  res.on('finish', () => {
    const durationMs = req.startTime ? Date.now() - req.startTime : 0;
    const logEntry = {
      timestamp: new Date().toISOString(),
      traceId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.socket.remoteAddress
    };

    // Structured JSON log output (Pillar 59-60)
    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ level: 'ERROR', ...logEntry }));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify({ level: 'WARN', ...logEntry }));
    } else {
      console.log(JSON.stringify({ level: 'INFO', ...logEntry }));
    }
  });

  next();
};
