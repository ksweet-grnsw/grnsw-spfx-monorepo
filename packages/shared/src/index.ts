// Services
export { AuthService } from './services/AuthService';
export { BaseDataverseService } from './services/BaseDataverseService';
export type { IDataverseConfig, IDataverseQueryOptions } from './services/BaseDataverseService';

// Config
export { dataverseConfig, dataverseTables } from './config/dataverseConfig';

// Utils
export { Logger, LogLevel } from './utils/Logger';
export { ErrorHandler } from './utils/ErrorHandler';
export type { IError } from './utils/ErrorHandler';

// Common interfaces
export interface IBaseEntity {
  createdon: string;
  modifiedon: string;
  statecode: number;
  statuscode: number;
}