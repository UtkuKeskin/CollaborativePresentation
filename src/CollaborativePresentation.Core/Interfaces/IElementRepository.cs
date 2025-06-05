using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Core.Interfaces;

public interface IElementRepository : IGenericRepository<Element>
{
    Task<IEnumerable<Element>> GetBySlideIdAsync(Guid slideId);
    Task<IEnumerable<Element>> GetBySlideIdsAsync(IEnumerable<Guid> slideIds);
    Task<int> GetMaxZIndexBySlideIdAsync(Guid slideId);
    Task DeleteBySlideIdAsync(Guid slideId);
}