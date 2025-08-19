# GRNSW GAP SPFx Web Parts - v1.2.3 (Debug Build)

**Release Date:** December 12, 2024

## Overview
This is a DEBUG release with enhanced logging to diagnose why no greyhounds are being returned from Dataverse.

## 🔍 Debug Features in v1.2.3
- **Enhanced Console Logging:**
  - Logs full API request URLs
  - Logs response status codes
  - Logs raw API response data
  - Shows field names if data is returned
  - Shows sample record structure
- **Test API Button:** 
  - Added "Test API (No Filters)" button in advanced filters
  - Makes a simple API call with no filters
  - Shows total record count in alert
  - Logs full details to browser console

## 🐛 How to Debug
1. Deploy this version to SharePoint
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Click "Show advanced filters"
5. Click "Test API (No Filters)" button
6. Check console for:
   - Request URL being called
   - Response status (should be 200)
   - Number of records returned
   - Field names in the data
   - Any error messages

## Expected Console Output
```
Testing API with no filters...
Initializing AAD client for: https://orgda56a300.crm6.dynamics.com
Making request to: https://orgda56a300.crm6.dynamics.com/api/data/v9.1/cr0d3_hounds?$select=...
Request completed with status: 200
Response status: 200 OK
API Response data: {value: [...], @odata.count: X}
Number of records returned: X
First record fields: [field1, field2, ...]
Test API Results: {hounds: [...], totalCount: X}
```

## Possible Issues to Check
1. **Authentication:** If status is 401/403, authentication is failing
2. **Table Name:** If status is 404, table name might be wrong
3. **Empty Data:** If status is 200 but value is [], database might be empty
4. **Field Names:** If data exists but fields are different, need to update field mappings

## Technical Details
- Table configured as: `cr0d3_hound` (singular) → API uses `cr0d3_hounds` (plural)
- Environment: https://orgda56a300.crm6.dynamics.com
- Full query logged to console for verification

## Once Issue is Identified
After debugging with this version and identifying the issue, a proper fix will be implemented in v1.3.0.

---
*This is a debug build - not for production use*