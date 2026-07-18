$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$commands = @(
    @{ Name = 'server'; Command = 'php artisan serve'; Critical = $true },
    @{ Name = 'reverb'; Command = 'php artisan reverb:start'; Critical = $false },
    @{ Name = 'poll'; Command = 'php artisan tn:poll --interval=1 --controller=1'; Critical = $false },
    @{ Name = 'queue'; Command = 'php artisan queue:listen --tries=1 --timeout=0'; Critical = $false },
    @{ Name = 'vite'; Command = 'npm run dev'; Critical = $true }
)

Write-Host 'Starting SCADA dev services...' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop this watcher. Close spawned process windows if needed.' -ForegroundColor Yellow

$jobs = foreach ($item in $commands) {
    $job = Start-Job -Name $item.Name -ScriptBlock {
        param($workdir, $command)
        Set-Location $workdir
        Invoke-Expression $command
    } -ArgumentList $root, $item.Command

    $job | Add-Member -NotePropertyName Critical -NotePropertyValue $item.Critical
    $job
}

try {
    while ($true) {
        foreach ($job in $jobs) {
            Receive-Job $job -Keep | ForEach-Object {
                Write-Host "[$($job.Name)] $_"
            }
        }

        $stopped = $jobs | Where-Object { $_.State -in @('Failed', 'Stopped', 'Completed') }
        if ($stopped) {
            foreach ($job in $stopped) {
                $color = if ($job.Critical) { 'Red' } else { 'Yellow' }
                Write-Host "[$($job.Name)] stopped with state $($job.State)" -ForegroundColor $color
                Receive-Job $job -Keep | ForEach-Object {
                    Write-Host "[$($job.Name)] $_" -ForegroundColor $color
                }
            }

            if ($stopped | Where-Object { $_.Critical }) {
                break
            }

            $jobs = $jobs | Where-Object { $_.State -notin @('Failed', 'Stopped', 'Completed') }
        }

        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host 'Stopping SCADA dev services...' -ForegroundColor Yellow
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
}
