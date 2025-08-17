/**
 * Manages queued optimistic updates to prevent race conditions
 * and ensure updates are applied in the correct order
 */
export class OptimisticQueueManager {
  private queue: Map<string, Promise<any>> = new Map();
  private activeOperations: Set<string> = new Set();
  private operationHistory: Array<{
    id: string;
    timestamp: number;
    status: 'pending' | 'success' | 'failed' | 'rolled-back';
    duration?: number;
  }> = [];

  /**
   * Queue an optimistic operation
   * @param operationId Unique identifier for the operation
   * @param operation The async operation to perform
   * @param options Options for the operation
   */
  public async queueOperation<T>(
    operationId: string,
    operation: () => Promise<T>,
    options?: {
      debounce?: number;
      priority?: 'high' | 'normal' | 'low';
      cancelPrevious?: boolean;
    }
  ): Promise<T> {
    const startTime = Date.now();

    // Cancel previous operation if requested
    if (options?.cancelPrevious && this.queue.has(operationId)) {
      this.cancelOperation(operationId);
    }

    // Add to active operations
    this.activeOperations.add(operationId);
    
    // Add to history
    this.operationHistory.push({
      id: operationId,
      timestamp: startTime,
      status: 'pending'
    });

    // Create promise for this operation
    const operationPromise = new Promise<T>(async (resolve, reject) => {
      try {
        // Wait for debounce if specified
        if (options?.debounce) {
          await new Promise(r => setTimeout(r, options.debounce));
        }

        // Check if operation was cancelled during debounce
        if (!this.activeOperations.has(operationId)) {
          throw new Error('Operation cancelled');
        }

        // Execute the operation
        const result = await operation();

        // Update history
        const historyEntry = this.operationHistory.find(h => h.id === operationId && h.status === 'pending');
        if (historyEntry) {
          historyEntry.status = 'success';
          historyEntry.duration = Date.now() - startTime;
        }

        resolve(result);
      } catch (error) {
        // Update history
        const historyEntry = this.operationHistory.find(h => h.id === operationId && h.status === 'pending');
        if (historyEntry) {
          historyEntry.status = 'failed';
          historyEntry.duration = Date.now() - startTime;
        }

        reject(error);
      } finally {
        // Remove from active operations
        this.activeOperations.delete(operationId);
        this.queue.delete(operationId);
      }
    });

    // Add to queue
    this.queue.set(operationId, operationPromise);

    return operationPromise;
  }

  /**
   * Cancel an operation
   */
  public cancelOperation(operationId: string): void {
    this.activeOperations.delete(operationId);
    this.queue.delete(operationId);
    
    const historyEntry = this.operationHistory.find(h => h.id === operationId && h.status === 'pending');
    if (historyEntry) {
      historyEntry.status = 'rolled-back';
    }
  }

  /**
   * Cancel all operations
   */
  public cancelAll(): void {
    this.activeOperations.clear();
    this.queue.clear();
    
    this.operationHistory
      .filter(h => h.status === 'pending')
      .forEach(h => h.status = 'rolled-back');
  }

  /**
   * Check if an operation is active
   */
  public isOperationActive(operationId: string): boolean {
    return this.activeOperations.has(operationId);
  }

  /**
   * Get count of active operations
   */
  public getActiveOperationCount(): number {
    return this.activeOperations.size;
  }

  /**
   * Wait for all operations to complete
   */
  public async waitForAll(): Promise<void> {
    const promises = Array.from(this.queue.values());
    // Use Promise.all with catch to handle ES5 compatibility
    try {
      await Promise.all(promises);
    } catch {
      // Ignore errors, just wait for all to complete
    }
  }

  /**
   * Get operation history
   */
  public getHistory() {
    return [...this.operationHistory];
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.operationHistory = this.operationHistory.filter(h => h.status === 'pending');
  }
}

// Singleton instance
export const optimisticQueueManager = new OptimisticQueueManager();