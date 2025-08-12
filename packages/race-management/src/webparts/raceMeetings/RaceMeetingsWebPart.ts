import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'RaceMeetingsWebPartStrings';
// Using compatibility wrapper for safe migration between versions
// This automatically handles fallback to original if Enterprise UI fails
import RaceMeetings from './components/RaceMeetingsCompatibility';
import { IRaceMeetingsProps } from './components/IRaceMeetingsProps';
import { RaceMeetingService } from '../../services/RaceMeetingService';
import { AUTHORITIES, CalendarView } from '../../models/IRaceMeeting';

const packageSolution = require('../../../config/package-solution.json');

export interface IRaceMeetingsWebPartProps {
  defaultView: CalendarView;
  selectedAuthority: string;
  selectedTrackId: string;
  showPastMeetings: boolean;
  showFutureMeetings: boolean;
  multiSelect: boolean;
  multiSelectDelimiter: string;
}

export default class RaceMeetingsWebPart extends BaseClientSideWebPart<IRaceMeetingsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private raceMeetingService: RaceMeetingService;
  private tracks: Array<{trackId: string, trackName: string}> = [];

  public render(): void {
    const element: React.ReactElement<IRaceMeetingsProps> = React.createElement(
      RaceMeetings,
      {
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context,
        defaultView: this.properties.defaultView,
        selectedAuthority: this.properties.selectedAuthority,
        selectedTrackId: this.properties.selectedTrackId,
        showPastMeetings: this.properties.showPastMeetings,
        showFutureMeetings: this.properties.showFutureMeetings,
        multiSelect: this.properties.multiSelect ?? true,
        multiSelectDelimiter: this.properties.multiSelectDelimiter ?? ',',
        onUpdateFilters: this.updateFilters.bind(this)
      }
    );

    ReactDom.render(element, this.domElement);
  }

  private updateFilters(authority: string, trackId: string): void {
    this.properties.selectedAuthority = authority;
    this.properties.selectedTrackId = trackId;
    // Refresh the property pane to show updated values
    this.context.propertyPane.refresh();
    // Re-render to ensure consistency
    this.render();
  }

  protected onInit(): Promise<void> {
    this.raceMeetingService = new RaceMeetingService(this.context as any);
    
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
      if (this.properties.selectedAuthority) {
        return this.loadTracksByAuthority(this.properties.selectedAuthority);
      }
      return Promise.resolve();
    });
  }

  private async loadTracksByAuthority(authority: string): Promise<void> {
    try {
      this.tracks = await this.raceMeetingService.getTracksByAuthority(authority);
      this.context.propertyPane.refresh();
    } catch (error) {
      console.error('Error loading tracks:', error);
      this.tracks = [];
    }
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    if (propertyPath === 'selectedAuthority' && oldValue !== newValue) {
      this.properties.selectedTrackId = ''; // Reset track selection
      this.loadTracksByAuthority(newValue).then(() => {
        this.context.propertyPane.refresh();
      }).catch(error => {
        console.error('Error updating tracks:', error);
      });
    }
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams':
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }
          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const authorityOptions = [
      { key: '', text: 'All Authorities' },
      ...AUTHORITIES.map(auth => ({
        key: auth.code,
        text: auth.name
      }))
    ];

    const trackOptions = [
      { key: '', text: 'All Tracks' },
      ...this.tracks.map(track => ({
        key: track.trackId,
        text: track.trackName
      }))
    ];

    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: 'Display Settings',
              groupFields: [
                PropertyPaneDropdown('defaultView', {
                  label: 'Default Calendar View',
                  options: [
                    { key: 'day', text: 'Day View' },
                    { key: 'week', text: 'Week View' },
                    { key: 'month', text: 'Month View' }
                  ]
                }),
                PropertyPaneToggle('showPastMeetings', {
                  label: 'Show Past Meetings',
                  checked: this.properties.showPastMeetings
                }),
                PropertyPaneToggle('showFutureMeetings', {
                  label: 'Show Future Meetings',
                  checked: this.properties.showFutureMeetings
                })
              ]
            },
            {
              groupName: 'Filter Settings',
              groupFields: [
                PropertyPaneToggle('multiSelect', {
                  label: 'Enable Multi-Select Filters',
                  checked: this.properties.multiSelect ?? true
                }),
                PropertyPaneDropdown('selectedAuthority', {
                  label: 'Filter by Authority',
                  options: authorityOptions,
                  selectedKey: this.properties.selectedAuthority
                }),
                PropertyPaneDropdown('selectedTrackId', {
                  label: 'Filter by Track',
                  options: trackOptions,
                  selectedKey: this.properties.selectedTrackId,
                  disabled: !this.properties.selectedAuthority
                })
              ]
            },
            {
              groupName: 'About',
              groupFields: [
                PropertyPaneLabel('version', {
                  text: `Version: ${packageSolution.solution.version}`
                })
              ]
            }
          ]
        }
      ]
    };
  }
}