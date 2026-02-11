using AutoMapper;
using Helium.Application.Common.Extensions;
using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Vehicles;
using Helium.Domain.Entities;

namespace Helium.Application.Services;

public class VehicleService : IVehicleService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public VehicleService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<VehicleDto> CreateAsync(VehicleCreateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = _mapper.Map<Vehicle>(dto);
        entity.Id = Guid.NewGuid();

        await _unitOfWork.Repository<Vehicle>().AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<VehicleDto>(entity);
    }

    public async Task<VehicleDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.Repository<Vehicle>().GetByIdAsync(id, cancellationToken);
        return entity is null ? null : _mapper.Map<VehicleDto>(entity);
    }

    public async Task<PagedResult<VehicleDto>> GetPagedAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var vehicleQuery = _unitOfWork.Repository<Vehicle>()
            .Query()
            .Where(v => v.UserId == userId);

        vehicleQuery = ApplySorting(vehicleQuery, query);
        var paged = vehicleQuery.ToPagedResult(query);

        return await Task.FromResult(new PagedResult<VehicleDto>
        {
            Items = paged.Items.Select(_mapper.Map<VehicleDto>).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        });
    }

    public async Task UpdateAsync(Guid id, VehicleUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<Vehicle>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException("Vehicle not found.");
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        repo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<Vehicle>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return;
        }

        repo.Remove(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<Vehicle> ApplySorting(IQueryable<Vehicle> query, PaginationQuery pagination)
    {
        var sortBy = pagination.SortBy?.ToLowerInvariant();
        var desc = pagination.SortDirection == SortDirection.Desc;

        return sortBy switch
        {
            "name" => desc ? query.OrderByDescending(v => v.Name) : query.OrderBy(v => v.Name),
            "createdat" => desc ? query.OrderByDescending(v => v.CreatedAt) : query.OrderBy(v => v.CreatedAt),
            _ => desc ? query.OrderByDescending(v => v.CreatedAt) : query.OrderBy(v => v.CreatedAt)
        };
    }
}
