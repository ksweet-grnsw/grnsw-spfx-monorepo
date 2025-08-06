# Quick Access Setup for Weather Data

## Fastest Method: Azure AD Group

1. **Create Azure AD Security Group**
   - Name: "GRNSW Weather Data Users"
   - Add all users who need access

2. **In Power Platform Admin Center**
   - Go to your environment (org98489e5d)
   - Settings > Users + permissions > Teams
   - Create new team linked to your Azure AD group
   - Assign "Basic User" role + custom weather data permissions

3. **Create Custom Security Role** (one-time setup)
   ```
   Role Name: Weather Data Reader
   Permissions:
   - Organization: Read
   - Weather Data (cr4cc_weatherdatas): Read (Organization level)
   - User Settings: Read
   ```

4. **SharePoint Admin Center**
   - API access > Approve request for org98489e5d.crm6.dynamics.com

## Minimum Required Permissions

Users need:
- SharePoint site access (where web parts are hosted)
- Dataverse environment access
- Read permission on cr4cc_weatherdatas table

## Quick Test

1. Add yourself to the security role first
2. Test the web parts
3. If working, add other users
4. If not working, check:
   - API permission approval in SharePoint
   - User exists in Dataverse
   - Security role is assigned correctly

## Emergency Access

If you need to quickly grant access to specific users:
1. Power Platform Admin Center > Environment > Users
2. Search for user by email
3. Manage security roles > Add "Weather Data Reader"
4. User should have access within 5-10 minutes

## Troubleshooting Checklist

- [ ] API permission approved in SharePoint Admin
- [ ] User exists in Dataverse (not just Azure AD)
- [ ] User has security role with weather data read permission
- [ ] User has signed out/in after permission change
- [ ] No conditional access policies blocking the user
- [ ] User has access to the SharePoint site