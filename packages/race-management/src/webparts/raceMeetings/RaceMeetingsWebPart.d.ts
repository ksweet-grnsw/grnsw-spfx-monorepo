import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { CalendarView } from '../../models/IRaceMeeting';
export interface IRaceMeetingsWebPartProps {
    defaultView: CalendarView;
    selectedAuthority: string;
    selectedTrackId: string;
    showPastMeetings: boolean;
    showFutureMeetings: boolean;
}
export default class RaceMeetingsWebPart extends BaseClientSideWebPart<IRaceMeetingsWebPartProps> {
    private _isDarkTheme;
    private _environmentMessage;
    private raceMeetingService;
    private tracks;
    render(): void;
    private updateFilters;
    protected onInit(): Promise<void>;
    private loadTracksByAuthority;
    protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void;
    private _getEnvironmentMessage;
    protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void;
    protected onDispose(): void;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
}
//# sourceMappingURL=RaceMeetingsWebPart.d.ts.map