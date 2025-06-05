namespace CollaborativePresentation.Core.Entities;

public class ActiveUser : BaseEntity
{
    public Guid PresentationId { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public bool IsConnected { get; set; }
    
    public Presentation Presentation { get; set; } = null!;
}

public enum UserRole
{
    Viewer = 0,
    Editor = 1,
    Creator = 2
}