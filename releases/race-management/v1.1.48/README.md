# Race Management SPFx v1.1.48 Release

**Release Date:** December 17, 2024  
**Version:** 1.1.48  
**Package:** `race-management-spfx.sppkg`

## 🎉 New Features

### Column Toggle Functionality
- **Added column visibility controls** - Users can now show/hide specific columns in data tables
- **Persistent column preferences** - Column visibility settings are remembered across sessions
- **Easy-to-use interface** - Click the "⚙️ Columns" button to access column toggle dropdown
- **Works across all views** - Available in Meetings, Races, and Contestants tables

### Enhanced Table Selection
- **Multi-select support** - Select multiple rows with checkboxes
- **Select All functionality** - Header checkbox to select/deselect all visible rows
- **Improved row selection** - Visual feedback for selected items
- **Batch operations ready** - Infrastructure in place for future bulk operations

## 🐛 Bug Fixes
- Fixed TypeScript type issues with column filtering
- Resolved SCSS compilation errors
- Fixed column key type compatibility issues

## 💻 Technical Improvements
- Separated base column definitions from filtered columns for better state management
- Added proper TypeScript types for column visibility states
- Improved component architecture for maintainability
- Enhanced CSS modules with new styles for column toggle UI

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
   - Add either "Race Data Explorer" or "Race Meetings Calendar"

## ⚙️ Configuration

### Column Toggle Feature
- Click the "⚙️ Columns" button in the table controls
- Check/uncheck columns to show/hide them
- Changes are applied immediately
- Settings persist across sessions

### Table Selection
- Click checkboxes to select individual rows
- Use the header checkbox to select all visible rows
- Selected items are highlighted for clarity

## 🔧 Compatibility
- SharePoint Online
- SharePoint Framework 1.21.1
- Node.js 22.14.0+
- React 17.0.1

## 📝 Known Issues
- None reported in this release

## 🚀 What's Next
- Export functionality for selected rows
- Advanced filtering with saved presets
- Performance analytics dashboard
- Mobile responsive improvements

## 📞 Support
For issues or questions, please contact the GRNSW Development Team or create an issue in the GitHub repository.

---

*Built with SharePoint Framework (SPFx) for Greyhound Racing NSW*