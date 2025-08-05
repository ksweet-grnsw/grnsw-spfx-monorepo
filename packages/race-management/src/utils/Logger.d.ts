export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3
}
export declare class Logger {
    private static logLevel;
    private static enableConsoleLog;
    private static logs;
    static setLogLevel(level: LogLevel): void;
    static debug(message: string, context?: string): void;
    static info(message: string, context?: string): void;
    static warning(message: string, context?: string): void;
    static error(message: string, context?: string, error?: any): void;
    private static log;
    static getLogs(): Array<{
        level: LogLevel;
        message: string;
        timestamp: Date;
        context?: string;
    }>;
    static clearLogs(): void;
}
//# sourceMappingURL=Logger.d.ts.map