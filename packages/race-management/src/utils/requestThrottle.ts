/**
 * Request throttling utility to prevent browser resource exhaustion
 * Limits concurrent requests and implements a queue system
 */

export interface ThrottleOptions {
  maxConcurrent?: number;
  delayBetweenBatches?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

class RequestThrottle {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private delayBetweenBatches: number;
  private retryOnFailure: boolean;
  private maxRetries: number;

  constructor(options: ThrottleOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.delayBetweenBatches = options.delayBetweenBatches || 100;
    this.retryOnFailure = options.retryOnFailure !== false;
    this.maxRetries = options.maxRetries || 2;
  }

  /**
   * Add a request to the queue and process it when resources are available
   */
  public async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        let retries = 0;
        
        while (retries <= this.maxRetries) {
          try {
            const result = await requestFn();
            resolve(result);
            return;
          } catch (error) {
            console.warn(`Request failed (attempt ${retries + 1}/${this.maxRetries + 1}):`, error);
            
            // Check if it's a resource exhaustion error
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('INSUFFICIENT_RESOURCES') || 
                errorMessage.includes('Failed to fetch')) {
              // Wait longer before retrying resource errors
              await this.delay(1000 * (retries + 1));
            }
            
            if (!this.retryOnFailure || retries >= this.maxRetries) {
              reject(error);
              return;
            }
            
            retries++;
            await this.delay(500 * retries);
          }
        }
      };
      
      this.queue.push(wrappedRequest);
      this.processQueue();
    });
  }

  /**
   * Process requests in batches to avoid overwhelming the browser
   */
  public async processBatch<T>(
    items: T[], 
    requestFn: (item: T) => Promise<any>,
    batchSize?: number
  ): Promise<any[]> {
    const actualBatchSize = batchSize || this.maxConcurrent;
    const results: any[] = [];
    
    for (let i = 0; i < items.length; i += actualBatchSize) {
      const batch = items.slice(i, i + actualBatchSize);
      
      // Process batch with throttling
      const batchPromises = batch.map(item => 
        this.add(() => requestFn(item))
          .catch(error => {
            console.error('Batch item failed:', error);
            return null; // Return null for failed items instead of throwing
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to prevent resource exhaustion
      if (i + actualBatchSize < items.length) {
        await this.delay(this.delayBetweenBatches);
      }
    }
    
    return results;
  }

  private async processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.queue.shift();
      if (request) {
        this.activeRequests++;
        
        request().finally(() => {
          this.activeRequests--;
          // Process next request in queue
          if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), 50);
          }
        });
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the queue and reset counters
   */
  public clear() {
    this.queue = [];
    this.activeRequests = 0;
  }

  /**
   * Get current queue status
   */
  public getStatus() {
    return {
      queued: this.queue.length,
      active: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Create singleton instances for different use cases
export const apiThrottle = new RequestThrottle({
  maxConcurrent: 3,
  delayBetweenBatches: 200,
  retryOnFailure: true,
  maxRetries: 2
});

export const injuryApiThrottle = new RequestThrottle({
  maxConcurrent: 2, // Even more restrictive for injury API
  delayBetweenBatches: 500,
  retryOnFailure: true,
  maxRetries: 1
});

export default RequestThrottle;