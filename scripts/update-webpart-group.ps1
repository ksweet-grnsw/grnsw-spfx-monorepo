# PowerShell script to update web part manifests to use custom "Track Analysis" group

# Generate a new GUID for the Track Analysis group
$trackAnalysisGroupId = "a8f7b5e3-2d4c-4a9f-8e6b-7c3d5e1f9a2b"
$groupName = "Track Analysis"

Write-Host "Updating web part manifests to use custom '$groupName' group..." -ForegroundColor Cyan
Write-Host "New Group ID: $trackAnalysisGroupId" -ForegroundColor Yellow

# Define the manifest files to update
$manifestFiles = @(
    "packages\track-conditions-spfx\src\webparts\temperature\TemperatureWebPart.manifest.json",
    "packages\track-conditions-spfx\src\webparts\rainfall\RainfallWebPart.manifest.json",
    "packages\track-conditions-spfx\src\webparts\windAnalysis\WindAnalysisWebPart.manifest.json",
    "packages\track-conditions-spfx\src\webparts\trackConditions\TrackConditionsWebPart.manifest.json",
    "packages\track-conditions-spfx\src\webparts\weatherDashboard\WeatherDashboardWebPart.manifest.json",
    "packages\track-conditions-spfx\src\webparts\historicalPatternAnalyzer\HistoricalPatternAnalyzerWebPart.manifest.json"
)

$basePath = "D:\GRNSW Data Projects\Weather Data\grnsw-spfx-monorepo"

foreach ($manifestFile in $manifestFiles) {
    $fullPath = Join-Path $basePath $manifestFile
    
    if (Test-Path $fullPath) {
        Write-Host "Updating: $manifestFile" -ForegroundColor Green
        
        # Read the manifest file
        $content = Get-Content $fullPath -Raw
        
        # Update the groupId - common SharePoint group IDs:
        # 5c03119e-3074-46fd-976b-c60198311f70 = Advanced
        # cf066440-0614-43d6-98ae-0b31cf14c7c3 = Text, media, and content
        # 1edbd9a8-0bfb-4aa2-9afd-14b8c45dd489 = Dcoument library
        # etc.
        
        # Replace the groupId
        $content = $content -replace '"groupId":\s*"[^"]*"', "`"groupId`": `"$trackAnalysisGroupId`""
        
        # Replace the group name
        $content = $content -replace '"group":\s*{\s*"default":\s*"[^"]*"\s*}', "`"group`": { `"default`": `"$groupName`" }"
        
        # Save the updated content
        Set-Content -Path $fullPath -Value $content -NoNewline
        
        Write-Host "  ✓ Updated successfully" -ForegroundColor DarkGreen
    } else {
        Write-Host "  ✗ File not found: $fullPath" -ForegroundColor Red
    }
}

Write-Host "`nAll manifests updated!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm run build' to rebuild the package" -ForegroundColor White
Write-Host "2. Run 'gulp package-solution --ship' to create the production package" -ForegroundColor White
Write-Host "3. Deploy the updated package to SharePoint" -ForegroundColor White
Write-Host "`nYour web parts will now appear in the '$groupName' section!" -ForegroundColor Cyan