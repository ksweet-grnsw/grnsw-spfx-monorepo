# Dataverse Table Relationships Documentation

## Overview
This document describes the relationships between tables in Dataverse for tracking greyhound racing data, health checks, and injuries.

## Entity Relationship Diagram
```
Meeting (cr4cc_racemeetings)
    ↓ [1:Many]
Race (cr616_races)
    ↓ [1:Many]
Contestant (cr616_contestants)
    ↓ [Many:1]
Greyhound (cra5e_greyhounds)
    ↓ [1:Many]
Health Check (cra5e_heathchecks)
```

## Table Details

### 1. Greyhounds Table (`cra5e_greyhounds`)
**Primary Key:** `cra5e_greyhoundid` (GUID)
**Business Key:** `cra5e_sfid` (Salesforce ID)
**Microchip:** `cra5e_microchip` (Unique identifier)

Key Fields:
- `cra5e_name` - Greyhound name
- `cra5e_microchip` - Primary microchip number
- `cra5e_microchip2` - Secondary microchip (if any)
- `cra5e_trainername` - Current trainer
- `cra5e_ownername` - Current owner
- `cra5e_status` - Current status (Active, Retired, etc.)

### 2. Health Checks Table (`cra5e_heathchecks`)
**Primary Key:** `cra5e_healthcheckid` (GUID)
**Business Key:** `cra5e_sfid` (Salesforce Health Check ID)
**Foreign Key:** `cra5e_greyhound` → `cra5e_greyhounds.cra5e_greyhoundid`

Key Fields for Injuries:
- `cra5e_injurydate` - Date of injury
- `cra5e_injurytype` - Type of injury
- `cra5e_injurylocation` - Body part affected
- `cra5e_injuryseverity` - Severity level
- `cra5e_injurydescription` - Detailed description
- `cra5e_trackname` - Track where injury occurred
- `cra5e_racenumber` - Race number (if during race)
- `cra5e_meetingdate` - Date of meeting

### 3. Meetings Table (`cr4cc_racemeetings`)
**Primary Key:** `cr4cc_racemeetingid` (GUID)
**Business Key:** `cr4cc_salesforceid` (Salesforce Meeting ID)

Key Fields:
- `cr4cc_meetingname` - Meeting name
- `cr4cc_meetingdate` - Date/time of meeting
- `cr4cc_trackname` - Track location (e.g., "Wentworth Park")

### 4. Races Table (`cr616_races`)
**Primary Key:** `cr616_raceid` (GUID)
**Business Key:** `cr616_sfraceid` (Salesforce Race ID)
**Foreign Key:** `_cr616_meeting_value` → `cr4cc_racemeetings.cr4cc_racemeetingid`

Key Fields:
- `cr616_racenumber` - Race number (1-12 typically)
- `cr616_racename` - Race name
- `cr616_racedate` - Race date
- `cr616_starttime` - Scheduled start time
- `cr616_distance` - Race distance in meters
- `cr616_racegrading` - Grade/class of race

### 5. Contestants Table (`cr616_contestants`)
**Primary Key:** `cr616_contestantid` (GUID)
**Business Key:** `cr616_sfcontestantid` (Salesforce Contestant ID)
**Foreign Keys:**
- `_cr616_race_value` → `cr616_races.cr616_raceid`
- `_cr616_meeting_value` → `cr4cc_racemeetings.cr4cc_racemeetingid`
- `_cr616_greyhound_value` → `cra5e_greyhounds.cra5e_greyhoundid` (if linked)

Key Fields:
- `cr616_rugnumber` - Box number (1-8)
- `cr616_greyhoundname` - Name of greyhound (text field)
- `cr616_placement` - Final position
- `cr616_finishtime` - Finish time
- `cr616_status` - Race status (Finished, Scratched, etc.)

## Critical Relationship Mappings

### Finding Injured Dogs in Races

