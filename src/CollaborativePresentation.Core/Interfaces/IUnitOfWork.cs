namespace CollaborativePresentation.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IPresentationRepository Presentations { get; }
    ISlideRepository Slides { get; }
    IElementRepository Elements { get; }
    IActiveUserRepository ActiveUsers { get; }
    
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}