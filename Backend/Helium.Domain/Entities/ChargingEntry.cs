using Helium.Domain.Common;

namespace Helium.Domain.Entities;

public class ChargingEntry : EntityBase
{
    public Guid UserId { get; set; }
    public Guid VehicleId { get; set; }
    public DateOnly Date { get; set; }
    public int OdometerReadingKm { get; set; }
    public decimal KwhUsed { get; set; }
    public decimal Cost { get; set; }
    public string ChargingLocation { get; set; } = string.Empty;

    public Vehicle? Vehicle { get; set; }
    public User? User { get; set; }
}
