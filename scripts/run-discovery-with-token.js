#!/usr/bin/env node

/**
 * Direct runner for field discovery with token
 */

const discovery = require('./dataverse-field-discovery');

// Get token from command line argument or environment variable
const token = process.argv[2] || process.env.DATAVERSE_TOKEN;

if (!token) {
  console.error('Please provide a token as argument or set DATAVERSE_TOKEN environment variable');
  process.exit(1);
}

console.log('\nStarting discovery with provided token...\n');

discovery.discoverAllFields(token).then(() => {
  console.log('\nDiscovery complete!');
}).catch(error => {
  console.error('Discovery failed:', error);
  process.exit(1);
});