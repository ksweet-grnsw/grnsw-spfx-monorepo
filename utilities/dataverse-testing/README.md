# Dataverse Testing Utilities

This folder contains utility scripts for testing and discovering Dataverse API endpoints and entity configurations.

## Scripts

### test-dataverse-api.js

A comprehensive test script that discovers the correct table names and field names in your Dataverse environment.

#### Features
- Tests multiple table name variations (singular, plural, with/without prefixes)
- Discovers field names for working tables
- Identifies track-related and name-related fields
- Tests metadata endpoint for entity definitions
- Works with or without authentication
- Provides colored console output for easy reading

#### Usage

**Basic usage (anonymous):**
```bash
node utilities/dataverse-testing/test-dataverse-api.js
```

**With Azure CLI authentication (recommended):**
```bash
# First, login to Azure
az login

# Set your subscription
az account set --subscription YOUR_SUBSCRIPTION_ID

# Run the test
node utilities/dataverse-testing/test-dataverse-api.js
```

#### What it tests

The script tests these table name variations:

**Meetings:**
- cr4cc_racemeetings (plural with race prefix)
- cr4cc_racemeeting (singular with race prefix)
- cr4cc_meetings (plural without race)
- cr4cc_meeting (singular without race)

**Races:**
- cr616_races (plural)
- cr616_race (singular)
- cr616_raceses (double plural - unlikely but tested)
- cr4cc_races (with cr4cc prefix)
- cr4cc_race (with cr4cc prefix)

**Contestants:**
- cr616_contestants (plural)
- cr616_contestant (singular)
- cr616_contestantses (double plural)
- cr4cc_contestants (with cr4cc prefix)
- cr4cc_contestant (with cr4cc prefix)

#### Output

The script provides:
1. **Immediate feedback** for each table tested (✅ success or ❌ failure)
2. **Field listings** for working tables
3. **Highlighted track and name fields** to identify important columns
4. **Summary** of all working tables
5. **Recommendations** for which table names to use in your code

#### Example Output
```
🔍 Dataverse API Discovery Test
================================

Environment: https://racingdata.crm6.dynamics.com
API Version: v9.1

Getting Azure AD token...
✓ Successfully obtained access token

Testing Table Name Variations
==============================================

✅ SUCCESS: Meetings (plural with race prefix)
   Table: cr4cc_racemeetings
   Fields found: 25
     - cr4cc_racemeetingid
     - cr4cc_meetingdate
     - cr4cc_trackname
     ... and 22 more fields
   📍 Track-related fields:
     - cr4cc_trackname

❌ FAILED: Races with cr616 (plural)
   Status: 404 Not Found
   Table does not exist with name: cr616_races

... more tests ...

==============================================
📊 SUMMARY
==============================================

✅ Working MEETINGS tables:
   - cr4cc_racemeetings
     Track field: cr4cc_trackname

📝 RECOMMENDATIONS:
Use these working table names in your API calls:
   Meetings: cr4cc_racemeetings
```

## Adding New Test Scripts

When adding new test scripts to this folder:
1. Include comprehensive documentation in the script
2. Add usage examples to this README
3. Use colored output for better readability
4. Handle both authenticated and anonymous scenarios
5. Provide clear error messages and recommendations

## Environment URLs

Current environments:
- **Racing Data:** https://racingdata.crm6.dynamics.com
- **Weather Data:** https://org98489e5d.crm6.dynamics.com
- **Injury Data:** https://orgfc8a11f1.crm6.dynamics.com
- **GAP:** https://org16bdb053.crm6.dynamics.com

To test a different environment, modify the `DATAVERSE_URL` constant in the script.