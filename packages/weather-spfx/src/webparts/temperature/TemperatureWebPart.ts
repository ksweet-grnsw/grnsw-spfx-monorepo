import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  type IPropertyPaneDropdownOption,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'TemperatureWebPartStrings';
import Temperature from './components/Temperature';
import { ITemperatureProps } from './components/ITemperatureProps';
import { TrackService } from '../../services';

const packageSolution = require('../../../config/package-solution.json');

export interface ITemperatureWebPartProps {
  selectedTrack: string;
}

export default class TemperatureWebPart extends BaseClientSideWebPart<ITemperatureWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private trackService: TrackService;
  private trackOptions: IPropertyPaneDropdownOption[] = [];
  private tracksLoaded: boolean = false;

  protected async onInit(): Promise<void> {
    this.trackService = new TrackService(this.context);
    
    // Clear cache and load tracks
    await this.loadTracks();

    const message = await this._getEnvironmentMessage();
    this._environmentMessage = message;
  }

  private async loadTracks(): Promise<void> {
    try {
      // Clear cache to ensure fresh data
      TrackService.clearCache();
      console.log('Loading tracks for Temperature web part...');
      
      const tracks = await this.trackService.getAvailableTracks();
      console.log(`Loaded ${tracks.length} tracks:`, tracks);
      
      this.trackOptions = tracks.map(track => ({
        key: track.trackId,
        text: track.trackName
      }));

      // Set default track if not selected
      if (!this.properties.selectedTrack && this.trackOptions.length > 0) {
        this.properties.selectedTrack = this.trackOptions[0].key as string;
      }
      
      
      this.tracksLoaded = true;
    } catch (error) {
      console.error('Error loading tracks:', error);
      
      // Fallback: Use hardcoded tracks if API fails
      console.log('Using fallback track list');
      this.trackOptions = [
        { key: 'broken-hill', text: 'Broken Hill' },
        { key: 'bulli', text: 'Bulli' },
        { key: 'casino', text: 'Casino' },
        { key: 'dapto', text: 'Dapto' },
        { key: 'dubbo', text: 'Dubbo' },
        { key: 'gosford', text: 'Gosford' },
        { key: 'goulburn', text: 'Goulburn' },
        { key: 'grafton', text: 'Grafton' },
        { key: 'gunnedah', text: 'Gunnedah' },
        { key: 'lithgow', text: 'Lithgow' },
        { key: 'maitland', text: 'Maitland' },
        { key: 'nowra', text: 'Nowra' },
        { key: 'richmond', text: 'Richmond' },
        { key: 'taree', text: 'Taree' },
        { key: 'temora', text: 'Temora' },
        { key: 'the-gardens', text: 'The Gardens' },
        { key: 'wagga-wagga', text: 'Wagga Wagga' },
        { key: 'wentworth-park', text: 'Wentworth Park' }
      ];
      
      this.tracksLoaded = true;
    }
  }

  public render(): void {
    const element: React.ReactElement<ITemperatureProps> = React.createElement(
      Temperature,
      {
        selectedTrack: this.properties.selectedTrack,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
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

  protected get disableReactivePropertyChanges(): boolean {
    return false;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const dropdownDisabled = !this.tracksLoaded || this.trackOptions.length === 0;
    
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.BasicGroupName,
              isCollapsed: false,
              groupFields: [
                PropertyPaneDropdown('selectedTrack', {
                  label: 'Select Track',
                  options: this.trackOptions.length > 0 ? this.trackOptions : [{ key: '', text: 'Loading tracks...' }],
                  disabled: dropdownDisabled,
                  selectedKey: this.properties.selectedTrack || ''
                })
              ]
            },
            {
              groupName: 'About',
              isCollapsed: true,
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

  protected async onPropertyPaneConfigurationStart(): Promise<void> {
    console.log('Property pane opened, reloading tracks...');
    await this.loadTracks();
    
    // Refresh the property pane
    this.context.propertyPane.refresh();
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    console.log(`Property changed: ${propertyPath}, old: ${oldValue}, new: ${newValue}`);
    
    if (propertyPath === 'selectedTrack' && newValue !== oldValue) {
      // Update the property
      this.properties.selectedTrack = newValue;
      
      // Re-render the component when track changes
      this.render();
      
      // Refresh property pane to show updated value
      this.context.propertyPane.refresh();
      
      super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    }
  }
}