# Archive old release folders
# Keeps only the latest 3 versions per package

$releaseRoot = "../releases"
$archiveRoot = "../releases-archive"

# Create archive directory if it doesn't exist
if (!(Test-Path $archiveRoot)) {
    New-Item -ItemType Directory -Path $archiveRoot | Out-Null
    Write-Host "Created archive directory: $archiveRoot" -ForegroundColor Green
}

# Get all package directories
$packages = Get-ChildItem -Path $releaseRoot -Directory | Where-Object { $_.Name -ne "releases-archive" }

foreach ($package in $packages) {
    Write-Host "`nProcessing package: $($package.Name)" -ForegroundColor Cyan
    
    # Get all version folders sorted by version number
    $versions = Get-ChildItem -Path $package.FullName -Directory | 
        Where-Object { $_.Name -match "^v\d+\.\d+\.\d+" } |
        Sort-Object { 
            $v = $_.Name -replace "^v", ""
            [version]$v
        } -Descending
    
    if ($versions.Count -le 3) {
        Write-Host "  Only $($versions.Count) versions found - keeping all" -ForegroundColor Yellow
        continue
    }
    
    # Keep the latest 3 versions
    $toKeep = $versions | Select-Object -First 3
    $toArchive = $versions | Select-Object -Skip 3
    
    Write-Host "  Keeping: $($toKeep.Name -join ', ')" -ForegroundColor Green
    Write-Host "  Archiving: $($toArchive.Name -join ', ')" -ForegroundColor Yellow
    
    # Create package archive directory
    $packageArchive = Join-Path $archiveRoot $package.Name
    if (!(Test-Path $packageArchive)) {
        New-Item -ItemType Directory -Path $packageArchive | Out-Null
    }
    
    # Move old versions to archive
    foreach ($version in $toArchive) {
        $destination = Join-Path $packageArchive $version.Name
        Write-Host "    Moving $($version.Name) to archive..." -NoNewline
        Move-Item -Path $version.FullName -Destination $destination -Force
        Write-Host " Done" -ForegroundColor Green
    }
}

Write-Host "`n`nArchive Summary:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

# Count releases
$currentCount = (Get-ChildItem -Path $releaseRoot -Directory -Recurse | Where-Object { $_.Name -match "^v\d+\.\d+\.\d+" }).Count
$archivedCount = (Get-ChildItem -Path $archiveRoot -Directory -Recurse | Where-Object { $_.Name -match "^v\d+\.\d+\.\d+" }).Count

Write-Host "Current releases: $currentCount" -ForegroundColor Green
Write-Host "Archived releases: $archivedCount" -ForegroundColor Yellow
Write-Host "`nArchive complete!" -ForegroundColor Green