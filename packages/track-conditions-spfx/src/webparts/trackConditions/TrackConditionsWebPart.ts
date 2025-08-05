import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'TrackConditionsWebPartStrings';
import TrackConditions from './components/TrackConditions';
import { ITrackConditionsProps } from './components/ITrackConditionsProps';
import { TrackService, ITrack } from '../../services/TrackService';

const packageSolution = require('../../../config/package-solution.json');

export interface ITrackConditionsWebPartProps {
  selectedTrackId: string;
}

export default class TrackConditionsWebPart extends BaseClientSideWebPart<ITrackConditionsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private tracks: ITrack[] = [];
  private trackService: TrackService;

  public render(): void {
    let trackName = 'Track';
    for (const track of this.tracks) {
      if (track.trackId === this.properties.selectedTrackId) {
        trackName = track.trackName;
        break;
      }
    }
    
    const element: React.ReactElement<ITrackConditionsProps> = React.createElement(
      TrackConditions,
      {
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context,
        selectedTrackId: this.properties.selectedTrackId,
        selectedTrackName: trackName
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    this.trackService = new TrackService(this.context as any);
    
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
      return this.loadTracks();
    });
  }

  private async loadTracks(): Promise<void> {
    try {
      this.tracks = await this.trackService.getAvailableTracks();
      if (!this.tracks || this.tracks.length === 0) {
        this.tracks = [{trackId: 'default', trackName: 'Default Track'}];
      }
      this.context.propertyPane.refresh();
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
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
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneDropdown('selectedTrackId', {
                  label: 'Select Track',
                  options: this.tracks.map(track => ({
                    key: track.trackId || 'default',
                    text: track.trackName || 'Default Track'
                  })),
                  selectedKey: this.properties.selectedTrackId
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
