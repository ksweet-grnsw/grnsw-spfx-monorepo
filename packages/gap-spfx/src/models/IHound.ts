/**
 * Interface for GAP Hound records from Dataverse
 * Maps to cr0d3_hounds table
 */
export interface IHound {
  // Primary fields
  cr0d3_houndid?: string;  // Unique identifier (note: singular form)
  cr0d3_sfid?: string;     // Salesforce ID
  cr0d3_microchipnumber?: string;  // Primary microchip (used as name)
  cr0d3_microchipno?: string;     // Additional microchip field
  cr0d3_racingname?: string;      // Registered racing name
  cr0d3_name?: string;            // Display name
  
  // Demographics
  cr0d3_sex?: string;             // Male/Female
  cr0d3_gender?: string;          // Alternative gender field
  cr0d3_colour?: string;          // Coat color
  cr0d3_color?: string;           // Alternative color field
  cr0d3_whelpingdate?: string;    // Birth date
  cr0d3_weight?: string;          // Weight in kg
  cr0d3_age?: number;            // Age in years
  
  // Identification
  cr0d3_earbrandleft?: string;    // Left ear tattoo
  cr0d3_earbrandright?: string;   // Right ear tattoo
  
  // Status fields
  cr0d3_desexed?: boolean;        // Desexed status
  cr0d3_available?: string;       // Availability status (Adopted/HASed/Available)
  cr0d3_adoptionstatus?: string;  // Adoption status
  cr0d3_c5vaccinegiven?: boolean; // C5 vaccination status
  cr0d3_isactive?: boolean;       // Active in system
  cr0d3_isfeatured?: boolean;    // Featured hound
  
  // Adoption specific
  cr0d3_dateadded?: string;       // Date added to adoption program
  cr0d3_adoptiondate?: string;    // Date adopted
  cr0d3_location?: string;        // Adoption center location
  cr0d3_description?: string;     // Adoption description
  cr0d3_photourl?: string;        // Photo URL
  cr0d3_temperament?: string;     // Temperament description
  cr0d3_specialneeds?: boolean;   // Has special needs
  cr0d3_goodwithcats?: boolean;   // Good with cats
  cr0d3_goodwithkids?: boolean;   // Good with children
  cr0d3_goodwithdogs?: boolean;   // Good with other dogs
  
  // Assessment
  cr0d3_assessmentdate?: string;  // Assessment date
  
  // Relationships
  _cr0d3_adoptioncenter_value?: string;  // FK to adoption center
  _cr0d3_previousowner_value?: string;   // FK to previous owner
  
  // Expanded relationships
  cr0d3_AdoptionCenter?: any;     // Expanded adoption center
  cr0d3_PreviousOwner?: any;      // Expanded previous owner
  
  // Sync tracking
  cr0d3_lastsyncdate?: string;    // Last sync timestamp
  cr0d3_syncstatus?: string;      // Sync status
  cr0d3_sfmodifieddate?: string;  // Salesforce last modified
  
  // System fields
  createdon?: string;
  modifiedon?: string;
  statecode?: number;
  statuscode?: number;
  
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