#### Method 1: Direct Greyhound ID Link (if available)
```sql
-- Find all race performances for injured greyhounds
SELECT 
    hc.cra5e_injurydate,
    hc.cra5e_injurytype,
    g.cra5e_name as GreyhoundName,
    g.cra5e_microchip,
    c.cr616_rugnumber as BoxNumber,
    c.cr616_placement as FinishPosition,
    r.cr616_racenumber,
    r.cr616_racedate,
    m.cr4cc_meetingname,
    m.cr4cc_trackname
FROM cra5e_heathchecks hc
INNER JOIN cra5e_greyhounds g ON hc.cra5e_greyhound = g.cra5e_greyhoundid
LEFT JOIN cr616_contestants c ON c._cr616_greyhound_value = g.cra5e_greyhoundid
LEFT JOIN cr616_races r ON c._cr616_race_value = r.cr616_raceid
LEFT JOIN cr4cc_racemeetings m ON r._cr616_meeting_value = m.cr4cc_racemeetingid
WHERE hc.cra5e_injurydate IS NOT NULL
```

#### Method 2: Name and Date Matching (fallback)
```sql
-- Match by greyhound name and race date when direct ID link not available
SELECT 
    hc.cra5e_injurydate,
    hc.cra5e_injurytype,
    hc.cra5e_trackname as InjuryTrack,
    g.cra5e_name as GreyhoundName,
    c.cr616_greyhoundname as ContestantName,
    c.cr616_placement,
    r.cr616_racenumber,
    m.cr4cc_meetingdate,
    m.cr4cc_trackname
FROM cra5e_heathchecks hc
INNER JOIN cra5e_greyhounds g ON hc.cra5e_greyhound = g.cra5e_greyhoundid
INNER JOIN cr616_contestants c ON LOWER(c.cr616_greyhoundname) = LOWER(g.cra5e_name)
INNER JOIN cr616_races r ON c._cr616_race_value = r.cr616_raceid
INNER JOIN cr4cc_racemeetings m ON r._cr616_meeting_value = m.cr4cc_racemeetingid
WHERE hc.cra5e_injurydate IS NOT NULL
  AND CAST(m.cr4cc_meetingdate AS DATE) = CAST(hc.cra5e_injurydate AS DATE)
  AND m.cr4cc_trackname = hc.cra5e_trackname
```

## Important Notes on Data Quality

### Greyhound Identification Challenges
1. **Contestant Greyhound Link**: The `_cr616_greyhound_value` field in Contestants may not always be populated
2. **Name Matching**: Use `cr616_greyhoundname` (text) to match with `cra5e_name` when ID link is missing
3. **Microchip Matching**: Can use microchip numbers as alternate matching method

### Date/Time Matching
1. **Injury Date**: Health checks store `cra5e_injurydate` 
2. **Meeting Date**: Meetings store `cr4cc_meetingdate`
3. **Race Date**: Races may have `cr616_racedate` separate from meeting date
4. **Time Zone**: Ensure consistent timezone handling (typically AEST/AEDT)

### Track Name Consistency
1. **Standardization**: Track names should be standardized (e.g., "Wentworth Park" vs "WENTWORTH PARK")
2. **Health Check Track**: `cra5e_trackname` in health checks
3. **Meeting Track**: `cr4cc_trackname` in meetings

## Recommended Query Strategy

### Step 1: Get Injured Greyhounds
```sql
SELECT DISTINCT
    g.cra5e_greyhoundid,
    g.cra5e_name,
    g.cra5e_microchip,
    hc.cra5e_injurydate,
    hc.cra5e_injurytype,
    hc.cra5e_trackname,
    hc.cra5e_racenumber
FROM cra5e_heathchecks hc
INNER JOIN cra5e_greyhounds g ON hc.cra5e_greyhound = g.cra5e_greyhoundid
WHERE hc.cra5e_injurydate >= '2024-01-01'  -- Recent injuries
  AND hc.cra5e_injurytype IS NOT NULL
```

### Step 2: Find Their Race Performances
```sql
-- For each injured greyhound, find races on injury date
SELECT 
    c.*,
    r.cr616_racenumber,
    r.cr616_starttime,
    m.cr4cc_meetingname,
    m.cr4cc_trackname
FROM cr616_contestants c
INNER JOIN cr616_races r ON c._cr616_race_value = r.cr616_raceid
INNER JOIN cr4cc_racemeetings m ON r._cr616_meeting_value = m.cr4cc_racemeetingid
WHERE 
    -- Match by name
    LOWER(c.cr616_greyhoundname) = LOWER(@GreyhoundName)
    -- Match by date
    AND CAST(m.cr4cc_meetingdate AS DATE) = CAST(@InjuryDate AS DATE)
    -- Match by track if available
    AND (@TrackName IS NULL OR m.cr4cc_trackname = @TrackName)
    -- Match by race number if available
    AND (@RaceNumber IS NULL OR r.cr616_racenumber = @RaceNumber)
```

