using AutoMapper;
using System.Collections.Generic;
using Helium.Application.Common.Extensions;
using Helium.Application.Common.Models;
using Helium.Application.Interfaces.Persistence;
using Helium.Application.Interfaces.Services;
using Helium.Application.Models.Maintenance;
using Helium.Domain.Entities;
using Helium.Domain.Enums;

namespace Helium.Application.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public MaintenanceService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<MaintenanceRecordDto> CreateAsync(MaintenanceRecordCreateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = _mapper.Map<MaintenanceRecord>(dto);
        entity.Id = Guid.NewGuid();

        if (dto.Reminder is not null)
        {
            entity.Reminder = CreateOrUpdateReminder(null, dto.Reminder, entity);
        }

        await _unitOfWork.Repository<MaintenanceRecord>().AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<MaintenanceRecordDto>(entity);
    }

    public async Task<MaintenanceRecordDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _unitOfWork.Repository<MaintenanceRecord>().GetByIdAsync(id, cancellationToken);
        return entity is null ? null : _mapper.Map<MaintenanceRecordDto>(entity);
    }

    public async Task<PagedResult<MaintenanceRecordDto>> GetPagedAsync(Guid? vehicleId, PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var recordQuery = _unitOfWork.Repository<MaintenanceRecord>()
            .Query();

        if (vehicleId.HasValue && vehicleId.Value != Guid.Empty)
        {
            var id = vehicleId.Value;
            recordQuery = recordQuery.Where(r => r.VehicleId == id);
        }

        recordQuery = ApplySorting(recordQuery, query);
        var paged = recordQuery.ToPagedResult(query);

        var recordIds = paged.Items.Select(r => r.Id).ToList();
        var reminderLookup = new Dictionary<Guid, MaintenanceReminderDto>();
        var vehicleLookup = new Dictionary<Guid, string?>();

        if (recordIds.Count > 0)
        {
            var reminders = _unitOfWork.Repository<MaintenanceReminder>().Query()
                .Where(r => recordIds.Contains(r.MaintenanceRecordId))
                .ToList();

            reminderLookup = reminders.ToDictionary(r => r.MaintenanceRecordId, r => _mapper.Map<MaintenanceReminderDto>(r));
        }

        var vehicleIds = paged.Items.Select(r => r.VehicleId).Distinct().ToList();
        if (vehicleIds.Count > 0)
        {
            vehicleLookup = _unitOfWork.Repository<Vehicle>().Query()
                .Where(v => vehicleIds.Contains(v.Id))
                .Select(v => new { v.Id, v.Vin })
                .ToDictionary(v => v.Id, v => v.Vin);
        }

        var dtoItems = paged.Items
            .Select(record =>
            {
                var dto = _mapper.Map<MaintenanceRecordDto>(record);
                if (reminderLookup.TryGetValue(record.Id, out var reminderDto))
                {
                    dto.Reminder = reminderDto;
                }
                if (vehicleLookup.TryGetValue(record.VehicleId, out var vin))
                {
                    dto.VehicleVin = vin;
                }

                return dto;
            })
            .ToList();

        return await Task.FromResult(new PagedResult<MaintenanceRecordDto>
        {
            Items = dtoItems,
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        });
    }

    public async Task UpdateAsync(Guid id, MaintenanceRecordUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<MaintenanceRecord>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException("Maintenance record not found.");
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        if (dto.Reminder is not null)
        {
            entity.Reminder = CreateOrUpdateReminder(entity.Reminder, dto.Reminder, entity);
        }
        else if (entity.Reminder is not null)
        {
            entity.Reminder = null;
        }

        repo.Update(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<MaintenanceRecord>();
        var entity = await repo.GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return;
        }

        repo.Remove(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MaintenanceRecordDto>> GetDueRemindersAsync(DateOnly asOfDate, CancellationToken cancellationToken = default)
    {
        var records = _unitOfWork.Repository<MaintenanceRecord>().Query().Where(r => r.Reminder != null).ToList();
        var fuelEntries = _unitOfWork.Repository<FuelEntry>().Query().ToList();
        var chargingEntries = _unitOfWork.Repository<ChargingEntry>().Query().ToList();
        var maintenanceRecords = _unitOfWork.Repository<MaintenanceRecord>().Query().ToList();

        var due = new List<MaintenanceRecord>();

        foreach (var record in records)
        {
            var reminder = record.Reminder;
            if (reminder is null)
            {
                continue;
            }

            var latestOdometer = GetLatestOdometer(record.VehicleId, fuelEntries, chargingEntries, maintenanceRecords);

            var isDueByDate = reminder.IntervalType == ReminderIntervalType.Time &&
                              reminder.NextDueDate is not null &&
                              reminder.NextDueDate.Value <= asOfDate;

            var isDueByMileage = reminder.IntervalType == ReminderIntervalType.Mileage &&
                                 reminder.NextDueMileageKm is not null &&
                                 latestOdometer >= reminder.NextDueMileageKm.Value;

            if (isDueByDate || isDueByMileage)
            {
                due.Add(record);
            }
        }

        return await Task.FromResult(due.Select(_mapper.Map<MaintenanceRecordDto>).ToList());
    }

    private static MaintenanceReminder CreateOrUpdateReminder(MaintenanceReminder? existing, MaintenanceReminderDto dto, MaintenanceRecord record)
    {
        var reminder = existing ?? new MaintenanceReminder { Id = Guid.NewGuid(), MaintenanceRecordId = record.Id };

        reminder.IntervalType = dto.IntervalType;
        reminder.IntervalValue = dto.IntervalValue;

        if (dto.IntervalType == ReminderIntervalType.Time)
        {
            reminder.NextDueDate = record.ServiceDate.AddDays(dto.IntervalValue);
            reminder.NextDueMileageKm = null;
        }
        else
        {
            reminder.NextDueMileageKm = record.OdometerReadingKm + dto.IntervalValue;
            reminder.NextDueDate = null;
        }

        return reminder;
    }

    private static int GetLatestOdometer(Guid vehicleId, IReadOnlyList<FuelEntry> fuels, IReadOnlyList<ChargingEntry> charges, IReadOnlyList<MaintenanceRecord> records)
    {
        var maxFuel = fuels.Where(f => f.VehicleId == vehicleId).Select(f => f.OdometerReadingKm).DefaultIfEmpty(0).Max();
        var maxCharge = charges.Where(c => c.VehicleId == vehicleId).Select(c => c.OdometerReadingKm).DefaultIfEmpty(0).Max();
        var maxMaintenance = records.Where(r => r.VehicleId == vehicleId).Select(r => r.OdometerReadingKm).DefaultIfEmpty(0).Max();

        return Math.Max(maxFuel, Math.Max(maxCharge, maxMaintenance));
    }

    private static IQueryable<MaintenanceRecord> ApplySorting(IQueryable<MaintenanceRecord> query, PaginationQuery pagination)
    {
        var sortBy = pagination.SortBy?.ToLowerInvariant();
        var desc = pagination.SortDirection == SortDirection.Desc;

        return sortBy switch
        {
            "date" => desc ? query.OrderByDescending(r => r.ServiceDate) : query.OrderBy(r => r.ServiceDate),
            "odometer" => desc ? query.OrderByDescending(r => r.OdometerReadingKm) : query.OrderBy(r => r.OdometerReadingKm),
            _ => desc ? query.OrderByDescending(r => r.ServiceDate) : query.OrderBy(r => r.ServiceDate)
        };
    }
}
