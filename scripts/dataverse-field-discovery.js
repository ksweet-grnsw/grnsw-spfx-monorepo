/**
 * Dataverse Field Discovery Script
 * Fetches comprehensive field metadata from all Dataverse environments
 * Generates detailed documentation of tables, fields, and their properties
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Configuration for all Dataverse environments
// NOTE: Dataverse pluralization is weird! It adds 'es' to words ending in 's', 'y', etc.
// Examples: 
//   - racemeeting → racemeetings (normal)
//   - racemeetings → racemeetingses (double plural if table already plural!)
//   - races → raceses (adds 'es' to words ending in 's')
//   - injury → injuries (normal y→ies)
//   - heathcheck → heathchecks (normal)
const ENVIRONMENTS = {
  'Racing Data': {
    url: 'https://racingdata.crm6.dynamics.com',
    apiEndpoint: 'https://racingdata.crm6.dynamics.com/api/data/v9.1',
    tables: [
      { 
        displayName: 'Meeting', 
        singularName: 'cr4cc_racemeeting',
        logicalName: 'cr4cc_racemeetings',
        possiblePlurals: ['cr4cc_racemeetings', 'cr4cc_racemeetingses'] // Try both!
      },
      { 
        displayName: 'Races', 
        singularName: 'cr616_races',
        logicalName: 'cr616_races',  // Might already be plural!
        possiblePlurals: ['cr616_races', 'cr616_raceses']  // Try BOTH - original first, then double plural
      },
      { 
        displayName: 'Contestants', 
        singularName: 'cr616_contestants',
        logicalName: 'cr616_contestants',  // Might already be plural!
        possiblePlurals: ['cr616_contestants', 'cr616_contestantses']  // Try BOTH - original first, then double plural
      }
    ]
  },
  'Weather Data Production': {
    url: 'https://org98489e5d.crm6.dynamics.com',
    apiEndpoint: 'https://org98489e5d.crm6.dynamics.com/api/data/v9.1',
    tables: [
      { 
        displayName: 'Weather Data', 
        singularName: 'cr4cc_weatherdata',
        logicalName: 'cr4cc_weatherdatas',
        possiblePlurals: ['cr4cc_weatherdatas', 'cr4cc_weatherdatases']
      }
    ]
  },
  'Injury Data': {
    url: 'https://orgfc8a11f1.crm6.dynamics.com',
    apiEndpoint: 'https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1',
    tables: [
      { 
        displayName: 'Injury Data', 
        singularName: 'cra5e_injurydata',
        logicalName: 'cra5e_injurydatas',
        possiblePlurals: ['cra5e_injurydatas', 'cra5e_injurydatases']
      },
      { 
        displayName: 'Injuries', 
        singularName: 'cr4cc_injury',
        logicalName: 'cr4cc_injuries',
        possiblePlurals: ['cr4cc_injuries', 'cr4cc_injurieses']  // Try both patterns
      },
      { 
        displayName: 'Greyhound', 
        singularName: 'cra5e_greyhound',
        logicalName: 'cra5e_greyhounds',
        possiblePlurals: ['cra5e_greyhounds', 'cra5e_greyhoundses']
      },
      { 
        displayName: 'Health Check', 
        singularName: 'cra5e_heathcheck',  // Note: misspelled in system
        logicalName: 'cra5e_heathchecks',
        possiblePlurals: ['cra5e_heathchecks', 'cra5e_heathcheckses']
      }
    ]
  },
  'GAP (Greyhound Adoption Program)': {
    url: 'https://org16bdb053.crm6.dynamics.com',
    apiEndpoint: 'https://org16bdb053.crm6.dynamics.com/api/data/v9.1',
    tables: []  // To be configured
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Makes an HTTP request to Dataverse API
 * @param {string} url - The API URL
 * @param {string} accessToken - The Azure AD access token
 * @returns {Promise<any>} The API response
 */
async function makeApiRequest(url, accessToken) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Prefer': 'odata.include-annotations="*"'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetches entity metadata for a specific table
 * @param {string} apiEndpoint - The API endpoint
 * @param {string} entityName - The entity logical name
 * @param {string} accessToken - The Azure AD access token
 * @returns {Promise<any>} The entity metadata
 */
