#!/usr/bin/env node

/**
 * Fix common SPFx build issues in the monorepo
 * Run this after initial setup or when encountering build errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing SPFx build issues in monorepo...\n');

// 1. Fix SASS imports in all packages
function fixSassImports() {
  console.log('📦 Fixing SASS imports...');
  
  const packages = ['gap-spfx', 'greyhound-health', 'race-management', 'track-conditions-spfx'];
  
  packages.forEach(pkg => {
    const scssDir = path.join(__dirname, '..', 'packages', pkg, 'src');
    
    if (fs.existsSync(scssDir)) {
      // Find all .scss files
      const findScssFiles = (dir) => {
        const files = [];
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            files.push(...findScssFiles(fullPath));
          } else if (item.endsWith('.scss')) {
            files.push(fullPath);
          }
        });
        
        return files;
      };
      
      const scssFiles = findScssFiles(scssDir);
      
      scssFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        
        // Replace Fluent UI import with local variables
        if (content.includes("@import '~@fluentui/react/dist/sass/References.scss';")) {
          // Calculate relative path to shared-styles
          const relativePath = path.relative(path.dirname(file), path.join(__dirname, '..', 'shared-styles')).replace(/\\/g, '/');
          content = content.replace(
            "@import '~@fluentui/react/dist/sass/References.scss';",
            `@import '${relativePath}/variables.scss';`
          );
          
          fs.writeFileSync(file, content);
          console.log(`  ✅ Fixed: ${file}`);
        }
      });
    }
  });
}

// 2. Update tsconfig.json files
function fixTsConfigs() {
  console.log('\n📄 Fixing tsconfig.json files...');
  
  const packages = ['gap-spfx', 'greyhound-health', 'race-management', 'track-conditions-spfx'];
  
  const tsConfigContent = {
    "compilerOptions": {
      "target": "es5",
      "forceConsistentCasingInFileNames": true,
      "module": "esnext",
      "moduleResolution": "node",
      "jsx": "react",
      "declaration": true,
      "sourceMap": true,
      "experimentalDecorators": true,
      "skipLibCheck": true,
      "outDir": "lib",
      "inlineSources": false,
      "noImplicitAny": false,
      "typeRoots": [
        "./node_modules/@types",
        "./node_modules/@microsoft",
        "../../node_modules/@types",
        "../../node_modules/@microsoft"
      ],
      "types": [
        "webpack-env"
      ],
      "lib": [
        "es5",
        "dom",
        "es2015.collection",
        "es2015.promise"
      ]
    },
    "include": [
      "src/**/*.ts",
      "src/**/*.tsx"
    ],
    "exclude": [
      "node_modules",
      "lib"
    ]
  };
  
  packages.forEach(pkg => {
    const tsconfigPath = path.join(__dirname, '..', 'packages', pkg, 'tsconfig.json');
    
    if (fs.existsSync(tsconfigPath)) {
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsConfigContent, null, 2));
      console.log(`  ✅ Fixed: ${pkg}/tsconfig.json`);
    }
  });
}

// 3. Ensure shared package is built
function buildSharedPackage() {
  console.log('\n🏗️  Building shared package...');
  
  const sharedPath = path.join(__dirname, '..', 'packages', 'shared');
  
  if (fs.existsSync(sharedPath)) {
    try {
      execSync('npm run build', { cwd: sharedPath, stdio: 'inherit' });
      console.log('  ✅ Shared package built successfully');
    } catch (error) {
      console.error('  ❌ Failed to build shared package:', error.message);
    }
  }
}

// 4. Create .gitignore for generated files
function updateGitignore() {
  console.log('\n📝 Updating .gitignore...');
  
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  let gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  
  const additions = [
    '# SPFx build artifacts',
    '**/lib/',
    '**/temp/',
    '**/dist/',
    '**/sharepoint/solution/**/*.sppkg',
    '**/*.scss.ts',
    '**/*.scss.d.ts',
    '',
    '# TypeScript build info',
    '*.tsbuildinfo',
    '',
    '# Rush files',
    'common/temp/',
    '**/.rush/',
    ''
  ];
  
  additions.forEach(line => {
    if (!gitignoreContent.includes(line) && line !== '') {
      gitignoreContent += '\n' + line;
    }
  });
  
  fs.writeFileSync(gitignorePath, gitignoreContent.trim() + '\n');
  console.log('  ✅ Updated .gitignore');
}

// Run all fixes
console.log('Starting fixes...\n');

fixSassImports();
fixTsConfigs();
buildSharedPackage();
updateGitignore();

console.log('\n✨ All fixes applied! Try building your packages again.');
console.log('\nTip: Run "npm run build" in each package directory to test the fixes.');