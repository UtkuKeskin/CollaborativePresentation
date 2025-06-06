using Microsoft.EntityFrameworkCore;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Data;

namespace CollaborativePresentation.Infrastructure.Repositories;

public class ActiveUserRepository : GenericRepository<ActiveUser>, IActiveUserRepository
{
    public ActiveUserRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ActiveUser?> GetByConnectionIdAsync(string connectionId)
    {
        return await _dbSet
            .Include(u => u.Presentation)
            .FirstOrDefaultAsync(u => u.ConnectionId == connectionId);
    }

    public async Task<IEnumerable<ActiveUser>> GetByPresentationIdAsync(Guid presentationId)
    {
        return await _dbSet
            .Where(u => u.PresentationId == presentationId)
            .OrderBy(u => u.JoinedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ActiveUser>> GetConnectedUsersByPresentationIdAsync(Guid presentationId)
    {
        return await _dbSet
            .Where(u => u.PresentationId == presentationId && u.IsConnected)
            .OrderBy(u => u.JoinedAt)
            .ToListAsync();
    }

    public async Task<bool> IsNicknameInUseAsync(Guid presentationId, string nickname)
    {
        return await _dbSet
            .AnyAsync(u => u.PresentationId == presentationId && 
                          u.Nickname.ToLower() == nickname.ToLower() && 
                          u.IsConnected);
    }

    public async Task DisconnectUserAsync(string connectionId)
    {
        var user = await _dbSet.FirstOrDefaultAsync(u => u.ConnectionId == connectionId);
        if (user != null)
        {
            user.IsConnected = false;
            user.LastActivityAt = DateTime.UtcNow;
            _dbSet.Update(user);
        }
    }

    public async Task DisconnectInactiveUsersAsync(TimeSpan inactivityThreshold)
    {
        var cutoffTime = DateTime.UtcNow.Subtract(inactivityThreshold);
        var inactiveUsers = await _dbSet
            .Where(u => u.IsConnected && u.LastActivityAt < cutoffTime)
            .ToListAsync();

        foreach (var user in inactiveUsers)
        {
            user.IsConnected = false;
        }

        _dbSet.UpdateRange(inactiveUsers);
    }

    public async Task<int> GetActiveUserCountAsync(Guid presentationId)
    {
        return await _dbSet
            .CountAsync(u => u.PresentationId == presentationId && u.IsConnected);
    }
}