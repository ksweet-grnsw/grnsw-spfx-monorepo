#!/usr/bin/env node

/**
 * Version Synchronization Checker for SPFx
 * 
 * This script MUST be run before every build to ensure version synchronization.
 * SPFx requires versions to match between package.json and package-solution.json
 * or SharePoint will display incorrect version numbers.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function checkVersionSync() {
  console.log('\n========================================');
  console.log('  SPFx Version Synchronization Check');
  console.log('========================================\n');

  try {
    // Read package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageVersion = packageJson.version;
    console.log(`📦 package.json version: ${GREEN}${packageVersion}${RESET}`);

    // Read package-solution.json
    const packageSolutionPath = path.join(process.cwd(), 'config', 'package-solution.json');
    const packageSolution = JSON.parse(fs.readFileSync(packageSolutionPath, 'utf8'));
    const solutionVersion = packageSolution.solution.version;
    const featureVersion = packageSolution.solution.features?.[0]?.version || 'N/A';
    
    // SPFx version format: x.y.z.0
    const expectedSolutionVersion = `${packageVersion}.0`;
    
    console.log(`📋 package-solution.json solution version: ${solutionVersion === expectedSolutionVersion ? GREEN : RED}${solutionVersion}${RESET}`);
    console.log(`📋 package-solution.json feature version: ${featureVersion === expectedSolutionVersion ? GREEN : RED}${featureVersion}${RESET}`);
    
    // Check if versions match
    let hasErrors = false;
    
    if (solutionVersion !== expectedSolutionVersion) {
      console.error(`\n${RED}❌ ERROR: Solution version mismatch!${RESET}`);
      console.error(`   Expected: ${expectedSolutionVersion}`);
      console.error(`   Found: ${solutionVersion}`);
      hasErrors = true;
    }
    
    if (featureVersion !== 'N/A' && featureVersion !== expectedSolutionVersion) {
      console.error(`\n${RED}❌ ERROR: Feature version mismatch!${RESET}`);
      console.error(`   Expected: ${expectedSolutionVersion}`);
      console.error(`   Found: ${featureVersion}`);
      hasErrors = true;
    }
    
    // Check if version follows semantic versioning
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(packageVersion)) {
      console.error(`\n${RED}❌ ERROR: Version format invalid!${RESET}`);
      console.error(`   Version must be in format: x.y.z (e.g., 2.2.7)`);
      console.error(`   Found: ${packageVersion}`);
      hasErrors = true;
    }
    
    if (hasErrors) {
      console.error(`\n${RED}═══════════════════════════════════════${RESET}`);
      console.error(`${RED}  VERSION SYNC FAILED - DO NOT BUILD!${RESET}`);
      console.error(`${RED}═══════════════════════════════════════${RESET}\n`);
      console.error(`${YELLOW}To fix this issue:${RESET}`);
      console.error(`1. Update package.json version to your desired version (e.g., 2.2.8)`);
      console.error(`2. Update config/package-solution.json:`);
      console.error(`   - Set solution.version to "${packageVersion}.0"`);
      console.error(`   - Set features[0].version to "${packageVersion}.0"`);
      console.error(`3. Run this script again to verify\n`);
      process.exit(1);
    } else {
      console.log(`\n${GREEN}✅ SUCCESS: All versions are synchronized!${RESET}`);
      console.log(`${GREEN}═══════════════════════════════════════${RESET}`);
      console.log(`${GREEN}  Ready to build version ${packageVersion}${RESET}`);
      console.log(`${GREEN}═══════════════════════════════════════${RESET}\n`);
    }
    
  } catch (error) {
    console.error(`${RED}❌ ERROR: Failed to check versions${RESET}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Run the check
checkVersionSync();