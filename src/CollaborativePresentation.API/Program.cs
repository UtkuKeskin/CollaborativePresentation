using Microsoft.EntityFrameworkCore;
using Serilog;
using CollaborativePresentation.Infrastructure.Data;
using CollaborativePresentation.Infrastructure.Extensions;
using CollaborativePresentation.API.Extensions;
using CollaborativePresentation.API.Hubs;
using CollaborativePresentation.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.ConfigureSerilog();

try
{
    Log.Information("Starting web application");

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    
    // Add Swagger documentation
    builder.Services.AddSwaggerDocumentation();

    // Add DbContext
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Add Infrastructure services (repositories, services, AutoMapper)
    builder.Services.AddInfrastructureServices();

    // Add SignalR
    builder.Services.AddSignalR(options =>
    {
        options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    });

    // Add CORS
    builder.Services.AddCorsConfiguration(builder.Configuration);

    // Add Response Compression
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Collaborative Presentation API V1");
            c.RoutePrefix = "swagger";
        });
    }

    // Add custom middleware
    app.UseMiddleware<ErrorHandlerMiddleware>();

    // Use Serilog request logging
    app.UseSerilogRequestLogging();

    app.UseResponseCompression();

    app.UseCors("AllowReactApp");

    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<PresentationHub>("/presentationHub");

    // Health check endpoint
    app.MapGet("/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }))
        .WithName("HealthCheck")
        .WithOpenApi();
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.Database.Migrate();
        Log.Information("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while migrating the database");
    }
}

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}