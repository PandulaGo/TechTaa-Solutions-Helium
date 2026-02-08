using AutoMapper;
using Helium.Application.Models.ChargingEntries;
using Helium.Application.Models.FuelEntries;
using Helium.Application.Models.Maintenance;
using Helium.Application.Models.Users;
using Helium.Application.Models.Vehicles;
using Helium.Domain.Entities;

namespace Helium.Application.Mapping;

public class ApplicationMappingProfile : Profile
{
    public ApplicationMappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<Vehicle, VehicleDto>().ReverseMap();
        CreateMap<VehicleCreateDto, Vehicle>();
        CreateMap<VehicleUpdateDto, Vehicle>();

        CreateMap<FuelEntry, FuelEntryDto>().ReverseMap();
        CreateMap<FuelEntryCreateDto, FuelEntry>();
        CreateMap<FuelEntryUpdateDto, FuelEntry>();

        CreateMap<ChargingEntry, ChargingEntryDto>().ReverseMap();
        CreateMap<ChargingEntryCreateDto, ChargingEntry>();
        CreateMap<ChargingEntryUpdateDto, ChargingEntry>();

        CreateMap<MaintenanceReminder, MaintenanceReminderDto>().ReverseMap();
        CreateMap<MaintenanceRecord, MaintenanceRecordDto>().ReverseMap();
        CreateMap<MaintenanceRecordCreateDto, MaintenanceRecord>();
        CreateMap<MaintenanceRecordUpdateDto, MaintenanceRecord>();
    }
}
