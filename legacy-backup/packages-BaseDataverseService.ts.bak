import { WebPartContext } from '@microsoft/sp-webpart-base';

export abstract class BaseDataverseService<T> {
  protected context: WebPartContext;
  protected environment = "https://orgfc8a11f1.crm6.dynamics.com"; // GRNSW injury data environment
  protected apiVersion = "v9.2";
  protected abstract tableName: string;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  protected async getHeaders(): Promise<HeadersInit> {
    const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
    const accessToken = await tokenProvider.getToken(this.environment);
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json'
    };
  }

  public async getAll(options?: {
    filter?: string;
    orderBy?: string;
    select?: string[];
    top?: number;
  }): Promise<T[]> {
    try {
      const headers = await this.getHeaders();
      let url = `${this.environment}/api/data/${this.apiVersion}/${this.tableName}`;
      
      const queryParts: string[] = [];
      if (options?.filter) queryParts.push(`$filter=${options.filter}`);
      if (options?.orderBy) queryParts.push(`$orderby=${options.orderBy}`);
      if (options?.select) queryParts.push(`$select=${options.select.join(',')}`);
      if (options?.top) queryParts.push(`$top=${options.top}`);
      
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  public async getById(id: string): Promise<T | null> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.environment}/api/data/${this.apiVersion}/${this.tableName}(${id})`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data by ID:', error);
      throw error;
    }
  }

  public async create(entity: Partial<T>): Promise<string> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.environment}/api/data/${this.apiVersion}/${this.tableName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(entity)
      });

      if (!response.ok) {
        throw new Error(`Failed to create entity: ${response.statusText}`);
      }

      // Get the ID from the OData-EntityId header
      const entityIdHeader = response.headers.get('OData-EntityId');
      if (entityIdHeader) {
        const match = entityIdHeader.match(/\(([^)]+)\)/);
        return match ? match[1] : '';
      }

      return '';
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }

  public async update(id: string, entity: Partial<T>): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.environment}/api/data/${this.apiVersion}/${this.tableName}(${id})`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(entity)
      });

      if (!response.ok) {
        throw new Error(`Failed to update entity: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating entity:', error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.environment}/api/data/${this.apiVersion}/${this.tableName}(${id})`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete entity: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      throw error;
    }
  }
}