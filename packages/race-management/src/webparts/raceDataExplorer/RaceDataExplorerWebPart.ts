import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  PropertyPaneSlider,
  PropertyPaneLabel,
  PropertyPaneChoiceGroup
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

// @ts-ignore - Auto-generated strings file
import * as strings from 'RaceDataExplorerWebPartStrings';
import RaceDataExplorer from './components/RaceDataExplorer';
import { IRaceDataExplorerProps } from './components/IRaceDataExplorerProps';

const version = require('../../../package.json').version;

export interface IRaceDataExplorerWebPartProps {
  dataverseUrl: string;
  defaultView: 'meetings' | 'races' | 'contestants';
  pageSize: number;
  showFilters: boolean;
  showSearch: boolean;
  theme: 'neutral' | 'meeting' | 'race' | 'contestant';
  tableDensity: 'compact' | 'normal' | 'comfortable';
}

export default class RaceDataExplorerWebPart extends BaseClientSideWebPart<IRaceDataExplorerWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IRaceDataExplorerProps> = React.createElement(
      RaceDataExplorer,
      {
        dataverseUrl: this.properties.dataverseUrl,
        defaultView: this.properties.defaultView,
        pageSize: this.properties.pageSize,
        showFilters: this.properties.showFilters,
        showSearch: this.properties.showSearch,
        theme: this.properties.theme,
        tableDensity: this.properties.tableDensity || 'normal',
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        httpClient: this.context.httpClient,
        context: this.context
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
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              throw new Error('Unknown host');
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
                PropertyPaneTextField('dataverseUrl', {
                  label: 'Dataverse URL',
                  description: 'Enter your Dataverse environment URL',
                  placeholder: 'https://[environment].crm6.dynamics.com'
                }),
                PropertyPaneDropdown('defaultView', {
                  label: 'Default View',
                  options: [
                    { key: 'meetings', text: 'Meetings' },
                    { key: 'races', text: 'Races' },
                    { key: 'contestants', text: 'Contestants' }
                  ]
                }),
                PropertyPaneDropdown('theme', {
                  label: 'Visual Theme',
                  options: [
                    { key: 'neutral', text: 'Neutral' },
                    { key: 'meeting', text: 'Meeting (Blue)' },
                    { key: 'race', text: 'Race (Green)' },
                    { key: 'contestant', text: 'Contestant (Orange)' }
                  ]
                })
              ]
            },
            {
              groupName: 'Display Options',
              groupFields: [
                PropertyPaneToggle('showFilters', {
                  label: 'Show Filters',
                  onText: 'On',
                  offText: 'Off'
                }),
                PropertyPaneToggle('showSearch', {
                  label: 'Show Search',
                  onText: 'On',
                  offText: 'Off'
                }),
                PropertyPaneSlider('pageSize', {
                  label: 'Page Size',
                  min: 10,
                  max: 100,
                  step: 5,
                  showValue: true
                }),
                PropertyPaneChoiceGroup('tableDensity', {
                  label: 'Table Density',
                  options: [
                    { key: 'compact', text: 'Compact' },
                    { key: 'normal', text: 'Normal' },
                    { key: 'comfortable', text: 'Comfortable' }
                  ]
                })
              ]
            },
            {
              groupName: 'About',
              groupFields: [
                PropertyPaneLabel('version', {
                  text: `Version: ${version}`
                }),
                PropertyPaneLabel('description', {
                  text: 'This web part provides comprehensive race data exploration with drill-down capabilities from Meetings to Races to Contestants.'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}