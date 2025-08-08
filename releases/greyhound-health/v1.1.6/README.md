# Greyhound Health SPFx v1.1.6 Release - Debug Version

**Release Date:** December 12, 2024  
**Package:** greyhound-health-spfx-v1.1.6-DEBUG.sppkg

## 🔍 Debug Release for Euthanasia Tracking Issue

This is a debug release to diagnose why euthanasia counts are showing as 0 in the Safety Dashboard.

### What's New in v1.1.6
- **Enhanced Debug Logging**: Added comprehensive console logging to identify the issue
- **Version Increment**: Changed from 1.1.5 to 1.1.6 to bypass SharePoint caching issues
- **Multiple Euthanasia Value Checks**: Now checking for 'euthanised', 'euthanased', 'euthanized', and 'deceased'

### Debug Features
The package includes console logging that will show:
1. **API Response Data**
   - Total records returned
   - First record structure
   - All field names in the response
   
2. **Injury Data Processing**
   - Total injuries count
   - Unique injury state values
   - Unique stand down days values
   - First 5 complete injury records
   
3. **Euthanasia Detection**
   - Each injury being checked
   - Which criteria triggered euthanasia classification

### How to Use This Debug Version

1. **Upload to SharePoint App Catalog**
   - Upload `greyhound-health-spfx-v1.1.6-DEBUG.sppkg`
   - Check "Make this solution available to all sites"
   - Deploy the solution

2. **Update the App**
   - Go to your site with the Safety Dashboard
   - Site Contents > Manage Apps
   - Update "Greyhound Health SPFx" to version 1.1.6

3. **Collect Debug Information**
   - Open the page with Safety Dashboard web part
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Clear console (Ctrl+L)
   - Refresh the page (F5)
   - Look for messages starting with:
     - `[InjuryDataService]`
     - `[SafetyDashboard]`

4. **What to Look For**
   ```
   [InjuryDataService] API Response: {
     totalRecords: [number],
     firstRecord: {...},
     allFields: [array of field names]
   }
   
   [SafetyDashboard] Sample injury data for debugging: {
     totalCount: [number],
     injuryStates: [array of unique values],
     standDownDays: [array of unique values],
     determinedSerious: [array of unique values]
   }
   ```

### Troubleshooting

**If you still see old console messages:**
- Clear browser cache (Ctrl+Shift+Delete)
- In SharePoint, append `?v=1.1.6` to the page URL
- Try InPrivate/Incognito mode
- Wait 5-10 minutes for CDN cache to clear

**If no debug messages appear:**
- Ensure you're looking at the Safety Dashboard web part
- Check that version shows 1.1.6 in web part properties
- Try removing and re-adding the web part

### Technical Details
- Built with debugging code in SafetyDashboard.tsx and InjuryDataService.ts
- Checks multiple spelling variations of "euthanised"
- Logs all unique field values to identify correct field naming
- Version bumped to 1.1.6 to force cache refresh

### Next Steps
Once debug information is collected, we will:
1. Identify the correct field names and values
2. Update the euthanasia detection logic
3. Create a production v1.1.7 release with the fix

## Support
Share the console output to help diagnose and fix the euthanasia tracking issue.