using AutoMapper;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Core.Entities;
using CollaborativePresentation.Core.Interfaces;

namespace CollaborativePresentation.Infrastructure.Services;

public interface IPresentationService
{
    Task<PresentationDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<PresentationListDto>> GetAllAsync();
    Task<PresentationDto> CreateAsync(CreatePresentationDto dto);
    Task<SlideDto> AddSlideAsync(Guid presentationId);
    Task<bool> DeleteSlideAsync(Guid slideId, string requestingUserId);
    Task<ConnectionInfoDto?> JoinPresentationAsync(Guid presentationId, JoinPresentationDto dto, string connectionId);
    Task<bool> CanUserEditAsync(Guid presentationId, string userId);
}

public class PresentationService : IPresentationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PresentationService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PresentationDto?> GetByIdAsync(Guid id)
    {
        var presentation = await _unitOfWork.Presentations.GetByIdWithAllDetailsAsync(id);
        return presentation != null ? _mapper.Map<PresentationDto>(presentation) : null;
    }

    public async Task<IEnumerable<PresentationListDto>> GetAllAsync()
    {
        var presentations = await _unitOfWork.Presentations.GetActivePresentationsAsync();
        return _mapper.Map<IEnumerable<PresentationListDto>>(presentations);
    }

    public async Task<PresentationDto> CreateAsync(CreatePresentationDto dto)
    {
        var presentation = _mapper.Map<Presentation>(dto);
        
        var firstSlide = new Slide
        {
            PresentationId = presentation.Id,
            Order = 1,
            BackgroundColor = "#FFFFFF"
        };
        presentation.Slides.Add(firstSlide);

        await _unitOfWork.Presentations.AddAsync(presentation);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<PresentationDto>(presentation);
    }

    public async Task<SlideDto> AddSlideAsync(Guid presentationId)
    {
        var maxOrder = await _unitOfWork.Slides.GetMaxOrderByPresentationIdAsync(presentationId);
        
        var slide = new Slide
        {
            PresentationId = presentationId,
            Order = maxOrder + 1,
            BackgroundColor = "#FFFFFF"
        };

        await _unitOfWork.Slides.AddAsync(slide);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<SlideDto>(slide);
    }

    public async Task<bool> DeleteSlideAsync(Guid slideId, string requestingUserId)
    {
        var slide = await _unitOfWork.Slides.GetByIdAsync(slideId);
        if (slide == null) return false;

        var presentation = await _unitOfWork.Presentations.GetByIdAsync(slide.PresentationId);
        if (presentation == null) return false;

        var user = await _unitOfWork.ActiveUsers.GetByIdAsync(Guid.Parse(requestingUserId));
        if (user == null || user.Role != UserRole.Creator) return false;

        var slideCount = await _unitOfWork.Slides.GetByPresentationIdAsync(slide.PresentationId);
        if (slideCount.Count() <= 1) return false;

        _unitOfWork.Slides.Remove(slide);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<ConnectionInfoDto?> JoinPresentationAsync(Guid presentationId, JoinPresentationDto dto, string connectionId)
    {
        var presentation = await _unitOfWork.Presentations.GetByIdAsync(presentationId);
        if (presentation == null || !presentation.IsActive) return null;

        if (await _unitOfWork.ActiveUsers.IsNicknameInUseAsync(presentationId, dto.Nickname))
            return null;

        var isCreator = presentation.CreatorNickname == dto.Nickname;
        var user = new ActiveUser
        {
            PresentationId = presentationId,
            Nickname = dto.Nickname,
            ConnectionId = connectionId,
            Role = isCreator ? UserRole.Creator : UserRole.Viewer,
            JoinedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            IsConnected = true
        };

        await _unitOfWork.ActiveUsers.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return new ConnectionInfoDto
        {
            ConnectionId = connectionId,
            PresentationId = presentationId,
            User = _mapper.Map<ActiveUserDto>(user)
        };
    }

    public async Task<bool> CanUserEditAsync(Guid presentationId, string userId)
    {
        var user = await _unitOfWork.ActiveUsers.GetByIdAsync(Guid.Parse(userId));
        return user != null && 
               user.PresentationId == presentationId && 
               (user.Role == UserRole.Creator || user.Role == UserRole.Editor);
    }
}