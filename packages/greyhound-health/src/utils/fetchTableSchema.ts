import { WebPartContext } from '@microsoft/sp-webpart-base';

export class DataverseSchemaFetcher {
  private context: WebPartContext;
  private environment = "https://org98489e5d.crm6.dynamics.com";
  private apiVersion = "v9.2";

  constructor(context: WebPartContext) {
    this.context = context;
  }

  /**
   * Fetches the table schema/metadata from Dataverse
   * @param tableName The logical name of the table (e.g., 'cra5e_injurydata')
   */
  public async getTableSchema(tableName: string): Promise<any> {
    try {
      // Get access token using MSAL
      const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
      const accessToken = await tokenProvider.getToken(this.environment);

      // Fetch entity metadata
      const metadataUrl = `${this.environment}/api/data/${this.apiVersion}/EntityDefinitions(LogicalName='${tableName}')?$expand=Attributes`;
      
      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch table schema: ${response.statusText}`);
      }

      const metadata = await response.json();
      return this.parseTableMetadata(metadata);
    } catch (error) {
      console.error('Error fetching table schema:', error);
      throw error;
    }
  }

  /**
   * Fetches sample data from the table to understand the actual data structure
   */
  public async getSampleData(tableName: string, top: number = 5): Promise<any[]> {
    try {
      const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
      const accessToken = await tokenProvider.getToken(this.environment);

      // For custom tables, we need to use the plural form
      const pluralTableName = tableName.endsWith('a') ? tableName + 's' : tableName + 's';
      const dataUrl = `${this.environment}/api/data/${this.apiVersion}/${pluralTableName}?$top=${top}`;
      
      const response = await fetch(dataUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If plural form doesn't work, try the exact name
        const exactUrl = `${this.environment}/api/data/${this.apiVersion}/${tableName}?$top=${top}`;
        const exactResponse = await fetch(exactUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json'
          }
        });

        if (!exactResponse.ok) {
          throw new Error(`Failed to fetch sample data: ${response.statusText}`);
        }

        const exactData = await exactResponse.json();
        return exactData.value || [];
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching sample data:', error);
      throw error;
    }
  }

  /**
   * Parses the metadata and extracts field information
   */
  private parseTableMetadata(metadata: any): any {
    const fields: any[] = [];
    const attributes = metadata.Attributes || [];

    attributes.forEach((attr: any) => {
      // Skip system fields
      if (attr.LogicalName.startsWith('_') || 
          attr.LogicalName.includes('versionnumber') ||
          attr.LogicalName.includes('overriddencreatedon')) {
        return;
      }

      fields.push({
        logicalName: attr.LogicalName,
        displayName: attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName,
        type: attr.AttributeType,
        isPrimaryId: attr.IsPrimaryId || false,
        isPrimaryName: attr.IsPrimaryName || false,
        isRequired: attr.RequiredLevel?.Value === 'ApplicationRequired' || attr.RequiredLevel?.Value === 'SystemRequired',
        maxLength: attr.MaxLength,
        minValue: attr.MinValue,
        maxValue: attr.MaxValue,
        optionSet: this.extractOptionSet(attr)
      });
    });

    return {
      logicalName: metadata.LogicalName,
      displayName: metadata.DisplayName?.UserLocalizedLabel?.Label || metadata.LogicalName,
      primaryIdAttribute: metadata.PrimaryIdAttribute,
      primaryNameAttribute: metadata.PrimaryNameAttribute,
      entitySetName: metadata.EntitySetName,
      fields: fields.sort((a, b) => a.logicalName.localeCompare(b.logicalName))
    };
  }

  /**
   * Extracts option set values if the field is a picklist
   */
  private extractOptionSet(attribute: any): any[] | null {
    if (attribute.AttributeType !== 'Picklist' && attribute.AttributeType !== 'State' && attribute.AttributeType !== 'Status') {
      return null;
    }

    const options: any[] = [];
    const optionSet = attribute.OptionSet || attribute.GlobalOptionSet;
    
    if (optionSet && optionSet.Options) {
      optionSet.Options.forEach((option: any) => {
        options.push({
          value: option.Value,
          label: option.Label?.UserLocalizedLabel?.Label || `Option ${option.Value}`
        });
      });
    }

    return options.length > 0 ? options : null;
  }

  /**
   * Generates TypeScript interface from the table schema
   */
  public generateTypeScriptInterface(schema: any): string {
    let interfaceName = this.toPascalCase(schema.logicalName);
    let tsInterface = `export interface I${interfaceName} {\n`;

    schema.fields.forEach((field: any) => {
      const fieldName = field.logicalName;
      const isOptional = !field.isRequired ? '?' : '';
      const fieldType = this.mapDataverseTypeToTypeScript(field.type);
      
      tsInterface += `  ${fieldName}${isOptional}: ${fieldType};\n`;
      
      // Add comment with display name if different from logical name
      if (field.displayName && field.displayName !== field.logicalName) {
        tsInterface = tsInterface.slice(0, -1) + ` // ${field.displayName}\n`;
      }
    });

    tsInterface += '}\n';

    // Add enum for option sets
    schema.fields.forEach((field: any) => {
      if (field.optionSet && field.optionSet.length > 0) {
        tsInterface += `\nexport enum ${this.toPascalCase(field.logicalName)}Options {\n`;
        field.optionSet.forEach((option: any) => {
          const enumKey = this.toEnumKey(option.label);
          tsInterface += `  ${enumKey} = ${option.value}, // ${option.label}\n`;
        });
        tsInterface += '}\n';
      }
    });

    return tsInterface;
  }

  private mapDataverseTypeToTypeScript(dataverseType: string): string {
    const typeMap: { [key: string]: string } = {
      'String': 'string',
      'Integer': 'number',
      'BigInt': 'number',
      'Decimal': 'number',
      'Double': 'number',
      'Money': 'number',
      'Boolean': 'boolean',
      'DateTime': 'string', // ISO date string
      'Uniqueidentifier': 'string',
      'Lookup': 'string', // Will be the GUID
      'Picklist': 'number', // Option set value
      'State': 'number',
      'Status': 'number',
      'Memo': 'string',
      'Virtual': 'any',
      'EntityName': 'string'
    };

    return typeMap[dataverseType] || 'any';
  }

  private toPascalCase(str: string): string {
    return str.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private toEnumKey(label: string): string {
    // Convert label to valid enum key (e.g., "Career Ending" -> "CareerEnding")
    return label.replace(/[^a-zA-Z0-9]/g, '');
  }
}