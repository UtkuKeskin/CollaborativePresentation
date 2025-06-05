using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Core.Interfaces;

public interface IActiveUserRepository : IGenericRepository<ActiveUser>
{
    Task<ActiveUser?> GetByConnectionIdAsync(string connectionId);
    Task<IEnumerable<ActiveUser>> GetByPresentationIdAsync(Guid presentationId);
    Task<IEnumerable<ActiveUser>> GetConnectedUsersByPresentationIdAsync(Guid presentationId);
    Task<bool> IsNicknameInUseAsync(Guid presentationId, string nickname);
    Task DisconnectUserAsync(string connectionId);
    Task DisconnectInactiveUsersAsync(TimeSpan inactivityThreshold);
    Task<int> GetActiveUserCountAsync(Guid presentationId);
}