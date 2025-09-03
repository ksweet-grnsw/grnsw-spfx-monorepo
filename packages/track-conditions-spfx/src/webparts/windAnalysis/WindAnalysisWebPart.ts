import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneLabel,
  PropertyPaneDropdown
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'WindAnalysisWebPartStrings';
import WindAnalysis from './components/WindAnalysis';
import { IWindAnalysisProps } from './components/IWindAnalysisProps';
import { trackOptions } from '../shared/trackOptions';

const packageSolution: any = require('../../../config/package-solution.json');

export interface IWindAnalysisWebPartProps {
  selectedTrack: string;
  defaultView: 'current' | 'windRose';
  defaultPeriod: 'today' | 'week' | 'month';
  displayMode: 'full' | 'compact';
}

export default class WindAnalysisWebPart extends BaseClientSideWebPart<IWindAnalysisWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IWindAnalysisProps> = React.createElement(
      WindAnalysis,
      {
        selectedTrack: this.properties.selectedTrack || 'wentworth-park',
        defaultView: this.properties.defaultView || 'current',
        defaultPeriod: this.properties.defaultPeriod || 'today',
        displayMode: this.properties.displayMode || 'full',
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
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
                PropertyPaneDropdown('selectedTrack', {
                  label: 'Select Track',
                  options: trackOptions,
                  selectedKey: this.properties.selectedTrack
                }),
                PropertyPaneDropdown('defaultView', {
                  label: 'Default View',
                  options: [
                    { key: 'current', text: 'Current Wind' },
                    { key: 'windRose', text: 'Wind Rose' }
                  ],
                  selectedKey: this.properties.defaultView || 'current'
                }),
                PropertyPaneDropdown('defaultPeriod', {
                  label: 'Default Period',
                  options: [
                    { key: 'today', text: 'Today' },
                    { key: 'week', text: 'Week' },
                    { key: 'month', text: 'Month' }
                  ],
                  selectedKey: this.properties.defaultPeriod || 'today'
                }),
                PropertyPaneDropdown('displayMode', {
                  label: 'Display Mode',
                  options: [
                    { key: 'full', text: 'Full' },
                    { key: 'compact', text: 'Compact' }
                  ],
                  selectedKey: this.properties.displayMode || 'full'
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