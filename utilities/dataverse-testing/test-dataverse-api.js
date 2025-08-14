#!/usr/bin/env node

/**
 * Direct Dataverse API Test Script
 * Tests all possible table name variations to discover correct entity names
 * Run with: node scripts/test-dataverse-api.js
 */

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const DATAVERSE_URL = 'https://racingdata.crm6.dynamics.com';
const API_VERSION = 'v9.1';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Table name variations to test
const tableTests = [
  // Meetings variations
  { category: 'Meetings', name: 'cr4cc_racemeetings', description: 'Meetings (plural with race prefix)' },
  { category: 'Meetings', name: 'cr4cc_racemeeting', description: 'Meeting (singular with race prefix)' },
  { category: 'Meetings', name: 'cr4cc_meetings', description: 'Meetings (plural without race)' },
  { category: 'Meetings', name: 'cr4cc_meeting', description: 'Meeting (singular without race)' },
  
  // Races variations with cr616 prefix
  { category: 'Races', name: 'cr616_races', description: 'Races with cr616 (plural)' },
  { category: 'Races', name: 'cr616_race', description: 'Race with cr616 (singular)' },
  { category: 'Races', name: 'cr616_raceses', description: 'Raceses with cr616 (double plural)' },
  
  // Races variations with cr4cc prefix
  { category: 'Races', name: 'cr4cc_races', description: 'Races with cr4cc (plural)' },
  { category: 'Races', name: 'cr4cc_race', description: 'Race with cr4cc (singular)' },
  
  // Contestants variations with cr616 prefix
  { category: 'Contestants', name: 'cr616_contestants', description: 'Contestants with cr616 (plural)' },
  { category: 'Contestants', name: 'cr616_contestant', description: 'Contestant with cr616 (singular)' },
  { category: 'Contestants', name: 'cr616_contestantses', description: 'Contestantses with cr616 (double plural)' },
  
  // Contestants variations with cr4cc prefix
  { category: 'Contestants', name: 'cr4cc_contestants', description: 'Contestants with cr4cc (plural)' },
  { category: 'Contestants', name: 'cr4cc_contestant', description: 'Contestant with cr4cc (singular)' }
];

/**
 * Get Azure AD token using Azure CLI
 */
async function getAccessToken() {
  try {
    console.log(`${colors.cyan}Getting Azure AD token...${colors.reset}`);
    
    // Try to get token using Azure CLI
    const { stdout } = await execPromise('az account get-access-token --resource https://racingdata.crm6.dynamics.com --query accessToken -o tsv');
    const token = stdout.trim();
    
    if (token) {
      console.log(`${colors.green}✓ Successfully obtained access token${colors.reset}\n`);
      return token;
    }
    throw new Error('No token received');
  } catch (error) {
    console.log(`${colors.yellow}Note: Azure CLI not available or not logged in${colors.reset}`);
    console.log(`${colors.yellow}To use this script with authentication:${colors.reset}`);
    console.log('1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli');
    console.log('2. Login: az login');
    console.log('3. Set subscription: az account set --subscription YOUR_SUBSCRIPTION\n');
    
    console.log(`${colors.cyan}Continuing with anonymous requests (may have limited access)...${colors.reset}\n`);
    return null;
  }
}

/**
 * Make HTTP request to Dataverse API
 */
