namespace CollaborativePresentation.Core.DTOs;
public class PresentationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CreatorNickname { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int SlideCount { get; set; }
    public int ActiveUserCount { get; set; }
    public bool IsActive { get; set; }
}
public class PresentationListDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CreatorNickname { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ActiveUserCount { get; set; }
}
public class CreatePresentationDto
{
    public string Title { get; set; } = string.Empty;
    public string CreatorNickname { get; set; } = string.Empty;
}
public class JoinPresentationDto
{
    public string Nickname { get; set; } = string.Empty;
}