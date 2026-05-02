using AutoMapper;
using System.Collections.Generic;
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
        var vehicle = await _unitOfWork.Repository<Vehicle>().GetByIdAsync(dto.VehicleId, cancellationToken);
        if (vehicle is null || vehicle.UserId != dto.UserId)
        {
            throw new UnauthorizedAccessException("You do not have access to this vehicle.");
        }

        var entity = _mapper.Map<FuelEntry>(dto);
        entity.Id = Guid.NewGuid();
        entity.UserId = dto.UserId;

        await _unitOfWork.Repository<FuelEntry>().AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<FuelEntryDto>(entity);
    }

    public async Task<FuelEntryDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.Repository<FuelEntry>().GetByIdAsync(id, cancellationToken);
        if (entity is null || entity.UserId != userId)
        {
            return null;
        }

        return _mapper.Map<FuelEntryDto>(entity);
    }

    public async Task<PagedResult<FuelEntryDto>> GetPagedAsync(Guid userId, Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var fuelQuery = _unitOfWork.Repository<FuelEntry>()
            .Query()
            .Where(f => f.UserId == userId);

        if (vehicleId.HasValue && vehicleId.Value != Guid.Empty)
        {
            var id = vehicleId.Value;
            fuelQuery = fuelQuery.Where(f => f.VehicleId == id);
        }

        fuelQuery = ApplySorting(fuelQuery, query);
        var paged = fuelQuery.ToPagedResult(query);

        var vehicleLookup = new Dictionary<Guid, string?>();
        var vehicleIds = paged.Items.Select(f => f.VehicleId).Distinct().ToList();
        if (vehicleIds.Count > 0)
        {
            vehicleLookup = _unitOfWork.Repository<Vehicle>().Query()
                .Where(v => vehicleIds.Contains(v.Id))
                .Select(v => new { v.Id, v.Vin })
                .ToDictionary(v => v.Id, v => v.Vin);
        }

        var dtoItems = paged.Items.Select(entry =>
        {
            var dto = _mapper.Map<FuelEntryDto>(entry);
            if (vehicleLookup.TryGetValue(entry.VehicleId, out var vin))
            {
                dto.VehicleVin = vin;
            }

            return dto;
        }).ToList();

        return await Task.FromResult(new PagedResult<FuelEntryDto>
        {
            Items = dtoItems,
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        });
    }

    public async Task UpdateAsync(Guid userId, Guid id, FuelEntryUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<FuelEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null || entity.UserId != userId)
        {
            throw new KeyNotFoundException("Fuel entry not found.");
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        repo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<FuelEntry>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null || entity.UserId != userId)
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
