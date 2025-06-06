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
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, user.Id.ToString());
            
            await _userSessionService.DisconnectUserAsync(Context.ConnectionId);
            
            await Clients.Group(user.Id.ToString()).SendAsync("UserDisconnected", user);
        }

        await base.OnDisconnectedAsync(exception);
    }
    public async Task<HubResponse<ConnectionInfoDto>> JoinPresentation(Guid presentationId, JoinPresentationDto dto)
    {
        try
        {
            var connectionInfo = await _presentationService.JoinPresentationAsync(
                presentationId, dto, Context.ConnectionId);

            if (connectionInfo == null)
            {
                return HubResponse<ConnectionInfoDto>.CreateError(
                    "Cannot join presentation. Nickname may be in use or presentation not found.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, presentationId.ToString());

            var users = await _userSessionService.GetUsersByPresentationIdAsync(presentationId);

            await Clients.OthersInGroup(presentationId.ToString())
                .SendAsync("UserJoined", connectionInfo.User);

            await Clients.Caller.SendAsync("UsersUpdated", users);

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
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, user.Id.ToString());
            await _userSessionService.DisconnectUserAsync(Context.ConnectionId);
            await Clients.OthersInGroup(user.Id.ToString()).SendAsync("UserLeft", user);
        }
    }
    public async Task<HubResponse<ElementDto>> UpdateElement(Guid slideId, ElementUpdateDto updateDto)
    {
        try
        {
            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
                return HubResponse<ElementDto>.CreateError("User not found");

            var canEdit = await _presentationService.CanUserEditAsync(user.Id, user.Id.ToString());
            if (!canEdit)
                return HubResponse<ElementDto>.CreateError("You don't have permission to edit");

            ElementDto? element;
            if (updateDto.ElementId == Guid.Empty)
            {
                element = await _elementService.CreateElementAsync(slideId, updateDto.Data);
            }
            else
            {
                element = await _elementService.UpdateElementAsync(updateDto.ElementId, updateDto.Data);
            }

            if (element == null)
                return HubResponse<ElementDto>.CreateError("Failed to update element");

            await _userSessionService.UpdateUserActivityAsync(Context.ConnectionId);

            await Clients.Group(user.Id.ToString()).SendAsync("ElementUpdated", new
            {
                element,
                updatedBy = user.Nickname,
                slideId
            });

            return HubResponse<ElementDto>.CreateSuccess(element);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating element");
            return HubResponse<ElementDto>.CreateError("An error occurred while updating the element");
        }
    }
    public async Task<HubResponse<bool>> DeleteElement(Guid elementId)
    {
        try
        {
            var user = await _userSessionService.GetUserByConnectionIdAsync(Context.ConnectionId);
            if (user == null)
                return HubResponse<bool>.CreateError("User not found");

            var canEdit = await _presentationService.CanUserEditAsync(user.Id, user.Id.ToString());
            if (!canEdit)
                return HubResponse<bool>.CreateError("You don't have permission to delete");

            var result = await _elementService.DeleteElementAsync(elementId);
            if (!result)
                return HubResponse<bool>.CreateError("Element not found");

            await Clients.Group(user.Id.ToString()).SendAsync("ElementDeleted", elementId);

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

            var users = await _userSessionService.GetUsersByPresentationIdAsync(user.Id);

            await Clients.Group(user.Id.ToString()).SendAsync("UsersUpdated", users);

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

            var canEdit = await _presentationService.CanUserEditAsync(presentationId, user.Id.ToString());
            if (!canEdit)
                return HubResponse<SlideDto>.CreateError("You don't have permission to add slides");

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

            await Clients.Group(user.Id.ToString()).SendAsync("SlideDeleted", slideId);

            return HubResponse<bool>.CreateSuccess(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slide");
            return HubResponse<bool>.CreateError("An error occurred while deleting the slide");
        }
    }
}