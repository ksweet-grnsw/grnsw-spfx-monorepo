import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from './AuthService';
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
        throw new Error(`Error fetching weather data: ${response.statusText}`);
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

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching weather data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value as IDataverseWeatherData[];
    } catch (error) {
      console.error('Error in getWeatherDataWithQuery:', error);
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