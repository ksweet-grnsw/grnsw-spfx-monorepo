# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
```bash
node --version  # Should be >= 22.14.0 and < 23.0.0
npm --version   # Should be >= 8.0.0
```

### 1. Clone and Install
```bash
git clone https://github.com/ksweet-grnsw/grnsw-spfx-monorepo.git
cd grnsw-spfx-monorepo
npm install
```

### 2. Start Development

#### Option A: Work on Track Conditions (Weather)
```bash
npm run serve:track
```
Then open: `https://[your-tenant].sharepoint.com/_layouts/15/workbench.aspx`

#### Option B: Work on Race Management
```bash
npm run serve:race
```

#### Option C: Work on Health Tracking
```bash
npm run serve:health
```

#### Option D: Work on GAP (Adoption)
```bash
npm run serve:gap
```

### 3. Make Changes

Example: Update a weather component
```bash
# Navigate to the weather dashboard component
cd packages/track-conditions-spfx/src/webparts/weatherDashboard/components/

# Edit WeatherDashboard.tsx
# Changes will hot-reload in your browser
```

### 4. Build and Test
```bash
# Build all packages
npm run build

# Or build specific package
npm run build:track
```

### 5. Create a Release
```bash
# Update version (from package directory)
cd packages/track-conditions-spfx
npm version patch  # or minor/major

# Create release package
cd ../..
npm run release track-conditions-spfx
```

## 📁 Key Locations

### Where to find things:
- **Web Parts**: `packages/[package-name]/src/webparts/`
- **Services**: `packages/[package-name]/src/services/`
- **Shared Code**: `packages/shared/src/`
- **Built Packages**: `releases/[package-name]/`

### Configuration Files:
- **Dataverse Config**: `packages/shared/src/config/dataverseConfig.ts`
- **Package Config**: `packages/[package-name]/config/package-solution.json`

## 🔧 Common Tasks

### Add a new web part
```bash
cd packages/[package-name]
yo @microsoft/sharepoint
```

### Update Dataverse connection
Edit: `packages/shared/src/config/dataverseConfig.ts`

### Check what changed
```bash
git status
git diff
```

### Run linting
```bash
cd packages/[package-name]
npm run lint
```

## 📦 Package Overview

| Package | Purpose | Key Web Parts |
|---------|---------|---------------|
| track-conditions-spfx | Weather & track monitoring | Weather Dashboard, Temperature, Rainfall |
| race-management-spfx | Race operations | Race Meetings Calendar |
| greyhound-health-spfx | Health tracking | (In development) |
| gap-spfx | Adoption program | (In development) |

## 🚨 Troubleshooting

### npm install fails
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Build errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Can't connect to SharePoint
1. Check you're on corporate network/VPN
2. Verify tenant URL is correct
3. Try incognito/private browser mode

## 📞 Need Help?

1. Check `DEVELOPMENT.md` for detailed documentation
2. Look at existing code examples in the packages
3. Review `docs/` folder for specific topics

## 🎯 Next Steps

1. Explore the existing web parts
2. Try modifying a simple component
3. Build and deploy to your dev tenant
4. Read the full development documentation

---

**Pro Tips:**
- Always work in feature branches
- Test in SharePoint workbench before deploying
- Keep packages independent - use shared services
- Document your changes