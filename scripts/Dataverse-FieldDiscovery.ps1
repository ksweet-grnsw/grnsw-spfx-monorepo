# Dataverse Field Discovery PowerShell Script
# Automatically obtains Azure AD tokens and discovers all fields from Dataverse environments
# Generates comprehensive documentation of tables and their metadata

param(
    [Parameter(Mandatory=$false)]
    [string]$TenantId = "grnsw21.onmicrosoft.com",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$false)]
    [string]$ClientSecret,
    
    [Parameter(Mandatory=$false)]
    [switch]$UseInteractiveAuth,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "$PSScriptRoot\..\docs\dataverse"
)

# Environment configurations
# NOTE: Dataverse pluralization is weird! Examples:
#   - racemeeting → racemeetings (normal) OR racemeetingses (if already plural)
#   - races → raceses (adds 'es' to words ending in 's')
#   - injury → injuries (normal y→ies)
$Environments = @{
    "Racing Data" = @{
        Url = "https://racingdata.crm6.dynamics.com"
        ApiEndpoint = "https://racingdata.crm6.dynamics.com/api/data/v9.1"
        Tables = @(
            @{ 
                DisplayName = "Meeting"
                Singular = "cr4cc_racemeeting"
                LogicalName = "cr4cc_racemeetings"
                PossiblePlurals = @("cr4cc_racemeetings", "cr4cc_racemeetingses")
            },
            @{ 
                DisplayName = "Races"
                Singular = "cr616_races"
                LogicalName = "cr616_races"  # Might already be plural!
                PossiblePlurals = @("cr616_races", "cr616_raceses")  # Try BOTH - original first, then double plural
            },
            @{ 
                DisplayName = "Contestants"
                Singular = "cr616_contestants"
                LogicalName = "cr616_contestants"  # Might already be plural!
                PossiblePlurals = @("cr616_contestants", "cr616_contestantses")  # Try BOTH - original first, then double plural
            }
        )
    }
    "Weather Data Production" = @{
        Url = "https://org98489e5d.crm6.dynamics.com"
        ApiEndpoint = "https://org98489e5d.crm6.dynamics.com/api/data/v9.1"
        Tables = @(
            @{ 
                DisplayName = "Weather Data"
                Singular = "cr4cc_weatherdata"
                LogicalName = "cr4cc_weatherdatas"
                PossiblePlurals = @("cr4cc_weatherdatas", "cr4cc_weatherdatases")
            }
        )
    }
    "Injury Data" = @{
        Url = "https://orgfc8a11f1.crm6.dynamics.com"
        ApiEndpoint = "https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1"
        Tables = @(
            @{ 
                DisplayName = "Injury Data"
                Singular = "cra5e_injurydata"
                LogicalName = "cra5e_injurydatas"
                PossiblePlurals = @("cra5e_injurydatas", "cra5e_injurydatases")
            },
            @{ 
                DisplayName = "Injuries"
                Singular = "cr4cc_injury"
                LogicalName = "cr4cc_injuries"
                PossiblePlurals = @("cr4cc_injuries", "cr4cc_injurieses")
            },
            @{ 
                DisplayName = "Greyhound"
                Singular = "cra5e_greyhound"
                LogicalName = "cra5e_greyhounds"
                PossiblePlurals = @("cra5e_greyhounds", "cra5e_greyhoundses")
            },
            @{ 
                DisplayName = "Health Check"
                Singular = "cra5e_heathcheck"  # Misspelled in system
                LogicalName = "cra5e_heathchecks"
                PossiblePlurals = @("cra5e_heathchecks", "cra5e_heathcheckses")
            }
        )
    }
    "GAP (Greyhound Adoption Program)" = @{
        Url = "https://org16bdb053.crm6.dynamics.com"
        ApiEndpoint = "https://org16bdb053.crm6.dynamics.com/api/data/v9.1"
        Tables = @()
    }
}

