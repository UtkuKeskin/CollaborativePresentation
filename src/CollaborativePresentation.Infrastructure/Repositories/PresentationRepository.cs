using Microsoft.EntityFrameworkCore;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Data;

namespace CollaborativePresentation.Infrastructure.Repositories;

public class PresentationRepository : GenericRepository<Presentation>, IPresentationRepository
{
    public PresentationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Presentation?> GetByIdWithSlidesAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Slides.OrderBy(s => s.Order))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Presentation?> GetByIdWithUsersAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.ActiveUsers.Where(u => u.IsConnected))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Presentation?> GetByIdWithAllDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Slides.OrderBy(s => s.Order))
                .ThenInclude(s => s.Elements)
            .Include(p => p.ActiveUsers.Where(u => u.IsConnected))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Presentation>> GetAllWithUsersAsync()
    {
        return await _dbSet
            .Include(p => p.ActiveUsers.Where(u => u.IsConnected))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Presentation>> GetActivePresentationsAsync()
    {
        return await _dbSet
            .Include(p => p.ActiveUsers.Where(u => u.IsConnected))
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> IsTitleUniqueAsync(string title)
    {
        return !await _dbSet.AnyAsync(p => p.Title.ToLower() == title.ToLower());
    }
}