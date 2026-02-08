using AutoMapper;
using Helium.Application.Common.Extensions;
using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.ChargingEntries;
using Helium.Domain.Entities;

namespace Helium.Application.Services;

public class ChargingEntryService : IChargingEntryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ChargingEntryService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ChargingEntryDto> CreateAsync(ChargingEntryCreateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = _mapper.Map<ChargingEntry>(dto);
        entity.Id = Guid.NewGuid();

        await _unitOfWork.Repository<ChargingEntry>().AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ChargingEntryDto>(entity);
    }

    public async Task<ChargingEntryDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.Repository<ChargingEntry>().GetByIdAsync(id, cancellationToken);
        return entity is null ? null : _mapper.Map<ChargingEntryDto>(entity);
    }

    public async Task<PagedResult<ChargingEntryDto>> GetPagedAsync(Guid vehicleId, PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var chargingQuery = _unitOfWork.Repository<ChargingEntry>()
            .Query()
            .Where(c => c.VehicleId == vehicleId);

        chargingQuery = ApplySorting(chargingQuery, query);
        var paged = chargingQuery.ToPagedResult(query);

        return await Task.FromResult(new PagedResult<ChargingEntryDto>
        {
            Items = paged.Items.Select(_mapper.Map<ChargingEntryDto>).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        });
    }

    public async Task UpdateAsync(Guid id, ChargingEntryUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<ChargingEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException("Charging entry not found.");
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        repo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<ChargingEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return;
        }

        repo.Remove(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<ChargingEntry> ApplySorting(IQueryable<ChargingEntry> query, PaginationQuery pagination)
    {
        var sortBy = pagination.SortBy?.ToLowerInvariant();
        var desc = pagination.SortDirection == SortDirection.Desc;

        return sortBy switch
        {
            "date" => desc ? query.OrderByDescending(c => c.Date) : query.OrderBy(c => c.Date),
            "odometer" => desc ? query.OrderByDescending(c => c.OdometerReadingKm) : query.OrderBy(c => c.OdometerReadingKm),
            _ => desc ? query.OrderByDescending(c => c.Date) : query.OrderBy(c => c.Date)
        };
    }
}
