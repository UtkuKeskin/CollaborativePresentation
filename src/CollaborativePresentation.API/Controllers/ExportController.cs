using Microsoft.AspNetCore.Mvc;
using CollaborativePresentation.Infrastructure.Services;

namespace CollaborativePresentation.API.Controllers;

public class ExportController : BaseApiController
{
    private readonly IPdfService _pdfService;
    private readonly ILogger<ExportController> _logger;

    public ExportController(IPdfService pdfService, ILogger<ExportController> logger)
    {
        _pdfService = pdfService;
        _logger = logger;
    }

    [HttpGet("presentation/{id}/pdf")]
    public async Task<IActionResult> ExportPresentationToPdf(Guid id)
    {
        try
        {
            _logger.LogInformation($"Exporting presentation {id} to PDF");
            
            var pdfBytes = await _pdfService.GeneratePresentationPdfAsync(id);
            
            var fileName = $"presentation_{id}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";
            
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, $"Presentation {id} not found");
            return NotFound(new { message = "Presentation not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error exporting presentation {id} to PDF");
            return StatusCode(500, new { message = "An error occurred while generating the PDF" });
        }
    }
}