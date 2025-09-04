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

  public async authenticateToDataverse(dataverseUrl?: string): Promise<string> {
    try {
      console.log('[AuthService] Getting token provider...');
      const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
      
      // Use the specific Dataverse environment URL for authentication
      const url = dataverseUrl || 'https://org98489e5d.crm6.dynamics.com';
      console.log('[AuthService] Requesting token for:', url);
      
      const token = await tokenProvider.getToken(url);
      
      if (!token) {
        throw new Error('Received empty token from Azure AD');
      }
      
      console.log('[AuthService] Successfully obtained token for Dataverse');
      return token;
    } catch (error) {
      console.error('[AuthService] Error authenticating to Dataverse:', error);
      
      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.message.includes('interaction_required')) {
          throw new Error('Authentication required: Please sign in to access Dataverse');
        } else if (error.message.includes('consent_required')) {
          throw new Error('Permissions required: Admin consent needed for Dataverse access');
        } else if (error.message.includes('invalid_grant')) {
          throw new Error('Authentication expired: Please refresh the page to re-authenticate');
        } else if (error.message.includes('AADSTS')) {
          // Azure AD error
          throw new Error(`Azure AD error: ${error.message}`);
        }
      }
      
      throw error;
    }
  }

  public getHeaders(accessToken: string): HeadersInit {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };
  }
}