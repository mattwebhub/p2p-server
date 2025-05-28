import express from 'express';
import { createServer } from 'http';
import { config } from './shared/config';
import { roomsRouter } from './rooms/routes';
import { SignalGateway } from './signal/redisAdapter';
import { RedisAdapterImpl } from './signal/redisAdapterImpl';
import { MockRedisAdapter } from './signal/redisAdapter';

// Initialize Express app
const app = express();
app.use(express.json());

// Basic health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Register routes
app.use('/rooms', roomsRouter);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket signaling with appropriate Redis adapter
let redisAdapter;
if (config.redisUrl) {
  console.log(`Initializing Redis adapter with URL: ${config.redisUrl}`);
  redisAdapter = new RedisAdapterImpl(config.redisUrl);
} else {
  console.log('Redis URL not provided, using mock adapter');
  redisAdapter = new MockRedisAdapter();
}

// Initialize SignalGateway with the server and Redis adapter
const signalGateway = new SignalGateway(server, redisAdapter);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

export { app, server, signalGateway };