async function fetchEntityMetadata(apiEndpoint, entityName, accessToken) {
  const metadataUrl = `${apiEndpoint}/EntityDefinitions(LogicalName='${entityName.replace(/s$/, '')}')?$expand=Attributes`;
  try {
    return await makeApiRequest(metadataUrl, accessToken);
  } catch (error) {
    console.error(`${colors.red}Error fetching metadata for ${entityName}:${colors.reset}`, error.message);
    // Try alternative approach with plural name
    const alternativeUrl = `${apiEndpoint}/${entityName}?$top=1`;
    try {
      const sample = await makeApiRequest(alternativeUrl, accessToken);
      return { attributes: Object.keys(sample.value[0] || {}) };
    } catch (altError) {
      console.error(`${colors.red}Alternative approach also failed:${colors.reset}`, altError.message);
      return null;
    }
  }
}

/**
 * Discovers all fields for a table by fetching a sample record
 * Tries multiple possible plural forms due to Dataverse's weird pluralization
 * @param {string} apiEndpoint - The API endpoint
 * @param {Object} tableConfig - The table configuration with possible plurals
 * @param {string} accessToken - The Azure AD access token
 * @returns {Promise<Object>} Field information
 */
async function discoverTableFields(apiEndpoint, tableConfig, accessToken) {
  // If possiblePlurals is defined, try each one until we find one that works
  const pluralsToTry = tableConfig.possiblePlurals || [tableConfig.logicalName];
  
  for (const tableName of pluralsToTry) {
    const url = `${apiEndpoint}/${tableName}?$top=1`;
    try {
      const response = await makeApiRequest(url, accessToken);
      const sampleRecord = response.value[0] || {};
      
      const fields = Object.keys(sampleRecord).map(fieldName => {
        const value = sampleRecord[fieldName];
        return {
          name: fieldName,
          type: typeof value,
          sampleValue: value !== null && value !== undefined ? 
            (typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 50)) : 
            null,
          isNull: value === null
        };
      });

      // Success! Return with the working plural form
      return {
        tableName: tableConfig.logicalName,
        actualPluralForm: tableName,  // The form that actually worked
        fieldCount: fields.length,
        fields: fields.sort((a, b) => a.name.localeCompare(b.name))
      };
    } catch (error) {
      // Try next plural form
      if (tableName === pluralsToTry[pluralsToTry.length - 1]) {
        // This was the last one, return error
        console.error(`${colors.red}Error discovering fields for ${tableConfig.displayName}:${colors.reset}`, error.message);
        console.error(`  Tried plural forms: ${pluralsToTry.join(', ')}`);
        return {
          tableName: tableConfig.logicalName,
          triedPlurals: pluralsToTry,
          error: error.message,
          fields: []
        };
      }
      // Otherwise, continue to next plural form
    }
  }
  
  return {
    tableName: tableConfig.logicalName,
    error: 'No plural forms configured',
    fields: []
  };
}

/**
 * Generates markdown documentation for the discovered fields
 * @param {Object} environmentData - The discovered environment data
 * @returns {string} Markdown formatted documentation
 */
function generateMarkdownDocumentation(environmentData) {
  let markdown = '# Dataverse Environment Documentation\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += '## Table of Contents\n\n';
  
  Object.keys(environmentData).forEach(envName => {
    markdown += `- [${envName}](#${envName.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  
  markdown += '\n---\n\n';

  Object.entries(environmentData).forEach(([envName, envData]) => {
    markdown += `## ${envName}\n\n`;
    markdown += `**URL:** ${envData.url}\n\n`;
    markdown += `**API Endpoint:** ${envData.apiEndpoint}\n\n`;
    
    if (envData.tables && envData.tables.length > 0) {
      markdown += '### Tables\n\n';
      
      envData.tables.forEach(table => {
        markdown += `#### ${table.displayName} (${table.logicalName})\n\n`;
        
        if (table.error) {
          markdown += `> ⚠️ Error: ${table.error}\n\n`;
        } else if (table.fields && table.fields.length > 0) {
          markdown += `**Total Fields:** ${table.fieldCount}\n\n`;
          markdown += '| Field Name | Type | Sample Value | Nullable |\n';
          markdown += '|------------|------|--------------|----------|\n';
          
          table.fields.forEach(field => {
            const fieldName = field.name.replace(/\|/g, '\\|');
            const sampleValue = field.sampleValue ? field.sampleValue.replace(/\|/g, '\\|') : 'null';
            markdown += `| ${fieldName} | ${field.type} | ${sampleValue} | ${field.isNull ? 'Yes' : 'No'} |\n`;
          });
          markdown += '\n';
        } else {
          markdown += '> No fields discovered or table not accessible.\n\n';
        }
      });
    } else {
      markdown += '> No tables configured for this environment.\n\n';
    }
    
    markdown += '---\n\n';
  });

  return markdown;
}

