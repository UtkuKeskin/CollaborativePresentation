using Microsoft.EntityFrameworkCore;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Data;

namespace CollaborativePresentation.Infrastructure.Repositories;

public class SlideRepository : GenericRepository<Slide>, ISlideRepository
{
    public SlideRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Slide?> GetByIdWithElementsAsync(Guid id)
    {
        return await _dbSet
            .Include(s => s.Elements.OrderBy(e => e.ZIndex))
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<Slide>> GetByPresentationIdAsync(Guid presentationId)
    {
        return await _dbSet
            .Where(s => s.PresentationId == presentationId)
            .OrderBy(s => s.Order)
            .ToListAsync();
    }

    public async Task<IEnumerable<Slide>> GetByPresentationIdWithElementsAsync(Guid presentationId)
    {
        return await _dbSet
            .Include(s => s.Elements.OrderBy(e => e.ZIndex))
            .Where(s => s.PresentationId == presentationId)
            .OrderBy(s => s.Order)
            .ToListAsync();
    }

    public async Task<int> GetMaxOrderByPresentationIdAsync(Guid presentationId)
    {
        var slides = await _dbSet
            .Where(s => s.PresentationId == presentationId)
            .ToListAsync();

        return slides.Any() ? slides.Max(s => s.Order) : 0;
    }

    public async Task ReorderSlidesAsync(Guid presentationId, Dictionary<Guid, int> slideOrders)
    {
        var slides = await _dbSet
            .Where(s => s.PresentationId == presentationId)
            .ToListAsync();

        foreach (var slide in slides)
        {
            if (slideOrders.TryGetValue(slide.Id, out int newOrder))
            {
                slide.Order = newOrder;
            }
        }

        _dbSet.UpdateRange(slides);
    }
}