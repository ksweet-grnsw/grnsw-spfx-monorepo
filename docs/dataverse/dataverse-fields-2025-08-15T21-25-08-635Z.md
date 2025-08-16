# Dataverse Environment Documentation

Generated: 2025-08-15T21:25:08.633Z

## Table of Contents

- [Racing Data](#racing-data)
- [Weather Data Production](#weather-data-production)
- [Injury Data](#injury-data)
- [GAP (Greyhound Adoption Program)](#gap-(greyhound-adoption-program))

---

## Racing Data

**URL:** https://racingdata.crm6.dynamics.com

**API Endpoint:** https://racingdata.crm6.dynamics.com/api/data/v9.1

### Tables

#### Meeting (cr4cc_racemeetings)

**Total Fields:** 50

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _createdby_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _owningbusinessunit_value | string | 30baa0d5-6b70-f011-b4cc-002248970bd2 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | racingdata | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| @odata.etag | string | W/"3399930" | No |
| cr4cc_authority | string | NSW | No |
| cr4cc_cancelled | boolean | false | No |
| cr4cc_cancelled@OData.Community.Display.V1.FormattedValue | string | No | No |
| cr4cc_lastmodified | object | null | Yes |
| cr4cc_meetingdate | string | 2024-07-04T00:00:00Z | No |
| cr4cc_meetingdate@OData.Community.Display.V1.FormattedValue | string | 7/4/2024 10:00 AM | No |
| cr4cc_meetingname | string | M-0000016607 | No |
| cr4cc_racemeetingid | string | 9ee39cc8-3b78-f011-b4cc-000d3a6aa64c | No |
| cr4cc_salesforceid | string | aALId00000000g7OAA | No |
| cr4cc_timeslot | string | Night | No |
| cr4cc_trackname | string | Wentworth | No |
| cr4cc_type | object | null | Yes |
| cr616_stewardcomment | string | Trainer Mr Neil Staines has provided evidence as d | No |
| cr616_trackcondition | string | Good | No |
| cr616_weather | string | Overcast | No |
| createdon | string | 2025-08-13T11:51:02Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/13/2025 9:51 PM | No |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-13T11:51:02Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/13/2025 9:51 PM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | number | 0 | No |
| timezoneruleversionnumber@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 3399930 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 3,399,930 | No |

#### Races (cr616_races)

**Total Fields:** 84

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _cr616_meeting_value | string | 5aa1a9b5-3978-f011-b4cc-000d3ad1741b | No |
| _cr616_meeting_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | cr616_meeting | No |
| _cr616_meeting_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | cr4cc_racemeeting | No |
| _cr616_meeting_value@OData.Community.Display.V1.FormattedValue | string | aALId00000000e2OAA | No |
| _createdby_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _owningbusinessunit_value | string | 30baa0d5-6b70-f011-b4cc-002248970bd2 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | racingdata | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _transactioncurrencyid_value | string | 15cc91a2-a070-f011-b4cc-002248970bd2 | No |
| _transactioncurrencyid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | transactioncurrencyid | No |
| _transactioncurrencyid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | transactioncurrency | No |
| _transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue | string | Australian Dollar | No |
| @odata.etag | string | W/"3397947" | No |
| cr616_createddate | object | null | Yes |
| cr616_distance | number | 440 | No |
| cr616_distance@OData.Community.Display.V1.FormattedValue | string | 440 | No |
| cr616_firstsectionaltime | number | 5.84 | No |
| cr616_firstsectionaltime@OData.Community.Display.V1.FormattedValue | string | 5.84 | No |
| cr616_numberofcontestants | number | 8 | No |
| cr616_numberofcontestants@OData.Community.Display.V1.FormattedValue | string | 8 | No |
| cr616_prize1 | number | 600 | No |
| cr616_prize1_base | number | 600 | No |
| cr616_prize1_base@OData.Community.Display.V1.FormattedValue | string | $600.00 | No |
| cr616_prize1@OData.Community.Display.V1.FormattedValue | string | $600.00 | No |
| cr616_prize2 | number | 170 | No |
| cr616_prize2_base | number | 170 | No |
| cr616_prize2_base@OData.Community.Display.V1.FormattedValue | string | $170.00 | No |
| cr616_prize2@OData.Community.Display.V1.FormattedValue | string | $170.00 | No |
| cr616_prize3 | number | 100 | No |
| cr616_prize3_base | number | 100 | No |
| cr616_prize3_base@OData.Community.Display.V1.FormattedValue | string | $100.00 | No |
| cr616_prize3@OData.Community.Display.V1.FormattedValue | string | $100.00 | No |
| cr616_prize4 | number | 75 | No |
| cr616_prize4_base | number | 75 | No |
| cr616_prize4_base@OData.Community.Display.V1.FormattedValue | string | $75.00 | No |
| cr616_prize4@OData.Community.Display.V1.FormattedValue | string | $75.00 | No |
| cr616_racedate | string | 2024-07-01T00:00:00Z | No |
| cr616_racedate@OData.Community.Display.V1.FormattedValue | string | 7/1/2024 10:00 AM | No |
| cr616_racegrading | string | Maiden | No |
| cr616_racename | string | (1) - WOW AT STUD MAIDEN | No |
| cr616_racenumber | number | 1 | No |
| cr616_racenumber@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr616_racesectionaloverview | string | 14.032 [5.84] [11.57] | No |
| cr616_racesid | string | 73ca86b8-3978-f011-b4cc-000d3a6aa64c | No |
| cr616_racetitle | string | WOW AT STUD MAIDEN | No |
| cr616_secondsectiontime | number | 11.57 | No |
| cr616_secondsectiontime@OData.Community.Display.V1.FormattedValue | string | 11.57 | No |
| cr616_sfraceid | string | aANId00000002GcOAI | No |
| cr616_starttime | string | 00:37 PM | No |
| cr616_status | string | Results Approved | No |
| cr616_stewardracecomment | object | null | Yes |
| cr616_trackheld | string | Goulburn | No |
| createdon | string | 2025-08-13T11:36:16Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/13/2025 9:36 PM | No |
| exchangerate | number | 1 | No |
| exchangerate@OData.Community.Display.V1.FormattedValue | string | 1.000000000000 | No |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-13T11:36:16Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/13/2025 9:36 PM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | number | 0 | No |
| timezoneruleversionnumber@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 3397947 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 3,397,947 | No |

#### Contestants (cr616_contestants)

**Total Fields:** 78

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _cr616_meeting_value | string | 5aa1a9b5-3978-f011-b4cc-000d3ad1741b | No |
| _cr616_meeting_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | cr616_Meeting | No |
| _cr616_meeting_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | cr4cc_racemeeting | No |
| _cr616_meeting_value@OData.Community.Display.V1.FormattedValue | string | aALId00000000e2OAA | No |
| _cr616_race_value | string | 74ca86b8-3978-f011-b4cc-000d3a6aa64c | No |
| _cr616_race_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | cr616_Race | No |
| _cr616_race_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | cr616_races | No |
| _cr616_race_value@OData.Community.Display.V1.FormattedValue | string | aANId00000002GdOAI | No |
| _createdby_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _owningbusinessunit_value | string | 30baa0d5-6b70-f011-b4cc-002248970bd2 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | racingdata | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | 2ac1a0d5-6b70-f011-b4cc-002248970bd2 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _transactioncurrencyid_value | object | null | Yes |
| @odata.etag | string | W/"3397966" | No |
| cr616_contestantsid | string | 75ca86b8-3978-f011-b4cc-000d3a6aa64c | No |
| cr616_dayssincelastrace | number | 419 | No |
| cr616_dayssincelastrace@OData.Community.Display.V1.FormattedValue | string | 419 | No |
| cr616_doggrade | string | Maiden | No |
| cr616_failedtofinish | boolean | false | No |
| cr616_failedtofinish@OData.Community.Display.V1.FormattedValue | string | No | No |
| cr616_finishtime | number | 0 | No |
| cr616_finishtime@OData.Community.Display.V1.FormattedValue | string | 0.00 | No |
| cr616_greyhoundname | string | Always Brave | No |
| cr616_leftearbrand | string | NLDVR | No |
| cr616_margin | number | 3.25 | No |
| cr616_margin@OData.Community.Display.V1.FormattedValue | string | 3.25 | No |
| cr616_meetingdate | string | 2024-07-01T00:00:00Z | No |
| cr616_meetingdate@OData.Community.Display.V1.FormattedValue | string | 7/1/2024 10:00 AM | No |
| cr616_ownername | string | David Smith | No |
| cr616_placement | number | 5 | No |
| cr616_placement@OData.Community.Display.V1.FormattedValue | string | 5 | No |
| cr616_prizemoney | object | null | Yes |
| cr616_prizemoney_base | object | null | Yes |
| cr616_racenumber | number | 2 | No |
| cr616_racenumber@OData.Community.Display.V1.FormattedValue | string | 2 | No |
| cr616_racewithin2days | boolean | false | No |
| cr616_racewithin2days@OData.Community.Display.V1.FormattedValue | string | No | No |
| cr616_rugnumber | number | 3 | No |
| cr616_rugnumber@OData.Community.Display.V1.FormattedValue | string | 3 | No |
| cr616_sfcontestantid | string | aAKId0000000HvSOAU | No |
| cr616_status | string | Runner | No |
| cr616_totalnumberofwinds | number | 0 | No |
| cr616_totalnumberofwinds@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr616_trackheld | string | Goulburn | No |
| cr616_trainername | string | David Smith | No |
| cr616_weight | number | 28.5 | No |
| cr616_weight@OData.Community.Display.V1.FormattedValue | string | 28.50 | No |
| createdon | string | 2025-08-13T11:36:23Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/13/2025 9:36 PM | No |
| exchangerate | object | null | Yes |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-13T11:36:23Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/13/2025 9:36 PM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | number | 0 | No |
| timezoneruleversionnumber@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 3397966 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 3,397,966 | No |

---

## Weather Data Production

**URL:** https://org98489e5d.crm6.dynamics.com

**API Endpoint:** https://org98489e5d.crm6.dynamics.com/api/data/v9.1

### Tables

#### Weather Data (cr4cc_weatherdatas)

**Total Fields:** 315

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _createdby_value | string | fd179684-9e5d-f011-bec2-0022481146c8 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | fd179684-9e5d-f011-bec2-0022481146c8 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | fd179684-9e5d-f011-bec2-0022481146c8 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _owningbusinessunit_value | string | 0b119684-9e5d-f011-bec2-0022481146c8 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | org98489e5d | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | fd179684-9e5d-f011-bec2-0022481146c8 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| @odata.etag | string | W/"2918393" | No |
| cr4cc_alert_level | object | null | Yes |
| cr4cc_app_uptime | number | 1411758 | No |
| cr4cc_app_uptime@OData.Community.Display.V1.FormattedValue | string | 1,411,758 | No |
| cr4cc_bar_absolute | object | null | Yes |
| cr4cc_bar_offset | object | null | Yes |
| cr4cc_bar_sea_level | object | null | Yes |
| cr4cc_bar_trend | object | null | Yes |
| cr4cc_battery_condition | number | 2 | No |
| cr4cc_battery_condition@OData.Community.Display.V1.FormattedValue | string | 2 | No |
| cr4cc_battery_current | number | -0.001 | No |
| cr4cc_battery_current@OData.Community.Display.V1.FormattedValue | string | -0.00100 | No |
| cr4cc_battery_cycle_count | number | 4 | No |
| cr4cc_battery_cycle_count@OData.Community.Display.V1.FormattedValue | string | 4 | No |
| cr4cc_battery_percent | number | 100 | No |
| cr4cc_battery_percent@OData.Community.Display.V1.FormattedValue | string | 100 | No |
| cr4cc_battery_status | number | 5 | No |
| cr4cc_battery_status_text | object | null | Yes |
| cr4cc_battery_status@OData.Community.Display.V1.FormattedValue | string | 5 | No |
| cr4cc_battery_temp | number | 25 | No |
| cr4cc_battery_temp@OData.Community.Display.V1.FormattedValue | string | 25 | No |
| cr4cc_battery_voltage | number | 4309 | No |
| cr4cc_battery_voltage@OData.Community.Display.V1.FormattedValue | string | 4,309 | No |
| cr4cc_bgn | object | null | Yes |
| cr4cc_bootloader_version | number | 131074 | No |
| cr4cc_bootloader_version@OData.Community.Display.V1.FormattedValue | string | 131,074 | No |
| cr4cc_cdd_day | number | 0 | No |
| cr4cc_cdd_day@OData.Community.Display.V1.FormattedValue | string | 0.00000 | No |
| cr4cc_charger_plugged | number | 1 | No |
| cr4cc_charger_plugged@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_clock_source | number | 2 | No |
| cr4cc_clock_source@OData.Community.Display.V1.FormattedValue | string | 2 | No |
| cr4cc_comfort_index | object | null | Yes |
| cr4cc_connection_uptime | number | 18861 | No |
| cr4cc_connection_uptime@OData.Community.Display.V1.FormattedValue | string | 18,861 | No |
| cr4cc_console_api_level | number | 28 | No |
| cr4cc_console_api_level@OData.Community.Display.V1.FormattedValue | string | 28 | No |
| cr4cc_console_os_version | string | 1.3.9 | No |
| cr4cc_console_radio_version | string | 10.3.12.106 | No |
| cr4cc_console_sw_version | string | 1.4.70 | No |
| cr4cc_crc_errors_day | number | 0 | No |
| cr4cc_crc_errors_day@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_created_by | object | null | Yes |
| cr4cc_data_age_minutes | object | null | Yes |
| cr4cc_data_quality_score | object | null | Yes |
| cr4cc_database_kilobytes | number | 38817 | No |
| cr4cc_database_kilobytes@OData.Community.Display.V1.FormattedValue | string | 38,817 | No |
| cr4cc_dew_point | number | 56.4 | No |
| cr4cc_dew_point_celsius | number | 0 | No |
| cr4cc_dew_point_celsius@OData.Community.Display.V1.FormattedValue | string | 0.00000 | No |
| cr4cc_dew_point_in | object | null | Yes |
| cr4cc_dew_point@OData.Community.Display.V1.FormattedValue | string | 56.40000 | No |
| cr4cc_display_summary | object | null | Yes |
| cr4cc_dns_type_used | object | null | Yes |
| cr4cc_et_day | number | 0 | No |
| cr4cc_et_day@OData.Community.Display.V1.FormattedValue | string | 0.00 | No |
| cr4cc_et_month | number | 0 | No |
| cr4cc_et_month@OData.Community.Display.V1.FormattedValue | string | 0.00 | No |
| cr4cc_et_year | number | 0 | No |
| cr4cc_et_year@OData.Community.Display.V1.FormattedValue | string | 0.00 | No |
| cr4cc_free_mem | number | 720580 | No |
| cr4cc_free_mem@OData.Community.Display.V1.FormattedValue | string | 720,580 | No |
| cr4cc_freq_error_current | number | 9 | No |
| cr4cc_freq_error_current@OData.Community.Display.V1.FormattedValue | string | 9 | No |
| cr4cc_freq_error_total | number | 149 | No |
| cr4cc_freq_error_total@OData.Community.Display.V1.FormattedValue | string | 149 | No |
| cr4cc_freq_index | number | 14 | No |
| cr4cc_freq_index@OData.Community.Display.V1.FormattedValue | string | 14 | No |
| cr4cc_gnss_sip_tx_id | number | 0 | No |
| cr4cc_gnss_sip_tx_id@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_hdd_day | number | 5.626 | No |
| cr4cc_hdd_day@OData.Community.Display.V1.FormattedValue | string | 5.62600 | No |
| cr4cc_health_version | number | 1 | No |
| cr4cc_health_version@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_heat_index | number | 60.3 | No |
| cr4cc_heat_index_celsius | number | 15.72222 | No |
| cr4cc_heat_index_celsius@OData.Community.Display.V1.FormattedValue | string | 15.72222 | No |
| cr4cc_heat_index_in | object | null | Yes |
| cr4cc_heat_index@OData.Community.Display.V1.FormattedValue | string | 60.30000 | No |
| cr4cc_hour_bucket | object | null | Yes |
| cr4cc_hum | number | 87.7 | No |
| cr4cc_hum_in | object | null | Yes |
| cr4cc_hum@OData.Community.Display.V1.FormattedValue | string | 87.7 | No |
| cr4cc_import_batch_id | object | null | Yes |
| cr4cc_internal_free_space | number | 2252165 | No |
| cr4cc_internal_free_space@OData.Community.Display.V1.FormattedValue | string | 2,252,165 | No |
| cr4cc_ip_address_type | object | null | Yes |
| cr4cc_ip_v4_address | string | 192.168.76.200 | No |
| cr4cc_ip_v4_gateway | string | 192.168.76.1 | No |
| cr4cc_ip_v4_netmask | string | 255.255.255.0 | No |
| cr4cc_is_current_reading | boolean | false | No |
| cr4cc_is_current_reading@OData.Community.Display.V1.FormattedValue | string | No | No |
| cr4cc_json_payload | object | null | Yes |
| cr4cc_last_packet_received_timestamp | number | 1754278197 | No |
| cr4cc_last_packet_received_timestamp@OData.Community.Display.V1.FormattedValue | string | 1,754,278,197 | No |
| cr4cc_link_uptime | number | 1411754 | No |
| cr4cc_link_uptime@OData.Community.Display.V1.FormattedValue | string | 1,411,754 | No |
| cr4cc_local_api_queries | object | null | Yes |
| cr4cc_mobile_summary | object | null | Yes |
| cr4cc_os_uptime | number | 3020166 | No |
| cr4cc_os_uptime@OData.Community.Display.V1.FormattedValue | string | 3,020,166 | No |
| cr4cc_packets_missed_day | number | 0 | No |
| cr4cc_packets_missed_day@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_packets_missed_streak | number | 0 | No |
| cr4cc_packets_missed_streak_hi_day | number | 0 | No |
| cr4cc_packets_missed_streak_hi_day@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_packets_missed_streak@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_packets_received_day | number | 18966 | No |
| cr4cc_packets_received_day@OData.Community.Display.V1.FormattedValue | string | 18,966 | No |
| cr4cc_packets_received_streak | number | 28180 | No |
| cr4cc_packets_received_streak_hi_day | number | 28180 | No |
| cr4cc_packets_received_streak_hi_day@OData.Community.Display.V1.FormattedValue | string | 28,180 | No |
| cr4cc_packets_received_streak@OData.Community.Display.V1.FormattedValue | string | 28,180 | No |
| cr4cc_pressure_hpa | number | 0 | No |
| cr4cc_pressure_hpa@OData.Community.Display.V1.FormattedValue | string | 0.00000 | No |
| cr4cc_pressure_trend_description | object | null | Yes |
| cr4cc_queue_kilobytes | number | 4 | No |
| cr4cc_queue_kilobytes@OData.Community.Display.V1.FormattedValue | string | 4 | No |
| cr4cc_rain_rate_hi_clicks | number | 1 | No |
| cr4cc_rain_rate_hi_clicks@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_rain_rate_hi_in | number | 0.01 | No |
| cr4cc_rain_rate_hi_in@OData.Community.Display.V1.FormattedValue | string | 0.01 | No |
| cr4cc_rain_rate_hi_last_15_min_clicks | number | 1 | No |
| cr4cc_rain_rate_hi_last_15_min_clicks@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_rain_rate_hi_last_15_min_in | number | 0.01 | No |
| cr4cc_rain_rate_hi_last_15_min_in@OData.Community.Display.V1.FormattedValue | string | 0.01 | No |
| cr4cc_rain_rate_hi_last_15_min_mm | number | 0.25 | No |
| cr4cc_rain_rate_hi_last_15_min_mm@OData.Community.Display.V1.FormattedValue | string | 0.25 | No |
| cr4cc_rain_rate_hi_mm | number | 0.25 | No |
| cr4cc_rain_rate_hi_mm@OData.Community.Display.V1.FormattedValue | string | 0.25 | No |
| cr4cc_rain_rate_last_clicks | number | 1 | No |
| cr4cc_rain_rate_last_clicks@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_rain_rate_last_in | number | 0.01 | No |
| cr4cc_rain_rate_last_in@OData.Community.Display.V1.FormattedValue | string | 0.01 | No |
| cr4cc_rain_rate_last_mm | number | 0.25 | No |
| cr4cc_rain_rate_last_mm@OData.Community.Display.V1.FormattedValue | string | 0.25 | No |
| cr4cc_rain_size | number | 1 | No |
| cr4cc_rain_size@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_rain_storm_current_clicks | number | 525 | No |
| cr4cc_rain_storm_current_clicks@OData.Community.Display.V1.FormattedValue | string | 525.00000 | No |
| cr4cc_rain_storm_current_in | number | 5.25 | No |
| cr4cc_rain_storm_current_in@OData.Community.Display.V1.FormattedValue | string | 5.25000 | No |
| cr4cc_rain_storm_current_mm | number | 133.35 | No |
| cr4cc_rain_storm_current_mm@OData.Community.Display.V1.FormattedValue | string | 133.35000 | No |
| cr4cc_rain_storm_last_clicks | number | 76 | No |
| cr4cc_rain_storm_last_clicks@OData.Community.Display.V1.FormattedValue | string | 76 | No |
| cr4cc_rain_storm_last_end_at | number | 1753994017 | No |
| cr4cc_rain_storm_last_end_at@OData.Community.Display.V1.FormattedValue | string | 1,753,994,017 | No |
| cr4cc_rain_storm_last_in | number | 0.76 | No |
| cr4cc_rain_storm_last_in@OData.Community.Display.V1.FormattedValue | string | 0.76000 | No |
| cr4cc_rain_storm_last_mm | number | 19.304 | No |
| cr4cc_rain_storm_last_mm@OData.Community.Display.V1.FormattedValue | string | 19.30400 | No |
| cr4cc_rain_storm_last_start_at | number | 1753842762 | No |
| cr4cc_rain_storm_last_start_at@OData.Community.Display.V1.FormattedValue | string | 1,753,842,762 | No |
| cr4cc_rainfall_day_clicks | number | 5 | No |
| cr4cc_rainfall_day_clicks@OData.Community.Display.V1.FormattedValue | string | 5 | No |
| cr4cc_rainfall_day_in | number | 0.05 | No |
| cr4cc_rainfall_day_in@OData.Community.Display.V1.FormattedValue | string | 0.05 | No |
| cr4cc_rainfall_day_mm | number | 1.27 | No |
| cr4cc_rainfall_day_mm@OData.Community.Display.V1.FormattedValue | string | 1.27 | No |
| cr4cc_rainfall_last_15_min_clicks | number | 1 | No |
| cr4cc_rainfall_last_15_min_clicks@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_rainfall_last_15_min_in | number | 0.01 | No |
| cr4cc_rainfall_last_15_min_in@OData.Community.Display.V1.FormattedValue | string | 0.01 | No |
| cr4cc_rainfall_last_15_min_mm | number | 0.25 | No |
| cr4cc_rainfall_last_15_min_mm@OData.Community.Display.V1.FormattedValue | string | 0.25 | No |
| cr4cc_rainfall_last_24_hr_clicks | number | 34 | No |
| cr4cc_rainfall_last_24_hr_clicks@OData.Community.Display.V1.FormattedValue | string | 34 | No |
| cr4cc_rainfall_last_24_hr_in | number | 0.34 | No |
| cr4cc_rainfall_last_24_hr_in@OData.Community.Display.V1.FormattedValue | string | 0.34 | No |
| cr4cc_rainfall_last_24_hr_mm | number | 8.64 | No |
| cr4cc_rainfall_last_24_hr_mm@OData.Community.Display.V1.FormattedValue | string | 8.64 | No |
| cr4cc_rainfall_last_60_min_clicks | number | 1 | No |
| cr4cc_rainfall_last_60_min_clicks@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_rainfall_last_60_min_in | number | 0.01 | No |
| cr4cc_rainfall_last_60_min_in@OData.Community.Display.V1.FormattedValue | string | 0.01 | No |
| cr4cc_rainfall_last_60_min_mm | number | 0.25 | No |
| cr4cc_rainfall_last_60_min_mm@OData.Community.Display.V1.FormattedValue | string | 0.25 | No |
| cr4cc_rainfall_month_clicks | number | 525 | No |
| cr4cc_rainfall_month_clicks@OData.Community.Display.V1.FormattedValue | string | 525 | No |
| cr4cc_rainfall_month_in | number | 5.25 | No |
| cr4cc_rainfall_month_in@OData.Community.Display.V1.FormattedValue | string | 5.25000 | No |
| cr4cc_rainfall_month_mm | number | 133.35 | No |
| cr4cc_rainfall_month_mm@OData.Community.Display.V1.FormattedValue | string | 133.35000 | No |
| cr4cc_rainfall_status | object | null | Yes |
| cr4cc_rainfall_year_clicks | number | 1640 | No |
| cr4cc_rainfall_year_clicks@OData.Community.Display.V1.FormattedValue | string | 1,640 | No |
| cr4cc_rainfall_year_in | number | 16.4 | No |
| cr4cc_rainfall_year_in@OData.Community.Display.V1.FormattedValue | string | 16.40000 | No |
| cr4cc_rainfall_year_mm | number | 416.56 | No |
| cr4cc_rainfall_year_mm@OData.Community.Display.V1.FormattedValue | string | 416.56000 | No |
| cr4cc_reception_day | number | 100 | No |
| cr4cc_reception_day@OData.Community.Display.V1.FormattedValue | string | 100 | No |
| cr4cc_record_id | string | 0ecf47fe-26d7-4bd7-b768-a001551b2b94 | No |
| cr4cc_resyncs_day | number | 0 | No |
| cr4cc_resyncs_day@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_rssi_last | number | -76 | No |
| cr4cc_rssi_last@OData.Community.Display.V1.FormattedValue | string | -76 | No |
| cr4cc_rx_kilobytes | number | 258850 | No |
| cr4cc_rx_kilobytes@OData.Community.Display.V1.FormattedValue | string | 258,850 | No |
| cr4cc_rx_state | number | 0 | No |
| cr4cc_rx_state@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_solar_energy_day | number | 0 | No |
| cr4cc_solar_energy_day@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_solar_panel_volt | number | 2.362 | No |
| cr4cc_solar_panel_volt@OData.Community.Display.V1.FormattedValue | string | 2.36200 | No |
| cr4cc_solar_rad | object | null | Yes |
| cr4cc_spars_rpm | object | null | Yes |
| cr4cc_spars_volt | object | null | Yes |
| cr4cc_station_health_status | object | null | Yes |
| cr4cc_station_id | string | 210459 | No |
| cr4cc_supercap_volt | number | 2.497 | No |
| cr4cc_supercap_volt@OData.Community.Display.V1.FormattedValue | string | 2.49700 | No |
| cr4cc_system_free_space | number | 740962 | No |
| cr4cc_system_free_space@OData.Community.Display.V1.FormattedValue | string | 740,962 | No |
| cr4cc_temp | number | 60.1 | No |
| cr4cc_temp_celsius | number | 15.61 | No |
| cr4cc_temp_celsius@OData.Community.Display.V1.FormattedValue | string | 15.61 | No |
| cr4cc_temp_in | object | null | Yes |
| cr4cc_temp@OData.Community.Display.V1.FormattedValue | string | 60.10000 | No |
| cr4cc_thsw_index | object | null | Yes |
| cr4cc_thw_index | number | 60.3 | No |
| cr4cc_thw_index@OData.Community.Display.V1.FormattedValue | string | 60.30000 | No |
| cr4cc_track_name | string | Lithgow | No |
| cr4cc_trans_battery_flag | number | 0 | No |
| cr4cc_trans_battery_flag@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_trans_battery_volt | number | 2.983 | No |
| cr4cc_trans_battery_volt@OData.Community.Display.V1.FormattedValue | string | 2.98300 | No |
| cr4cc_ts | number | 1754278200 | No |
| cr4cc_ts@OData.Community.Display.V1.FormattedValue | string | 1,754,278,200 | No |
| cr4cc_tx_id | number | 1 | No |
| cr4cc_tx_id@OData.Community.Display.V1.FormattedValue | string | 1 | No |
| cr4cc_tx_kilobytes | number | 102572 | No |
| cr4cc_tx_kilobytes@OData.Community.Display.V1.FormattedValue | string | 102,572 | No |
| cr4cc_tz_offset | number | 36000 | No |
| cr4cc_tz_offset@OData.Community.Display.V1.FormattedValue | string | 36,000 | No |
| cr4cc_uv_dose_day | number | 0 | No |
| cr4cc_uv_dose_day@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cr4cc_uv_index | object | null | Yes |
| cr4cc_wbgt | object | null | Yes |
| cr4cc_wbgt_in | object | null | Yes |
| cr4cc_weather_icon | object | null | Yes |
| cr4cc_weatherdataid | string | 4514140b-e470-f011-b4cd-000d3acc5ae2 | No |
| cr4cc_wet_bulb | number | 57.9 | No |
| cr4cc_wet_bulb_in | object | null | Yes |
| cr4cc_wet_bulb@OData.Community.Display.V1.FormattedValue | string | 57.90000 | No |
| cr4cc_wifi_rssi | number | -54 | No |
| cr4cc_wifi_rssi@OData.Community.Display.V1.FormattedValue | string | -54 | No |
| cr4cc_wind_chill | number | 60.1 | No |
| cr4cc_wind_chill@OData.Community.Display.V1.FormattedValue | string | 60.1 | No |
| cr4cc_wind_description | object | null | Yes |
| cr4cc_wind_dir_at_hi_speed_last_10_min | number | 79 | No |
| cr4cc_wind_dir_at_hi_speed_last_10_min@OData.Community.Display.V1.FormattedValue | string | 79 | No |
| cr4cc_wind_dir_at_hi_speed_last_2_min | number | 164 | No |
| cr4cc_wind_dir_at_hi_speed_last_2_min@OData.Community.Display.V1.FormattedValue | string | 164 | No |
| cr4cc_wind_dir_last | number | 195 | No |
| cr4cc_wind_dir_last@OData.Community.Display.V1.FormattedValue | string | 195 | No |
| cr4cc_wind_dir_scalar_avg_last_1_min | number | 130 | No |
| cr4cc_wind_dir_scalar_avg_last_1_min@OData.Community.Display.V1.FormattedValue | string | 130 | No |
| cr4cc_wind_dir_scalar_avg_last_10_min | number | 136 | No |
| cr4cc_wind_dir_scalar_avg_last_10_min@OData.Community.Display.V1.FormattedValue | string | 136 | No |
| cr4cc_wind_dir_scalar_avg_last_2_min | number | 164 | No |
| cr4cc_wind_dir_scalar_avg_last_2_min@OData.Community.Display.V1.FormattedValue | string | 164 | No |
| cr4cc_wind_direction_cardinal | object | null | Yes |
| cr4cc_wind_run_day | number | 16.52 | No |
| cr4cc_wind_run_day@OData.Community.Display.V1.FormattedValue | string | 16.52000 | No |
| cr4cc_wind_speed_avg_last_1_min | number | 1.86 | No |
| cr4cc_wind_speed_avg_last_1_min@OData.Community.Display.V1.FormattedValue | string | 1.86000 | No |
| cr4cc_wind_speed_avg_last_10_min | number | 2.32 | No |
| cr4cc_wind_speed_avg_last_10_min@OData.Community.Display.V1.FormattedValue | string | 2.32000 | No |
| cr4cc_wind_speed_avg_last_2_min | number | 1.73 | No |
| cr4cc_wind_speed_avg_last_2_min@OData.Community.Display.V1.FormattedValue | string | 1.73000 | No |
| cr4cc_wind_speed_hi_kmh | number | 5.43957 | No |
| cr4cc_wind_speed_hi_kmh@OData.Community.Display.V1.FormattedValue | string | 5.43957 | No |
| cr4cc_wind_speed_hi_last_10_min | number | 6.13 | No |
| cr4cc_wind_speed_hi_last_10_min@OData.Community.Display.V1.FormattedValue | string | 6.13000 | No |
| cr4cc_wind_speed_hi_last_2_min | number | 3.38 | No |
| cr4cc_wind_speed_hi_last_2_min@OData.Community.Display.V1.FormattedValue | string | 3.38000 | No |
| cr4cc_wind_speed_kmh | number | 2.51 | No |
| cr4cc_wind_speed_kmh@OData.Community.Display.V1.FormattedValue | string | 2.51 | No |
| cr4cc_wind_speed_last | number | 1.56 | No |
| cr4cc_wind_speed_last@OData.Community.Display.V1.FormattedValue | string | 1.56000 | No |
| createdon | string | 2025-08-04T03:35:25Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/4/2025 1:35 PM | No |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-04T03:35:25Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/4/2025 1:35 PM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | object | null | Yes |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 2918393 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 2,918,393 | No |

---

## Injury Data

**URL:** https://orgfc8a11f1.crm6.dynamics.com

**API Endpoint:** https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1

### Tables

#### Injury Data (cra5e_injurydatas)

**Total Fields:** 74

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _createdby_value | string | 83d53be2-3a73-f011-b4cc-002248108e82 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | # SharePoint Colab Access | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | 83d53be2-3a73-f011-b4cc-002248108e82 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | # SharePoint Colab Access | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | 83d53be2-3a73-f011-b4cc-002248108e82 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | # SharePoint Colab Access | No |
| _owningbusinessunit_value | string | 2648d078-ec6c-f011-b4cc-002248958f69 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | orgfc8a11f1 | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | 83d53be2-3a73-f011-b4cc-002248108e82 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| @odata.etag | string | W/"3137208" | No |
| cra5e_ageofdog | object | null | Yes |
| cra5e_datechecked | string | 2025-07-27T00:00:00Z | No |
| cra5e_datechecked@OData.Community.Display.V1.FormattedValue | string | 7/27/2025 10:00 AM | No |
| cra5e_determinedserious | string | Yes | No |
| cra5e_distancetype | string | Short | No |
| cra5e_doggender | string | Male | No |
| cra5e_doggrade | string | Grade 5 | No |
| cra5e_examreason | string | Steward Requested | No |
| cra5e_examstage | string | Post-Race | No |
| cra5e_failedtofinish | object | null | Yes |
| cra5e_followupinformation | string | Follow up by Kasia Hunter:

Following stabilisat | No |
| cra5e_greyhoundname | string | Phantom Bill | No |
| cra5e_injurycategory | string | Cat D | No |
| cra5e_injurydataid | string | d4473546-3d73-f011-b4cc-002248108e82 | No |
| cra5e_injuryreport | string | Phantom Bill - 27 July 2025 | No |
| cra5e_injurystate | string | Injured | No |
| cra5e_microchip | object | null | Yes |
| cra5e_microchipnumber | string | 956000013032361 | No |
| cra5e_numberofcontestants | number | 7 | No |
| cra5e_numberofcontestants@OData.Community.Display.V1.FormattedValue | string | 7 | No |
| cra5e_placement | number | 350 | No |
| cra5e_placement@OData.Community.Display.V1.FormattedValue | string | 350 | No |
| cra5e_racedate | string | 2025-07-27T00:00:00Z | No |
| cra5e_racedate@OData.Community.Display.V1.FormattedValue | string | 7/27/2025 10:00 AM | No |
| cra5e_racedistance | number | 350 | No |
| cra5e_racedistance@OData.Community.Display.V1.FormattedValue | string | 350 | No |
| cra5e_racenumber | number | 3 | No |
| cra5e_racenumber@OData.Community.Display.V1.FormattedValue | string | 3 | No |
| cra5e_runbox | number | 6 | No |
| cra5e_runbox@OData.Community.Display.V1.FormattedValue | string | 6 | No |
| cra5e_runstage | string | Turn into home straight (1st time) | No |
| cra5e_sfcontestantnumber | string | C-0001318809 | No |
| cra5e_standdowndays | number | 60 | No |
| cra5e_standdowndays@OData.Community.Display.V1.FormattedValue | string | 60 | No |
| cra5e_stewartcomment | object | null | Yes |
| cra5e_trackname | string | Grafton | No |
| cra5e_traineratexam | string | William Gilbert | No |
| cra5e_videolink | string | https://www.thedogs.com.au/racing/grafton/2025-07- | No |
| cra5e_whelpeddate | object | null | Yes |
| createdon | string | 2025-08-07T03:19:07Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/7/2025 1:19 PM | No |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-07T04:03:45Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/7/2025 2:03 PM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | number | 4 | No |
| timezoneruleversionnumber@OData.Community.Display.V1.FormattedValue | string | 4 | No |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 3137208 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 3,137,208 | No |

#### Injuries (cr4cc_injuries)

> ⚠️ Error: API request failed with status 404: {"error":{"code":"0x80060888","message":"Resource not found for the segment 'cr4cc_injurieses'."}}

#### Greyhound (cra5e_greyhounds)

**Total Fields:** 165

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _createdby_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _owningbusinessunit_value | string | 2648d078-ec6c-f011-b4cc-002248958f69 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | orgfc8a11f1 | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _transactioncurrencyid_value | string | a51bc882-1f6d-f011-b4cc-002248958f69 | No |
| _transactioncurrencyid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | transactioncurrencyid | No |
| _transactioncurrencyid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | transactioncurrency | No |
| _transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue | string | Australian Dollar | No |
| @odata.etag | string | W/"3313342" | No |
| cra5e_activelease | boolean | false | No |
| cra5e_activelease@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_activity | string | Training | No |
| cra5e_age | number | 49 | No |
| cra5e_age@OData.Community.Display.V1.FormattedValue | string | 49 | No |
| cra5e_breedingexemption | boolean | false | No |
| cra5e_breedingexemption@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_breedingexemptionvet | object | null | Yes |
| cra5e_breedingregistrationdate | object | null | Yes |
| cra5e_breedingstatus | string | Not Registered | No |
| cra5e_breedingtype | string | Frozen Semen Insemination | No |
| cra5e_c5vaccinationdate | string | 2024-09-19T00:00:00Z | No |
| cra5e_c5vaccinationdate@OData.Community.Display.V1.FormattedValue | string | 9/19/2024 | No |
| cra5e_c5valid | boolean | true | No |
| cra5e_c5valid@OData.Community.Display.V1.FormattedValue | string | Yes | No |
| cra5e_certificatedate | string | 2023-03-09T00:00:00Z | No |
| cra5e_certificatedate@OData.Community.Display.V1.FormattedValue | string | 3/9/2023 | No |
| cra5e_certificatenumber | string | 23551290 | No |
| cra5e_checkinvalidation | boolean | false | No |
| cra5e_checkinvalidation@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_clearedracedate | object | null | Yes |
| cra5e_colour | string | Red & Fawn | No |
| cra5e_colourcode | string | RF | No |
| cra5e_country | string | " | No |
| cra5e_dam | string | 02i6F00000EJLBxQAP | No |
| cra5e_dayssincecheckin | number | 0 | No |
| cra5e_dayssincecheckin@OData.Community.Display.V1.FormattedValue | string | 0 | No |
| cra5e_daysuntilcheckindue | number | 183 | No |
| cra5e_daysuntilcheckindue@OData.Community.Display.V1.FormattedValue | string | 183 | No |
| cra5e_deceaseddate | object | null | Yes |
| cra5e_desexed | boolean | false | No |
| cra5e_desexed@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_dnaexemptiondate | object | null | Yes |
| cra5e_dnanumber | object | null | Yes |
| cra5e_dnasampledate | object | null | Yes |
| cra5e_earbrandkey | string | NKDYF | No |
| cra5e_escapecheckin | boolean | false | No |
| cra5e_escapecheckin@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_externalgender | string | Female | No |
| cra5e_firstracedate | object | null | Yes |
| cra5e_gender | string | Bitch/Female | No |
| cra5e_gendercode | string | Bitch | No |
| cra5e_greyhoundid | string | 08ee0a08-7879-f011-b4cc-002248108e82 | No |
| cra5e_greyhoundowner | string | Alan Tutt | No |
| cra5e_greyhoundtrainer | object | null | Yes |
| cra5e_gwicnumber | object | null | Yes |
| cra5e_healthfitnessdate | object | null | Yes |
| cra5e_healthfitnessvalid | boolean | false | No |
| cra5e_healthfitnessvalid@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_identificationcombo | string | Sandave Jeanie - NKDYF - 956000013022817 | No |
| cra5e_installdate | string | 2021-07-21T00:00:00Z | No |
| cra5e_installdate@OData.Community.Display.V1.FormattedValue | string | 7/21/2021 | No |
| cra5e_intransfer | boolean | false | No |
| cra5e_intransfer@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_isbreeding | boolean | false | No |
| cra5e_isbreeding@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_l135penalty | boolean | false | No |
| cra5e_l135penalty@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_lastweight | object | null | Yes |
| cra5e_latename | object | null | Yes |
| cra5e_latestcheckin | string | 2025-08-15T01:34:46Z | No |
| cra5e_latestcheckin@OData.Community.Display.V1.FormattedValue | string | 8/15/2025 | No |
| cra5e_latesttrainertransferdate | string | 2025-05-30T00:00:00Z | No |
| cra5e_latesttrainertransferdate@OData.Community.Display.V1.FormattedValue | string | 5/30/2025 | No |
| cra5e_latesttransferdate | string | 2025-05-30T00:00:00Z | No |
| cra5e_latesttransferdate@OData.Community.Display.V1.FormattedValue | string | 5/30/2025 | No |
| cra5e_leftearbrand | string | NKDYF | No |
| cra5e_locationlatitude | number | -29.53 | No |
| cra5e_locationlatitude@OData.Community.Display.V1.FormattedValue | string | -29.53 | No |
| cra5e_locationlongitude | number | 152.92 | No |
| cra5e_locationlongitude@OData.Community.Display.V1.FormattedValue | string | 152.92 | No |
| cra5e_locationstartdate | string | 2025-01-07T00:00:00Z | No |
| cra5e_locationstartdate@OData.Community.Display.V1.FormattedValue | string | 1/7/2025 | No |
| cra5e_microchip | string | 956000013022817 | No |
| cra5e_microchip2 | object | null | Yes |
| cra5e_microchip2date | string | 2022-11-11T00:00:00Z | No |
| cra5e_microchip2date@OData.Community.Display.V1.FormattedValue | string | 11/11/2022 | No |
| cra5e_microchipdate | string | 2022-11-11T00:00:00Z | No |
| cra5e_microchipdate@OData.Community.Display.V1.FormattedValue | string | 11/11/2022 | No |
| cra5e_monthcheckin | boolean | false | No |
| cra5e_monthcheckin@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_name | string | Sandave Jeanie | No |
| cra5e_namerequested | boolean | false | No |
| cra5e_namerequested@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_namereuseddate | object | null | Yes |
| cra5e_nextcheckindue | string | 2026-02-14T00:00:00Z | No |
| cra5e_nextcheckindue@OData.Community.Display.V1.FormattedValue | string | 2/14/2026 | No |
| cra5e_ownercalc | string | Alan Tutt | No |
| cra5e_owneridnumber | string | 227869 | No |
| cra5e_ownername | string | Alan Tutt | No |
| cra5e_ownerstate | string | NSW | No |
| cra5e_pannus | boolean | false | No |
| cra5e_pannus@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_previoustrainertransfer | string | 2024-12-06T00:00:00Z | No |
| cra5e_previoustrainertransfer@OData.Community.Display.V1.FormattedValue | string | 12/6/2024 | No |
| cra5e_prizemoney | number | 0 | No |
| cra5e_prizemoney_base | number | 0 | No |
| cra5e_prizemoney_base@OData.Community.Display.V1.FormattedValue | string | $0.00 | No |
| cra5e_prizemoney@OData.Community.Display.V1.FormattedValue | string | $0.00 | No |
| cra5e_proofoflife2024 | number | 10 | No |
| cra5e_proofoflife2024@OData.Community.Display.V1.FormattedValue | string | 10 | No |
| cra5e_rehomeddate | object | null | Yes |
| cra5e_retirementdate | object | null | Yes |
| cra5e_rightearbrand | object | null | Yes |
| cra5e_sfid | string | 02i2s000000hRL2AAM | No |
| cra5e_showonmap | boolean | true | No |
| cra5e_showonmap@OData.Community.Display.V1.FormattedValue | string | Yes | No |
| cra5e_sire | string | 02i6F00000EJO5WQAX | No |
| cra5e_sixmonthcheckin | boolean | true | No |
| cra5e_sixmonthcheckin@OData.Community.Display.V1.FormattedValue | string | Yes | No |
| cra5e_statebred | string | NSW | No |
| cra5e_stateregistered | string | NSW | No |
| cra5e_status | string | Racing | No |
| cra5e_statuscode | string | racing | No |
| cra5e_studsire | boolean | false | No |
| cra5e_studsire@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_traineridnumber | string | 227869 | No |
| cra5e_trainername | object | null | Yes |
| cra5e_trainerstate | string | NSW | No |
| cra5e_trainertransferpause | boolean | false | No |
| cra5e_trainertransferpause@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_validcheckin | boolean | false | No |
| cra5e_validcheckin@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_whelpeddayofweek | string | Wednesday | No |
| createdon | string | 2025-08-15T01:34:49Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/15/2025 11:34 AM | No |
| exchangerate | number | 1 | No |
| exchangerate@OData.Community.Display.V1.FormattedValue | string | 1.000000000000 | No |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-15T01:34:49Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/15/2025 11:34 AM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | number | 4 | No |
| timezoneruleversionnumber@OData.Community.Display.V1.FormattedValue | string | 4 | No |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 3313342 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 3,313,342 | No |

#### Health Check (cra5e_heathchecks)

**Total Fields:** 110

| Field Name | Type | Sample Value | Nullable |
|------------|------|--------------|----------|
| _cra5e_greyhound_value | string | 3cb90660-9079-f011-b4cc-7c1e522a939b | No |
| _cra5e_greyhound_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | cra5e_Greyhound | No |
| _cra5e_greyhound_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | cra5e_greyhound | No |
| _cra5e_greyhound_value@OData.Community.Display.V1.FormattedValue | string | 02i2s000000MsXEAA0 | No |
| _createdby_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _createdby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _createdby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _createdonbehalfby_value | object | null | Yes |
| _modifiedby_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _modifiedby_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _modifiedonbehalfby_value | object | null | Yes |
| _ownerid_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | ownerid | No |
| _ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| _ownerid_value@OData.Community.Display.V1.FormattedValue | string | Kevin Sweet | No |
| _owningbusinessunit_value | string | 2648d078-ec6c-f011-b4cc-002248958f69 | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.associatednavigationproperty | string | owningbusinessunit | No |
| _owningbusinessunit_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | businessunit | No |
| _owningbusinessunit_value@OData.Community.Display.V1.FormattedValue | string | orgfc8a11f1 | No |
| _owningteam_value | object | null | Yes |
| _owninguser_value | string | 184fd078-ec6c-f011-b4cc-002248958f69 | No |
| _owninguser_value@Microsoft.Dynamics.CRM.lookuplogicalname | string | systemuser | No |
| @odata.etag | string | W/"3321570" | No |
| cra5e_ageatexam | number | 25 | No |
| cra5e_ageatexam@OData.Community.Display.V1.FormattedValue | string | 25 | No |
| cra5e_boxnumber | object | null | Yes |
| cra5e_cardiovascularissue | boolean | false | No |
| cra5e_cardiovascularissue@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_datechecked | string | 2024-07-04T00:00:00Z | No |
| cra5e_datechecked@OData.Community.Display.V1.FormattedValue | string | 7/4/2024 10:00 AM | No |
| cra5e_dehydration | boolean | false | No |
| cra5e_dehydration@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_desexingdate | object | null | Yes |
| cra5e_determinedaseriousinjury | string | Serious Injury | No |
| cra5e_died | boolean | false | No |
| cra5e_died@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_distance | number | 411 | No |
| cra5e_distance@OData.Community.Display.V1.FormattedValue | string | 411 | No |
| cra5e_euthanased | boolean | true | No |
| cra5e_euthanased@OData.Community.Display.V1.FormattedValue | string | Yes | No |
| cra5e_examiningvet | string | 0052s000002HKA4AAO | No |
| cra5e_exhaustion | boolean | false | No |
| cra5e_exhaustion@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_followupinformation | string | Euthanased by private vet.
Following stabilisatio | No |
| cra5e_gastrointestinalissue | boolean | false | No |
| cra5e_gastrointestinalissue@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_healthcheckauthority | string | NSW | No |
| cra5e_healthcheckstatus | string | Complete | No |
| cra5e_heathcheckid | string | b1bc19a8-9279-f011-b4cc-002248108e82 | No |
| cra5e_heatstress | boolean | false | No |
| cra5e_heatstress@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_injured | boolean | false | No |
| cra5e_injured@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_injurycategory | object | null | Yes |
| cra5e_injuryclassification | string | Cat D | No |
| cra5e_lame | object | null | Yes |
| cra5e_medicationadministered | boolean | false | No |
| cra5e_medicationadministered@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_medications | object | null | Yes |
| cra5e_musculoskeletalissue | boolean | false | No |
| cra5e_musculoskeletalissue@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_name | string | HC-00265192 | No |
| cra5e_neurologicalissue | boolean | false | No |
| cra5e_neurologicalissue@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_poorperformance | boolean | false | No |
| cra5e_poorperformance@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_racenumber | number | 8 | No |
| cra5e_racenumber@OData.Community.Display.V1.FormattedValue | string | 8 | No |
| cra5e_racetype | string | Race | No |
| cra5e_racingincident | boolean | false | No |
| cra5e_racingincident@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_respiratoryissue | boolean | false | No |
| cra5e_respiratoryissue@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_sedatives | boolean | false | No |
| cra5e_sedatives@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_sfid | string | a8nId00000004zLIAQ | No |
| cra5e_standdowndays | number | 90 | No |
| cra5e_standdowndays@OData.Community.Display.V1.FormattedValue | string | 90 | No |
| cra5e_standdowndaysenddate | string | 2024-10-02T00:00:00Z | No |
| cra5e_standdowndaysenddate@OData.Community.Display.V1.FormattedValue | string | 10/2/2024 | No |
| cra5e_sutures | boolean | false | No |
| cra5e_sutures@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_trackname | string | Casino | No |
| cra5e_treatmentinformation | string | 1.3mL Methadone IV + 0.5mL Medetomidine IV on arri | No |
| cra5e_type | string | Race Meeting Exam | No |
| cra5e_vaccinationdate | object | null | Yes |
| cra5e_vetclearancerequired | boolean | false | No |
| cra5e_vetclearancerequired@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_veterinarianname | object | null | Yes |
| cra5e_veterinaryclearance | boolean | false | No |
| cra5e_veterinaryclearance@OData.Community.Display.V1.FormattedValue | string | No | No |
| cra5e_wasfollowedup | boolean | true | No |
| cra5e_wasfollowedup@OData.Community.Display.V1.FormattedValue | string | Yes | No |
| cra5e_weightkg | object | null | Yes |
| createdon | string | 2025-08-15T04:45:25Z | No |
| createdon@OData.Community.Display.V1.FormattedValue | string | 8/15/2025 2:45 PM | No |
| importsequencenumber | object | null | Yes |
| modifiedon | string | 2025-08-15T04:45:25Z | No |
| modifiedon@OData.Community.Display.V1.FormattedValue | string | 8/15/2025 2:45 PM | No |
| overriddencreatedon | object | null | Yes |
| statecode | number | 0 | No |
| statecode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| statuscode | number | 1 | No |
| statuscode@OData.Community.Display.V1.FormattedValue | string | Active | No |
| timezoneruleversionnumber | number | 4 | No |
| timezoneruleversionnumber@OData.Community.Display.V1.FormattedValue | string | 4 | No |
| utcconversiontimezonecode | object | null | Yes |
| versionnumber | number | 3321570 | No |
| versionnumber@OData.Community.Display.V1.FormattedValue | string | 3,321,570 | No |

---

## GAP (Greyhound Adoption Program)

**URL:** https://org16bdb053.crm6.dynamics.com

**API Endpoint:** https://org16bdb053.crm6.dynamics.com/api/data/v9.1

> No tables configured for this environment.

---

