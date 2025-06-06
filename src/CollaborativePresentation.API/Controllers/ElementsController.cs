using Microsoft.AspNetCore.Mvc;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Infrastructure.Services;

namespace CollaborativePresentation.API.Controllers;

public class ElementsController : BaseApiController
{
    private readonly IElementSyncService _elementService;

    public ElementsController(IElementSyncService elementService)
    {
        _elementService = elementService;
    }

    [HttpGet("slide/{slideId}")]
    public async Task<ActionResult<IEnumerable<ElementDto>>> GetBySlideId(Guid slideId)
    {
        var elements = await _elementService.GetElementsBySlideIdAsync(slideId);
        return Ok(elements);
    }

    [HttpPost("slide/{slideId}")]
    public async Task<ActionResult<ElementDto>> CreateElement(Guid slideId, [FromBody] CreateUpdateElementDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var element = await _elementService.CreateElementAsync(slideId, dto);
        if (element == null)
            return NotFound("Slide not found");

        return Ok(element);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ElementDto>> UpdateElement(Guid id, [FromBody] CreateUpdateElementDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var element = await _elementService.UpdateElementAsync(id, dto);
        if (element == null)
            return NotFound();

        return Ok(element);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteElement(Guid id)
    {
        var result = await _elementService.DeleteElementAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}