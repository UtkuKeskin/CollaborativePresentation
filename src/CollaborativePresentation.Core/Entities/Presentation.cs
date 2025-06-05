namespace CollaborativePresentation.Core.Entities;

public class Presentation : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string CreatorNickname { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public ICollection<Slide> Slides { get; set; } = new List<Slide>();
    public ICollection<ActiveUser> ActiveUsers { get; set; } = new List<ActiveUser>();
}