# GRNSW GAP SPFx Web Parts - v1.2.0

**Release Date:** December 12, 2024

## Overview
This release contains the Greyhound Adoption Program (GAP) web parts for GRNSW SharePoint Online. Version 1.2.0 fixes critical authentication issues with Dataverse integration.

## 🐛 Bug Fixes
- **Fixed Dataverse Authentication:** Refactored HoundService to use SharedAuthService pattern with proper AadHttpClient implementation
- **Reused Existing Services:** Following DRY principles, now properly reuses authentication patterns from other packages
- **Configuration Centralization:** All Dataverse configuration now centralized in SharedAuthService

## 📋 Features
### Hound Search Web Part
Advanced search and filtering capabilities for greyhounds in the adoption program:
- **Search by:** Name, microchip number, or ear brand
- **Filter by:**
  - Adoption status (available/adopted)
  - Sex (Male/Female)
  - Desexed status
  - C5 vaccination status
- **Data Grid Display:** Professional table with sorting and pagination
- **Performance:** Optimized OData queries with field selection

## 🔧 Technical Details
- **Framework:** SharePoint Framework (SPFx) 1.21.1
- **React:** 17.0.1
- **TypeScript:** 5.3.3
- **Build:** Production build with --ship flag
- **Authentication:** Azure AD via AadHttpClient
- **Dataverse Environment:** https://orgda56a300.crm6.dynamics.com
- **Table:** cr0d3_hounds

### Build Information
- Built with TypeScript 4.7.4
- 10 ESLint warnings (non-critical)
- Package size: Optimized for SharePoint Online

## 📦 Installation Instructions
1. Navigate to your SharePoint App Catalog
2. Upload the `gap-spfx.sppkg` file
3. Check "Make this solution available to all sites"
4. Click "Deploy"
5. Wait for deployment to complete (usually 5-10 minutes)

## 🚀 Adding to SharePoint Pages
1. Edit a SharePoint page
2. Click the "+" button to add a web part
3. Search for "Hound" or look in the "GRNSW Tools" category
4. Select "Hound Search" web part
5. Configure the web part properties if needed

## 🎯 Configuration
The web part connects automatically to the GAP Dataverse environment. No additional configuration is required for basic usage.

### Default Behavior
- Shows only non-adopted greyhounds by default
- Displays 50 results per page
- Sorted alphabetically by racing name

## 🔄 What's Changed from v1.1.0
- Refactored authentication to use existing SharedAuthService pattern
- Fixed "Failed to load greyhounds" error
- Improved code reusability following DRY and SOLID principles
- Version properly synchronized across all configuration files

## ⚠️ Known Issues
- ESLint warnings for floating promises and any types (non-critical)
- These warnings do not affect functionality

## 🧪 Testing Checklist
- [ ] Web part loads without errors
- [ ] Search functionality works for name, microchip, and ear brand
- [ ] Filters properly show/hide adopted greyhounds
- [ ] Pagination works correctly
- [ ] Data refreshes when filters change

## 📧 Support
For issues or questions, please contact the GRNSW Development Team or create an issue in the GitHub repository.

## 🏷️ Version History
- v1.2.0 - Fixed authentication issues, improved service architecture
- v1.1.0 - Initial release with search and filtering capabilities

---
*Built with SharePoint Framework 1.21.1*