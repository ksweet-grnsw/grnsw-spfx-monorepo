/**
 * Centralized Dataverse Environment Configuration
 * All environment-specific settings should be defined here
 */

export interface IDataverseTable {
  [key: string]: string;
}

export interface IDataverseEnvironment {
  name: string;
  displayName: string;
  url: string;
  resourceUrl: string;
  apiVersion: string;
  clientId: string;
  tenantId: string;
  tables: IDataverseTable;
  rateLimit?: number; // Requests per second
  cacheTimeout?: number; // Cache timeout in milliseconds
  retryAttempts?: number;
  retryDelay?: number; // Delay between retries in milliseconds
}

export interface IDataverseEnvironments {
  [key: string]: IDataverseEnvironment;
}

/**
 * Centralized configuration for all Dataverse environments
 * This replaces all hardcoded URLs and config scattered across packages
 */
export const DATAVERSE_ENVIRONMENTS: IDataverseEnvironments = {
  weather: {
    name: 'weather',
    displayName: 'Weather Data Production',
    url: 'https://org98489e5d.crm6.dynamics.com',
    resourceUrl: 'https://org98489e5d.crm6.dynamics.com',
    apiVersion: 'v9.2',
    clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
    tenantId: '4a4f3c1e-d705-4d87-b08f-c0b0a0b3c891',
    tables: {
      weatherData: 'cr4cc_weatherdatas'
    },
    rateLimit: 100,
    cacheTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  racing: {
    name: 'racing',
    displayName: 'Racing Data',
    url: 'https://racingdata.crm6.dynamics.com',
    resourceUrl: 'https://racingdata.crm6.dynamics.com',
    apiVersion: 'v9.1',
    clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
    tenantId: '4a4f3c1e-d705-4d87-b08f-c0b0a0b3c891',
    tables: {
      raceMeetings: 'cr4cc_racemeetings',
      races: 'cr616_races',
      contestants: 'cr616_contestants'
    },
    rateLimit: 100,
    cacheTimeout: 60000, // 1 minute for race data
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  gap: {
    name: 'gap',
    displayName: 'Greyhound Adoption Program',
    url: 'https://orgda56a300.crm6.dynamics.com',
    resourceUrl: 'https://orgda56a300.crm6.dynamics.com',
    apiVersion: 'v9.1',
    clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
    tenantId: '4a4f3c1e-d705-4d87-b08f-c0b0a0b3c891',
    tables: {
      hounds: 'cr0d3_hounds',
      adoptionApplications: 'cr0d3_adoptionapplications',
      adoptionCenters: 'cr0d3_adoptioncenters'
    },
    rateLimit: 50,
    cacheTimeout: 600000, // 10 minutes
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  health: {
    name: 'health',
    displayName: 'Injury & Health Data',
    url: 'https://orgfc8a11f1.crm6.dynamics.com',
    resourceUrl: 'https://orgfc8a11f1.crm6.dynamics.com',
    apiVersion: 'v9.2',
    clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
    tenantId: '4a4f3c1e-d705-4d87-b08f-c0b0a0b3c891',
    tables: {
      injuries: 'cra5e_injurydatas',
      greyhounds: 'cra5e_greyhounds',
      healthChecks: 'cra5e_heathchecks', // Note: misspelled in Dataverse
      injury: 'cr4cc_injuries' // Legacy table
    },
    rateLimit: 75,
    cacheTimeout: 120000, // 2 minutes
    retryAttempts: 3,
    retryDelay: 1000
  }
};

/**
 * Helper function to get environment by name
 */
export function getEnvironment(name: string): IDataverseEnvironment {
  const env = DATAVERSE_ENVIRONMENTS[name];
  if (!env) {
    throw new Error(`Unknown Dataverse environment: ${name}`);
  }
  return env;
}

/**
 * Helper function to get API endpoint for a table
 */
export function getTableEndpoint(environment: IDataverseEnvironment, tableName: string): string {
  const table = environment.tables[tableName];
  if (!table) {
    throw new Error(`Table '${tableName}' not found in environment '${environment.name}'`);
  }
  return `${environment.url}/api/data/${environment.apiVersion}/${table}`;
}

/**
 * Helper function to build OData query URL
 */
export function buildODataUrl(
  environment: IDataverseEnvironment, 
  tableName: string, 
  query?: string
): string {
  const baseUrl = getTableEndpoint(environment, tableName);
  return query ? `${baseUrl}?${query}` : baseUrl;
}

/**
 * Get all available environment names
 */
export function getEnvironmentNames(): string[] {
  return Object.keys(DATAVERSE_ENVIRONMENTS);
}

/**
 * Validate if an environment exists
 */
export function isValidEnvironment(name: string): boolean {
  return name in DATAVERSE_ENVIRONMENTS;
}