# PowerShell script to copy Enterprise UI to shared location
# This allows all packages to use the same Enterprise UI components

$source = "packages\race-management\src\enterprise-ui"
$destination = "packages\shared\enterprise-ui"

# Create destination if it doesn't exist
if (!(Test-Path $destination)) {
    New-Item -ItemType Directory -Path $destination -Force
    Write-Host "Created destination directory: $destination" -ForegroundColor Green
}

# Copy the entire enterprise-ui folder
Write-Host "Copying Enterprise UI from $source to $destination..." -ForegroundColor Yellow

# Use robocopy for better handling of large directory structures
robocopy $source $destination /E /MIR /NFL /NDL /NJH /NJS /nc /ns /np

if ($LASTEXITCODE -le 7) {
    Write-Host "Successfully copied Enterprise UI to shared location!" -ForegroundColor Green
    
    # Create package.json for the shared enterprise-ui
    $packageJson = @{
        name = "@grnsw/enterprise-ui"
        version = "1.0.0"
        description = "Shared Enterprise UI Component Library for GRNSW SPFx Solutions"
        main = "index.js"
        types = "index.d.ts"
        author = "GRNSW"
        license = "MIT"
        dependencies = @{
            "react" = "^17.0.1"
            "@fluentui/react" = "^8.106.4"
        }
    }
    
    $packageJsonPath = Join-Path $destination "package.json"
    $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $packageJsonPath -Encoding UTF8
    Write-Host "Created package.json for shared Enterprise UI" -ForegroundColor Green
    
    # Create an index file to export all components
    $indexContent = @"
// Export all Enterprise UI components
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
"@
    
    $indexPath = Join-Path $destination "index.ts"
    $indexContent | Out-File -FilePath $indexPath -Encoding UTF8
    Write-Host "Created index.ts for shared Enterprise UI" -ForegroundColor Green
    
} else {
    Write-Host "Failed to copy Enterprise UI. Error code: $LASTEXITCODE" -ForegroundColor Red
}