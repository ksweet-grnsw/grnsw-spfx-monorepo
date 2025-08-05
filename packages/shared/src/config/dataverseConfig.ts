export const dataverseConfig = {
  environment: 'https://org98489e5d.crm6.dynamics.com',
  apiVersion: 'v9.2',
  clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
  tenantId: '78247cd5-7ce6-4361-bd6c-cadfc9f8f547'
};

// Table names for different domains
export const dataverseTables = {
  // Weather tables
  weatherData: 'cr4cc_weatherdatas',
  
  // Race management tables
  raceMeetings: 'cr4cc_racemeetings',
  races: 'cr4cc_races',
  raceResults: 'cr4cc_raceresults',
  tracks: 'cr4cc_tracks',
  
  // Greyhound health tables
  greyhounds: 'cr4cc_greyhounds',
  injuries: 'cr4cc_injuries',
  treatments: 'cr4cc_treatments',
  veterinaryReports: 'cr4cc_veterinaryreports'
};