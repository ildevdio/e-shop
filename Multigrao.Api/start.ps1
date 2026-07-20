if (Test-Path obj) { Remove-Item -Recurse -Force obj -ErrorAction SilentlyContinue }
if (Test-Path bin) { Remove-Item -Recurse -Force bin -ErrorAction SilentlyContinue }
dotnet build -q && dotnet bin\Debug\net10.0\Multigrao.Api.dll --urls "http://localhost:5050"
