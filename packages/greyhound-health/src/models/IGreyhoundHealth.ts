import { IBaseEntity } from '@grnsw/shared';

export interface IGreyhound extends IBaseEntity {
  cr4cc_greyhoundid: string;
  cr4cc_name: string;
  cr4cc_ear_brand: string;
  cr4cc_microchip?: string;
  cr4cc_date_of_birth: string;
  cr4cc_sex: string;
  cr4cc_color?: string;
  cr4cc_sire?: string;
  cr4cc_dam?: string;
  cr4cc_trainer?: string;
  cr4cc_owner?: string;
  cr4cc_status: string;
  cr4cc_retired_date?: string;
}

export interface IInjury extends IBaseEntity {
  cr4cc_injuryid: string;
  _cr4cc_greyhound_value: string;
  cr4cc_injury_date: string;
  cr4cc_injury_type: string;
  cr4cc_injury_location: string;
  cr4cc_severity: string;
  cr4cc_incident_description?: string;
  _cr4cc_race_value?: string;
  cr4cc_track_name?: string;
  cr4cc_veterinarian?: string;
  cr4cc_initial_treatment?: string;
  cr4cc_prognosis?: string;
  cr4cc_stand_down_period?: number;
  cr4cc_return_to_racing_date?: string;
  cr4cc_status: string;
}

export interface ITreatment extends IBaseEntity {
  cr4cc_treatmentid: string;
  _cr4cc_injury_value: string;
  _cr4cc_greyhound_value: string;
  cr4cc_treatment_date: string;
  cr4cc_treatment_type: string;
  cr4cc_medication?: string;
  cr4cc_dosage?: string;
  cr4cc_veterinarian: string;
  cr4cc_notes?: string;
  cr4cc_follow_up_required?: boolean;
  cr4cc_next_treatment_date?: string;
}

export interface IVeterinaryReport extends IBaseEntity {
  cr4cc_reportid: string;
  _cr4cc_greyhound_value: string;
  _cr4cc_injury_value?: string;
  cr4cc_examination_date: string;
  cr4cc_veterinarian: string;
  cr4cc_clinic?: string;
  cr4cc_examination_type: string;
  cr4cc_findings?: string;
  cr4cc_recommendations?: string;
  cr4cc_fitness_to_race: string;
  cr4cc_next_examination_date?: string;
  cr4cc_attachments?: string;
}

export enum InjurySeverity {
  Minor = 'Minor',
  Moderate = 'Moderate',
  Severe = 'Severe',
  CareerEnding = 'Career Ending'
}

export enum GreyhoundStatus {
  Active = 'Active',
  Injured = 'Injured',
  Suspended = 'Suspended',
  Retired = 'Retired',
  Deceased = 'Deceased'
}