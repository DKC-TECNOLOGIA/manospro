$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDirectory = Join-Path $projectRoot 'public\data'
New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null

Add-Type -AssemblyName System.Net.Http
$httpClient = [System.Net.Http.HttpClient]::new()
function Get-JsonUtf8([string]$uri) {
  $response = $httpClient.GetAsync($uri).GetAwaiter().GetResult()
  if (-not $response.IsSuccessStatusCode) { throw "A fonte respondeu HTTP $([int]$response.StatusCode)." }
  $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
  $json = [System.Text.Encoding]::UTF8.GetString($bytes)
  return ConvertFrom-Json -InputObject $json
}

# Official municipality data: IBGE Localidades API.
$brazilSource = Get-JsonUtf8 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
$brazilCities = @($brazilSource | ForEach-Object {
  $state = $_.microrregiao.mesorregiao.UF.sigla
  if (-not $state) { $state = $_.'regiao-imediata'.'regiao-intermediaria'.UF.sigla }
  if ($_.nome -and $state) { [PSCustomObject]@{ id = [string]$_.id; name = [string]$_.nome; region = [string]$state } }
})
if ($brazilCities.Count -lt 5000) { throw "A resposta do IBGE veio incompleta: $($brazilCities.Count) municípios." }

# Official locality data: Argentina Georef API (up to 5,000 results per page).
$argentinaBase = 'https://apis.datos.gob.ar/georef/api/localidades'
$argentinaCities = [System.Collections.Generic.List[object]]::new()
$start = 0
$total = 1
while ($start -lt $total) {
  $uri = "$argentinaBase`?max=5000&inicio=$start&orden=nombre&campos=id,nombre,provincia.nombre,departamento.nombre"
  $page = Get-JsonUtf8 $uri
  $total = [int]$page.total
  foreach ($locality in $page.localidades) {
    if (-not $locality.nombre) { continue }
    $province = [string]$locality.provincia.nombre
    $department = [string]$locality.departamento.nombre
    $region = if ($department -and $department -ne $locality.nombre) { "$province, $department" } else { $province }
    $argentinaCities.Add([PSCustomObject]@{ id = [string]$locality.id; name = [string]$locality.nombre; region = $region })
  }
  $start += 5000
}
if ($argentinaCities.Count -lt 4000) { throw "A resposta do GeoRef veio incompleta: $($argentinaCities.Count) localidades." }

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$brazilJson = ConvertTo-Json -InputObject $brazilCities -Depth 4 -Compress
$argentinaJson = ConvertTo-Json -InputObject @($argentinaCities) -Depth 4 -Compress
[System.IO.File]::WriteAllText((Join-Path $dataDirectory 'cities-BR.json'), $brazilJson, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $dataDirectory 'cities-AR.json'), $argentinaJson, $utf8NoBom)
Write-Output "IBGE: $($brazilCities.Count) municípios. GeoRef: $($argentinaCities.Count) localidades."
