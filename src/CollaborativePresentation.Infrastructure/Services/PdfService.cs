using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;
using System.Text.RegularExpressions;

namespace CollaborativePresentation.Infrastructure.Services;

public interface IPdfService
{
    Task<byte[]> GeneratePresentationPdfAsync(Guid presentationId);
}

public class PdfService : IPdfService
{
    private readonly IUnitOfWork _unitOfWork;

    public PdfService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GeneratePresentationPdfAsync(Guid presentationId)
    {
        var presentation = await _unitOfWork.Presentations.GetByIdWithAllDetailsAsync(presentationId);
        if (presentation == null)
            throw new ArgumentException("Presentation not found");

        var sortedSlides = presentation.Slides.OrderBy(s => s.Order).ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(12));

                // Title Page
                page.Header()
                    .Height(3, Unit.Centimetre)
                    .Background(Colors.Blue.Lighten3)
                    .AlignCenter()
                    .AlignMiddle()
                    .Text(text =>
                    {
                        text.Span(presentation.Title).FontSize(24).Bold();
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Item().AlignCenter().Text(text =>
                        {
                            text.Span($"Created by: {presentation.CreatorNickname}").FontSize(14);
                        });
                        column.Item().AlignCenter().Text(text =>
                        {
                            text.Span($"Date: {presentation.CreatedAt:yyyy-MM-dd}").FontSize(12);
                        });
                        column.Item().PaddingTop(1, Unit.Centimetre).Text(text =>
                        {
                            text.Span($"Total Slides: {sortedSlides.Count}").FontSize(12);
                        });
                    });
            });

            foreach (var slide in sortedSlides)
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(1, Unit.Centimetre);

                    // Slide header with number
                    page.Header()
                        .Height(1, Unit.Centimetre)
                        .Row(row =>
                        {
                            row.RelativeItem().Text(text =>
                            {
                                text.Span($"Slide {slide.Order}").FontSize(10);
                            });
                            row.RelativeItem().AlignRight().Text(text =>
                            {
                                text.Span(presentation.Title).FontSize(10).Italic();
                            });
                        });

                    // Slide content
                    page.Content()
                        .Border(1)
                        .Background(string.IsNullOrEmpty(slide.BackgroundColor) ? Colors.White : slide.BackgroundColor)
                        .Padding(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            var sortedElements = slide.Elements
                                .OrderBy(e => e.PositionY)
                                .ThenBy(e => e.PositionX)
                                .ToList();

                            foreach (var element in sortedElements)
                            {
                                column.Item().PaddingBottom(0.5f, Unit.Centimetre).Element(containerElement =>
                                {
                                    switch (element.Type)
                                    {
                                        case ElementType.Text:
                                            RenderTextElement(containerElement, element);
                                            break;
                                        case ElementType.Shape:
                                        case ElementType.Arrow:
                                            RenderShapeElement(containerElement, element);
                                            break;
                                        default:
                                            containerElement.Text(text =>
                                            {
                                                text.Span($"[{element.Type}: {element.Content}]").Italic();
                                            });
                                            break;
                                    }
                                });
                            }

                            // If no elements, show placeholder
                            if (!sortedElements.Any())
                            {
                                column.Item()
                                    .AlignCenter()
                                    .AlignMiddle()
                                    .Text(text =>
                                    {
                                        text.Span("(Empty slide)").FontColor(Colors.Grey.Medium).Italic();
                                    });
                            }
                        });

                    // Page footer
                    page.Footer()
                        .Height(1, Unit.Centimetre)
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Page ").FontSize(10);
                            text.CurrentPageNumber().FontSize(10);
                            text.Span(" of ").FontSize(10);
                            text.TotalPages().FontSize(10);
                        });
                });
            }
        });

        return document.GeneratePdf();
    }

    private void RenderTextElement(IContainer container, Element element)
    {
        var processedText = ProcessMarkdown(element.Content);
        
        container.Column(column =>
        {
            foreach (var line in processedText.Split('\n'))
            {
                if (line.StartsWith("# "))
                {
                    column.Item().Text(text =>
                    {
                        text.Span(line.Substring(2)).FontSize(20).Bold();
                    });
                }
                else if (line.StartsWith("## "))
                {
                    column.Item().Text(text =>
                    {
                        text.Span(line.Substring(3)).FontSize(16).Bold();
                    });
                }
                else if (line.StartsWith("### "))
                {
                    column.Item().Text(text =>
                    {
                        text.Span(line.Substring(4)).FontSize(14).Bold();
                    });
                }
                else if (line.StartsWith("• ") || line.StartsWith("- "))
                {
                    column.Item().Row(row =>
                    {
                        row.ConstantItem(20).Text("•");
                        row.RelativeItem().Text(line.Substring(2));
                    });
                }
                else if (!string.IsNullOrWhiteSpace(line))
                {
                    column.Item().Text(line);
                }
            }
        });
    }

    private void RenderShapeElement(IContainer container, Element element)
    {
        var shapeType = "shape";
        var fillColor = "#4299e1";
        
        if (!string.IsNullOrEmpty(element.Properties))
        {
            try
            {
                var props = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, System.Text.Json.JsonElement>>(element.Properties);
                if (props != null)
                {
                    if (props.ContainsKey("shapeType"))
                        shapeType = props["shapeType"].GetString() ?? "shape";
                    if (props.ContainsKey("fill"))
                        fillColor = props["fill"].GetString() ?? "#4299e1";
                }
            }
            catch
            {
                // If parsing fails, use defaults
            }
        }

        container.Row(row =>
        {
            row.ConstantItem(30).Background(fillColor).Height(20);
            row.ConstantItem(10);
            row.RelativeItem().Text(text =>
            {
                text.Span($"{element.Type}: {shapeType}").FontSize(10).Italic();
            });
        });
    }

    private string ProcessMarkdown(string markdown)
    {
        if (string.IsNullOrEmpty(markdown)) return "";

        // Basic markdown processing
        var processed = markdown;
        
        // Bold
        processed = Regex.Replace(processed, @"\*\*([^*]+)\*\*", "$1");
        
        // Italic
        processed = Regex.Replace(processed, @"\*([^*]+)\*", "$1");
        processed = Regex.Replace(processed, @"_([^_]+)_", "$1");
        
        // Code blocks
        processed = Regex.Replace(processed, @"`([^`]+)`", "$1");
        
        // Links
        processed = Regex.Replace(processed, @"\[([^\]]+)\]\([^)]+\)", "$1");
        
        // Lists
        processed = Regex.Replace(processed, @"^[-*+]\s+", "• ", RegexOptions.Multiline);
        processed = Regex.Replace(processed, @"^\d+\.\s+", "• ", RegexOptions.Multiline);

        return processed;
    }
}