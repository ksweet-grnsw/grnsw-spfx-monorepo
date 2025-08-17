# Race Management SPFx v1.1.49 Release

**Release Date:** December 17, 2024  
**Version:** 1.1.49  
**Package:** `race-management-spfx.sppkg`

## 🎉 New Features

### Export to CSV/Excel Functionality
- **Export All Data** - Export entire datasets with a single click
- **Export Selected Rows** - Export only the rows you've selected
- **CSV Format** - Quick export to comma-separated values for universal compatibility
- **Excel Format** - Rich HTML export with formatting, styling, and proper column headers
- **Smart Export** - Automatically names files with date stamps
- **Visual Feedback** - Shows count of selected items before export
- **Works Everywhere** - Available in Meetings, Races, and Contestants views

### Export Features Details
- **Intelligent Naming** - Files are named based on content (e.g., "selected_meetings_2024-12-17.csv")
- **Complete Data** - Exports include all visible columns with proper headers
- **Excel Styling** - Excel exports include:
  - Professional table formatting
  - Alternating row colors for readability
  - Bold headers with GRNSW blue background
  - Proper date and number formatting
  - Document title with item count

## 🔧 Technical Implementation
- Created reusable `exportUtils.ts` utility module
- Supports both CSV and Excel (HTML) formats
- Handles all data types properly (dates, numbers, strings, nulls)
- BOM character included for Excel compatibility
- Escapes special characters in CSV
- Memory-efficient blob creation

## 💻 User Interface
- Export buttons added to each table view header
- Shows selected item count when rows are selected
- Tooltips explain export behavior (selected vs all)
- Clean, consistent button styling
- Accessible keyboard navigation

## 📋 Installation Instructions

1. **Upload to SharePoint App Catalog:**
   - Navigate to your SharePoint App Catalog
   - Upload `race-management-spfx.sppkg`
   - Deploy to all sites when prompted

2. **Add to SharePoint Site:**
   - Go to your target SharePoint site
   - Click the gear icon → "Add an app"
   - Find "GRNSW Race Management" and add it

3. **Add Web Parts to Pages:**
   - Edit a SharePoint page
   - Click the "+" to add a web part
   - Look in the "GRNSW Tools" category
   - Add "Race Data Explorer"

## ⚙️ How to Use Export Feature

### Exporting All Data
1. Navigate to any view (Meetings, Races, or Contestants)
2. Click either "📊 CSV" or "📈 Excel" button
3. File downloads automatically with all visible data

### Exporting Selected Data
1. Use checkboxes to select specific rows
2. Selected count appears next to export buttons
3. Click export button to download only selected rows
4. File name indicates it contains selected data

### File Formats
- **CSV**: Opens in Excel, Google Sheets, or any text editor
- **Excel**: Opens directly in Microsoft Excel with formatting preserved

## 🔍 What's Exported
- All data from visible columns
- Proper column headers from the UI
- Formatted dates (Australian format)
- Escaped special characters
- UTF-8 encoding with BOM for international characters

## 🚀 Coming Next
- Data caching for improved performance
- Enhanced injury analytics dashboard
- Mobile responsive design
- Advanced filtering with saved presets

## 📝 Known Issues
- None reported in this release

## 🔄 Version History
- v1.1.49 - Added export to CSV/Excel functionality
- v1.1.48 - Added column toggle and multi-select features
- v1.1.47 - Initial release with quick wins implementation

## 📞 Support
For issues or questions, please contact the GRNSW Development Team or create an issue in the GitHub repository.

---

*Built with SharePoint Framework (SPFx) for Greyhound Racing NSW*