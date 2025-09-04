import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from '@grnsw/shared';
import { dataverseConfig } from '../config/apiConfig';
import { IDataverseWeatherData } from '../models/IDataverseWeatherData';

export class DataverseService {
  private authService: AuthService;
  private abortController: AbortController | null = null;

  constructor(context: WebPartContext) {
    this.authService = new AuthService(context);
  }

  // Cancel any pending requests
  public cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Cleanup method for component unmount
  public dispose(): void {
    this.cancelRequests();
  }

  public async getWeatherData(filter?: string): Promise<IDataverseWeatherData[]> {
    try {
      // Cancel any existing request and create new controller
      this.cancelRequests();
      this.abortController = new AbortController();
      
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      let url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${dataverseConfig.tableName}`;
      
      if (filter) {
        url += `?$filter=${filter}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const error = new Error(`Error fetching weather data: ${response.statusText}`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.value as IDataverseWeatherData[];
    } catch (error) {
      // Don't log errors for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      console.error('Error in getWeatherData:', error);
      throw error;
    }
  }

  public async getWeatherDataWithQuery(query: string): Promise<IDataverseWeatherData[]> {
    try {
      // Cancel any existing request and create new controller
      this.cancelRequests();
      this.abortController = new AbortController();
      
      console.log('[DataverseService] Authenticating to Dataverse...');
      const accessToken = await this.authService.authenticateToDataverse();
      
      if (!accessToken) {
        throw new Error('Failed to obtain access token for Dataverse');
      }
      
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${dataverseConfig.tableName}?${query}`;
      
      console.log('[DataverseService] Fetching data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        signal: this.abortController.signal
      });

      console.log('[DataverseService] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get more details from response
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              errorMessage = `${errorMessage} - ${errorJson.error.message}`;
            }
          }
        } catch (parseError) {
          // Ignore parsing errors, use default message
        }
        
        console.error('[DataverseService] API Error:', errorMessage);
        
        const error = new Error(errorMessage) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('[DataverseService] Data received:', data.value?.length || 0, 'records');
      
      return data.value as IDataverseWeatherData[];
    } catch (error) {
      // Don't log errors for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error('[DataverseService] Error in getWeatherDataWithQuery:', error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        // Check for common issues
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error(`Network error: Unable to connect to Dataverse. Please check your internet connection and try again.`);
        } else if (error.message.includes('401')) {
          throw new Error(`Authentication failed: You don't have permission to access Dataverse. Please refresh the page and try again.`);
        } else if (error.message.includes('403')) {
          throw new Error(`Access denied: You don't have permission to access the weather data. Please contact your administrator.`);
        } else if (error.message.includes('404')) {
          throw new Error(`Data not found: The weather data table could not be found. Please contact your administrator.`);
        }
      }
      
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