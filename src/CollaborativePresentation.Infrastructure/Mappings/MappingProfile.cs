using AutoMapper;
using CollaborativePresentation.Core.DTOs;
using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Infrastructure.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Presentation, PresentationDto>()
            .ForMember(dest => dest.SlideCount, 
                opt => opt.MapFrom(src => src.Slides.Count))
            .ForMember(dest => dest.ActiveUserCount, 
                opt => opt.MapFrom(src => src.ActiveUsers.Count(u => u.IsConnected)));
        
        CreateMap<Presentation, PresentationListDto>()
            .ForMember(dest => dest.ActiveUserCount, 
                opt => opt.MapFrom(src => src.ActiveUsers.Count(u => u.IsConnected)));
        
        CreateMap<CreatePresentationDto, Presentation>();
        
        CreateMap<Slide, SlideDto>();
        CreateMap<CreateSlideDto, Slide>();
        CreateMap<UpdateSlideDto, Slide>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        
        CreateMap<Element, ElementDto>();
        CreateMap<CreateUpdateElementDto, Element>();
        
        CreateMap<ActiveUser, ActiveUserDto>();
    }
}