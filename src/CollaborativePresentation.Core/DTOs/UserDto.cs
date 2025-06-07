using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Core.DTOs;
public class ActiveUserDto
{
    public Guid Id { get; set; }
    public Guid PresentationId { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsConnected { get; set; }
}
public class ChangeUserRoleDto
{
    public Guid UserId { get; set; }
    public UserRole NewRole { get; set; }
}
public class UserActivityDto
{
    public Guid UserId { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public string Activity { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}