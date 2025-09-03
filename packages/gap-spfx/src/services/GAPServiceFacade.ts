import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedLogger,
  UnifiedErrorHandler,
  CacheService,
  ErrorType
} from '@grnsw/shared';
import { HoundService } from './domain/HoundService';
import { IHound, IHoundFilters, IHoundSearchResults } from '../models/IHound';

/**
 * Adoption center information
 */
export interface IAdoptionCenter {
  name: string;
  location: string;
  availableHounds: number;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

/**
 * Dashboard data for GAP overview
 */
export interface IGAPDashboard {
  featuredHounds: IHound[];
  statistics: {
    available: number;
    adopted: number;
    pending: number;
    centers: IAdoptionCenter[];
  };
  successStories: IHound[];
  alerts: {
    type: 'info' | 'warning';
    message: string;
  }[];
}

/**
 * Adoption application data
 */
export interface IAdoptionApplication {
  houndId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  hasYard: boolean;
  hasOtherPets: boolean;
  hasChildren: boolean;
  experience: string;
  comments?: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  submittedDate?: Date;
}

/**
 * GAP Service Facade
 * Orchestrates adoption program services
 */
export class GAPServiceFacade {
  private logger: UnifiedLogger;
  private cache: CacheService;
  private houndService: HoundService;
  
  constructor(private context: WebPartContext) {
    this.logger = UnifiedLogger.getInstance();
    this.cache = new CacheService('gap_facade', {
      defaultTTL: 600000, // 10 minutes
      maxSize: 30
    });
    
    this.houndService = new HoundService(context);
  }
  
  /**
   * Get dashboard data for GAP homepage
   */
  async getDashboardData(): Promise<IGAPDashboard> {
    const cacheKey = 'dashboard';
    
    try {
      // Check cache
      const cached = this.cache.get<IGAPDashboard>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Fetch data in parallel
      const [
        featured,
        statistics,
        successStories
      ] = await Promise.all([
        this.houndService.getFeaturedHounds(6),
        this.houndService.getAdoptionStatistics(),
        this.houndService.getSuccessStories(5)
      ]);
      
      // Build center information from statistics
      const centers: IAdoptionCenter[] = Object.entries(statistics.byLocation)
        .map(([name, count]) => ({
          name,
          location: name,
          availableHounds: count
        }));
      
      // Generate alerts
      const alerts: any[] = [];
      
      if (statistics.availableCount < 10) {
        alerts.push({
          type: 'warning',
          message: `Low availability - only ${statistics.availableCount} hounds available for adoption`
        });
      }
      
      if (statistics.pendingApplications > 20) {
        alerts.push({
          type: 'info',
          message: `High demand - ${statistics.pendingApplications} applications pending review`
        });
      }
      
      const dashboard: IGAPDashboard = {
        featuredHounds: featured,
        statistics: {
          available: statistics.availableCount,
          adopted: statistics.adoptedThisMonth,
          pending: statistics.pendingApplications,
          centers
        },
        successStories,
        alerts
      };
      
      // Cache result
      this.cache.set(cacheKey, dashboard);
      
      return dashboard;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'GAPServiceFacade.getDashboardData'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Search hounds with filters
   */
  async searchHounds(filters: IHoundFilters): Promise<IHoundSearchResults> {
    try {
      // Convert filters to service format
      const serviceFilters: any = {};
      
      if (filters.sex) {
        serviceFilters.gender = filters.sex;
      }
      
      if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
        serviceFilters.ageMin = filters.ageMin;
        serviceFilters.ageMax = filters.ageMax;
      }
      
      if (filters.desexed !== undefined) {
        serviceFilters.specialNeeds = !filters.desexed; // Inverted logic
      }
      
      // Search
      const hounds = await this.houndService.searchHounds(serviceFilters);
      
      // Apply text search if provided
      let filtered = hounds;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filtered = hounds.filter(h => 
          h.cr0d3_name?.toLowerCase().includes(searchLower) ||
          h.cr0d3_racingname?.toLowerCase().includes(searchLower) ||
          h.cr0d3_microchipnumber?.includes(filters.searchText) ||
          h.cr0d3_earbrandleft?.includes(filters.searchText) ||
          h.cr0d3_earbrandright?.includes(filters.searchText)
        );
      }
      
      return {
        hounds: filtered,
        totalCount: filtered.length,
        hasMore: false
      };
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'GAPServiceFacade.searchHounds'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get hound details with enriched information
   */
  async getHoundDetails(houndId: string): Promise<IHound | null> {
    const cacheKey = CacheService.createKey('hound', houndId);
    
    try {
      // Check cache
      const cached = this.cache.get<IHound>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Get full details
      const hound = await this.houndService.getHoundDetails(houndId);
      
      if (hound) {
        // Enrich with computed fields
        if (hound.cr0d3_whelpingdate) {
          const birthDate = new Date(hound.cr0d3_whelpingdate);
          const ageInMs = Date.now() - birthDate.getTime();
          hound.age = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365));
        }
        
        // Set display name
        hound.displayName = hound.cr0d3_racingname || 
                           hound.cr0d3_name || 
                           hound.cr0d3_microchipnumber || 
                           'Unknown';
        
        // Cache result
        this.cache.set(cacheKey, hound);
      }
      
      return hound;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'GAPServiceFacade.getHoundDetails'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get hounds by adoption center
   */
  async getHoundsByCenter(centerName: string): Promise<IHound[]> {
    const cacheKey = CacheService.createKey('center', centerName);
    
    try {
      // Check cache
      const cached = this.cache.get<IHound[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const hounds = await this.houndService.getHoundsByCenter(centerName);
      
      // Cache result
      this.cache.set(cacheKey, hounds);
      
      return hounds;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'GAPServiceFacade.getHoundsByCenter'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Submit adoption application
   */
  async submitAdoptionApplication(application: IAdoptionApplication): Promise<boolean> {
    try {
      // In a real implementation, this would create a record in Dataverse
      // For now, we'll simulate the submission
      
      this.logger.info('Adoption application submitted', {
        houndId: application.houndId,
        applicant: application.applicantName
      });
      
      // Clear relevant caches
      this.cache.invalidatePattern(/^dashboard/);
      this.cache.delete(CacheService.createKey('hound', application.houndId));
      
      // Update hound status to pending
      await this.houndService.updateAdoptionStatus(
        application.houndId,
        'Application Pending'
      );
      
      return true;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'GAPServiceFacade.submitAdoptionApplication'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get recommended hounds based on user preferences
   */
  async getRecommendedHounds(preferences: {
    hasYard: boolean;
    hasOtherPets: boolean;
    hasChildren: boolean;
    experience: 'First Time' | 'Some Experience' | 'Experienced';
  }): Promise<IHound[]> {
    try {
      const filters: any = {};
      
      // Apply preference-based filters
      if (preferences.hasChildren) {
        filters.goodWithKids = true;
      }
      
      if (preferences.hasOtherPets) {
        filters.goodWithDogs = true;
      }
      
      // For first-time owners, avoid special needs
      if (preferences.experience === 'First Time') {
        filters.specialNeeds = false;
        filters.temperament = 'calm';
      }
      
      const hounds = await this.houndService.searchHounds(filters);
      
      // Sort by best match (this is simplified - real implementation would have scoring)
      return hounds.slice(0, 6);
      
    } catch (error) {
      this.logger.error('Failed to get recommendations', { preferences, error });
      return [];
    }
  }
  
  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cache.clear();
    this.houndService.clearCache();
    this.logger.info('GAP caches cleared');
  }
  
  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      facade: this.cache.getStats(),
      hounds: this.houndService.getCacheStats()
    };
  }
}