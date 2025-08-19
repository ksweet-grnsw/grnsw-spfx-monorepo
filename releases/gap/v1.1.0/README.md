# GAP (Greyhound Adoption Program) Web Parts - v1.1.0

**Release Date:** December 19, 2024  
**Package:** gap-spfx.sppkg

## 🎉 New Features

### GAP Hound Search Web Part
This is the first release of the GAP web parts package, featuring a comprehensive greyhound search and filtering system for the adoption program.

#### Key Features:
- **Advanced Search**: Search greyhounds by name, microchip number, or ear brand
- **Smart Filtering**: 
  - Filter by availability status (Available/Adopted/HASed)
  - Filter by sex (Male/Female)
  - Filter by desexed status
  - Filter by C5 vaccination status
- **Data Grid Display**: Clean, sortable table showing all greyhound information
- **Detailed View**: Click any greyhound to see full details in a slide-out panel
- **Pagination**: Handles large datasets with configurable page sizes (10-50 results)
- **Performance**: Optimized OData queries for fast data retrieval

## 📊 Technical Details

### Environment Configuration
- **Dataverse URL**: https://orgda56a300.crm6.dynamics.com
- **API Version**: v9.1
- **Table**: cr0d3_hounds
- **Authentication**: Azure AD via SPFx context

### Web Part Properties
- `title`: Customizable title for the web part
- `pageSize`: Number of results per page (10-50)
- `showOnlyAvailable`: Toggle to show only non-adopted dogs
- `enableAdvancedFilters`: Enable/disable advanced filter options

### Build Information
- **SPFx Version**: 1.21.1
- **Node Version**: 22.17.1
- **TypeScript**: 5.3.3
- **React**: 17.0.1
- **Build Warnings**: 8 (ESLint warnings only, no functional issues)

## 🚀 Installation Instructions

1. **Upload to App Catalog**:
   - Navigate to your SharePoint App Catalog
   - Upload the `gap-spfx.sppkg` file
   - Check "Make this solution available to all sites" if desired
   - Deploy the solution

2. **Add to SharePoint Page**:
   - Edit a SharePoint page
   - Click the "+" to add a web part
   - Search for "GAP Hound Search" in the "GRNSW Tools" category
   - Configure the web part properties as needed

## ⚙️ Configuration

### Required Permissions
- Read access to Dataverse GAP environment
- SharePoint site member permissions

### Property Pane Settings
1. **Display Settings**:
   - Title: Set a custom title for the web part
   - Results per page: Choose between 10, 20, 30, 40, or 50
   - Show only available: Toggle to filter out adopted dogs
   - Enable advanced filters: Show/hide advanced filter options

## 🏗️ Architecture Highlights

### Design Patterns Applied
- **SOLID Principles**: Single responsibility for services and components
- **DRY Principle**: Reusable search logic and data processing
- **Service Layer**: HoundService handles all Dataverse operations
- **Component Separation**: Clean separation between UI and business logic

### Key Components
- `HoundService`: Dataverse API integration with OData query building
- `HoundDataGrid`: Reusable data grid component using Fluent UI DetailsList
- `HoundSearch`: Main component orchestrating search and filter logic
- `IHound`: TypeScript interface for type-safe greyhound data

## 🐛 Known Issues
- None reported in this release

## 📝 Notes
- Default filter shows only non-adopted dogs to focus on available greyhounds
- Search is case-insensitive and searches across multiple fields
- Data is fetched directly from Dataverse with no caching (always shows latest data)

## 🔄 Future Enhancements
- Export functionality for search results
- Bulk operations for administrative tasks
- Integration with adoption application workflow
- Photo gallery view option
- Advanced reporting and analytics

## 📞 Support
For issues or questions, please contact the GRNSW Development Team or create an issue in the GitHub repository.

---
**Version**: 1.1.0  
**Build Date**: December 19, 2024  
**Package Type**: SharePoint Framework Solution (SPFx)