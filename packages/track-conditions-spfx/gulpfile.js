'use strict';

const build = require('@microsoft/sp-build-web');
const fs = require('fs');
const path = require('path');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// CRITICAL: Version check before packaging - PREVENTS VERSION MISMATCH ISSUES
build.rig.addPreBuildTask({
  name: 'version-check',
  execute: (config) => {
    return new Promise((resolve, reject) => {
      console.log('\n========================================');
      console.log('  MANDATORY VERSION SYNCHRONIZATION CHECK');
      console.log('========================================\n');
      
      try {
        // Read package.json
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const packageVersion = packageJson.version;
        
        // Read package-solution.json
        const packageSolutionPath = path.join(process.cwd(), 'config', 'package-solution.json');
        const packageSolution = JSON.parse(fs.readFileSync(packageSolutionPath, 'utf8'));
        const solutionVersion = packageSolution.solution.version;
        const featureVersion = packageSolution.solution.features?.[0]?.version || 'N/A';
        const expectedSolutionVersion = `${packageVersion}.0`;
        
        console.log(`📦 Package.json version: ${packageVersion}`);
        console.log(`📋 Package-solution.json version: ${solutionVersion}`);
        console.log(`📋 Feature version: ${featureVersion}`);
        
        let hasError = false;
        
        if (solutionVersion !== expectedSolutionVersion) {
          console.error('\n❌ SOLUTION VERSION MISMATCH DETECTED!');
          console.error(`   Expected: ${expectedSolutionVersion}`);
          console.error(`   Found: ${solutionVersion}`);
          hasError = true;
        }
        
        if (featureVersion !== 'N/A' && featureVersion !== expectedSolutionVersion) {
          console.error('\n❌ FEATURE VERSION MISMATCH DETECTED!');
          console.error(`   Expected: ${expectedSolutionVersion}`);
          console.error(`   Found: ${featureVersion}`);
          hasError = true;
        }
        
        if (hasError) {
          console.error('\n═══════════════════════════════════════');
          console.error('  BUILD ABORTED - VERSION MISMATCH');
          console.error('═══════════════════════════════════════');
          console.error('\nTo fix: npm run sync-version ' + packageVersion);
          console.error('Or specify new version: npm run sync-version 2.3.0\n');
          reject(new Error('Version synchronization failed - SharePoint will show wrong version'));
        } else {
          console.log('\n✅ All versions are synchronized');
          console.log(`✅ SharePoint will display: ${solutionVersion}`);
          console.log('========================================\n');
          resolve();
        }
      } catch (error) {
        console.error('❌ Failed to check versions:', error.message);
        reject(error);
      }
    });
  }
});

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));