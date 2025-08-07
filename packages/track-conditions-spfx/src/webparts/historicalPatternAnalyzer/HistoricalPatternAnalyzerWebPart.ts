import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneToggle,
  PropertyPaneSlider,
  PropertyPaneLabel,
  IPropertyPaneDropdownOption
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'HistoricalPatternAnalyzerWebPartStrings';
import HistoricalPatternAnalyzer from './components/HistoricalPatternAnalyzer';
import { IHistoricalPatternAnalyzerProps } from './components/IHistoricalPatternAnalyzerProps';
import { trackOptions } from '../shared/trackOptions';

const packageSolution = require('../../../config/package-solution.json');

export interface IHistoricalPatternAnalyzerWebPartProps {
  refreshInterval: number;
  defaultTimeRange: string;
  defaultTrack: string;
  defaultTracks: string[];
  viewMode: 'compact' | 'standard' | 'detailed';
  enableAlerts: boolean;
  optimalScoreThreshold: number;
  volatilityThreshold: number;
  cacheMinutes: number;
  maxRecords: number;
  debugMode: boolean;
}

export default class HistoricalPatternAnalyzerWebPart extends BaseClientSideWebPart<IHistoricalPatternAnalyzerWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IHistoricalPatternAnalyzerProps> = React.createElement(
      HistoricalPatternAnalyzer,
      {
        refreshInterval: this.properties.refreshInterval || 5,
        defaultTimeRange: this.properties.defaultTimeRange || '7days',
        defaultTrack: this.properties.defaultTrack || '',
        defaultTracks: this.properties.defaultTracks || (this.properties.defaultTrack ? [this.properties.defaultTrack] : []),
        viewMode: this.properties.viewMode || 'standard',
        enableAlerts: this.properties.enableAlerts,
        optimalScoreThreshold: this.properties.optimalScoreThreshold || 85,
        volatilityThreshold: this.properties.volatilityThreshold || 20,
        cacheMinutes: this.properties.cacheMinutes || 60,
        maxRecords: this.properties.maxRecords || 5000,
        debugMode: this.properties.debugMode || false,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context,
        onUpdateProperty: (property: string, value: any) => {
          (this.properties as any)[property] = value;
          this.render();
        }
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
    const timeRangeOptions: IPropertyPaneDropdownOption[] = [
      { key: '24hours', text: 'Last 24 Hours' },
      { key: '7days', text: 'Last 7 Days' },
      { key: '30days', text: 'Last 30 Days' },
      { key: '90days', text: 'Last 90 Days' }
    ];

    const viewModeOptions: IPropertyPaneDropdownOption[] = [
      { key: 'compact', text: 'Compact' },
      { key: 'standard', text: 'Standard' },
      { key: 'detailed', text: 'Detailed' }
    ];

    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: 'Data Settings',
              groupFields: [
                PropertyPaneDropdown('defaultTrack', {
                  label: 'Default Track',
                  options: [
                    { key: '', text: 'None' },
                    ...trackOptions.map(opt => ({ key: opt.text, text: opt.text }))
                  ],
                  selectedKey: this.properties.defaultTrack
                }),
                PropertyPaneDropdown('refreshInterval', {
                  label: 'Refresh Interval (minutes)',
                  options: [
                    { key: 5, text: '5 minutes' },
                    { key: 10, text: '10 minutes' },
                    { key: 15, text: '15 minutes' }
                  ],
                  selectedKey: this.properties.refreshInterval
                }),
                PropertyPaneDropdown('defaultTimeRange', {
                  label: 'Default Time Range',
                  options: timeRangeOptions,
                  selectedKey: this.properties.defaultTimeRange
                }),
                PropertyPaneSlider('maxRecords', {
                  label: 'Maximum Records to Load',
                  min: 1000,
                  max: 10000,
                  step: 1000,
                  showValue: true
                })
              ]
            },
            {
              groupName: 'Display Settings',
              groupFields: [
                PropertyPaneDropdown('viewMode', {
                  label: 'View Mode',
                  options: viewModeOptions,
                  selectedKey: this.properties.viewMode
                }),
                PropertyPaneToggle('enableAlerts', {
                  label: 'Enable Alerts',
                  checked: this.properties.enableAlerts
                })
              ]
            },
            {
              groupName: 'Alert Settings',
              groupFields: [
                PropertyPaneSlider('optimalScoreThreshold', {
                  label: 'Optimal Score Threshold',
                  min: 70,
                  max: 95,
                  step: 5,
                  showValue: true,
                  disabled: !this.properties.enableAlerts
                }),
                PropertyPaneSlider('volatilityThreshold', {
                  label: 'Volatility Threshold',
                  min: 10,
                  max: 50,
                  step: 5,
                  showValue: true,
                  disabled: !this.properties.enableAlerts
                })
              ]
            },
            {
              groupName: 'Advanced Settings',
              groupFields: [
                PropertyPaneSlider('cacheMinutes', {
                  label: 'Cache Duration (minutes)',
                  min: 30,
                  max: 240,
                  step: 30,
                  showValue: true
                }),
                PropertyPaneToggle('debugMode', {
                  label: 'Debug Mode',
                  checked: this.properties.debugMode
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