/**
 * Interface for GAP Hound records from Dataverse
 * Maps to cr0d3_hounds table
 */
export interface IHound {
  // Primary fields
  cr0d3_houndid: string;  // Unique identifier (note: singular form)
  cr0d3_sfid?: string;     // Salesforce ID
  cr0d3_microchipnumber: string;  // Primary microchip (used as name)
  cr0d3_microchipno?: string;     // Additional microchip field
  cr0d3_racingname?: string;      // Registered racing name
  
  // Demographics
  cr0d3_sex?: string;             // Male/Female
  cr0d3_colour?: string;          // Coat color
  cr0d3_whelpingdate?: string;    // Birth date
  cr0d3_weight?: string;          // Weight in kg
  
  // Identification
  cr0d3_earbrandleft?: string;    // Left ear tattoo
  cr0d3_earbrandright?: string;   // Right ear tattoo
  
  // Status fields
  cr0d3_desexed?: boolean;        // Desexed status
  cr0d3_available?: string;       // Availability status (Adopted/HASed/Available)
  cr0d3_c5vaccinegiven?: boolean; // C5 vaccination status
  
  // Assessment
  cr0d3_assessmentdate?: string;  // Assessment date
  
  // Sync tracking
  cr0d3_lastsyncdate?: string;    // Last sync timestamp
  cr0d3_syncstatus?: string;      // Sync status
  cr0d3_sfmodifieddate?: string;  // Salesforce last modified
  
  // Computed/display fields
  age?: number;                   // Calculated age in years
  displayName?: string;           // Display name (racing name or microchip)
}

/**
 * Search filters for hounds
 */
export interface IHoundFilters {
  searchText?: string;           // Search by name, microchip, or ear brand
  availabilityStatus?: string;   // Filter by availability
  sex?: string;                  // Filter by sex
  desexed?: boolean;            // Filter by desexed status
  hasC5Vaccine?: boolean;       // Filter by vaccination status
  ageMin?: number;              // Minimum age filter
  ageMax?: number;              // Maximum age filter
}

/**
 * Search results interface
 */
export interface IHoundSearchResults {
  hounds: IHound[];
  totalCount: number;
  hasMore: boolean;
}