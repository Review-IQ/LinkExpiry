using LinkExpiry.API.Data.Repositories;
using LinkExpiry.API.Models.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace LinkExpiry.API.Data;

/// <summary>
/// Unit of Work implementation for transaction management
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    public IRepository<User> Users { get; }
    public IRepository<Link> Links { get; }
    public IRepository<Click> Clicks { get; }
    public IRepository<ExpiryPage> ExpiryPages { get; }
    public IRepository<ExpiryPageEmail> ExpiryPageEmails { get; }

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Users = new Repository<User>(_context);
        Links = new Repository<Link>(_context);
        Clicks = new Repository<Click>(_context);
        ExpiryPages = new Repository<ExpiryPage>(_context);
        ExpiryPageEmails = new Repository<ExpiryPageEmail>(_context);
    }

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
