using Helium.Domain.Common;
using Helium.Domain.Enums;

namespace Helium.Domain.Entities;

public class Vehicle : EntityBase
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int? Year { get; set; }
    public VehicleType Type { get; set; }
    public string? Vin { get; set; }

    public User? User { get; set; }
    public ICollection<FuelEntry> FuelEntries { get; set; } = new List<FuelEntry>();
    public ICollection<ChargingEntry> ChargingEntries { get; set; } = new List<ChargingEntry>();
    public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();
}