# Function to get Azure AD access token
function Get-DataverseAccessToken {
    param(
        [string]$ResourceUrl,
        [string]$TenantId,
        [string]$ClientId,
        [string]$ClientSecret,
        [bool]$Interactive
    )
    
    Write-Host "Obtaining access token for $ResourceUrl..." -ForegroundColor Cyan
    
    if ($Interactive) {
        # Interactive authentication using Azure CLI
        try {
            # Check if Azure CLI is installed
            $azVersion = az version 2>$null
            if (-not $azVersion) {
                throw "Azure CLI is not installed. Please install it or provide ClientId and ClientSecret."
            }
            
            # Login if not already logged in
            $account = az account show 2>$null | ConvertFrom-Json
            if (-not $account) {
                Write-Host "Please login to Azure..." -ForegroundColor Yellow
                az login --tenant $TenantId
            }
            
            # Get token
            $token = az account get-access-token --resource $ResourceUrl --query accessToken -o tsv
            return $token
        }
        catch {
            Write-Error "Failed to get token interactively: $_"
            return $null
        }
    }
    else {
        # Service principal authentication
        if (-not $ClientId -or -not $ClientSecret) {
            Write-Error "ClientId and ClientSecret are required for non-interactive authentication"
            return $null
        }
        
        $tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
        $body = @{
            client_id = $ClientId
            client_secret = $ClientSecret
            scope = "$ResourceUrl/.default"
            grant_type = "client_credentials"
        }
        
        try {
            $response = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
            return $response.access_token
        }
        catch {
            Write-Error "Failed to get token: $_"
            return $null
        }
    }
}

# Function to fetch table metadata
function Get-TableMetadata {
    param(
        [string]$ApiEndpoint,
        [string]$EntityName,
        [string]$AccessToken
    )
    
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
        "Accept" = "application/json"
        "OData-MaxVersion" = "4.0"
        "OData-Version" = "4.0"
        "Prefer" = 'odata.include-annotations="*"'
    }
    
    # Try to get metadata definition
    $metadataUrl = "$ApiEndpoint/EntityDefinitions(LogicalName='$EntityName')?`$expand=Attributes"
    
    try {
        $response = Invoke-RestMethod -Uri $metadataUrl -Headers $headers -Method Get
        return $response
    }
    catch {
        Write-Warning "Could not fetch metadata for $EntityName using EntityDefinitions"
        return $null
    }
}

# Function to discover fields from sample data
function Get-TableFields {
    param(
        [string]$ApiEndpoint,
        [hashtable]$TableConfig,
        [string]$AccessToken
    )
    
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
        "Accept" = "application/json"
        "OData-MaxVersion" = "4.0"
        "OData-Version" = "4.0"
    }
    
    # Try each possible plural form
    $pluralsToTry = if ($TableConfig.PossiblePlurals) { $TableConfig.PossiblePlurals } else { @($TableConfig.LogicalName) }
    
    foreach ($tableName in $pluralsToTry) {
        # Fetch sample record to discover fields
        $dataUrl = "$ApiEndpoint/$tableName`?`$top=1"
        
        try {
            Write-Host "    Trying plural form: $tableName..." -ForegroundColor Gray
            $response = Invoke-RestMethod -Uri $dataUrl -Headers $headers -Method Get
        
        if ($response.value -and $response.value.Count -gt 0) {
            $sampleRecord = $response.value[0]
            $fields = @()
            
            foreach ($property in $sampleRecord.PSObject.Properties) {
                $field = @{
                    Name = $property.Name
                    Type = if ($null -eq $property.Value) { "null" } 
                           elseif ($property.Value -is [int]) { "integer" }
                           elseif ($property.Value -is [double]) { "decimal" }
                           elseif ($property.Value -is [bool]) { "boolean" }
                           elseif ($property.Value -is [datetime]) { "datetime" }
                           else { "string" }
                    SampleValue = if ($null -ne $property.Value) { 
                        $value = $property.Value.ToString()
                        if ($value.Length -gt 50) { $value.Substring(0, 50) + "..." } else { $value }
                    } else { "null" }
                    IsNull = $null -eq $property.Value
                }
                $fields += $field
            }
            
            return @{
                Success = $true
                ActualPluralForm = $tableName
                FieldCount = $fields.Count
                Fields = $fields | Sort-Object Name
            }
        }
        else {
            # No records but API worked - table is empty
            return @{
                Success = $true
                ActualPluralForm = $tableName
                FieldCount = 0
                Fields = @()
                Note = "Table is empty"
            }
        }
        }
        catch {
            # Try next plural form if this isn't the last one
            if ($tableName -eq $pluralsToTry[-1]) {
                # This was the last attempt, return error
                return @{
                    Success = $false
                    Error = $_.Exception.Message
                    TriedPlurals = $pluralsToTry
                    Fields = @()
                }
            }
            # Otherwise continue to next plural form
        }
    }
    
    # Should not reach here
    return @{
        Success = $false
        Error = "No plural forms to try"
        Fields = @()
    }
}

