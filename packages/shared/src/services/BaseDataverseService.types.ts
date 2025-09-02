/**
 * Types for BaseDataverseService
 */

export interface IDataverseOptions {
  filter?: string;
  select?: string | string[];
  expand?: string;
  orderBy?: string;
  top?: number;
  skip?: number;
}

export interface IDataverseResponse<T> {
  value: T[];
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
}

export interface IDataverseError {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}

export interface IODataQuery {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $count?: boolean;
}