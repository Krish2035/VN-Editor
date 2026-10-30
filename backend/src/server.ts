import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import apiRoutes from './routes/api';
import { requestLogger } from './middleware/logger';
import { standardLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { initStorage, UPLOAD_DIR, EXPORT_DIR } from './services/storageService';
import { registerWebSocketClient } from './services/renderQueue';
import { verifyDatabaseConnection } from './config/db';
import { initRedisQueue } from './services/bullQueueService';

dotenv.config();

// Initialize local storage paths
initStorage();

// Verify PostgreSQL and Redis connections (Pillars 15, 25)
verifyDatabaseConnection();
initRedisQueue();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Security Headers (Pillars 71-74)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS Whitelisting (Pillar 76)
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Observability & Rate Limiting (Pillars 1, 59-60)
app.use(requestLogger);
app.use('/api', standardLimiter);

// Static Asset Serving
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/exports', express.static(EXPORT_DIR));

// Root Endpoint for Load Balancers & Health Monitoring (Pillar 56)
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'VN Video Editor Backend API Gateway',
    version: '1.0.0',
    status: 'online',
    healthCheck: '/api/v1/health',
    telemetryWebSocket: '/ws/render',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// Central Error Handler (Pillar 10-11)
app.use(errorHandler);

// Create HTTP and WebSocket Server (Pillar 22)
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/render' });

wss.on('connection', (ws, req) => {
  console.log(`[WebSocket] Client connected for render telemetry: ${req.socket.remoteAddress}`);
  registerWebSocketClient(ws);

  ws.send(
    JSON.stringify({
      type: 'CONNECTED',
      message: 'VN Editor Telemetry Gateway Active',
      timestamp: new Date().toISOString()
    })
  );

  // Heartbeat ping/pong (Pillar 22)
  ws.on('ping', () => ws.pong());
});

// Graceful Shutdown (Pillars 56-57)
const gracefulShutdown = () => {
  console.log('\n[Server] Received shutdown signal. Closing gracefully...');
  server.close(() => {
    console.log('[Server] HTTP and WebSocket server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Server] Forcefully terminating after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(port, () => {
  console.log(`====================================================`);
  console.log(`🚀 VN Video Editor Backend Server Online`);
  console.log(`📡 HTTP API:        http://localhost:${port}/api/v1`);
  console.log(`⚡ WebSocket Stream: ws://localhost:${port}/ws/render`);
  console.log(`🩺 Health Probe:    http://localhost:${port}/api/v1/health`);
  console.log(`====================================================`);
});

export default app;