# Function to generate markdown documentation
function New-MarkdownDocumentation {
    param(
        [hashtable]$DiscoveredData
    )
    
    $markdown = @"
# Dataverse Environment Field Documentation

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Overview

This document provides comprehensive field-level documentation for all Dataverse environments and tables used in the GRNSW SPFx monorepo project.

## Table of Contents

"@
    
    foreach ($envName in $DiscoveredData.Keys) {
        $markdown += "- [$envName](#$(($envName -replace '\s+', '-').ToLower()))`n"
    }
    
    $markdown += "`n---`n`n"
    
    foreach ($envName in $DiscoveredData.Keys) {
        $env = $DiscoveredData[$envName]
        $markdown += @"
## $envName

**Environment URL:** $($env.Url)
**API Endpoint:** $($env.ApiEndpoint)
**Discovered:** $($env.DiscoveryTime)

"@
        
        if ($env.Tables.Count -eq 0) {
            $markdown += "> No tables configured for this environment.`n`n"
        }
        else {
            $markdown += "### Tables`n`n"
            
            foreach ($table in $env.Tables) {
                $markdown += @"
#### $($table.DisplayName)

**Logical Name (Singular):** $($table.Singular)
**Logical Name (Plural/API):** $($table.LogicalName)
**Field Count:** $($table.FieldCount)

"@
                
                if ($table.Error) {
                    $markdown += "> ⚠️ **Error:** $($table.Error)`n`n"
                }
                elseif ($table.Fields.Count -gt 0) {
                    $markdown += @"
| Field Name | Type | Sample Value | Nullable | Description |
|------------|------|--------------|----------|-------------|
"@
                    foreach ($field in $table.Fields) {
                        $fieldName = $field.Name -replace '\|', '\|'
                        $sampleValue = $field.SampleValue -replace '\|', '\|'
                        $nullable = if ($field.IsNull) { "Yes" } else { "No" }
                        $description = Get-FieldDescription -FieldName $field.Name
                        $markdown += "| $fieldName | $($field.Type) | $sampleValue | $nullable | $description |`n"
                    }
                    $markdown += "`n"
                }
                else {
                    $markdown += "> No fields discovered.`n`n"
                }
            }
        }
        
        $markdown += "---`n`n"
    }
    
    return $markdown
}

# Function to get field description based on common patterns
function Get-FieldDescription {
    param([string]$FieldName)
    
    $descriptions = @{
        "id$" = "Unique identifier"
        "name$" = "Display name"
        "created" = "Creation timestamp"
        "modified" = "Last modification timestamp"
        "_value$" = "Foreign key reference"
        "state" = "Record state"
        "status" = "Record status"
        "version" = "Version number"
        "^cr[0-9a-z]+_" = "Custom field"
        "@odata" = "OData metadata"
    }
    
    foreach ($pattern in $descriptions.Keys) {
        if ($FieldName -match $pattern) {
            return $descriptions[$pattern]
        }
    }
    
    return ""
}

