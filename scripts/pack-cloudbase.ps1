Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = Join-Path $env:USERPROFILE 'Documents\deepseek-harness\default-workspace\whale-tv\cloudbase\functions\app'
$dst = Join-Path $env:USERPROFILE 'Desktop\cloudbase-app.zip'

if (-not (Test-Path (Join-Path $src 'public\app.html'))) {
    Write-Host "缺少 cloudbase\functions\app\public，先运行 node scripts\sync-cloudbase.mjs" -ForegroundColor Yellow
    exit 1
}

if (Test-Path $dst) { Remove-Item $dst -Force }

$zip = [System.IO.Compression.ZipFile]::Open($dst, 'Create')
try {
    Get-ChildItem $src -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally {
    $zip.Dispose()
}

$z = [System.IO.Compression.ZipFile]::OpenRead($dst)
"条目数: $($z.Entries.Count)"
"含反斜杠条目: " + (($z.Entries | Where-Object { $_.FullName -match '\\' }).Count)
$z.Entries | Select-Object -First 6 FullName | Format-Table -AutoSize
$z.Dispose()
"输出: $dst"
"体积: {0:N2} MB" -f ((Get-Item $dst).Length / 1MB)
