import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseDataverseService, gapDataverseConfig, dataverseTables } from '@grnsw/shared';
import { IAdoptableGreyhound, IAdoptionApplication, IAdoption, AdoptionStatus, ApplicationStatus } from '../models/IGAPModels';

export class AdoptionService extends BaseDataverseService<IAdoptableGreyhound> {
  protected tableName = 'cr0d3_hounds'; // Using new GAP environment table

  constructor(context: WebPartContext) {
    super(context, gapDataverseConfig); // Use GAP-specific config
  }

  public async getAvailableGreyhounds(): Promise<IAdoptableGreyhound[]> {
    return this.getAll({
      filter: `cr4cc_adoption_status eq '${AdoptionStatus.Available}'`,
      orderBy: 'cr4cc_date_entered_gap desc',
      select: [
        'cr4cc_adoptableid',
        'cr4cc_greyhound_name',
        'cr4cc_ear_brand',
        'cr4cc_date_of_birth',
        'cr4cc_sex',
        'cr4cc_color',
        'cr4cc_temperament',
        'cr4cc_good_with_cats',
        'cr4cc_good_with_dogs',
        'cr4cc_good_with_children',
        'cr4cc_location',
        'cr4cc_photo_url'
      ]
    });
  }

  public async getGreyhoundsByStatus(status: AdoptionStatus): Promise<IAdoptableGreyhound[]> {
    return this.getAll({
      filter: `cr4cc_adoption_status eq '${status}'`,
      orderBy: 'cr4cc_greyhound_name asc'
    });
  }

  public async searchGreyhounds(criteria: {
    goodWithCats?: boolean;
    goodWithDogs?: boolean;
    goodWithChildren?: boolean;
    location?: string;
  }): Promise<IAdoptableGreyhound[]> {
    const filters: string[] = [`cr4cc_adoption_status eq '${AdoptionStatus.Available}'`];

    if (criteria.goodWithCats !== undefined) {
      filters.push(`cr4cc_good_with_cats eq ${criteria.goodWithCats}`);
    }
    if (criteria.goodWithDogs !== undefined) {
      filters.push(`cr4cc_good_with_dogs eq ${criteria.goodWithDogs}`);
    }
    if (criteria.goodWithChildren !== undefined) {
      filters.push(`cr4cc_good_with_children eq ${criteria.goodWithChildren}`);
    }
    if (criteria.location) {
      filters.push(`cr4cc_location eq '${criteria.location}'`);
    }

    return this.getAll({
      filter: filters.join(' and '),
      orderBy: 'cr4cc_greyhound_name asc'
    });
  }

  public async getAdoptionStatistics(startDate: Date, endDate: Date): Promise<any> {
    const adoptions = await this.getAll({
      filter: `cr4cc_adoption_date ge ${startDate.toISOString()} and cr4cc_adoption_date le ${endDate.toISOString()}`,
      select: ['cr4cc_adoptionid', 'cr4cc_adoption_date', 'cr4cc_location', 'cr4cc_returned']
    });

    const stats = {
      totalAdoptions: adoptions.length,
      returned: adoptions.filter(a => a.cr4cc_returned).length,
      byMonth: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      successRate: 0
    };

    adoptions.forEach(adoption => {
      // Group by month
      const month = new Date(adoption.cr4cc_adoption_date).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

      // Group by location
      if (adoption.cr4cc_location) {
        stats.byLocation[adoption.cr4cc_location] = (stats.byLocation[adoption.cr4cc_location] || 0) + 1;
      }
    });

    stats.successRate = adoptions.length > 0 
      ? ((adoptions.length - stats.returned) / adoptions.length) * 100 
      : 0;

    return stats;
  }
}

export class ApplicationService extends BaseDataverseService<IAdoptionApplication> {
  protected tableName = 'cr4cc_adoptionapplications'; // Will need to verify actual table name in GAP environment

  constructor(context: WebPartContext) {
    super(context, gapDataverseConfig); // Use GAP-specific config
  }

  public async getPendingApplications(): Promise<IAdoptionApplication[]> {
    return this.getAll({
      filter: `cr4cc_application_status ne '${ApplicationStatus.Approved}' and cr4cc_application_status ne '${ApplicationStatus.Rejected}' and cr4cc_application_status ne '${ApplicationStatus.Withdrawn}'`,
      orderBy: 'cr4cc_application_date asc'
    });
  }

  public async getApplicationsByStatus(status: ApplicationStatus): Promise<IAdoptionApplication[]> {
    return this.getAll({
      filter: `cr4cc_application_status eq '${status}'`,
      orderBy: 'cr4cc_application_date desc'
    });
  }

  public async getApplicationsForGreyhound(greyhoundId: string): Promise<IAdoptionApplication[]> {
    return this.getAll({
      filter: `cr4cc_preferred_greyhound_id eq '${greyhoundId}'`,
      orderBy: 'cr4cc_application_date desc'
    });
  }
}