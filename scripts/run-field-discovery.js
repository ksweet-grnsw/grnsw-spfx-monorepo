#!/usr/bin/env node

/**
 * Simple runner script for Dataverse field discovery
 * This script helps obtain tokens and run the discovery process
 */

const { exec } = require('child_process');
const readline = require('readline');
const discovery = require('./dataverse-field-discovery');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=====================================');
console.log('  Dataverse Field Discovery Runner');
console.log('=====================================\n');

console.log('This script will help you discover all fields in your Dataverse environments.\n');
console.log('Choose authentication method:');
console.log('1. Manual token (paste an existing token)');
console.log('2. Use Azure CLI (requires az cli installed)');
console.log('3. Generate template only (no authentication)\n');

rl.question('Select option (1-3): ', async (option) => {
  switch(option) {
    case '1':
      rl.question('\nPaste your Azure AD access token: ', async (token) => {
        rl.close();
        console.log('\nStarting discovery with provided token...\n');
        await discovery.discoverAllFields(token.trim());
        console.log('\nDiscovery complete!');
      });
      break;
      
    case '2':
      console.log('\nAttempting to get token using Azure CLI...');
      console.log('Note: You may need to login first with: az login\n');
      
      // Get tokens for each environment
      const tokens = {};
      const environments = Object.keys(discovery.ENVIRONMENTS);
      
      for (const env of environments) {
        const config = discovery.ENVIRONMENTS[env];
        console.log(`Getting token for ${env}...`);
        
        exec(`az account get-access-token --resource ${config.url} --query accessToken -o tsv`, 
          async (error, stdout, stderr) => {
            if (error) {
              console.error(`Error getting token for ${env}: ${error.message}`);
              tokens[env] = null;
            } else {
              tokens[env] = stdout.trim();
              console.log(`✓ Token obtained for ${env}`);
            }
            
            // If this was the last environment, run discovery
            if (Object.keys(tokens).length === environments.length) {
              rl.close();
              // For now, use the first valid token (they should all work for discovery)
              const validToken = Object.values(tokens).find(t => t);
              if (validToken) {
                console.log('\nStarting discovery...\n');
                await discovery.discoverAllFields(validToken);
                console.log('\nDiscovery complete!');
              } else {
                console.error('\nNo valid tokens obtained. Please check Azure CLI configuration.');
              }
            }
          }
        );
      }
      break;
      
    case '3':
      rl.close();
      console.log('\nGenerating template documentation without field discovery...\n');
      await discovery.discoverAllFields(null);
      console.log('\nTemplate generation complete!');
      break;
      
    default:
      console.log('Invalid option. Exiting.');
      rl.close();
  }
});