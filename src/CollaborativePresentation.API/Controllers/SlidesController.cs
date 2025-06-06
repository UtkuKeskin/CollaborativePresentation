using Microsoft.AspNetCore.Mvc;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Services;
using AutoMapper;

namespace CollaborativePresentation.API.Controllers;

public class SlidesController : BaseApiController
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPresentationService _presentationService;
    private readonly IMapper _mapper;

    public SlidesController(
        IUnitOfWork unitOfWork, 
        IPresentationService presentationService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _presentationService = presentationService;
        _mapper = mapper;
    }

    [HttpGet("presentation/{presentationId}")]
    public async Task<ActionResult<IEnumerable<SlideDto>>> GetByPresentationId(Guid presentationId)
    {
        var slides = await _unitOfWork.Slides.GetByPresentationIdWithElementsAsync(presentationId);
        var slideDtos = _mapper.Map<IEnumerable<SlideDto>>(slides);
        return Ok(slideDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SlideDto>> GetById(Guid id)
    {
        var slide = await _unitOfWork.Slides.GetByIdWithElementsAsync(id);
        if (slide == null)
            return NotFound();

        var slideDto = _mapper.Map<SlideDto>(slide);
        return Ok(slideDto);
    }

    [HttpPost("presentation/{presentationId}")]
    public async Task<ActionResult<SlideDto>> AddSlide(Guid presentationId)
    {
        var presentation = await _unitOfWork.Presentations.GetByIdAsync(presentationId);
        if (presentation == null)
            return NotFound("Presentation not found");

        var slide = await _presentationService.AddSlideAsync(presentationId);
        return CreatedAtAction(nameof(GetById), new { id = slide.Id }, slide);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateSlide(Guid id, [FromBody] UpdateSlideDto dto)
    {
        var slide = await _unitOfWork.Slides.GetByIdAsync(id);
        if (slide == null)
            return NotFound();

        _mapper.Map(dto, slide);
        _unitOfWork.Slides.Update(slide);
        await _unitOfWork.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSlide(Guid id, [FromHeader(Name = "X-User-Id")] string? userId)
    {
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User ID required");

        var result = await _presentationService.DeleteSlideAsync(id, userId);
        if (!result)
            return BadRequest("Cannot delete slide. You must be the creator or it's the last slide.");

        return NoContent();
    }
}