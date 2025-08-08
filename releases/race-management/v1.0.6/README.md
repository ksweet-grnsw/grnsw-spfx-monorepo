# Race Management SPFx v1.0.6 Release

**Release Date:** December 19, 2024

## 🐛 Bug Fixes

### Improved Multi-Select Dropdown Functionality
- **Previous Issue (v1.0.5):** Dropdowns stayed open but only allowed single selection
- **Root Cause:** The onChange handler was not properly using the `option.selected` property provided by Fluent UI
- **Solution:** 
  - Corrected the onChange handlers to properly check `option.selected` property
  - Now correctly adds items when `option.selected === true`
  - Properly removes items when `option.selected === false`
  - Removed `notifyOnReselect` prop that was interfering with multi-select behavior

## 📋 Technical Details

### Changes Made:
1. **Updated dropdown onChange handlers** in `RaceMeetings.tsx`:
   - Now properly uses `option.selected` to determine if item is being selected or deselected
   - Prevents duplicate additions to selection array
   - Correctly accumulates multiple selections

2. **Dropdown Configuration**:
   - Removed `notifyOnReselect={true}` prop that was causing issues
   - Kept `multiSelect` and `multiSelectDelimiter` properties

### Build Information:
- Built with `gulp bundle --ship` and `gulp package-solution --ship`
- SharePoint Framework version: 1.21.1
- Node version: 22.17.1
- TypeScript version: 4.7.4

## 📦 Installation Instructions

1. Upload `race-management-spfx-v1.0.6-PROD.sppkg` to your SharePoint App Catalog
2. Deploy the solution when prompted
3. Add the app to your SharePoint site(s)
4. The Race Meetings Calendar web part will be available in the "GRNSW Tools" section

## ✅ Testing Recommendations

After deployment:
1. Click on Authority dropdown and select multiple items using checkboxes
2. Verify that:
   - Dropdown stays open while selecting
   - Multiple selections are accumulated
   - Selected items show checkmarks
   - Filter shows multiple selected values separated by commas
3. Test the same with Track dropdown
4. Verify "Clear Filters" removes all selections
5. Confirm that meetings are properly filtered by multiple selections

## 🔄 Upgrade Notes

If upgrading from v1.0.5:
- This fixes the multi-select accumulation issue
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- The dropdown should now properly allow multiple selections

---

**File:** `race-management-spfx-v1.0.6-PROD.sppkg`  
**Size:** ~370 KB  
**Compatible with:** SharePoint Online