/**
 * Log levels for categorization
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Log entry structure
 */
export interface ILogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  correlationId?: string;
}

/**
 * Logger configuration
 */
export interface ILoggerConfig {
  minLevel: LogLevel;
  maxLogSize: number;
  enableConsole: boolean;
  enableStorage: boolean;
  storageKey: string;
}

/**
 * Unified Logger for all packages
 * Provides consistent logging with multiple outputs and log management
 */
export class UnifiedLogger {
  private static instance: UnifiedLogger;
  private logs: ILogEntry[] = [];
  private config: ILoggerConfig;
  
  private readonly DEFAULT_CONFIG: ILoggerConfig = {
    minLevel: LogLevel.INFO,
    maxLogSize: 1000,
    enableConsole: true,
    enableStorage: true,
    storageKey: 'grnsw_spfx_logs'
  };

  private constructor(config?: Partial<ILoggerConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.loadLogsFromStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<ILoggerConfig>): UnifiedLogger {
    if (!this.instance) {
      this.instance = new UnifiedLogger(config);
    }
    return this.instance;
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log error message
   */
  public error(message: string, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    // Check if we should log this level
    if (level < this.config.minLevel) {
      return;
    }

    const entry: ILogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
      correlationId: this.getCorrelationId(data)
    };

    // Add to in-memory logs
    this.addLog(entry);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Save to storage if enabled
    if (this.config.enableStorage) {
      this.saveLogsToStorage();
    }
  }

  /**
   * Add log entry to memory
   */
  private addLog(entry: ILogEntry): void {
    this.logs.push(entry);
    
    // Trim logs if exceeding max size
    if (this.logs.length > this.config.maxLogSize) {
      this.logs = this.logs.slice(-this.config.maxLogSize);
    }
  }

  /**
   * Log to browser console
   */
  private logToConsole(entry: ILogEntry): void {
    const prefix = `[${this.getLevelString(entry.level)}]${entry.context ? ` [${entry.context}]` : ''}`;
    const timestamp = entry.timestamp.toISOString();
    const message = `${timestamp} ${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }

  /**
   * Get string representation of log level
   */
  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Extract correlation ID from data if present
   */
  private getCorrelationId(data?: any): string | undefined {
    if (!data) return undefined;
    return data.correlationId || data.requestId || data.traceId;
  }

  /**
   * Save logs to local storage
   */
  private saveLogsToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const logsToStore = this.logs.slice(-100); // Store only last 100 logs
      localStorage.setItem(this.config.storageKey, JSON.stringify(logsToStore));
    } catch (error) {
      // Silently fail if storage is full or unavailable
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs from local storage
   */
  private loadLogsFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const logs = JSON.parse(stored);
        this.logs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      // Silently fail if storage is corrupted
      console.warn('Failed to load logs from storage:', error);
    }
  }

  /**
   * Get all logs
   */
  public getLogs(level?: LogLevel): ILogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Get logs by context
   */
  public getLogsByContext(context: string): ILogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  /**
   * Get logs by correlation ID
   */
  public getLogsByCorrelationId(correlationId: string): ILogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  public exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Context', 'Message', 'Correlation ID'];
    const rows = this.logs.map(log => [
      log.timestamp.toISOString(),
      this.getLevelString(log.level),
      log.context || '',
      log.message,
      log.correlationId || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Set minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Enable or disable console logging
   */
  public setConsoleLogging(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }

  /**
   * Enable or disable storage logging
   */
  public setStorageLogging(enabled: boolean): void {
    this.config.enableStorage = enabled;
  }

  /**
   * Get current configuration
   */
  public getConfig(): ILoggerConfig {
    return { ...this.config };
  }
}