import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
  PropertyPaneDropdown,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'RealTimeSafetyDashboardWebPartStrings';
import SafetyDashboard from '../safetyDashboard/components/SafetyDashboard';
import { ISafetyDashboardProps } from '../safetyDashboard/components/ISafetyDashboardProps';

export interface IRealTimeSafetyDashboardWebPartProps {
  description: string;
  injuryTargetPerMonth: number;
  refreshInterval: number;
  defaultTrack: string;
  selectedTrack: string;
}

export default class RealTimeSafetyDashboardWebPart extends BaseClientSideWebPart<IRealTimeSafetyDashboardWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<ISafetyDashboardProps> = React.createElement(
      SafetyDashboard,
      {
        description: this.properties.description,
        injuryTargetPerMonth: this.properties.injuryTargetPerMonth || 10,
        refreshInterval: this.properties.refreshInterval || 900000,
        defaultTrack: this.properties.defaultTrack || '',
        selectedTrack: this.properties.selectedTrack || this.properties.defaultTrack || '',
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context,
        onTrackChange: this._onTrackChange.bind(this)
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
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

  private _onTrackChange(track: string): void {
    this.properties.selectedTrack = track;
    this.render();
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
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneSlider('injuryTargetPerMonth', {
                  label: 'Monthly Injury Target',
                  min: 1,
                  max: 50,
                  value: 10,
                  showValue: true,
                  step: 1
                }),
                PropertyPaneSlider('refreshInterval', {
                  label: 'Refresh Interval (minutes)',
                  min: 5,
                  max: 60,
                  value: 15,
                  showValue: true,
                  step: 5
                }),
                PropertyPaneDropdown('defaultTrack', {
                  label: 'Default Track',
                  options: [
                    { key: '', text: 'All Tracks' },
                    { key: 'Broken Hill', text: 'Broken Hill' },
                    { key: 'Bulli', text: 'Bulli' },
                    { key: 'Casino', text: 'Casino' },
                    { key: 'Dapto', text: 'Dapto' },
                    { key: 'Dubbo', text: 'Dubbo' },
                    { key: 'Gosford', text: 'Gosford' },
                    { key: 'Goulburn', text: 'Goulburn' },
                    { key: 'Grafton', text: 'Grafton' },
                    { key: 'Gunnedah', text: 'Gunnedah' },
                    { key: 'Lithgow', text: 'Lithgow' },
                    { key: 'Maitland', text: 'Maitland' },
                    { key: 'Nowra', text: 'Nowra' },
                    { key: 'Richmond', text: 'Richmond' },
                    { key: 'Taree', text: 'Taree' },
                    { key: 'Temora', text: 'Temora' },
                    { key: 'The Gardens', text: 'The Gardens' },
                    { key: 'Wagga Wagga', text: 'Wagga Wagga' },
                    { key: 'Wentworth Park', text: 'Wentworth Park' }
                  ],
                  selectedKey: this.properties.defaultTrack || ''
                })
              ]
            },
            {
              groupName: 'About',
              groupFields: [
                PropertyPaneLabel('version', {
                  text: `Version: 1.1.4`
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
