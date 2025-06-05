namespace CollaborativePresentation.Core.DTOs;
public class SlideDto
{
    public Guid Id { get; set; }
    public Guid PresentationId { get; set; }
    public int Order { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BackgroundImage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ElementDto> Elements { get; set; } = new();
}
public class CreateSlideDto
{
    public Guid PresentationId { get; set; }
    public string? BackgroundColor { get; set; }
}
public class UpdateSlideDto
{
    public int? Order { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BackgroundImage { get; set; }
}