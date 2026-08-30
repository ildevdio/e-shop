using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Multigrao.Api.Data;
using Multigrao.Api.Hubs;
using System.Net;
using System.Text;
using System.Threading.RateLimiting;

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
builder.Services.AddScoped<Multigrao.Api.Services.EmailService>();
builder.Services.AddScoped<Multigrao.Api.Services.WhatsAppService>();
builder.Services.AddScoped<Multigrao.Api.Services.ChatbotService>();
builder.Services.AddHostedService<Multigrao.Api.Services.CarrinhoAbandonadoService>();
builder.Services.AddHttpClient();

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DB_CONNECTION_STRING is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.CommandTimeout(90);
    }));

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

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.ValueLengthLimit = 512 * 1024;
    options.MultipartBodyLengthLimit = 20 * 1024 * 1024;
});

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("fixed-ip", httpContext =>
    {
        var remoteIp = httpContext.Connection.RemoteIpAddress;

        if (remoteIp == null)
            return RateLimitPartition.GetNoLimiter(IPAddress.None.ToString());

        if (IPAddress.IsLoopback(remoteIp))
            return RateLimitPartition.GetNoLimiter(remoteIp.ToString());

        var partition = $"{remoteIp}";
        return RateLimitPartition.GetFixedWindowLimiter(partition, _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
        });
    });

    options.AddPolicy("auth", httpContext =>
    {
        var remoteIp = httpContext.Connection.RemoteIpAddress;
        var key = remoteIp?.ToString() ?? "unknown";

        if (remoteIp != null && IPAddress.IsLoopback(remoteIp))
            return RateLimitPartition.GetNoLimiter(key);

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
        });
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 20 * 1024 * 1024;
    options.Limits.MaxRequestHeadersTotalSize = 32 * 1024;
    options.Limits.MaxRequestLineSize = 8 * 1024;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
    options.Limits.MinRequestBodyDataRate = new Microsoft.AspNetCore.Server.Kestrel.Core.MinDataRate(100, TimeSpan.FromSeconds(10));
    options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(60);
});

if (builder.Environment.IsDevelopment())
    builder.WebHost.UseUrls("http://0.0.0.0:5050");

var app = builder.Build();

app.UseResponseCompression();

app.UseHttpsRedirection();

app.UseMiddleware<Multigrao.Api.Middlewares.SecurityHeadersMiddleware>();

app.UseCors();

app.UseMiddleware<Multigrao.Api.Middlewares.ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
try
{
    // Bounded no tempo para não ficar "carregando infinito" caso o banco esteja
    // inacessível ou uma migração fique bloqueada por lock no PostgreSQL.
    using var migrateCts = new CancellationTokenSource(TimeSpan.FromSeconds(120));
    db.Database.MigrateAsync(migrateCts.Token).GetAwaiter().GetResult();
}
catch (OperationCanceledException)
{
    throw new InvalidOperationException(
        "A migração do banco de dados excedeu o tempo limite (120s) durante a inicialização. " +
        "Verifique se o PostgreSQL está acessível e se não há locks pendentes nas tabelas.", null);
}

app.UseStaticFiles();

app.UseRateLimiter();

app.UseAuthentication();
app.UseMiddleware<Multigrao.Api.Middlewares.TenantMiddleware>();
app.UseAuthorization();

app.MapControllers().RequireRateLimiting("fixed-ip");
app.MapHub<Multigrao.Api.Hubs.AppHub>("/hubs/app").RequireRateLimiting("fixed-ip");

app.Run();
