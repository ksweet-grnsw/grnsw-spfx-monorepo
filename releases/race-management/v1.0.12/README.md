# Race Management SPFx v1.0.12 Release

**Release Date:** December 19, 2024

## 🎯 CRITICAL BUG FIX - Multi-Select Dropdowns

### Fixed: Multi-Select Dropdowns Now Work Properly
- **Root Cause Identified:** The web part was storing multiple selections as a comma-separated string (e.g., "QLD,VIC,NSW") but then treating that entire string as a single array element
- **The Fix:** 
  - When loading saved selections from web part properties, now properly splits the comma-separated string into an array
  - This ensures the Dataverse API receives correct filter queries with OR conditions
  - Removed duplicate selections that were accumulating

## 📋 Technical Details

### The Problem (v1.0.5-1.0.11):
- When multiple items were selected, they were stored as: `"QLD,VIC,NSW"`
- On reload, this became: `["QLD,VIC,NSW"]` (single element array)
- This generated invalid API filter: `cr4cc_authority eq 'QLD,VIC,NSW'`
- Result: No data returned because no single authority matches that entire string

### The Solution (v1.0.12):
```typescript
// Before (wrong):
selectedAuthorities: props.selectedAuthority ? [props.selectedAuthority] : []

// After (correct):
selectedAuthorities: props.selectedAuthority ? props.selectedAuthority.split(',').filter(a => a) : []
```

### What This Fixes:
1. ✅ Multiple authority selections now work
2. ✅ Multiple track selections now work
3. ✅ Correct API queries are generated: `(cr4cc_authority eq 'QLD' or cr4cc_authority eq 'VIC' or cr4cc_authority eq 'NSW')`
4. ✅ Data loads properly when multiple filters are selected
5. ✅ Selections persist correctly when navigating or refreshing

### Build Information:
- Clean build with all artifacts removed
- SharePoint Framework version: 1.21.1
- Version: 1.0.12
- Bundle Hash: f57e0560eea8444dde36

## 📦 Installation Instructions

1. **Delete ALL old versions from App Catalog**
2. Upload `race-management-spfx-v1.0.12-PROD.sppkg`
3. Deploy the solution
4. **CRITICAL:** Clear browser cache completely
5. Add/update the app on your SharePoint sites

## ✅ Testing Instructions

1. **Test Multi-Select:**
   - Select multiple authorities (e.g., NSW, VIC, QLD)
   - Verify all checkboxes stay checked
   - Confirm meetings from all selected authorities appear
   
2. **Test Persistence:**
   - Select multiple filters
   - Navigate to different month/week/day
   - Verify selections remain
   
3. **Test Clear Filters:**
   - Select multiple items
   - Click "Clear Filters"
   - Verify all selections are removed

## 🚀 Version History
- v1.0.5-1.0.11: Various attempts to fix multi-select (all had the same root cause issue)
- v1.0.12: **FIXED** - Properly parses comma-separated strings into arrays

---

**File:** `race-management-spfx-v1.0.12-PROD.sppkg`  
**Size:** ~370 KB  
**Compatible with:** SharePoint Online
**Status:** ✅ Multi-select dropdowns FIXED