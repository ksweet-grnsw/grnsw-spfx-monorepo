# Authentication Setup for GRNSW Track Conditions Web Parts

## Overview
The Track Conditions web parts require authentication to access weather data from the Dataverse API. If users encounter 403 (Forbidden) errors, it means they don't have the necessary permissions.

## Error Symptoms
Users will see error messages like:
- "Error: UNKNOWN_ERROR: Error fetching weather data: - Status: 403"
- "Access Denied - You don't have permission to access the weather data"

## Required Permissions

### 1. API Permission Requests
The SPFx solution requests the following permissions:
- **Resource**: `https://org98489e5d.crm6.dynamics.com`
- **Scope**: `user_impersonation`

### 2. Dataverse Access
Users need access to:
- **Environment**: `org98489e5d.crm6.dynamics.com` (Dataverse/Dynamics 365)
- **Table**: `cr4cc_weatherdatas`
- **Operations**: Read access

## Setup Instructions for Administrators

### Step 1: Approve API Permissions in SharePoint Admin Center
1. Navigate to SharePoint Admin Center
2. Go to "API management" under "Advanced"
3. Look for pending requests from "grnsw-track-conditions-spfx"
4. Approve the permission request for `https://org98489e5d.crm6.dynamics.com`

### Step 2: Configure Dataverse Permissions
1. Go to Power Platform Admin Center
2. Select the environment `org98489e5d`
3. Navigate to Settings > Users + permissions > Security roles
4. Create or modify a security role with:
   - Read access to `cr4cc_weatherdatas` table
   - Basic read privileges for the organization

### Step 3: Assign Users to Security Role
1. In Dataverse/Dynamics 365, go to Settings > Security
2. Select "Users"
3. Select the users who need access to weather data
4. Click "Manage Roles"
5. Assign the security role created in Step 2

### Step 4: Azure AD App Registration (if needed)
If the automatic permission grant doesn't work:

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Find the SharePoint app registration
3. Add API permissions:
   - API: Dynamics CRM
   - Delegated permissions: user_impersonation
4. Grant admin consent

## Verification Steps

1. After setup, users should refresh their browser
2. Clear browser cache if needed
3. Try accessing the weather web parts again
4. The 403 errors should be resolved

## Troubleshooting

### If errors persist:
1. Check user's effective permissions in Dataverse
2. Verify the API permission was approved in SharePoint
3. Check Azure AD sign-in logs for authentication issues
4. Ensure the user's account is synchronized between SharePoint and Dataverse

### Common Issues:
- **Guest users**: May need explicit permissions in Dataverse
- **New users**: May need to wait for permission propagation (up to 1 hour)
- **Cache issues**: Clear browser cache and cookies

## Support Contact
For additional assistance, contact:
- SharePoint Administrator: [admin email]
- Dataverse Administrator: [admin email]
- Development Team: GRNSW Development Team