import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider,
  PropertyPaneToggle,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import HoundSearch, { IHoundSearchProps } from './components/HoundSearch';

const version = require('../../../package.json').version;

export interface IHoundSearchWebPartProps {
  title: string;
  pageSize: number;
  showOnlyAvailable: boolean;
  enableAdvancedFilters: boolean;
}

export default class HoundSearchWebPart extends BaseClientSideWebPart<IHoundSearchWebPartProps> {
  private _isDarkTheme: boolean = false;

  public render(): void {
    const element: React.ReactElement<IHoundSearchProps> = React.createElement(
      HoundSearch,
      {
        title: this.properties.title,
        pageSize: this.properties.pageSize,
        showOnlyAvailable: this.properties.showOnlyAvailable,
        enableAdvancedFilters: this.properties.enableAdvancedFilters,
        context: this.context,
        isDarkTheme: this._isDarkTheme,
        hasTeamsContext: !!this.context.sdks.microsoftTeams
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return super.onInit();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

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
            description: 'Configure the GAP Hound Search web part'
          },
          groups: [
            {
              groupName: 'Display Settings',
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Title',
                  description: 'The title displayed at the top of the web part'
                }),
                PropertyPaneSlider('pageSize', {
                  label: 'Results per page',
                  min: 10,
                  max: 50,
                  step: 10,
                  showValue: true
                }),
                PropertyPaneToggle('showOnlyAvailable', {
                  label: 'Show only available dogs',
                  onText: 'Yes',
                  offText: 'No'
                }),
                PropertyPaneToggle('enableAdvancedFilters', {
                  label: 'Enable advanced filters',
                  onText: 'Enabled',
                  offText: 'Disabled'
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
                  text: 'This web part searches greyhounds in the GAP Dataverse environment'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}