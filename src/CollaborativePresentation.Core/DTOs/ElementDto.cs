using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Core.DTOs;
public class ElementDto
{
    public Guid Id { get; set; }
    public Guid SlideId { get; set; }
    public ElementType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public int ZIndex { get; set; }
    public string? Properties { get; set; }
    public DateTime UpdatedAt { get; set; }
}
public class CreateUpdateElementDto
{
    public ElementType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public int ZIndex { get; set; }
    public string? Properties { get; set; }
}
public class ElementUpdateDto
{
    public Guid ElementId { get; set; }
    public Guid SlideId { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
    public CreateUpdateElementDto Data { get; set; } = null!;
}