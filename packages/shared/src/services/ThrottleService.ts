/**
 * Request queue item
 */
interface IQueueItem<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
  retries: number;
}

/**
 * Throttle configuration
 */
export interface IThrottleConfig {
  requestsPerSecond: number;
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number;
  burstSize?: number; // Allow burst of requests
  cooldownPeriod?: number; // Cooldown after burst
}

/**
 * Throttle statistics
 */
export interface IThrottleStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriedRequests: number;
  queuedRequests: number;
  droppedRequests: number;
  averageWaitTime: number;
}

/**
 * Unified Throttle Service for API rate limiting
 * Implements token bucket algorithm with queue management
 */
export class ThrottleService {
  private queue: IQueueItem<any>[] = [];
  private tokens: number;
  private lastRefill: number = Date.now();
  private processing = false;
  private stats: IThrottleStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    queuedRequests: 0,
    droppedRequests: 0,
    averageWaitTime: 0
  };
  private waitTimes: number[] = [];
  private burstTokens: number = 0;
  private inCooldown = false;
  private cooldownEndTime = 0;

  constructor(private config: IThrottleConfig) {
    this.tokens = config.requestsPerSecond;
    this.burstTokens = config.burstSize || 0;
  }

  /**
   * Execute a throttled request
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem: IQueueItem<T> = {
        execute: fn,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0
      };

      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        this.stats.droppedRequests++;
        reject(new Error('Request queue is full. Please try again later.'));
        return;
      }

      // Add to queue
      this.queue.push(queueItem);
      this.stats.queuedRequests = this.queue.length;
      this.stats.totalRequests++;

      // Process queue if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Check if in cooldown
      if (this.inCooldown && Date.now() < this.cooldownEndTime) {
        await this.delay(this.cooldownEndTime - Date.now());
        this.inCooldown = false;
      }

      // Refill tokens
      this.refillTokens();

      // Check if we have tokens available
      if (this.tokens < 1 && this.burstTokens < 1) {
        // Wait for next token
        const waitTime = this.getWaitTimeForNextToken();
        await this.delay(waitTime);
        continue;
      }

      // Get next item from queue
      const item = this.queue.shift();
      if (!item) continue;

      // Update stats
      const waitTime = Date.now() - item.timestamp;
      this.waitTimes.push(waitTime);
      if (this.waitTimes.length > 100) {
        this.waitTimes.shift();
      }
      this.stats.averageWaitTime = this.calculateAverageWaitTime();
      this.stats.queuedRequests = this.queue.length;

      // Use burst token if available and regular tokens depleted
      if (this.tokens < 1 && this.burstTokens > 0) {
        this.burstTokens--;
        
        // Start cooldown if burst tokens depleted
        if (this.burstTokens === 0 && this.config.cooldownPeriod) {
          this.inCooldown = true;
          this.cooldownEndTime = Date.now() + this.config.cooldownPeriod;
        }
      } else {
        this.tokens--;
      }

      // Execute the request
      try {
        const result = await item.execute();
        this.stats.successfulRequests++;
        item.resolve(result);
      } catch (error) {
        // Check if we should retry
        if (this.shouldRetry(error) && item.retries < this.config.maxRetries) {
          item.retries++;
          this.stats.retriedRequests++;
          
          // Re-queue with delay
          setTimeout(() => {
            this.queue.unshift(item);
            this.processQueue();
          }, this.config.retryDelay * Math.pow(2, item.retries)); // Exponential backoff
        } else {
          this.stats.failedRequests++;
          item.reject(error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.config.requestsPerSecond;
    
    this.tokens = Math.min(
      this.config.requestsPerSecond,
      this.tokens + tokensToAdd
    );
    
    // Refill burst tokens if cooldown has passed
    if (!this.inCooldown && this.config.burstSize) {
      this.burstTokens = this.config.burstSize;
    }
    
    this.lastRefill = now;
  }

  /**
   * Get wait time for next token
   */
  private getWaitTimeForNextToken(): number {
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.config.requestsPerSecond) * 1000;
  }

  /**
   * Check if error is retryable
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors or 429 (rate limit) or 503 (service unavailable)
    if (!error) return false;
    
    const status = error.status || error.statusCode;
    if (status === 429 || status === 503) return true;
    
    const message = error.message?.toLowerCase() || '';
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('econnreset');
  }

  /**
   * Calculate average wait time
   */
  private calculateAverageWaitTime(): number {
    if (this.waitTimes.length === 0) return 0;
    const sum = this.waitTimes.reduce((a, b) => a + b, 0);
    return sum / this.waitTimes.length;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current statistics
   */
  public getStats(): IThrottleStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedRequests: this.queue.length,
      droppedRequests: 0,
      averageWaitTime: 0
    };
    this.waitTimes = [];
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  public clearQueue(): void {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.reject(new Error('Queue cleared'));
      }
    }
    this.stats.queuedRequests = 0;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<IThrottleConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reset tokens if rate changed
    if (config.requestsPerSecond) {
      this.tokens = config.requestsPerSecond;
    }
    
    // Reset burst tokens if burst size changed
    if (config.burstSize !== undefined) {
      this.burstTokens = config.burstSize;
    }
  }

  /**
   * Create a throttled function
   */
  public createThrottledFunction<T>(
    fn: (...args: any[]) => Promise<T>
  ): (...args: any[]) => Promise<T> {
    return (...args: any[]) => {
      return this.execute(() => fn(...args));
    };
  }
}

/**
 * Factory function to create throttle service with common presets
 */
export class ThrottleFactory {
  /**
   * Create throttle for Dataverse API
   */
  public static createDataverseThrottle(requestsPerSecond: number = 100): ThrottleService {
    return new ThrottleService({
      requestsPerSecond,
      maxQueueSize: 1000,
      maxRetries: 3,
      retryDelay: 1000,
      burstSize: requestsPerSecond * 2, // Allow double burst
      cooldownPeriod: 5000 // 5 second cooldown after burst
    });
  }

  /**
   * Create throttle for SharePoint API
   */
  public static createSharePointThrottle(): ThrottleService {
    return new ThrottleService({
      requestsPerSecond: 150,
      maxQueueSize: 500,
      maxRetries: 2,
      retryDelay: 500
    });
  }

  /**
   * Create strict throttle (no burst, no retry)
   */
  public static createStrictThrottle(requestsPerSecond: number): ThrottleService {
    return new ThrottleService({
      requestsPerSecond,
      maxQueueSize: 100,
      maxRetries: 0,
      retryDelay: 0
    });
  }
}