import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';

export class AuthService {
  private context: WebPartContext;
  private aadClient: AadHttpClient | null = null;
  private accessToken: string | null = null;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  public async getAadClient(resourceUrl: string): Promise<AadHttpClient> {
    if (!this.aadClient) {
      this.aadClient = await this.context.aadHttpClientFactory.getClient(resourceUrl);
    }
    return this.aadClient;
  }

  public async getAccessToken(resourceUrl: string): Promise<string> {
    const client = await this.getAadClient(resourceUrl);
    const response = await client.get(resourceUrl, AadHttpClient.configurations.v1);
    if (response.ok) {
      return 'authorized';
    }
    throw new Error('Failed to get access token');
  }

  public async authenticateToDataverse(): Promise<string> {
    if (!this.accessToken) {
      this.accessToken = await this.getAccessToken(dataverseConfig.resourceUrl);
    }
    return this.accessToken;
  }

  public getHeaders(accessToken: string): HeadersInit {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };
  }
}

export const dataverseConfig = {
  apiUrl: 'https://racingdata.crm6.dynamics.com',
  resourceUrl: 'https://racingdata.crm6.dynamics.com',
  environment: 'https://racingdata.crm6.dynamics.com',
  apiVersion: 'v9.1',
  tables: {
    raceMeetings: 'cr4cc_racemeetings',
    races: 'cr616_races',
    contestants: 'cr616_contestants'
  }
};