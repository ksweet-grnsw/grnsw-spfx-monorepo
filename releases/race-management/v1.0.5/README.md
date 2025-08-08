# Race Management SPFx v1.0.5 Release

**Release Date:** December 19, 2024

## 🐛 Bug Fixes

### Fixed Multi-Select Dropdown Functionality
- **Issue:** Authority and Track dropdown filters were closing immediately when selecting checkboxes, preventing multiple selections
- **Solution:** Updated the onChange event handlers to properly toggle selections based on current state
- **Impact:** Users can now select multiple authorities and tracks using the checkboxes as intended

## 📋 Technical Details

### Changes Made:
1. **Modified dropdown onChange handlers** in `RaceMeetings.tsx`:
   - Changed from using `option.selected` property to checking current state
   - Used `indexOf()` instead of `includes()` for ES5 compatibility
   - Added `notifyOnReselect={true}` to keep dropdowns open during selection

2. **Updated TypeScript configuration**:
   - Added 'es2015' to lib array in tsconfig.json for better array method support

### Build Information:
- Built with `gulp bundle --ship` and `gulp package-solution --ship`
- SharePoint Framework version: 1.21.1
- Node version: 22.17.1
- TypeScript version: 4.7.4

### Known Issues:
- ESLint warnings for `any` types and `void` operators (non-critical)
- These warnings do not affect functionality

## 📦 Installation Instructions

1. Upload `race-management-spfx-v1.0.5-PROD.sppkg` to your SharePoint App Catalog
2. Deploy the solution when prompted
3. Add the app to your SharePoint site(s)
4. The Race Meetings Calendar web part will be available in the "GRNSW Tools" section

## ✅ Testing Recommendations

After deployment:
1. Test multi-select functionality in both Authority and Track dropdowns
2. Verify that multiple selections persist when filtering meetings
3. Confirm that the "Clear Filters" button removes all selections
4. Check that track dropdown populates correctly when authorities are selected

## 🔄 Upgrade Notes

If upgrading from v1.0.4:
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Remove and re-add the web part if dropdown issues persist
- Allow 15-30 minutes for SharePoint CDN propagation

---

**File:** `race-management-spfx-v1.0.5-PROD.sppkg`  
**Size:** ~370 KB  
**Compatible with:** SharePoint Online