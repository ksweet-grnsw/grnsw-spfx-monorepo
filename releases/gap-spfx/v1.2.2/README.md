# GRNSW GAP SPFx Web Parts - v1.2.2

**Release Date:** December 12, 2024

## Overview
This release contains the Greyhound Adoption Program (GAP) web parts for GRNSW SharePoint Online. Version 1.2.2 fixes the critical table name issue for Dataverse integration.

## 🐛 Critical Fix in v1.2.2
- **Fixed Table Name:** Corrected table name from `cr0d3_hounds` to `cr0d3_hound` (singular)
  - Dataverse automatically pluralizes to `cr0d3_hounds` for API calls
  - This was causing "No greyhounds found" error
- **Hardcoded Plural Form:** Service now uses the correct pluralized form `cr0d3_hounds` directly

## 🔄 Previous Fixes (v1.2.0-1.2.1)
- **Fixed Dataverse Authentication:** Refactored HoundService to use SharedAuthService pattern
- **Reused Existing Services:** Following DRY principles
- **Configuration Centralization:** All Dataverse configuration in SharedAuthService

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
- **Table:** `cr0d3_hound` (singular) → API uses `cr0d3_hounds` (plural)

### Dataverse Table Configuration
- **Logical Name (Singular):** cr0d3_hound
- **API Endpoint (Plural):** cr0d3_hounds
- **Important:** Dataverse automatically pluralizes table names for API endpoints

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

## 🔄 Version History
- v1.2.2 - Fixed table name issue (cr0d3_hound → cr0d3_hounds in API)
- v1.2.1 - Properly versioned build with correct process
- v1.2.0 - Fixed authentication issues, improved service architecture
- v1.1.0 - Initial release with search and filtering capabilities

## ⚠️ Known Issues
- ESLint warnings for floating promises and any types (non-critical)
- These warnings do not affect functionality

## 🧪 Testing Checklist
- [ ] Web part loads without errors
- [ ] Greyhounds are displayed in the grid
- [ ] Search functionality works for name, microchip, and ear brand
- [ ] Filters properly show/hide adopted greyhounds
- [ ] Pagination works correctly
- [ ] Data refreshes when filters change
- [ ] Version shows as 1.2.2 in SharePoint

## 📧 Support
For issues or questions, please contact the GRNSW Development Team or create an issue in the GitHub repository.

---
*Built with SharePoint Framework 1.21.1*
*Version 1.2.2 - Fixed table name pluralization issue*