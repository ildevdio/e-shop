dotnet build --force 2>&1
if ($LASTEXITCODE -eq 0) { dotnet bin\Debug\net10.0\Multigrao.Api.dll --urls "http://localhost:5050" }
