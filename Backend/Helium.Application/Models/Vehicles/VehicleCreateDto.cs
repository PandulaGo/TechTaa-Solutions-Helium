using Helium.Domain.Enums;

namespace Helium.Application.Models.Vehicles;

public class VehicleCreateDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int? Year { get; set; }
    public VehicleType Type { get; set; }
    public string? Vin { get; set; }
}
