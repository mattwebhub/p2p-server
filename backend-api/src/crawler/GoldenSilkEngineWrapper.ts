import { WebCrawlerEngine } from "../../golden-silk-local/src/core/crawler";
import { CrawlerConfig, CrawlerStatus } from "../../golden-silk-local/src/core/types/crawler";
import { EventEmitter } from "events";

export class GoldenSilkEngineWrapper extends EventEmitter {
  private engine: WebCrawlerEngine | null = null;
  private config: CrawlerConfig | null = null;
  private isInitialized: boolean = false;

  async initialize(config: CrawlerConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn("GoldenSilkEngineWrapper already initialized.");
      return;
    }
    this.config = config;
    this.engine = new WebCrawlerEngine();

    // Re-attach event listeners from the wrapper to the actual engine
    // This allows external listeners to subscribe to the wrapper and receive engine events
    this.engine.on("started", () => super.emit("started"));
    this.engine.on("stopped", () => super.emit("stopped"));
    this.engine.on("error", (error) => super.emit("error", error));
    this.engine.on("urlProcessed", (result) => super.emit("urlProcessed", result));
    this.engine.on("progress", (status, metrics) => super.emit("progress", status, metrics));

    try {
      await this.engine.start(this.config);
      this.isInitialized = true;
      console.log("GoldenSilkEngineWrapper initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize GoldenSilkEngineWrapper:", error);
      this.isInitialized = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isInitialized || !this.engine) {
      console.warn("GoldenSilkEngineWrapper not initialized, cannot stop.");
      return;
    }
    await this.engine.stop();
    this.isInitialized = false;
    this.engine = null;
    this.config = null;
    console.log("GoldenSilkEngineWrapper stopped.");
  }

  getStatus(): CrawlerStatus | null {
    if (!this.isInitialized || !this.engine) {
      console.warn("GoldenSilkEngineWrapper not initialized, cannot get status.");
      return null;
    }
    return this.engine.getStatus();
  }
}


