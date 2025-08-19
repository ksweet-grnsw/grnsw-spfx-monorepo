# Dataverse Environments Documentation

## Overview

This document provides comprehensive documentation of all Microsoft Dataverse environments used in the GRNSW SPFx monorepo project. Each environment contains specific tables with custom fields for different business domains.

## Quick Reference

| Environment | Purpose | URL | Package |
|------------|---------|-----|---------|
| Racing Data | Race meetings, races, contestants | racingdata.crm6.dynamics.com | race-management |
| Weather Data | Weather station data | org98489e5d.crm6.dynamics.com | track-conditions-spfx |
| Injury Data | Health and injury tracking | orgfc8a11f1.crm6.dynamics.com | greyhound-health |
| GAP | Greyhound Adoption Program | orgda56a300.crm6.dynamics.com | gap-spfx |

---

## Environment Details

### 1. Racing Data Environment

**Purpose:** Manages race meetings, individual races, and contestant information

**Connection Details:**
- **Environment URL:** https://racingdata.crm6.dynamics.com
- **API Endpoint:** https://racingdata.crm6.dynamics.com/api/data/v9.1
- **Authentication:** Azure AD
- **API Version:** v9.1

**Tables:**

#### Meeting Table (cr4cc_racemeetings)
- **Singular Name:** cr4cc_racemeeting
- **Plural Name (API):** cr4cc_racemeetings
- **Purpose:** Store race meeting information
- **Key Fields:**
  - `cr4cc_racemeetingid`: Unique identifier
  - `cr4cc_meetingdate`: Date and time of meeting
  - `cr4cc_trackname`: Track location
  - `cr4cc_authority`: Racing authority (NSW, VIC, etc.)
  - `cr4cc_timeslot`: Time slot (Morning/Afternoon/Evening)
  - `cr4cc_cancelled`: Cancellation status

#### Races Table (cr616_races) 
⚠️ **Note:** Dataverse pluralization is INCONSISTENT for this table!
- **Singular Name:** cr616_races
- **Plural Name (API):** cr616_races (no additional pluralization!)
- **Alternative API Name:** cr616_raceses (may exist in some environments)
- **Purpose:** Individual race details within meetings
- **Key Fields:**
  - `cr616_racesid`: Unique identifier (NOT raceid)
  - `cr616_racenumber`: Race sequence number
  - `cr616_distance`: Race distance in meters
  - `cr616_racegrading`: Race grade
  - `_cr616_meeting_value`: Foreign key to Meeting

#### Contestants Table (cr616_contestants)
⚠️ **Note:** Dataverse pluralization behavior varies!
- **Singular Name:** cr616_contestants
- **Plural Name (API):** cr616_contestants OR cr616_contestantses (test both!)
- **Purpose:** Greyhound contestant information
- **Key Fields:**
  - `cr616_contestantsid`: Unique identifier (NOT contestantid)
  - `cr616_rugnumber`: Box number (1-8)
  - `cr616_greyhoundname`: Greyhound's name
  - `cr616_placement`: Final position
  - `_cr616_race_value`: Foreign key to Race

---

### 2. Weather Data Production Environment

**Purpose:** Real-time weather data from IoT stations at all tracks

**Connection Details:**
- **Environment URL:** https://org98489e5d.crm6.dynamics.com
- **API Endpoint:** https://org98489e5d.crm6.dynamics.com/api/data/v9.1
- **Authentication:** Azure AD
- **API Version:** v9.1

**Tables:**

#### Weather Data Table (cr4cc_weatherdatas)
- **Singular Name:** cr4cc_weatherdata
- **Plural Name (API):** cr4cc_weatherdatas
- **Purpose:** Weather station telemetry data
- **Data Points:** 180+ fields including temperature, rainfall, wind, humidity, solar radiation
- **Key Fields:**
  - `cr8e9_weatherdataid`: Unique identifier
  - `cr8e9_timestamp`: Unix timestamp (seconds)
  - `cr8e9_trackname`: Track location
  - `cr8e9_temperature`: Current temperature
  - `cr8e9_rainfall`: Rainfall amount
  - `cr8e9_windspeed`: Wind speed
  - `cr8e9_winddirection`: Wind direction in degrees

---

### 3. Injury Data Environment

**Purpose:** Greyhound health, injury tracking, and health check records

**Connection Details:**
- **Environment URL:** https://orgfc8a11f1.crm6.dynamics.com
- **API Endpoint:** https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1
- **Authentication:** Azure AD
- **API Version:** v9.1

**Tables:**

#### Injury Data Table (cra5e_injurydatas)
- **Singular Name:** cra5e_injurydata
- **Plural Name (API):** cra5e_injurydatas
- **Purpose:** Track injuries and incidents

#### Injuries Table (cr4cc_injuries)
- **Singular Name:** cr4cc_injury
- **Plural Name (API):** cr4cc_injuries
- **Purpose:** Legacy injury tracking (being phased out)

#### Greyhound Table (cra5e_greyhounds)
- **Singular Name:** cra5e_greyhound
- **Plural Name (API):** cra5e_greyhounds
- **Purpose:** Greyhound profiles and information
- **Status:** Recently added (2025)

