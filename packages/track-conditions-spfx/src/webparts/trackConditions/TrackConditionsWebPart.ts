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

import * as strings from 'TrackConditionsWebPartStrings';
import TrackConditions from './components/TrackConditions';
import { ITrackConditionsProps } from './components/ITrackConditionsProps';
import { trackOptions } from '../shared/trackOptions';

interface IPackageSolution {
  solution: {
    version: string;
    name: string;
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const packageSolution: IPackageSolution = require('../../../config/package-solution.json');

export interface ITrackConditionsWebPartProps {
  selectedTrackId: string;
}

export default class TrackConditionsWebPart extends BaseClientSideWebPart<ITrackConditionsWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<ITrackConditionsProps> = React.createElement(
      TrackConditions,
      {
        selectedTrackId: this.properties.selectedTrackId || 'wentworth-park',
        selectedTrackName: this.getTrackName(this.properties.selectedTrackId),
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

  private getTrackName(trackId: string): string {
    if (!trackId) return 'All Tracks';
    
    for (let i = 0; i < trackOptions.length; i++) {
      if (trackOptions[i].key === trackId) {
        return trackOptions[i].text;
      }
    }
    
    return 'Unknown Track';
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
                PropertyPaneDropdown('selectedTrackId', {
                  label: 'Select Track',
                  options: trackOptions,
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