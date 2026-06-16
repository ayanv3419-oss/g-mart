# Re-downloads any products that have no local image yet, then rebuilds a full manifest.
$out = "C:\Users\DELL\AppData\Local\Temp\claude\C--Users-DELL-Desktop-MetricAi\bf3e92e8-b1f3-479a-a75e-ab77fdffdfed\tasks\w7vkouyag.output"
$dir = "C:\Users\DELL\Desktop\g-mart\img"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$j = Get-Content $out -Raw | ConvertFrom-Json
$imgs = $j.result.images
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
$headers = @{ "Referer" = "https://commons.wikimedia.org/" }

foreach ($id in 1..24) {
  $existing = Get-ChildItem -Path $dir -Filter "${id}_*" -ErrorAction SilentlyContinue
  if ($existing) { "$id  already have $($existing.Count)"; continue }
  $node = $imgs."$id"
  if (-not $node) { "$id  no node"; continue }
  $urls = @()
  if ($node.images) { $urls = @($node.images) } elseif ($node.main) { $urls = @($node.main) }
  $urls = $urls | Select-Object -First 3
  $n = 0
  foreach ($u in $urls) {
    if (-not $u) { continue }
    $small = $u -replace '/\d+px-', '/500px-'
    $ext = ([System.IO.Path]::GetExtension(($small -split '\?')[0])).ToLower()
    if ($ext -notin ".jpg",".jpeg",".png") { $ext = ".jpg" }
    if ($ext -eq ".jpeg") { $ext = ".jpg" }
    $dest = Join-Path $dir "${id}_$n$ext"
    $okdl = $false
    for ($try = 0; $try -lt 3 -and -not $okdl; $try++) {
      try {
        Invoke-WebRequest -Uri $small -OutFile $dest -TimeoutSec 45 -UserAgent $ua -Headers $headers -UseBasicParsing
        if ((Get-Item $dest).Length -gt 1000) { $okdl = $true }
      } catch { Start-Sleep -Seconds 8 }
    }
    if ($okdl) { $n++ }
    Start-Sleep -Seconds 4
  }
  "$id  downloaded $n"
}

# Rebuild full manifest from whatever files exist.
$manifest = [ordered]@{}
foreach ($id in 1..24) {
  $files = Get-ChildItem -Path $dir -Filter "${id}_*" -ErrorAction SilentlyContinue | Sort-Object Name
  $manifest["$id"] = @($files | ForEach-Object { "img/$($_.Name)" })
}
$manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $dir "manifest.json") -Encoding utf8
"DONE missing. Products with >=1 image: " + (($manifest.Values | Where-Object { $_.Count -gt 0 }).Count)