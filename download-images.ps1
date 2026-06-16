# Downloads the workflow's Wikimedia photos into ./img and writes a manifest.
$out = "C:\Users\DELL\AppData\Local\Temp\claude\C--Users-DELL-Desktop-MetricAi\bf3e92e8-b1f3-479a-a75e-ab77fdffdfed\tasks\w7vkouyag.output"
$dir = "C:\Users\DELL\Desktop\g-mart\img"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$j = Get-Content $out -Raw | ConvertFrom-Json
$imgs = $j.result.images
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
$headers = @{ "Referer" = "https://commons.wikimedia.org/" }
$manifest = [ordered]@{}

foreach ($id in 1..24) {
  $node = $imgs."$id"
  if (-not $node) { continue }
  $urls = @()
  if ($node.images) { $urls = @($node.images) }
  elseif ($node.main) { $urls = @($node.main) }
  $urls = $urls | Select-Object -First 3
  $local = @()
  $n = 0
  foreach ($u in $urls) {
    if (-not $u) { continue }
    $small = $u -replace '/\d+px-', '/500px-'
    $ext = ([System.IO.Path]::GetExtension(($small -split '\?')[0])).ToLower()
    if ($ext -notin ".jpg",".jpeg",".png") { $ext = ".jpg" }
    if ($ext -eq ".jpeg") { $ext = ".jpg" }
    $file = "${id}_$n$ext"
    $dest = Join-Path $dir $file
    $okdl = $false
    for ($try = 0; $try -lt 2 -and -not $okdl; $try++) {
      try {
        Invoke-WebRequest -Uri $small -OutFile $dest -TimeoutSec 40 -UserAgent $ua -Headers $headers -UseBasicParsing
        if ((Get-Item $dest).Length -gt 1000) { $okdl = $true }
      } catch {
        Start-Sleep -Seconds 6
      }
    }
    if ($okdl) { $local += "img/$file"; $n++ }
    Start-Sleep -Milliseconds 900
  }
  $manifest["$id"] = $local
  "$id -> $($local.Count) image(s)"
}
$manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $dir "manifest.json") -Encoding utf8
"DONE. Manifest written."