using AutoMapper;
using Helium.Application.Common.Extensions;
using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.FuelEntries;
using Helium.Domain.Entities;

namespace Helium.Application.Services;

public class FuelEntryService : IFuelEntryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public FuelEntryService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<FuelEntryDto> CreateAsync(FuelEntryCreateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = _mapper.Map<FuelEntry>(dto);
        entity.Id = Guid.NewGuid();

        await _unitOfWork.Repository<FuelEntry>().AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<FuelEntryDto>(entity);
    }

    public async Task<FuelEntryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.Repository<FuelEntry>().GetByIdAsync(id, cancellationToken);
        return entity is null ? null : _mapper.Map<FuelEntryDto>(entity);
    }

    public async Task<PagedResult<FuelEntryDto>> GetPagedAsync(Guid vehicleId, PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var fuelQuery = _unitOfWork.Repository<FuelEntry>()
            .Query()
            .Where(f => f.VehicleId == vehicleId);

        fuelQuery = ApplySorting(fuelQuery, query);
        var paged = fuelQuery.ToPagedResult(query);

        return await Task.FromResult(new PagedResult<FuelEntryDto>
        {
            Items = paged.Items.Select(_mapper.Map<FuelEntryDto>).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        });
    }

    public async Task UpdateAsync(Guid id, FuelEntryUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<FuelEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException("Fuel entry not found.");
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        repo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<FuelEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return;
        }

        repo.Remove(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<FuelEntry> ApplySorting(IQueryable<FuelEntry> query, PaginationQuery pagination)
    {
        var sortBy = pagination.SortBy?.ToLowerInvariant();
        var desc = pagination.SortDirection == SortDirection.Desc;

        return sortBy switch
        {
            "date" => desc ? query.OrderByDescending(f => f.Date) : query.OrderBy(f => f.Date),
            "odometer" => desc ? query.OrderByDescending(f => f.OdometerReadingKm) : query.OrderBy(f => f.OdometerReadingKm),
            _ => desc ? query.OrderByDescending(f => f.Date) : query.OrderBy(f => f.Date)
        };
    }
}
