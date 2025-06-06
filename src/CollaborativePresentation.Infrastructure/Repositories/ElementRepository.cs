using Microsoft.EntityFrameworkCore;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Data;

namespace CollaborativePresentation.Infrastructure.Repositories;

public class ElementRepository : GenericRepository<Element>, IElementRepository
{
    public ElementRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Element>> GetBySlideIdAsync(Guid slideId)
    {
        return await _dbSet
            .Where(e => e.SlideId == slideId)
            .OrderBy(e => e.ZIndex)
            .ToListAsync();
    }

    public async Task<IEnumerable<Element>> GetBySlideIdsAsync(IEnumerable<Guid> slideIds)
    {
        return await _dbSet
            .Where(e => slideIds.Contains(e.SlideId))
            .OrderBy(e => e.SlideId)
            .ThenBy(e => e.ZIndex)
            .ToListAsync();
    }

    public async Task<int> GetMaxZIndexBySlideIdAsync(Guid slideId)
    {
        var elements = await _dbSet
            .Where(e => e.SlideId == slideId)
            .ToListAsync();

        return elements.Any() ? elements.Max(e => e.ZIndex) : 0;
    }

    public async Task DeleteBySlideIdAsync(Guid slideId)
    {
        var elements = await _dbSet
            .Where(e => e.SlideId == slideId)
            .ToListAsync();

        _dbSet.RemoveRange(elements);
    }
}