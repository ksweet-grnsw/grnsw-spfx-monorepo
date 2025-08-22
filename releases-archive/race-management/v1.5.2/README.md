# Race Management SPFx v1.5.2 Release

**Release Date:** August 18, 2025  
**Package:** race-management-spfx.sppkg

## 🎯 New Features

### Enhanced Quick Filter Buttons
- Quick filter buttons (Today, Week, 30 Days) now have proper button styling with shadows and hover effects
- Improved visual weight with background colors, borders, and depth
- Better user feedback with hover state transitions

### Improved Icon Visibility
- Injury/health icons scaled 30% larger for better visibility
- Increased stroke width from 3 to 4 for thicker, more prominent lines
- Enhanced icon clarity across all table views

### Optimized Action Column
- Action column width now sizes to content (40px per action)
- Reduced spacing between action buttons from 8px to 4px
- More compact layout prevents awkward spacing with icons

## 🐛 Bug Fixes

- Fixed quick filter buttons appearing as hyperlinks
- Resolved action column being too wide for icon content
- Improved overall spacing and alignment in filter sections

## 🔧 Technical Details

### Build Information
- SPFx Version: 1.21.1
- Node Version: 22.14.0
- TypeScript: 5.3.3
- Build Mode: Production (--ship)

### Version Details
- Package Version: 1.5.2
- Solution Version: 1.5.2.0

### Modified Components
- DateRangeFilter component with enhanced button styling
- Health/injury icon SVG with improved scaling and stroke width
- useTableColumns hook with optimized action column width calculation
- Filter layout with minimized spacing between sections

## 📦 Installation Instructions

1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution when prompted
3. Add the Race Data Explorer web part to your SharePoint pages
4. The web part will appear in the "GRNSW Tools" section

## ⚙️ Configuration

No additional configuration required. The improvements are automatically applied to all existing and new instances of the Race Data Explorer web part.

## 🔄 Upgrade Notes

This is a direct upgrade from v1.5.1. No breaking changes. All existing web part instances will automatically receive the visual improvements.

## 📝 Notes

- Quick filter buttons now provide better visual feedback for user interactions
- The injury indicator is more prominent and easier to spot in data tables
- Action columns are now more appropriately sized for their icon content