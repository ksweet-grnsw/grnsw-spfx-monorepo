// Race Data Models
// =================

export interface IMeeting {
  cr4cc_racemeetingid: string;
  cr4cc_meetingdate: Date | string;
  cr4cc_trackname?: string; // The actual field name for track in Dataverse
  cr4cc_authority: string;
  cr4cc_timeslot: string;
  cr4cc_meetingtype: string;
  cr4cc_type?: string; // Meeting type
  cr4cc_meetingname?: string; // Meeting name
  cr4cc_cancelled?: boolean; // Cancelled flag
  cr4cc_salesforceid?: string; // Salesforce ID
  cr4cc_status?: string;
  cr616_weather?: string; // Weather conditions
  cr616_stewardcomment?: string; // Steward's comments  
  cr616_trackcondition?: string; // Track condition
  statecode?: number; // State code
  statuscode?: number; // Status code
  modifiedon?: Date | string; // Last modified
  createdon?: Date | string; // Created date
  raceCount?: number;
  _cr616_races?: IRace[];
}

export interface IRace {
  cr616_racesid: string; // Note: actual field is 'racesid' not 'raceid'
  cr616_racenumber: number;
  cr616_racename: string;
  cr616_racetitle: string;
  cr616_distance: number;
  cr616_racegrading: string; // Note: actual field is 'racegrading' not 'racegrading'
  cr616_starttime: string;
  cr616_numberofcontestants: number; // Note: actual field is 'numberofcontestants' not 'noofcontestants'
  cr616_prize1?: number;
  cr616_prize2?: number;
  cr616_prize3?: number;
  cr616_prize4?: number;
  cr616_status?: string;
  cr616_racedate?: Date | string;
  cr616_trackheld?: string;
  cr616_sfraceid?: string; // Salesforce race ID
  cr616_firstsectionaltime?: string;
  cr616_secondsectiontime?: string;
  cr616_racesectionaloverview?: string;
  cr616_stewardracecomment?: string;
  _cr616_meeting_value: string;
  cr616_Meeting?: IMeeting;
  _cr616_contestants?: IContestant[];
}

export interface IContestant {
  cr616_contestantsid: string; // Note: actual field is 'contestantsid' not 'contestantid'
  cr616_rugnumber: number;
  cr616_greyhoundname: string;
  cr616_ownername: string;
  cr616_trainername: string;
  cr616_doggrade: string;
  cr616_placement?: number;
  cr616_margin?: number;
  cr616_weight?: number;
  cr616_status: string;
  cr616_prizemoney?: number;
  cr616_finishtime?: string;
  cr616_dayssincelastrace?: number;
  cr616_totalnumberofwinds?: number;
  cr616_failedtofinish?: boolean;
  cr616_racewithin2days?: boolean;
  cr616_trackheld?: string;
  cr616_meetingdate?: Date | string;
  cr616_racenumber?: number;
  cr616_leftearbrand?: string;
  cr616_sfcontestantid?: string;
  _cr616_race_value: string;
  cr616_Race?: IRace;
}

export interface IMeetingFilters {
  dateFrom?: Date;
  dateTo?: Date;
  track?: string;
  authority?: string;
  status?: string;
}

export interface IRaceFilters {
  meetingId?: string;
  distance?: number;
  grading?: string;
  status?: string;
}

export interface IContestantFilters {
  raceId?: string;
  greyhoundName?: string;
  ownerName?: string;
  trainerName?: string;
  status?: string;
}

export interface ISearchResults {
  meetings: IMeeting[];
  races: IRace[];
  contestants: IContestant[];
  greyhounds?: IGreyhound[];
  totalResults: number;
}

export interface IDataverseResponse<T> {
  value: T[];
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
}

export interface IDataverseError {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}

// Greyhound information from Injury Data environment
export interface IGreyhound {
  cra5e_greyhoundid: string;
  cra5e_name: string; // Greyhound name
  cra5e_microchip?: string;
  cra5e_leftearbrand?: string;
  cra5e_rightearbrand?: string;
  cra5e_colour?: string;
  cra5e_gender?: string;
  cra5e_age?: number;
  cra5e_whelpeddate?: Date | string;
  cra5e_sire?: string;
  cra5e_dam?: string;
  cra5e_ownername?: string;
  cra5e_trainername?: string;
  cra5e_status?: string; // Racing, Retired, etc.
  cra5e_breedingstatus?: string;
  cra5e_desexed?: boolean;
  cra5e_c5vaccinationdate?: Date | string;
  cra5e_c5valid?: boolean;
  cra5e_latestcheckin?: Date | string;
  cra5e_nextcheckindue?: Date | string;
  cra5e_prizemoney?: number;
  cra5e_retirementdate?: Date | string;
  cra5e_deceaseddate?: Date | string;
  cra5e_statebred?: string;
  cra5e_stateregistered?: string;
  cra5e_sfid?: string; // Salesforce ID
  cra5e_intransfer?: boolean;
  cra5e_pannus?: boolean;
  cra5e_validcheckin?: boolean;
}

// Health Check information from Injury Data environment
export interface IHealthCheck {
  cra5e_heathcheckid: string; // Note: misspelled in system
  cra5e_name?: string; // HC-00XXXXXX
  _cra5e_greyhound_value: string; // Foreign key to Greyhound
  cra5e_datechecked: Date | string;
  cra5e_type?: string; // Race Meeting Exam, etc.
  cra5e_trackname?: string;
  cra5e_racenumber?: number;
  cra5e_distance?: number;
  cra5e_boxnumber?: number;
  cra5e_injured?: boolean;
  cra5e_injuryclassification?: string; // Cat A, B, C, D
  cra5e_determinedaseriousinjury?: string;
  cra5e_standdowndays?: number;
  cra5e_standdowndaysenddate?: Date | string;
  cra5e_died?: boolean;
  cra5e_euthanased?: boolean;
  cra5e_examiningvet?: string;
  cra5e_followupinformation?: string;
  cra5e_treatmentinformation?: string;
  cra5e_wasfollowedup?: boolean;
  cra5e_vetcomments?: string; // Vet comments if available
  cra5e_stewardcomments?: string; // Steward comments if available
  cra5e_notes?: string; // General notes if available
  cra5e_veterinaryclearance?: boolean;
  cra5e_vetclearancerequired?: boolean;
  cra5e_healthcheckauthority?: string;
  cra5e_healthcheckstatus?: string;
  cra5e_sfid?: string;
  // Specific health issues
  cra5e_cardiovascularissue?: boolean;
  cra5e_dehydration?: boolean;
  cra5e_exhaustion?: boolean;
  cra5e_gastrointestinalissue?: boolean;
  cra5e_heatstress?: boolean;
  cra5e_musculoskeletalissue?: boolean;
  cra5e_neurologicalissue?: boolean;
  cra5e_respiratoryissue?: boolean;
  cra5e_poorperformance?: boolean;
  cra5e_racingincident?: boolean;
  cra5e_medicationadministered?: boolean;
  cra5e_medications?: string;
  cra5e_sedatives?: boolean;
  cra5e_sutures?: boolean;
}