using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Multigrao.Api.Data;
using Multigrao.Api.Hubs;
using System.Text;

var envFilePath = Path.Combine(AppContext.BaseDirectory, ".env");
if (!File.Exists(envFilePath))
    envFilePath = Path.Combine(Directory.GetCurrentDirectory(), ".env");

if (File.Exists(envFilePath))
{
    foreach (var rawLine in File.ReadAllLines(envFilePath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrEmpty(line) || line.StartsWith('#'))
            continue;

        var eqIndex = line.IndexOf('=');
        if (eqIndex <= 0)
            continue;

        var key = line[..eqIndex].Trim();
        var value = line[(eqIndex + 1)..].Trim();
        if (Environment.GetEnvironmentVariable(key) == null)
            Environment.SetEnvironmentVariable(key, value);
    }
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

builder.Services.AddScoped<Multigrao.Api.Services.IAuthService, Multigrao.Api.Services.AuthService>();
builder.Services.AddScoped<Multigrao.Api.Services.ITenantContext, Multigrao.Api.Services.TenantContext>();
builder.Services.AddHttpClient();

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DB_CONNECTION_STRING is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var configuredOrigins = (Environment.GetEnvironmentVariable("CORS_ORIGINS")
    ?? builder.Configuration["Cors:Origins"]
    ?? "http://localhost:5173").Split(',', StringSplitOptions.TrimEntries);

var hardcodedOrigins = new[] { "https://multigraos.vercel.app", "https://shop.focus-solutions.tech" };

var corsOrigins = configuredOrigins
    .Concat(hardcodedOrigins)
    .Where(o => !string.IsNullOrWhiteSpace(o))
    .Distinct()
    .ToArray();

Console.WriteLine($"[CORS] Allowed origins: {string.Join(", ", corsOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
    ?? builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT_KEY is not configured.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

if (builder.Environment.IsDevelopment())
    builder.WebHost.UseUrls("http://0.0.0.0:5050");

var app = builder.Build();

app.UseCors();

app.UseMiddleware<Multigrao.Api.Middlewares.ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
db.Database.Migrate();

app.UseStaticFiles();

app.UseAuthentication();
app.UseMiddleware<Multigrao.Api.Middlewares.TenantMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHub<Multigrao.Api.Hubs.AppHub>("/hubs/app");

app.Run();