## Data Integrity Checks

### Verify Relationships
```sql
-- Check how many contestants have proper greyhound links
SELECT 
    COUNT(*) as TotalContestants,
    COUNT(_cr616_greyhound_value) as WithGreyhoundLink,
    COUNT(*) - COUNT(_cr616_greyhound_value) as MissingGreyhoundLink
FROM cr616_contestants;

-- Check health checks with greyhound links
SELECT 
    COUNT(*) as TotalHealthChecks,
    COUNT(cra5e_greyhound) as WithGreyhoundLink,
    COUNT(*) - COUNT(cra5e_greyhound) as Orphaned
FROM cra5e_heathchecks;
```

## Best Practices for Reliable Connections

1. **Always Use Multiple Match Criteria**
   - Primary: Direct ID relationships
   - Secondary: Name + Date matching
   - Tertiary: Microchip matching

2. **Handle Name Variations**
   - Use LOWER() for case-insensitive matching
   - Consider SOUNDEX or fuzzy matching for slight variations
   - Strip special characters if needed

3. **Date Range Matching**
   - Injuries might be recorded day after race
   - Use date range ±1 day for safety

4. **Track Name Normalization**
   - Create lookup table for track name variations
   - Standardize before matching

5. **Performance Optimization**
   - Index foreign key columns
   - Index commonly searched fields (name, date, microchip)
   - Use filtered indexes for active records only

## Sample Implementation Code

```javascript
// Find injured contestants
async function findInjuredContestants(injuryDate, trackName) {
    // Step 1: Get injuries on that date
    const injuries = await dataverse.query(`
        SELECT 
            hc.cra5e_healthcheckid,
            hc.cra5e_injurytype,
            g.cra5e_greyhoundid,
            g.cra5e_name,
            g.cra5e_microchip
        FROM cra5e_heathchecks hc
        INNER JOIN cra5e_greyhounds g ON hc.cra5e_greyhound = g.cra5e_greyhoundid
        WHERE CAST(hc.cra5e_injurydate AS DATE) = '${injuryDate}'
          AND hc.cra5e_trackname = '${trackName}'
    `);
    
    // Step 2: Find their race performances
    const performances = [];
    for (const injury of injuries) {
        const contestant = await dataverse.query(`
            SELECT c.*, r.cr616_racenumber, m.cr4cc_meetingname
            FROM cr616_contestants c
            INNER JOIN cr616_races r ON c._cr616_race_value = r.cr616_raceid
            INNER JOIN cr4cc_racemeetings m ON r._cr616_meeting_value = m.cr4cc_racemeetingid
            WHERE LOWER(c.cr616_greyhoundname) = LOWER('${injury.cra5e_name}')
              AND CAST(m.cr4cc_meetingdate AS DATE) = '${injuryDate}'
              AND m.cr4cc_trackname = '${trackName}'
        `);
        
        if (contestant) {
            performances.push({
                injury: injury,
                performance: contestant
            });
        }
    }
    
    return performances;
}
```

## Testing Queries

### Test Case 1: Known Injury
```sql
-- Find a specific injured greyhound's race
SELECT TOP 1
    hc.cra5e_injurydate,
    g.cra5e_name,
    c.cr616_placement,
    r.cr616_racenumber,
    m.cr4cc_trackname
FROM cra5e_heathchecks hc
INNER JOIN cra5e_greyhounds g ON hc.cra5e_greyhound = g.cra5e_greyhoundid
LEFT JOIN cr616_contestants c ON LOWER(c.cr616_greyhoundname) = LOWER(g.cra5e_name)
LEFT JOIN cr616_races r ON c._cr616_race_value = r.cr616_raceid  
LEFT JOIN cr4cc_racemeetings m ON r._cr616_meeting_value = m.cr4cc_racemeetingid
WHERE hc.cra5e_injurytype IS NOT NULL
  AND c.cr616_contestantid IS NOT NULL;
```

## Summary
The key to reliably connecting injury data to race performances is:
1. Use the greyhound as the central linking entity
2. Match on multiple criteria (ID, name, date, track)
3. Handle data quality issues (missing links, name variations)
4. Verify relationships with test queries before production use