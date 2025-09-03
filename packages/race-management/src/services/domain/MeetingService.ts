import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedBaseDataverseService,
  DATAVERSE_ENVIRONMENTS,
  IUnifiedODataQuery as IODataQuery,
  IUnifiedDataverseResponse as IDataverseResponse,
  CacheService
} from '@grnsw/shared';
import { IMeeting, IMeetingFilters } from '../../models/IRaceData';

/**
 * Domain service for Race Meetings
 * Handles all business logic related to race meetings
 */
export class MeetingService extends UnifiedBaseDataverseService<IMeeting> {
  protected tableName = 'raceMeetings';
  
  protected getTableName(): string {
    return this.environment.tables.raceMeetings;
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.racing, {
      enableCaching: true,
      cacheTTL: 60000, // 1 minute for race data
      enableThrottling: true,
      requestsPerSecond: 100
    });
  }
  
  /**
   * Get meetings with applied filters
   */
  async getMeetingsWithFilters(filters?: IMeetingFilters): Promise<IDataverseResponse<IMeeting>> {
    const query: IODataQuery = {
      select: [
        'cr4cc_racemeetingid',
        'cr4cc_meetingdate',
        'cr4cc_trackname',
        'cr4cc_authority',
        'cr4cc_timeslot',
        'cr4cc_type',
        'cr4cc_meetingname',
        'cr4cc_cancelled',
        'cr616_weather',
        'cr616_stewardcomment',
        'cr616_trackcondition'
      ],
      orderBy: 'cr4cc_meetingdate desc',
      top: filters?.pageSize || 50
    };
    
    // Build filter conditions
    const filterConditions: string[] = [];
    
    if (filters?.startDate) {
      filterConditions.push(`cr4cc_meetingdate ge ${filters.startDate.toISOString()}`);
    }
    
    if (filters?.endDate) {
      filterConditions.push(`cr4cc_meetingdate le ${filters.endDate.toISOString()}`);
    }
    
    if (filters?.authority) {
      filterConditions.push(`cr4cc_authority eq '${filters.authority}'`);
    }
    
    if (filters?.track) {
      filterConditions.push(`cr4cc_trackname eq '${filters.track}'`);
    }
    
    if (filters?.excludeCancelled) {
      filterConditions.push(`cr4cc_cancelled eq false`);
    }
    
    if (filterConditions.length > 0) {
      query.filter = filterConditions.join(' and ');
    }
    
    return this.getList(query);
  }
  
  /**
   * Get meetings by track
   */
  async getMeetingsByTrack(trackName: string, limit: number = 50): Promise<IMeeting[]> {
    const response = await this.getList({
      filter: `cr4cc_trackname eq '${trackName}'`,
      orderBy: 'cr4cc_meetingdate desc',
      top: limit
    });
    
    return response.value;
  }
  
  /**
   * Get meetings by date range
   */
  async getMeetingsByDateRange(startDate: Date, endDate: Date): Promise<IMeeting[]> {
    const response = await this.getList({
      filter: `cr4cc_meetingdate ge ${startDate.toISOString()} and cr4cc_meetingdate le ${endDate.toISOString()}`,
      orderBy: 'cr4cc_meetingdate asc'
    });
    
    return response.value;
  }
  
  /**
   * Get today's meetings
   */
  async getTodaysMeetings(): Promise<IMeeting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getMeetingsByDateRange(today, tomorrow);
  }
  
  /**
   * Get upcoming meetings
   */
  async getUpcomingMeetings(days: number = 7): Promise<IMeeting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + days);
    
    return this.getMeetingsByDateRange(today, future);
  }
  
  /**
   * Get meeting statistics
   */
  async getMeetingStatistics(year?: number): Promise<{
    totalMeetings: number;
    byAuthority: { [key: string]: number };
    byTrack: { [key: string]: number };
    cancelledCount: number;
  }> {
    // Use current year if not specified
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    
    const meetings = await this.getMeetingsByDateRange(startDate, endDate);
    
    const stats = {
      totalMeetings: meetings.length,
      byAuthority: {} as { [key: string]: number },
      byTrack: {} as { [key: string]: number },
      cancelledCount: 0
    };
    
    meetings.forEach(meeting => {
      // Count by authority
      if (meeting.cr4cc_authority) {
        stats.byAuthority[meeting.cr4cc_authority] = 
          (stats.byAuthority[meeting.cr4cc_authority] || 0) + 1;
      }
      
      // Count by track
      if (meeting.cr4cc_trackname) {
        stats.byTrack[meeting.cr4cc_trackname] = 
          (stats.byTrack[meeting.cr4cc_trackname] || 0) + 1;
      }
      
      // Count cancelled
      if (meeting.cr4cc_cancelled) {
        stats.cancelledCount++;
      }
    });
    
    return stats;
  }
  
  /**
   * Search meetings by text
   */
  async searchMeetings(searchText: string): Promise<IMeeting[]> {
    const response = await this.getList({
      filter: `contains(cr4cc_meetingname, '${searchText}') or contains(cr4cc_trackname, '${searchText}')`,
      orderBy: 'cr4cc_meetingdate desc',
      top: 100
    });
    
    return response.value;
  }
  
  /**
   * Batch update meeting status
   */
  async updateMeetingStatus(meetingId: string, cancelled: boolean, comment?: string): Promise<IMeeting> {
    const updateData: Partial<IMeeting> = {
      cr4cc_cancelled: cancelled
    };
    
    if (comment) {
      updateData.cr616_stewardcomment = comment;
    }
    
    return this.update(meetingId, updateData);
  }
}