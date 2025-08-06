# PowerShell script to add users to Dataverse in bulk
# Requires: Power Platform CLI or Dataverse SDK

# Install Power Platform CLI if not already installed
# Install-Module -Name Microsoft.PowerApps.Administration.PowerShell

# Variables
$environmentUrl = "https://org98489e5d.crm6.dynamics.com"
$securityRoleName = "Weather Data Readers"

# Connect to Dataverse
# You'll be prompted for credentials
Connect-CrmOnline -ServerUrl $environmentUrl

# List of user emails to add
$userEmails = @(
    "user1@grnsw.com.au",
    "user2@grnsw.com.au",
    "user3@grnsw.com.au"
    # Add more users as needed
)

# Get the security role
$role = Get-CrmRecords -EntityLogicalName role -FilterAttribute name -FilterOperator eq -FilterValue $securityRoleName

if ($role.Count -eq 0) {
    Write-Error "Security role '$securityRoleName' not found. Please create it first."
    exit
}

$roleId = $role.CrmRecords[0].roleid

# Process each user
foreach ($email in $userEmails) {
    try {
        # Find the user
        $user = Get-CrmRecords -EntityLogicalName systemuser -FilterAttribute internalemailaddress -FilterOperator eq -FilterValue $email
        
        if ($user.Count -gt 0) {
            $userId = $user.CrmRecords[0].systemuserid
            
            # Check if user already has the role
            $existingRole = Get-CrmUserSecurityRoles -UserId $userId | Where-Object { $_.roleid -eq $roleId }
            
            if ($existingRole) {
                Write-Host "User $email already has the role" -ForegroundColor Yellow
            } else {
                # Assign the role
                Add-CrmSecurityRoleToUser -UserId $userId -SecurityRoleId $roleId
                Write-Host "Successfully added role to $email" -ForegroundColor Green
            }
        } else {
            Write-Warning "User $email not found in Dataverse. They may need to be synchronized from Azure AD first."
        }
    } catch {
        Write-Error "Error processing user $email : $_"
    }
}

Write-Host "User role assignment completed!" -ForegroundColor Cyan