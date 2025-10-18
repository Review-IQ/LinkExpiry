using LinkExpiry.API.Data.Repositories;
using LinkExpiry.API.Models.Entities;

namespace LinkExpiry.API.Data;

/// <summary>
/// Unit of Work pattern for managing transactions
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Link> Links { get; }
    IRepository<Click> Clicks { get; }

    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
