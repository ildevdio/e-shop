if (Test-Path obj) { Remove-Item -Recurse -Force obj -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500 }
if (Test-Path bin) { Remove-Item -Recurse -Force bin -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500 }
New-Item -ItemType Directory -Force -Path obj\Debug\net10.0\staticwebassets -ErrorAction SilentlyContinue | Out-Null
dotnet build -q && dotnet bin\Debug\net10.0\Multigrao.Api.dll --urls "http://localhost:5050"
