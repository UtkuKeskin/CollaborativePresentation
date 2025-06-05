namespace CollaborativePresentation.Core.Entities;

public class Element : BaseEntity
{
    public Guid SlideId { get; set; }
    public ElementType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public int ZIndex { get; set; }
    public string? Properties { get; set; }

    public Slide Slide { get; set; } = null!;
}

public enum ElementType
{
    Text,
    Shape,
    Image,
    Line,
    Arrow
}