using Microsoft.EntityFrameworkCore.Storage;
using CollaborativePresentation.Core.Interfaces;
using CollaborativePresentation.Infrastructure.Data;

namespace CollaborativePresentation.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    private IPresentationRepository? _presentations;
    private ISlideRepository? _slides;
    private IElementRepository? _elements;
    private IActiveUserRepository? _activeUsers;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IPresentationRepository Presentations =>
        _presentations ??= new PresentationRepository(_context);

    public ISlideRepository Slides =>
        _slides ??= new SlideRepository(_context);

    public IElementRepository Elements =>
        _elements ??= new ElementRepository(_context);

    public IActiveUserRepository ActiveUsers =>
        _activeUsers ??= new ActiveUserRepository(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}