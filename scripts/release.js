#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES = ['track-conditions-spfx', 'race-management-spfx', 'greyhound-health-spfx', 'gap-spfx'];

function getPackageVersion(packageName) {
  const packageJsonPath = path.join(__dirname, '..', 'packages', packageName, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function updateSolutionVersion(packageName, version) {
  const solutionConfigPath = path.join(__dirname, '..', 'packages', packageName, 'config', 'package-solution.json');
  const solutionConfig = JSON.parse(fs.readFileSync(solutionConfigPath, 'utf8'));
  
  // Convert semver to SharePoint version format (add .0 at the end)
  const spVersion = version + '.0';
  solutionConfig.solution.version = spVersion;
  
  fs.writeFileSync(solutionConfigPath, JSON.stringify(solutionConfig, null, 2));
  console.log(`Updated ${packageName} solution version to ${spVersion}`);
}

function buildAndPackage(packageName) {
  const packageDir = path.join(__dirname, '..', 'packages', packageName);
  
  console.log(`Building ${packageName}...`);
  execSync('npm run build', { cwd: packageDir, stdio: 'inherit' });
  
  console.log(`Packaging ${packageName}...`);
  execSync('npm run package-solution -- --ship', { cwd: packageDir, stdio: 'inherit' });
}

function copyToReleases(packageName) {
  const version = getPackageVersion(packageName);
  const sourceFile = path.join(__dirname, '..', 'packages', packageName, 'sharepoint', 'solution', `${packageName}.sppkg`);
  
  // Determine the release folder name
  const releaseFolderMap = {
    'track-conditions-spfx': 'track-conditions',
    'race-management-spfx': 'race-management',
    'greyhound-health-spfx': 'greyhound-health',
    'gap-spfx': 'gap'
  };
  
  const releaseFolder = releaseFolderMap[packageName];
  const targetDir = path.join(__dirname, '..', 'releases', releaseFolder);
  const targetFile = path.join(targetDir, `${packageName}-${version}.sppkg`);
  
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy file
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Copied release to ${targetFile}`);
  
  return { packageName, version, releaseFolder };
}

function createGitTag(packageName, version) {
  const tagName = `${packageName}-v${version}`;
  
  try {
    execSync(`git tag ${tagName}`, { stdio: 'inherit' });
    console.log(`Created git tag: ${tagName}`);
  } catch (error) {
    console.log(`Tag ${tagName} may already exist`);
  }
}

// Main release function
async function release(packageName) {
  if (!PACKAGES.includes(packageName)) {
    console.error(`Invalid package name. Choose from: ${PACKAGES.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Starting release process for ${packageName}`);
  
  try {
    // Get current version
    const version = getPackageVersion(packageName);
    console.log(`Current version: ${version}`);
    
    // Update solution version
    updateSolutionVersion(packageName, version);
    
    // Build and package
    buildAndPackage(packageName);
    
    // Copy to releases
    const releaseInfo = copyToReleases(packageName);
    
    // Create git tag
    createGitTag(packageName, version);
    
    console.log(`\nRelease complete! 🎉`);
    console.log(`Package: ${packageName}`);
    console.log(`Version: ${version}`);
    console.log(`Release file: releases/${releaseInfo.releaseFolder}/${packageName}-${version}.sppkg`);
    console.log(`\nNext steps:`);
    console.log(`1. Commit the changes: git add -A && git commit -m "Release ${packageName} v${version}"`);
    console.log(`2. Push tags: git push --tags`);
    console.log(`3. Create GitHub release with the .sppkg file`);
    
  } catch (error) {
    console.error('Release failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const packageName = process.argv[2];

if (!packageName) {
  console.log('Usage: node scripts/release.js <package-name>');
  console.log(`Available packages: ${PACKAGES.join(', ')}`);
  process.exit(1);
}

release(packageName);