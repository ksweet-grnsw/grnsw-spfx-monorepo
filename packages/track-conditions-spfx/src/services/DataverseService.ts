import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from '@grnsw/shared';
import { dataverseConfig } from '../config/apiConfig';
import { IDataverseWeatherData } from '../models/IDataverseWeatherData';

export class DataverseService {
  private authService: AuthService;

  constructor(context: WebPartContext) {
    this.authService = new AuthService(context);
  }

  public async getWeatherData(filter?: string): Promise<IDataverseWeatherData[]> {
    try {
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      let url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${dataverseConfig.tableName}`;
      
      if (filter) {
        url += `?$filter=${filter}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const error = new Error(`Error fetching weather data: ${response.statusText}`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.value as IDataverseWeatherData[];
    } catch (error) {
      console.error('Error in getWeatherData:', error);
      throw error;
    }
  }

  public async getWeatherDataWithQuery(query: string): Promise<IDataverseWeatherData[]> {
    try {
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${dataverseConfig.tableName}?${query}`;
      
      // Executing Dataverse query

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        // API error response received
        const error = new Error(`Error fetching weather data: ${response.statusText} - Status: ${response.status}`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.value as IDataverseWeatherData[];
    } catch (error) {
      // Error in getWeatherDataWithQuery
      throw error;
    }
  }

  public async getLatestWeatherData(top: number = 10): Promise<IDataverseWeatherData[]> {
    const query = `$orderby=createdon desc&$top=${top}`;
    return this.getWeatherDataWithQuery(query);
  }

  public async getWeatherDataByDateRange(startDate: Date, endDate: Date): Promise<IDataverseWeatherData[]> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    const filter = `createdon ge ${start} and createdon le ${end}`;
    return this.getWeatherData(filter);
  }
}