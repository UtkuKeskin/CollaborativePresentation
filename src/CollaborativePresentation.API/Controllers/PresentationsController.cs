using Microsoft.AspNetCore.Mvc;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Infrastructure.Services;

namespace CollaborativePresentation.API.Controllers;

public class PresentationsController : BaseApiController
{
    private readonly IPresentationService _presentationService;

    public PresentationsController(IPresentationService presentationService)
    {
        _presentationService = presentationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PresentationListDto>>> GetAll()
    {
        var presentations = await _presentationService.GetAllAsync();
        return Ok(presentations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PresentationDto>> GetById(Guid id)
    {
        var presentation = await _presentationService.GetByIdAsync(id);
        if (presentation == null)
            return NotFound();

        return Ok(presentation);
    }

    [HttpPost]
    public async Task<ActionResult<PresentationDto>> Create([FromBody] CreatePresentationDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var presentation = await _presentationService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = presentation.Id }, presentation);
    }

    [HttpPost("{id}/join")]
    public async Task<ActionResult<ConnectionInfoDto>> Join(Guid id, [FromBody] JoinPresentationDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var connectionId = Guid.NewGuid().ToString();
        var connectionInfo = await _presentationService.JoinPresentationAsync(id, dto, connectionId);
        
        if (connectionInfo == null)
            return BadRequest("Cannot join presentation. Nickname may be in use or presentation not found.");

        return Ok(connectionInfo);
    }
}