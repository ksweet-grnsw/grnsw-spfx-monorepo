import { IBaseEntity } from '@grnsw/shared';

export interface IAdoptableGreyhound extends IBaseEntity {
  cr4cc_adoptableid: string;
  cr4cc_greyhound_name: string;
  cr4cc_ear_brand: string;
  cr4cc_microchip?: string;
  cr4cc_date_of_birth: string;
  cr4cc_sex: string;
  cr4cc_color?: string;
  cr4cc_weight?: number;
  cr4cc_adoption_status: AdoptionStatus;
  cr4cc_temperament?: string;
  cr4cc_special_needs?: string;
  cr4cc_good_with_cats?: boolean;
  cr4cc_good_with_dogs?: boolean;
  cr4cc_good_with_children?: boolean;
  cr4cc_foster_carer_id?: string;
  cr4cc_foster_carer_name?: string;
  cr4cc_date_entered_gap: string;
  cr4cc_behavioral_assessment_date?: string;
  cr4cc_behavioral_assessment_result?: string;
  cr4cc_adoption_fee?: number;
  cr4cc_location?: string;
  cr4cc_profile_description?: string;
  cr4cc_photo_url?: string;
}

export interface IAdoptionApplication extends IBaseEntity {
  cr4cc_applicationid: string;
  cr4cc_applicant_name: string;
  cr4cc_applicant_email: string;
  cr4cc_applicant_phone: string;
  cr4cc_applicant_address: string;
  cr4cc_preferred_greyhound_id?: string;
  cr4cc_preferred_greyhound_name?: string;
  cr4cc_application_date: string;
  cr4cc_application_status: ApplicationStatus;
  cr4cc_home_type: string;
  cr4cc_yard_secure: boolean;
  cr4cc_other_pets?: string;
  cr4cc_children_ages?: string;
  cr4cc_experience_with_dogs?: string;
  cr4cc_work_hours?: string;
  cr4cc_why_adopt?: string;
  cr4cc_references?: string;
  cr4cc_home_check_date?: string;
  cr4cc_home_check_result?: string;
  cr4cc_approval_date?: string;
  cr4cc_rejection_reason?: string;
  cr4cc_notes?: string;
}

export interface IFosterCarer extends IBaseEntity {
  cr4cc_fostercarerid: string;
  cr4cc_carer_name: string;
  cr4cc_carer_email: string;
  cr4cc_carer_phone: string;
  cr4cc_carer_address: string;
  cr4cc_max_dogs: number;
  cr4cc_current_dogs: number;
  cr4cc_specialties?: string; // e.g., "puppies", "medical cases", "behavioral"
  cr4cc_active: boolean;
  cr4cc_start_date: string;
  cr4cc_total_fostered?: number;
  cr4cc_current_foster_ids?: string;
  cr4cc_preferred_dog_size?: string;
  cr4cc_can_transport: boolean;
  cr4cc_emergency_contact?: string;
  cr4cc_veterinarian?: string;
}

export interface IAdoption extends IBaseEntity {
  cr4cc_adoptionid: string;
  cr4cc_greyhound_id: string;
  cr4cc_greyhound_name: string;
  cr4cc_adopter_id: string;
  cr4cc_adopter_name: string;
  cr4cc_adoption_date: string;
  cr4cc_adoption_fee_paid: number;
  cr4cc_microchip_transferred: boolean;
  cr4cc_council_registered: boolean;
  cr4cc_adoption_contract_signed: boolean;
  cr4cc_follow_up_dates?: string;
  cr4cc_follow_up_notes?: string;
  cr4cc_returned?: boolean;
  cr4cc_return_date?: string;
  cr4cc_return_reason?: string;
}

export enum AdoptionStatus {
  Available = 'Available',
  Reserved = 'Reserved',
  Adopted = 'Adopted',
  InFosterCare = 'In Foster Care',
  UnderAssessment = 'Under Assessment',
  Medical = 'Medical Hold',
  NotAvailable = 'Not Available'
}

export enum ApplicationStatus {
  New = 'New',
  UnderReview = 'Under Review',
  HomeCheckPending = 'Home Check Pending',
  HomeCheckComplete = 'Home Check Complete',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn',
  Expired = 'Expired'
}