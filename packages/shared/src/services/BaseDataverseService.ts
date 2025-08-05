import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from './AuthService';

export interface IDataverseConfig {
  environment: string;
  apiVersion: string;
}

export interface IDataverseQueryOptions {
  select?: string[];
  filter?: string;
  orderBy?: string;
  top?: number;
  expand?: string[];
}

export abstract class BaseDataverseService<T> {
  protected authService: AuthService;
  protected config: IDataverseConfig;
  protected abstract tableName: string;

  constructor(context: WebPartContext, config: IDataverseConfig) {
    this.authService = new AuthService(context);
    this.config = config;
  }

  protected buildQueryString(options: IDataverseQueryOptions): string {
    const params: string[] = [];

    if (options.select && options.select.length > 0) {
      params.push(`$select=${options.select.join(',')}`);
    }

    if (options.filter) {
      params.push(`$filter=${options.filter}`);
    }

    if (options.orderBy) {
      params.push(`$orderby=${options.orderBy}`);
    }

    if (options.top) {
      params.push(`$top=${options.top}`);
    }

    if (options.expand && options.expand.length > 0) {
      params.push(`$expand=${options.expand.join(',')}`);
    }

    return params.length > 0 ? `?${params.join('&')}` : '';
  }

  public async getAll(options: IDataverseQueryOptions = {}): Promise<T[]> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const queryString = this.buildQueryString(options);
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching data from ${this.tableName}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.value as T[];
    } catch (error) {
      console.error(`Error in getAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async getById(id: string, options: IDataverseQueryOptions = {}): Promise<T> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const queryString = this.buildQueryString(options);
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}(${id})${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching record ${id} from ${this.tableName}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Error in getById for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async create(entity: Partial<T>): Promise<string> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(entity)
      });

      if (!response.ok) {
        throw new Error(`Error creating record in ${this.tableName}: ${response.statusText}`);
      }

      // Get the ID from the OData-EntityId header
      const entityIdHeader = response.headers.get('OData-EntityId');
      if (entityIdHeader) {
        const matches = entityIdHeader.match(/\(([^)]+)\)/);
        return matches ? matches[1] : '';
      }

      return '';
    } catch (error) {
      console.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async update(id: string, entity: Partial<T>): Promise<void> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}(${id})`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(entity)
      });

      if (!response.ok) {
        throw new Error(`Error updating record ${id} in ${this.tableName}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in update for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}(${id})`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error deleting record ${id} from ${this.tableName}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in delete for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async executeAction(actionName: string, parameters: any = {}): Promise<any> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${actionName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
        throw new Error(`Error executing action ${actionName}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error(`Error in executeAction for ${actionName}:`, error);
      throw error;
    }
  }
}