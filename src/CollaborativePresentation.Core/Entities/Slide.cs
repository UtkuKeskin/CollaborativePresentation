namespace CollaborativePresentation.Core.Entities;

public class Slide : BaseEntity
{
    public Guid PresentationId { get; set; }
    public int Order { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BackgroundImage { get; set; }
    
    // Navigation properties
    public Presentation Presentation { get; set; } = null!;
    public ICollection<Element> Elements { get; set; } = new List<Element>();
}