using Microsoft.AspNetCore.SignalR;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Infrastructure.Services;
using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.API.Hubs;

public class PresentationHub : Hub
{
    private readonly IPresentationService _presentationService;
    private readonly IUserSessionService _userSessionService;
    private readonly IElementSyncService _elementService;
    private readonly ILogger<PresentationHub> _logger;

    public PresentationHub(
        IPresentationService presentationService,
        IUserSessionService userSessionService,
        IElementSyncService elementService,
        ILogger<PresentationHub> logger)
    {
        _presentationService = presentationService;
        _userSessionService = userSessionService;
        _elementService = elementService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");

        var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
        if (user != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, user.PresentationId.ToString());

            await _userSessionService.DisconnectUserAsync(Context.ConnectionId);

            await Clients.Group(user.PresentationId.ToString()).SendAsync("UserDisconnected", user);

            var updatedUsers = await _userSessionService.GetUsersByPresentationIdAsync(user.PresentationId);
            await Clients.Group(user.PresentationId.ToString()).SendAsync("UsersUpdated", updatedUsers);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<HubResponse<ConnectionInfoDto>> JoinPresentation(Guid presentationId, JoinPresentationDto dto)
    {
        try
        {
            _logger.LogInformation($"JoinPresentation called - PresentationId: {presentationId}, Nickname: {dto.Nickname}, ConnectionId: {Context.ConnectionId}");

            var existingUser = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (existingUser != null)
            {
                if (existingUser.PresentationId == presentationId)
                {
                    var existingConnectionInfo = new ConnectionInfoDto
                    {
                        ConnectionId = Context.ConnectionId,
                        PresentationId = presentationId,
                        User = existingUser
                    };

                    var existingUsers = await _userSessionService.GetUsersByPresentationIdAsync(presentationId);
                    await Clients.Caller.SendAsync("UsersUpdated", existingUsers);

                    return HubResponse<ConnectionInfoDto>.CreateSuccess(existingConnectionInfo, "Already joined this presentation");
                }

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, existingUser.PresentationId.ToString());
                await _userSessionService.DisconnectUserAsync(Context.ConnectionId);
                await Clients.Group(existingUser.PresentationId.ToString()).SendAsync("UserLeft", existingUser);

                var oldPresentationUsers = await _userSessionService.GetUsersByPresentationIdAsync(existingUser.PresentationId);
                await Clients.Group(existingUser.PresentationId.ToString()).SendAsync("UsersUpdated", oldPresentationUsers);
            }

            var connectionInfo = await _presentationService.JoinPresentationAsync(
                presentationId, dto, Context.ConnectionId);

            if (connectionInfo == null)
            {
                return HubResponse<ConnectionInfoDto>.CreateError(
                    "Cannot join presentation. Nickname may be in use or presentation not found.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, presentationId.ToString());

            var users = await _userSessionService.GetUsersByPresentationIdAsync(presentationId);
            _logger.LogInformation($"Active users count: {users.Count()}");

            await Clients.OthersInGroup(presentationId.ToString())
                .SendAsync("UserJoined", connectionInfo.User);

            await Clients.Group(presentationId.ToString()).SendAsync("UsersUpdated", users);

            _logger.LogInformation("UsersUpdated event sent to all users in group");

            return HubResponse<ConnectionInfoDto>.CreateSuccess(connectionInfo, "Successfully joined presentation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining presentation");
            return HubResponse<ConnectionInfoDto>.CreateError("An error occurred while joining the presentation");
        }
    }

    public async Task LeavePresentation()
    {
        var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
        if (user != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, user.PresentationId.ToString());
            await _userSessionService.DisconnectUserAsync(Context.ConnectionId);
            await Clients.OthersInGroup(user.PresentationId.ToString()).SendAsync("UserLeft", user);

            var updatedUsers = await _userSessionService.GetUsersByPresentationIdAsync(user.PresentationId);
            await Clients.Group(user.PresentationId.ToString()).SendAsync("UsersUpdated", updatedUsers);
        }
    }

    public async Task<HubResponse<ElementDto>> UpdateElement(ElementUpdateDto updateDto)
    {
        try
        {
            _logger.LogInformation($"UpdateElement called - SlideId: {updateDto.SlideId}, ElementId: {updateDto.ElementId}, ConnectionId: {Context.ConnectionId}");

            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
            {
                _logger.LogWarning($"User not found for connection: {Context.ConnectionId}");
                return HubResponse<ElementDto>.CreateError("User not found");
            }

            _logger.LogInformation($"User info - Id: {user.Id}, Nickname: {user.Nickname}, PresentationId: {user.PresentationId}");

            var canEdit = await _presentationService.CanUserEditAsync(user.PresentationId, user.Id.ToString());
            if (!canEdit)
            {
                _logger.LogWarning($"User {user.Nickname} does not have permission to edit");
                return HubResponse<ElementDto>.CreateError("You don't have permission to edit");
            }

            ElementDto? element;
            
            if (updateDto.ElementId == Guid.Empty || updateDto.ElementId == default(Guid))
            {
                _logger.LogInformation($"Creating new element on slide {updateDto.SlideId}");
                element = await _elementService.CreateElementAsync(updateDto.SlideId, updateDto.Data);
            }
            else
            {
                _logger.LogInformation($"Updating existing element {updateDto.ElementId}");
                element = await _elementService.UpdateElementAsync(updateDto.ElementId, updateDto.Data);
            }

            if (element == null)
            {
                _logger.LogError("Failed to create/update element");
                return HubResponse<ElementDto>.CreateError("Failed to update element");
            }

            await _userSessionService.UpdateUserActivityAsync(Context.ConnectionId);

            _logger.LogInformation($"Sending ElementUpdated to group: {user.PresentationId.ToString()}");

            await Clients.Group(user.PresentationId.ToString()).SendAsync("ElementUpdated", new
            {
                element,
                updatedBy = user.Nickname,
                slideId = updateDto.SlideId
            });

            _logger.LogInformation($"ElementUpdated event sent to group {user.PresentationId.ToString()}");

            _logger.LogInformation($"Element {element.Id} successfully updated/created and broadcast to group");

            return HubResponse<ElementDto>.CreateSuccess(element);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating element");
            return HubResponse<ElementDto>.CreateError($"An error occurred while updating the element: {ex.Message}");
        }
    }

    public async Task<HubResponse<bool>> DeleteElement(Guid elementId)
    {
        try
        {
            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
                return HubResponse<bool>.CreateError("User not found");

            var canEdit = await _presentationService.CanUserEditAsync(user.PresentationId, user.Id.ToString());
            if (!canEdit)
                return HubResponse<bool>.CreateError("You don't have permission to delete");

            var result = await _elementService.DeleteElementAsync(elementId);
            if (!result)
                return HubResponse<bool>.CreateError("Element not found");

            await Clients.Group(user.PresentationId.ToString()).SendAsync("ElementDeleted", elementId);

            return HubResponse<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting element");
            return HubResponse<bool>.CreateError("An error occurred while deleting the element");
        }
    }

    public async Task<HubResponse<bool>> ChangeUserRole(ChangeUserRoleDto dto)
    {
        try
        {
            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
                return HubResponse<bool>.CreateError("User not found");

            var result = await _userSessionService.ChangeUserRoleAsync(dto, user.Id.ToString());
            if (!result)
                return HubResponse<bool>.CreateError("Cannot change role. You must be the creator.");

            var users = await _userSessionService.GetUsersByPresentationIdAsync(user.PresentationId);

            await Clients.Group(user.PresentationId.ToString()).SendAsync("UsersUpdated", users);

            return HubResponse<bool>.CreateSuccess(true, "Role changed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing user role");
            return HubResponse<bool>.CreateError("An error occurred while changing the role");
        }
    }

    public async Task<HubResponse<SlideDto>> AddSlide(Guid presentationId)
    {
        try
        {
            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
                return HubResponse<SlideDto>.CreateError("User not found");

            if (user.Role != UserRole.Creator)
                return HubResponse<SlideDto>.CreateError("Only the creator can add slides");

            var slide = await _presentationService.AddSlideAsync(presentationId);

            await Clients.Group(presentationId.ToString()).SendAsync("SlideAdded", slide);

            return HubResponse<SlideDto>.CreateSuccess(slide);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding slide");
            return HubResponse<SlideDto>.CreateError("An error occurred while adding the slide");
        }
    }

    public async Task<HubResponse<bool>> DeleteSlide(Guid slideId)
    {
        try
        {
            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
                return HubResponse<bool>.CreateError("User not found");

            var result = await _presentationService.DeleteSlideAsync(slideId, user.Id.ToString());
            if (!result)
                return HubResponse<bool>.CreateError("Cannot delete slide. You must be the creator or it's the last slide.");

            await Clients.Group(user.PresentationId.ToString()).SendAsync("SlideDeleted", slideId);

            return HubResponse<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slide");
            return HubResponse<bool>.CreateError("An error occurred while deleting the slide");
        }
    }
    
    public async Task<string> GetConnectionInfo()
    {
        var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
        return $"ConnectionId: {Context.ConnectionId}, User: {user?.Nickname}, PresentationId: {user?.PresentationId}";
    }
}