function makeRequest(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Prefer': 'odata.include-annotations="*"'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve({ success: true, data: JSON.parse(data), statusCode: res.statusCode });
          } catch (e) {
            resolve({ success: true, data: data, statusCode: res.statusCode });
          }
        } else {
          resolve({ 
            success: false, 
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: data 
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

/**
 * Test a single table endpoint
 */
async function testTable(tableName, description, token, showAllFields = false) {
  const url = `${DATAVERSE_URL}/api/data/${API_VERSION}/${tableName}?$top=1`;
  
  try {
    const result = await makeRequest(url, token);
    
    if (result.success) {
      console.log(`${colors.green}✅ SUCCESS: ${description}${colors.reset}`);
      console.log(`   Table: ${colors.bold}${tableName}${colors.reset}`);
      
      if (result.data && result.data.value && result.data.value.length > 0) {
        const fields = Object.keys(result.data.value[0]);
        console.log(`   ${colors.cyan}Fields found: ${fields.length}${colors.reset}`);
        
        // Show fields based on preference
        if (showAllFields || process.argv.includes('--all-fields')) {
          console.log(`   ${colors.bold}All fields:${colors.reset}`);
          fields.forEach(field => {
            console.log(`     - ${field}`);
          });
        } else {
          // Show first 10 fields
          const displayFields = fields.slice(0, 10);
          displayFields.forEach(field => {
            console.log(`     - ${field}`);
          });
          if (fields.length > 10) {
            console.log(`     ... and ${fields.length - 10} more fields`);
            console.log(`     ${colors.yellow}(use --all-fields to see all)${colors.reset}`);
          }
        }
        
        // Check for track-related fields
        const trackFields = fields.filter(f => f.toLowerCase().includes('track'));
        if (trackFields.length > 0) {
          console.log(`   ${colors.yellow}📍 Track-related fields:${colors.reset}`);
          trackFields.forEach(field => {
            console.log(`     - ${colors.bold}${field}${colors.reset}`);
          });
        }
        
        // Check for name fields
        const nameFields = fields.filter(f => f.toLowerCase().includes('name'));
        if (nameFields.length > 0) {
          console.log(`   ${colors.yellow}📍 Name fields:${colors.reset}`);
          nameFields.forEach(field => {
            console.log(`     - ${colors.bold}${field}${colors.reset}`);
          });
        }
        
        // Return ALL fields in the result object
        return { success: true, tableName, fields, trackFields, nameFields };
      } else {
        console.log(`   ${colors.yellow}Table exists but returned no data${colors.reset}`);
        return { success: true, tableName, empty: true };
      }
    } else {
      console.log(`${colors.red}❌ FAILED: ${description}${colors.reset}`);
      console.log(`   Status: ${result.statusCode} ${result.statusMessage}`);
      
      if (result.statusCode === 404) {
        console.log(`   ${colors.yellow}Table does not exist with name: ${tableName}${colors.reset}`);
      } else if (result.statusCode === 401) {
        console.log(`   ${colors.yellow}Authentication required or insufficient permissions${colors.reset}`);
      }
      
      return { success: false, tableName, statusCode: result.statusCode };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR: ${description}${colors.reset}`);
    console.log(`   ${error.message}`);
    return { success: false, tableName, error: error.message };
  }
}

/**
 * Test metadata endpoint to discover all entities
 */
async function testMetadata(token) {
  console.log(`\n${colors.bold}${colors.blue}Testing Metadata Endpoint${colors.reset}`);
  console.log('=' .repeat(50));
  
  const url = `${DATAVERSE_URL}/api/data/${API_VERSION}/EntityDefinitions?$select=LogicalName,EntitySetName,DisplayName&$filter=contains(LogicalName,'cr4cc') or contains(LogicalName,'cr616') or contains(LogicalName,'race') or contains(LogicalName,'meeting') or contains(LogicalName,'contestant')&$top=50`;
  
  try {
    const result = await makeRequest(url, token);
    
    if (result.success && result.data && result.data.value) {
      console.log(`${colors.green}✅ Found ${result.data.value.length} racing-related entities${colors.reset}\n`);
      
      result.data.value.forEach(entity => {
        const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.DisplayName || 'No display name';
        console.log(`${colors.bold}${displayName}${colors.reset}`);
        console.log(`  Logical Name: ${colors.cyan}${entity.LogicalName}${colors.reset}`);
        console.log(`  Entity Set Name (API): ${colors.green}${entity.EntitySetName}${colors.reset}`);
        console.log('');
      });
      
      return result.data.value;
    } else if (result.statusCode === 404) {
      console.log(`${colors.yellow}EntityDefinitions endpoint not available${colors.reset}`);
      console.log('This might require different permissions or API configuration\n');
    } else {
      console.log(`${colors.red}Could not access metadata endpoint${colors.reset}`);
      console.log(`Status: ${result.statusCode}\n`);
    }
  } catch (error) {
    console.log(`${colors.red}Error accessing metadata: ${error.message}${colors.reset}\n`);
  }
  
  return null;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bold}${colors.cyan}🔍 Dataverse API Discovery Test${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================${colors.reset}\n`);
  
  console.log(`Environment: ${colors.bold}${DATAVERSE_URL}${colors.reset}`);
  console.log(`API Version: ${colors.bold}${API_VERSION}${colors.reset}`);
  
  // Check for command line options
  if (process.argv.includes('--help')) {
    console.log(`\n${colors.bold}Options:${colors.reset}`);
    console.log('  --all-fields     Show all field names (not just first 10)');
    console.log('  --export         Export results to JSON file');
    console.log('  --help           Show this help message\n');
    return;
  }
  
  const exportResults = process.argv.includes('--export');
  console.log('');
  
  // Get access token
  const token = await getAccessToken();
  
  // Test metadata endpoint first
  const metadata = await testMetadata(token);
  
  // Test each table variation
  console.log(`\n${colors.bold}${colors.blue}Testing Table Name Variations${colors.reset}`);
  console.log('=' .repeat(50) + '\n');
  
  const results = {
    meetings: [],
    races: [],
    contestants: []
  };
  
  for (const test of tableTests) {
    const result = await testTable(test.name, test.description, token);
    
    if (result.success) {
      if (test.category === 'Meetings') results.meetings.push(result);
      else if (test.category === 'Races') results.races.push(result);
      else if (test.category === 'Contestants') results.contestants.push(result);
    }
    
    console.log(''); // Empty line between tests
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`${colors.bold}${colors.cyan}📊 SUMMARY${colors.reset}`);
  console.log('=' .repeat(50) + '\n');
  
  if (results.meetings.length > 0) {
    console.log(`${colors.green}✅ Working MEETINGS tables:${colors.reset}`);
    results.meetings.forEach(r => {
      console.log(`   - ${colors.bold}${r.tableName}${colors.reset}`);
      if (r.trackFields && r.trackFields.length > 0) {
        console.log(`     Track field: ${colors.yellow}${r.trackFields.join(', ')}${colors.reset}`);
      }
    });
    console.log('');
  }
  
  if (results.races.length > 0) {
    console.log(`${colors.green}✅ Working RACES tables:${colors.reset}`);
    results.races.forEach(r => {
      console.log(`   - ${colors.bold}${r.tableName}${colors.reset}`);
    });
    console.log('');
  }
  
  if (results.contestants.length > 0) {
    console.log(`${colors.green}✅ Working CONTESTANTS tables:${colors.reset}`);
    results.contestants.forEach(r => {
      console.log(`   - ${colors.bold}${r.tableName}${colors.reset}`);
    });
    console.log('');
  }
  
  // Recommendations
  console.log(`${colors.bold}${colors.yellow}📝 RECOMMENDATIONS:${colors.reset}`);
  if (metadata && metadata.length > 0) {
    console.log('Based on metadata, use these Entity Set Names for API calls:');
    metadata.forEach(entity => {
      if (entity.EntitySetName) {
        console.log(`   - ${entity.LogicalName} → ${colors.green}${entity.EntitySetName}${colors.reset}`);
      }
    });
  } else if (results.meetings.length > 0 || results.races.length > 0 || results.contestants.length > 0) {
    console.log('Use these working table names in your API calls:');
    if (results.meetings.length > 0) {
      console.log(`   Meetings: ${colors.green}${results.meetings[0].tableName}${colors.reset}`);
    }
    if (results.races.length > 0) {
      console.log(`   Races: ${colors.green}${results.races[0].tableName}${colors.reset}`);
    }
    if (results.contestants.length > 0) {
      console.log(`   Contestants: ${colors.green}${results.contestants[0].tableName}${colors.reset}`);
    }
  } else {
    console.log('No working tables found. This might be due to:');
    console.log('   - Authentication issues (try logging in with Azure CLI)');
    console.log('   - Network/firewall restrictions');
    console.log('   - Incorrect environment URL');
    console.log('   - Tables not existing in this environment');
  }
  
  // Export results to JSON if requested
  if (exportResults) {
    const exportData = {
      environment: DATAVERSE_URL,
      apiVersion: API_VERSION,
      testDate: new Date().toISOString(),
      metadata: metadata || [],
      workingTables: {
        meetings: results.meetings.length > 0 ? results.meetings[0] : null,
        races: results.races.length > 0 ? results.races[0] : null,
        contestants: results.contestants.length > 0 ? results.contestants[0] : null
      },
      allTestResults: {
        meetings: results.meetings,
        races: results.races,
        contestants: results.contestants
      }
    };
    
    const fs = require('fs');
    const filename = `dataverse-discovery-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`\n${colors.green}📁 Results exported to: ${colors.bold}${filename}${colors.reset}`);
    console.log('This file contains all field names and can be used to update CLAUDE.md');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('Test complete!\n');
}

// Run the tests
runTests().catch(console.error);