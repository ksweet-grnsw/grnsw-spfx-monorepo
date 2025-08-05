import { MSGraphClientV3 } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export class AuthService {
  private context: WebPartContext;
  private graphClient: MSGraphClientV3 | null = null;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  public async getGraphClient(): Promise<MSGraphClientV3> {
    if (!this.graphClient) {
      this.graphClient = await this.context.msGraphClientFactory.getClient('3');
    }
    return this.graphClient;
  }


  public async authenticateToDataverse(): Promise<string> {
    try {
      const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
      // Use the specific Dataverse environment URL for authentication
      const token = await tokenProvider.getToken('https://org98489e5d.crm6.dynamics.com');
      console.log('Got token for Dataverse');
      return token;
    } catch (error) {
      console.error('Error authenticating to Dataverse:', error);
      throw error;
    }
  }

  public getHeaders(accessToken: string): HeadersInit {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
}