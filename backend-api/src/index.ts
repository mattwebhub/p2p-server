import express, { Request, Response, NextFunction, Router } from "express";
import { createServer } from "http";
import { config } from "./shared/config";
import { roomsRouter } from "./rooms/routes";
import { SignalGateway } from "./signal/enhancedGateway";
import { RedisAdapterImpl } from "./signal/redisAdapterImpl";
import { MockRedisAdapter } from "./signal/redisAdapter";
import { corsMiddleware } from "./shared/cors";
import { CrawlerService } from "./crawler/CrawlerService";

// Initialize Express app
const app = express();
app.use(corsMiddleware);
app.use(express.json());

// Basic health check endpoint
app.get("/healthz", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Initialize CrawlerService
const crawlerService = new CrawlerService();

// Create a new router for crawler API routes
const crawlerRouter = Router();

// Crawler API routes
crawlerRouter.post("/start", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, chatUrl, config } = req.body;
    if (!sessionId || !chatUrl) {
      res.status(400).json({ error: "sessionId and chatUrl are required." });
      return;
    }
    const session = await crawlerService.startCrawlerSession(sessionId, chatUrl, config);
    res.status(200).json({ message: "Crawler session started", sessionId: session.id, chatUrl: session.chatUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

crawlerRouter.post("/stop", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required." });
      return;
    }
    await crawlerService.stopCrawlerSession(sessionId);
    res.status(200).json({ message: "Crawler session stopped" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

crawlerRouter.get("/status/:sessionId", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const status = crawlerService.getCrawlerStatus(sessionId);
    res.status(200).json(status);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

crawlerRouter.post("/send-message", async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      res.status(400).json({ error: "sessionId and message are required." });
      return;
    }
    await crawlerService.sendMessage(sessionId, message);
    res.status(200).json({ message: "Message sent" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register routers
app.use("/crawler", crawlerRouter); // Mount crawler router
app.use("/rooms", roomsRouter);

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket signaling with appropriate Redis adapter
let redisAdapter;
if (config.redisUrl) {
  console.log(`Initializing Redis adapter with URL: ${config.redisUrl}`);
  redisAdapter = new RedisAdapterImpl(config.redisUrl);
} else {
  console.log("Redis URL not provided, using mock adapter");
  redisAdapter = new MockRedisAdapter();
}

// Initialize SignalGateway with the server and Redis adapter
const signalGateway = new SignalGateway(server, redisAdapter);

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

export { app, server, signalGateway };


