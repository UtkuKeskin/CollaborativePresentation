using AutoMapper;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;

namespace CollaborativePresentation.Infrastructure.Services;

public interface IElementSyncService
{
    Task<ElementDto?> CreateElementAsync(Guid slideId, CreateUpdateElementDto dto);
    Task<ElementDto?> UpdateElementAsync(Guid elementId, CreateUpdateElementDto dto);
    Task<bool> DeleteElementAsync(Guid elementId);
    Task<IEnumerable<ElementDto>> GetElementsBySlideIdAsync(Guid slideId);
    Task<int> GetNextZIndexAsync(Guid slideId);
}

public class ElementSyncService : IElementSyncService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ElementSyncService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ElementDto?> CreateElementAsync(Guid slideId, CreateUpdateElementDto dto)
    {
        var slide = await _unitOfWork.Slides.GetByIdAsync(slideId);
        if (slide == null) return null;

        var element = _mapper.Map<Element>(dto);
        element.SlideId = slideId;
        
        if (element.ZIndex == 0)
        {
            element.ZIndex = await GetNextZIndexAsync(slideId);
        }

        await _unitOfWork.Elements.AddAsync(element);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ElementDto>(element);
    }

    public async Task<ElementDto?> UpdateElementAsync(Guid elementId, CreateUpdateElementDto dto)
    {
        var element = await _unitOfWork.Elements.GetByIdAsync(elementId);
        if (element == null) return null;

        element.Type = dto.Type;
        element.Content = dto.Content;
        element.PositionX = dto.PositionX;
        element.PositionY = dto.PositionY;
        element.Width = dto.Width;
        element.Height = dto.Height;
        element.ZIndex = dto.ZIndex;
        element.Properties = dto.Properties;

        _unitOfWork.Elements.Update(element);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ElementDto>(element);
    }

    public async Task<bool> DeleteElementAsync(Guid elementId)
    {
        var element = await _unitOfWork.Elements.GetByIdAsync(elementId);
        if (element == null) return false;

        _unitOfWork.Elements.Remove(element);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<ElementDto>> GetElementsBySlideIdAsync(Guid slideId)
    {
        var elements = await _unitOfWork.Elements.GetBySlideIdAsync(slideId);
        return _mapper.Map<IEnumerable<ElementDto>>(elements);
    }

    public async Task<int> GetNextZIndexAsync(Guid slideId)
    {
        var maxZIndex = await _unitOfWork.Elements.GetMaxZIndexBySlideIdAsync(slideId);
        return maxZIndex + 1;
    }
}