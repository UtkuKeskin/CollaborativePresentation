using Microsoft.Extensions.DependencyInjection;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Repositories;
using CollaborativePresentation.Infrastructure.Services;

namespace CollaborativePresentation.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Register repositories
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IPresentationRepository, PresentationRepository>();
        services.AddScoped<ISlideRepository, SlideRepository>();
        services.AddScoped<IElementRepository, ElementRepository>();
        services.AddScoped<IActiveUserRepository, ActiveUserRepository>();
        
        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Register services
        services.AddScoped<IPresentationService, PresentationService>();
        services.AddScoped<IUserSessionService, UserSessionService>();
        services.AddScoped<IElementSyncService, ElementSyncService>();
        
        // Register AutoMapper
        services.AddAutoMapper(typeof(ServiceCollectionExtensions).Assembly);
        
        return services;
    }
}