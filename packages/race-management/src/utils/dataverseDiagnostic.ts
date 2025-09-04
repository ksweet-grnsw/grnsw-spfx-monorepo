/**
 * Diagnostic utility to explore Dataverse environment and find data
 * Run this in the browser console to see what's actually in the environment
 */

export class DataverseDiagnostic {
  private baseUrl = 'https://racingdata.crm6.dynamics.com';  // Racing Data Production
  private apiVersion = 'v9.1';

  /**
   * Test connection and list all available tables
   */
  async testConnection(token?: string): Promise<void> {
    console.log('🔍 Testing Dataverse connection to:', this.baseUrl);
    
    try {
      // First, try to get the Web API endpoint
      const url = `${this.baseUrl}/api/data/${this.apiVersion}/`;
      console.log('Testing URL:', url);
      
      const headers: any = {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection successful!');
        console.log('Available collections:', data.value?.length || 0);
        return data;
      } else {
        console.error('❌ Connection failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
    }
  }

  /**
   * List all entity definitions (tables) in the environment
   */
  async listAllTables(token?: string): Promise<any> {
    console.log('📊 Fetching all tables in environment...');
    
    try {
      const url = `${this.baseUrl}/api/data/${this.apiVersion}/EntityDefinitions?$select=LogicalName,DisplayName,SchemaName,EntitySetName&$filter=IsCustomEntity eq true`;
      
      const headers: any = {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Custom tables found:', data.value?.length || 0);
        
        // Group tables by prefix
        const tablesByPrefix: Record<string, any[]> = {};
        data.value?.forEach((table: any) => {
          const prefix = table.LogicalName.split('_')[0];
          if (!tablesByPrefix[prefix]) {
            tablesByPrefix[prefix] = [];
          }
          tablesByPrefix[prefix].push({
            name: table.LogicalName,
            displayName: table.DisplayName?.UserLocalizedLabel?.Label || table.LogicalName,
            entitySet: table.EntitySetName
          });
        });
        
        console.log('Tables grouped by prefix:', tablesByPrefix);
        
        // Look for our known Racing Data tables
        const knownTables = [
          'cr4cc_racemeeting',   // Note: singular in Racing Data env
          'cr4cc_racemeetings',  // Also check plural form
          'cr616_races', 
          'cr616_raceses',       // Races might be double plural
          'cr616_contestants'    // Contestants table
        ];
        
        console.log('🔎 Checking for known tables:');
        knownTables.forEach(tableName => {
          const found = data.value?.find((t: any) => t.LogicalName === tableName);
          if (found) {
            console.log(`✅ ${tableName} - FOUND (EntitySet: ${found.EntitySetName})`);
          } else {
            console.log(`❌ ${tableName} - NOT FOUND`);
          }
        });
        
        return tablesByPrefix;
      } else {
        console.error('Failed to fetch tables:', response.status);
        const errorText = await response.text();
        console.error('Error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  }

  /**
   * Check specific tables for data
   */
  async checkTableData(tableName: string, token?: string): Promise<void> {
    console.log(`📂 Checking data in table: ${tableName}`);
    
    try {
      // Try both singular and plural forms
      const tableNames = [tableName, tableName + 's', tableName + 'es'];
      
      for (const name of tableNames) {
        const url = `${this.baseUrl}/api/data/${this.apiVersion}/${name}?$top=5`;
        console.log(`Trying: ${url}`);
        
        const headers: any = {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Table ${name} exists with ${data.value?.length || 0} records (showing top 5)`);
          console.log('Sample data:', data.value?.[0]);
          return data;
        }
      }
      
      console.log(`❌ Table ${tableName} not found or empty`);
    } catch (error) {
      console.error(`Error checking table ${tableName}:`, error);
    }
  }

  /**
   * Run full diagnostic
   */
  async runFullDiagnostic(token?: string): Promise<void> {
    console.log('🚀 Starting Dataverse Diagnostic...');
    console.log('=====================================');
    
    // Test connection
    await this.testConnection(token);
    
    console.log('\n');
    
    // List all tables
    await this.listAllTables(token);
    
    console.log('\n');
    
    // Check known tables
    const tablesToCheck = [
      'cr4cc_racemeetings',
      'cr4cc_racemeeting',
      'cr616_races',
      'cr616_race',
      'cr616_contestants',
      'cr616_contestant'
    ];
    
    console.log('📊 Checking known tables for data:');
    for (const table of tablesToCheck) {
      await this.checkTableData(table, token);
      console.log('---');
    }
    
    console.log('\n🏁 Diagnostic complete!');
    console.log('=====================================');
  }

  /**
   * Get the authentication token from the current SPFx context
   */
  async getTokenFromContext(): Promise<string | null> {
    try {
      // Try to get token from the page context if available
      const context = (window as any)._spPageContextInfo;
      if (context) {
        console.log('Found SharePoint context');
        // This would need the actual SPFx context to work
      }
      return null;
    } catch (error) {
      console.error('Could not get auth token:', error);
      return null;
    }
  }
}

// Export a ready-to-use instance
export const dataverseDiag = new DataverseDiagnostic();

// Make it available in the browser console
if (typeof window !== 'undefined') {
  (window as any).dataverseDiag = dataverseDiag;
  console.log('🔧 Dataverse Diagnostic Tool loaded!');
  console.log('Run: dataverseDiag.runFullDiagnostic()');
  console.log('Or: dataverseDiag.checkTableData("cr4cc_racemeetings")');
}