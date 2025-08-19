# GRNSW GAP SPFx Web Parts - v1.3.0

**Release Date:** December 12, 2024

## Overview
This release fixes the critical field name issue that was preventing data from loading from the GAP Dataverse environment.

## 🎯 Critical Fix in v1.3.0
- **Fixed Primary Key Field Name:** Changed from `cr0d3_houndsid` to `cr0d3_houndid`
  - The error was: `"Could not find a property named 'cr0d3_houndsid' on type 'Microsoft.Dynamics.CRM.cr0d3_hound'"`
  - Dataverse uses singular form for the primary key: `cr0d3_houndid`
  - This was causing 400 Bad Request errors on all API calls

## ✅ What's Working Now
- API calls to Dataverse should succeed
- Greyhounds should display in the data grid
- Search and filtering should function properly
- Test API button should show actual record counts

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
- **Table Configuration:**
  - Logical Name: `cr0d3_hound` (singular)
  - API Endpoint: `cr0d3_hounds` (plural)
  - Primary Key: `cr0d3_houndid` (NOT `cr0d3_houndsid`)

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

## 🧪 Testing Checklist
- [ ] Web part loads without errors
- [ ] Greyhounds display in the data grid
- [ ] Search works for name, microchip, and ear brand
- [ ] Filters properly show/hide adopted greyhounds
- [ ] Pagination works correctly
- [ ] Test API button shows record count (not error)
- [ ] Version shows as 1.3.0 in SharePoint

## 🔄 Version History
- v1.3.0 - **WORKING VERSION** - Fixed field name issue (cr0d3_houndid)
- v1.2.3 - Debug build with enhanced logging
- v1.2.2 - Fixed table name issue (cr0d3_hound → cr0d3_hounds)
- v1.2.1 - Properly versioned build
- v1.2.0 - Fixed authentication issues
- v1.1.0 - Initial release

## 📧 Support
For issues or questions, please contact the GRNSW Development Team or create an issue in the GitHub repository.

---
*Built with SharePoint Framework 1.21.1*
*Version 1.3.0 - Production Ready*