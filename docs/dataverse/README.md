# Dataverse Field Discovery Documentation

## Overview

This folder contains comprehensive documentation of all Dataverse environments and their tables used in the GRNSW SPFx monorepo project.

## Files

- **dataverse-fields-latest.md** - Latest field documentation (human-readable)
- **dataverse-fields-latest.json** - Latest field data in JSON format (for programmatic use)
- **dataverse-fields-[timestamp].md** - Historical snapshots of field documentation
- **dataverse-fields-[timestamp].json** - Historical snapshots in JSON format

## Discovery Scripts

Two scripts are available for discovering Dataverse fields:

### Node.js Script
```bash
npm run discover:fields
```

### PowerShell Script
```bash
npm run discover:fields:powershell
```

## Important Pluralization Notes

⚠️ **CRITICAL:** Dataverse has inconsistent pluralization behavior!

### Confirmed API Endpoints (as of August 2025)

| Table | Expected Plural | Actual API Endpoint | Notes |
|-------|----------------|-------------------|--------|
| Meeting | cr4cc_racemeetings | cr4cc_racemeetings | Standard pluralization |
| Races | cr616_raceses | **cr616_races** | NO extra plural! Already plural |
| Contestants | cr616_contestantses | cr616_contestants OR cr616_contestantses | Varies by environment |
| Weather Data | cr4cc_weatherdatas | cr4cc_weatherdatas | Standard 'data' → 'datas' |
| Injury Data | cra5e_injurydatas | cra5e_injurydatas | Standard 'data' → 'datas' |
| Injuries | cr4cc_injuries | cr4cc_injuries | Standard 'y' → 'ies' |
| Greyhound | cra5e_greyhounds | cra5e_greyhounds | Standard plural |
| Health Check | cra5e_heathchecks | cra5e_heathchecks | Standard plural (note: misspelled) |

### Why This Happens

1. **Tables created with singular names** get standard pluralization
2. **Tables created with plural names** (like "races") may NOT get additional pluralization
3. **Behavior is inconsistent** - always test both forms!

### How Discovery Scripts Handle This

The discovery scripts automatically:
1. Try the original table name first
2. Try alternative pluralization patterns
3. Report which form actually works
4. Save the working form as "actualPluralForm" in the output

## Running Discovery

### Without Authentication (Template Only)
Generates documentation structure without actual field data:
```bash
npm run discover:fields
# Select option 3
```

### With Azure AD Token
Discovers actual fields from the environments:
```bash
npm run discover:fields
# Select option 1 and paste your token
```

### With Azure CLI
Uses Azure CLI for authentication:
```bash
npm run discover:fields
# Select option 2 (requires az cli installed and logged in)
```

## Environment Summary

| Environment | URL | Tables | Status |
|------------|-----|--------|--------|
| Racing Data | racingdata.crm6.dynamics.com | 3 | Active |
| Weather Data | org98489e5d.crm6.dynamics.com | 1 | Active |
| Injury Data | orgfc8a11f1.crm6.dynamics.com | 4 | Active |
| GAP | org16bdb053.crm6.dynamics.com | 0 | Not configured |

## Getting Access Tokens

To get an access token for field discovery:

1. **Using Azure CLI:**
   ```bash
   az login
   az account get-access-token --resource https://[environment].crm6.dynamics.com
   ```

2. **Using Postman:**
   - Create OAuth 2.0 request
   - Use your Azure AD app registration
   - Set scope to `https://[environment].crm6.dynamics.com/.default`

3. **Using Service Principal:**
   - Configure in PowerShell script with ClientId and ClientSecret

## Troubleshooting

### "Table not found" errors
- Check both singular and plural forms
- Verify the entity exists in the environment
- Try the discovery script which tests multiple forms

### Empty field results
- Ensure the table has at least one record
- Check permissions on the entity
- Verify the access token is valid

### Inconsistent pluralization
- This is normal for Dataverse!
- Always use the discovery scripts to find the correct form
- Check the "actualPluralForm" field in the JSON output

## Contributing

When adding new tables:
1. Update the environment configuration in both scripts
2. Add multiple possible plural forms
3. Run discovery to confirm the correct endpoint
4. Update this README with findings

## Last Updated

- Documentation Generated: 2025-08-15
- Scripts Updated: 2025-08-15
- Pluralization Rules Verified: 2025-08-15

## Important Notes

- **cr616_races** stays as `cr616_races` (NOT cr616_raceses as previously thought)
- Always test API endpoints before hardcoding them
- Dataverse pluralization depends on how entities were originally created
- The discovery scripts handle these inconsistencies automatically