# Main execution
function Start-Discovery {
    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host "  Dataverse Field Discovery Tool" -ForegroundColor Cyan
    Write-Host "======================================`n" -ForegroundColor Cyan
    
    # Create output directory if it doesn't exist
    if (-not (Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
        Write-Host "Created output directory: $OutputPath" -ForegroundColor Green
    }
    
    $allResults = @{}
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    
    foreach ($envName in $Environments.Keys) {
        Write-Host "`nProcessing: $envName" -ForegroundColor Yellow
        Write-Host "=" * 50
        
        $env = $Environments[$envName]
        $envResults = @{
            Url = $env.Url
            ApiEndpoint = $env.ApiEndpoint
            DiscoveryTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Tables = @()
        }
        
        # Get access token for this environment
        $token = Get-DataverseAccessToken -ResourceUrl $env.Url -TenantId $TenantId `
                                         -ClientId $ClientId -ClientSecret $ClientSecret `
                                         -Interactive $UseInteractiveAuth.IsPresent
        
        if (-not $token) {
            Write-Warning "Could not obtain access token for $envName. Skipping..."
            $envResults.Error = "Could not obtain access token"
            $allResults[$envName] = $envResults
            continue
        }
        
        Write-Host "✓ Access token obtained" -ForegroundColor Green
        
        foreach ($table in $env.Tables) {
            Write-Host "  Table: $($table.DisplayName)" -ForegroundColor Cyan
            
            # Get field information
            $fieldInfo = Get-TableFields -ApiEndpoint $env.ApiEndpoint `
                                        -TableConfig $table `
                                        -AccessToken $token
            
            $tableResult = @{
                DisplayName = $table.DisplayName
                LogicalName = $table.LogicalName
                Singular = $table.Singular
                FieldCount = $fieldInfo.FieldCount
                Fields = $fieldInfo.Fields
            }
            
            if ($fieldInfo.ActualPluralForm) {
                $tableResult.ActualPluralForm = $fieldInfo.ActualPluralForm
            }
            
            if (-not $fieldInfo.Success) {
                $tableResult.Error = $fieldInfo.Error
                if ($fieldInfo.TriedPlurals) {
                    $tableResult.TriedPlurals = $fieldInfo.TriedPlurals
                    Write-Host "    ✗ Error: $($fieldInfo.Error)" -ForegroundColor Red
                    Write-Host "      Tried: $($fieldInfo.TriedPlurals -join ', ')" -ForegroundColor Yellow
                }
                else {
                    Write-Host "    ✗ Error: $($fieldInfo.Error)" -ForegroundColor Red
                }
            }
            else {
                if ($fieldInfo.ActualPluralForm -and $fieldInfo.ActualPluralForm -ne $table.LogicalName) {
                    Write-Host "    ✓ Discovered $($fieldInfo.FieldCount) fields (actual plural: $($fieldInfo.ActualPluralForm))" -ForegroundColor Green
                }
                else {
                    Write-Host "    ✓ Discovered $($fieldInfo.FieldCount) fields" -ForegroundColor Green
                }
            }
            
            $envResults.Tables += $tableResult
        }
        
        $allResults[$envName] = $envResults
    }
    
    # Generate documentation
    Write-Host "`nGenerating documentation..." -ForegroundColor Cyan
    
    $markdown = New-MarkdownDocumentation -DiscoveredData $allResults
    $mdFile = Join-Path $OutputPath "dataverse-fields-$timestamp.md"
    $markdown | Out-File -FilePath $mdFile -Encoding UTF8
    Write-Host "✓ Markdown documentation: $mdFile" -ForegroundColor Green
    
    # Save as latest
    $latestMdFile = Join-Path $OutputPath "dataverse-fields-latest.md"
    $markdown | Out-File -FilePath $latestMdFile -Encoding UTF8
    Write-Host "✓ Latest documentation: $latestMdFile" -ForegroundColor Green
    
    # Save JSON format
    $jsonFile = Join-Path $OutputPath "dataverse-fields-$timestamp.json"
    $allResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonFile -Encoding UTF8
    Write-Host "✓ JSON data: $jsonFile" -ForegroundColor Green
    
    $latestJsonFile = Join-Path $OutputPath "dataverse-fields-latest.json"
    $allResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $latestJsonFile -Encoding UTF8
    Write-Host "✓ Latest JSON: $latestJsonFile" -ForegroundColor Green
    
    Write-Host "`n======================================" -ForegroundColor Green
    Write-Host "  Discovery Complete!" -ForegroundColor Green
    Write-Host "======================================`n" -ForegroundColor Green
    
    return $allResults
}

# Run the discovery
Start-Discovery