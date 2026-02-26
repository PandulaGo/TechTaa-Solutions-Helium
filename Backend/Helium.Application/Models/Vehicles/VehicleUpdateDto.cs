using Helium.Domain.Enums;

namespace Helium.Application.Models.Vehicles;

public class VehicleUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int? Year { get; set; }
    public PowertrainType PowertrainType { get; set; }
    public VehicleBodyType BodyType { get; set; }
    public string? Vin { get; set; }
}