#### Health Check Table (cra5e_heathchecks)
⚠️ **Note:** Table name is misspelled in the system (missing 'l' in health)
- **Singular Name:** cra5e_heathcheck
- **Plural Name (API):** cra5e_heathchecks
- **Purpose:** Regular health check records
- **Status:** Recently added (2025)

---

### 4. GAP Environment (Greyhound Adoption Program)

**Purpose:** Manage greyhound adoption processes and records

**Connection Details:**
- **Environment URL:** https://orgda56a300.crm6.dynamics.com
- **API Endpoint:** https://orgda56a300.crm6.dynamics.com/api/data/v9.1
- **Authentication:** Azure AD
- **API Version:** v9.1

**Tables:**
| Display Name | Logical Name (Singular) | Logical Name (Plural) | Description |
|-------------|------------------------|---------------------|-------------|
| Hounds | cr0d3_hound | cr0d3_hounds | Primary greyhound records for adoption |
| Adoption Applications | cr4cc_adoptionapplication | cr4cc_adoptionapplications | Adoption application records |
| Adoptions | cr4cc_adoption | cr4cc_adoptions | Completed adoption records |
| Foster Carers | cr4cc_fostercarer | cr4cc_fostercarers | Foster carer information |
| Behavioral Assessments | cr4cc_behavioralassessment | cr4cc_behavioralassessments | Greyhound behavioral assessments |

---

## Field Discovery

To discover all fields in these environments, use the provided utility scripts:

### Using Node.js Script

```bash
# Install dependencies if needed
cd scripts
npm install

# Run interactive discovery
node run-field-discovery.js

# Or run directly with a token
node dataverse-field-discovery.js
```

### Using PowerShell Script

```powershell
# With interactive authentication (Azure CLI)
.\scripts\Dataverse-FieldDiscovery.ps1 -UseInteractiveAuth

# With service principal
.\scripts\Dataverse-FieldDiscovery.ps1 -ClientId "your-client-id" -ClientSecret "your-secret"

# Generate template only (no auth)
.\scripts\Dataverse-FieldDiscovery.ps1
```

### Output Files

The scripts generate:
- `docs/dataverse/dataverse-fields-latest.md` - Latest field documentation
- `docs/dataverse/dataverse-fields-latest.json` - Latest field data in JSON
- `docs/dataverse/dataverse-fields-[timestamp].md` - Timestamped documentation
- `docs/dataverse/dataverse-fields-[timestamp].json` - Timestamped JSON data

---

## Common Field Prefixes

Understanding field naming conventions:

| Prefix | Meaning | Example |
|--------|---------|---------|
| cr4cc_ | Custom Racing fields | cr4cc_racemeeting |
| cr616_ | Custom Race/Contestant fields | cr616_races |
| cr8e9_ | Custom Weather fields | cr8e9_temperature |
| cra5e_ | Custom Health/Injury fields | cra5e_injurydata |
| _ | Foreign key reference | _cr616_meeting_value |
| @odata | OData metadata | @odata.etag |

---

## API Query Examples

### Get all meetings for a track
```
GET /api/data/v9.1/cr4cc_racemeetings?$filter=cr4cc_trackname eq 'Wentworth Park'
```

### Get races for a meeting
```
GET /api/data/v9.1/cr616_races?$filter=_cr616_meeting_value eq '{meeting-id}'
```

### Get latest weather data
```
GET /api/data/v9.1/cr4cc_weatherdatas?$top=1&$orderby=cr8e9_timestamp desc
```

### Get greyhound health checks
```
GET /api/data/v9.1/cra5e_heathchecks?$filter=_cra5e_greyhound_value eq '{greyhound-id}'
```

---

## Authentication Requirements

All environments require Azure AD authentication with appropriate permissions:

1. **Application Registration:** Required in Azure AD
2. **API Permissions:** Dynamics CRM user_impersonation
3. **Token Scope:** `{environment-url}/.default`
4. **Token Type:** Bearer token in Authorization header

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check token validity
   - Verify API permissions in Azure AD
   - Ensure correct environment URL

2. **404 Not Found**
   - Verify table plural name (some use double plural!)
   - Check field names are correct
   - Ensure entity exists in environment

3. **Empty Results**
   - Check filter syntax
   - Verify data exists
   - Check field permissions

### Debug Tips

- Use `$top=1` to test connectivity
- Add `Prefer: odata.include-annotations="*"` header for metadata
- Check `/api/data/v9.1/` root endpoint for available entities
- Use `$metadata` endpoint to explore schema

---

## Maintenance

### Adding New Tables

1. Update this documentation
2. Update CLAUDE.md with table details
3. Add to discovery scripts configuration
4. Test field discovery
5. Update relevant package services

### Version Updates

- Keep API version at v9.1 unless specifically required to change
- Document any breaking changes
- Update all package configurations simultaneously

---

## Contact & Support

For issues or questions about these environments:
- Check Azure Portal for environment health
- Review Power Platform Admin Center
- Contact system administrator for access issues