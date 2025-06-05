using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Core.Interfaces;

public interface IPresentationRepository : IGenericRepository<Presentation>
{
    Task<Presentation?> GetByIdWithSlidesAsync(Guid id);
    Task<Presentation?> GetByIdWithUsersAsync(Guid id);
    Task<Presentation?> GetByIdWithAllDetailsAsync(Guid id);
    Task<IEnumerable<Presentation>> GetAllWithUsersAsync();
    Task<IEnumerable<Presentation>> GetActivePresentationsAsync();
    Task<bool> IsTitleUniqueAsync(string title);
}