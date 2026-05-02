using AutoMapper;
using System.Collections.Generic;
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
        var vehicle = await _unitOfWork.Repository<Vehicle>().GetByIdAsync(dto.VehicleId, cancellationToken);
        if (vehicle is null || vehicle.UserId != dto.UserId)
        {
            throw new UnauthorizedAccessException("You do not have access to this vehicle.");
        }

        var entity = _mapper.Map<ChargingEntry>(dto);
        entity.Id = Guid.NewGuid();
        entity.UserId = dto.UserId;

        await _unitOfWork.Repository<ChargingEntry>().AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<ChargingEntryDto>(entity);
    }

    public async Task<ChargingEntryDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.Repository<ChargingEntry>().GetByIdAsync(id, cancellationToken);
        if (entity is null || entity.UserId != userId)
        {
            return null;
        }

        return _mapper.Map<ChargingEntryDto>(entity);
    }

    public async Task<PagedResult<ChargingEntryDto>> GetPagedAsync(Guid userId, Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var chargingQuery = _unitOfWork.Repository<ChargingEntry>()
            .Query()
            .Where(c => c.UserId == userId);

        if (vehicleId.HasValue && vehicleId.Value != Guid.Empty)
        {
            var id = vehicleId.Value;
            chargingQuery = chargingQuery.Where(c => c.VehicleId == id);
        }

        chargingQuery = ApplySorting(chargingQuery, query);
        var paged = chargingQuery.ToPagedResult(query);

        var vehicleLookup = new Dictionary<Guid, string?>();
        var vehicleIds = paged.Items.Select(c => c.VehicleId).Distinct().ToList();
        if (vehicleIds.Count > 0)
        {
            vehicleLookup = _unitOfWork.Repository<Vehicle>().Query()
                .Where(v => vehicleIds.Contains(v.Id))
                .Select(v => new { v.Id, v.Vin })
                .ToDictionary(v => v.Id, v => v.Vin);
        }

        var dtoItems = paged.Items.Select(entry =>
        {
            var dto = _mapper.Map<ChargingEntryDto>(entry);
            if (vehicleLookup.TryGetValue(entry.VehicleId, out var vin))
            {
                dto.VehicleVin = vin;
            }

            return dto;
        }).ToList();

        return await Task.FromResult(new PagedResult<ChargingEntryDto>
        {
            Items = dtoItems,
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        });
    }

    public async Task UpdateAsync(Guid userId, Guid id, ChargingEntryUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<ChargingEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null || entity.UserId != userId)
        {
            throw new KeyNotFoundException("Charging entry not found.");
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        repo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<ChargingEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null || entity.UserId != userId)
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
