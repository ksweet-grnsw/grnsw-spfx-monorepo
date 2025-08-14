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