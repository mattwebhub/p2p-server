import { WebCrawlerEngine } from "../../golden-silk-local/src/core/crawler";
import { CrawlerConfig } from "../../golden-silk-local/src/core/types/crawler";
import { EventEmitter } from "events";

interface CrawlerSession {
  id: string;
  engine: WebCrawlerEngine;
  status: "idle" | "running" | "paused" | "stopped" | "error";
  chatUrl: string;
  // Add any other session-specific data here
}

export class CrawlerService extends EventEmitter {
  private sessions: Map<string, CrawlerSession> = new Map();

  constructor() {
    super();
  }

  async startCrawlerSession(
    sessionId: string,
    chatUrl: string,
    config: Partial<CrawlerConfig>
  ): Promise<CrawlerSession> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session with ID ${sessionId} already exists.`);
    }

    const engine = new WebCrawlerEngine();

    const session: CrawlerSession = {
      id: sessionId,
      engine,
      status: "running",
      chatUrl,
    };
    this.sessions.set(sessionId, session);

    // Basic configuration for golden-silk
    const defaultConfig: CrawlerConfig = {
      startUrls: [chatUrl],
      maxDepth: 1,
      maxPages: 1,
      concurrency: 1,
      requestDelay: 1000,
      maxRetries: 3,
      timeout: 30000,
      respectRobotsTxt: false,
      userAgent: "Mozilla/5.0 (compatible; GoldenSilk/1.0)",
      rateLimiting: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        requestsPerHour: 1800,
        domainDelay: 1000,
        respectRetryAfter: true,
      },
      session: {
        enabled: true,
        persistPath: `./sessions/${sessionId}`,
        saveInterval: 10000,
        autoRestore: false,
      },
      browser: {
        headless: true, // Set to false for debugging
        viewport: { width: 1280, height: 800 },
        timeout: 30000,
        slowMo: 0,
        devtools: false,
        maxPages: 1,
        pageTimeout: 30000,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMIT"],
      },
      extractionRules: [], // To be defined based on chat website structure
    };

    const finalConfig: CrawlerConfig = { ...defaultConfig, ...config };

    // Set up event listeners for the crawler engine, only logging for now
    engine.on("started", () => {
      console.log(`[CrawlerService] Event: started. Session ID: ${sessionId}`);
      this.emit("crawlerStarted", sessionId);
    });

    engine.on("stopped", () => {
      console.log(`[CrawlerService] Event: stopped. Session ID: ${sessionId}`);
      this.emit("crawlerStopped", sessionId);
    });

    engine.on("error", (error) => {
      console.error(`[CrawlerService] Event: error. Session ID: ${sessionId}, Error:`, error);
      this.emit("crawlerError", sessionId, error);
    });

    engine.on("urlProcessed", (result) => {
      console.log(`[CrawlerService] Event: urlProcessed. Session ID: ${sessionId}, URL: ${result.url}`);
      this.emit("urlProcessed", sessionId, result);
      if (result.data && result.data.chatMessages) {
        this.emit("chatMessages", sessionId, result.data.chatMessages);
      }
    });

    engine.on("progress", (status, metrics) => {
      // console.log(`[CrawlerService] Event: progress. Session ID: ${sessionId}, Status:`, status);
      this.emit("crawlerProgress", sessionId, status, metrics);
    });

    await engine.start(finalConfig);

    return session;
  }

  async stopCrawlerSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }
    await session.engine.stop();
    session.status = "stopped"; // Update status after stopping
    this.sessions.delete(sessionId);
  }

  getCrawlerStatus(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }
    return session.engine.getStatus();
  }

  // Placeholder for sending messages to the chat website
  async sendMessage(sessionId: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found.`);
    }
    // This would involve golden-silk interacting with the page to send the message
    console.log(`Sending message in session ${sessionId}: ${message}`);
    // Example: await session.engine.executeScriptOnPage(sessionId, "document.querySelector(\"#chat-input\").value = \"" + message + "\"; document.querySelector(\"#send-button\").click();");
    this.emit("messageSent", sessionId, message);
  }
}


