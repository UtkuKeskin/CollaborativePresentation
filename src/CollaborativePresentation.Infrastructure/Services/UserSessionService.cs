using AutoMapper;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;

namespace CollaborativePresentation.Infrastructure.Services;

public interface IUserSessionService
{
    Task<ActiveUserDto?> GetUserByConnectionIdAsync(string connectionId);
    Task<IEnumerable<ActiveUserDto>> GetUsersByPresentationIdAsync(Guid presentationId);
    Task<bool> DisconnectUserAsync(string connectionId);
    Task<bool> ChangeUserRoleAsync(ChangeUserRoleDto dto, string requestingUserId);
    Task UpdateUserActivityAsync(string connectionId);
    Task CleanupInactiveUsersAsync();
}

public class UserSessionService : IUserSessionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly TimeSpan _inactivityThreshold = TimeSpan.FromMinutes(5);

    public UserSessionService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ActiveUserDto?> GetUserByConnectionIdAsync(string connectionId)
    {
        var user = await _unitOfWork.ActiveUsers.GetByConnectionIdAsync(connectionId);
        return user != null ? _mapper.Map<ActiveUserDto>(user) : null;
    }

    public async Task<IEnumerable<ActiveUserDto>> GetUsersByPresentationIdAsync(Guid presentationId)
    {
        var users = await _unitOfWork.ActiveUsers.GetConnectedUsersByPresentationIdAsync(presentationId);
        return _mapper.Map<IEnumerable<ActiveUserDto>>(users);
    }

    public async Task<bool> DisconnectUserAsync(string connectionId)
    {
        await _unitOfWork.ActiveUsers.DisconnectUserAsync(connectionId);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangeUserRoleAsync(ChangeUserRoleDto dto, string requestingUserId)
    {
        var requestingUser = await _unitOfWork.ActiveUsers.GetByIdAsync(Guid.Parse(requestingUserId));
        if (requestingUser == null || requestingUser.Role != UserRole.Creator)
            return false;

        var targetUser = await _unitOfWork.ActiveUsers.GetByIdAsync(dto.UserId);
        if (targetUser == null || targetUser.PresentationId != requestingUser.PresentationId)
            return false;

        if (targetUser.Role == UserRole.Creator)
            return false;

        targetUser.Role = dto.NewRole;
        _unitOfWork.ActiveUsers.Update(targetUser);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task UpdateUserActivityAsync(string connectionId)
    {
        var user = await _unitOfWork.ActiveUsers.GetByConnectionIdAsync(connectionId);
        if (user != null)
        {
            user.LastActivityAt = DateTime.UtcNow;
            _unitOfWork.ActiveUsers.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task CleanupInactiveUsersAsync()
    {
        await _unitOfWork.ActiveUsers.DisconnectInactiveUsersAsync(_inactivityThreshold);
        await _unitOfWork.SaveChangesAsync();
    }
}