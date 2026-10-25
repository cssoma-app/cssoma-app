using BackendAPI.Data;
using BackendAPI.Services;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Text;
using System.Text.Json.Serialization;

// QuestPDF: licencia Community (gratuita) — requiere que la organización facture menos de
// USD 1M/año según los términos de QuestPDF (https://www.questpdf.com/license/). Si SSTerra
// Consultores supera ese umbral, esto debe cambiarse a LicenseType.Professional/Enterprise
// con la clave correspondiente en configuración.
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
// Si algún texto ingresado por el usuario (nombre, cargo, etc.) trae un carácter cuyo glifo no
// resuelve la fuente del servidor, que se muestre en blanco en el PDF en vez de tumbar toda la
// generación con un 500 — un documento con un carácter faltante es mejor que ningún documento.
QuestPDF.Settings.ThrowOnMissingTextGlyphs = false;

var builder = WebApplication.CreateBuilder(args);

// Configurar Sentry (no-op si Sentry:Dsn no está configurado)
var sentryDsn = builder.Configuration["Sentry:Dsn"];
if (!string.IsNullOrWhiteSpace(sentryDsn))
{
    builder.WebHost.UseSentry(o =>
    {
        o.Dsn = sentryDsn;
        o.TracesSampleRate = 0.1;
        o.Environment = builder.Environment.EnvironmentName;
    });
}

// Configurar Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Database=sst_saas;Username=postgres;Password=postgres");
    options.AddInterceptors(new TenantConnectionInterceptor(serviceProvider));
    options.ConfigureWarnings(w =>
    {
        w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
        w.Log(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.NavigationBaseIncludeIgnored);
    });
});

// Memory Cache, HttpContextAccessor, HttpClient & Controllers
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSwaggerGen();

// Register Custom Services (SOLID & DI)
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IOTPService, OTPService>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IDashboardCardService, DashboardCardService>();
builder.Services.AddScoped<IServicesService, ServicesService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddSingleton<IResolucion0312ComplianceValidator, Resolucion0312ComplianceValidator>();
builder.Services.AddScoped<ISgSstFunctionCatalogReader, SgSstFunctionCatalogReader>();
builder.Services.AddScoped<ISgSstResponsibleDesignationService, SgSstResponsibleDesignationService>();
builder.Services.AddScoped<ISgSstResponsibleDesignationPdfService, SgSstResponsibleDesignationPdfService>();
builder.Services.AddScoped<ISgSstBudgetPlanService, SgSstBudgetPlanService>();
builder.Services.AddScoped<ISgSstBudgetPlanPdfService, SgSstBudgetPlanPdfService>();
builder.Services.AddScoped<ISgSstBudgetPlanExcelService, SgSstBudgetPlanExcelService>();
builder.Services.AddScoped<IDocumentTemplateService, DocumentTemplateService>();
builder.Services.AddScoped<Microsoft.AspNetCore.Identity.IPasswordHasher<BackendAPI.Models.User>, Microsoft.AspNetCore.Identity.PasswordHasher<BackendAPI.Models.User>>();

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
                     ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("AuthLimit", context =>
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
});

// Configure JWT Authentication
var secretKey = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(secretKey))
{
    throw new InvalidOperationException("Jwt:Secret no está configurado. Definilo vía dotnet user-secrets (local) o la variable de entorno Jwt__Secret (staging/producción).");
}
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Solo para desarrollo / demo
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SSTerraAPI",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SSTerraApp",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SSTerra SaaS API v1");
        c.RoutePrefix = "swagger"; // La URL de acceso será /swagger
    });
}

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

// Enable Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Sembrar datos iniciales (Superadmin) y aplicar migraciones
await DatabaseInitializer.SeedDataAsync(app.Services);

try
{
    Log.Information("Starting SSTerra SaaS API...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
