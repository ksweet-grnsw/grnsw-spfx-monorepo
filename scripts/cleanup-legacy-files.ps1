# Clean up legacy duplicate files after refactoring
# This script removes old service implementations that have been replaced by unified services

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Legacy File Cleanup Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Files to remove
$filesToRemove = @(
    # AuthService duplicates
    "../packages/track-conditions-spfx/src/services/AuthService.ts",
    "../packages/race-management/src/services/SharedAuthService.ts",
    "../packages/gap-spfx/src/services/SharedAuthService.ts",
    
    # BaseDataverseService duplicate
    "../packages/greyhound-health/src/services/BaseDataverseService.ts",
    
    # Logger duplicates
    "../packages/race-management/src/utils/Logger.ts",
    "../packages/track-conditions-spfx/src/utils/Logger.ts",
    
    # ErrorHandler duplicates
    "../packages/race-management/src/utils/ErrorHandler.ts",
    "../packages/track-conditions-spfx/src/utils/ErrorHandler.ts"
)

$removedCount = 0
$notFoundCount = 0

Write-Host "Removing legacy duplicate files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        $package = (Split-Path $file).Split('\')[-4]
        
        Write-Host "  [$package] Removing: $fileName..." -NoNewline
        
        # Backup first (create backup directory if it doesn't exist)
        $backupDir = "../legacy-backup"
        if (!(Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir | Out-Null
        }
        
        $backupPath = Join-Path $backupDir "$package-$fileName.bak"
        Copy-Item $file $backupPath -Force
        
        # Remove the file
        Remove-Item $file -Force
        
        Write-Host " Done" -ForegroundColor Green
        Write-Host "    (Backed up to: $backupPath)" -ForegroundColor Gray
        $removedCount++
    } else {
        Write-Host "  File not found: $file" -ForegroundColor DarkGray
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cleanup Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Files removed: $removedCount" -ForegroundColor Green
Write-Host "  Files not found: $notFoundCount" -ForegroundColor Gray
Write-Host ""

if ($removedCount -gt 0) {
    Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Update all imports in affected packages to use unified services from @grnsw/shared" -ForegroundColor White
    Write-Host "2. Run 'npm run build' in each package to check for import errors" -ForegroundColor White
    Write-Host "3. Update any package-specific configurations" -ForegroundColor White
    Write-Host ""
    Write-Host "Example import updates needed:" -ForegroundColor Cyan
    Write-Host '  OLD: import { AuthService } from "./services/AuthService"' -ForegroundColor Red
    Write-Host '  NEW: import { UnifiedAuthService } from "@grnsw/shared"' -ForegroundColor Green
    Write-Host ""
    Write-Host '  OLD: import { Logger } from "./utils/Logger"' -ForegroundColor Red
    Write-Host '  NEW: import { UnifiedLogger } from "@grnsw/shared"' -ForegroundColor Green
}

Write-Host "Cleanup complete!" -ForegroundColor Green