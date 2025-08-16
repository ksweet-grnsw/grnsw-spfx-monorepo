#!/usr/bin/env node

/**
 * Discovers fields from all Dataverse environments using Azure CLI tokens
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const discovery = require('./dataverse-field-discovery');

async function getTokenForEnvironment(resourceUrl) {
  try {
    console.log(`Getting token for ${resourceUrl}...`);
    const { stdout } = await execAsync(`az account get-access-token --resource "${resourceUrl}" --query accessToken -o tsv`);
    return stdout.trim();
  } catch (error) {
    console.error(`Failed to get token for ${resourceUrl}:`, error.message);
    return null;
  }
}

async function discoverWithEnvironmentTokens() {
  console.log('\n========================================');
  console.log('  Multi-Environment Field Discovery');
  console.log('========================================\n');

  const allResults = {};
  
  // Process each environment separately with its own token
  for (const [envName, envConfig] of Object.entries(discovery.ENVIRONMENTS)) {
    console.log(`\nProcessing ${envName}...`);
    console.log('=' .repeat(50));
    
    // Skip if no tables configured
    if (!envConfig.tables || envConfig.tables.length === 0) {
      console.log('No tables configured for this environment.');
      allResults[envName] = {
        url: envConfig.url,
        apiEndpoint: envConfig.apiEndpoint,
        tables: []
      };
      continue;
    }
    
    // Get token for this specific environment
    const token = await getTokenForEnvironment(envConfig.url);
    
    if (!token) {
      console.log(`⚠️  Could not get token for ${envName}. Skipping...`);
      allResults[envName] = {
        url: envConfig.url,
        apiEndpoint: envConfig.apiEndpoint,
        tables: envConfig.tables.map(t => ({
          ...t,
          error: 'Could not obtain access token',
          fields: []
        }))
      };
      continue;
    }
    
    console.log('✓ Token obtained');
    
    // Discover fields for each table in this environment
    const envResults = {
      url: envConfig.url,
      apiEndpoint: envConfig.apiEndpoint,
      tables: []
    };
    
    for (const table of envConfig.tables) {
      console.log(`  Discovering: ${table.displayName}`);
      const fieldData = await discovery.discoverTableFields(envConfig.apiEndpoint, table, token);
      
      envResults.tables.push({
        ...table,
        ...fieldData
      });
      
      if (fieldData.actualPluralForm) {
        console.log(`    ✓ Found ${fieldData.fieldCount || 0} fields (API: ${fieldData.actualPluralForm})`);
      } else if (fieldData.error) {
        console.log(`    ✗ Failed: ${fieldData.error}`);
        if (fieldData.triedPlurals) {
          console.log(`      Tried: ${fieldData.triedPlurals.join(', ')}`);
        }
      }
    }
    
    allResults[envName] = envResults;
  }
  
  // Generate documentation
  console.log('\nGenerating documentation...');
  const markdown = discovery.generateMarkdownDocumentation(allResults);
  
  // Save files
  const fs = require('fs').promises;
  const path = require('path');
  const outputDir = path.join(__dirname, '..', 'docs', 'dataverse');
  
  await fs.mkdir(outputDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mdFile = path.join(outputDir, `dataverse-fields-${timestamp}.md`);
  const latestMdFile = path.join(outputDir, 'dataverse-fields-latest.md');
  const jsonFile = path.join(outputDir, `dataverse-fields-${timestamp}.json`);
  const latestJsonFile = path.join(outputDir, 'dataverse-fields-latest.json');
  
  await fs.writeFile(mdFile, markdown);
  await fs.writeFile(latestMdFile, markdown);
  await fs.writeFile(jsonFile, JSON.stringify(allResults, null, 2));
  await fs.writeFile(latestJsonFile, JSON.stringify(allResults, null, 2));
  
  console.log(`\n✓ Documentation saved to ${outputDir}`);
  console.log('  - dataverse-fields-latest.md');
  console.log('  - dataverse-fields-latest.json');
  
  return allResults;
}

// Run if called directly
if (require.main === module) {
  discoverWithEnvironmentTokens()
    .then(() => {
      console.log('\n✅ Discovery complete!');
    })
    .catch(error => {
      console.error('\n❌ Discovery failed:', error);
      process.exit(1);
    });
}

module.exports = { discoverWithEnvironmentTokens };