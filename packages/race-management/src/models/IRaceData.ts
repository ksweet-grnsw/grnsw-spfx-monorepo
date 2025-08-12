// Race Data Models
// =================

export interface IMeeting {
  cr4cc_racemeetingid: string;
  cr4cc_racename: string;
  cr4cc_meetingdate: Date | string;
  cr4cc_trackheld: string;
  cr4cc_authority: string;
  cr4cc_timeslot: string;
  cr4cc_meetingtype: string;
  cr4cc_status?: string;
  raceCount?: number;
  _cr616_races?: IRace[];
}

export interface IRace {
  cr616_raceid: string;
  cr616_racenumber: number;
  cr616_racename: string;
  cr616_racetitle: string;
  cr616_distance: number;
  cr616_racegrading: string;
  cr616_starttime: string;
  cr616_noofcontestants: number;
  cr616_prize1?: number;
  cr616_prize2?: number;
  cr616_prize3?: number;
  cr616_status?: string;
  _cr616_meeting_value: string;
  cr616_Meeting?: IMeeting;
  _cr616_contestants?: IContestant[];
}

export interface IContestant {
  cr616_contestantid: string;
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