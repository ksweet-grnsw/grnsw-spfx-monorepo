export enum LogLevel {
  Error = 0,
  Warning = 1,
  Info = 2,
  Debug = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.Info;
  private prefix: string = '[GRNSW SPFx]';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  public error(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.Error) {
      console.error(`${this.prefix} [ERROR] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.Warning) {
      console.warn(`${this.prefix} [WARN] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.Info) {
      console.info(`${this.prefix} [INFO] ${message}`, ...args);
    }
  }

  public debug(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.Debug) {
      console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
    }
  }

  public log(message: string, ...args: any[]): void {
    this.info(message, ...args);
  }
}