# GRNSW SPFx Monorepo

This monorepo contains all SharePoint Framework solutions for GRNSW:
- Track Conditions & Weather Monitoring
- Race Management
- Greyhound Health
- GAP (Greyhound Adoption Program)

## Prerequisites

- Node.js v22.14.0 or higher (but < 23.0.0)
- npm 8.x or higher
- SharePoint Framework development environment

## Initial Setup

1. Clone the repository
2. Run the setup script:
```bash
npm run setup
```

This will:
- Install all dependencies
- Fix common SPFx build issues
- Build the shared library

## Building Packages

### Build all packages:
```bash
npm run build
```

### Build specific packages:
```bash
npm run build:track    # Track Conditions
npm run build:race     # Race Management
npm run build:health   # Greyhound Health
npm run build:gap      # GAP
```

## Common Issues & Solutions

### 1. SASS Import Errors
If you see errors about `@fluentui/react/dist/sass/References.scss`:
```bash
npm run fix-builds
```

### 2. Rush-Stack-Compiler Errors
The monorepo includes both versions (4.7 and 5.3) to support different SPFx versions.

### 3. TypeScript Errors with Shared Library
Always build the shared library first:
```bash
npm run build:shared
```

## Package Structure

```
grnsw-spfx-monorepo/
├── packages/
│   ├── shared/              # Shared utilities and services
│   ├── track-conditions-spfx/   # Weather & track monitoring
│   ├── race-management-spfx/    # Race meetings & scheduling
│   ├── greyhound-health-spfx/   # Health tracking
│   └── gap-spfx/            # Adoption program
├── releases/                # Built packages for deployment
├── shared-styles/           # Shared SASS variables
└── scripts/                 # Build and maintenance scripts
```

## Development

### Serve packages locally:
```bash
npm run serve:track
npm run serve:race
npm run serve:health
npm run serve:gap
```

### Create a new release:
1. Update version in package.json
2. Build the package
3. Package the solution:
   ```bash
   cd packages/[package-name]
   npm run package-solution
   ```
4. Copy to releases folder

## Deployment

1. Upload the `.sppkg` file from `releases/[package-name]/` to your SharePoint App Catalog
2. Deploy the app
3. Add web parts to your SharePoint pages

## Troubleshooting

### Build fails with "Cannot find module"
- Run `npm install` in the root directory
- Run `npm run fix-builds`
- Try building again

### SASS compilation errors
- Check that all `.scss` files import from `shared-styles/variables.scss`
- Run `npm run fix-builds` to automatically fix imports

### TypeScript version conflicts
- The monorepo uses TypeScript 5.3.3
- Individual packages may have different requirements
- Check `tsconfig.json` in each package

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly with `npm run build`
4. Create a pull request

## Version History

See individual package CHANGELOG.md files for version history.