/**
 * Main function to discover all fields from all environments
 * @param {string} accessToken - The Azure AD access token (optional for manual run)
 */
async function discoverAllFields(accessToken) {
  console.log(`${colors.bright}${colors.blue}Starting Dataverse Field Discovery...${colors.reset}\n`);
  
  const results = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  for (const [envName, envConfig] of Object.entries(ENVIRONMENTS)) {
    console.log(`${colors.cyan}Processing ${envName}...${colors.reset}`);
    results[envName] = {
      url: envConfig.url,
      apiEndpoint: envConfig.apiEndpoint,
      tables: []
    };
    
    if (envConfig.tables.length === 0) {
      console.log(`  ${colors.yellow}No tables configured${colors.reset}`);
      continue;
    }
    
    for (const table of envConfig.tables) {
      console.log(`  Discovering fields for ${colors.green}${table.displayName}${colors.reset} (${table.logicalName})`);
      
      if (accessToken) {
        const fieldData = await discoverTableFields(envConfig.apiEndpoint, table, accessToken);
        results[envName].tables.push({
          ...table,
          ...fieldData
        });
        if (fieldData.actualPluralForm && fieldData.actualPluralForm !== table.logicalName) {
          console.log(`    Found ${colors.bright}${fieldData.fieldCount || 0}${colors.reset} fields (actual plural: ${fieldData.actualPluralForm})`);
        } else if (fieldData.fieldCount) {
          console.log(`    Found ${colors.bright}${fieldData.fieldCount}${colors.reset} fields`);
        } else if (fieldData.triedPlurals) {
          console.log(`    ${colors.red}Failed${colors.reset} - tried: ${fieldData.triedPlurals.join(', ')}`);
        }
      } else {
        // Generate placeholder for documentation purposes when no token is available
        results[envName].tables.push({
          ...table,
          fieldCount: 0,
          fields: [],
          note: 'Run with access token to discover actual fields'
        });
        console.log(`    ${colors.yellow}Skipped (no access token provided)${colors.reset}`);
      }
    }
  }
  
  // Generate documentation
  const markdown = generateMarkdownDocumentation(results);
  const outputDir = path.join(__dirname, '..', 'docs', 'dataverse');
  const outputFile = path.join(outputDir, `dataverse-fields-${timestamp}.md`);
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputFile, markdown);
    console.log(`\n${colors.green}✓ Documentation generated:${colors.reset} ${outputFile}`);
    
    // Also save as latest
    const latestFile = path.join(outputDir, 'dataverse-fields-latest.md');
    await fs.writeFile(latestFile, markdown);
    console.log(`${colors.green}✓ Latest documentation updated:${colors.reset} ${latestFile}`);
    
    // Save JSON format for programmatic use
    const jsonFile = path.join(outputDir, `dataverse-fields-${timestamp}.json`);
    await fs.writeFile(jsonFile, JSON.stringify(results, null, 2));
    console.log(`${colors.green}✓ JSON data saved:${colors.reset} ${jsonFile}`);
    
    const latestJsonFile = path.join(outputDir, 'dataverse-fields-latest.json');
    await fs.writeFile(latestJsonFile, JSON.stringify(results, null, 2));
    console.log(`${colors.green}✓ Latest JSON updated:${colors.reset} ${latestJsonFile}`);
    
  } catch (error) {
    console.error(`${colors.red}Error saving documentation:${colors.reset}`, error);
  }
  
  return results;
}

/**
 * Interactive mode - prompts for access token
 */
async function runInteractive() {
  console.log(`${colors.bright}Dataverse Field Discovery Tool${colors.reset}`);
  console.log('=====================================\n');
  
  console.log('This tool discovers all fields from configured Dataverse environments.');
  console.log('To fetch actual field data, you need an Azure AD access token.\n');
  
  console.log(`${colors.yellow}Note:${colors.reset} If you don't have an access token, the tool will generate`);
  console.log('documentation templates with table configurations only.\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Enter your Azure AD access token (or press Enter to skip): ', async (token) => {
    readline.close();
    
    if (token && token.trim()) {
      console.log('\n');
      await discoverAllFields(token.trim());
    } else {
      console.log('\nRunning in template mode (no field discovery)...\n');
      await discoverAllFields(null);
    }
    
    console.log(`\n${colors.bright}${colors.green}Discovery complete!${colors.reset}`);
  });
}

// Export for use in other scripts
module.exports = {
  ENVIRONMENTS,
  discoverAllFields,
  discoverTableFields,
  fetchEntityMetadata,
  generateMarkdownDocumentation
};

// Run if called directly
if (require.main === module) {
  runInteractive().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}