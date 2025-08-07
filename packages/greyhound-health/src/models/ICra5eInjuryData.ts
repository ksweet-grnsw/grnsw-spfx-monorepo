/**
 * Interface for the cra5e_injurydata Dataverse table
 * Generated from actual Dataverse schema
 */

export interface ICra5eInjurydata {
  // Primary Key
  cra5e_injurydataid: string; // Unique identifier
  
  // Required Fields
  cra5e_injuryreport: string; // Primary name field (max 850 chars)
  
  // Greyhound Information
  cra5e_greyhoundname?: string; // Greyhound Name
  cra5e_microchip?: number; // Microchip number
  cra5e_doggender?: string; // Dog Gender
  cra5e_ageofdog?: number; // Age of Dog (decimal)
  cra5e_whelpeddate?: string; // Whelped Date (ISO string)
  cra5e_doggrade?: string; // Dog Grade
  
  // Race/Trial Information
  cra5e_racedate?: string; // Date of race/trial (ISO string)
  cra5e_racenumber?: number; // Race number
  cra5e_trackname?: string; // Track where injury occurred
  cra5e_racedistance?: number; // Race distance
  cra5e_distancetype?: string; // Distance type
  cra5e_runbox?: number; // Starting box number
  cra5e_placement?: number; // Finishing position
  cra5e_numberofcontestants?: number; // Number of contestants
  cra5e_sfcontestantnumber?: string; // SF Contestant Number
  
  // Injury Details
  cra5e_injurycategory?: string; // Injury Category
  cra5e_injurystate?: string; // Injury State
  cra5e_determinedserious?: string; // Determined Serious
  cra5e_failedtofinish?: string; // Failed to Finish
  cra5e_runstage?: string; // Run Stage
  
  // Examination Information
  cra5e_examreason?: string; // Exam Reason
  cra5e_examstage?: string; // Exam Stage
  cra5e_datechecked?: string; // Date Checked (ISO string)
  cra5e_traineratexam?: string; // Trainer at Exam
  
  // Comments and Additional Info
  cra5e_stewartcomment?: string; // Stewart Comment (max 2000 chars)
  cra5e_followupinformation?: string; // Follow Up Information (max 2000 chars)
  cra5e_videolink?: string; // Video Link
  
  // System Fields
  createdby?: string; // Created By (lookup)
  createdbyname?: string;
  createdbyyominame: string;
  createdon?: string; // Created On
  createdonbehalfby?: string; // Created By (Delegate)
  createdonbehalfbyname?: string;
  createdonbehalfbyyominame: string;
  modifiedby?: string; // Modified By (lookup)
  modifiedbyname?: string;
  modifiedbyyominame: string;
  modifiedon?: string; // Modified On
  modifiedonbehalfby?: string; // Modified By (Delegate)
  modifiedonbehalfbyname?: string;
  modifiedonbehalfbyyominame: string;
  
  // Ownership
  ownerid: any; // Owner
  owneridname: string;
  owneridtype: string;
  owneridyominame: string;
  owningbusinessunit?: string; // Owning Business Unit
  owningbusinessunitname: string;
  owningteam?: string; // Owning Team
  owninguser?: string; // Owning User
  
  // Status
  statecode: number; // Status (0 = Active, 1 = Inactive)
  statecodename?: any;
  statuscode?: number; // Status Reason
  statuscodename?: any;
  
  // Other
  importsequencenumber?: number; // Import Sequence Number
  utcconversiontimezonecode?: number; // UTC Conversion Time Zone Code
}

/**
 * State codes for injury records
 */
export enum InjuryStateCode {
  Active = 0,
  Inactive = 1
}

/**
 * Helper interface for creating new injury records
 */
export interface ICreateInjuryData {
  // Required fields
  cra5e_injuryreport: string; // Description of injury
  
  // Recommended fields
  cra5e_greyhoundname?: string;
  cra5e_microchip?: number;
  cra5e_doggender?: string;
  cra5e_ageofdog?: number;
  cra5e_racedate?: string;
  cra5e_racenumber?: number;
  cra5e_trackname?: string;
  cra5e_injurycategory?: string;
  cra5e_injurystate?: string;
  cra5e_determinedserious?: string;
  cra5e_examreason?: string;
  cra5e_datechecked?: string;
  cra5e_traineratexam?: string;
  cra5e_stewartcomment?: string;
  cra5e_followupinformation?: string;
}

/**
 * Interface for injury statistics and reporting
 */
export interface IInjuryStatistics {
  totalInjuries: number;
  injuriesByCategory: Record<string, number>;
  injuriesByTrack: Record<string, number>;
  injuriesByMonth: Record<string, number>;
  seriousInjuriesCount: number;
  failedToFinishCount: number;
  averageAge?: number;
}

/**
 * Interface for injury search filters
 */
export interface IInjurySearchFilters {
  trackName?: string;
  injuryCategory?: string;
  injuryState?: string;
  determinedSerious?: string;
  startDate?: string;
  endDate?: string;
  microchip?: number;
}