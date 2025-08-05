export declare enum ErrorType {
    AuthenticationError = "AUTHENTICATION_ERROR",
    NetworkError = "NETWORK_ERROR",
    ValidationError = "VALIDATION_ERROR",
    UnknownError = "UNKNOWN_ERROR"
}
export interface IError {
    type: ErrorType;
    message: string;
    details?: any;
    timestamp: Date;
}
export declare class ErrorHandler {
    private static logErrors;
    static handleError(error: any, context?: string): IError;
    static setLogging(enabled: boolean): void;
    static formatErrorMessage(error: IError): string;
}
//# sourceMappingURL=ErrorHandler.d.ts.map