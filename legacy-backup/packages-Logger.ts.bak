export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.Info;
  private static enableConsoleLog: boolean = true;
  private static logs: Array<{level: LogLevel; message: string; timestamp: Date; context?: string}> = [];

  public static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public static debug(message: string, context?: string): void {
    this.log(LogLevel.Debug, message, context);
  }

  public static info(message: string, context?: string): void {
    this.log(LogLevel.Info, message, context);
  }

  public static warning(message: string, context?: string): void {
    this.log(LogLevel.Warning, message, context);
  }

  public static error(message: string, context?: string, error?: Error | unknown): void {
    this.log(LogLevel.Error, message, context, error);
  }

  private static log(level: LogLevel, message: string, context?: string, error?: Error | unknown): void {
    if (level < this.logLevel) return;

    const timestamp = new Date();
    const logEntry = {
      level,
      message,
      timestamp,
      context
    };

    this.logs.push(logEntry);

    if (this.enableConsoleLog) {
      const prefix = `[${LogLevel[level]}] [${timestamp.toISOString()}]${context ? ` [${context}]` : ''}`;
      
      switch (level) {
        case LogLevel.Debug:
          console.debug(prefix, message);
          break;
        case LogLevel.Info:
          console.info(prefix, message);
          break;
        case LogLevel.Warning:
          console.warn(prefix, message);
          break;
        case LogLevel.Error:
          console.error(prefix, message, error);
          break;
      }
    }
  }

  public static getLogs(): Array<{level: LogLevel; message: string; timestamp: Date; context?: string}> {
    return [...this.logs];
  }

  public static clearLogs(): void {
    this.logs = [];
  }
}