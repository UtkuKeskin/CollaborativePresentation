using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Core.Interfaces;

public interface ISlideRepository : IGenericRepository<Slide>
{
    Task<Slide?> GetByIdWithElementsAsync(Guid id);
    Task<IEnumerable<Slide>> GetByPresentationIdAsync(Guid presentationId);
    Task<IEnumerable<Slide>> GetByPresentationIdWithElementsAsync(Guid presentationId);
    Task<int> GetMaxOrderByPresentationIdAsync(Guid presentationId);
    Task ReorderSlidesAsync(Guid presentationId, Dictionary<Guid, int> slideOrders);
}