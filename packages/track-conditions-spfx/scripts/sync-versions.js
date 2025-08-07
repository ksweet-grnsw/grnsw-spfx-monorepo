#!/usr/bin/env node

/**
 * Version Synchronization Tool for SPFx
 * 
 * This script automatically synchronizes versions between package.json and package-solution.json
 * Run with: node scripts/sync-versions.js [version]
 * Example: node scripts/sync-versions.js 2.2.8
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function syncVersions(newVersion) {
  console.log('\n========================================');
  console.log('  SPFx Version Synchronization Tool');
  console.log('========================================\n');

  try {
    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (newVersion && !versionRegex.test(newVersion)) {
      console.error(`${RED}❌ ERROR: Invalid version format!${RESET}`);
      console.error(`   Version must be in format: x.y.z (e.g., 2.2.8)`);
      console.error(`   Provided: ${newVersion}`);
      process.exit(1);
    }

    // Read package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentPackageVersion = packageJson.version;
    
    // Use provided version or current package.json version
    const targetVersion = newVersion || currentPackageVersion;
    const spfxVersion = `${targetVersion}.0`;
    
    console.log(`${CYAN}Current version in package.json: ${currentPackageVersion}${RESET}`);
    console.log(`${CYAN}Target version: ${targetVersion}${RESET}`);
    console.log(`${CYAN}SPFx format version: ${spfxVersion}${RESET}\n`);
    
    // Update package.json if needed
    if (packageJson.version !== targetVersion) {
      packageJson.version = targetVersion;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
      console.log(`${GREEN}✅ Updated package.json version to ${targetVersion}${RESET}`);
    } else {
      console.log(`${YELLOW}ℹ️  package.json already at version ${targetVersion}${RESET}`);
    }
    
    // Read and update package-solution.json
    const packageSolutionPath = path.join(process.cwd(), 'config', 'package-solution.json');
    const packageSolution = JSON.parse(fs.readFileSync(packageSolutionPath, 'utf8'));
    
    let solutionUpdated = false;
    
    // Update solution version
    if (packageSolution.solution.version !== spfxVersion) {
      packageSolution.solution.version = spfxVersion;
      solutionUpdated = true;
      console.log(`${GREEN}✅ Updated solution version to ${spfxVersion}${RESET}`);
    } else {
      console.log(`${YELLOW}ℹ️  Solution version already at ${spfxVersion}${RESET}`);
    }
    
    // Update feature version if features exist
    if (packageSolution.solution.features && packageSolution.solution.features.length > 0) {
      if (packageSolution.solution.features[0].version !== spfxVersion) {
        packageSolution.solution.features[0].version = spfxVersion;
        solutionUpdated = true;
        console.log(`${GREEN}✅ Updated feature version to ${spfxVersion}${RESET}`);
      } else {
        console.log(`${YELLOW}ℹ️  Feature version already at ${spfxVersion}${RESET}`);
      }
    }
    
    // Write package-solution.json if updated
    if (solutionUpdated) {
      fs.writeFileSync(packageSolutionPath, JSON.stringify(packageSolution, null, 2) + '\n', 'utf8');
      console.log(`${GREEN}✅ Saved package-solution.json${RESET}`);
    }
    
    console.log(`\n${GREEN}════════════════════════════════════════${RESET}`);
    console.log(`${GREEN}  VERSION SYNC COMPLETE: ${targetVersion}${RESET}`);
    console.log(`${GREEN}════════════════════════════════════════${RESET}`);
    console.log(`\nAll versions synchronized to ${GREEN}${targetVersion}${RESET}`);
    console.log(`SharePoint will display: ${GREEN}${spfxVersion}${RESET}\n`);
    console.log(`${CYAN}Next steps:${RESET}`);
    console.log(`1. Run: ${YELLOW}gulp clean${RESET}`);
    console.log(`2. Run: ${YELLOW}gulp bundle --ship${RESET}`);
    console.log(`3. Run: ${YELLOW}gulp package-solution --ship${RESET}\n`);
    
  } catch (error) {
    console.error(`${RED}❌ ERROR: Failed to sync versions${RESET}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Get version from command line argument
const args = process.argv.slice(2);
const newVersion = args[0];

if (args.includes('--help') || args.includes('-h')) {
  console.log('\nUsage: node scripts/sync-versions.js [version]');
  console.log('\nExamples:');
  console.log('  node scripts/sync-versions.js          # Sync using current package.json version');
  console.log('  node scripts/sync-versions.js 2.2.8    # Set and sync to version 2.2.8');
  console.log('\nThis tool ensures version synchronization between:');
  console.log('  - package.json (version)');
  console.log('  - config/package-solution.json (solution.version)');
  console.log('  - config/package-solution.json (features[0].version)');
  process.exit(0);
}

// Run the sync
syncVersions(newVersion);