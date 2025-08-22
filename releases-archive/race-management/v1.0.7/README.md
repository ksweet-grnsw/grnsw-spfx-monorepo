# Race Management SPFx v1.0.7 Release

**Release Date:** December 19, 2024

## 🐛 Bug Fixes

### Simplified Multi-Select Dropdown Logic
- **Issue:** Multi-select was not accumulating selections properly in v1.0.6
- **Solution:** Simplified the onChange handlers to use toggle logic
- **Added:** `responsiveMode={1}` prop to improve dropdown behavior
- **Result:** Dropdowns now properly toggle selections on/off with each click

## 📋 Technical Details

### Changes Made:
1. **Simplified onChange handlers**:
   - Removed complex `option.selected` checking
   - Now uses simple toggle logic - adds item if not present, removes if present
   - This approach is more reliable with Fluent UI's multi-select implementation

2. **Added responsiveMode property**:
   - Set `responsiveMode={1}` on both dropdowns
   - Helps maintain dropdown open state during multi-selection

### Build Information:
- Built with `gulp bundle --ship` and `gulp package-solution --ship`
- SharePoint Framework version: 1.21.1
- Node version: 22.17.1
- TypeScript version: 4.7.4
- Version properly set to 1.0.7 BEFORE building

## 📦 Installation Instructions

1. Upload `race-management-spfx-v1.0.7-PROD.sppkg` to your SharePoint App Catalog
2. Deploy the solution when prompted
3. Add the app to your SharePoint site(s)
4. The Race Meetings Calendar web part will be available in the "GRNSW Tools" section

## ✅ Testing Recommendations

After deployment:
1. Open Authority dropdown and select multiple items
2. Verify each click toggles the item (adds if not selected, removes if selected)
3. Confirm selected items show checkmarks
4. Test the same with Track dropdown
5. Verify filters are applied correctly with multiple selections
6. Test "Clear Filters" button removes all selections

## 🔄 Upgrade Notes

If upgrading from v1.0.6:
- This uses a simpler, more reliable toggle approach
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- The multi-select should now work as expected

---

**File:** `race-management-spfx-v1.0.7-PROD.sppkg`  
**Size:** ~370 KB  
**Compatible with:** SharePoint Online