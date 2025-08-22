import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedBaseDataverseService,
  DATAVERSE_ENVIRONMENTS,
  IODataQuery,
  IDataverseResponse
} from '@grnsw/shared';
import { IHound } from '../../models/IHound';

/**
 * Domain service for Greyhound Adoption Program - Hounds
 * Handles all business logic related to adoptable greyhounds
 */
export class HoundService extends UnifiedBaseDataverseService<IHound> {
  protected tableName = 'hounds';
  
  protected getTableName(): string {
    return this.environment.tables.hounds;
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.gap, {
      enableCaching: true,
      cacheTTL: 600000, // 10 minutes for adoption data
      enableThrottling: true,
      requestsPerSecond: 50 // Lower rate for GAP environment
    });
  }
  
  /**
   * Get all available hounds for adoption
   */
  async getAvailableHounds(): Promise<IHound[]> {
    const response = await this.getList({
      filter: `cr0d3_adoptionstatus eq 'Available' and cr0d3_isactive eq true`,
      orderBy: 'cr0d3_dateadded desc',
      select: [
        'cr0d3_houndid',
        'cr0d3_name',
        'cr0d3_age',
        'cr0d3_gender',
        'cr0d3_color',
        'cr0d3_weight',
        'cr0d3_temperament',
        'cr0d3_description',
        'cr0d3_photourl',
        'cr0d3_dateadded',
        'cr0d3_location',
        'cr0d3_adoptionstatus',
        'cr0d3_specialneeds',
        'cr0d3_goodwithcats',
        'cr0d3_goodwithkids',
        'cr0d3_goodwithdogs'
      ]
    });
    
    return response.value;
  }
  
  /**
   * Get hounds by adoption center
   */
  async getHoundsByCenter(centerName: string): Promise<IHound[]> {
    const response = await this.getList({
      filter: `cr0d3_location eq '${centerName}' and cr0d3_isactive eq true`,
      orderBy: 'cr0d3_name asc'
    });
    
    return response.value;
  }
  
  /**
   * Search hounds with filters
   */
  async searchHounds(filters: {
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    location?: string;
    goodWithCats?: boolean;
    goodWithKids?: boolean;
    goodWithDogs?: boolean;
    temperament?: string;
    specialNeeds?: boolean;
  }): Promise<IHound[]> {
    const filterConditions: string[] = [];
    
    // Always filter for available and active
    filterConditions.push(`cr0d3_adoptionstatus eq 'Available'`);
    filterConditions.push(`cr0d3_isactive eq true`);
    
    if (filters.gender) {
      filterConditions.push(`cr0d3_gender eq '${filters.gender}'`);
    }
    
    if (filters.ageMin !== undefined) {
      filterConditions.push(`cr0d3_age ge ${filters.ageMin}`);
    }
    
    if (filters.ageMax !== undefined) {
      filterConditions.push(`cr0d3_age le ${filters.ageMax}`);
    }
    
    if (filters.location) {
      filterConditions.push(`cr0d3_location eq '${filters.location}'`);
    }
    
    if (filters.goodWithCats !== undefined) {
      filterConditions.push(`cr0d3_goodwithcats eq ${filters.goodWithCats}`);
    }
    
    if (filters.goodWithKids !== undefined) {
      filterConditions.push(`cr0d3_goodwithkids eq ${filters.goodWithKids}`);
    }
    
    if (filters.goodWithDogs !== undefined) {
      filterConditions.push(`cr0d3_goodwithdogs eq ${filters.goodWithDogs}`);
    }
    
    if (filters.temperament) {
      filterConditions.push(`contains(cr0d3_temperament, '${filters.temperament}')`);
    }
    
    if (filters.specialNeeds !== undefined) {
      filterConditions.push(`cr0d3_specialneeds eq ${filters.specialNeeds}`);
    }
    
    const response = await this.getList({
      filter: filterConditions.join(' and '),
      orderBy: 'cr0d3_dateadded desc'
    });
    
    return response.value;
  }
  
  /**
   * Get featured hounds (newest additions)
   */
  async getFeaturedHounds(limit: number = 6): Promise<IHound[]> {
    const response = await this.getList({
      filter: `cr0d3_adoptionstatus eq 'Available' and cr0d3_isactive eq true and cr0d3_isfeatured eq true`,
      orderBy: 'cr0d3_dateadded desc',
      top: limit
    });
    
    // If not enough featured, get newest
    if (response.value.length < limit) {
      const additional = await this.getList({
        filter: `cr0d3_adoptionstatus eq 'Available' and cr0d3_isactive eq true`,
        orderBy: 'cr0d3_dateadded desc',
        top: limit - response.value.length
      });
      
      response.value.push(...additional.value);
    }
    
    return response.value;
  }
  
  /**
   * Get hound by ID with full details
   */
  async getHoundDetails(houndId: string): Promise<IHound | null> {
    return this.getById(houndId, {
      expand: ['cr0d3_AdoptionCenter', 'cr0d3_PreviousOwner']
    });
  }
  
  /**
   * Get adoption statistics
   */
  async getAdoptionStatistics(): Promise<{
    availableCount: number;
    adoptedThisMonth: number;
    pendingApplications: number;
    byLocation: { [location: string]: number };
    byGender: { male: number; female: number };
    averageTimeToAdoption: number;
  }> {
    // Get available hounds
    const available = await this.getAvailableHounds();
    
    // Get adopted this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const adopted = await this.getList({
      filter: `cr0d3_adoptionstatus eq 'Adopted' and cr0d3_adoptiondate ge ${startOfMonth.toISOString()}`,
      select: ['cr0d3_houndid', 'cr0d3_adoptiondate', 'cr0d3_dateadded']
    });
    
    // Get pending applications
    const pending = await this.getList({
      filter: `cr0d3_adoptionstatus eq 'Application Pending'`,
      select: ['cr0d3_houndid']
    });
    
    // Calculate statistics
    const stats = {
      availableCount: available.length,
      adoptedThisMonth: adopted.value.length,
      pendingApplications: pending.value.length,
      byLocation: {} as { [location: string]: number },
      byGender: { male: 0, female: 0 },
      averageTimeToAdoption: 0
    };
    
    // Count by location and gender
    available.forEach(hound => {
      if (hound.cr0d3_location) {
        stats.byLocation[hound.cr0d3_location] = 
          (stats.byLocation[hound.cr0d3_location] || 0) + 1;
      }
      
      if (hound.cr0d3_gender?.toLowerCase() === 'male') {
        stats.byGender.male++;
      } else if (hound.cr0d3_gender?.toLowerCase() === 'female') {
        stats.byGender.female++;
      }
    });
    
    // Calculate average time to adoption
    if (adopted.value.length > 0) {
      let totalDays = 0;
      let count = 0;
      
      adopted.value.forEach(hound => {
        if (hound.cr0d3_adoptiondate && hound.cr0d3_dateadded) {
          const adoptionDate = new Date(hound.cr0d3_adoptiondate);
          const addedDate = new Date(hound.cr0d3_dateadded);
          const days = Math.floor((adoptionDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (days > 0) {
            totalDays += days;
            count++;
          }
        }
      });
      
      if (count > 0) {
        stats.averageTimeToAdoption = Math.round(totalDays / count);
      }
    }
    
    return stats;
  }
  
  /**
   * Update hound adoption status
   */
  async updateAdoptionStatus(
    houndId: string, 
    status: 'Available' | 'Application Pending' | 'Adopted' | 'On Hold',
    adoptionDate?: Date
  ): Promise<IHound> {
    const updateData: Partial<IHound> = {
      cr0d3_adoptionstatus: status
    };
    
    if (status === 'Adopted' && adoptionDate) {
      updateData.cr0d3_adoptiondate = adoptionDate.toISOString();
    }
    
    return this.update(houndId, updateData);
  }
  
  /**
   * Get success stories (recently adopted)
   */
  async getSuccessStories(limit: number = 10): Promise<IHound[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const response = await this.getList({
      filter: `cr0d3_adoptionstatus eq 'Adopted' and cr0d3_adoptiondate ge ${thirtyDaysAgo.toISOString()}`,
      orderBy: 'cr0d3_adoptiondate desc',
      top: limit
    });
    
    return response.value;
  }
}