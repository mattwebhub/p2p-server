import { WebCrawlerEngine } from "./golden-silk-local/src";
import { CrawlerConfig } from "./golden-silk-local/src/core/types/crawler";

async function testGoldenSilk() {
  console.log("Starting golden-silk direct test...");

  const engine = new WebCrawlerEngine();

  const config: CrawlerConfig = {
    startUrls: ["https://www.google.com"],
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
      persistPath: `./sessions/test-golden-silk`,
      saveInterval: 10000,
      autoRestore: false,
    },
    browser: {
      headless: true,
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
    extractionRules: [],
  };

  engine.on("started", () => {
    console.log("Golden-silk engine started.");
  });

  engine.on("stopped", () => {
    console.log("Golden-silk engine stopped.");
  });

  engine.on("error", (error) => {
    console.error("Golden-silk engine error:", error);
  });

  engine.on("urlProcessed", (result) => {
    console.log(`URL processed: ${result.url}`);
  });

  try {
    await engine.start(config);
    console.log("Golden-silk engine started successfully.");
    await engine.stop();
    console.log("Golden-silk engine stopped successfully.");
  } catch (error) {
    console.error("Error during golden-silk direct test:", error);
  }
}

testGoldenSilk();


