export const dataverseConfig = {
  environment: 'https://org98489e5d.crm6.dynamics.com',
  apiUrl: 'https://org98489e5d.crm6.dynamics.com/api/data/v9.2',
  resourceUrl: 'https://org98489e5d.crm6.dynamics.com',
  apiVersion: 'v9.2',
  clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
  tenantId: '78247cd5-7ce6-4361-bd6c-cadfc9f8f547'
};

// GAP Environment configuration
export const gapDataverseConfig = {
  environment: 'https://orgda56a300.crm6.dynamics.com',
  apiVersion: 'v9.1',
  clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12', // Same client ID for all environments
  tenantId: '78247cd5-7ce6-4361-bd6c-cadfc9f8f547' // Same tenant ID
};

// Table names for different domains
export const dataverseTables = {
  // Track conditions tables (formerly weather)
  weatherData: 'cr4cc_weatherdatas',
  trackConditions: 'cr4cc_trackconditions',
  
  // Race management tables
  raceMeetings: 'cr4cc_racemeetings',
  races: 'cr4cc_races',
  raceResults: 'cr4cc_raceresults',
  tracks: 'cr4cc_tracks',
  
  // Greyhound health tables
  greyhounds: 'cr4cc_greyhounds',
  injuries: 'cr4cc_injuries',
  treatments: 'cr4cc_treatments',
  veterinaryReports: 'cr4cc_veterinaryreports',
  
  // GAP (Greyhound Adoption Program) tables
  hounds: 'cr0d3_hounds', // Primary greyhound table for GAP
  adoptableGreyhounds: 'cr4cc_adoptablegreyhounds', // Legacy - may not exist
  adoptionApplications: 'cr4cc_adoptionapplications',
  adoptions: 'cr4cc_adoptions',
  fosterCarers: 'cr4cc_fostercarers',
  behavioralAssessments: 'cr4cc_behavioralassessments'
};