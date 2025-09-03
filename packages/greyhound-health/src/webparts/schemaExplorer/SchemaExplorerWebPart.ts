import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneLabel
} from '@microsoft/sp-property-pane';
import { DataverseSchemaFetcher } from '../../utils/fetchTableSchema';

export interface ISchemaExplorerWebPartProps {
  tableName: string;
}

export default class SchemaExplorerWebPart extends BaseClientSideWebPart<ISchemaExplorerWebPartProps> {
  
  public async render(): Promise<void> {
    this.domElement.innerHTML = `
      <div style="padding: 20px;">
        <h2>Dataverse Table Schema Explorer</h2>
        <div>
          <label>Table Name: </label>
          <input type="text" id="tableNameInput" value="cra5e_injurydata" style="width: 300px; padding: 5px;" />
          <button id="fetchSchemaBtn" style="margin-left: 10px; padding: 5px 15px;">Fetch Schema</button>
        </div>
        <div id="results" style="margin-top: 20px;">
          <div id="loading" style="display: none;">Loading...</div>
          <div id="error" style="color: red; display: none;"></div>
          <div id="schemaOutput" style="display: none;">
            <h3>Table Schema</h3>
            <pre id="schemaJson" style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px;"></pre>
            <h3>Generated TypeScript Interface</h3>
            <pre id="tsInterface" style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px;"></pre>
            <h3>Sample Data</h3>
            <pre id="sampleData" style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px;"></pre>
          </div>
        </div>
      </div>
    `;

    const fetchBtn = document.getElementById('fetchSchemaBtn');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => this.fetchTableSchema());
    }
  }

  private async fetchTableSchema(): Promise<void> {
    const tableNameInput = document.getElementById('tableNameInput') as HTMLInputElement;
    const tableName = tableNameInput?.value || 'cra5e_injurydata';
    
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const schemaOutput = document.getElementById('schemaOutput');
    const schemaJson = document.getElementById('schemaJson');
    const tsInterface = document.getElementById('tsInterface');
    const sampleData = document.getElementById('sampleData');

    if (loading) loading.style.display = 'block';
    if (error) {
      error.style.display = 'none';
      error.textContent = '';
    }
    if (schemaOutput) schemaOutput.style.display = 'none';

    try {
      const fetcher = new DataverseSchemaFetcher(this.context);
      
      // Fetch schema
      // Fetching schema for table
      const schema = await fetcher.getTableSchema(tableName);
      
      // Generate TypeScript interface
      const tsInterfaceCode = fetcher.generateTypeScriptInterface(schema);
      
      // Fetch sample data
      let samples: any[] = [];
      try {
        samples = await fetcher.getSampleData(tableName, 3);
      } catch (err) {
        // Could not fetch sample data
      }

      // Display results
      if (schemaJson) schemaJson.textContent = JSON.stringify(schema, null, 2);
      if (tsInterface) tsInterface.textContent = tsInterfaceCode;
      if (sampleData) {
        if (samples.length > 0) {
          sampleData.textContent = JSON.stringify(samples, null, 2);
        } else {
          sampleData.textContent = 'No sample data available or table is empty.';
        }
      }
      if (schemaOutput) schemaOutput.style.display = 'block';

      // Schema, interface and samples processed successfully

    } catch (err: any) {
      // Error fetching schema
      if (error) {
        error.textContent = `Error: ${err.message || 'Failed to fetch table schema'}`;
        error.style.display = 'block';
      }
    } finally {
      if (loading) loading.style.display = 'none';
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Schema Explorer Settings'
          },
          groups: [
            {
              groupName: 'Settings',
              groupFields: [
                PropertyPaneTextField('tableName', {
                  label: 'Default Table Name'
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