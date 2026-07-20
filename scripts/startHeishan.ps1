[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$PreferredPort = 4173,

  [ValidateRange(1, 100)]
  [int]$PortSearchCount = 11,

  [ValidateRange(1, 120)]
  [int]$WaitSeconds = 15,

  [switch]$NoOpen,
  [switch]$PassThru
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$entryPath = Join-Path $projectRoot 'index.html'
$mainModulePath = Join-Path $projectRoot 'src\main.js'
$healthAssetRelativePath = 'assets/heishan_r20/icons/status/life.svg'
$healthAssetPath = Join-Path $projectRoot ($healthAssetRelativePath.Replace('/', '\'))
$serverPath = Join-Path $projectRoot 'scripts\staticServer.js'
$runtimeRoot = Join-Path $projectRoot '.runtime'

if (-not (Test-Path -LiteralPath $entryPath -PathType Leaf)) {
  throw "Missing game entry: $entryPath"
}
if (-not (Test-Path -LiteralPath $mainModulePath -PathType Leaf)) {
  throw "Missing game module: $mainModulePath"
}
if (-not (Test-Path -LiteralPath $serverPath -PathType Leaf)) {
  throw "Missing local server: $serverPath"
}
if (-not (Test-Path -LiteralPath $healthAssetPath -PathType Leaf)) {
  throw "Missing launcher health asset: $healthAssetPath"
}

function Get-HeishanUrl {
  param([int]$Port)
  return "http://127.0.0.1:$Port/"
}

function Test-HeishanEndpoint {
  param([int]$Port)

  try {
    $entryResponse = Invoke-WebRequest `
      -Uri (Get-HeishanUrl -Port $Port) `
      -UseBasicParsing `
      -TimeoutSec 2 `
      -Headers @{ 'Cache-Control' = 'no-cache' }
    $mainResponse = Invoke-WebRequest `
      -Uri ((Get-HeishanUrl -Port $Port) + 'src/main.js') `
      -UseBasicParsing `
      -TimeoutSec 2 `
      -Headers @{ 'Cache-Control' = 'no-cache' }
    $assetResponse = Invoke-WebRequest `
      -Uri ((Get-HeishanUrl -Port $Port) + $healthAssetRelativePath) `
      -UseBasicParsing `
      -TimeoutSec 2 `
      -Headers @{ 'Cache-Control' = 'no-cache' }
    $localEntry = [System.IO.File]::ReadAllText($entryPath, [System.Text.Encoding]::UTF8)
    $localMain = [System.IO.File]::ReadAllText($mainModulePath, [System.Text.Encoding]::UTF8)
    $localAsset = [System.IO.File]::ReadAllText($healthAssetPath, [System.Text.Encoding]::UTF8)
    $assetContentType = [string]$assetResponse.Headers['Content-Type']
    return (
      $entryResponse.StatusCode -eq 200 -and
      $mainResponse.StatusCode -eq 200 -and
      $assetResponse.StatusCode -eq 200 -and
      $entryResponse.Content -ceq $localEntry -and
      $mainResponse.Content -ceq $localMain -and
      $assetContentType.StartsWith('image/svg+xml', [System.StringComparison]::OrdinalIgnoreCase) -and
      $assetResponse.Content -ceq $localAsset
    )
  } catch {
    return $false
  }
}

function Test-PortAvailable {
  param([int]$Port)

  $listener = [System.Net.Sockets.TcpListener]::new(
    [System.Net.IPAddress]::Loopback,
    $Port
  )
  try {
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    $listener.Stop()
  }
}

function Start-HeishanServer {
  param(
    [int]$Port,
    [int]$ReadyTimeoutSeconds
  )

  $nodeCommand = Get-Command node.exe -CommandType Application -ErrorAction Stop |
    Select-Object -First 1
  if ($null -eq $nodeCommand) {
    throw 'Node.js is required but node.exe was not found on PATH.'
  }

  New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
  $stdoutPath = Join-Path $runtimeRoot "heishan-server-$Port.out.log"
  $stderrPath = Join-Path $runtimeRoot "heishan-server-$Port.err.log"
  $oldPort = [System.Environment]::GetEnvironmentVariable('PORT', 'Process')
  [System.Environment]::SetEnvironmentVariable('PORT', [string]$Port, 'Process')
  try {
    $quotedServerPath = '"' + $serverPath.Replace('"', '\"') + '"'
    $process = Start-Process `
      -FilePath $nodeCommand.Source `
      -ArgumentList $quotedServerPath `
      -WorkingDirectory $projectRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath `
      -PassThru
  } finally {
    [System.Environment]::SetEnvironmentVariable('PORT', $oldPort, 'Process')
  }

  $deadline = [DateTime]::UtcNow.AddSeconds($ReadyTimeoutSeconds)
  while ([DateTime]::UtcNow -lt $deadline) {
    if (Test-HeishanEndpoint -Port $Port) {
      return [pscustomobject]@{
        verdict = 'PASS_R20_ONE_CLICK_LAUNCHER_READY'
        url = Get-HeishanUrl -Port $Port
        port = $Port
        startedByLauncher = $true
        processId = $process.Id
        projectRoot = $projectRoot
      }
    }

    $process.Refresh()
    if ($process.HasExited) {
      $details = ''
      if (Test-Path -LiteralPath $stderrPath -PathType Leaf) {
        $details = (Get-Content -LiteralPath $stderrPath -Tail 20) -join [Environment]::NewLine
      }
      throw "The local server exited before it became ready. $details"
    }
    Start-Sleep -Milliseconds 100
  }

  if (-not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  throw "The local server did not become ready within $ReadyTimeoutSeconds seconds."
}

$lastPort = [Math]::Min(65535, $PreferredPort + $PortSearchCount - 1)
$result = $null
foreach ($port in $PreferredPort..$lastPort) {
  if (Test-HeishanEndpoint -Port $port) {
    $result = [pscustomobject]@{
      verdict = 'PASS_R20_ONE_CLICK_LAUNCHER_READY'
      url = Get-HeishanUrl -Port $port
      port = $port
      startedByLauncher = $false
      processId = $null
      projectRoot = $projectRoot
    }
    break
  }

  if (Test-PortAvailable -Port $port) {
    $result = Start-HeishanServer -Port $port -ReadyTimeoutSeconds $WaitSeconds
    break
  }
}

if ($null -eq $result) {
  throw "No usable local port was found between $PreferredPort and $lastPort."
}

if (-not $NoOpen) {
  Start-Process -FilePath $result.url | Out-Null
}

Write-Host "Heishan Tavern is ready: $($result.url)"
if ($PassThru) {
  Write-Output $result
}
