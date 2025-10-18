using LinkExpiry.API.Data;
using LinkExpiry.API.Middleware;
using LinkExpiry.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// LOGGING - Serilog
// ============================================
builder.Host.UseSerilog((context, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration);
});

// ============================================
// DATABASE - PostgreSQL with Entity Framework Core
// ============================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());
});

// ============================================
// DEPENDENCY INJECTION - Services
// ============================================
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// GeoIP Service - Use real service if database exists, otherwise use mock
var geoIpDbPath = builder.Configuration["GeoIP:DatabasePath"];
if (!string.IsNullOrEmpty(geoIpDbPath) && File.Exists(geoIpDbPath))
{
    builder.Services.AddSingleton<IGeoIPService, GeoIPService>();
    Log.Information("GeoIP service registered with database: {Path}", geoIpDbPath);
}
else
{
    builder.Services.AddSingleton<IGeoIPService, MockGeoIPService>();
    Log.Warning("GeoIP database not found at '{Path}'. Using MockGeoIPService for development.", geoIpDbPath ?? "null");
}

builder.Services.AddScoped<ShortCodeGenerator>(); // Changed from Singleton to Scoped

// ============================================
// AUTHENTICATION - JWT Bearer
// ============================================
var jwtSecretKey = builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey not configured");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"];
var jwtAudience = builder.Configuration["JwtSettings:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ClockSkew = TimeSpan.Zero // No tolerance for expired tokens
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                context.Response.Headers["Token-Expired"] = "true";
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ============================================
// CORS - Allow frontend origin
// ============================================
var frontendUrl = builder.Configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // In development, allow any origin for easier testing
            policy.SetIsOriginAllowed(origin => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // In production, restrict to specific frontend URL
            policy.WithOrigins(frontendUrl)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// ============================================
// SESSION - For password-protected links
// ============================================
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.None; // Allow cross-origin requests
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Require HTTPS
});

// ============================================
// CONTROLLERS & API
// ============================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ============================================
// SWAGGER - API Documentation
// ============================================
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "LinkExpiry API",
        Version = "v1",
        Description = "API for LinkExpiry - Create expiring links with automatic expiration",
        Contact = new OpenApiContact
        {
            Name = "LinkExpiry Support",
            Email = "support@linkexpiry.com"
        }
    });

    // Add JWT authentication to Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {your token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================
// HEALTH CHECKS
// ============================================
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "database");

// ============================================
// BUILD APPLICATION
// ============================================
var app = builder.Build();

// ============================================
// MIDDLEWARE PIPELINE
// ============================================

// Global exception handling (must be first)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Development tools
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "LinkExpiry API v1");
        options.RoutePrefix = "swagger";
    });
}

// Security headers
app.UseHsts();
app.UseHttpsRedirection();

// CORS (must be before auth)
app.UseCors("AllowFrontend");

// Session (for password-protected links)
app.UseSession();

// Serilog request logging
app.UseSerilogRequestLogging();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

// Health check endpoint
app.MapHealthChecks("/health");

// Root endpoint
app.MapGet("/", () => Results.Ok(new
{
    service = "LinkExpiry API",
    version = "1.0.0",
    status = "running",
    docs = "/swagger",
    health = "/health"
}));

// ============================================
// DATABASE MIGRATION (Optional - for development)
// ============================================
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        // Ensure database is created and up to date
        dbContext.Database.Migrate();
        Log.Information("Database migrated successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Error migrating database");
    }
}

// ============================================
// STARTUP LOGGING
// ============================================
Log.Information("LinkExpiry API starting...");
Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);
Log.Information("Frontend URL: {FrontendUrl}", frontendUrl);

// ============================================
// RUN APPLICATION
// ============================================
try
{
    app.Run();
    Log.Information("LinkExpiry API stopped gracefully");
}
catch (Exception ex)
{
    Log.Fatal(ex, "LinkExpiry API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
