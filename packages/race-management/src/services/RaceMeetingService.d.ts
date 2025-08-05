import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IRaceMeeting, IRaceMeetingFilter } from '../models/IRaceMeeting';
export declare class RaceMeetingService {
    private authService;
    private tableName;
    private fieldMappings;
    constructor(context: WebPartContext);
    private discoverFields;
    private findFieldByPattern;
    private findInArray;
    getRaceMeetings(filter?: IRaceMeetingFilter): Promise<IRaceMeeting[]>;
    getAllTracks(): Promise<Array<{
        trackId: string;
        trackName: string;
    }>>;
    getTracksByAuthority(authority: string): Promise<Array<{
        trackId: string;
        trackName: string;
    }>>;
    getTracksByAuthorities(authorities: string[]): Promise<Array<{
        trackId: string;
        trackName: string;
    }>>;
    getRaceMeetingsByDateRange(startDate: Date, endDate: Date, authorities?: string[], trackIds?: string[]): Promise<IRaceMeeting[]>;
}
//# sourceMappingURL=RaceMeetingService.d.ts.map